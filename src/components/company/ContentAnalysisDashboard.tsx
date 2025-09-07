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
  Lightbulb,
  Image,
  FileText,
  Copy,
  Download,
  ExternalLink,
  TrendingUpIcon,
  Award,
  Filter,
  Search,
  PlusCircle,
  Save,
  Bookmark
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
  const [posts, setPosts] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [savedContent, setSavedContent] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'engagement' | 'date' | 'performance'>('engagement');
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

      // Extract posts from content analysis
      const allPosts: any[] = [];
      contentRes.data?.forEach((analysis: any) => {
        if (analysis.posts_data && Array.isArray(analysis.posts_data)) {
          allPosts.push(...analysis.posts_data.map((post: any) => ({
            ...post,
            platform: analysis.platform,
            analysis_date: analysis.created_at
          })));
        }
      });
      
      setPosts(allPosts);
      
      // Get top performing posts
      const sortedPosts = [...allPosts].sort((a, b) => {
        const aEngagement = (a.likes || 0) + (a.comments || 0) + (a.rePosts || 0);
        const bEngagement = (b.likes || 0) + (b.comments || 0) + (b.rePosts || 0);
        return bEngagement - aEngagement;
      });
      setTopPosts(sortedPosts.slice(0, 10));

      // Datos cargados exitosamente - no ejecutar análisis automático
      console.log('Content analysis data loaded:', {
        retrospective: retrospectiveRes.data?.length || 0,
        activity: activityRes.data?.length || 0,
        content: contentRes.data?.length || 0,
        posts: allPosts.length
      });

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

  // Check if we have any analysis data
  const hasAnalysisData = analysisData.retrospective.length > 0 || 
                         analysisData.activity.length > 0 || 
                         analysisData.content.length > 0;

  // If no data exists, show empty state with initial analysis button
  if (!loading && !hasAnalysisData && analysisData.socialAccounts.length > 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
            <BarChart3 className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Análisis de Contenido</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Analice el rendimiento de su contenido en todas las plataformas de redes sociales conectadas.
          </p>
          <Button 
            onClick={triggerContentAnalysis}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Iniciar Análisis de Contenido
          </Button>
        </div>
      </div>
    );
  }

  // Render Posts Analysis Tab
  const renderPostsAnalysis = () => {
    const filteredPosts = posts.filter(post => {
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
      const matchesSearch = searchTerm === '' || 
        post.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.hashTags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesPlatform && matchesSearch;
    });

    const sortedPosts = [...filteredPosts].sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          const aEng = (a.likes || 0) + (a.comments || 0) + (a.rePosts || 0);
          const bEng = (b.likes || 0) + (b.comments || 0) + (b.rePosts || 0);
          return bEng - aEng;
        case 'date':
          return new Date(b.date || b.published_at).getTime() - new Date(a.date || a.published_at).getTime();
        case 'performance':
          return (b.er || 0) - (a.er || 0);
        default:
          return 0;
      }
    });

    const saveContentToLibrary = async (post: any) => {
      try {
        // Save to content library
        const { error } = await supabase
          .from('content_library')
          .insert({
            user_id: profile.user_id,
            post_id: post.postID,
            platform: post.platform || post.socialType,
            content_type: post.type || 'post',
            content_text: post.text,
            image_url: post.image || post.postImage,
            video_url: post.videoLink,
            hashtags: post.hashTags || [],
            metrics: {
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.rePosts || 0,
              views: post.videoViews || post.views || 0,
              engagement_rate: post.er || 0
            },
            post_url: post.postUrl,
            published_at: post.date || post.published_at,
            is_template: true
          });

        if (error) throw error;

        toast({
          title: "Contenido guardado",
          description: "El post se ha agregado a tu biblioteca de contenidos",
        });

        // Refresh saved content
        loadSavedContent();
      } catch (error) {
        console.error('Error saving content:', error);
        toast({
          title: "Error",
          description: "No se pudo guardar el contenido",
          variant: "destructive"
        });
      }
    };

    return (
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar en posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="engagement">Engagement</option>
              <option value="date">Fecha</option>
              <option value="performance">Rendimiento</option>
            </select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredPosts.length} posts encontrados
          </div>
        </div>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Top Posts Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPosts.slice(0, 6).map((post, index) => (
                <div key={post.postID || index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1} • {post.platform || post.socialType}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => saveContentToLibrary(post)}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {post.image && (
                    <img 
                      src={post.image} 
                      alt="Post" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.text?.substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments || 0}
                      </span>
                    </div>
                    <span className="text-primary font-medium">
                      {((post.likes || 0) + (post.comments || 0) + (post.rePosts || 0))} interacciones
                    </span>
                  </div>
                  
                  {post.postUrl && (
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Post
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Todos los Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedPosts.map((post, index) => (
                <div key={post.postID || index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {post.platform || post.socialType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.date || post.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveContentToLibrary(post)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      {post.postUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {post.image && (
                      <div className="md:col-span-1">
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="w-full h-24 object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className={post.image ? "md:col-span-3" : "md:col-span-4"}>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                        {post.text}
                      </p>
                      
                      {post.hashTags && post.hashTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.hashTags.slice(0, 5).map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            {post.likes || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-blue-500" />
                            {post.comments || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 className="h-4 w-4 text-green-500" />
                            {post.rePosts || 0}
                          </span>
                          {(post.videoViews || post.views) && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4 text-purple-500" />
                              {post.videoViews || post.views || 0}
                            </span>
                          )}
                        </div>
                        {post.er && (
                          <Badge variant="outline" className="text-primary">
                            {post.er.toFixed(2)}% ER
                          </Badge>
                        )}
                      </div>
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

  // Render Content Library Tab
  const renderContentLibrary = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Biblioteca de Contenidos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Guarda y reutiliza tus mejores contenidos como plantillas para futuras publicaciones
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                <Image className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Biblioteca de Contenidos</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Aquí podrás guardar imágenes, videos y textos de tus publicaciones más exitosas para reutilizarlos como plantillas.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✨ Guarda contenido desde la pestaña "Posts"</p>
                <p>🎨 Reutiliza imágenes exitosas</p>
                <p>📝 Crea plantillas de texto</p>
                <p>📊 Filtra por rendimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render Content Creator Tab
  const renderContentCreator = () => {
    const [generatingContent, setGeneratingContent] = useState(false);
    const [contentPrompt, setContentPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');

    const generateContent = async () => {
      if (!contentPrompt.trim()) {
        toast({
          title: "Error",
          description: "Por favor ingresa una descripción para el contenido",
          variant: "destructive"
        });
        return;
      }

      setGeneratingContent(true);
      try {
        // Get insights from top posts for context
        const topPostsContext = topPosts.slice(0, 3).map(post => ({
          text: post.text?.substring(0, 200),
          hashtags: post.hashTags?.slice(0, 5),
          engagement: (post.likes || 0) + (post.comments || 0),
          platform: post.platform
        }));

        const { data, error } = await supabase.functions.invoke('generate-company-content', {
          body: {
            prompt: contentPrompt,
            context: {
              top_posts: topPostsContext,
              platform: selectedPlatform !== 'all' ? selectedPlatform : 'general',
              user_id: profile.user_id
            }
          }
        });

        if (error) throw error;

        setGeneratedContent(data.content || data.generatedText || 'No se pudo generar contenido');
        
        toast({
          title: "¡Contenido generado!",
          description: "Tu nuevo contenido está listo para revisar",
        });
      } catch (error) {
        console.error('Error generating content:', error);
        toast({
          title: "Error",
          description: "No se pudo generar el contenido. Intenta de nuevo.",
          variant: "destructive"
        });
      } finally {
        setGeneratingContent(false);
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Creador de Contenido IA
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Genera nuevo contenido basado en el rendimiento de tus publicaciones exitosas
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe el contenido que quieres crear
              </label>
              <textarea
                value={contentPrompt}
                onChange={(e) => setContentPrompt(e.target.value)}
                placeholder="Ej: Crea una publicación sobre los beneficios de la automatización empresarial, enfocada en ahorro de tiempo y costos..."
                className="w-full h-24 px-3 py-2 border border-border rounded-lg bg-background resize-none"
              />
            </div>
            
            <Button 
              onClick={generateContent}
              disabled={generatingContent || !contentPrompt.trim()}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            >
              {generatingContent ? (
                <>
                  <AdvancedAILoader />
                  Generando contenido...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Contenido
                </>
              )}
            </Button>

            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contenido Generado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setGeneratedContent('')}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Content Insights */}
        {topPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Insights de Contenido Exitoso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Hashtags más exitosos</h4>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(topPosts.flatMap(post => post.hashTags || []))).slice(0, 10).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tipos de contenido exitoso</h4>
                  <div className="space-y-1 text-sm">
                    {Array.from(new Set(topPosts.map(post => post.type || 'POST'))).map((type, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        {type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const loadSavedContent = async () => {
    // This would load saved content from content_library table
    // Implementation would go here when the table exists
  };

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
              <option key={account.social_type || account.platform} value={account.social_type || account.platform}>
                {account.social_type || account.platform}
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
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Biblioteca
          </TabsTrigger>
          <TabsTrigger value="creator" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Crear
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

        <TabsContent value="posts">
          {renderPostsAnalysis()}
        </TabsContent>

        <TabsContent value="library">
          {renderContentLibrary()}
        </TabsContent>

        <TabsContent value="creator">
          {renderContentCreator()}
        </TabsContent>
      </Tabs>
    </div>
  );
};