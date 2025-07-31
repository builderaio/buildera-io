import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  Calendar, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Network,
  PlusCircle
} from "lucide-react";
import SocialMediaHub from './SocialMediaHub';
import MarketingMetrics from './MarketingMetrics';
import ContentGenerator from './ContentGenerator';
import MarketingCalendar from './MarketingCalendar';

interface MarketingHubProps {
  profile: any;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

const MarketingHub = ({ profile }: MarketingHubProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [socialConnections, setSocialConnections] = useState({
    linkedin: false,
    instagram: false,
    facebook: false,
    tiktok: false,
    twitter: false,
    youtube: false
  });
  const [loading, setLoading] = useState(false);

  // Mock quick stats - en producción vendría de la API
  const quickStats: QuickStat[] = [
    {
      label: "Alcance Total",
      value: "24.8K",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-blue-600"
    },
    {
      label: "Engagement",
      value: "4.2%",
      change: "+0.8%",
      trend: "up",
      icon: Heart,
      color: "text-pink-600"
    },
    {
      label: "Conversiones",
      value: "156",
      change: "+23%",
      trend: "up",
      icon: Target,
      color: "text-green-600"
    },
    {
      label: "ROI",
      value: "3.4x",
      change: "-0.2x",
      trend: "down",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  useEffect(() => {
    checkConnections();
  }, [profile?.user_id]);

  const checkConnections = async () => {
    if (!profile?.user_id) return;

    try {
      // Get company data to check social media URLs
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (companyData) {
        // Check if URLs are valid and not empty
        const isValidUrl = (url: string | null) => {
          if (!url || url.trim() === '' || url === 'No tiene') return false;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };

        setSocialConnections({
          linkedin: isValidUrl(companyData.linkedin_url),
          tiktok: isValidUrl(companyData.tiktok_url),
          facebook: isValidUrl(companyData.facebook_url),
          instagram: isValidUrl(companyData.instagram_url),
          twitter: isValidUrl(companyData.twitter_url),
          youtube: isValidUrl(companyData.youtube_url)
        });
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const connectedPlatforms = Object.values(socialConnections).filter(Boolean).length;
  const totalPlatforms = Object.keys(socialConnections).length;

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickStats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-5 w-5 ${stat.color}`} />
                <Badge 
                  variant={stat.trend === 'up' ? 'default' : stat.trend === 'down' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {stat.change}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderConnectionStatus = () => (
    <Card className="mb-8 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Network className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Estado de Conexiones</h3>
              <p className="text-sm text-muted-foreground">
                {connectedPlatforms} de {totalPlatforms} plataformas conectadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${(connectedPlatforms / totalPlatforms) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {Math.round((connectedPlatforms / totalPlatforms) * 100)}%
            </span>
          </div>
        </div>
        
        {connectedPlatforms < totalPlatforms && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Conecta más redes sociales para obtener insights más completos y amplificar tu alcance.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => setActiveTab("social")}
              >
                Configurar ahora <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-start gap-2 hover-scale"
            onClick={() => setActiveTab("content")}
          >
            <div className="flex items-center gap-2 text-primary">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Generar Contenido</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Crea posts optimizados con IA para todas tus redes sociales
            </p>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-start gap-2 hover-scale"
            onClick={() => setActiveTab("calendar")}
          >
            <div className="flex items-center gap-2 text-purple-600">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Programar Posts</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Organiza y programa tu contenido con nuestro calendario inteligente
            </p>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col items-start gap-2 hover-scale"
            onClick={() => setActiveTab("analytics")}
          >
            <div className="flex items-center gap-2 text-green-600">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Ver Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              Analiza el rendimiento y optimiza tu estrategia de marketing
            </p>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Hub</h1>
          <p className="text-muted-foreground">
            Tu centro de control para marketing digital con IA
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Crear Campaña
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger 
            value="overview" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">Resumen</span>
          </TabsTrigger>
          <TabsTrigger 
            value="social" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Network className="h-4 w-4" />
            <span className="text-xs">Redes Sociales</span>
          </TabsTrigger>
          <TabsTrigger 
            value="content" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Zap className="h-4 w-4" />
            <span className="text-xs">Contenido</span>
          </TabsTrigger>
          <TabsTrigger 
            value="calendar" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calendar className="h-4 w-4" />
            <span className="text-xs">Calendario</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {renderQuickStats()}
          {renderConnectionStatus()}
          {renderQuickActions()}
          
          {/* Recent Activity Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Post publicado en LinkedIn</p>
                    <p className="text-xs text-muted-foreground">Hace 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuevas métricas disponibles</p>
                    <p className="text-xs text-muted-foreground">Hace 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Contenido generado con IA</p>
                    <p className="text-xs text-muted-foreground">Ayer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Publicaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Post sobre nuevos productos</p>
                    <p className="text-xs text-muted-foreground">Hoy, 3:00 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Actualización de empresa</p>
                    <p className="text-xs text-muted-foreground">Mañana, 10:00 AM</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Ver todo el calendario
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <SocialMediaHub profile={profile} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentGenerator profile={profile} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <MarketingCalendar profile={profile} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MarketingMetrics 
            profile={profile} 
            socialConnections={socialConnections}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingHub;