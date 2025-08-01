import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
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
  Instagram,
  Linkedin,
  Music,
  Facebook,
  BarChart3,
  Zap,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Star,
  ArrowRight,
  Hash,
  AtSign,
  Activity
} from "lucide-react";

interface SocialMediaAnalyticsProps {
  profile: any;
}

interface AnalyticsData {
  insights: any[];
  actionables: any[];
  posts: any[];
  analytics: any[];
  embeddings: any[];
}

interface PlatformStats {
  platform: string;
  postsCount: number;
  avgEngagement: number;
  totalLikes: number;
  totalComments: number;
  topHashtags: string[];
  recentActivity: any[];
}

const SocialMediaAnalytics = ({ profile }: SocialMediaAnalyticsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    insights: [],
    actionables: [],
    posts: [],
    analytics: [],
    embeddings: []
  });
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (profile?.user_id) {
      loadAnalyticsData();
    }
  }, [profile?.user_id]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log('📊 Loading analytics data for user:', profile.user_id);
      
      // Cargar datos de múltiples tablas en paralelo
      const [insightsRes, actionablesRes, instagramRes, linkedinPostsRes, linkedinConnectionRes, tiktokRes, facebookPostsRes, facebookConnectionRes, analyticsRes] = await Promise.all([
        supabase
          .from('marketing_insights')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('marketing_actionables')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false }),
        
        // Instagram posts
        supabase
          .from('instagram_posts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false }),
        
        // LinkedIn posts
        supabase
          .from('linkedin_posts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false }),
        
        // LinkedIn connections check
        supabase
          .from('linkedin_connections')
          .select('*')
          .eq('user_id', profile.user_id)
          .limit(1),
        
        // TikTok posts
        supabase
          .from('tiktok_posts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false }),
        
        // Facebook posts
        supabase
          .from('facebook_posts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false }),
        
        // Facebook connections check
        supabase
          .from('facebook_instagram_connections')
          .select('*')
          .eq('user_id', profile.user_id)
          .limit(1),
        
        supabase
          .from('social_media_analytics')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('period_start', { ascending: false })
      ]);

      // Verificar errores y mostrar información detallada
      if (insightsRes.error) {
        console.error('Error loading insights:', insightsRes.error);
        throw insightsRes.error;
      }
      if (actionablesRes.error) {
        console.error('Error loading actionables:', actionablesRes.error);
        throw actionablesRes.error;
      }
      if (instagramRes.error) {
        console.error('Error loading Instagram posts:', instagramRes.error);
        throw instagramRes.error;
      }
      if (linkedinPostsRes.error) {
        console.warn('LinkedIn posts not available:', linkedinPostsRes.error);
      }
      if (linkedinConnectionRes.error) {
        console.warn('LinkedIn connection not available');
      }
      if (tiktokRes.error) {
        console.error('Error loading TikTok posts:', tiktokRes.error);
        console.warn('TikTok posts not available');
      }
      if (facebookPostsRes.error) {
        console.warn('Facebook posts not available:', facebookPostsRes.error);
      }
      if (facebookConnectionRes.error) {
        console.warn('Facebook connection not available');
      }
      if (analyticsRes.error) {
        console.error('Error loading analytics:', analyticsRes.error);
        throw analyticsRes.error;
      }

      // Verificar conexiones y obtener posts
      const hasLinkedinConnection = linkedinConnectionRes.data && linkedinConnectionRes.data.length > 0;
      const hasFacebookConnection = facebookConnectionRes.data && facebookConnectionRes.data.length > 0;
      
      // Combinar posts de todas las plataformas disponibles
      const allPosts = [
        ...(instagramRes.data || []).map(post => ({ ...post, platform: 'instagram' })),
        ...(linkedinPostsRes.data || []).map(post => ({ ...post, platform: 'linkedin' })),
        ...(facebookPostsRes.data || []).map(post => ({ ...post, platform: 'facebook' })),
        ...(tiktokRes.data || []).map(post => ({ ...post, platform: 'tiktok' }))
      ];
      
      // Agregar indicadores de estado de conexión
      const connectionStatus = {
        instagram: instagramRes.data && instagramRes.data.length > 0,
        linkedin: linkedinPostsRes.data && linkedinPostsRes.data.length > 0,
        facebook: facebookPostsRes.data && facebookPostsRes.data.length > 0,
        tiktok: tiktokRes.data && tiktokRes.data.length > 0
      };

      const data = {
        insights: insightsRes.data || [],
        actionables: actionablesRes.data || [],
        posts: allPosts,
        analytics: analyticsRes.data || [],
        embeddings: []
      };

      console.log('📈 Data loaded:', {
        insights: data.insights.length,
        actionables: data.actionables.length,
        instagram: instagramRes.data?.length || 0,
        linkedin: linkedinPostsRes.data?.length || 0,
        facebook: facebookPostsRes.data?.length || 0,
        tiktok: tiktokRes.data?.length || 0,
        totalPosts: data.posts.length,
        analytics: data.analytics.length,
        connections: connectionStatus
      });

      setAnalyticsData(data);
      
      // Generar estadísticas por plataforma
      generatePlatformStats(data);

    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error cargando datos",
        description: `No se pudieron cargar los datos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePlatformStats = (data: AnalyticsData) => {
    const platforms = ['instagram', 'linkedin', 'tiktok', 'facebook'];
    const stats: PlatformStats[] = [];

    platforms.forEach(platform => {
      const platformPosts = data.posts.filter(post => post.platform === platform);

      if (platformPosts.length > 0) {
        let totalLikes = 0;
        let totalComments = 0;
        let avgEngagement = 0;

        // Calcular métricas según la plataforma
        if (platform === 'instagram') {
          totalLikes = platformPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
          totalComments = platformPosts.reduce((sum, post) => sum + (post.comment_count || 0), 0);
          avgEngagement = platformPosts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / platformPosts.length;
        } else if (platform === 'linkedin') {
          totalLikes = platformPosts.reduce((sum, post) => sum + (post.stats?.total_reactions || 0), 0);
          totalComments = platformPosts.reduce((sum, post) => sum + (post.stats?.comments || 0), 0);
          avgEngagement = (totalLikes + totalComments) / platformPosts.length;
        } else if (platform === 'tiktok') {
          totalLikes = platformPosts.reduce((sum, post) => sum + (post.digg_count || 0), 0);
          totalComments = platformPosts.reduce((sum, post) => sum + (post.comment_count || 0), 0);
          avgEngagement = (totalLikes + totalComments) / platformPosts.length;
        } else if (platform === 'facebook') {
          // Métricas de Facebook cuando estén disponibles
          totalLikes = platformPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
          totalComments = platformPosts.reduce((sum, post) => sum + (post.comments || 0), 0);
          avgEngagement = (totalLikes + totalComments) / platformPosts.length;
        }
        
        // Extraer hashtags más comunes
        let allHashtags: string[] = [];
        if (platform === 'instagram') {
          allHashtags = platformPosts.flatMap(post => post.hashtags || []);
        } else if (platform === 'linkedin') {
          // LinkedIn no usa hashtags de la misma forma
          allHashtags = platformPosts.flatMap(post => 
            (post.text || '').match(/#\w+/g)?.map(tag => tag.replace('#', '')) || []
          );
        }
        
        const hashtagCount: Record<string, number> = {};
        allHashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
        const topHashtags = Object.entries(hashtagCount)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag);

        stats.push({
          platform,
          postsCount: platformPosts.length,
          avgEngagement: Math.round(avgEngagement * 100) / 100,
          totalLikes,
          totalComments,
          topHashtags,
          recentActivity: platformPosts.slice(0, 3)
        });
      }
    });

    setPlatformStats(stats);
  };

  const runAnalysis = async (platform?: string) => {
    setLoading(true);
    try {
      console.log(`🔄 Generando insights básicos para ${platform || 'todas las plataformas'}...`);
      
      // 1. Calcular analytics básicos
      const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke(
        'calculate-social-analytics',
        { body: { platform } }
      );

      if (analyticsError) throw analyticsError;

      // 2. Generar insights básicos sin IA
      await generateBasicInsights();
      
      // 3. Recargar datos después del análisis
      await loadAnalyticsData();
      
      toast({
        title: "Análisis completado",
        description: "Se generaron insights básicos basados en tus métricas de redes sociales",
      });
    } catch (error: any) {
      console.error('Error en análisis:', error);
      toast({
        title: "Error en el análisis",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBasicInsights = async () => {
    try {
      console.log('🔍 Iniciando generación de insights básicos...');
      const userId = profile.user_id;
      
      if (!userId) {
        throw new Error('User ID no encontrado');
      }

      const insights = [];
      const actionables = [];

      console.log('📊 Datos disponibles:', {
        posts: analyticsData.posts.length,
        platformStats: platformStats.length
      });

      // Analizar posts más exitosos
      const topPosts = analyticsData.posts
        .sort((a, b) => {
          const aEngagement = (a.like_count || a.likes_count || a.digg_count || 0) + (a.comment_count || a.comments_count || 0);
          const bEngagement = (b.like_count || b.likes_count || b.digg_count || 0) + (b.comment_count || b.comments_count || 0);
          return bEngagement - aEngagement;
        })
        .slice(0, 5);

      if (topPosts.length > 0) {
        const avgInteractions = Math.round(topPosts.reduce((sum, post) => {
          return sum + ((post.like_count || post.likes_count || post.digg_count || 0) + (post.comment_count || post.comments_count || 0));
        }, 0) / topPosts.length);

      insights.push({
        user_id: userId,
        title: "Posts con Mayor Engagement",
        description: `Tus ${topPosts.length} posts con mejor rendimiento han generado un promedio de ${avgInteractions} interacciones.`,
        insight_type: "content_performance",
        platforms: ["instagram", "tiktok", "linkedin"],
        confidence_score: 0.8,
        impact_level: "high",
        data: { top_posts: topPosts.length, avg_interactions: avgInteractions }
      });

        actionables.push({
          user_id: userId,
          title: "Replicar Contenido Exitoso",
          description: "Analiza los elementos comunes de tus posts más exitosos y créa contenido similar",
          action_type: "content_creation",
          priority: "high",
          estimated_impact: "Aumento del 15-25% en engagement"
        });

        console.log('✅ Insight de posts exitosos creado');
      }

      // Analizar frecuencia de publicación
      const recentPosts = analyticsData.posts.filter(post => {
        const postDate = new Date(post.posted_at || post.create_time);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return postDate >= thirtyDaysAgo;
      });

      if (recentPosts.length > 0) {
        const postsPerWeek = Math.round((recentPosts.length / 30) * 7);
        let recommendation = '';
        
        if (postsPerWeek < 3) {
          recommendation = 'Considera aumentar la frecuencia para mayor visibilidad.';
        } else if (postsPerWeek > 10) {
          recommendation = 'Buena frecuencia, mantén la calidad.';
        } else {
          recommendation = 'Frecuencia óptima para engagement.';
        }

        insights.push({
          user_id: userId,
          title: "Frecuencia de Publicación",
          description: `Publicas aproximadamente ${postsPerWeek} posts por semana. ${recommendation}`,
          insight_type: "performance_trends",
          platforms: ["instagram", "tiktok", "linkedin"],
          confidence_score: 0.9,
          impact_level: "medium",
          data: { posts_per_week: postsPerWeek, recent_posts: recentPosts.length }
        });

        if (postsPerWeek < 3) {
          actionables.push({
            user_id: userId,
            title: "Aumentar Frecuencia de Publicación",
            description: "Planifica publicar al menos 3-4 posts por semana para mantener el engagement",
            action_type: "posting_schedule",
            priority: "medium",
            estimated_impact: "Mejora en visibilidad del 20-30%"
          });
        }

        console.log('✅ Insight de frecuencia creado');
      }

      // Analizar plataformas más exitosas
      if (platformStats.length > 1) {
        const platformPerformance = platformStats
          .map(stats => ({
            platform: stats.platform,
            avgEngagement: stats.avgEngagement,
            totalPosts: stats.postsCount
          }))
          .sort((a, b) => b.avgEngagement - a.avgEngagement);

        const topPlatform = platformPerformance[0];
        const platformName = topPlatform.platform.charAt(0).toUpperCase() + topPlatform.platform.slice(1);

        insights.push({
          user_id: userId,
          title: "Plataforma Más Exitosa",
          description: `${platformName} es tu plataforma con mejor rendimiento (${topPlatform.avgEngagement.toFixed(1)}% engagement promedio).`,
          insight_type: "competitive_analysis",
          platforms: [topPlatform.platform],
          confidence_score: 0.85,
          impact_level: "high",
          data: { 
            best_platform: topPlatform.platform, 
            engagement_rate: topPlatform.avgEngagement,
            total_posts: topPlatform.totalPosts
          }
        });

        actionables.push({
          user_id: userId,
          title: "Enfocar Esfuerzos en Plataforma Principal",
          description: `Concentra más recursos en ${platformName} donde tienes mejor rendimiento`,
          action_type: "audience_targeting",
          priority: "high",
          estimated_impact: "Optimización del ROI en redes sociales"
        });

        console.log('✅ Insight de plataforma exitosa creado');
      }

      console.log(`💾 Guardando ${insights.length} insights y ${actionables.length} actionables...`);

      // Guardar insights con manejo de errores mejorado
      if (insights.length > 0) {
        const { data: insertedInsights, error: insightsError } = await supabase
          .from('marketing_insights')
          .insert(insights)
          .select();
        
        if (insightsError) {
          console.error('❌ Error guardando insights:', insightsError);
          throw new Error(`Error guardando insights: ${insightsError.message}`);
        }
        
        console.log('✅ Insights guardados:', insertedInsights?.length || 0);
      }
      
      // Guardar actionables con manejo de errores mejorado
      if (actionables.length > 0) {
        const { data: insertedActionables, error: actionablesError } = await supabase
          .from('marketing_actionables')
          .insert(actionables)
          .select();
        
        if (actionablesError) {
          console.error('❌ Error guardando actionables:', actionablesError);
          throw new Error(`Error guardando actionables: ${actionablesError.message}`);
        }
        
        console.log('✅ Actionables guardados:', insertedActionables?.length || 0);
      }

      console.log(`🎉 Proceso completado: ${insights.length} insights y ${actionables.length} actionables generados`);
      
    } catch (error: any) {
      console.error('❌ Error en generateBasicInsights:', error);
      throw error;
    }
  };

  const refreshAnalytics = async () => {
    await runAnalysis(); // Análisis completo de todas las plataformas
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'tiktok': return Music;
      case 'facebook': return Facebook;
      default: return Activity;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'linkedin': return 'from-blue-600 to-blue-700';
      case 'tiktok': return 'from-black to-gray-800';
      case 'facebook': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold">{analyticsData.posts.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Likes</p>
                <p className="text-2xl font-bold">
                  {analyticsData.posts.reduce((sum, post) => {
                    if (post.platform === 'instagram') return sum + (post.like_count || 0);
                    if (post.platform === 'tiktok') return sum + (post.digg_count || 0);
                    return sum + (post.likes || post.like_count || 0);
                  }, 0)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Insights</p>
                <p className="text-2xl font-bold">{analyticsData.insights.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acciones Pendientes</p>
                <p className="text-2xl font-bold">
                  {analyticsData.actionables.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {platformStats.map((stats, index) => {
          const PlatformIcon = getPlatformIcon(stats.platform);
          return (
            <Card key={index} className="overflow-hidden">
              <div className={`bg-gradient-to-r ${getPlatformColor(stats.platform)} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlatformIcon className="h-6 w-6" />
                    <div>
                      <h3 className="font-semibold capitalize">{stats.platform}</h3>
                      <p className="text-sm opacity-90">{stats.postsCount} posts analizados</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {stats.avgEngagement.toFixed(1)}% eng.
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <Heart className="h-4 w-4" />
                      Likes
                    </div>
                    <p className="text-lg font-semibold">{stats.totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                      <MessageCircle className="h-4 w-4" />
                      Comentarios
                    </div>
                    <p className="text-lg font-semibold">{stats.totalComments.toLocaleString()}</p>
                  </div>
                </div>
                
                {stats.topHashtags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      Top Hashtags
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {stats.topHashtags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {analyticsData.insights.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Insights Disponibles</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Ejecuta un análisis de posts para generar insights inteligentes sobre tu estrategia de contenido.
            </p>
            <Button onClick={refreshAnalytics} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generar Insights
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {analyticsData.insights.map((insight, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className={`pb-3 ${
                insight.impact_level === 'high' ? 'bg-red-50 border-b border-red-200' :
                insight.impact_level === 'medium' ? 'bg-yellow-50 border-b border-yellow-200' :
                'bg-green-50 border-b border-green-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className={`h-5 w-5 ${
                        insight.impact_level === 'high' ? 'text-red-600' :
                        insight.impact_level === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`} />
                      {insight.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      insight.impact_level === 'high' ? 'destructive' :
                      insight.impact_level === 'medium' ? 'default' : 'secondary'
                    }>
                      {insight.impact_level === 'high' ? 'Alto Impacto' :
                       insight.impact_level === 'medium' ? 'Medio Impacto' : 'Bajo Impacto'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.insight_type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {insight.data?.items && (
                  <div className="space-y-3">
                    {insight.data.items.slice(0, 3).map((item: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {insight.data?.recommendations && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recomendaciones
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(insight.data.recommendations).map(([key, recs]: [string, any]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground capitalize">
                            {key.replace('_', ' ')}
                          </p>
                          {Array.isArray(recs) ? recs.slice(0, 2).map((rec: string, i: number) => (
                            <p key={i} className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                              {rec}
                            </p>
                          )) : (
                            <p className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                              {typeof recs === 'string' ? recs : JSON.stringify(recs)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Confianza: {Math.round((insight.confidence_score || 0) * 100)}%</span>
                    <span>Plataformas: {insight.platforms?.join(', ')}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderActionables = () => (
    <div className="space-y-6">
      {analyticsData.actionables.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Acciones Pendientes</h3>
            <p className="text-muted-foreground">
              Todas las recomendaciones han sido completadas o no hay acciones disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {analyticsData.actionables.map((actionable, index) => (
            <Card key={index} className={`border-l-4 ${
              actionable.priority === 'high' ? 'border-l-red-500' :
              actionable.priority === 'medium' ? 'border-l-yellow-500' :
              'border-l-green-500'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{actionable.title}</h3>
                      <Badge variant={actionable.status === 'pending' ? 'default' : 'secondary'}>
                        {actionable.status === 'pending' ? 'Pendiente' : 'Completado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {actionable.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {actionable.action_type.replace('_', ' ')}
                      </span>
                      {actionable.estimated_impact && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Impacto {actionable.estimated_impact}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                      actionable.priority === 'high' ? 'destructive' :
                      actionable.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      Prioridad {actionable.priority}
                    </Badge>
                    {actionable.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(actionable.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Análisis de Redes Sociales</h2>
          <p className="text-muted-foreground">
            Insights inteligentes y métricas detalladas de tu presencia digital
          </p>
        </div>
        <Button onClick={refreshAnalytics} disabled={loading} className="flex items-center gap-2">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Actualizar Análisis
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="actionables" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Acciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {renderInsights()}
        </TabsContent>

        <TabsContent value="actionables" className="space-y-6">
          {renderActionables()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMediaAnalytics;