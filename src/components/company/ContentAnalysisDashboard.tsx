import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ContentLibraryTab from "./ContentLibraryTab";
import UnifiedContentCreator from "./UnifiedContentCreator";
import InsightsRenderer, { ParsedContentIdea } from "./InsightsRenderer";
import { InsightsManager } from "./insights/InsightsManager";
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

import { SOCIAL_PLATFORMS, getPlatformDisplayName, getPlatformIcon, getPlatformColor } from '@/lib/socialPlatforms';

const PLATFORM_COLORS = {
  instagram: '#E4405F',
  linkedin: '#0077B5', 
  facebook: '#1877F2',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  LI: '#0077B5'
};

const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B'];

export const ContentAnalysisDashboard: React.FC<ContentAnalysisDashboardProps> = ({ profile }) => {
  const { t } = useTranslation('analytics');
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
  const [aiInsights, setAiInsights] = useState<string>('');
  const [aiAudienceInsights, setAiAudienceInsights] = useState<Array<{ title: string; content: string }>>([]);
  const [aiContentIdeas, setAiContentIdeas] = useState<ParsedContentIdea[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('performance');
  const [existingPostsCount, setExistingPostsCount] = useState(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);
  const [prepopulatedContent, setPrepopulatedContent] = useState<ParsedContentIdea | null>(null);
  const [newInsightsIds, setNewInsightsIds] = useState<string[]>([]);
  const { toast } = useToast();

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    
    try {
      const currentUserId = profile?.user_id;
      
      if (!currentUserId) {
        toast({
          title: t('common:status.error'),
          description: 'No se pudo identificar el usuario',
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Generando insights",
        description: "La IA está analizando tu contenido. Esto puede tomar unos momentos...",
      });

      // Get top performing posts to send as context
      const sortedByEngagement = [...posts].sort((a, b) => {
        const aEng = (a.likes || 0) + (a.comments || 0) + (a.rePosts || 0) + ((a.videoViews || a.views || 0) * 0.01);
        const bEng = (b.likes || 0) + (b.comments || 0) + (b.rePosts || 0) + ((b.videoViews || b.views || 0) * 0.01);
        return bEng - aEng;
      }).slice(0, 10);

      const { data, error } = await supabase.functions.invoke('content-insights-generator', {
        body: {
          user_id: currentUserId,
          platform: selectedPlatform !== 'all' ? selectedPlatform : null,
          top_posts: sortedByEngagement.map(post => ({
            platform: post.platform || post.socialType,
            text: post.text,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.rePosts || 0,
            views: post.videoViews || post.views || 0,
            date: post.date || post.published_at,
            hashtags: post.hashTags || []
          }))
        }
      });

      if (error) {
        console.error('❌ Error generating insights:', error);
        throw error;
      }

      console.log('📦 Response data:', data);

      if (data) {
        // Track newly generated insights
        if (data.saved_insights_ids && Array.isArray(data.saved_insights_ids)) {
          console.log('✅ Received insights IDs:', data.saved_insights_ids);
          setNewInsightsIds(data.saved_insights_ids);
          // Clear after 10 seconds
          setTimeout(() => setNewInsightsIds([]), 10000);
        } else {
          console.warn('⚠️ No saved_insights_ids in response');
        }
        
        // Check for structured output first
        if (data.audience_insights && Array.isArray(data.audience_insights) && data.audience_insights.length > 0 &&
            data.content_ideas && Array.isArray(data.content_ideas) && data.content_ideas.length > 0) {
          
          const mappedAudience = data.audience_insights.map((ai: any) => ({ 
            title: ai.title, 
            content: ai.strategy 
          }));
          
          const mappedContent = data.content_ideas.map((ci: any) => ({
            title: ci.title,
            format: ci.format,
            platform: ci.platform,
            hashtags: ci.hashtags || [],
            timing: ci.timing || '',
            strategy: ci.strategy
          }));
          
          setAiAudienceInsights(mappedAudience);
          setAiContentIdeas(mappedContent);
          setAiInsights(''); // Clear text fallback
          
          console.log('✅ Structured insights loaded:', {
            audienceCount: mappedAudience.length,
            contentCount: mappedContent.length
          });
          
          toast({
            title: "Insights generados",
            description: `${mappedAudience.length} insights de audiencia y ${mappedContent.length} ideas de contenido generadas`,
          });
        } else if (data.insights_text || data.insights) {
          // Fallback to text
          setAiInsights(data.insights_text || data.insights);
          setAiAudienceInsights([]);
          setAiContentIdeas([]);
          console.log('⚠️ Using text fallback for insights');
          
          toast({
            title: "Insights generados",
            description: "Se han generado nuevos insights inteligentes sobre tu contenido",
          });
        } else {
          console.error('❌ Invalid data structure:', data);
          throw new Error('No se recibieron insights válidos de la IA');
        }
      } else {
        console.error('❌ No data received from edge function');
        throw new Error('No se recibieron insights de la IA');
      }

    } catch (error: any) {
      console.error('Error generating AI insights:', error);
      toast({
        title: "Error al generar insights",
        description: error.message || "No se pudieron generar los insights. Por favor, intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadExistingData();
  }, [profile?.user_id]);

  const loadExistingData = async () => {
    setLoading(true);
    try {
      console.log('Profile recibido en ContentAnalysisDashboard:', profile);
      
      // Get current user ID - handle different profile structures
      const currentUserId = profile?.user_id || profile?.id;
      
      if (!currentUserId) {
        toast({
          title: t('common:status.error'),
          description: t('contentAnalysis.error'),
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Consultando social_analysis para user_id:', currentUserId);

      // Load existing social accounts - attempt to read, but don't block if it fails
      const { data: socialAccounts, error: socialError } = await supabase
        .from('social_accounts')
        .select('platform, platform_display_name, is_connected, metadata')
        .eq('user_id', currentUserId)
        .eq('is_connected', true)
        .neq('platform', 'upload_post_profile');

      if (socialError) {
        console.warn('No se pudo cargar social_accounts, continuando sin bloquear:', socialError.message);
      }

      // Set social accounts data if available (may be empty)
      setAnalysisData(prevData => ({
        ...prevData,
        socialAccounts: socialAccounts || []
      }));

      // Load existing analysis data from database
      const [retrospectiveRes, activityRes, contentRes] = await Promise.all([
        supabase
          .from('social_retrospective_analysis')
          .select('*')
          .eq('user_id', currentUserId),
        supabase
          .from('social_activity_analysis')
          .select('*')
          .eq('user_id', currentUserId),
        supabase
          .from('social_content_analysis')
          .select('*')
          .eq('user_id', currentUserId)
      ]);

      // Update analysis data with all results
      setAnalysisData(prevData => ({
        ...prevData,
        retrospective: retrospectiveRes.data || [],
        activity: activityRes.data || [],
        content: contentRes.data || []
      }));

      // If no social accounts loaded but we do have analysis data, derive platforms from results
      if ((!socialAccounts || socialAccounts.length === 0)) {
        const platformsFromContent = Array.from(new Set((contentRes.data || []).map((a: any) => a.platform).filter(Boolean)));
        const derivedAccounts = platformsFromContent.map((p: string) => ({
          platform: p,
          platform_display_name: p,
          is_connected: false,
          metadata: null
        }));
        if (derivedAccounts.length > 0) {
          setAnalysisData(prev => ({ ...prev, socialAccounts: derivedAccounts }));
        }
      }

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
      
      // Update metadata
      setExistingPostsCount(allPosts.length);
      if (contentRes.data && contentRes.data.length > 0) {
        setLastAnalysisDate(contentRes.data[0].created_at);
      }
      
      // Get top performing posts
      const sortedPosts = [...allPosts].sort((a, b) => {
        const aEngagement = (a.likes || 0) + (a.comments || 0) + (a.rePosts || 0);
        const bEngagement = (b.likes || 0) + (b.comments || 0) + (b.rePosts || 0);
        return bEngagement - aEngagement;
      });
      setTopPosts(sortedPosts.slice(0, 10));

      // Load existing insights
      try {
        const { data: insightsData, error: insightsError } = await supabase
          .from('content_recommendations')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('recommendation_type', 'ai_insights')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (insightsError) {
          console.error('Error loading insights:', insightsError);
        } else if (insightsData && insightsData.length > 0) {
          const latestInsight = insightsData[0];
          const suggestedContent = latestInsight.suggested_content as any;
          
          // Try structured first
          if (suggestedContent?.audience_insights && suggestedContent?.content_ideas) {
            setAiAudienceInsights(suggestedContent.audience_insights.map((ai: any) => ({ 
              title: ai.title, 
              content: ai.strategy 
            })));
            setAiContentIdeas(suggestedContent.content_ideas);
            setAiInsights('');
            console.log('✅ Loaded structured insights from database');
          } else if (suggestedContent?.insights_text || suggestedContent?.insights) {
            setAiInsights(suggestedContent.insights_text || suggestedContent.insights);
            setAiAudienceInsights([]);
            setAiContentIdeas([]);
            console.log('⚠️ Loaded text insights from database');
          }
        }
      } catch (error) {
        console.error('Error loading insights:', error);
      }

      // Data loaded successfully - do not execute automatic analysis or show confusing messages
      console.log('Content analysis data loaded:', {
        retrospective: retrospectiveRes.data?.length || 0,
        activity: activityRes.data?.length || 0,
        content: contentRes.data?.length || 0,
        posts: allPosts.length
      });

    } catch (error) {
      console.error('Error loading analysis data:', error);
      toast({
        title: t('common:status.error'),
        description: t('contentAnalysis.error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerContentOnlyAnalysis = async () => {
    setLoading(true);
    
    try {
      toast({
        title: "Iniciando análisis de posts",
        description: "Analizando solo el contenido de sus publicaciones...",
      });

      // Execute only content analysis
      const { data, error } = await supabase.functions.invoke('analyze-social-content');
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Content analysis response:', data);

      // Reload data after analysis
      await loadExistingData();

      // Check if any content was actually analyzed
      if (data && data.results) {
        const analyzedCount = data.results.filter((r: any) => r.posts_count > 0).length;
        
        if (analyzedCount > 0) {
          toast({
            title: "Análisis completado",
            description: `Se analizaron ${analyzedCount} redes sociales con éxito.`,
          });
        } else {
          toast({
            title: "Sin contenido para analizar",
            description: "No se encontraron publicaciones en sus redes sociales conectadas. La API externa puede estar limitada temporalmente. Intente nuevamente en unos minutos.",
            variant: "default"
          });
        }
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
      toast({
        title: "Análisis sin resultados",
        description: "No se pudieron obtener datos de sus redes sociales. Esto puede deberse a límites de la API externa. Intente nuevamente en unos minutos.",
        variant: "default"
      });
      }

    } catch (error: any) {
      console.error('Error ejecutando análisis de contenido:', error);
      const isRateLimit = error?.message?.includes('429') || error?.message?.includes('rate limit');
      
      toast({
        title: isRateLimit ? "Límite de API alcanzado" : "Error en el análisis",
        description: isRateLimit 
          ? "La API externa de Instagram/TikTok ha alcanzado su límite de solicitudes. Por favor, intente nuevamente en 5-10 minutos."
          : "No se pudo completar el análisis de contenido. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerContentAnalysis = async () => {
    setLoading(true);
    let successfulAnalyses = 0;
    let totalAnalyses = 3;
    
    try {
      toast({
        title: "Iniciando análisis",
        description: "Analizando el contenido de sus redes sociales...",
      });

      // Execute analysis functions with individual error handling
      const analysisPromises = [
        { name: 'retrospective', promise: supabase.functions.invoke('analyze-social-retrospective') },
        { name: 'activity', promise: supabase.functions.invoke('analyze-social-activity') },
        { name: 'content', promise: supabase.functions.invoke('analyze-social-content') }
      ];

      const results = await Promise.allSettled(analysisPromises.map(a => a.promise));
      
      results.forEach((result, index) => {
        const analysisName = analysisPromises[index].name;
        if (result.status === 'fulfilled' && !result.value.error) {
          successfulAnalyses++;
          console.log(`✅ ${analysisName} analysis completed successfully`);
        } else {
          console.error(`❌ ${analysisName} analysis failed:`, result.status === 'rejected' ? result.reason : result.value.error);
        }
      });

      // Reload data after analysis
      await loadExistingData();

      // Show appropriate message based on results
      if (successfulAnalyses === totalAnalyses) {
        toast({
          title: "Análisis completado",
          description: "Se ha completado el análisis de contenido de todas sus redes sociales.",
        });
      } else if (successfulAnalyses > 0) {
        toast({
          title: "Análisis parcialmente completado",
          description: `Se completaron ${successfulAnalyses} de ${totalAnalyses} análisis. Algunos pueden haber fallado por límites de API.`,
          variant: "default"
        });
      } else {
        throw new Error('Todos los análisis fallaron');
      }

    } catch (error) {
      console.error('Error ejecutando análisis:', error);
      toast({
        title: "Error en el análisis",
        description: "Hubo un error al ejecutar el análisis de contenido. Algunos servicios pueden estar temporalmente limitados.",
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
    
    // Combinar datos de retrospective con posts reales para tener todos los datos
    // Agrupar posts por plataforma
    const platformGroups = posts.reduce((acc: any, post) => {
      const platform = post.platform || 'unknown';
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(post);
      return acc;
    }, {});

    // Crear métricas combinando retrospective (cuando existe) con datos reales de posts
    const overviewMetrics = Object.entries(platformGroups).map(([platform, platformPosts]: [string, any]) => {
      // Buscar datos retrospectivos para esta plataforma
      const retroData = filteredData.retrospective.find(item => item.platform === platform);
      
      const totalLikes = platformPosts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0);
      const totalComments = platformPosts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0);
      const totalEngagement = totalLikes + totalComments;
      const avgEngagement = platformPosts.length > 0 ? totalEngagement / platformPosts.length / 100 : 0;

      return {
        platform,
        // Usar followers de retrospective si existe, sino 0
        followers: retroData?.current_followers || 0,
        growth: retroData?.followers_growth || 0,
        // Usar engagement real calculado o de retrospective
        engagement: retroData?.average_er || avgEngagement,
        // Usar conteo real de posts
        posts: platformPosts.length,
        quality: retroData?.quality_score || avgEngagement
      };
    });

    // Calcular métricas totales de contenido
    const totalLikes = posts.reduce((sum: number, p: any) => sum + (p.likes || 0), 0);
    const totalComments = posts.reduce((sum: number, p: any) => sum + (p.comments || 0), 0);
    const totalImpressions = posts.reduce((sum: number, p: any) => sum + (p.impressions || 0), 0);
    
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
                <p className="text-sm font-medium text-muted-foreground">Total de Likes</p>
                <p className="text-2xl font-bold">{totalLikes.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3 mr-1" />
              <span>{totalComments.toLocaleString()} comentarios</span>
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
                <p className="text-sm font-medium text-muted-foreground">Tasa de Interacción</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Likes + comentarios por post</p>
                <p className="text-2xl font-bold mt-1">{(totalMetrics.avgEngagement * 100).toFixed(1)}%</p>
              </div>
              <Heart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calidad del Contenido</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Rendimiento vs. audiencia</p>
                <p className="text-2xl font-bold mt-1">{(totalMetrics.avgQuality * 100).toFixed(0)}%</p>
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
        {/* Gráficas de rendimiento - Layout compacto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tendencias de Crecimiento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tendencias de Crecimiento
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Nota: Instagram y TikTok únicamente (LinkedIn no incluido)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedTrends.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
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

          {/* Engagement Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Tasa de Interacción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedTrends.slice(-15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, 'Engagement']} />
                    <Line 
                      type="monotone" 
                      dataKey="avgEngagement" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección de Insights AI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights Inteligentes
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Insights generados por IA basados en tu contenido y audiencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InsightsManager
              userId={profile?.user_id || ''}
              onCreateContent={(contentData) => {
                setPrepopulatedContent(contentData);
                setActiveTab('content');
              }}
              onGenerateMore={generateAIInsights}
              isGenerating={loadingInsights}
              newInsightsIds={newInsightsIds}
            />
          </CardContent>
        </Card>
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


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="p-8 max-w-md mx-auto text-center">
          <CardContent className="space-y-4">
            <div className="relative">
              <BarChart3 className="h-12 w-12 text-primary animate-pulse mx-auto" />
            </div>
            <h3 className="text-lg font-semibold">
              Analizando contenido
            </h3>
            <p className="text-sm text-muted-foreground">
              Obteniendo y procesando las publicaciones de sus redes sociales conectadas...
            </p>
            <div className="space-y-2">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-2/3"></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Este proceso puede tardar unos momentos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysisData.socialAccounts.length) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Conecte sus Redes Sociales</h3>
          <p className="text-muted-foreground mb-6">
            Primero debe conectar sus redes sociales y realizar el análisis de audiencias para acceder al análisis de contenido.
          </p>
          <Button onClick={() => window.history.back()}>
            Volver al Paso Anterior
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any analysis data
  const hasAnalysisData = analysisData.retrospective.length > 0 || 
                         analysisData.activity.length > 0 || 
                         analysisData.content.length > 0;
  const hasPartialData = analysisData.retrospective.length > 0 || analysisData.activity.length > 0;

  // If no data exists, show empty state with initial analysis button
  if (!loading && !hasAnalysisData && analysisData.socialAccounts.length > 0) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">📊 Análisis de Contenido</CardTitle>
            <CardDescription className="text-center">
              Analice el rendimiento de su contenido en {analysisData.socialAccounts.length} plataforma(s) conectada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Listo para el Análisis</h3>
              <p className="text-muted-foreground mb-6">
                Inicie el análisis completo de contenido para obtener insights detallados
              </p>
              <Button onClick={triggerContentAnalysis} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Iniciar Análisis de Contenido
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show normal dashboard even with partial data - let user see what's available
  // and trigger missing analysis when needed

  // Render Posts Analysis Tab
  const renderPostsAnalysis = () => {
    const filteredPosts = posts.filter(post => {
      const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
      const matchesSearch = searchTerm === '' || 
        post.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.hashTags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesPlatform && matchesSearch;
    });

    // Función mejorada para obtener imagen de posts
    const getPostImage = (post: any) => {
      // Para TikTok, usar thumbnail o videoLink
      if (post.platform === 'tiktok' || post.socialType === 'tiktok') {
        return post.thumbnail || post.videoLink || post.image || post.postImage;
      }
      // Para Instagram, priorizar image y postImage
      if (post.platform === 'instagram' || post.socialType === 'instagram') {
        return post.image || post.postImage || post.videoLink;
      }
      // Para otros (LinkedIn, Facebook)
      return post.image || post.postImage || post.videoLink;
    };

    // Ordenar posts según el criterio seleccionado
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

    // Posts de alto rendimiento (top 10 por engagement total)
    const topPerformingPosts = [...filteredPosts].sort((a, b) => {
      const aEng = (a.likes || 0) + (a.comments || 0) + (a.rePosts || 0) + ((a.videoViews || a.views || 0) * 0.01);
      const bEng = (b.likes || 0) + (b.comments || 0) + (b.rePosts || 0) + ((b.videoViews || b.views || 0) * 0.01);
      return bEng - aEng;
    }).slice(0, 6);

    // Posts en orden cronológico para la sección "Todos los Posts"
    const chronologicalPosts = [...filteredPosts].sort((a, b) => {
      return new Date(b.date || b.published_at).getTime() - new Date(a.date || a.published_at).getTime();
    });

    const saveContentToLibrary = async (post: any) => {
      try {
        // Save to content library using content_recommendations table
        const { error } = await supabase
          .from('content_recommendations')
          .insert({
            user_id: profile.user_id,
            platform: post.platform || post.socialType || 'general',
            recommendation_type: 'post_template',
            title: `Plantilla - ${post.platform || post.socialType}`,
            description: post.text?.substring(0, 200) + '...' || 'Post exitoso guardado como plantilla',
            confidence_score: post.er || 0,
            suggested_content: {
              post_id: post.postID,
              platform: post.platform || post.socialType,
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
              published_at: post.date || post.published_at
            },
            status: 'template'
          });

        if (error) throw error;

        toast({
          title: "Contenido guardado",
          description: "El post se ha agregado a tu biblioteca de contenidos",
        });

        // Refresh saved content
        
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
              Publicaciones Más Exitosas
            </CardTitle>
            <CardDescription>
              Posts con mayor interacción (likes, comentarios, compartidos y vistas) que generan más engagement con tu audiencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformingPosts.map((post, index) => {
                const postImage = getPostImage(post);
                return (
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
                  
                  {postImage && (
                    <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
                      <img 
                        src={postImage} 
                        alt="Post content" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Error loading image:', postImage);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
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
              );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Todos los Posts</CardTitle>
            <CardDescription>
              Historial completo de tus publicaciones ordenadas cronológicamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chronologicalPosts.map((post, index) => {
                const postImage = getPostImage(post);
                return (
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
                  {postImage && (
                    <div className="md:col-span-1">
                      <div className="relative w-full h-24 bg-muted rounded-md overflow-hidden">
                        <img 
                          src={postImage} 
                          alt="Post content" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Error loading image:', postImage);
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </div>
                  )}
                    <div className={postImage ? "md:col-span-3" : "md:col-span-4"}>
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
              );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Content tabs extracted to standalone components: ContentLibraryTab and ContentCreatorTab

  return (
    <div className="space-y-6">
      {/* Banner de Estado Existente */}
      {existingPostsCount > 0 && lastAnalysisDate && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    ✓ Análisis de Contenido Existente
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {existingPostsCount} {existingPostsCount === 1 ? 'publicación analizada' : 'publicaciones analizadas'} • 
                    Última actualización: {new Date(lastAnalysisDate).toLocaleDateString('es', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <Button 
                onClick={triggerContentOnlyAnalysis}
                disabled={loading}
                variant="outline"
                className="gap-2 border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Actualizar Análisis
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 flex gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Eye className="w-4 h-4" />
              <span>Tu contenido analizado está disponible. Actualiza para obtener datos más recientes.</span>
            </div>
          </CardContent>
        </Card>
      )}

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
        {analysisData.content.length === 0 && (
          <Button 
            onClick={triggerContentOnlyAnalysis} 
            disabled={loading}
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            Analizar Posts
          </Button>
        )}
      </div>

      {/* Empty State */}
      {analysisData.content.length === 0 && analysisData.socialAccounts.length > 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay análisis de contenido disponible</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Haga clic en "Analizar Posts" para obtener insights sobre el rendimiento de sus publicaciones en redes sociales.
            </p>
            <Button onClick={triggerContentOnlyAnalysis} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analizar Contenido Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Social Accounts State */}
      {analysisData.socialAccounts.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay redes sociales conectadas</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Primero debe conectar sus redes sociales para poder analizar su contenido.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      {analysisData.content.length > 0 && renderPerformanceOverview()}

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mis Post
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Creador de Contenido
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          {renderContentPerformance()}
        </TabsContent>

        <TabsContent value="posts">
          {renderPostsAnalysis()}
        </TabsContent>

        <TabsContent value="content">
          <UnifiedContentCreator
            profile={profile}
            topPosts={topPosts}
            selectedPlatform={selectedPlatform}
            prepopulatedContent={prepopulatedContent}
            onContentUsed={() => setPrepopulatedContent(null)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};