import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Instagram, Music, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MarketingHubProps {
  profile: any;
}

const MarketingHub = ({ profile }: MarketingHubProps) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialConnections, setSocialConnections] = useState({
    instagram: false,
    facebook: false,
    tiktok: false,
    linkedin: false
  });
  const { toast } = useToast();

  // Funciones específicas para cada red social
  const handleInstagramConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando Instagram Business...');
      
      toast({
        title: "Conectando Instagram Business",
        description: "Instagram Business requiere conectar Facebook primero...",
      });

      // Simular verificación de Facebook
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Redirecto a Facebook",
        description: "Abriendo ventana de autenticación de Facebook para Instagram Business",
      });

      await new Promise(resolve => setTimeout(resolve, 2500));

      // Simular éxito con datos específicos de Instagram
      const shouldSucceed = Math.random() > 0.15;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, instagram: true }));
        
        toast({
          title: "¡Instagram Business Conectado!",
          description: "Acceso completo a posts, stories, reels y métricas de audiencia.",
        });
      } else {
        throw new Error("Error de permisos de Instagram Business");
      }

    } catch (error: any) {
      toast({
        title: "Error Instagram Business",
        description: `${error.message || 'Verifique que tiene una cuenta business vinculada a Facebook'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando Facebook Business...');
      
      toast({
        title: "Conectando Facebook Business",
        description: "Verificando páginas empresariales disponibles...",
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular selección de página
      toast({
        title: "Seleccionar Página",
        description: "Seleccionando página empresarial principal",
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      const shouldSucceed = Math.random() > 0.1;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, facebook: true }));
        
        toast({
          title: "¡Facebook Business Conectado!",
          description: "Página empresarial vinculada. Acceso a posts, ads y métricas.",
        });
      } else {
        throw new Error("No se encontraron páginas empresariales");
      }

    } catch (error: any) {
      toast({
        title: "Error Facebook Business",
        description: `${error.message || 'Verifique que tiene páginas empresariales disponibles'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTikTokConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Conectando TikTok Business...');
      
      toast({
        title: "Conectando TikTok Business",
        description: "Abriendo TikTok Business Manager...",
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Autenticación TikTok",
        description: "Verificando cuenta empresarial y permisos de API",
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const shouldSucceed = Math.random() > 0.25;

      if (shouldSucceed) {
        setSocialConnections(prev => ({ ...prev, tiktok: true }));
        
        toast({
          title: "¡TikTok Business Conectado!",
          description: "Acceso a video uploads, analytics y campañas publicitarias.",
        });
      } else {
        throw new Error("Cuenta TikTok Business no verificada");
      }

    } catch (error: any) {
      toast({
        title: "Error TikTok Business",
        description: `${error.message || 'Verifique que tiene una cuenta TikTok Business activa'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInConnect = async () => {
    setLoading(true);
    try {
      console.log('🔗 Iniciando flujo OAuth LinkedIn Company...');
      
      // Validaciones previas
      if (!profile?.company_name) {
        throw new Error("Debe completar la información de la empresa antes de conectar LinkedIn");
      }

      // Mostrar toast inicial
      toast({
        title: "Conectando LinkedIn Company",
        description: "Redirigiendo a LinkedIn para autorización...",
      });

      // Configuración OAuth de LinkedIn - usar URL de producción
      const clientId = '78pxtzefworlny';
      const redirectUri = 'https://buildera.io/auth/linkedin/callback';
      const scopes = 'w_organization_social r_organization_social rw_company_admin';
      const state = Math.random().toString(36).substring(7);
      
      // Construir URL de OAuth
      const oauthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      oauthUrl.searchParams.append('response_type', 'code');
      oauthUrl.searchParams.append('client_id', clientId);
      oauthUrl.searchParams.append('redirect_uri', redirectUri);
      oauthUrl.searchParams.append('state', state);
      oauthUrl.searchParams.append('scope', scopes);

      console.log(`🔗 Redirigiendo a LinkedIn OAuth: ${oauthUrl.toString()}`);

      // Guardar estado para verificación posterior
      localStorage.setItem('linkedin_oauth_state', state);
      localStorage.setItem('linkedin_oauth_user_id', profile.user_id);

      // Redirigir a LinkedIn para autorización
      window.location.href = oauthUrl.toString();

    } catch (error: any) {
      console.error('❌ Error iniciando LinkedIn OAuth:', error);
      
      toast({
        title: "Error LinkedIn Company",
        description: error.message || 'Error iniciando autorización. Inténtelo de nuevo.',
        variant: "destructive",
      });
      
      setLoading(false);
    }
  };

  // Función genérica para manejar las conexiones
  const handleSocialConnect = async (platform: string) => {
    switch (platform) {
      case 'instagram':
        return handleInstagramConnect();
      case 'facebook':
        return handleFacebookConnect();
      case 'tiktok':
        return handleTikTokConnect();
      case 'linkedin':
        return handleLinkedInConnect();
      default:
        toast({
          title: "Error",
          description: "Plataforma no soportada",
          variant: "destructive",
        });
    }
  };

  const handleSocialDisconnect = async (platform: string) => {
    setSocialConnections(prev => ({
      ...prev,
      [platform]: false
    }));
    
    toast({
      title: "Desconectado",
      description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} desconectado del Marketing Hub`,
    });
  };

  const getConnectedPlatforms = () => {
    return Object.entries(socialConnections)
      .filter(([_, connected]) => connected)
      .map(([platform, _]) => platform);
  };

  const hasConnectedPlatforms = () => {
    return getConnectedPlatforms().length > 0;
  };

  const renderConnectionAlert = () => {
    if (hasConnectedPlatforms()) return null;

    return (
      <Alert className="mb-6">
        <AlertDescription>
          No tienes redes sociales conectadas. Conecta al menos una plataforma para acceder a todas las funcionalidades del Marketing Hub.
        </AlertDescription>
      </Alert>
    );
  };

  const renderSocialConnections = () => {
    const platforms = [
      { key: 'instagram', name: 'Instagram Business', icon: Instagram, color: 'bg-pink-600 hover:bg-pink-700' },
      { key: 'facebook', name: 'Facebook Business', icon: () => <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center"><span className="text-white font-bold text-xs">f</span></div>, color: 'bg-blue-600 hover:bg-blue-700' },
      { key: 'tiktok', name: 'TikTok Business', icon: Music, color: 'bg-black hover:bg-gray-800' },
      { key: 'linkedin', name: 'LinkedIn Company', icon: Linkedin, color: 'bg-blue-700 hover:bg-blue-800' }
    ];

    return (
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-lg">Conexiones de Redes Sociales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div key={platform.key} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <platform.icon className="w-6 h-6" />
                <div>
                  <span className="font-medium">{platform.name}</span>
                  {socialConnections[platform.key as keyof typeof socialConnections] && (
                    <Badge variant="secondary" className="ml-2 text-xs">Conectado</Badge>
                  )}
                </div>
              </div>
              {socialConnections[platform.key as keyof typeof socialConnections] ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSocialDisconnect(platform.key)}
                  disabled={loading}
                >
                  Desconectar
                </Button>
              ) : (
                <Button 
                  className={`text-white ${platform.color}`}
                  size="sm"
                  onClick={() => handleSocialConnect(platform.key)}
                  disabled={loading}
                >
                  {loading ? "Conectando..." : "Conectar"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlatformPerformance = () => {
    const connectedPlatforms = getConnectedPlatforms();
    
    if (connectedPlatforms.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Conecta tus redes sociales para ver métricas de rendimiento</p>
        </div>
      );
    }

    // Datos simulados de las cuentas business conectadas
    const platformData = {
      linkedin: {
        name: "LinkedIn Company",
        followers: "12,450",
        engagement: "4.2%",
        roi: "3.5x",
        leads: 45,
        recentPosts: [
          { content: "Innovación en tecnología sostenible", likes: 87, comments: 12, shares: 8, date: "2 días" },
          { content: "Nuevas oportunidades de crecimiento", likes: 156, comments: 23, shares: 15, date: "5 días" },
          { content: "Webinar: El futuro del trabajo remoto", likes: 234, comments: 41, shares: 28, date: "1 semana" }
        ],
        analytics: { impressions: "45,280", clicks: "1,890", conversions: 45 },
        color: "bg-[#0A66C2]"
      },
      instagram: {
        name: "Instagram Business",
        followers: "8,750",
        engagement: "6.8%",
        roi: "2.1x",
        leads: 28,
        recentPosts: [
          { content: "Detrás de escenas en nuestro laboratorio", likes: 324, comments: 45, shares: 12, date: "1 día" },
          { content: "Producto del mes: Innovación verde", likes: 267, comments: 34, shares: 18, date: "3 días" },
          { content: "Equipo trabajando en nuevas ideas", likes: 189, comments: 22, shares: 9, date: "6 días" }
        ],
        analytics: { impressions: "32,150", clicks: "2,180", conversions: 28 },
        color: "bg-gradient-to-r from-purple-500 to-pink-500"
      },
      facebook: {
        name: "Facebook Business",
        followers: "15,630",
        engagement: "3.1%",
        roi: "1.8x",
        leads: 16,
        recentPosts: [
          { content: "Evento virtual: Tendencias 2024", likes: 145, comments: 28, shares: 22, date: "1 día" },
          { content: "Testimonios de nuestros clientes", likes: 98, comments: 15, shares: 11, date: "4 días" },
          { content: "Lanzamiento de nueva línea de productos", likes: 203, comments: 37, shares: 19, date: "1 semana" }
        ],
        analytics: { impressions: "28,940", clicks: "895", conversions: 16 },
        color: "bg-[#1877F2]"
      },
      tiktok: {
        name: "TikTok Business",
        followers: "5,200",
        engagement: "12.5%",
        roi: "2.8x",
        leads: 22,
        recentPosts: [
          { content: "Quick tips para emprendedores", likes: 1200, comments: 89, shares: 156, date: "12 horas" },
          { content: "Proceso creativo en 60 segundos", likes: 890, comments: 67, shares: 234, date: "2 días" },
          { content: "Tendencias que no puedes ignorar", likes: 2100, comments: 145, shares: 378, date: "4 días" }
        ],
        analytics: { impressions: "156,780", clicks: "19,580", conversions: 22 },
        color: "bg-black"
      }
    };

    return (
      <div className="space-y-8">
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border text-center">
            <p className="text-sm text-muted-foreground">Alcance Total</p>
            <p className="text-2xl font-bold text-primary">
              {connectedPlatforms.reduce((total, platform) => {
                const data = platformData[platform as keyof typeof platformData];
                return total + parseInt(data.analytics.impressions.replace(',', ''));
              }, 0).toLocaleString()}
            </p>
            <p className="text-xs text-green-600">+15% vs mes anterior</p>
          </div>
          <div className="bg-card p-4 rounded-lg border text-center">
            <p className="text-sm text-muted-foreground">Engagement Promedio</p>
            <p className="text-2xl font-bold text-primary">
              {(connectedPlatforms.reduce((total, platform) => {
                const data = platformData[platform as keyof typeof platformData];
                return total + parseFloat(data.engagement);
              }, 0) / connectedPlatforms.length).toFixed(1)}%
            </p>
            <p className="text-xs text-green-600">+8% vs mes anterior</p>
          </div>
          <div className="bg-card p-4 rounded-lg border text-center">
            <p className="text-sm text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold text-primary">
              {connectedPlatforms.reduce((total, platform) => {
                const data = platformData[platform as keyof typeof platformData];
                return total + data.leads;
              }, 0)}
            </p>
            <p className="text-xs text-green-600">+22% vs mes anterior</p>
          </div>
          <div className="bg-card p-4 rounded-lg border text-center">
            <p className="text-sm text-muted-foreground">ROI Promedio</p>
            <p className="text-2xl font-bold text-primary">
              {(connectedPlatforms.reduce((total, platform) => {
                const data = platformData[platform as keyof typeof platformData];
                return total + parseFloat(data.roi);
              }, 0) / connectedPlatforms.length).toFixed(1)}x
            </p>
            <p className="text-xs text-green-600">+12% vs mes anterior</p>
          </div>
        </div>

        {/* Detalle por Plataforma */}
        {connectedPlatforms.map(platform => {
          const data = platformData[platform as keyof typeof platformData];
          return (
            <div key={platform} className="bg-card border rounded-lg overflow-hidden">
              <div className={`${data.color} text-white p-4`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-lg">{data.name}</h4>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {data.followers} seguidores
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                  <div>
                    <p className="opacity-80">Engagement</p>
                    <p className="font-bold">{data.engagement}</p>
                  </div>
                  <div>
                    <p className="opacity-80">ROI</p>
                    <p className="font-bold">{data.roi}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Leads</p>
                    <p className="font-bold">{data.leads}</p>
                  </div>
                  <div>
                    <p className="opacity-80">Conversiones</p>
                    <p className="font-bold">{data.analytics.conversions}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Posts Recientes */}
                  <div>
                    <h5 className="font-semibold mb-4 flex items-center gap-2">
                      📝 Posts Recientes
                    </h5>
                    <div className="space-y-3">
                      {data.recentPosts.map((post, index) => (
                        <div key={index} className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm font-medium mb-2">{post.content}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <div className="flex gap-4">
                              <span>❤️ {post.likes}</span>
                              <span>💬 {post.comments}</span>
                              <span>🔄 {post.shares}</span>
                            </div>
                            <span>hace {post.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Analytics Detallados */}
                  <div>
                    <h5 className="font-semibold mb-4 flex items-center gap-2">
                      📊 Analytics Detallados
                    </h5>
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Impresiones</span>
                          <span className="font-bold">{data.analytics.impressions}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{width: "85%"}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Clics</span>
                          <span className="font-bold">{data.analytics.clicks}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-secondary h-2 rounded-full" style={{width: "60%"}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Tasa de Conversión</span>
                          <span className="font-bold">
                            {((data.analytics.conversions / parseInt(data.analytics.clicks.replace(',', ''))) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: "40%"}}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          Ver Análisis Completo
                        </Button>
                        <Button variant="outline" size="sm">
                          Exportar Datos
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Marketing Hub</h1>
        <p className="text-lg text-muted-foreground">
          Su centro de control para crear, ejecutar y medir estrategias de marketing con IA.
        </p>
      </header>

      {renderConnectionAlert()}
      {renderSocialConnections()}

      <Card>
        <CardContent className="p-8">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="performance" disabled={!hasConnectedPlatforms()}>Performance</TabsTrigger>
              <TabsTrigger value="estrategias">Estrategias</TabsTrigger>
              <TabsTrigger value="calendario" disabled={!hasConnectedPlatforms()}>Calendario</TabsTrigger>
              <TabsTrigger value="creacion" disabled={!hasConnectedPlatforms()}>Creación con IA</TabsTrigger>
              <TabsTrigger value="pauta" disabled={!hasConnectedPlatforms()}>Gestión de Pauta</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-6">Performance de Marketing</h3>
              {renderPlatformPerformance()}
            </TabsContent>

            <TabsContent value="estrategias" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Estrategias de Marketing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-bold mb-4">Crear Nueva Estrategia</h4>
                  <div className="space-y-4">
                    <div>
                      <Label>Contexto del Negocio</Label>
                      <Textarea 
                        placeholder="Ej: Lanzamiento de producto, temporada alta, crisis..."
                        className="resize-none"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Objetivo Principal</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Aumentar ventas</option>
                        <option>Generar leads</option>
                        <option>Aumentar reconocimiento</option>
                        <option>Fidelizar clientes</option>
                      </select>
                    </div>
                    <div>
                      <Label>Estacionalidad</Label>
                      <select className="w-full p-2 border rounded-md">
                        <option>Temporada alta</option>
                        <option>Temporada baja</option>
                        <option>Temporada normal</option>
                        <option>Evento especial</option>
                      </select>
                    </div>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Generar Estrategia con IA
                    </Button>
                  </div>
                </div>
                
                <div className="bg-card p-6 rounded-lg border">
                  <h4 className="font-bold mb-4">Estrategias Activas</h4>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4 py-2">
                      <p className="font-medium text-sm">Campaña de Lanzamiento Q1</p>
                      <p className="text-xs text-muted-foreground">LinkedIn + Instagram • ROI: 2.8x</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button size="sm" variant="secondary">Ver Métricas</Button>
                      </div>
                    </div>
                    <div className="border-l-4 border-secondary pl-4 py-2">
                      <p className="font-medium text-sm">Estrategia de Contenido Educativo</p>
                      <p className="text-xs text-muted-foreground">Blog + Redes • 150% más engagement</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">Editar</Button>
                        <Button size="sm" variant="secondary">Ver Métricas</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendario" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Calendario de Contenido</h3>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold">Enero 2025</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
                  <div>LUN</div><div>MAR</div><div>MIÉ</div><div>JUE</div><div>VIE</div><div>SÁB</div><div>DOM</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate() && new Date().getMonth() === 0;
                    return (
                      <div key={day} className={`border rounded-md h-24 p-1 ${isToday ? 'bg-primary/10 border-primary' : 'bg-card'}`}>
                        <div className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>{day}</div>
                        {day === 2 && (
                          <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded p-1 mt-1">
                            Post LinkedIn
                          </div>
                        )}
                        {day === 4 && (
                          <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded p-1 mt-1">
                            Video TikTok
                          </div>
                        )}
                        {day === 8 && (
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded p-1 mt-1">
                            Instagram Post
                          </div>
                        )}
                        {day === 15 && (
                          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded p-1 mt-1">
                            Webinar
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="creacion" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Estudio de Creación con IA</h3>
              {hasConnectedPlatforms() ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-2">🎯 Plataformas Conectadas:</p>
                    <div className="flex gap-2">
                      {getConnectedPlatforms().map(platform => (
                        <Badge key={platform} variant="secondary">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt">Idea o Tema Central</Label>
                    <Textarea
                      id="prompt"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Ej: 'Lanzamiento de nuestro nuevo producto ecológico'"
                      className="resize-none"
                    />
                  </div>
                  
                  <div>
                    <Label>Generar contenido para:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={!prompt.trim()}
                      >
                        Generar Texto para Post
                      </Button>
                      <Button 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={!prompt.trim()}
                      >
                        Generar Imagen
                      </Button>
                      <Button 
                        variant="secondary"
                        disabled={!prompt.trim()}
                      >
                        Generar Video Corto
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-6 border-t pt-6">
                    <h4 className="font-bold text-foreground mb-2">Resultado Generado:</h4>
                    <div className="bg-muted p-4 rounded-md min-h-[150px]">
                      <p className="text-muted-foreground italic">
                        {prompt.trim() 
                          ? "Ingrese una idea y presione 'Generar' para crear contenido personalizado para sus redes conectadas..." 
                          : "El contenido generado por la IA aparecerá aquí..."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Conecta tus redes sociales para acceder al estudio de creación con IA</p>
                  <Button onClick={() => window.scrollTo(0, 0)}>
                    Conectar Redes Sociales
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="pauta" className="mt-6">
              <h3 className="text-xl font-bold text-primary mb-4">Gestión de Pauta Publicitaria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                  <p className="text-3xl font-bold text-primary">$5,000 <span className="text-lg">/ mes</span></p>
                </div>
                <div className="md:col-span-2 bg-card p-4 rounded-lg border">
                  <p className="font-bold mb-4">Distribución y Performance</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">LinkedIn</span>
                        <span>$2,500 (50%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-primary h-3 rounded-full" style={{width: "50%"}}></div>
                      </div>
                      <p className="text-xs text-right text-green-600 mt-1">ROI: 3.5x</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Instagram</span>
                        <span>$1,500 (30%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-accent h-3 rounded-full" style={{width: "30%"}}></div>
                      </div>
                      <p className="text-xs text-right text-red-600 mt-1">ROI: 1.2x</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Optimizar Distribución con IA
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingHub;