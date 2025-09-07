import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, 
  Zap, 
  Target,
  Users,
  Eye,
  Heart,
  CheckCircle2,
  AlertTriangle,
  Play,
  Sparkles,
  Network,
  BarChart3,
  Calendar,
  Settings,
  Plus,
  TrendingUp,
  Rocket,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube
} from "lucide-react";

// Importar componentes existentes que mantendremos
import SocialMediaHub from './SocialMediaHub';
import MarketingMetrics from './MarketingMetrics';
import ContentGenerator from './ContentGenerator';
import MarketingCalendar from './MarketingCalendar';
import AdvancedMarketingDashboard from './AdvancedMarketingDashboard';
import MarketingHubOrchestrator from './MarketingHubOrchestrator';
import AudienciasManager from './AudienciasManager';

interface MarketingHubRedesignedProps {
  profile: any;
}

interface ConnectionStatus {
  platform: string;
  connected: boolean;
  icon: any;
  color: string;
  url?: string;
  username?: string;
  display_name?: string;
}

interface FlowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  cta: string;
  icon: any;
}

type ModuleView = 'setup' | 'analyze' | 'assets' | 'campaigns' | 'overview';

const MarketingHubRedesigned = ({ profile }: MarketingHubRedesignedProps) => {
  const [currentModule, setCurrentModule] = useState<ModuleView>('setup');
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [hasAnyConnection, setHasAnyConnection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flowProgress, setFlowProgress] = useState(0);
  const [userJourney, setUserJourney] = useState<FlowStep[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [companyUsername, setCompanyUsername] = useState<string | null>(null);

  useEffect(() => {
    checkSetupStatus();
    initializeUserJourney();

    // Listener para detectar cuando regresa de una conexión exitosa
    const handleFocus = () => {
      // Recargar conexiones después de un pequeño delay
      setTimeout(() => {
        checkSetupStatus();
      }, 2000);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [profile?.user_id]);

  const checkSetupStatus = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      
      // Verificar conexiones desde la tabla social_accounts
      const { data: socialAccountsData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', profile.user_id);

      // Inicializar array de conexiones
      const connectionList: ConnectionStatus[] = [
        {
          platform: 'Instagram',
          connected: false,
          icon: Instagram,
          color: 'text-pink-600',
        },
        {
          platform: 'Facebook',
          connected: false,
          icon: Facebook,
          color: 'text-blue-600',
        },
        {
          platform: 'LinkedIn',
          connected: false,
          icon: Linkedin,
          color: 'text-blue-700',
        },
        {
          platform: 'TikTok',
          connected: false,
          icon: Play,
          color: 'text-black',
        }
      ];

      // Actualizar estado de conexiones basado en social_accounts
      if (socialAccountsData) {
        socialAccountsData.forEach(account => {
          const platformKey = account.platform?.toLowerCase();
          const connectionIndex = connectionList.findIndex(
            conn => conn.platform.toLowerCase() === platformKey || 
                   (platformKey === 'tiktok' && conn.platform === 'TikTok')
          );
          
          if (connectionIndex !== -1) {
            connectionList[connectionIndex] = {
              ...connectionList[connectionIndex],
              connected: account.is_connected || false,
              username: account.platform_username,
              display_name: account.platform_display_name
            };
          }
        });

        // Buscar el company_username para upload-post
        const uploadPostProfile = socialAccountsData.find(account => 
          account.platform === 'upload_post_profile'
        );
        if (uploadPostProfile?.company_username) {
          setCompanyUsername(uploadPostProfile.company_username);
        }
      }

      setConnections(connectionList);
      
      const connectedCount = connectionList.filter(c => c.connected).length;
      setHasAnyConnection(connectedCount > 0);
      
      // Determinar el módulo inicial basado en el estado
      if (connectedCount === 0) {
        setCurrentModule('setup');
      } else {
        setCurrentModule('overview');
      }
      
      // Calcular progreso del flujo
      calculateFlowProgress(connectedCount);
    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPlatform = async (platform: string) => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      
      // Inicializar perfil si es necesario
      if (!companyUsername) {
        const initResult = await supabase.functions.invoke('upload-post-manager', {
          body: { action: 'init_profile' }
        });

        if (initResult.error) {
          throw new Error(initResult.error.message);
        }

        setCompanyUsername(initResult.data.companyUsername);
      }

      // Generar JWT para conectar la plataforma específica
      const jwtResult = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'generate_jwt',
          data: {
            companyUsername: companyUsername || `empresa_${profile.user_id.substring(0, 8)}`,
            platforms: [platform.toLowerCase()],
            redirectUrl: window.location.origin + '/company-dashboard?view=marketing-hub'
          }
        }
      });

      if (jwtResult.error) {
        throw new Error(jwtResult.error.message);
      }

      const { access_url } = jwtResult.data;
      if (access_url) {
        window.open(access_url, '_blank', 'width=800,height=600');
      } else {
        throw new Error('No se recibió URL de acceso para conectar');
      }

    } catch (error) {
      console.error('Error connecting platform:', error);
      toast.error(`Error conectando ${platform}: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const isValidUrl = (url: string | null): boolean => {
    if (!url || url.trim() === '' || url === 'No tiene') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const calculateFlowProgress = (connectedCount: number) => {
    // Setup (25%) + Análisis (25%) + Activos (25%) + Campañas (25%)
    let progress = 0;
    
    if (connectedCount > 0) progress += 25; // Setup completado
    // Aquí podrías verificar si hay análisis realizados, etc.
    
    setFlowProgress(progress);
  };

  const initializeUserJourney = () => {
    const journey: FlowStep[] = [
      {
        id: 'setup',
        title: 'Conectar Cuentas',
        description: 'Sincroniza tus redes sociales y sitio web',
        status: 'pending',
        cta: 'Conectar Ahora',
        icon: Network
      },
      {
        id: 'analyze',
        title: 'Analizar Audiencia',
        description: 'Descubre insights sobre tu audiencia',
        status: 'pending',
        cta: 'Ver Radiografía',
        icon: Users
      },
      {
        id: 'assets',
        title: 'Crear Activos',
        description: 'Genera audiencias y contenido optimizado',
        status: 'pending',
        cta: 'Crear Activos',
        icon: Sparkles
      },
      {
        id: 'campaigns',
        title: 'Lanzar Campaña',
        description: 'Configura y ejecuta tu estrategia',
        status: 'pending',
        cta: 'Crear Campaña',
        icon: Rocket
      }
    ];

    setUserJourney(journey);
  };

  const handleModuleChange = (module: ModuleView) => {
    if (module !== 'setup' && !hasAnyConnection) {
      toast.error("Primero debes conectar al menos una red social para acceder a esta función");
      return;
    }
    setCurrentModule(module);
  };

  const renderEmptyState = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl animate-fade-in">
          <Rocket className="w-12 h-12 text-white" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Desbloquea el Poder de tu <span className="text-primary">Audiencia</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Conecta tus redes sociales y sitio web para entender tu audiencia, 
            optimizar contenido y lanzar campañas efectivas — todo en un solo lugar.
          </p>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid md:grid-cols-3 gap-8 mt-16">
        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 animate-fade-in" style={{animationDelay: '0.1s'}}>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Entiende tu Audiencia</h3>
          <p className="text-muted-foreground">Descubre quiénes son tus seguidores, qué les gusta y cuándo están más activos.</p>
        </div>

        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Optimiza tu Contenido</h3>
          <p className="text-muted-foreground">Aprende qué resuena con tu audiencia y crea más contenido que funcione.</p>
        </div>

        <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 animate-fade-in" style={{animationDelay: '0.3s'}}>
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Campañas Inteligentes</h3>
          <p className="text-muted-foreground">Construye estrategias basadas en datos y ejecuta campañas sin esfuerzo.</p>
        </div>
      </div>

      {/* Main CTA */}
      <div className="mt-12 space-y-6">
        <Button 
          size="lg" 
          className="text-lg px-12 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in bg-gradient-to-r from-primary to-purple-600 hover:scale-105"
          style={{animationDelay: '0.4s'}}
          onClick={() => setCurrentModule('setup')}
        >
          <Network className="w-6 h-6 mr-3" />
          Conectar Mis Cuentas
          <ArrowRight className="w-6 h-6 ml-3" />
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Configuración en menos de 2 minutos • Análisis instantáneo • Resultados inmediatos
        </p>
      </div>
    </div>
  );

  const renderSetupModule = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Conecta tu Ecosistema Digital</h2>
        <p className="text-lg text-muted-foreground">
          Sincroniza tus redes sociales para obtener insights poderosos sobre tu audiencia
        </p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => checkSetupStatus()}
          disabled={loading}
        >
          {loading ? 'Verificando...' : '🔄 Actualizar Estado'}
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-foreground">Progreso de Configuración</span>
          <span className="text-sm text-muted-foreground">{connections.filter(c => c.connected).length}/{connections.length} conectadas</span>
        </div>
        <Progress value={(connections.filter(c => c.connected).length / connections.length) * 100} className="h-2" />
      </div>

      {/* Connection Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {connections.map((connection) => {
          const Icon = connection.icon;
          return (
            <Card key={connection.platform} className={`transition-all duration-300 hover:shadow-lg ${connection.connected ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950' : 'hover:scale-105'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connection.connected ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                      <Icon className={`w-6 h-6 ${connection.connected ? 'text-green-600' : connection.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{connection.platform}</h3>
                      <p className="text-sm text-muted-foreground">
                        {connection.connected ? 'Conectado' : 'No conectado'}
                      </p>
                    </div>
                  </div>
                  
                  {connection.connected ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <Button variant="outline" size="sm">Reconectar</Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="shadow-md"
                      onClick={() => handleConnectPlatform(connection.platform)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? 'Conectando...' : 'Conectar'}
                    </Button>
                  )}
                </div>
                
                {connection.connected && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">Conectado como:</span>
                        <p className="font-medium">{connection.display_name || connection.username}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                        Ver Análisis <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Website Connection */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Conecta tu Sitio Web</h3>
          <p className="text-muted-foreground mb-4">
            Analiza el tráfico y encuentra oportunidades de crecimiento
          </p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Conectar Sitio Web
          </Button>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {hasAnyConnection && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">¡Excelente! Cuentas conectadas</h3>
                  <p className="text-sm text-muted-foreground">
                    Ahora puedes analizar tu audiencia y crear estrategias efectivas
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setCurrentModule('analyze')}
                className="shadow-md"
              >
                Analizar Audiencia <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAnalyzeModule = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Radiografía de tu Audiencia</h2>
        <p className="text-lg text-muted-foreground">
          Descubre insights profundos sobre quién te sigue y qué les interesa
        </p>
      </div>

      {/* Análisis de Audiencia */}
      <AudienciasManager profile={profile} />

      {/* Transition to Assets */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-2">¿Listo para crear contenido que conecte?</h3>
          <p className="text-muted-foreground mb-6">
            Usa estos insights para crear audiencias específicas y contenido que realmente resuene
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => setCurrentModule('assets')}
              size="lg"
              className="shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Crear Audiencias
            </Button>
            <Button 
              variant="outline" 
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generar Contenido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssetsModule = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Construye tus Activos de Marketing</h2>
        <p className="text-lg text-muted-foreground">
          Crea audiencias personalizadas y contenido optimizado basado en tus insights
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Audiencias */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Mis Audiencias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Crea segmentos específicos de tu audiencia para campañas más efectivas
            </p>
            
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Audiencia Principal</h4>
                    <p className="text-sm text-muted-foreground">Basada en tus mejores seguidores</p>
                  </div>
                  <Badge variant="secondary">Activa</Badge>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Crear Nueva Audiencia
            </Button>
          </CardContent>
        </Card>

        {/* Contenido */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              Biblioteca de Contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Genera contenido optimizado basado en el rendimiento histórico
            </p>
            
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Posts de Alto Rendimiento</h4>
                    <p className="text-sm text-muted-foreground">Templates basados en tus mejores posts</p>
                  </div>
                  <Badge variant="secondary">3 disponibles</Badge>
                </div>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              Generar Contenido IA
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CTA to Campaigns */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200">
        <CardContent className="p-8 text-center">
          <Rocket className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-2">¡Es hora de lanzar tu campaña!</h3>
          <p className="text-muted-foreground mb-6">
            Tienes las audiencias y el contenido. Ahora crea una estrategia completa
          </p>
          <Button 
            onClick={() => setCurrentModule('campaigns')}
            size="lg"
            className="shadow-lg bg-gradient-to-r from-green-600 to-blue-600"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Crear Campaña
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderCampaignsModule = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Campañas Inteligentes</h2>
        <p className="text-lg text-muted-foreground">
          Crea estrategias completas con IA y lanza campañas efectivas
        </p>
      </div>

      <MarketingHubOrchestrator />
    </div>
  );

  const renderOverviewModule = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Panel de Control</h2>
          <p className="text-lg text-muted-foreground">
            Vista general de tu ecosistema de marketing
          </p>
        </div>
        <Button 
          onClick={() => setCurrentModule('campaigns')}
          size="lg"
          className="shadow-lg"
        >
          <Rocket className="w-5 h-5 mr-2" />
          Nueva Campaña
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plataformas Conectadas</p>
                <p className="text-2xl font-bold text-foreground">{connections.filter(c => c.connected).length}</p>
              </div>
              <Network className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Insights Generados</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audiencias Creadas</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campañas Activas</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Journey Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-6 h-6 mr-2" />
            Tu Progreso de Marketing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-muted-foreground">{flowProgress}% completado</span>
            </div>
            <Progress value={flowProgress} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {userJourney.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index === 0 && hasAnyConnection; // Por ahora solo el setup
                
                return (
                  <Card 
                    key={step.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md ${isCompleted ? 'bg-green-50 dark:bg-green-950 border-green-200' : ''}`}
                    onClick={() => handleModuleChange(step.id as ModuleView)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${isCompleted ? 'bg-green-100 dark:bg-green-900' : 'bg-muted'}`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-1">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{step.description}</p>
                      <Button size="sm" variant={isCompleted ? "secondary" : "outline"} className="text-xs">
                        {isCompleted ? "Completado" : step.cta}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Navigation
  const moduleNavigation = [
    { id: 'overview', label: 'Panel', icon: BarChart3, requiresConnection: true },
    { id: 'setup', label: 'Configuración', icon: Settings, requiresConnection: false },
    { id: 'analyze', label: 'Análisis', icon: Eye, requiresConnection: true },
    { id: 'assets', label: 'Activos', icon: Sparkles, requiresConnection: true },
    { id: 'campaigns', label: 'Campañas', icon: Rocket, requiresConnection: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-muted-foreground">Cargando tu Marketing Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Module Navigation */}
      {(hasAnyConnection || currentModule === 'setup') && (
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 py-4" aria-label="Módulos">
              {moduleNavigation.map((nav) => {
                const Icon = nav.icon;
                const isActive = currentModule === nav.id;
                const isDisabled = nav.requiresConnection && !hasAnyConnection && nav.id !== 'setup';
                
                return (
                  <button
                    key={nav.id}
                    onClick={() => handleModuleChange(nav.id as ModuleView)}
                    disabled={isDisabled}
                    className={`
                      px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : isDisabled
                        ? 'text-muted-foreground cursor-not-allowed opacity-50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{nav.label}</span>
                    {nav.requiresConnection && !hasAnyConnection && nav.id !== 'setup' && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasAnyConnection && currentModule !== 'setup' && renderEmptyState()}
        {currentModule === 'setup' && renderSetupModule()}
        {currentModule === 'analyze' && hasAnyConnection && renderAnalyzeModule()}
        {currentModule === 'assets' && hasAnyConnection && renderAssetsModule()}
        {currentModule === 'campaigns' && hasAnyConnection && renderCampaignsModule()}
        {currentModule === 'overview' && hasAnyConnection && renderOverviewModule()}
      </div>
    </div>
  );
};

export default MarketingHubRedesigned;