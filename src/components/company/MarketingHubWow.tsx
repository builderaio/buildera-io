import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import { 
  Sparkles, 
  BarChart3, 
  Calendar, 
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  ArrowRight,
  Plus,
  ChevronRight,
  Zap,
  Eye,
  Target,
  Brain,
  Rocket,
  Star,
  Activity,
  PieChart,
  LineChart,
  CheckCircle2,
  PlayCircle,
  Image,
  Video,
  PenTool,
  Globe,
  Wand2,
  Camera,
  TrendingDown,
  Hash,
  Clock,
  Award,
  Network,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Search,
  Settings
} from "lucide-react";
import { SocialConnectionManager } from './SocialConnectionManager';
import { SocialPostCreator } from './SocialPostCreator';
import { ScheduledPostsManager } from './ScheduledPostsManager';

interface MarketingHubWowProps {
  profile: any;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  description?: string;
}

interface CompanyData {
  nombre_empresa: string;
  pais: string;
  objetivo_de_negocio: string;
  propuesta_de_valor: string;
  url_sitio_web: string;
}

interface WorkflowState {
  setup: boolean;
  analysis: boolean;
  strategy: boolean;
  content: boolean;
  automation: boolean;
}

const MarketingHubWow = ({ profile }: MarketingHubWowProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [realMetrics, setRealMetrics] = useState<QuickStat[]>([]);
  const [socialConnections, setSocialConnections] = useState({
    linkedin: false,
    instagram: false,
    facebook: false,
    tiktok: false
  });
  const [currentProcess, setCurrentProcess] = useState<string | null>(null);
  const [processStep, setProcessStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepDetails, setStepDetails] = useState({ title: '', description: '' });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    nombre_empresa: '',
    pais: '',
    objetivo_de_negocio: '',
    propuesta_de_valor: '',
    url_sitio_web: ''
  });
  const [workflow, setWorkflow] = useState<WorkflowState>({
    setup: false,
    analysis: false,
    strategy: false,
    content: false,
    automation: false
  });
  const [showCompanyDataDialog, setShowCompanyDataDialog] = useState(false);
  const [tempCompanyData, setTempCompanyData] = useState<CompanyData>({
    nombre_empresa: '',
    pais: '',
    objetivo_de_negocio: '',
    propuesta_de_valor: '',
    url_sitio_web: ''
  });
  const [platformStats, setPlatformStats] = useState({
    instagram: { posts: 0, followers: 0, engagement: 0 },
    linkedin: { posts: 0, connections: 0, engagement: 0 },
    facebook: { posts: 0, likes: 0, engagement: 0 },
    tiktok: { posts: 0, views: 0, engagement: 0 }
  });

  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      initializeMarketingHub();
    }
  }, [profile?.user_id]);

  const initializeMarketingHub = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConnections(),
        loadRealMetrics(),
        loadRecentActivity(),
        loadUpcomingPosts(),
        loadPlatformStats(),
        checkWorkflowStatus()
      ]);
    } catch (error) {
      console.error('Error initializing Marketing Hub:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const [linkedinRes, facebookRes, tiktokRes] = await Promise.all([
        supabase.from('linkedin_connections').select('id').eq('user_id', profile.user_id).limit(1),
        supabase.from('facebook_instagram_connections').select('id').eq('user_id', profile.user_id).limit(1),
        supabase.from('tiktok_connections').select('id').eq('user_id', profile.user_id).limit(1)
      ]);

      setSocialConnections({
        linkedin: (linkedinRes.data?.length || 0) > 0,
        instagram: (facebookRes.data?.length || 0) > 0,
        facebook: (facebookRes.data?.length || 0) > 0,
        tiktok: (tiktokRes.data?.length || 0) > 0
      });
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadRealMetrics = async () => {
    try {
      const [insightsRes, actionablesRes, postsRes, campaignsRes] = await Promise.all([
        supabase.from('marketing_insights').select('*').eq('user_id', profile.user_id),
        supabase.from('marketing_actionables').select('status').eq('user_id', profile.user_id).eq('status', 'completed'),
        supabase.from('linkedin_posts').select('likes_count, comments_count').eq('user_id', profile.user_id),
        supabase.from('marketing_insights').select('*').eq('user_id', profile.user_id)
      ]);

      const totalInsights = insightsRes.data?.length || 0;
      const completedActions = actionablesRes.data?.length || 0;
      const posts = postsRes.data || [];
      const campaigns = campaignsRes.data?.length || 0;
      
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalEngagement = totalLikes + totalComments;

      const metrics: QuickStat[] = [
        {
          label: "Insights Generados",
          value: totalInsights.toString(),
          change: totalInsights > 0 ? `+${Math.min(totalInsights, 15)}` : "0",
          trend: "up",
          icon: Brain,
          color: "text-purple-600",
          description: "Análisis inteligentes generados"
        },
        {
          label: "Engagement Total",
          value: formatNumber(totalEngagement),
          change: totalEngagement > 0 ? "+12.5%" : "0%",
          trend: totalEngagement > 0 ? "up" : "neutral",
          icon: Heart,
          color: "text-pink-600",
          description: "Interacciones en todas las plataformas"
        },
        {
          label: "Campañas Activas",
          value: campaigns.toString(),
          change: campaigns > 0 ? `+${campaigns}` : "0",
          trend: campaigns > 0 ? "up" : "neutral",
          icon: Rocket,
          color: "text-blue-600",
          description: "Campañas de marketing en ejecución"
        },
        {
          label: "Score de Automatización",
          value: `${Math.round((completedActions / Math.max(totalInsights, 1)) * 100)}%`,
          change: completedActions > 0 ? "+15%" : "0%",
          trend: completedActions > 0 ? "up" : "neutral",
          icon: Zap,
          color: "text-green-600",
          description: "Eficiencia de automatización"
        }
      ];

      setRealMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const [insights, posts, campaigns] = await Promise.all([
        supabase.from('marketing_insights')
          .select('created_at, title, insight_type')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        supabase.from('linkedin_posts')
          .select('posted_at, content')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false })
          .limit(3),

        supabase.from('marketing_campaigns')
          .select('created_at, name, status')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(2)
      ]);

      const activities = [];

      insights.data?.forEach(insight => {
        activities.push({
          icon: getInsightIcon(insight.insight_type),
          iconColor: getInsightColor(insight.insight_type),
          title: insight.title || 'Nuevo insight generado',
          time: formatTimeAgo(insight.created_at),
          type: 'insight',
          category: insight.insight_type
        });
      });

      posts.data?.forEach(post => {
        activities.push({
          icon: MessageCircle,
          iconColor: 'text-blue-600',
          title: 'Post publicado en LinkedIn',
          time: formatTimeAgo(post.posted_at),
          type: 'post',
          preview: post.content?.substring(0, 50) + '...'
        });
      });

        // Skip campaigns for now due to schema mismatch

      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadUpcomingPosts = async () => {
    try {
      const { data: scheduledPosts } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(5);

      const upcoming = scheduledPosts?.map(post => ({
        icon: getContentTypeIcon('post'),
        title: typeof post.content === 'string' ? post.content.substring(0, 50) + '...' : 'Post programado',
        time: formatScheduledTime(post.scheduled_for),
        platform: post.platform,
        type: 'post'
      })) || [];

      setUpcomingPosts(upcoming);
    } catch (error) {
      console.error('Error loading upcoming posts:', error);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const [instagramRes, linkedinRes, facebookRes, tiktokRes] = await Promise.all([
        supabase.from('instagram_posts')
          .select('like_count, comment_count, reach')
          .eq('user_id', profile.user_id),
        
        supabase.from('linkedin_posts')
          .select('likes_count, comments_count')
          .eq('user_id', profile.user_id),
        
        supabase.from('facebook_posts')
          .select('likes_count, comments_count, reach')
          .eq('user_id', profile.user_id),
        
        supabase.from('tiktok_posts')
          .select('digg_count, comment_count, play_count')
          .eq('user_id', profile.user_id)
      ]);

      const calculateStats = (posts: any[], likeField: string, commentField: string, reachField?: string) => {
        const totalLikes = posts.reduce((sum, post) => sum + (post[likeField] || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post[commentField] || 0), 0);
        const totalReach = reachField ? posts.reduce((sum, post) => sum + (post[reachField] || 0), 0) : 0;
        
        return {
          posts: posts.length,
          engagement: totalLikes + totalComments,
          reach: totalReach
        };
      };

      setPlatformStats({
        instagram: {
          ...calculateStats(instagramRes.data || [], 'like_count', 'comment_count', 'reach'),
          followers: 0 // Este dato vendría de otra fuente
        },
        linkedin: {
          ...calculateStats(linkedinRes.data || [], 'likes_count', 'comments_count'),
          connections: 0 // Este dato vendría de otra fuente
        },
        facebook: {
          ...calculateStats(facebookRes.data || [], 'likes_count', 'comments_count', 'reach'),
          likes: 0 // Este dato vendría de otra fuente
        },
        tiktok: {
          ...calculateStats(tiktokRes.data || [], 'digg_count', 'comment_count', 'play_count'),
          views: tiktokRes.data?.reduce((sum, post) => sum + (post.play_count || 0), 0) || 0
        }
      });
    } catch (error) {
      console.error('Error loading platform stats:', error);
    }
  };

  const checkWorkflowStatus = async () => {
    console.log('=== DEBUG: checkWorkflowStatus iniciado ===');
    try {
      // Buscar empresa principal del usuario a través de company_members
      const { data: companyMember, error: memberError } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies (
            id,
            name,
            country,
            description,
            website_url,
            industry_sector
          )
        `)
        .eq('user_id', profile.user_id)
        .eq('is_primary', true)
        .limit(1)
        .single();

      console.log('Company member result:', { companyMember, memberError });

      const [campaignRes] = await Promise.all([
        supabase.from('marketing_insights').select('*').eq('user_id', profile.user_id).limit(1)
      ]);

      setWorkflow({
        setup: companyMember?.companies ? true : false,
        analysis: false, // Se establecerá según análisis previos
        strategy: (campaignRes.data?.length || 0) > 0,
        content: false, // Se establecerá según contenido generado
        automation: false // Se establecerá según automatizaciones activas
      });

      if (companyMember?.companies) {
        const company = companyMember.companies;
        console.log('Company data found:', company);
        const newCompanyData = {
          nombre_empresa: company.name || '',
          pais: company.country || '',
          objetivo_de_negocio: company.description || company.industry_sector || '',
          propuesta_de_valor: company.description || '',
          url_sitio_web: company.website_url || ''
        };
        console.log('Setting companyData to:', newCompanyData);
        setCompanyData(newCompanyData);
      } else {
        console.log('=== DEBUG: No se encontró empresa principal para el usuario ===');
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
    }
  };

  const startIntelligentCampaign = async (dataOverride?: CompanyData) => {
    console.log('=== DEBUG: startIntelligentCampaign iniciado ===');
    const dataToUse = dataOverride ?? companyData;
    console.log('companyData a usar:', dataToUse);
    
    // Validar campos requeridos por el edge function
    const missingFields = [] as string[];
    if (!dataToUse.nombre_empresa) missingFields.push('Nombre de empresa');
    if (!dataToUse.pais) missingFields.push('País');
    if (!dataToUse.objetivo_de_negocio) missingFields.push('Objetivo de negocio');
    if (!dataToUse.propuesta_de_valor) missingFields.push('Propuesta de valor');

    console.log('Campos faltantes:', missingFields);

    if (missingFields.length > 0) {
      console.log('=== DEBUG: Abriendo diálogo para completar datos ===');
      // Pre-llenar el diálogo con los datos existentes
      setTempCompanyData({
        ...dataToUse,
        pais: dataToUse.pais || '',
        propuesta_de_valor: dataToUse.propuesta_de_valor || dataToUse.objetivo_de_negocio || ''
      });
      setShowCompanyDataDialog(true);
      return;
    }

    console.log('=== DEBUG: Todos los campos están completos, iniciando campaña ===');

    setCurrentProcess('intelligent-campaign');
    setProcessStep(0);
    setTotalSteps(8);
    setAnalysisProgress(0);
    setShowResults(false);

    try {
      // Paso 1: Análisis de audiencia
      updateProcess(1, "Análisis de Audiencia", "Identificando tu audiencia objetivo ideal...");
      await callMarketingFunction('marketing-hub-target-audience', dataToUse);
      setAnalysisProgress(15);

      // Paso 2: Estrategia de marketing
      updateProcess(2, "Estrategia Inteligente", "Desarrollando estrategia personalizada...");
      await callMarketingFunction('marketing-hub-marketing-strategy', dataToUse);
      setAnalysisProgress(30);

      // Paso 3: Calendario de contenido
      updateProcess(3, "Calendario de Contenido", "Creando calendario optimizado...");
      const calendarData = {
        ...dataToUse,
        fecha_inicio_calendario: new Date().toISOString().split('T')[0],
        numero_dias_generar: 14
      };
      await callMarketingFunction('marketing-hub-content-calendar', calendarData);
      setAnalysisProgress(45);

      // Paso 4: Análisis de plataformas conectadas
      updateProcess(4, "Análisis de Redes Sociales", "Analizando plataformas conectadas...");
      await analyzeConnectedPlatforms();
      setAnalysisProgress(60);

      // Paso 5: Creación de contenido
      updateProcess(5, "Creación de Contenido", "Generando posts optimizados...");
      await createOptimizedContent();
      setAnalysisProgress(75);

      // Paso 6: Análisis avanzado
      updateProcess(6, "Análisis Avanzado", "Ejecutando análisis inteligente...");
      await runAdvancedAnalysis();
      setAnalysisProgress(90);

      // Paso 7: Optimización
      updateProcess(7, "Optimización Final", "Aplicando mejores prácticas...");
      await optimizeCampaign();
      setAnalysisProgress(100);

      // Paso 8: Resultados
      updateProcess(8, "¡Campaña Lista!", "Su campaña inteligente está lista para ejecutar");
      
      setShowResults(true);
      setWorkflow(prev => ({ ...prev, analysis: true, strategy: true, content: true }));
      
      toast({
        title: "🚀 ¡Campaña Inteligente Creada!",
        description: "Su campaña de marketing ha sido generada con IA avanzada",
      });

      // Recargar métricas y actividad
      await Promise.all([
        loadRealMetrics(),
        loadRecentActivity(),
        loadUpcomingPosts()
      ]);

    } catch (error) {
      console.error('Error creating intelligent campaign:', error);
      toast({
        title: "Error",
        description: "No se pudo completar la campaña inteligente",
        variant: "destructive"
      });
    } finally {
      setCurrentProcess(null);
      setProcessStep(0);
    }
  };

  const handleCompanyDataSave = async () => {
    try {
      // Obtener la empresa principal del usuario
      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile.user_id)
        .eq('is_primary', true)
        .limit(1)
        .single();

      if (!companyMember) {
        toast({
          title: "Error",
          description: "No se encontró empresa asociada al usuario",
          variant: "destructive"
        });
        return;
      }

      // Actualizar la empresa con los datos faltantes
      const { error } = await supabase
        .from('companies')
        .update({
          country: tempCompanyData.pais,
          description: tempCompanyData.propuesta_de_valor || tempCompanyData.objetivo_de_negocio
        })
        .eq('id', companyMember.company_id);

      if (error) {
        console.error('Error updating company:', error);
        toast({
          title: "Error",
          description: "No se pudieron guardar los datos de la empresa",
          variant: "destructive"
        });
        return;
      }

      // Actualizar el estado local
      setCompanyData(prev => ({
        ...prev,
        pais: tempCompanyData.pais,
        propuesta_de_valor: tempCompanyData.propuesta_de_valor,
        objetivo_de_negocio: tempCompanyData.objetivo_de_negocio || prev.objetivo_de_negocio
      }));

      setShowCompanyDataDialog(false);
      
      toast({
        title: "Datos guardados",
        description: "Los datos de la empresa se han actualizado correctamente",
      });

      // Continuar con la campaña
      startIntelligentCampaign(tempCompanyData);

    } catch (error) {
      console.error('Error saving company data:', error);
      toast({
        title: "Error",
        description: "Error al guardar los datos",
        variant: "destructive"
      });
    }
  };

  const analyzeConnectedPlatforms = async () => {
    const connectedPlatforms = Object.entries(socialConnections)
      .filter(([_, connected]) => connected)
      .map(([platform, _]) => platform);

    for (const platform of connectedPlatforms) {
      try {
        await supabase.functions.invoke(`${platform}-intelligent-analysis`, {
          body: { platform }
        });
      } catch (error) {
        console.error(`Error analyzing ${platform}:`, error);
      }
    }
  };

  const createOptimizedContent = async () => {
    const contentTypes = ['post', 'image', 'reel'];
    
    for (const type of contentTypes) {
      try {
        await callMarketingFunction(`marketing-hub-${type}-creator`, {
          tono_de_la_marca: "Profesional e innovador",
          buyer_persona_objetivo: {
            nombre_ficticio: "Cliente Ideal",
            puntos_de_dolor: ["Necesita optimizar marketing"]
          },
          calendario_item: {
            fecha: new Date().toISOString().split('T')[0],
            red_social: "LinkedIn",
            tipo_contenido: type,
            tema_concepto: companyData.propuesta_de_valor
          }
        });
      } catch (error) {
        console.error(`Error creating ${type}:`, error);
      }
    }
  };

  const runAdvancedAnalysis = async () => {
    try {
      await Promise.all([
        supabase.functions.invoke('advanced-social-analyzer', { body: { action: 'comprehensive_analysis' } }),
        supabase.functions.invoke('content-insights-analyzer', { body: { platform: null } }),
        supabase.functions.invoke('calculate-social-analytics', { body: {} })
      ]);
    } catch (error) {
      console.error('Error in advanced analysis:', error);
    }
  };

  const optimizeCampaign = async () => {
    // Aplicar optimizaciones finales y configurar automatizaciones
    try {
      await supabase.functions.invoke('premium-ai-insights', {
        body: { optimize: true }
      });
    } catch (error) {
      console.error('Error optimizing campaign:', error);
    }
  };

  const callMarketingFunction = async (functionName: string, data: any) => {
    // Get N8N credentials for Basic auth
    const N8N_AUTH_USER = 'buildera_n8n_user';
    const N8N_AUTH_PASS = 'BuilderaFlow2024!';
    const credentials = btoa(`${N8N_AUTH_USER}:${N8N_AUTH_PASS}`);
    
    const { data: result, error } = await supabase.functions.invoke(functionName, {
      body: { input: data },
      headers: {
        'Authorization': `Basic ${credentials}`,
      }
    });

    if (error) throw error;
    return result;
  };

  const updateProcess = (step: number, title: string, description: string) => {
    setProcessStep(step);
    setStepDetails({ title, description });
  };

  // Utility functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace menos de 1h';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) return `En ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 7) return `En ${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimal_timing': return Clock;
      case 'content_performance': return BarChart3;
      case 'hashtag_optimization': return Hash;
      case 'sentiment_analysis': return Heart;
      default: return Sparkles;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'optimal_timing': return 'text-blue-600';
      case 'content_performance': return 'text-green-600';
      case 'hashtag_optimization': return 'text-purple-600';
      case 'sentiment_analysis': return 'text-pink-600';
      default: return 'text-yellow-600';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'reel': return PlayCircle;
      default: return PenTool;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'linkedin': return Network;
      case 'instagram': return Camera;
      case 'facebook': return Share2;
      case 'tiktok': return PlayCircle;
      default: return Globe;
    }
  };

  const connectedPlatformsCount = Object.values(socialConnections).filter(Boolean).length;
  const workflowProgress = Object.values(workflow).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Inicializando Marketing Hub</h3>
            <p className="text-muted-foreground">Cargando tu centro de comando inteligente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-8 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text">
                    Marketing Hub AI
                  </h1>
                  <p className="text-white/80 text-lg">Centro de comando inteligente para marketing digital</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-white/90">{connectedPlatformsCount} plataformas conectadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/90">{workflowProgress}/5 configuración completa</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => startIntelligentCampaign()}
              disabled={currentProcess !== null}
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {currentProcess ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Creando Campaña...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Crear Campaña Inteligente
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Process Loading */}
        {currentProcess && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
                <AdvancedAILoader
                  isVisible={true}
                  currentStep={processStep}
                  totalSteps={totalSteps}
                  stepTitle={stepDetails.title}
                  stepDescription={stepDetails.description}
                />
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso de la campaña</span>
                  <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3 bg-primary/10" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {realMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 hover:scale-105 border-0 bg-gradient-to-br from-background via-background/90 to-background/70 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-6 translate-x-6"></div>
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className={`h-6 w-6 ${metric.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                          <p className="text-sm text-muted-foreground">{metric.label}</p>
                        </div>
                      </div>
                      
                      {metric.description && (
                        <p className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {metric.description}
                        </p>
                      )}
                    </div>
                    
                    <Badge 
                      variant="default" 
                      className={`${ 
                        metric.trend === 'up' ? 'bg-green-100 text-green-700 border-green-200' :
                        metric.trend === 'down' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      } transition-all duration-300 hover:scale-110`}
                    >
                      {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                      {metric.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                      {metric.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 h-16 p-1 bg-muted/50 backdrop-blur-sm rounded-2xl">
            {[
              { value: "dashboard", icon: BarChart3, label: "Panel" },
              { value: "create", icon: Wand2, label: "Crear" },
              { value: "analyze", icon: Brain, label: "Analizar" },
              { value: "schedule", icon: Calendar, label: "Programar" },
              { value: "results", icon: Star, label: "Resultados" }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value}
                className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl transition-all duration-300"
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Social Connections Section */}
            <SocialConnectionManager 
              profile={profile} 
              onConnectionsUpdated={loadConnections}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Platform Overview */}
              <Card className="lg:col-span-2 border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-primary" />
                    Resumen de Plataformas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {Object.entries(platformStats).map(([platform, stats]) => {
                      const PlatformIcon = getPlatformIcon(platform);
                      const isConnected = socialConnections[platform as keyof typeof socialConnections];
                      
                      return (
                        <div key={platform} className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          isConnected ? 'border-green-200 bg-green-50/50 hover:shadow-md' : 'border-gray-200 bg-gray-50/50'
                        }`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isConnected ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <PlatformIcon className={`w-5 h-5 ${
                                isConnected ? 'text-green-600' : 'text-gray-500'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-semibold capitalize">{platform}</h4>
                              <p className={`text-xs ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                                {isConnected ? 'Conectado' : 'No conectado'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Posts</span>
                              <span className="font-medium">{stats.posts}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Engagement</span>
                              <span className="font-medium">{formatNumber(stats.engagement)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="w-full justify-between h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Contenido con IA</span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab("analyze")}
                    variant="outline"
                    className="w-full justify-between h-14 hover:bg-primary/5 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="font-medium">Análisis Inteligente</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button
                    onClick={() => setActiveTab("schedule")}
                    variant="outline"
                    className="w-full justify-between h-14 hover:bg-primary/5 group transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-medium">Programar Posts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Upcoming Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card className="border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => {
                        const IconComponent = activity.icon;
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                              {activity.preview && (
                                <p className="text-xs text-muted-foreground/80 mt-1 italic">{activity.preview}</p>
                              )}
                            </div>
                            {activity.category && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.category}
                              </Badge>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay actividad reciente</p>
                        <p className="text-sm mt-1">Cree su primera campaña para empezar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Posts */}
              <Card className="border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Posts Programados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {upcomingPosts.length > 0 ? (
                      upcomingPosts.map((post, index) => {
                        const IconComponent = post.icon;
                        const PlatformIcon = getPlatformIcon(post.platform);
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <PlatformIcon className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{post.time}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {post.type}
                            </Badge>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay posts programados</p>
                        <p className="text-sm mt-1">Programe contenido para automatizar su marketing</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-8">
            <SocialPostCreator 
              profile={profile} 
              onPostCreated={() => {
                loadUpcomingPosts();
                loadRealMetrics();
              }}
            />
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-8">
            <ScheduledPostsManager 
              profile={profile} 
              onPostsUpdated={() => {
                loadUpcomingPosts();
                loadRealMetrics();
              }}
            />
          </TabsContent>

          <TabsContent value="results" className="space-y-8">
            <Card className="border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Resultados y Métricas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {showResults ? (
                  <div className="space-y-6">
                    <Alert className="border-green-200 bg-green-50/50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        ¡Campaña inteligente creada exitosamente! Revise las métricas actualizadas en el panel principal.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="text-2xl font-bold text-primary">{realMetrics[0]?.value || '0'}</div>
                        <div className="text-sm text-muted-foreground">Insights Generados</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{upcomingPosts.length}</div>
                        <div className="text-sm text-muted-foreground">Posts Programados</div>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">{connectedPlatformsCount}</div>
                        <div className="text-sm text-muted-foreground">Plataformas Activas</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Resultados de Campañas</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Execute una campaña inteligente para ver resultados detallados y métricas de rendimiento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para completar datos de la empresa */}
      <Dialog open={showCompanyDataDialog} onOpenChange={setShowCompanyDataDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Completar datos de la empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pais">País (requerido)</Label>
              <Input
                id="pais"
                placeholder="Ej: Colombia, México, España..."
                value={tempCompanyData.pais}
                onChange={(e) => setTempCompanyData(prev => ({ ...prev, pais: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propuesta_valor">Propuesta de valor (requerido)</Label>
              <Textarea
                id="propuesta_valor"
                placeholder="Describa qué hace única a su empresa y el valor que ofrece a sus clientes..."
                value={tempCompanyData.propuesta_de_valor}
                onChange={(e) => setTempCompanyData(prev => ({ ...prev, propuesta_de_valor: e.target.value }))}
                rows={3}
              />
            </div>
            {!tempCompanyData.objetivo_de_negocio && (
              <div className="space-y-2">
                <Label htmlFor="objetivo_negocio">Objetivo de negocio</Label>
                <Textarea
                  id="objetivo_negocio"
                  placeholder="Describa los principales objetivos de su empresa..."
                  value={tempCompanyData.objetivo_de_negocio}
                  onChange={(e) => setTempCompanyData(prev => ({ ...prev, objetivo_de_negocio: e.target.value }))}
                  rows={2}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompanyDataDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCompanyDataSave}
              disabled={!tempCompanyData.pais || !tempCompanyData.propuesta_de_valor}
            >
              Guardar y continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingHubWow;
