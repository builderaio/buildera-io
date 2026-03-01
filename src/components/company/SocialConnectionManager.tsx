import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
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
  Info,
  HelpCircle
} from "lucide-react";
import { SocialURLHelpDialog } from "./SocialURLHelpDialog";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaYoutube, FaXTwitter, FaPinterest } from 'react-icons/fa6';
import { SiThreads } from 'react-icons/si';

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
  facebook: { name: 'Facebook', Icon: FaFacebook, color: 'bg-blue-600', urlField: 'facebook_url' },
  instagram: { name: 'Instagram', Icon: FaInstagram, color: 'bg-pink-600', urlField: 'instagram_url' },
  linkedin: { name: 'LinkedIn', Icon: FaLinkedin, color: 'bg-blue-700', urlField: 'linkedin_url' },
  tiktok: { name: 'TikTok', Icon: FaTiktok, color: 'bg-black', urlField: 'tiktok_url' },
  youtube: { name: 'YouTube', Icon: FaYoutube, color: 'bg-red-600', urlField: 'youtube_url' },
  twitter: { name: 'X (Twitter)', Icon: FaXTwitter, color: 'bg-gray-900', urlField: 'twitter_url' },
  threads: { name: 'Threads', Icon: SiThreads, color: 'bg-gray-800', urlField: null },
  pinterest: { name: 'Pinterest', Icon: FaPinterest, color: 'bg-red-700', urlField: null },
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
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
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

  const initializeProfile = async (): Promise<string | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'init_profile', data: {} }
      });

      if (error) throw error as any;

      // Handle structured error responses (e.g., profile limit)
      if (data && !data.success && data.error === 'profile_limit_reached') {
        toast({
          title: "⚠️ Límite de perfiles alcanzado",
          description: data.message || "Actualiza tu plan de Upload-Post para continuar.",
          variant: "destructive"
        });
        return null;
      }

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
      // Try to extract the response body for more details
      let errorMsg = error?.message || '';
      try {
        if (error?.context?.body) {
          const body = await error.context.body.json?.() ?? error.context.body;
          errorMsg = typeof body === 'string' ? body : JSON.stringify(body);
        }
      } catch { /* ignore parse errors */ }

      if (errorMsg.includes('limit') || errorMsg.includes('403') || errorMsg.includes('reached the limit')) {
        toast({
          title: "⚠️ Límite de perfiles alcanzado",
          description: "Has alcanzado el límite de perfiles en tu plan de Upload-Post. Actualiza tu plan para continuar.",
          variant: "destructive"
        });
      } else if (errorMsg.includes('401') || errorMsg.includes('API Key')) {
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
    console.log('🔗 [SocialConnectionManager] startConnectionFlow iniciado');

    // Abrir popup inmediatamente por gesto del usuario para evitar bloqueadores
    const popupWindow = window.open(
      'about:blank',
      'upload-post-connection',
      'width=800,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popupWindow) {
      toast({
        title: "Popup bloqueado",
        description: "Tu navegador bloqueó la ventana emergente. Permite ventanas emergentes para este sitio e intenta de nuevo.",
        variant: "destructive"
      });
      return;
    }

    popupWindow.document.title = 'Conectando redes...';
    popupWindow.document.body.innerHTML = '<div style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">Preparando conexión segura...</div>';
    setConnectionWindow(popupWindow);

    try {
      setConnecting(true);

      let username = companyUsername;
      console.log('📝 [SocialConnectionManager] Username actual:', username);
      
      if (!username) {
        console.log('⚠️ [SocialConnectionManager] No hay username, inicializando perfil...');
        toast({
          title: "Preparando perfil",
          description: "Inicializando perfil automáticamente...",
        });
        const resolved = await initializeProfile();
        username = resolved || '';
        console.log('📝 [SocialConnectionManager] Username resuelto:', username);
        if (!username) {
          popupWindow.close();
          setConnecting(false);
          return;
        }
      }

      const attemptGenerate = async () => {
        console.log('🎯 [SocialConnectionManager] Intentando generar JWT...');
        const { data, error } = await supabase.functions.invoke('upload-post-manager', {
          body: {
            action: 'generate_jwt',
                data: {
                  companyUsername: username,
                  redirectUrl: `${window.location.origin}/marketing-hub/connections/callback?origin=${window.location.search.includes('activation-wizard') ? 'activation-wizard' : 'marketing-hub'}`,
                  platforms: ['tiktok', 'instagram', 'linkedin', 'facebook', 'youtube', 'twitter']
                }
          }
        });
        if (error) {
          console.error('❌ [SocialConnectionManager] Error generando JWT:', error);
          throw error as any;
        }
        console.log('✅ [SocialConnectionManager] JWT generado exitosamente:', data);
        return data;
      };

      let data = await attemptGenerate().catch(async (err: any) => {
        const msg = String(err?.message || '');
        console.log('⚠️ [SocialConnectionManager] Error en attemptGenerate:', msg);
        if (msg.includes('400') || msg.includes('404')) {
          console.log('🔄 [SocialConnectionManager] Reintentando tras inicializar perfil...');
          await initializeProfile();
          return await attemptGenerate();
        }
        throw err;
      });

      console.log('📋 [SocialConnectionManager] Datos recibidos:', data);
      
      if (data?.access_url) {
        console.log('🌐 [SocialConnectionManager] Navegando popup con URL:', data.access_url);
        popupWindow.location.href = data.access_url;
        popupWindow.focus();

        toast({
          title: "🔗 Conectando redes sociales",
          description: "Complete el proceso en la ventana emergente",
        });
      } else {
        console.error('❌ [SocialConnectionManager] No se recibió access_url en la respuesta');
        popupWindow.close();
        toast({
          title: "Error",
          description: "No se recibió URL de conexión del servidor",
          variant: "destructive"
        });
        setConnecting(false);
      }
    } catch (error) {
      console.error('❌ [SocialConnectionManager] Error en startConnectionFlow:', error);
      popupWindow.close();
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

  const extractPlatformUsername = (platform: string, url: string): string | null => {
    if (!url) return null;
    try {
      const cleaned = url.trim().replace(/\/+$/, '');
      switch (platform) {
        case 'linkedin': {
          // https://linkedin.com/company/iddeo or https://linkedin.com/in/username
          const match = cleaned.match(/linkedin\.com\/(company|in)\/([^/?#]+)/i);
          return match ? match[2] : null;
        }
        case 'instagram': {
          // https://instagram.com/username
          const match = cleaned.match(/instagram\.com\/([^/?#]+)/i);
          return match && match[1] !== 'p' ? match[1] : null;
        }
        case 'facebook': {
          // https://facebook.com/pagename
          const match = cleaned.match(/facebook\.com\/([^/?#]+)/i);
          return match && !['profile.php', 'pages', 'groups'].includes(match[1]) ? match[1] : null;
        }
        case 'tiktok': {
          // https://tiktok.com/@username
          const match = cleaned.match(/tiktok\.com\/@?([^/?#]+)/i);
          return match ? match[1].replace(/^@/, '') : null;
        }
        case 'youtube': {
          const match = cleaned.match(/youtube\.com\/(@?[^/?#]+)/i);
          return match ? match[1] : null;
        }
        case 'twitter': {
          const match = cleaned.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
          return match ? match[1] : null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  };

  const saveUrl = async (platform: string) => {
    try {
      if (!companyData?.id) return;
      
      const config = platformConfig[platform as keyof typeof platformConfig];
      if (!config.urlField) return;

      const url = urlValues[platform] || '';

      // Extract username from URL
      const extractedUsername = extractPlatformUsername(platform, url);

      // Save URL to companies table
      const { error } = await supabase
        .from('companies')
        .update({ [config.urlField]: url || null })
        .eq('id', companyData.id);

      if (error) throw error;

      // Update platform_username in social_accounts if we have a connected account
      if (extractedUsername && userId) {
        const { error: updateError } = await supabase
          .from('social_accounts')
          .update({ platform_username: extractedUsername })
          .eq('user_id', userId)
          .eq('platform', platform);

        if (updateError) {
          console.warn('Could not update platform_username:', updateError);
        } else {
          console.log(`✅ Updated platform_username for ${platform}: ${extractedUsername}`);
        }
      }

      setEditingUrl(null);
      await Promise.all([loadCompanyData(), loadSocialAccounts()]);
      
      toast({
        title: "✅ URL actualizada",
        description: extractedUsername 
          ? `URL de ${config.name} guardada. Usuario detectado: ${extractedUsername}`
          : `URL de ${config.name} guardada correctamente`,
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
  const connectedWithoutUsername = socialAccounts.filter(
    acc => acc.is_connected && acc.platform !== 'upload_post_profile' && !acc.platform_username
  );
  // Setup is complete when all connected accounts have platform_username (auto-synced from Upload Post API)
  const hasCompleteSetup = connectedCount > 0 && connectedWithoutUsername.length === 0;

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
                {connectedCount}/{totalPlatforms} plataformas conectadas • {configuredUrlCount}/{totalPlatforms} URLs configuradas
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
                onClick={() => setShowConnectionDialog(true)}
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

      {/* Auto-sync info banner - only show if connected accounts missing username */}
      {connectedWithoutUsername.length > 0 && (
        <Alert className="border-amber-500/30 bg-amber-500/10">
          <Info className="w-4 h-4 text-amber-500" />
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-amber-500">
                🔄 Sincronizando nombres de usuario...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {`Las plataformas ${connectedWithoutUsername.map(a => {
                    const cfg = platformConfig[a.platform as keyof typeof platformConfig];
                    return cfg?.name || a.platform;
                  }).join(', ')} aún no tienen nombre de usuario. Pulsa "Actualizar" para sincronizar desde Upload Post, o ingresa la URL del perfil manualmente.`}
              </p>
            </div>
            <Button
              onClick={refreshConnections}
              variant="outline"
              size="sm"
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status - Single Column Bars */}
      <div className="space-y-3">
        {Object.entries(platformConfig).map(([platform, config]) => {
          const isConnected = getConnectionStatus(platform);
          const accountInfo = getAccountInfo(platform);
          const hasUrl = urlValues[platform] && urlValues[platform].trim() !== '';
          const hasPlatformUsername = !!accountInfo?.platform_username;

          return (
            <Card key={platform} className={cn(
              "relative overflow-hidden transition-all duration-200",
              isConnected
                ? hasPlatformUsername
                  ? "border-emerald-500/30"
                  : "border-amber-500/30"
                : "border-border/60 hover:border-primary/30"
            )}>
              {/* Left accent bar */}
              <div className={cn(
                "absolute top-0 left-0 bottom-0 w-1",
                isConnected
                  ? hasPlatformUsername ? "bg-emerald-500" : "bg-amber-500"
                  : "bg-muted-foreground/20"
              )} />

              <CardContent className="p-4 pl-5">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-md",
                    config.color
                  )}>
                    <config.Icon />
                  </div>

                  {/* Name + Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-foreground">{config.name}</h4>
                      {/* Status badge */}
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                        isConnected
                          ? hasPlatformUsername
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted/60 text-muted-foreground"
                      )}>
                        {isConnected ? (
                          hasPlatformUsername ? (
                            <><CheckCircle2 className="w-3 h-3" /> @{accountInfo?.platform_username}</>
                          ) : (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Sincronizando</>
                          )
                        ) : (
                          <><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> No conectado</>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {platform === 'facebook' && accountInfo?.facebook_page_id
                        ? `Página: ${accountInfo.metadata?.selected_page_name || accountInfo.platform_display_name || accountInfo.facebook_page_id}`
                        : platform === 'linkedin' && accountInfo?.linkedin_page_id
                        ? `Página: ${accountInfo.metadata?.selected_page_name || accountInfo.platform_display_name || accountInfo.linkedin_page_id}`
                        : accountInfo?.platform_display_name || (hasUrl ? urlValues[platform] : 'Sin conexión')}
                    </p>
                  </div>

                  {/* URL Section - inline */}
                  {config.urlField && (
                    <div className="flex items-center gap-2 shrink-0">
                      {editingUrl === platform ? (
                        <div className="flex gap-1 w-64">
                          <Input
                            value={urlValues[platform] || ''}
                            onChange={(e) => setUrlValues(prev => ({ ...prev, [platform]: e.target.value }))}
                            placeholder={
                              platform === 'linkedin' ? 'linkedin.com/company/...' :
                              platform === 'instagram' ? 'instagram.com/...' :
                              platform === 'facebook' ? 'facebook.com/...' :
                              platform === 'tiktok' ? 'tiktok.com/@...' :
                              `URL de ${config.name}`
                            }
                            className="text-xs h-8"
                            autoFocus
                          />
                          <Button onClick={() => saveUrl(platform)} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <Save className="w-3.5 h-3.5 text-green-500" />
                          </Button>
                          <Button onClick={() => setEditingUrl(null)} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-xs max-w-[180px] truncate px-2 py-1 rounded-md",
                            hasUrl ? "text-foreground bg-muted/50" : "text-muted-foreground italic bg-muted/30"
                          )}>
                            {hasUrl ? urlValues[platform] : 'Sin URL'}
                          </span>
                          <Button onClick={() => setEditingUrl(platform)} variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                          {hasUrl && (
                            <Button onClick={() => window.open(urlValues[platform], '_blank')} variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      <SocialURLHelpDialog>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                          <HelpCircle className="w-3 h-3" />
                        </Button>
                      </SocialURLHelpDialog>
                    </div>
                  )}

                  {/* Page selection buttons */}
                  {platform === 'facebook' && isConnected && (
                    <Button onClick={handleFacebookPageSelection} variant="outline" size="sm" className="text-xs h-8 border-dashed shrink-0">
                      <Settings className="w-3 h-3 mr-1.5" /> Seleccionar Página
                    </Button>
                  )}
                  {platform === 'linkedin' && isConnected && (
                    <Button onClick={handleLinkedInPageSelection} variant="outline" size="sm" className="text-xs h-8 border-dashed shrink-0">
                      <Settings className="w-3 h-3 mr-1.5" /> Seleccionar Página
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      {/* Progress and Next Steps */}
      {connectedCount > 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Configuración Completada</h3>
                <p className="text-sm text-muted-foreground">
                  {connectedCount} red{connectedCount !== 1 ? 'es' : ''} conectada{connectedCount !== 1 ? 's' : ''} • {configuredUrlCount} URL{configuredUrlCount !== 1 ? 's' : ''} configurada{configuredUrlCount !== 1 ? 's' : ''}
                </p>
              </div>
              {hasCompleteSetup && (
                <Badge className="bg-green-500/15 text-green-500 border-green-500/30">
                  ✅ Listo para continuar
                </Badge>
              )}
            </div>
            
            {!hasCompleteSetup && (
              <Alert className="mb-4">
                <AlertDescription>
                  {connectedCount === 0 
                    ? "Conecte al menos una red social para continuar."
                    : "Algunos perfiles aún no tienen nombre de usuario sincronizado. Pulse 'Actualizar' para obtenerlos desde Upload Post."
                  }
                </AlertDescription>
              </Alert>
            )}

            {hasCompleteSetup && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.href = '/company-dashboard?view=marketing-hub'}
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
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Network className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aún no hay redes conectadas</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Conecte sus redes sociales para comenzar a publicar contenido automáticamente desde el Marketing Hub.
            </p>
            <Button
              onClick={startConnectionFlow}
              disabled={connecting}
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

      {/* Connection Platform Selection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar Redes Sociales</DialogTitle>
            <DialogDescription>
              Conecta tus redes sociales para empezar a gestionar tu contenido desde un solo lugar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Se abrirá una ventana para conectar tus redes sociales de forma segura a través de Upload-Post.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConnectionDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setShowConnectionDialog(false);
                  startConnectionFlow();
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Network className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};