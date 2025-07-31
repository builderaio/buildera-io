import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock,
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Hash,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Zap,
  Star,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Timer,
  Award,
  Activity,
  PieChart,
  LineChart
} from "lucide-react";

interface AdvancedMarketingDashboardProps {
  profile: any;
}

interface AdvancedAnalysis {
  optimalTiming?: any;
  contentPerformance?: any;
  hashtagInsights?: any;
  sentimentAnalysis?: any;
  performancePredictions?: any;
  competitiveAnalysis?: any;
  summary?: any;
}

const AdvancedMarketingDashboard = ({ profile }: AdvancedMarketingDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AdvancedAnalysis>({});
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  useEffect(() => {
    if (profile?.user_id) {
      loadExistingAnalysis();
    }
  }, [profile?.user_id]);

  const loadExistingAnalysis = async () => {
    try {
      // Cargar insights existentes para mostrar datos previos
      const { data: insights, error } = await supabase
        .from('marketing_insights')
        .select('*')
        .eq('user_id', profile.user_id)
        .in('insight_type', ['optimal_timing', 'content_performance', 'sentiment_analysis', 'hashtag_optimization'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (insights && insights.length > 0) {
        const parsedAnalysis: AdvancedAnalysis = {};
        insights.forEach(insight => {
          switch (insight.insight_type) {
            case 'optimal_timing':
              parsedAnalysis.optimalTiming = insight.data;
              break;
            case 'content_performance':
              parsedAnalysis.contentPerformance = insight.data;
              break;
            case 'sentiment_analysis':
              parsedAnalysis.sentimentAnalysis = insight.data;
              break;
            case 'hashtag_optimization':
              parsedAnalysis.hashtagInsights = insight.data;
              break;
          }
        });
        setAnalysis(parsedAnalysis);
        setLastAnalysis(new Date(insights[0].created_at));
      }
    } catch (error: any) {
      console.error('Error loading existing analysis:', error);
    }
  };

  const runAdvancedAnalysis = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting advanced analysis...');
      
      // Primero obtener posts nuevos de Instagram si es necesario
      const { data: instagramData, error: instagramError } = await supabase.functions.invoke('instagram-scraper', {
        body: { 
          action: 'get_posts', 
          username_or_url: 'biury.co' // Esto debería venir del perfil conectado
        }
      });
      
      if (instagramError) {
        console.warn('Error obteniendo posts de Instagram:', instagramError);
      }
      
      // Ejecutar el análisis avanzado con los datos disponibles en BD
      const { data, error } = await supabase.functions.invoke('advanced-social-analyzer');
      
      if (error) throw error;
      
      if (data.success) {
        // Recargar datos existentes para mostrar análisis actualizado
        await loadExistingAnalysis();
        
        toast({
          title: "🎯 Análisis Avanzado Completado",
          description: `Se generaron ${data.insights_generated} insights con ${data.posts_analyzed || 0} posts analizados`,
        });
      }
    } catch (error: any) {
      console.error('Error running advanced analysis:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis avanzado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour: number) => {
    return hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const renderOptimalTiming = () => {
    if (!analysis.optimalTiming) return null;

    const { bestHours, bestDays, recommendations } = analysis.optimalTiming;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5" />
              Mejores Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {bestHours?.slice(0, 3).map((time: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{formatTime(time.hour)}</p>
                      <p className="text-sm text-muted-foreground">{time.posts} posts publicados</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{time.avgEngagement}</p>
                    <p className="text-xs text-muted-foreground">engagement promedio</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4 border-l-purple-500">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Calendar className="h-5 w-5" />
              Mejores Días
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {bestDays?.slice(0, 3).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{day.dayLabel}</p>
                      <p className="text-sm text-muted-foreground">{day.posts} posts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{day.avgEngagement}</p>
                    <p className="text-xs text-muted-foreground">engagement</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContentPerformance = () => {
    if (!analysis.contentPerformance) return null;

    const { byContentType, topPerformers } = analysis.contentPerformance;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Rendimiento por Tipo de Contenido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {byContentType?.map((type: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium capitalize">
                      {type.type.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-sm text-muted-foreground">{type.count} posts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{type.avgLikes}</p>
                      <p className="text-xs text-muted-foreground">likes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{type.avgComments}</p>
                      <p className="text-xs text-muted-foreground">comentarios</p>
                    </div>
                    <Badge variant={
                      type.performance === 'Alto' ? 'default' :
                      type.performance === 'Medio' ? 'secondary' : 'outline'
                    }>
                      {type.performance}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers?.map((post: any, index: number) => (
                <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-l-yellow-400">
                  <p className="text-sm mb-2">{post.caption}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3" />
                      {post.likes}
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSentimentAnalysis = () => {
    if (!analysis.sentimentAnalysis) return null;

    const sentiment = analysis.sentimentAnalysis;

    return (
      <Card className="overflow-hidden">
        <CardHeader className={`${getSentimentColor(sentiment.overall_sentiment)}`}>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Análisis de Sentimientos (IA)
            <Badge variant="outline" className="ml-auto">
              Confianza: {Math.round((sentiment.confidence_score || 0) * 100)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Tono de Marca</h4>
              <p className="text-muted-foreground mb-4">{sentiment.brand_tone}</p>
              
              <h4 className="font-semibold mb-3">Conexión con Audiencia</h4>
              <p className="text-muted-foreground">{sentiment.audience_connection}</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Emociones Generadas</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {sentiment.emotional_triggers?.map((emotion: string, index: number) => (
                  <Badge key={index} variant="secondary">{emotion}</Badge>
                ))}
              </div>
              
              <h4 className="font-semibold mb-3">Recomendaciones IA</h4>
              <ul className="space-y-2">
                {sentiment.recommendations?.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderHashtagInsights = () => {
    if (!analysis.hashtagInsights) return null;

    const { topPerforming } = analysis.hashtagInsights;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-pink-600" />
            Rendimiento de Hashtags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPerforming?.slice(0, 6).map((hashtag: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-pink-600">#{hashtag.hashtag}</span>
                  <Badge variant={
                    hashtag.performance === 'Excelente' ? 'default' :
                    hashtag.performance === 'Bueno' ? 'secondary' : 'outline'
                  }>
                    {hashtag.performance}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{hashtag.uses} usos</span>
                  <span>{hashtag.avgEngagement} engagement</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPerformancePredictions = () => {
    if (!analysis.performancePredictions) return null;

    const { trend, predictions } = analysis.performancePredictions;

    return (
      <Card className={`border-l-4 ${trend === 'ascending' ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trend === 'ascending' ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />}
            Predicciones de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className={trend === 'ascending' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={trend === 'ascending' ? 'text-green-800' : 'text-red-800'}>
                Tendencia: <strong>{trend === 'ascending' ? 'Crecimiento' : 'Declive'}</strong> en engagement
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {predictions?.map((prediction: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-sm">{prediction}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Análisis Avanzado con IA
          </h2>
          <p className="text-muted-foreground">
            Insights profesionales para optimizar tu estrategia digital
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastAnalysis && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastAnalysis.toLocaleDateString()}
            </Badge>
          )}
          <Button 
            onClick={runAdvancedAnalysis} 
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Timer className="h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Ejecutar Análisis
              </>
            )}
          </Button>
        </div>
      </div>

      {Object.keys(analysis).length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Análisis Avanzado Disponible</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Ejecuta un análisis completo con IA para obtener insights profesionales sobre tu estrategia de contenido, horarios óptimos, sentimientos y predicciones. Los datos se almacenan en tu base de datos para análisis futuro.
            </p>
            <Button 
              onClick={runAdvancedAnalysis} 
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Comenzar Análisis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Timing Analysis */}
          {analysis.optimalTiming && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                Horarios Óptimos de Publicación
              </h3>
              {renderOptimalTiming()}
            </div>
          )}

          {/* Content Performance */}
          {analysis.contentPerformance && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Análisis de Rendimiento de Contenido
              </h3>
              {renderContentPerformance()}
            </div>
          )}

          {/* Sentiment Analysis */}
          {analysis.sentimentAnalysis && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Análisis de Sentimientos y Percepción
              </h3>
              {renderSentimentAnalysis()}
            </div>
          )}

          {/* Hashtag Insights */}
          {analysis.hashtagInsights && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-pink-600" />
                Optimización de Hashtags
              </h3>
              {renderHashtagInsights()}
            </div>
          )}

          {/* Performance Predictions */}
          {analysis.performancePredictions && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-orange-600" />
                Predicciones y Tendencias
              </h3>
              {renderPerformancePredictions()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedMarketingDashboard;