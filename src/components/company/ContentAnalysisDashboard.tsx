import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BarChart3,
  Activity,
  Zap,
  Target,
  Star,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Sparkles,
  Brain,
  Globe,
  Lightbulb
} from 'lucide-react';

interface ContentAnalysisData {
  retrospective: any[];
  activity: any[];
  content: any[];
  socialAccounts: any[];
}

interface Profile {
  user_id?: string;
  id?: string;
  full_name?: string;
  user_type?: string;
}

interface ContentAnalysisDashboardProps {
  profile: Profile;
}

const PLATFORM_COLORS = {
  instagram: '#E4405F',
  linkedin: '#0077B5', 
  facebook: '#1877F2',
  tiktok: '#000000',
  twitter: '#1DA1F2'
};

const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

export const ContentAnalysisDashboard: React.FC<ContentAnalysisDashboardProps> = ({ profile }) => {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<ContentAnalysisData>({
    retrospective: [],
    activity: [],
    content: [],
    socialAccounts: []
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
  }, [profile.user_id]);

  const loadExistingData = async () => {
    setLoading(true);
    try {
      console.log('Profile recibido en ContentAnalysisDashboard:', profile);
      
      // Get current user ID - handle different profile structures
      const currentUserId = profile?.user_id || profile?.id;
      
      if (!currentUserId) {
        toast({
          title: "Error de usuario",
          description: "No se pudo identificar el usuario. Por favor, recargue la página.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Consultando social_analysis para user_id:', currentUserId);

      // Load existing social accounts with analysis
      const { data: socialAccounts, error: socialError } = await supabase
        .from('social_analysis')
        .select('social_type, cid, name, users_count, avg_er, quality_score')
        .eq('user_id', currentUserId);

      if (socialError) {
        console.error('Error al consultar social_analysis:', socialError);
        toast({
          title: "Error de consulta",
          description: "Error al consultar los análisis de audiencias.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!socialAccounts?.length) {
        toast({
          title: "No hay análisis de audiencias",
          description: "Primero debe realizar análisis de audiencias para acceder al análisis de contenido.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Load existing analysis data from database
      const [retrospectiveRes, activityRes, contentRes] = await Promise.all([
        supabase
          .from('social_retrospective_analysis')
          .select('*')
          .eq('user_id', profile.user_id),
        supabase
          .from('social_activity_analysis')
          .select('*')
          .eq('user_id', profile.user_id),
        supabase
          .from('social_content_analysis')
          .select('*')
          .eq('user_id', profile.user_id)
      ]);

      setAnalysisData({
        retrospective: retrospectiveRes.data || [],
        activity: activityRes.data || [],
        content: contentRes.data || [],
        socialAccounts: socialAccounts || []
      });

      // If no data exists, trigger analysis
      if (!retrospectiveRes.data?.length || !activityRes.data?.length || !contentRes.data?.length) {
        await triggerContentAnalysis();
      }

    } catch (error) {
      console.error('Error loading analysis data:', error);
      toast({
        title: "Error",
        description: "Error al cargar los datos de análisis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerContentAnalysis = async () => {
    setLoading(true);
    try {
      toast({
        title: "Iniciando análisis",
        description: "Analizando el contenido de sus redes sociales...",
      });

      // Execute all three analysis functions
      const [retrospectiveRes, activityRes, contentRes] = await Promise.all([
        supabase.functions.invoke('analyze-social-retrospective'),
        supabase.functions.invoke('analyze-social-activity'),
        supabase.functions.invoke('analyze-social-content')
      ]);

      if (retrospectiveRes.error || activityRes.error || contentRes.error) {
        throw new Error('Error executing analysis functions');
      }

      // Reload data after analysis
      await loadExistingData();

      toast({
        title: "Análisis completado",
        description: "Se ha completado el análisis de contenido de todas sus redes sociales.",
      });

    } catch (error) {
      console.error('Error triggering analysis:', error);
      toast({
        title: "Error en el análisis",
        description: "Hubo un error al ejecutar el análisis de contenido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (selectedPlatform === 'all') return analysisData;
    
    return {
      retrospective: analysisData.retrospective.filter(item => item.platform === selectedPlatform),
      activity: analysisData.activity.filter(item => item.platform === selectedPlatform),
      content: analysisData.content.filter(item => item.platform === selectedPlatform),
      socialAccounts: analysisData.socialAccounts.filter(item => item.platform === selectedPlatform)
    };
  };

  const renderPerformanceOverview = () => {
    const filteredData = getFilteredData();
    
    const overviewMetrics = filteredData.retrospective.map(item => ({
      platform: item.platform,
      followers: item.current_followers || 0,
      growth: item.followers_growth || 0,
      engagement: item.average_er || 0,
      posts: item.total_posts || 0,
      quality: item.quality_score || 0
    }));

    const totalMetrics = overviewMetrics.reduce((acc, curr) => ({
      followers: acc.followers + curr.followers,
      growth: acc.growth + curr.growth,
      posts: acc.posts + curr.posts,
      avgEngagement: (acc.avgEngagement + curr.engagement) / 2,
      avgQuality: (acc.avgQuality + curr.quality) / 2
    }), { followers: 0, growth: 0, posts: 0, avgEngagement: 0, avgQuality: 0 });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Seguidores Totales</p>
                <p className="text-2xl font-bold">{totalMetrics.followers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              {totalMetrics.growth > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${totalMetrics.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalMetrics.growth > 0 ? '+' : ''}{totalMetrics.growth}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posts Publicados</p>
                <p className="text-2xl font-bold">{totalMetrics.posts}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Engagement Promedio</p>
                <p className="text-2xl font-bold">{(totalMetrics.avgEngagement * 100).toFixed(1)}%</p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score de Calidad</p>
                <p className="text-2xl font-bold">{(totalMetrics.avgQuality * 100).toFixed(0)}%</p>
              </div>
              <Star className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plataformas</p>
                <p className="text-2xl font-bold">{overviewMetrics.length}</p>
              </div>
              <Globe className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActivityTimeline = () => {
    const filteredData = getFilteredData();
    
    // Process activity data for hourly heatmap
    const hourlyData = [];
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    for (let day = 1; day <= 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timeKey = `${day}_${hour}`;
        const activityPoint = filteredData.activity.find(item => 
          item.raw_activity_data?.find((point: any) => point.time === timeKey)
        );
        
        if (activityPoint) {
          const dataPoint = activityPoint.raw_activity_data.find((point: any) => point.time === timeKey);
          hourlyData.push({
            day: days[day - 1],
            hour,
            interactions: dataPoint?.interactions || 0,
            dayNum: day
          });
        }
      }
    }

    // Get peak hours data
    const peakHours = filteredData.activity.map(item => ({
      platform: item.platform,
      peakHour: item.peak_hour,
      peakDay: item.peak_day_of_week,
      peakInteractions: item.peak_interactions
    }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Momentos Óptimos para Publicar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {peakHours.map((peak, index) => (
                <Card key={index} className="bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" style={{ borderColor: PLATFORM_COLORS[peak.platform as keyof typeof PLATFORM_COLORS] }}>
                        {peak.platform}
                      </Badge>
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Mejor hora</p>
                        <p className="font-semibold">{peak.peakHour}:00</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mejor día</p>
                        <p className="font-semibold">{days[peak.peakDay - 1]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max interacciones</p>
                        <p className="font-semibold">{peak.peakInteractions?.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContentPerformance = () => {
    const filteredData = getFilteredData();
    
    // Process retrospective data for trends
    const trendsData = filteredData.retrospective.map(item => {
      const seriesData = item.series_data?.current || [];
      return seriesData.map((point: any, index: number) => ({
        date: point.date,
        platform: item.platform,
        followers: point.usersCount || 0,
        engagement: point.er || 0,
        posts: point.deltaPosts || 0,
        quality: point.qualityScore || 0,
        index
      }));
    }).flat();

    // Group by date for combined chart
    const combinedTrends = trendsData.reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.date === curr.date);
      if (existing) {
        existing.totalFollowers += curr.followers;
        existing.totalPosts += curr.posts;
        existing.avgEngagement = (existing.avgEngagement + curr.engagement) / 2;
        existing.avgQuality = (existing.avgQuality + curr.quality) / 2;
      } else {
        acc.push({
          date: curr.date,
          totalFollowers: curr.followers,
          totalPosts: curr.posts,
          avgEngagement: curr.engagement,
          avgQuality: curr.quality
        });
      }
      return acc;
    }, []);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendencias de Crecimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTrends.slice(-30)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="totalFollowers" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.2}
                    name="Seguidores"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedTrends.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, 'Engagement']} />
                    <Line 
                      type="monotone" 
                      dataKey="avgEngagement" 
                      stroke="#06B6D4" 
                      strokeWidth={3}
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Score de Calidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedTrends.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(1)}%`, 'Calidad']} />
                    <Line 
                      type="monotone" 
                      dataKey="avgQuality" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderPlatformComparison = () => {
    const filteredData = getFilteredData();
    
    const platformMetrics = filteredData.retrospective.map(item => ({
      platform: item.platform,
      followers: item.current_followers || 0,
      growth: item.followers_growth || 0,
      engagement: (item.average_er || 0) * 100,
      posts: item.total_posts || 0,
      quality: (item.quality_score || 0) * 100
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comparación por Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="followers" fill="#8B5CF6" name="Seguidores" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Performance Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={platformMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="platform" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Engagement"
                      dataKey="engagement"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Calidad"
                      dataKey="quality"
                      stroke="#06B6D4"
                      fill="#06B6D4"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    const filteredData = getFilteredData();
    
    const insights = [
      {
        icon: Lightbulb,
        title: "Momento Óptimo",
        description: "Los mejores horarios para publicar son entre las 18:00-20:00",
        type: "timing",
        color: "text-yellow-500"
      },
      {
        icon: TrendingUp,
        title: "Crecimiento Sostenido",
        description: "Su audiencia ha crecido un 15% en el último mes",
        type: "growth",
        color: "text-green-500"
      },
      {
        icon: Brain,
        title: "Contenido de Calidad",
        description: "Sus posts tienen un score de calidad del 78%, superior al promedio",
        type: "quality",
        color: "text-purple-500"
      },
      {
        icon: Target,
        title: "Engagement Mejorado",
        description: "El engagement rate ha aumentado un 23% esta semana",
        type: "engagement",
        color: "text-blue-500"
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5`}>
                  <insight.icon className={`h-6 w-6 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                  <p className="text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <AdvancedAILoader 
          isVisible={true}
          stepTitle="Analizando el contenido de sus redes sociales..." 
          stepDescription="Esto puede tomar unos momentos mientras procesamos toda la información"
        />
      </div>
    );
  }

  if (!analysisData.socialAccounts.length) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Análisis de Contenido No Disponible</h3>
          <p className="text-muted-foreground mb-6">
            Para acceder al análisis de contenido, primero debe realizar el análisis de audiencias en la pestaña correspondiente.
          </p>
          <Button onClick={() => window.location.reload()}>
            Verificar Análisis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Análisis de Contenido
          </h2>
          <p className="text-muted-foreground mt-1">
            Insights profundos sobre el rendimiento de su contenido
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedPlatform} 
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background"
          >
            <option value="all">Todas las plataformas</option>
            {analysisData.socialAccounts.map(account => (
              <option key={account.platform} value={account.platform}>
                {account.platform}
              </option>
            ))}
          </select>
          <Button 
            onClick={triggerContentAnalysis} 
            disabled={loading}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Análisis
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      {renderPerformanceOverview()}

      {/* Analysis Tabs */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Comparación
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          {renderContentPerformance()}
        </TabsContent>

        <TabsContent value="timing">
          {renderActivityTimeline()}
        </TabsContent>

        <TabsContent value="comparison">
          {renderPlatformComparison()}
        </TabsContent>

        <TabsContent value="insights">
          {renderInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
};