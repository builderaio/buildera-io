import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Network, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  Zap,
  AlertTriangle,
  RefreshCw,
  Settings,
  Play
} from "lucide-react";

interface SocialConnectionManagerProps {
  profile: any;
  onConnectionsUpdated?: () => void;
}

interface SocialAccount {
  id: string;
  platform: string;
  platform_username?: string;
  platform_display_name?: string;
  is_connected: boolean;
  facebook_page_id?: string;
  connected_at?: string;
  last_sync_at?: string;
  metadata?: any;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

const platformConfig = {
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black' },
  youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-600' },
  twitter: { name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
  threads: { name: 'Threads', icon: '🧵', color: 'bg-gray-800' },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'bg-red-700' },
};

export const SocialConnectionManager = ({ profile, onConnectionsUpdated }: SocialConnectionManagerProps) => {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [companyUsername, setCompanyUsername] = useState<string>('');
  const [showFacebookPages, setShowFacebookPages] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [connectionWindow, setConnectionWindow] = useState<Window | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSocialAccounts();
    initializeProfile();
  }, [profile?.user_id]);

  useEffect(() => {
    // Verificar si la ventana de conexión se cerró
    const checkWindowClosed = setInterval(() => {
      if (connectionWindow && connectionWindow.closed) {
        setConnecting(false);
        setConnectionWindow(null);
        refreshConnections();
        clearInterval(checkWindowClosed);
      }
    }, 1000);

    return () => clearInterval(checkWindowClosed);
  }, [connectionWindow]);

  const loadSocialAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('platform', { ascending: true });

      if (error) throw error;

      const list = (data || []) as any[];
      console.log('📥 social_accounts loaded:', list);
      setSocialAccounts(list);

      // Si no hay conexiones visibles, forzar una sincronización desde Upload-Post
      const hasConnected = list.some(acc => acc.is_connected && acc.platform !== 'upload_post_profile');
      if (!hasConnected && companyUsername) {
        try {
          await supabase.functions.invoke('upload-post-manager', {
            body: { action: 'get_connections', data: { companyUsername } }
          });
          const { data: refreshed } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', profile.user_id)
            .order('platform', { ascending: true });
          console.log('🔁 social_accounts refreshed:', refreshed);
          setSocialAccounts(refreshed || []);
        } catch (e) {
          console.warn('No se pudo forzar sincronización de conexiones:', e);
        }
      }
    } catch (error) {
      console.error('Error loading social accounts:', error);
    }
  };

  const initializeProfile = async (): Promise<string | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'init_profile', data: {} }
      });

      if (error) throw error as any;

      if (data?.success) {
        const resolvedUsername = (data as any).companyUsername as string | undefined;
        if (resolvedUsername) {
          setCompanyUsername(resolvedUsername);
        }
        
        if (!data.profileExists) {
          toast({
            title: "✅ Perfil Creado",
            description: "Su perfil de Upload-Post ha sido configurado exitosamente",
          });
        }
        // Sincronizar conexiones explícitamente y recargar
        if (resolvedUsername) {
          try {
            await supabase.functions.invoke('upload-post-manager', {
              body: { action: 'get_connections', data: { companyUsername: resolvedUsername } }
            });
          } catch (e) {
            console.warn('No se pudo sincronizar conexiones tras init_profile:', e);
          }
        }
        await loadSocialAccounts();
        return resolvedUsername ?? null;
      }
      return null;
    } catch (error: any) {
      console.error('Error initializing profile:', error);
      if (error?.message?.includes('401') || error?.message?.includes('API Key')) {
        toast({
          title: "⚠️ Configuración requerida",
          description: "Configure la API Key de Upload-Post para continuar",
          variant: "destructive"
        });
      }
      return null;
    } finally {
      setLoading(false);
    }
  };
  const startConnectionFlow = async () => {
    try {
      setConnecting(true);

      let username = companyUsername;
      if (!username) {
        toast({
          title: "Preparando perfil",
          description: "Inicializando perfil automáticamente...",
        });
        const resolved = await initializeProfile();
        username = resolved || '';
        if (!username) {
          setConnecting(false);
          return;
        }
      }

      const attemptGenerate = async () => {
        const { data, error } = await supabase.functions.invoke('upload-post-manager', {
          body: {
            action: 'generate_jwt',
                data: {
                  companyUsername: username,
                  redirectUrl: `${window.location.origin}/marketing-hub/connections/callback`,
                  platforms: ['tiktok', 'instagram', 'linkedin', 'facebook', 'youtube', 'twitter']
                }
          }
        });
        if (error) throw error as any;
        return data;
      };

      let data = await attemptGenerate().catch(async (err: any) => {
        const msg = String(err?.message || '');
        if (msg.includes('400') || msg.includes('404')) {
          await initializeProfile();
          return await attemptGenerate();
        }
        throw err;
      });

      if (data?.access_url) {
        const newWindow = window.open(
          data.access_url,
          'upload-post-connection',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );
        setConnectionWindow(newWindow);
        toast({
          title: "🔗 Conectando redes sociales",
          description: "Complete el proceso en la ventana emergente",
        });
      }
    } catch (error) {
      console.error('Error starting connection flow:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el flujo de conexión",
        variant: "destructive"
      });
      setConnecting(false);
    }
  };
  const refreshConnections = async () => {
    let username = companyUsername;
    if (!username) {
      const resolved = await initializeProfile();
      username = resolved || '';
      if (!username) return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_connections', data: { companyUsername: username } }
      });

      if (error) throw error;

      await loadSocialAccounts();
      
      toast({
        title: "🔄 Conexiones actualizadas",
        description: "Estado de redes sociales sincronizado",
      });

      onConnectionsUpdated?.();
    } catch (error) {
      console.error('Error refreshing connections:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleFacebookPageSelection = async () => {
    if (!companyUsername) return;

    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_facebook_pages', data: { companyUsername } }
      });

      if (error) throw error;

      if (data?.pages) {
        setFacebookPages(data.pages);
        setShowFacebookPages(true);
      } else {
        toast({
          title: "Sin páginas",
          description: "No se encontraron páginas de Facebook disponibles",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading Facebook pages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las páginas de Facebook",
        variant: "destructive"
      });
    }
  };

  const selectFacebookPage = async () => {
    if (!selectedFacebookPage || !companyUsername) return;

    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'update_facebook_page', 
          data: { companyUsername, facebookPageId: selectedFacebookPage } 
        }
      });

      if (error) throw error;

      setShowFacebookPages(false);
      await loadSocialAccounts();
      
      toast({
        title: "✅ Página seleccionada",
        description: "Página de Facebook configurada exitosamente",
      });
    } catch (error) {
      console.error('Error selecting Facebook page:', error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar la página",
        variant: "destructive"
      });
    }
  };

  const runSmokeTest = async () => {
    if (!companyUsername) return;

    try {
      setLoading(true);
      
      const connectedPlatforms = socialAccounts
        .filter(account => account.is_connected)
        .map(account => account.platform)
        .filter(platform => platform !== 'upload_post_profile');

      if (connectedPlatforms.length === 0) {
        toast({
          title: "Sin conexiones",
          description: "Conecte al menos una red social para hacer la prueba",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'smoke_test', 
          data: { companyUsername, platforms: connectedPlatforms } 
        }
      });

      if (error) throw error;

      toast({
        title: "🧪 Prueba programada",
        description: "Post de prueba programado para los próximos 10 minutos",
      });
    } catch (error) {
      console.error('Error running smoke test:', error);
      toast({
        title: "Error en la prueba",
        description: "No se pudo ejecutar la prueba de conexión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = (platform: string) => {
    const account = socialAccounts.find(acc => acc.platform === platform);
    return account?.is_connected || false;
  };

  const getAccountInfo = (platform: string) => {
    return socialAccounts.find(acc => acc.platform === platform);
  };

  const connectedCount = socialAccounts.filter(acc => acc.is_connected && acc.platform !== 'upload_post_profile').length;
  const totalPlatforms = Object.keys(platformConfig).length;

  if (loading && socialAccounts.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span>Inicializando conexiones sociales...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-6 h-6 text-primary" />
                Conexiones de Redes Sociales
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {connectedCount}/{totalPlatforms} plataformas conectadas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshConnections}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                onClick={startConnectionFlow}
                disabled={connecting || loading}
                className="bg-primary hover:bg-primary/90"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Network className="w-4 h-4 mr-2" />
                    Conectar Redes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(platformConfig).map(([platform, config]) => {
          const isConnected = getConnectionStatus(platform);
          const accountInfo = getAccountInfo(platform);
          
          return (
            <Card key={platform} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
              isConnected ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{config.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {accountInfo?.platform_display_name || accountInfo?.platform_username || 'No conectado'}
                      </p>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                <Badge 
                  variant={isConnected ? "default" : "secondary"}
                  className={`w-full justify-center ${
                    isConnected ? 'bg-green-100 text-green-700 border-green-200' : ''
                  }`}
                >
                  {isConnected ? 'Conectado' : 'No conectado'}
                </Badge>

                {platform === 'facebook' && isConnected && (
                  <Button
                    onClick={handleFacebookPageSelection}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Seleccionar Página
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      {connectedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Pruebas y Configuración
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Realice una prueba de conexión para verificar que las plataformas están funcionando correctamente.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={runSmokeTest}
              disabled={loading}
              className="w-full md:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              Ejecutar Prueba de Conexión
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {connectedCount === 0 && !loading && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aún no hay redes conectadas</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Conecte sus redes sociales para comenzar a publicar contenido automáticamente desde el Marketing Hub.
            </p>
            <Button
              onClick={startConnectionFlow}
              disabled={connecting}
              className="bg-primary hover:bg-primary/90"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Network className="w-4 h-4 mr-2" />
                  Conectar Redes Sociales
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Facebook Pages Dialog */}
      <Dialog open={showFacebookPages} onOpenChange={setShowFacebookPages}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Página de Facebook</DialogTitle>
            <DialogDescription>
              Elija la página de Facebook que desea usar para publicar contenido.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedFacebookPage} onValueChange={setSelectedFacebookPage}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar página..." />
              </SelectTrigger>
              <SelectContent>
                {facebookPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFacebookPages(false)}>
                Cancelar
              </Button>
              <Button onClick={selectFacebookPage} disabled={!selectedFacebookPage}>
                Seleccionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};