import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EraCoachMark from "@/components/ui/era-coach-mark";
import { 
  Network, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Settings,
  Edit,
  Save,
  Info
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
  linkedin_page_id?: string;
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
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600', urlField: 'facebook_url' },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-600', urlField: 'instagram_url' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', urlField: 'linkedin_url' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black', urlField: 'tiktok_url' },
  youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-600', urlField: 'youtube_url' },
  twitter: { name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900', urlField: 'twitter_url' },
  threads: { name: 'Threads', icon: '🧵', color: 'bg-gray-800', urlField: null },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'bg-red-700', urlField: null },
};

export const SocialConnectionManager = ({ profile, onConnectionsUpdated }: SocialConnectionManagerProps) => {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [companyUsername, setCompanyUsername] = useState<string>('');
  const [showFacebookPages, setShowFacebookPages] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [linkedinPages, setLinkedinPages] = useState<any[]>([]);
  const [showLinkedinPages, setShowLinkedinPages] = useState(false);
  const [selectedLinkedinPage, setSelectedLinkedinPage] = useState('');
  const [connectionWindow, setConnectionWindow] = useState<Window | null>(null);
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [urlValues, setUrlValues] = useState<Record<string, string>>({});
  const [showCoachMark, setShowCoachMark] = useState(false);
  const [newConnectedPlatforms, setNewConnectedPlatforms] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Resolver userId desde el perfil o, si no existe, desde Supabase Auth
  useEffect(() => {
    let active = true;
    const resolveUser = async () => {
      try {
        if (profile?.user_id) {
          if (active) setUserId(profile.user_id);
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (active) setUserId(user?.id ?? null);
      } catch (e) {
        console.warn('No se pudo resolver userId:', e);
      }
    };
    resolveUser();
    return () => { active = false; };
  }, [profile?.user_id]);

  // Cargar conexiones cuando tengamos userId
  useEffect(() => {
    if (!userId) return;
    loadSocialAccounts();
    initializeProfile();
    loadCompanyData();
  }, [userId]);

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
      if (!userId) return;
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('platform', { ascending: true });

      if (error) throw error;

      const list = (data || []) as any[];
      console.log('📥 social_accounts loaded:', list);
      
      // Detectar nuevas conexiones antes de actualizar
      if (socialAccounts.length > 0) {
        detectNewConnections(list);
      }
      
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
            .eq('user_id', userId)
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

  // Detectar nuevas conexiones para mostrar coachmarks
  const detectNewConnections = (newAccounts: SocialAccount[]) => {
    const currentConnected = new Set(
      socialAccounts.filter(acc => acc.is_connected).map(acc => acc.platform)
    );
    const newConnected = new Set(
      newAccounts.filter(acc => acc.is_connected).map(acc => acc.platform)
    );
    
    const newPlatforms = new Set<string>();
    newConnected.forEach(platform => {
      if (!currentConnected.has(platform) && platform !== 'upload_post_profile') {
        newPlatforms.add(platform);
      }
    });
    
    if (newPlatforms.size > 0) {
      setNewConnectedPlatforms(newPlatforms);
      setShowCoachMark(true);
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
        if (!newWindow || newWindow.closed) {
          // Popup bloqueado: fallback en la misma pestaña
          setConnecting(false);
          window.location.href = data.access_url;
          return;
        }
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
  const loadCompanyData = async () => {
    try {
      if (!userId) return;
      
      // Obtener la empresa principal del usuario
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select(`
          companies (
            id, name, facebook_url, instagram_url, linkedin_url, 
            tiktok_url, youtube_url, twitter_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (memberError || !memberData) {
        console.warn('No se encontró empresa principal:', memberError);
        return;
      }

      const company = memberData.companies;
      setCompanyData(company);
      
      // Inicializar valores de URL
      const initialUrls: Record<string, string> = {};
      Object.entries(platformConfig).forEach(([platform, config]) => {
        if (config.urlField) {
          initialUrls[platform] = company[config.urlField] || '';
        }
      });
      setUrlValues(initialUrls);
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const saveUrl = async (platform: string) => {
    try {
      if (!companyData?.id) return;
      
      const config = platformConfig[platform as keyof typeof platformConfig];
      if (!config.urlField) return;

      const { error } = await supabase
        .from('companies')
        .update({ [config.urlField]: urlValues[platform] || null })
        .eq('id', companyData.id);

      if (error) throw error;

      setEditingUrl(null);
      await loadCompanyData();
      
      toast({
        title: "✅ URL actualizada",
        description: `URL de ${config.name} guardada correctamente`,
      });
    } catch (error) {
      console.error('Error saving URL:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la URL",
        variant: "destructive"
      });
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
      // Encontrar el nombre de la página seleccionada
      const selectedPage = facebookPages.find(page => page.id === selectedFacebookPage);
      
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'update_facebook_page', 
          data: { 
            companyUsername, 
            facebookPageId: selectedFacebookPage,
            facebookPageName: selectedPage?.name
          } 
        }
      });

      if (error) throw error;

      setShowFacebookPages(false);
      await loadSocialAccounts();
      
      toast({
        title: "✅ Página seleccionada",
        description: `Página de Facebook "${selectedPage?.name}" configurada exitosamente`,
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

  const handleLinkedInPageSelection = async () => {
    if (!companyUsername) {
      toast({
        title: "Error",
        description: "No se encontró el perfil de empresa",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'get_linkedin_pages', 
          data: { companyUsername } 
        }
      });

      if (error) throw error;

      if (data?.pages) {
        setLinkedinPages(data.pages);
        setShowLinkedinPages(true);
      } else {
        toast({
          title: "Sin páginas",
          description: "No se encontraron páginas de LinkedIn disponibles",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading LinkedIn pages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las páginas de LinkedIn",
        variant: "destructive"
      });
    }
  };

  const selectLinkedInPage = async () => {
    if (!selectedLinkedinPage || !companyUsername) return;

    try {
      // Encontrar el nombre de la página seleccionada
      const selectedPage = linkedinPages.find(page => page.id === selectedLinkedinPage);
      
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'update_linkedin_page', 
          data: { 
            companyUsername, 
            linkedinPageId: selectedLinkedinPage,
            linkedinPageName: selectedPage?.name
          } 
        }
      });

      if (error) throw error;

      setShowLinkedinPages(false);
      await loadSocialAccounts();
      
      toast({
        title: "✅ Página seleccionada",
        description: `Página de LinkedIn "${selectedPage?.name}" configurada exitosamente`,
      });
    } catch (error) {
      console.error('Error selecting LinkedIn page:', error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar la página",
        variant: "destructive"
      });
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
  const configuredUrlCount = Object.values(urlValues).filter(url => url && url.trim() !== '').length;
  const hasCompleteSetup = connectedCount > 0 && configuredUrlCount > 0;

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
                {/* Coachmark para nuevas conexiones */}
                {newConnectedPlatforms.has(platform) && isConnected && (
                  <div className="absolute -top-2 -right-2 z-10 animate-pulse">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Info className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center text-white text-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{config.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {platform === 'facebook' && accountInfo?.facebook_page_id ? 
                          `Página: ${accountInfo.metadata?.selected_page_name || accountInfo.facebook_page_id}` :
                         platform === 'linkedin' && accountInfo?.linkedin_page_id ?
                          `Página: ${accountInfo.metadata?.selected_page_name || accountInfo.linkedin_page_id}` :
                         accountInfo?.platform_display_name || accountInfo?.platform_username || 'No conectado'}
                      </p>
                    </div>
                  </div>
                  
                  {isConnected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {/* Mensaje de coachmark para nuevas conexiones */}
                {newConnectedPlatforms.has(platform) && isConnected && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium text-primary">¡Red conectada exitosamente!</p>
                        <p className="text-muted-foreground mt-1">
                          Configure la URL del perfil abajo. Esto es esencial para el análisis estratégico de audiencias y contenido en el Hub de Marketing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
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
                
                {platform === 'linkedin' && isConnected && (
                  <Button
                    onClick={handleLinkedInPageSelection}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Seleccionar Página
                  </Button>
                )}

                {/* URL Configuration */}
                {config.urlField && (
                  <div className="mt-3 space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      URL del perfil
                    </Label>
                    {editingUrl === platform ? (
                      <div className="flex gap-1">
                        <Input
                          value={urlValues[platform] || ''}
                          onChange={(e) => setUrlValues(prev => ({ ...prev, [platform]: e.target.value }))}
                          placeholder={`URL de ${config.name}`}
                          className="text-xs"
                          size={1}
                        />
                        <Button
                          onClick={() => saveUrl(platform)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => setEditingUrl(null)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="text-xs text-muted-foreground flex-1 truncate">
                          {urlValues[platform] || 'No configurada'}
                        </div>
                        <Button
                          onClick={() => setEditingUrl(platform)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        {urlValues[platform] && (
                          <Button
                            onClick={() => window.open(urlValues[platform], '_blank')}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Progress and Next Steps */}
      {connectedCount > 0 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Configuración Completada</h3>
                <p className="text-sm text-muted-foreground">
                  {connectedCount} red{connectedCount !== 1 ? 'es' : ''} conectada{connectedCount !== 1 ? 's' : ''} • {configuredUrlCount} URL{configuredUrlCount !== 1 ? 's' : ''} configurada{configuredUrlCount !== 1 ? 's' : ''}
                </p>
              </div>
              {hasCompleteSetup && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  ✅ Listo para continuar
                </Badge>
              )}
            </div>
            
            {!hasCompleteSetup && (
              <Alert className="mb-4">
                <AlertDescription>
                  {connectedCount === 0 
                    ? "Conecte al menos una red social para continuar."
                    : "Configure las URLs de sus perfiles para completar la configuración."
                  }
                </AlertDescription>
              </Alert>
            )}

            {hasCompleteSetup && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.href = '/company-dashboard?view=marketing-hub'}
                  className="bg-primary hover:bg-primary/90"
                >
                  Ir al Marketing Hub
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/company-dashboard?view=marketing-hub&tab=analyze'}
                >
                  Analizar Audiencias
                </Button>
                <Button 
                  variant="outline"
                  onClick={refreshConnections}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Verificar Conexiones
                </Button>
              </div>
            )}
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

      {/* LinkedIn Pages Dialog */}
      <Dialog open={showLinkedinPages} onOpenChange={setShowLinkedinPages}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Página de LinkedIn</DialogTitle>
            <DialogDescription>
              Elija la página de LinkedIn que desea usar para publicar contenido.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select value={selectedLinkedinPage} onValueChange={setSelectedLinkedinPage}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar página..." />
              </SelectTrigger>
              <SelectContent>
                {linkedinPages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLinkedinPages(false)}>
                Cancelar
              </Button>
              <Button onClick={selectLinkedInPage} disabled={!selectedLinkedinPage}>
                Seleccionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coachmark para nuevas conexiones */}
      <EraCoachMark
        isOpen={showCoachMark}
        onClose={() => {
          setShowCoachMark(false);
          setNewConnectedPlatforms(new Set());
        }}
        userId={userId || ''}
      />

    </div>
  );
};