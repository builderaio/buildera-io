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
      const [insightsRes, actionablesRes, postsRes, analyticsRes] = await Promise.all([
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
        
        supabase
          .from('instagram_posts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false }),
        
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
      if (postsRes.error) {
        console.error('Error loading posts:', postsRes.error);
        throw postsRes.error;
      }
      if (analyticsRes.error) {
        console.error('Error loading analytics:', analyticsRes.error);
        throw analyticsRes.error;
      }

      const data = {
        insights: insightsRes.data || [],
        actionables: actionablesRes.data || [],
        posts: postsRes.data || [],
        analytics: analyticsRes.data || [],
        embeddings: []
      };

      console.log('📈 Data loaded:', {
        insights: data.insights.length,
        actionables: data.actionables.length,
        posts: data.posts.length,
        analytics: data.analytics.length
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
    const platforms = ['instagram', 'linkedin', 'tiktok'];
    const stats: PlatformStats[] = [];

    platforms.forEach(platform => {
      const platformPosts = data.posts.filter(post => 
        platform === 'instagram' // Por ahora solo tenemos posts de Instagram
      );

      if (platformPosts.length > 0) {
        const totalLikes = platformPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
        const totalComments = platformPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const avgEngagement = platformPosts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / platformPosts.length;
        
        // Extraer hashtags más comunes
        const allHashtags = platformPosts.flatMap(post => post.hashtags || []);
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

  const refreshAnalytics = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting analytics refresh...');
      
      // Primero obtener posts nuevos
      const { data: scraperData, error: scraperError } = await supabase.functions.invoke('instagram-scraper', {
        body: { 
          action: 'get_posts', 
          username_or_url: 'biury.co' // Esto debería venir del perfil conectado
        }
      });

      if (scraperError) {
        console.warn('⚠️ Error obteniendo posts:', scraperError);
        // No fallar aquí, continuar con análisis de datos existentes
      }

      // Ejecutar análisis avanzado con mejor manejo de errores
      console.log('📊 Ejecutando análisis avanzado...');
      const { data, error } = await supabase.functions.invoke('advanced-social-analyzer');
      
      if (error) {
        console.error('❌ Error en análisis avanzado:', error);
        throw new Error(`Error en análisis: ${error.message || 'Error desconocido'}`);
      }
      
      // Reload data after analysis
      await loadAnalyticsData();
      
      const newPostsCount = scraperData?.new_posts_count || 0;
      
      toast({
        title: "Análisis actualizado",
        description: `Se generaron nuevos insights. ${newPostsCount > 0 ? `Se agregaron ${newPostsCount} posts nuevos.` : 'Los datos están actualizados.'}`,
      });
    } catch (error: any) {
      console.error('Error refreshing analytics:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el análisis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'linkedin': return Linkedin;
      case 'tiktok': return Music;
      default: return Activity;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'from-purple-500 to-pink-500';
      case 'linkedin': return 'from-blue-600 to-blue-700';
      case 'tiktok': return 'from-black to-gray-800';
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
                  {analyticsData.posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
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
                          {recs.slice(0, 2).map((rec: string, i: number) => (
                            <p key={i} className="text-xs bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                              {rec}
                            </p>
                          ))}
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