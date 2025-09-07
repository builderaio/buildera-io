import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
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
  PlusCircle,
  HelpCircle,
  Rocket
} from "lucide-react";
import SocialMediaHub from './SocialMediaHub';
import MarketingMetrics from './MarketingMetrics';
import ContentGenerator from './ContentGenerator';
import MarketingCalendar from './MarketingCalendar';
import AdvancedMarketingDashboard from './AdvancedMarketingDashboard';
import MarketingHubOrchestrator from './MarketingHubOrchestrator';
import MarketingDataPersistenceManager from './MarketingDataPersistenceManager';
import MarketingHubWow from './MarketingHubWow';


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
  const [activeTab, setActiveTab] = useState("campaign-wizard");  // Cambio por defecto a campaign wizard
  const [socialConnections, setSocialConnections] = useState({
    linkedin: false,
    instagram: false,
    facebook: false,
    tiktok: false
  });
  const [loading, setLoading] = useState(false);
  const [realMetrics, setRealMetrics] = useState<QuickStat[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const isMobile = useIsMobile();

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
    checkOnboardingStatus();
    checkConnections();
    loadRealMetrics();
    loadRecentActivity();
    loadUpcomingPosts();
  }, [profile?.user_id]);

  const checkOnboardingStatus = async () => {
    if (!profile?.user_id) return;

    try {
      // Check if user has completed onboarding
      const { data: onboardingStatus } = await supabase
        .from('marketing_onboarding_status')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      // If onboarding was completed, don't show it again
      if (onboardingStatus) {
        setNeedsOnboarding(false);
        console.log('🎯 Onboarding already completed:', onboardingStatus.completed_at);
        return;
      }

      // If no onboarding record exists, user needs onboarding
      setNeedsOnboarding(true);
      console.log('🎯 Onboarding required: No completion record found');

    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setNeedsOnboarding(true); // Si hay error, mostrar onboarding por seguridad
    }
  };

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
          instagram: isValidUrl(companyData.instagram_url)
        });
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const loadRealMetrics = async () => {
    if (!profile?.user_id) return;

    try {
      // Obtener datos de todas las plataformas de redes sociales
      const [instagramPosts, tiktokPosts, insights, actionables, analyticsData] = await Promise.all([
        supabase
          .from('instagram_posts')
          .select('like_count, comment_count, posted_at, reach, impressions, video_view_count')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('tiktok_posts')
          .select('digg_count, comment_count, posted_at, play_count')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('marketing_insights')
          .select('*')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('marketing_actionables')
          .select('*')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('social_media_analytics')
          .select('*')
          .eq('user_id', profile.user_id)
      ]);

      const instagramData = instagramPosts.data || [];
      const tiktokData = tiktokPosts.data || [];
      const insightsData = insights.data || [];
      const actionablesData = actionables.data || [];
      const analytics = analyticsData.data || [];

      const totalPosts = instagramData.length + tiktokData.length;

      // Calcular métricas reales si hay datos
      if (totalPosts > 0 || analytics.length > 0) {
        // Calcular alcance total real combinando plataformas
        const instagramReach = instagramData.reduce((sum, post) => sum + (post.reach || post.impressions || 0), 0);
        const tiktokReach = tiktokData.reduce((sum, post) => sum + (post.play_count || 0), 0);
        const totalReach = instagramReach + tiktokReach;
        
        // Calcular likes totales
        const instagramLikes = instagramData.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const tiktokLikes = tiktokData.reduce((sum, post) => sum + (post.digg_count || 0), 0);
        const totalLikes = instagramLikes + tiktokLikes;
        
        // Calcular comentarios totales
        const instagramComments = instagramData.reduce((sum, post) => sum + (post.comment_count || 0), 0);
        const tiktokComments = tiktokData.reduce((sum, post) => sum + (post.comment_count || 0), 0);
         const totalComments = instagramComments + tiktokComments;
         const totalEngagement = totalLikes + totalComments;
         
         // Calcular acciones completadas
         const completedActionables = actionablesData.filter(a => a.status === 'completed').length;
         
         // Calcular score de insights basado en la calidad y cantidad
         const insightScore = insightsData.length > 0 ? 
           Math.min((insightsData.length * 10) + (actionablesData.length * 5), 100) : 0;

         // Datos anteriores para comparación (últimos 30 días vs anteriores)
         const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
         const recentInstagramPosts = instagramData.filter(post => new Date(post.posted_at) > thirtyDaysAgo);
         const recentTikTokPosts = tiktokData.filter(post => new Date(post.posted_at) > thirtyDaysAgo);
         const olderInstagramPosts = instagramData.filter(post => new Date(post.posted_at) <= thirtyDaysAgo);
         const olderTikTokPosts = tiktokData.filter(post => new Date(post.posted_at) <= thirtyDaysAgo);
         
         // Calcular engagement rate real
         const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100) : 0;
         
         // Calcular engagement promedio para tendencias
         const recentInstagramEng = recentInstagramPosts.reduce((sum, post) => sum + ((post.like_count || 0) + (post.comment_count || 0)), 0);
         const recentTikTokEng = recentTikTokPosts.reduce((sum, post) => sum + ((post.digg_count || 0) + (post.comment_count || 0)), 0);
         const recentEngagement = recentInstagramEng + recentTikTokEng;
         
         const olderInstagramEng = olderInstagramPosts.reduce((sum, post) => sum + ((post.like_count || 0) + (post.comment_count || 0)), 0);
         const olderTikTokEng = olderTikTokPosts.reduce((sum, post) => sum + ((post.digg_count || 0) + (post.comment_count || 0)), 0);
         const olderEngagement = olderInstagramEng + olderTikTokEng;
         
         const recentTotalPosts = recentInstagramPosts.length + recentTikTokPosts.length;
         const olderTotalPosts = olderInstagramPosts.length + olderTikTokPosts.length;
         const recentAvg = recentTotalPosts > 0 ? recentEngagement / recentTotalPosts : 0;
         const olderAvg = olderTotalPosts > 0 ? olderEngagement / olderTotalPosts : 0;
        
        const engagementTrend = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'neutral';
        const engagementChange = olderAvg > 0 ? `${(((recentAvg - olderAvg) / olderAvg) * 100).toFixed(1)}%` : '0%';

        // Calcular conversiones basadas en actionables completados
        const pendingActionables = actionablesData.filter(a => a.status === 'pending').length;
        const conversionTrend = completedActionables > pendingActionables ? 'up' : 'down';

        // Calcular ROI estimado basado en insights y engagement
        const highImpactInsights = insightsData.filter(i => i.impact_level === 'high').length;
        const totalInsights = insightsData.length;
        const roiEstimate = totalInsights > 0 ? (highImpactInsights / totalInsights * 100).toFixed(1) : '0';
        const roiTrend = highImpactInsights > (totalInsights / 2) ? 'up' : 'down';

         const realMetrics: QuickStat[] = [
           {
             label: "Alcance Total",
             value: totalReach > 0 ? formatNumber(totalReach) : formatNumber(totalLikes + totalComments),
             change: engagementChange,
             trend: engagementTrend,
             icon: Eye,
             color: "text-blue-600"
           },
           {
             label: "Engagement Rate",
             value: `${engagementRate.toFixed(1)}%`,
            change: engagementChange,
            trend: engagementTrend,
            icon: Heart,
            color: "text-pink-600"
          },
          {
            label: "Acciones Completadas",
            value: completedActionables.toString(),
            change: `${actionablesData.length} total`,
            trend: conversionTrend,
            icon: Target,
            color: "text-green-600"
          },
          {
            label: "Score de Insights",
            value: `${roiEstimate}%`,
            change: `${insightsData.length} insights`,
            trend: roiTrend,
            icon: TrendingUp,
            color: "text-purple-600"
          }
        ];

         setRealMetrics(realMetrics);
          console.log('📊 Real metrics loaded:', {
            totalReach,
            engagementRate: engagementRate.toFixed(2),
            completedActionables,
            totalInsights: insightsData.length,
            postsAnalyzed: totalPosts
          });
      } else {
        // Si no hay datos, mostrar métricas vacías pero reales
        const emptyMetrics: QuickStat[] = [
          {
            label: "Alcance Total",
            value: "0",
            change: "Sin datos",
            trend: "neutral",
            icon: Eye,
            color: "text-blue-600"
          },
          {
            label: "Engagement Rate",
            value: "0%",
            change: "Sin datos",
            trend: "neutral",
            icon: Heart,
            color: "text-pink-600"
          },
          {
            label: "Acciones Completadas",
            value: "0",
            change: "Sin acciones",
            trend: "neutral",
            icon: Target,
            color: "text-green-600"
          },
          {
            label: "Score de Insights",
            value: "0%",
            change: "Sin insights",
            trend: "neutral",
            icon: TrendingUp,
            color: "text-purple-600"
          }
        ];
        setRealMetrics(emptyMetrics);
      }
    } catch (error) {
      console.error('Error loading real metrics:', error);
      // En caso de error, usar métricas vacías en lugar de mock
      setRealMetrics([]);
    }
  };

  const loadRecentActivity = async () => {
    if (!profile?.user_id) return;

    try {
      // Obtener actividad reciente de múltiples fuentes
      const [insights, actionables, posts, tiktokPosts, instagramPosts] = await Promise.all([
        supabase
          .from('marketing_insights')
          .select('created_at, insight_type, title')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(3),
        
        supabase
          .from('marketing_actionables')
          .select('created_at, status, description')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(2),
        
        supabase
          .from('linkedin_posts')
          .select('posted_at, content')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false })
          .limit(2),
        
        supabase
          .from('tiktok_posts')
          .select('posted_at, title')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false })
          .limit(2),
        
        supabase
          .from('instagram_posts')
          .select('posted_at, caption')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false })
          .limit(2)
      ]);

      const activities = [];

      // Agregar actividad de insights
      if (insights.data?.length > 0) {
        insights.data.forEach(insight => {
          activities.push({
            icon: Sparkles,
            iconColor: 'text-purple-600',
            title: `Nuevo insight: ${insight.title || 'Análisis generado'}`,
            time: formatTimeAgo(insight.created_at),
            type: 'insight'
          });
        });
      }

      // Agregar acciones completadas
      if (actionables.data?.length > 0) {
        actionables.data.forEach(action => {
          activities.push({
            icon: CheckCircle2,
            iconColor: 'text-green-600',
            title: 'Acción completada',
            time: formatTimeAgo(action.created_at),
            type: 'action'
          });
        });
      }

      // Agregar posts publicados
      if (posts.data?.length > 0) {
        posts.data.forEach(post => {
          activities.push({
            icon: CheckCircle2,
            iconColor: 'text-blue-600',
            title: 'Post publicado en LinkedIn',
            time: formatTimeAgo(post.posted_at),
            type: 'linkedin_post'
          });
        });
      }

      if (tiktokPosts.data?.length > 0) {
        tiktokPosts.data.forEach(post => {
          activities.push({
            icon: CheckCircle2,
            iconColor: 'text-pink-600',
            title: 'Video publicado en TikTok',
            time: formatTimeAgo(post.posted_at),
            type: 'tiktok_post'
          });
        });
      }

      if (instagramPosts.data?.length > 0) {
        instagramPosts.data.forEach(post => {
          activities.push({
            icon: CheckCircle2,
            iconColor: 'text-orange-600',
            title: 'Post publicado en Instagram',
            time: formatTimeAgo(post.posted_at),
            type: 'instagram_post'
          });
        });
      }

      // Ordenar por tiempo y tomar solo los más recientes
      activities.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    }
  };

  const loadUpcomingPosts = async () => {
    if (!profile?.user_id) return;

    try {
      // Obtener posts programados
      const { data: scheduledPosts } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5);

      const upcoming = [];

      if (scheduledPosts?.length > 0) {
        scheduledPosts.forEach(post => {
          upcoming.push({
            icon: Calendar,
            iconColor: getPlatformColor(post.platform),
            title: typeof post.content === 'string' ? post.content.substring(0, 50) + '...' : 'Post programado',
            time: formatScheduledTime(post.scheduled_for),
            platform: post.platform
          });
        });
      }

      setUpcomingPosts(upcoming);

    } catch (error) {
      console.error('Error loading upcoming posts:', error);
      setUpcomingPosts([]);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString();
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      if (diffHours < 1) return 'En menos de 1 hora';
      return `En ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 7) return `En ${diffDays} días`;
    return date.toLocaleDateString();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'linkedin': return 'text-blue-600';
      case 'instagram': return 'text-pink-600';
      case 'tiktok': return 'text-black';
      case 'facebook': return 'text-blue-700';
      default: return 'text-gray-600';
    }
  };

  // Función auxiliar para formatear números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const connectedPlatforms = Object.values(socialConnections).filter(Boolean).length;
  const totalPlatforms = Object.keys(socialConnections).length;

  const renderQuickStats = () => {
    // Usar siempre métricas reales, y solo mostrar mock si no hay datos reales disponibles
    const statsToShow = realMetrics.length > 0 ? realMetrics : quickStats;
    const isUsingRealData = realMetrics.length > 0;
    
    return (
      <div className="space-y-4">
        {!isUsingRealData && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Mostrando datos de ejemplo</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Conecta tus redes sociales para ver métricas reales de tu negocio
            </p>
          </div>
        )}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsToShow.map((stat, index) => {
              const IconComponent = stat.icon;
              
              // Definir explicaciones para cada métrica
              const getExplanation = (label: string) => {
                switch(label) {
                  case "Alcance Total":
                    return "Número único de personas que vieron tu contenido";
                  case "Engagement Rate":
                  case "Engagement":
                    return "% de interacciones vs alcance promedio";
                  case "Score de Insights":
                    return "Calidad y cantidad de insights generados por IA";
                  case "Acciones Completadas":
                    return "Recomendaciones por implementar";
                  case "ROI":
                    return "Retorno de inversión estimado";
                  case "Conversiones":
                    return "Objetivos completados exitosamente";
                  default:
                    return label;
                }
              };
              
              return (
                <Card key={index} className="relative overflow-hidden transition-all duration-200 hover:shadow-md hover-scale">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-5 w-5 ${stat.color}`} />
                        {isMobile && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getExplanation(stat.label)}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
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
                      {!isMobile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {getExplanation(stat.label)}
                        </p>
                      )}
                    </div>
                    {isUsingRealData && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Datos en tiempo real" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    );
  };

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
            className="h-auto min-h-[120px] p-4 flex flex-col items-start justify-start gap-3 hover-scale w-full"
            onClick={() => setActiveTab("content")}
          >
            <div className="flex items-center gap-2 text-primary shrink-0">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Generar Contenido</span>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed w-full">
              Crea posts optimizados con IA para todas tus redes sociales
            </p>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto min-h-[120px] p-4 flex flex-col items-start justify-start gap-3 hover-scale w-full"
            onClick={() => setActiveTab("calendar")}
          >
            <div className="flex items-center gap-2 text-purple-600 shrink-0">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Programar Posts</span>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed w-full">
              Organiza y programa tu contenido con nuestro calendario inteligente
            </p>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto min-h-[120px] p-4 flex flex-col items-start justify-start gap-3 hover-scale w-full"
            onClick={() => setActiveTab("analytics")}
          >
            <div className="flex items-center gap-2 text-green-600 shrink-0">
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Ver Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed w-full">
              Analiza el rendimiento y optimiza tu estrategia de marketing
            </p>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setShowOnboarding(false);
    // Recargar datos después del onboarding
    checkConnections();
    loadRealMetrics();
    toast.success('¡Marketing Hub configurado correctamente!');
  };

  // No onboarding needed anymore - go directly to marketing hub

  // Mostrar loading mientras determinamos si necesita onboarding
  if (needsOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando Marketing Hub...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowOnboarding(true)}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Reconfigurar
          </Button>
          <Button 
            onClick={() => setActiveTab("campaign-wizard")}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Rocket className="h-4 w-4" />
            Crear Campaña IA
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-8 h-auto p-1">
          <TabsTrigger 
            value="campaign-wizard" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative"
          >
            <Rocket className="h-4 w-4" />
            <span className="text-xs">Campaña IA</span>
            <Badge variant="secondary" className="absolute -top-1 -right-1 text-[8px] px-1 py-0 bg-green-500 text-white">
              NUEVO
            </Badge>
          </TabsTrigger>
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
          <TabsTrigger 
            value="advanced" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs">IA Avanzado</span>
          </TabsTrigger>
          <TabsTrigger value="orchestrator" 
            className="flex flex-col gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Target className="h-4 w-4" />
            <span className="text-xs">Datos</span>
          </TabsTrigger>
        </TabsList>

        {/* Campaña IA como primera tab */}
        <TabsContent value="campaign-wizard" className="space-y-6">
          <MarketingHubOrchestrator />
        </TabsContent>

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
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <IconComponent className={`h-5 w-5 ${activity.iconColor}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Conecta tus redes sociales para ver la actividad
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximas Publicaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingPosts.length > 0 ? (
                  <>
                    {upcomingPosts.map((post, index) => {
                      const IconComponent = post.icon;
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <IconComponent className={`h-5 w-5 ${post.iconColor}`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{post.time}</p>
                          </div>
                          {post.platform && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {post.platform}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("calendar")}
                    >
                      Ver todo el calendario
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No hay publicaciones programadas</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Programa contenido desde el calendario
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => setActiveTab("calendar")}
                    >
                      Programar ahora
                    </Button>
                  </div>
                )}
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

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedMarketingDashboard profile={profile} />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <MarketingDataPersistenceManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingHub;