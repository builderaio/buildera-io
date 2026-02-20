import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
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
  LineChart,
  AlertTriangle,
  CheckCircle2
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
  summary?: any; // Usado para growth_strategies
}

const AdvancedMarketingDashboard = ({ profile }: AdvancedMarketingDashboardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AdvancedAnalysis>({});
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(6);
  const [stepDetails, setStepDetails] = useState({ title: '', description: '' });

  useEffect(() => {
    if (profile?.user_id) {
      loadExistingAnalysis();
    }
  }, [profile?.user_id]);

  const loadExistingAnalysis = async () => {
    try {
      console.log('🔍 Loading comprehensive analysis for user:', profile.user_id);
      
      // Cargar insights existentes para mostrar datos previos (incluye análisis premium)
      const { data: insights, error } = await supabase
        .from('marketing_insights')
        .select('*')
        .eq('user_id', profile.user_id)
        .in('insight_type', ['optimal_timing', 'content_performance', 'sentiment_analysis', 'hashtag_optimization', 'performance_predictions', 'competitive_analysis', 'growth_strategies', 'premium_strategic_analysis'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading insights:', error);
        throw error;
      }

      console.log('📊 Found insights:', insights?.length || 0);

      if (insights && insights.length > 0) {
        const parsedAnalysis: AdvancedAnalysis = {};
        insights.forEach(insight => {
          console.log('Processing insight:', insight.insight_type);
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
            case 'performance_predictions':
              parsedAnalysis.performancePredictions = insight.data;
              break;
            case 'competitive_analysis':
              parsedAnalysis.competitiveAnalysis = insight.data;
              break;
            case 'growth_strategies':
              parsedAnalysis.summary = insight.data; // Usar summary para growth_strategies
              break;
          }
        });
        setAnalysis(parsedAnalysis);
        setLastAnalysis(new Date(insights[0].created_at));
      } else {
        console.log('📝 No existing insights found');
        setAnalysis({});
        setLastAnalysis(null);
      }
    } catch (error: any) {
      console.error('Error loading existing analysis:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los análisis existentes",
        variant: "destructive",
      });
    }
  };

  const runAdvancedAnalysis = async () => {
    setLoading(true);
    setCurrentStep(0);
    
    const updateStep = (step: number, title: string, description: string) => {
      setCurrentStep(step);
      setStepDetails({ title, description });
    };
    
    try {
      console.log('🚀 Starting comprehensive advanced analysis...');
      
      updateStep(1, "Inicializando análisis", "Verificando conexiones y configuración...");
      
      toast({
        title: "🔄 Iniciando análisis avanzado integral",
        description: "Analizando todas las plataformas conectadas...",
      });

      // Verificar conexiones disponibles
      const { data: companies } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const company = companies?.[0];
      if (!company) {
        throw new Error('No se encontró información de empresa');
      }

      let totalInsights = 0;
      let totalPosts = 0;
      let totalPlataformas = 0;
      const processedPlatforms = [];
      const errors = [];

      // Función para procesar cada plataforma
      const processPlatform = async (platformName: string, urlField: string) => {
        if (company[urlField]) {
          try {
            updateStep(2, `Analizando ${platformName}`, `Procesando datos de ${platformName}...`);
            console.log(`📊 Procesando ${platformName}...`);
            
            // Verificar primero si hay posts disponibles para esta plataforma
            let existingPosts = null;
            let postsCount = 0;
            switch (platformName.toLowerCase()) {
              case 'instagram':
                const { data: instagramPosts, count: igCount } = await supabase
                  .from('instagram_posts')
                  .select('id', { count: 'exact' })
                  .eq('user_id', profile.user_id);
                existingPosts = instagramPosts;
                postsCount = igCount || 0;
                break;
              case 'linkedin':
                const { data: linkedinPosts, count: liCount } = await supabase
                  .from('linkedin_posts')
                  .select('id', { count: 'exact' })
                  .eq('user_id', profile.user_id);
                existingPosts = linkedinPosts;
                postsCount = liCount || 0;
                break;
              case 'facebook':
                const { data: facebookPosts, count: fbCount } = await supabase
                  .from('facebook_posts')
                  .select('id', { count: 'exact' })
                  .eq('user_id', profile.user_id);
                existingPosts = facebookPosts;
                postsCount = fbCount || 0;
                break;
              case 'tiktok':
                const { data: tiktokPosts, count: ttCount } = await supabase
                  .from('tiktok_posts')
                  .select('id', { count: 'exact' })
                  .eq('user_id', profile.user_id);
                existingPosts = tiktokPosts;
                postsCount = ttCount || 0;
                break;
            }

            if (!existingPosts || existingPosts.length === 0) {
              console.log(`⚠️ No posts found for ${platformName}, skipping...`);
              errors.push(`No hay datos disponibles para ${platformName}. Conecta e importa datos primero.`);
              return;
            }
            
            console.log(`📊 Found ${postsCount} posts for ${platformName}`);

            const { data: analysisResult } = await supabase.functions.invoke('advanced-social-analyzer', {
              body: { platform: platformName.toLowerCase(), action: 'process_calendar_data' }
            });

            if (analysisResult?.success) {
              const insights = analysisResult.insights_generated || 0;
              const posts = analysisResult.posts_analyzed || postsCount;
              totalInsights += insights;
              totalPosts += posts;
              totalPlataformas++;
              processedPlatforms.push(platformName);
              console.log(`✅ ${platformName}: ${insights} insights generados de ${posts} posts`);
            } else {
              // Aunque falle el análisis, contamos los posts encontrados
              if (postsCount > 0) {
                totalPosts += postsCount;
                totalPlataformas++;
                processedPlatforms.push(platformName);
                console.log(`⚠️ ${platformName}: ${postsCount} posts encontrados pero el análisis falló`);
              }
              errors.push(`Error en análisis de ${platformName}: ${analysisResult?.message || 'Error desconocido'}`);
            }

            // Análisis premium de IA (solo una vez por sesión, independiente de plataforma)
            if (platformName === 'Instagram') { // Solo ejecutar una vez
              try {
                updateStep(4, "Análisis con IA Avanzada", "Ejecutando análisis estratégico premium...");
                console.log('🧠 Ejecutando análisis estratégico premium de IA...');
                const { data: premiumAnalysis, error: premiumError } = await supabase.functions.invoke('premium-ai-insights', {
                  body: { platform: null } // Analizar todas las plataformas
                });
                
                if (premiumError) {
                  console.error('Error en análisis premium:', premiumError);
                } else {
                  console.log(`🎉 Análisis premium completado: ${premiumAnalysis.posts_analyzed} posts analizados, ${premiumAnalysis.total_data_points} puntos de datos`);
                  
                  toast({
                    title: "🧠 Análisis Premium Completado",
                    description: `Se analizaron ${premiumAnalysis.total_data_points} puntos de datos con IA avanzada`,
                  });
                }
              } catch (error) {
                console.error('Error en análisis premium de IA:', error);
              }
            }

          } catch (error) {
            console.error(`Error en análisis de ${platformName}:`, error);
            errors.push(`Error procesando ${platformName}: ${error.message}`);
          }
        } else {
          console.log(`⚠️ ${platformName} no está conectado (no hay URL configurada)`);
        }
      };

      // Procesar todas las plataformas en paralelo para mayor eficiencia
      await Promise.all([
        processPlatform('Instagram', 'instagram_url'),
        processPlatform('LinkedIn', 'linkedin_url'),
        processPlatform('Facebook', 'facebook_url'),
        processPlatform('TikTok', 'tiktok_url')
      ]);

      // Análisis cross-platform si hay múltiples plataformas
      if (totalPlataformas > 1) {
        updateStep(5, "Análisis Cross-Platform", "Integrando datos de múltiples plataformas...");
        console.log('🔄 Ejecutando análisis cross-platform...');
        try {
          await supabase.functions.invoke('content-insights-generator', {
            body: { platform: null, mode: 'cross_platform' }
          });
          console.log('✅ Análisis cross-platform completado');
        } catch (error) {
          console.error('Error en análisis cross-platform:', error);
          errors.push('Error en análisis cross-platform');
        }
      }

      // Recargar datos existentes para mostrar análisis actualizado
      updateStep(6, "Finalizando", "Cargando resultados del análisis...");
      await loadExistingAnalysis();

      if (processedPlatforms.length === 0) {
        let errorMessage = 'No se encontraron plataformas con datos para analizar.\n\n';
        errorMessage += 'Acciones necesarias:\n';
        errorMessage += '1. Ve a la pestaña "Redes Sociales"\n';
        errorMessage += '2. Conecta tus plataformas (Instagram, LinkedIn, etc.)\n';
        errorMessage += '3. Importa datos usando los botones "Analizar"\n';
        errorMessage += '4. Regresa aquí para ejecutar el análisis avanzado';
        
        if (errors.length > 0) {
          errorMessage += '\n\nDetalles de errores:\n' + errors.join('\n');
        }
        
        throw new Error(errorMessage);
      }

      let successMessage = `✅ Análisis completado exitosamente!\n\n`;
      successMessage += `📊 Plataformas analizadas: ${processedPlatforms.join(', ')}\n`;
      successMessage += `🎯 Total insights generados: ${totalInsights}\n`;
      successMessage += `📝 Posts analizados: ${totalPosts}`;

      if (errors.length > 0) {
        successMessage += `\n\n⚠️ Advertencias:\n${errors.join('\n')}`;
      }

      toast({
        title: "🎯 Análisis Avanzado Completado",
        description: successMessage,
      });

    } catch (error: any) {
      console.error('Error running advanced analysis:', error);
      toast({
        title: "Error en Análisis Avanzado",
        description: error.message || "No se pudo completar el análisis avanzado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCurrentStep(0);
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

    const { trend, predictions, growthRate, risks, opportunities } = analysis.performancePredictions;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  Tendencia: <strong>{trend === 'ascending' ? 'Crecimiento' : 'Declive'}</strong> ({growthRate || 'N/A'})
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Riesgos y Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {risks && risks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <ArrowDown className="h-4 w-4" />
                    Riesgos Identificados
                  </h4>
                  <div className="space-y-2">
                    {risks.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-red-800">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {opportunities && opportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                    <ArrowUp className="h-4 w-4" />
                    Oportunidades
                  </h4>
                  <div className="space-y-2">
                    {opportunities.map((opportunity: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm text-green-800">{opportunity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCompetitiveAnalysis = () => {
    if (!analysis.competitiveAnalysis) return null;

    const { positioning, opportunities, threats, recommendations } = analysis.competitiveAnalysis;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Eye className="h-5 w-5" />
              Posicionamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{positioning}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Star className="h-5 w-5" />
              Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {opportunities?.map((opportunity: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{opportunity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Amenazas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {threats?.map((threat: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{threat}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {recommendations && recommendations.length > 0 && (
          <Card className="lg:col-span-3 border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="h-5 w-5" />
                Recomendaciones Estratégicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Zap className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderGrowthStrategies = () => {
    if (!analysis.summary) return null;

    const { short_term, medium_term, long_term, roi_projections } = analysis.summary;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Timer className="h-5 w-5" />
                Corto Plazo (1-3 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {short_term?.map((strategy: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{strategy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Calendar className="h-5 w-5" />
                Medio Plazo (3-6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {medium_term?.map((strategy: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{strategy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Star className="h-5 w-5" />
                Largo Plazo (6-12 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {long_term?.map((strategy: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{strategy}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {roi_projections && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <BarChart3 className="h-5 w-5" />
                Proyecciones de ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(roi_projections).map(([period, projection]: [string, any], index: number) => (
                  <div key={index} className="text-center p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">
                      {period.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-lg font-bold text-purple-600">{projection}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Advanced AI Loader */}
      <AdvancedAILoader 
        isVisible={loading} 
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitle={stepDetails.title}
        stepDescription={stepDetails.description}
      />
      
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

          {/* Competitive Analysis */}
          {analysis.competitiveAnalysis && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-red-600" />
                Análisis Competitivo
              </h3>
              {renderCompetitiveAnalysis()}
            </div>
          )}

          {/* Growth Strategies */}
          {analysis.summary && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Estrategias de Crecimiento
              </h3>
              {renderGrowthStrategies()}
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};

export default AdvancedMarketingDashboard;