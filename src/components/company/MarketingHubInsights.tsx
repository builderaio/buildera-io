import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Eye, 
  MessageCircle, 
  Share2, 
  Heart,
  BarChart3,
  Target,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Linkedin,
  Instagram,
  Facebook
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketingInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  data: any;
  confidence_score: number;
  impact_level: string;
  platforms: string[];
  created_at: string;
}

interface MarketingActionable {
  id: string;
  insight_id: string;
  title: string;
  description: string;
  action_type: string;
  priority: string;
  status: string;
  estimated_impact: string;
  created_at: string;
}

interface SocialMediaPost {
  id: string;
  platform?: string;
  content?: string;
  caption?: string;
  metrics?: any;
  published_at?: string;
  posted_at?: string;
  hashtags?: string[];
  like_count?: number;
  comment_count?: number;
  engagement_rate?: number;
}

interface SocialMediaAnalytics {
  platform: string;
  metric_type: string;
  value: number;
  metadata: any;
}

export default function MarketingHub() {
  const [insights, setInsights] = useState<MarketingInsight[]>([]);
  const [actionables, setActionables] = useState<MarketingActionable[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [analytics, setAnalytics] = useState<SocialMediaAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<string | null>(null);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-pink-600' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-700' },
    { id: 'tiktok', name: 'TikTok', icon: MessageCircle, color: 'bg-black' }
  ];

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🚫 No authenticated user found');
        return;
      }

      console.log('📊 Loading marketing data for user:', user.id);

      // Cargar insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('marketing_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (insightsError) {
        console.error('Error loading insights:', insightsError);
        throw insightsError;
      }
      console.log('💡 Insights loaded:', insightsData?.length || 0);
      setInsights(insightsData || []);

      // Cargar accionables
      const { data: actionablesData, error: actionablesError } = await supabase
        .from('marketing_actionables')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (actionablesError) {
        console.error('Error loading actionables:', actionablesError);
        throw actionablesError;
      }
      console.log('🎯 Actionables loaded:', actionablesData?.length || 0);
      setActionables(actionablesData || []);

      // Cargar posts de Instagram (principal tabla disponible)
      const { data: postsData, error: postsError } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('posted_at', { ascending: false })
        .limit(20);

      if (postsError) {
        console.error('Error loading posts:', postsError);
        // No lanzar error, solo logear
      }

      // Transformar posts de Instagram al formato esperado
      const transformedPosts = (postsData || []).map(post => ({
        ...post,
        platform: 'instagram',
        content: post.caption || '',
        published_at: post.posted_at,
        metrics: {
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          shares: 0, // Instagram posts no tienen shares directos
          engagement: post.engagement_rate || 0,
          views: post.video_view_count || post.impressions || 0
        }
      }));
      
      console.log('📱 Posts loaded:', transformedPosts.length, 'from Instagram');
      setPosts(transformedPosts);

      // Cargar analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('social_media_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analyticsError) {
        console.error('Error loading analytics:', analyticsError);
        throw analyticsError;
      }
      console.log('📈 Analytics loaded:', analyticsData?.length || 0);
      setAnalytics(analyticsData || []);

    } catch (error) {
      console.error('Error loading marketing data:', error);
      toast.error(`Error al cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const analyzePlatformData = async (platformId: string) => {
    setProcessingPlatform(platformId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log(`🚀 Starting analysis for ${platformId} and saving to database`);

      // Obtener información de la empresa para usar URLs específicas
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const company = companies?.[0];
      if (!company) {
        toast.error('No se encontró información de empresa');
        return;
      }

      let analysisResult = null;
      let scraperResult = null;

      switch (platformId) {
        case 'instagram':
          if (company.instagram_url) {
            // Extraer username de la URL
            const username = company.instagram_url.split('/').pop()?.replace('@', '');
            if (username) {
              console.log('📊 Scraping Instagram posts...');
              // Obtener posts
              const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('instagram-scraper', {
                body: { action: 'get_posts', username_or_url: username }
              });
              
              if (scrapeError) {
                console.error('Error scraping Instagram:', scrapeError);
                throw scrapeError;
              }
              
              scraperResult = scrapeData;
              
              console.log('🧠 Running intelligent analysis...');
              // Análisis inteligente que guarda en BD
              const { data, error } = await supabase.functions.invoke('instagram-intelligent-analysis');
              if (error) {
                console.error('Error in Instagram analysis:', error);
                throw error;
              }
              analysisResult = data;
              
              // Ejecutar análisis avanzado adicional
              console.log('📈 Running advanced calendar analysis...');
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'instagram',
                  action: 'process_calendar_data'
                }
              });
              
              // Analizar ubicación de seguidores
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'instagram',
                  action: 'analyze_followers_location'
                }
              });
              
              // Generar insights de audiencia
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'instagram',
                  action: 'generate_audience_insights'
                }
              });
            }
          }
          break;

        case 'facebook':
          if (company.facebook_url) {
            console.log('📊 Running Facebook intelligent analysis...');
            const { data, error } = await supabase.functions.invoke('facebook-intelligent-analysis');
            if (error) {
              console.error('Error in Facebook analysis:', error);
              throw error;
            }
            analysisResult = data;
            
            // Análisis avanzado para Facebook
            await supabase.functions.invoke('advanced-social-analyzer', {
              body: {
                platform: 'facebook',
                action: 'process_calendar_data'
              }
            });
          }
          break;

        case 'linkedin':
          if (company.linkedin_url) {
            const identifier = company.linkedin_url.match(/linkedin\.com\/company\/([a-zA-Z0-9-_]+)/)?.[1];
            if (identifier) {
              console.log('📊 Scraping LinkedIn company posts...');
              // Obtener posts de la empresa
              const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('linkedin-scraper', {
                body: { 
                  action: 'get_company_posts', 
                  company_identifier: identifier 
                }
              });
              
              if (scrapeError) {
                console.error('Error scraping LinkedIn:', scrapeError);
                throw scrapeError;
              }
              
              scraperResult = scrapeData;
              
              // Procesar datos en calendario y generar análisis
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'linkedin',
                  action: 'process_calendar_data'
                }
              });
              
              analysisResult = { success: true, platform: 'linkedin' };
            }
          }
          break;

        case 'tiktok':
          if (company.tiktok_url) {
            const username = company.tiktok_url.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/)?.[1];
            if (username) {
              console.log('📊 Scraping TikTok posts...');
              // Obtener posts
              const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('tiktok-scraper', {
                body: { 
                  action: 'get_posts', 
                  unique_id: username 
                }
              });
              
              if (scrapeError) {
                console.error('Error scraping TikTok:', scrapeError);
                throw scrapeError;
              }
              
              scraperResult = scrapeData;
              
              // Análisis avanzado para TikTok
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'tiktok',
                  action: 'process_calendar_data'
                }
              });
              
              await supabase.functions.invoke('advanced-social-analyzer', {
                body: {
                  platform: 'tiktok',
                  action: 'analyze_followers_location'
                }
              });
              
              analysisResult = { success: true, platform: 'tiktok' };
            }
          }
          break;

        default:
          toast.info(`Análisis para ${platformId} estará disponible próximamente`);
      }

      if (analysisResult) {
        toast.success(`Análisis completado para ${platformId} - ${analysisResult.insights_generated || 0} insights generados`);
      }

      await loadMarketingData(); // Recargar datos
    } catch (error) {
      console.error('Error analyzing platform:', error);
      toast.error(`Error al analizar ${platformId}: ${error.message}`);
    } finally {
      setProcessingPlatform(null);
    }
  };

  const updateActionableStatus = async (actionableId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('marketing_actionables')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', actionableId);

      if (error) throw error;

      setActionables(prev => prev.map(actionable => 
        actionable.id === actionableId 
          ? { ...actionable, status: newStatus }
          : actionable
      ));

      toast.success('Estado actualizado');
    } catch (error) {
      console.error('Error updating actionable:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform);
    const Icon = platformData?.icon || MessageCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    loadMarketingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const platformEngagement = analytics.filter(a => a.metric_type === 'engagement_rate');
  const totalPosts = posts.length;
  const avgEngagement = platformEngagement.length > 0 
    ? platformEngagement.reduce((sum, a) => sum + a.value, 0) / platformEngagement.length 
    : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Marketing Hub</h2>
          <p className="text-muted-foreground">
            Analiza el rendimiento de tus redes sociales y obtén insights accionables
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Posts Analizados</p>
                <p className="text-2xl font-bold">{totalPosts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Promedio</p>
                <p className="text-2xl font-bold">{avgEngagement.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Insights Generados</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accionables Pendientes</p>
                <p className="text-2xl font-bold">
                  {actionables.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plataformas conectadas */}
      <Card>
        <CardHeader>
          <CardTitle>Plataformas Conectadas</CardTitle>
          <CardDescription>
            Analiza datos de tus redes sociales para generar insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform) => {
              const platformPosts = posts.filter(p => p.platform === platform.id);
              const platformInsights = insights.filter(i => i.platforms.includes(platform.id));
              const isProcessing = processingPlatform === platform.id;
              
              return (
                <div key={platform.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${platform.color} text-white`}>
                      {getPlatformIcon(platform.id)}
                    </div>
                    <div>
                      <h4 className="font-medium">{platform.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {platformPosts.length} posts • {platformInsights.length} insights
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="font-medium">{platformPosts.length}</p>
                      <p className="text-muted-foreground">Posts</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="font-medium">{platformInsights.length}</p>
                      <p className="text-muted-foreground">Insights</p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => analyzePlatformData(platform.id)}
                    disabled={isProcessing}
                    size="sm"
                    className="w-full"
                    variant={platformPosts.length > 0 ? "default" : "outline"}
                  >
                    {isProcessing ? 'Analizando...' : platformPosts.length > 0 ? 'Analizar Datos' : 'Conectar'}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="actionables">Accionables</TabsTrigger>
          <TabsTrigger value="posts">Posts Recientes</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay insights disponibles</h3>
                  <p className="text-muted-foreground">
                    Conecta y analiza tus redes sociales para generar insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {insight.platforms.map(platform => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {getPlatformIcon(platform)}
                              <span className="ml-1 capitalize">{platform}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getImpactColor(insight.impact_level)}`} />
                        <span className="text-sm text-muted-foreground">
                          {insight.confidence_score * 100}% confianza
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{insight.description}</p>
                    {insight.data && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {Object.entries(insight.data).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="font-medium">
                              {typeof value === 'number' 
                                ? value.toFixed(1) 
                                : typeof value === 'string' 
                                  ? value 
                                  : JSON.stringify(value)
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="actionables" className="space-y-4">
          <div className="grid gap-4">
            {actionables.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay accionables disponibles</h3>
                  <p className="text-muted-foreground">
                    Los accionables se generarán automáticamente con los insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              actionables.map((actionable) => (
                <Card key={actionable.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h4 className="font-medium">{actionable.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {actionable.description}
                        </p>
                        {actionable.estimated_impact && (
                          <p className="text-xs text-green-600">
                            💡 {actionable.estimated_impact}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(actionable.priority)}>
                          {actionable.priority}
                        </Badge>
                        <Badge variant={actionable.status === 'completed' ? 'default' : 'secondary'}>
                          {actionable.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {actionable.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {actionable.status !== 'completed' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateActionableStatus(actionable.id, 'in_progress')}
                          disabled={actionable.status === 'in_progress'}
                        >
                          En Progreso
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateActionableStatus(actionable.id, 'completed')}
                        >
                          Marcar Completado
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay posts analizados</h3>
                  <p className="text-muted-foreground">
                    Conecta tus redes sociales para comenzar el análisis
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.slice(0, 10).map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(post.platform)}
                        <span className="font-medium capitalize">{post.platform}</span>
                        <span className="text-xs text-muted-foreground">
                           {new Date(post.published_at || post.posted_at || '').toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 line-clamp-2">{post.content || post.caption || ''}</p>
                    
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.hashtags.slice(0, 3).map((hashtag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {post.metrics && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-xs">
                        {Object.entries(post.metrics).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            {key === 'likes' && <Heart className="h-3 w-3" />}
                            {key === 'comments' && <MessageCircle className="h-3 w-3" />}
                            {key === 'shares' && <Share2 className="h-3 w-3" />}
                             {key === 'views' && <Eye className="h-3 w-3" />}
                             <span className="capitalize">{key}:</span>
                             <span className="font-medium">
                               {typeof value === 'number' 
                                 ? value.toLocaleString() 
                                 : typeof value === 'string' 
                                   ? value 
                                   : JSON.stringify(value)
                               }
                             </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}