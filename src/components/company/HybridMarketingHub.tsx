import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Database, Brain, TrendingUp, Search, Zap, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ProcessingJob {
  id: string;
  platform: string;
  job_type: string;
  status: string;
  progress: number;
  total_items: number;
  processed_items: number;
  error_message?: string;
  created_at: string;
}

interface ContentCluster {
  id: string;
  cluster_name: string;
  platform: string;
  content_theme: string;
  post_count: number;
  avg_engagement: number;
  top_hashtags: string[];
  representative_posts: string[];
}

interface ContentRecommendation {
  id: string;
  platform: string;
  recommendation_type: string;
  title: string;
  description: string;
  confidence_score: number;
  status: string;
  suggested_content: any;
  created_at: string;
}

interface SemanticStats {
  totalEmbeddings: number;
  totalClusters: number;
  totalRecommendations: number;
  averageConfidence: number;
}

const HybridMarketingHub: React.FC = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [clusters, setClusters] = useState<ContentCluster[]>([]);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [semanticStats, setSemanticStats] = useState<SemanticStats>({
    totalEmbeddings: 0,
    totalClusters: 0,
    totalRecommendations: 0,
    averageConfidence: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingPlatform, setProcessingPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndData();
    
    // Polling para jobs en progreso
    const interval = setInterval(() => {
      if (jobs.some(job => job.status === 'processing')) {
        loadJobs();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const loadUserAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);
      await Promise.all([
        loadJobs(),
        loadClusters(),
        loadRecommendations(),
        loadSemanticStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Error cargando datos del Marketing Hub",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('data_processing_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading jobs:', error);
      return;
    }

    setJobs(data || []);
  };

  const loadClusters = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('content_clusters')
      .select('*')
      .eq('user_id', user.id)
      .order('avg_engagement', { ascending: false });

    if (error) {
      console.error('Error loading clusters:', error);
      return;
    }

    setClusters(data || []);
  };

  const loadRecommendations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('confidence_score', { ascending: false });

    if (error) {
      console.error('Error loading recommendations:', error);
      return;
    }

    setRecommendations(data || []);
  };

  const loadSemanticStats = async () => {
    if (!user) return;

    const [embeddingsCount, clustersCount, recommendationsCount] = await Promise.all([
      supabase.from('content_embeddings').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('content_clusters').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('content_recommendations').select('confidence_score').eq('user_id', user.id).eq('status', 'active')
    ]);

    const avgConfidence = recommendationsCount.data?.length 
      ? recommendationsCount.data.reduce((sum, r) => sum + r.confidence_score, 0) / recommendationsCount.data.length
      : 0;

    setSemanticStats({
      totalEmbeddings: embeddingsCount.count || 0,
      totalClusters: clustersCount.count || 0,
      totalRecommendations: recommendationsCount.data?.length || 0,
      averageConfidence: avgConfidence
    });
  };

  const startBulkSync = async (platform: string) => {
    try {
      setProcessingPlatform(platform);
      
      const { data, error } = await supabase.functions.invoke('social-media-bulk-processor', {
        body: { userId: user.id, platform, syncType: 'full_sync' }
      });

      if (error) throw error;

      toast({
        title: "Sincronización Iniciada",
        description: `Procesando un año de datos de ${platform}. Esto puede tomar varios minutos.`,
      });

      // Recargar jobs
      await loadJobs();
    } catch (error) {
      console.error('Error starting bulk sync:', error);
      toast({
        title: "Error",
        description: `Error iniciando sincronización de ${platform}`,
        variant: "destructive",
      });
    } finally {
      setProcessingPlatform(null);
    }
  };

  const searchSimilarContent = async (postId: string) => {
    try {
      // En un caso real, esto buscaría contenido similar usando vector similarity
      toast({
        title: "Búsqueda Semántica",
        description: "Funcionalidad de búsqueda por similitud en desarrollo",
      });
    } catch (error) {
      console.error('Error searching similar content:', error);
    }
  };

  const implementRecommendation = async (recommendationId: string) => {
    try {
      await supabase
        .from('content_recommendations')
        .update({ status: 'implemented' })
        .eq('id', recommendationId);

      await loadRecommendations();
      
      toast({
        title: "Recomendación Implementada",
        description: "La recomendación ha sido marcada como implementada",
      });
    } catch (error) {
      console.error('Error implementing recommendation:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons = {
      'linkedin': '💼',
      'instagram': '📸',
      'facebook': '👥',
      'tiktok': '🎵'
    };
    return icons[platform] || '📱';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-500',
      'processing': 'bg-blue-500',
      'completed': 'bg-green-500',
      'failed': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando Marketing Hub Híbrido...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Marketing Hub Híbrido
          </CardTitle>
          <CardDescription>
            Análisis avanzado con SQL tradicional + Vector Store para análisis semántico profundo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{semanticStats.totalEmbeddings}</div>
              <div className="text-sm text-muted-foreground">Embeddings Generados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{semanticStats.totalClusters}</div>
              <div className="text-sm text-muted-foreground">Clusters de Contenido</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{semanticStats.totalRecommendations}</div>
              <div className="text-sm text-muted-foreground">Recomendaciones Activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(semanticStats.averageConfidence * 100)}%</div>
              <div className="text-sm text-muted-foreground">Confianza Promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sync">Sincronización</TabsTrigger>
          <TabsTrigger value="clusters">Análisis Semántico</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones IA</TabsTrigger>
          <TabsTrigger value="jobs">Estado de Jobs</TabsTrigger>
        </TabsList>

        {/* Tab de Sincronización */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sincronización Masiva de Datos
              </CardTitle>
              <CardDescription>
                Obtén un año completo de contenido de cada red social con procesamiento híbrido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['linkedin', 'instagram', 'facebook', 'tiktok'].map(platform => (
                  <Card key={platform} className="border-2">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{getPlatformIcon(platform)}</div>
                      <h3 className="font-semibold capitalize mb-2">{platform}</h3>
                      <Button
                        onClick={() => startBulkSync(platform)}
                        disabled={processingPlatform === platform}
                        className="w-full"
                      >
                        {processingPlatform === platform ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Sincronizar Año
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Clusters Semánticos */}
        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Clusters de Contenido por Similitud Semántica
              </CardTitle>
              <CardDescription>
                Agrupaciones automáticas de contenido basadas en análisis vectorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clusters.map(cluster => (
                  <Card key={cluster.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getPlatformIcon(cluster.platform)}</span>
                            <h3 className="font-semibold">{cluster.cluster_name}</h3>
                            <Badge variant="secondary">{cluster.platform}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Tema: {cluster.content_theme}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Posts:</span> {cluster.post_count}
                            </div>
                            <div>
                              <span className="font-medium">Engagement Avg:</span> {Math.round(cluster.avg_engagement)}
                            </div>
                            <div>
                              <span className="font-medium">Top Hashtags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {cluster.top_hashtags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => searchSimilarContent(cluster.representative_posts[0])}
                        >
                          <Search className="w-4 h-4 mr-1" />
                          Explorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {clusters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay clusters generados aún</p>
                    <p className="text-sm">Sincroniza datos de redes sociales para generar análisis semántico</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Recomendaciones */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recomendaciones Basadas en IA
              </CardTitle>
              <CardDescription>
                Sugerencias de contenido generadas por análisis semántico y de rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map(rec => (
                  <Card key={rec.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getPlatformIcon(rec.platform)}</span>
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge 
                              variant={rec.confidence_score > 0.8 ? "default" : "secondary"}
                            >
                              {Math.round(rec.confidence_score * 100)}% confianza
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {rec.description}
                          </p>
                          {rec.suggested_content && (
                            <div className="bg-muted/50 p-3 rounded-md text-sm">
                              <strong>Contenido sugerido:</strong>
                              <div className="mt-1">
                                {rec.suggested_content.theme && (
                                  <div>Tema: {rec.suggested_content.theme}</div>
                                )}
                                {rec.suggested_content.hashtags && (
                                  <div className="flex gap-1 mt-1">
                                    {rec.suggested_content.hashtags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => implementRecommendation(rec.id)}
                          size="sm"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          Implementar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {recommendations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay recomendaciones disponibles</p>
                    <p className="text-sm">Las recomendaciones se generan después del análisis semántico</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Jobs */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Estado de Procesamiento
              </CardTitle>
              <CardDescription>
                Monitoreo de jobs de sincronización y análisis en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card key={job.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(job.status)}`} />
                          <span className="text-lg">{getPlatformIcon(job.platform)}</span>
                          <div>
                            <h3 className="font-semibold capitalize">
                              {job.job_type.replace('_', ' ')} - {job.platform}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {job.status === 'processing' && `${job.processed_items}/${job.total_items} items`}
                              {job.status === 'completed' && `Completado: ${job.processed_items} items`}
                              {job.status === 'failed' && job.error_message}
                            </p>
                          </div>
                        </div>
                        <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="space-y-2">
                          <Progress value={job.progress} className="w-full" />
                          <p className="text-sm text-muted-foreground text-center">
                            {job.progress}% completado
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay jobs de procesamiento</p>
                    <p className="text-sm">Los jobs aparecerán aquí cuando inicies una sincronización</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HybridMarketingHub;