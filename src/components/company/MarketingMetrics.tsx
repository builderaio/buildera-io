import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialMediaAnalytics from "./SocialMediaAnalytics";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Users,
  Clock,
  Target,
  RefreshCw,
  Activity,
  Zap
} from "lucide-react";

interface MarketingMetricsProps {
  profile: any;
  socialConnections: {
    linkedin: boolean;
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

interface PlatformMetric {
  platform: string;
  icon: any;
  color: string;
  metrics: {
    followers: string;
    engagement: string;
    reach: string;
    posts: number;
  };
}

const MarketingMetrics = ({ profile, socialConnections }: MarketingMetricsProps) => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [realMetrics, setRealMetrics] = useState<any>(null);

  // Cargar métricas reales de la base de datos
  useEffect(() => {
    loadRealMetrics();
  }, [profile?.user_id]);

  const loadRealMetrics = async () => {
    if (!profile?.user_id) return;
    
    try {
      setLoading(true);
      
      // Obtener analytics consolidados
      const { data: analyticsData } = await supabase
        .from('social_media_analytics')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Obtener posts de todas las plataformas para métricas complementarias
      const [instagramPosts, linkedinPosts, tiktokPosts, facebookPosts] = await Promise.all([
        supabase.from('instagram_posts').select('*').eq('user_id', profile.user_id),
        supabase.from('linkedin_posts').select('*').eq('user_id', profile.user_id),
        supabase.from('tiktok_posts').select('*').eq('user_id', profile.user_id),
        supabase.from('facebook_posts').select('*').eq('user_id', profile.user_id)
      ]);

      setRealMetrics({ 
        analyticsData: analyticsData || [], 
        posts: {
          instagram: instagramPosts.data || [],
          linkedin: linkedinPosts.data || [],
          tiktok: tiktokPosts.data || [],
          facebook: facebookPosts.data || []
        }
      });
    } catch (error) {
      console.error('Error loading real metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas generales basadas en datos reales
  const getGeneralMetrics = (): MetricCard[] => {
    if (!realMetrics?.analyticsData) {
      return [
        {
          title: "Alcance Total",
          value: "0",
          change: "0%",
          trend: "neutral",
          icon: Eye,
          color: "text-blue-600"
        },
        {
          title: "Engagement Rate",
          value: "0%",
          change: "0%",
          trend: "neutral",
          icon: Heart,
          color: "text-pink-600"
        },
        {
          title: "Total Posts",
          value: "0",
          change: "0%",
          trend: "neutral",
          icon: Users,
          color: "text-green-600"
        },
        {
          title: "Total Interacciones",
          value: "0",
          change: "0%",
          trend: "neutral",
          icon: Target,
          color: "text-purple-600"
        }
      ];
    }

    const analytics = realMetrics.analyticsData;
    const totalViews = analytics.filter(a => a.metric_type === 'total_views').reduce((sum, a) => sum + a.value, 0);
    const totalLikes = analytics.filter(a => a.metric_type === 'total_likes').reduce((sum, a) => sum + a.value, 0);
    const totalComments = analytics.filter(a => a.metric_type === 'total_comments').reduce((sum, a) => sum + a.value, 0);
    const totalPosts = analytics.filter(a => a.metric_type === 'total_posts').reduce((sum, a) => sum + a.value, 0);
    const avgEngagement = analytics.filter(a => a.metric_type === 'avg_engagement_rate').reduce((sum, a) => sum + a.value, 0) / 
                          analytics.filter(a => a.metric_type === 'avg_engagement_rate').length || 0;

    return [
      {
        title: "Total Views",
        value: totalViews > 1000000 ? `${(totalViews/1000000).toFixed(1)}M` : 
               totalViews > 1000 ? `${(totalViews/1000).toFixed(1)}K` : totalViews.toString(),
        change: "+0%",
        trend: "up",
        icon: Eye,
        color: "text-blue-600"
      },
      {
        title: "Engagement Rate",
        value: `${avgEngagement.toFixed(1)}%`,
        change: "+0%",
        trend: "up",
        icon: Heart,
        color: "text-pink-600"
      },
      {
        title: "Total Posts",
        value: totalPosts.toString(),
        change: "+0%",
        trend: "up",
        icon: Users,
        color: "text-green-600"
      },
      {
        title: "Total Interacciones",
        value: (totalLikes + totalComments).toLocaleString(),
        change: "+0%",
        trend: "up",
        icon: Target,
        color: "text-purple-600"
      }
    ];
  };

  // Obtener métricas por plataforma basadas en datos reales
  const getPlatformMetrics = (): PlatformMetric[] => {
    if (!realMetrics?.analyticsData) {
      return [];
    }

    const platforms = ['Instagram', 'TikTok', 'LinkedIn', 'Facebook'];
    const analytics = realMetrics.analyticsData;
    
    return platforms.map(platform => {
      const platformData = analytics.filter(a => a.platform === platform.toLowerCase());
      const totalPosts = platformData.find(a => a.metric_type === 'total_posts')?.value || 0;
      const totalLikes = platformData.find(a => a.metric_type === 'total_likes')?.value || 0;
      const totalViews = platformData.find(a => a.metric_type === 'total_views')?.value || 0;
      const engagement = platformData.find(a => a.metric_type === 'avg_engagement_rate')?.value || 0;
      const followers = platformData.find(a => a.metric_type === 'total_followers')?.metadata?.total_followers || 0;

      return {
        platform,
        icon: () => {
          switch(platform) {
            case 'Instagram': return <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">📷</div>;
            case 'TikTok': return <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">🎵</div>;
            case 'LinkedIn': return <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">in</div>;
            case 'Facebook': return <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">f</div>;
            default: return <div className="w-5 h-5 bg-gray-500 rounded"></div>;
          }
        },
        color: platform === 'Instagram' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
               platform === 'TikTok' ? 'bg-black' :
               platform === 'LinkedIn' ? 'bg-blue-700' : 'bg-blue-600',
        metrics: {
          followers: followers > 1000 ? `${(followers/1000).toFixed(1)}K` : followers.toString(),
          engagement: `${engagement.toFixed(1)}%`,
          reach: totalViews > 1000000 ? `${(totalViews/1000000).toFixed(1)}M` : 
                 totalViews > 1000 ? `${(totalViews/1000).toFixed(1)}K` : totalViews.toString(),
          posts: totalPosts
        }
      };
    }).filter(platform => {
      // Solo mostrar plataformas con datos en analytics o posts
      const platformKey = platform.platform.toLowerCase();
      const hasAnalytics = analytics.some(a => a.platform === platformKey);
      const hasPosts = realMetrics.posts[platformKey]?.length > 0;
      return hasAnalytics || hasPosts;
    });
  };

  // Obtener los mejores posts basados en engagement
  const getTopPosts = () => {
    if (!realMetrics?.posts) return [];

    const allPosts = [];
    
    // Instagram posts
    realMetrics.posts.instagram.forEach(post => {
      allPosts.push({
        platform: 'Instagram',
        content: post.caption || 'Post sin descripción',
        metrics: {
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          shares: 0,
          views: 0
        },
        time: new Date(post.posted_at || post.created_at).toLocaleDateString(),
        engagement: post.engagement_rate || 0
      });
    });

    // TikTok posts
    realMetrics.posts.tiktok.forEach(post => {
      allPosts.push({
        platform: 'TikTok',
        content: post.title || 'Video sin título',
        metrics: {
          likes: post.digg_count || 0,
          comments: post.comment_count || 0,
          shares: post.share_count || 0,
          views: post.play_count || 0
        },
        time: new Date(post.posted_at || post.created_at).toLocaleDateString(),
        engagement: post.digg_count + post.comment_count + post.share_count
      });
    });

    // LinkedIn posts
    realMetrics.posts.linkedin.forEach(post => {
      allPosts.push({
        platform: 'LinkedIn',
        content: post.content || 'Post sin contenido',
        metrics: {
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          views: post.views_count || 0
        },
        time: new Date(post.posted_at || post.created_at).toLocaleDateString(),
        engagement: (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0)
      });
    });

    // Facebook posts
    realMetrics.posts.facebook.forEach(post => {
      allPosts.push({
        platform: 'Facebook',
        content: post.content || 'Post sin contenido',
        metrics: {
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          views: 0
        },
        time: new Date(post.posted_at || post.created_at).toLocaleDateString(),
        engagement: (post.likes_count || 0) + (post.comments_count || 0) + (post.shares_count || 0)
      });
    });

    // Ordenar por engagement y tomar los top 5
    return allPosts
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5);
  };

  const connectedPlatformsCount = Object.values(socialConnections).filter(Boolean).length;

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // Ejecutar la función para calcular analytics de todas las plataformas
      await supabase.functions.invoke('calculate-social-analytics', {
        body: {} // Sin plataforma específica para calcular todas
      });
      
      // Recargar datos después del cálculo
      await loadRealMetrics();
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (connectedPlatformsCount === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Datos de Analytics</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Conecta tus redes sociales para comenzar a ver métricas detalladas de rendimiento y engagement.
            </p>
            <Button>Conectar Redes Sociales</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Análisis Inteligente
          </TabsTrigger>
          <TabsTrigger value="traditional" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas Tradicionales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <SocialMediaAnalytics profile={profile} />
        </TabsContent>

        <TabsContent value="traditional">
          <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Métricas Tradicionales</h2>
                <p className="text-muted-foreground">
                  Vista clásica de métricas de rendimiento
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  {["7d", "30d", "90d"].map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className="h-8 px-3"
                    >
                      {range === "7d" ? "7 días" : range === "30d" ? "30 días" : "90 días"}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshMetrics}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Métricas generales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getGeneralMetrics().map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index} className="transition-all duration-200 hover:shadow-md hover-scale">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className={`h-5 w-5 ${metric.color}`} />
                        <Badge 
                          variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {metric.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                          {metric.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                          {metric.change}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-sm text-muted-foreground">{metric.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Métricas por plataforma */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {getPlatformMetrics().map((platform, index) => {
                  const IconComponent = platform.icon;
                  return (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className={`${platform.color} text-white pb-4`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <IconComponent />
                            <div>
                              <CardTitle className="text-lg">{platform.platform}</CardTitle>
                              <p className="text-sm opacity-90">Últimos {timeRange}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {platform.metrics.posts} posts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              Seguidores
                            </div>
                            <p className="text-xl font-bold">{platform.metrics.followers}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Heart className="h-4 w-4" />
                              Engagement
                            </div>
                            <p className="text-xl font-bold">{platform.metrics.engagement}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              Alcance
                            </div>
                            <p className="text-xl font-bold">{platform.metrics.reach}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Posts
                            </div>
                            <p className="text-xl font-bold">{platform.metrics.posts}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {/* Gráfico de rendimiento semanal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rendimiento Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Gráfico de rendimiento semanal</p>
                    <p className="text-sm text-muted-foreground">Próximamente: Integración con Chart.js</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top posts con datos reales */}
            <Card>
              <CardHeader>
                <CardTitle>Posts con Mejor Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                {realMetrics?.posts ? (
                  <div className="space-y-4">
                    {getTopPosts().map((post, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {post.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{post.time}</span>
                          </div>
                          <p className="text-sm mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.metrics.likes}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.metrics.comments}
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {post.metrics.shares || 0}
                            </div>
                            {post.metrics.views > 0 && (
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.metrics.views > 1000 ? `${(post.metrics.views/1000).toFixed(1)}K` : post.metrics.views}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Cargando posts...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingMetrics;