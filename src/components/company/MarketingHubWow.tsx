import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import { 
  Sparkles, BarChart3, Calendar, TrendingUp, Users, Heart, MessageCircle, ArrowRight, Plus, 
  ChevronRight, Zap, Eye, Target, Brain, Rocket, Star, Activity, PieChart, LineChart, 
  CheckCircle2, PlayCircle, Image, Video, PenTool, Globe, Wand2, Camera, TrendingDown, 
  Hash, Clock, Award, Network, Share2, Download, Upload, RefreshCw, Filter, Search, 
  Settings, History as HistoryIcon, Linkedin, Instagram, Facebook, Music 
} from "lucide-react";
import { SOCIAL_PLATFORMS, getPlatform, getPlatformDisplayName, getPlatformIcon } from '@/lib/socialPlatforms';
import { SocialConnectionManager } from './SocialConnectionManager';
import ContentCreatorTab from './ContentCreatorTab';
import ContentLibraryTab from './ContentLibraryTab';
import { ScheduledPostsManager } from './ScheduledPostsManager';
import { UploadHistory } from './UploadHistory';
import MarketingHubOrchestrator from './MarketingHubOrchestrator';
import AudienciasManager from './AudienciasManager';
import { ContentAnalysisDashboard } from './ContentAnalysisDashboard';
import { CampaignDashboard } from './campaign/CampaignDashboard';
import ContentCalendar from './ContentCalendar';

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
  objective_id?: string;
  redes_socciales_activas?: string[];
}

interface CompanyObjective {
  id: string;
  title: string;
  description: string;
  priority: number;
  status: string;
}

interface WorkflowState {
  setup: boolean;
  analysis: boolean;
  strategy: boolean;
  content: boolean;
  automation: boolean;
}

const MarketingHubWow = ({ profile }: MarketingHubWowProps) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  
  // Set tab from URL ?tab= and react to changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    
    // If coming from audiencias route, open analyze tab  
    if (view === 'marketing-hub' && tab === 'analyze') {
      setActiveTab('analyze');
    } else if (tab) {
      const allowed = new Set(['dashboard', 'create', 'analyze', 'content', 'history', 'campaigns', 'calendar', 'configuracion']);
      if (allowed.has(tab)) {
        setActiveTab(tab);
      }
    }
  }, [searchParams]);

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
  const [stepDetails, setStepDetails] = useState({
    title: '',
    description: ''
  });
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
  const [showObjectiveDialog, setShowObjectiveDialog] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState('');
  const [customObjective, setCustomObjective] = useState('');
  const [tempCompanyData, setTempCompanyData] = useState<CompanyData>({
    nombre_empresa: '',
    pais: '',
    objetivo_de_negocio: '',
    propuesta_de_valor: '',
    url_sitio_web: '',
    objective_id: '',
    redes_socciales_activas: []
  });
  const [availableObjectives, setAvailableObjectives] = useState<CompanyObjective[]>([]);
  const [platformStats, setPlatformStats] = useState({
    instagram: { posts: 0, followers: 0, engagement: 0 },
    linkedin: { posts: 0, connections: 0, engagement: 0 },
    facebook: { posts: 0, likes: 0, engagement: 0 },
    tiktok: { posts: 0, views: 0, engagement: 0 }
  });

  const { toast } = useToast();
  
  // Get the authenticated user ID directly
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize userId from auth
  useEffect(() => {
    const initializeUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const authUserId = user?.id;
      const profileUserId = profile?.user_id;
      
      console.log('🔍 Auth User ID:', authUserId);
      console.log('🔍 Profile User ID:', profileUserId);
      console.log('🔍 Profile prop:', profile);
      
      // Use profile user_id if available, fallback to auth user id
      const finalUserId = profileUserId || authUserId;
      setUserId(finalUserId);
      console.log('🔍 Final userId set to:', finalUserId);
    };
    
    initializeUserId();
  }, [profile]);

  useEffect(() => {
    let active = true;
    const resolve = async () => {
      try {
        if (profile?.user_id) {
          if (active) setUserId(profile.user_id);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (active) setUserId(user?.id ?? null);
        }
      } catch (e) {
        console.warn('No se pudo resolver userId:', e);
      }
    };
    resolve();
    return () => { active = false; };
  }, [profile?.user_id]);

  useEffect(() => {
    if (userId) {
      initializeMarketingHub();
    }
  }, [userId]);

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
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_connected')
        .eq('user_id', userId)
        .eq('is_connected', true);

      if (error) throw error;

      let platforms = new Set((data || []).map((a: any) => a.platform));

      if (!platforms.size) {
        console.log('ℹ️ No hay conexiones en BD. Intentando sincronizar con Upload-Post...');
        const init = await supabase.functions.invoke('upload-post-manager', {
          body: { action: 'init_profile', data: {} }
        });
        const companyUsername = (init.data as any)?.companyUsername;
        if (companyUsername) {
          await supabase.functions.invoke('upload-post-manager', {
            body: { action: 'get_connections', data: { companyUsername } }
          });
          const { data: refreshed } = await supabase
            .from('social_accounts')
            .select('platform, is_connected')
            .eq('user_id', userId)
            .eq('is_connected', true);
          platforms = new Set((refreshed || []).map((a: any) => a.platform));
        }
      }

      setSocialConnections({
        linkedin: platforms.has('linkedin'),
        instagram: platforms.has('instagram'),
        facebook: platforms.has('facebook'),
        tiktok: platforms.has('tiktok')
      });
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadRealMetrics = async () => {
    try {
      // Get current and previous period data for real trend calculations
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 30-60 days ago
      
      const [
        currentInsights, previousInsights,
        currentPosts, previousPosts,
        campaignsRes, actionsRes,
        audiencesRes, socialAccountsRes
      ] = await Promise.all([
        // Current period insights
        supabase.from('marketing_insights').select('*')
          .eq('user_id', userId)
          .gte('created_at', currentPeriodStart.toISOString()),
        // Previous period insights  
        supabase.from('marketing_insights').select('*')
          .eq('user_id', userId)
          .gte('created_at', previousPeriodStart.toISOString())
          .lt('created_at', currentPeriodStart.toISOString()),
        // Current period posts (all platforms)
        Promise.all([
          supabase.from('linkedin_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('instagram_posts').select('like_count, comment_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('tiktok_posts').select('digg_count, comment_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString())
        ]),
        // Previous period posts
        Promise.all([
          supabase.from('linkedin_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('instagram_posts').select('like_count, comment_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('tiktok_posts').select('digg_count, comment_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString())
        ]),
        // Active campaigns
        supabase.from('marketing_campaigns').select('*').eq('user_id', userId).in('status', ['active', 'running']),
        // Completed actions
        supabase.from('marketing_actionables').select('status').eq('user_id', userId).eq('status', 'completed'),
        // Audiences
        supabase.from('company_audiences').select('*').eq('user_id', userId),
        // Social connections
        supabase.from('social_accounts').select('platform, is_connected').eq('user_id', userId).eq('is_connected', true)
      ]);

      // Calculate current metrics
      const totalInsights = currentInsights.data?.length || 0;
      const previousTotalInsights = previousInsights.data?.length || 0;
      const insightsGrowth = previousTotalInsights > 0 ? 
        ((totalInsights - previousTotalInsights) / previousTotalInsights * 100).toFixed(1) : 
        totalInsights > 0 ? '100' : '0';

      // Calculate engagement from all platforms
      const calculateEngagement = (platformPosts: any[]) => {
        return platformPosts.reduce((total, posts) => {
          return total + (posts.data || []).reduce((sum: number, post: any) => {
            const likes = post.likes_count || post.like_count || post.digg_count || 0;
            const comments = post.comments_count || post.comment_count || 0;
            return sum + likes + comments;
          }, 0);
        }, 0);
      };

      const currentEngagement = calculateEngagement(currentPosts);
      const previousEngagement = calculateEngagement(previousPosts);
      const engagementGrowth = previousEngagement > 0 ? 
        ((currentEngagement - previousEngagement) / previousEngagement * 100).toFixed(1) : 
        currentEngagement > 0 ? '100' : '0';

      const activeCampaigns = campaignsRes.data?.length || 0;
      const completedActions = actionsRes.data?.length || 0;
      const totalAudiences = audiencesRes.data?.length || 0;
      const connectedPlatforms = socialAccountsRes.data?.length || 0;

      // Calculate automation score based on real data
      const automationScore = totalInsights > 0 ? 
        Math.round((completedActions / totalInsights) * 100) : 0;

      const insightsGrowthNum = parseFloat(insightsGrowth);
      const engagementGrowthNum = parseFloat(engagementGrowth);

      const metrics: QuickStat[] = [
        {
          label: "Insights Generados",
          value: totalInsights.toString(),
          change: `${insightsGrowthNum >= 0 ? '+' : ''}${insightsGrowth}%`,
          trend: insightsGrowthNum > 0 ? "up" : insightsGrowthNum < 0 ? "down" : "neutral",
          icon: Brain,
          color: "text-purple-600",
          description: "Análisis inteligentes generados este mes"
        },
        {
          label: "Engagement Total",
          value: formatNumber(currentEngagement),
          change: `${engagementGrowthNum >= 0 ? '+' : ''}${engagementGrowth}%`,
          trend: engagementGrowthNum > 0 ? "up" : engagementGrowthNum < 0 ? "down" : "neutral",
          icon: Heart,
          color: "text-pink-600",
          description: "Interacciones en todas las plataformas"
        },
        {
          label: "Campañas Activas",
          value: activeCampaigns.toString(),
          change: activeCampaigns > 0 ? `${activeCampaigns} en curso` : "Sin campañas",
          trend: activeCampaigns > 0 ? "up" : "neutral",
          icon: Rocket,
          color: "text-blue-600",
          description: "Campañas de marketing en ejecución"
        },
        {
          label: "Score de Automatización",
          value: `${automationScore}%`,
          change: completedActions > 0 ? `${completedActions} acciones` : "Sin acciones",
          trend: automationScore > 70 ? "up" : automationScore > 30 ? "neutral" : "down",
          icon: Zap,
          color: "text-green-600",
          description: "Eficiencia de automatización IA"
        }
      ];

      setRealMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Set empty state instead of hardcoded values
      setRealMetrics([
        {
          label: "Insights Generados",
          value: "0",
          change: "Iniciando análisis",
          trend: "neutral",
          icon: Brain,
          color: "text-purple-600",
          description: "Conecta tus redes para generar insights"
        },
        {
          label: "Engagement Total", 
          value: "0",
          change: "Sin datos disponibles",
          trend: "neutral",
          icon: Heart,
          color: "text-pink-600",
          description: "Conecta tus redes sociales"
        },
        {
          label: "Campañas Activas",
          value: "0", 
          change: "Crea tu primera campaña",
          trend: "neutral",
          icon: Rocket,
          color: "text-blue-600",
          description: "Inicia tu estrategia de marketing"
        },
        {
          label: "Score de Automatización",
          value: "0%",
          change: "Configura automatización",
          trend: "neutral", 
          icon: Zap,
          color: "text-green-600",
          description: "Optimiza con IA"
        }
      ]);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const [insights, posts, campaigns] = await Promise.all([
        supabase.from('marketing_insights').select('created_at, title, insight_type').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('linkedin_posts').select('posted_at, content').eq('user_id', userId).order('posted_at', { ascending: false }).limit(3),
        supabase.from('marketing_campaigns').select('created_at, name, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(2)
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
        .eq('user_id', userId)
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
      console.log('🔍 Loading platform stats for userId:', userId);
      
      const [instagramRes, linkedinRes, facebookRes, tiktokRes] = await Promise.all([
        supabase.from('instagram_posts').select('like_count, comment_count, reach, created_at').eq('user_id', userId),
        supabase.from('linkedin_posts').select('likes_count, comments_count, views_count, created_at').eq('user_id', userId),
        supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId),
        supabase.from('tiktok_posts').select('digg_count, comment_count, play_count, created_at').eq('user_id', userId)
      ]);

      console.log('📊 Platform data results:', {
        instagram: instagramRes.data?.length || 0,
        linkedin: linkedinRes.data?.length || 0,
        facebook: facebookRes.data?.length || 0,
        tiktok: tiktokRes.data?.length || 0
      });

      const calculateStats = (posts: any[], likeField: string, commentField: string, reachField?: string) => {
        if (!posts || posts.length === 0) return { posts: 0, engagement: 0, reach: 0 };
        
        const totalLikes = posts.reduce((sum, post) => sum + (post[likeField] || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post[commentField] || 0), 0);
        const totalReach = reachField ? posts.reduce((sum, post) => sum + (post[reachField] || 0), 0) : 0;
        
        return {
          posts: posts.length,
          engagement: totalLikes + totalComments,
          reach: totalReach
        };
      };

      const instagramStats = calculateStats(instagramRes.data || [], 'like_count', 'comment_count', 'reach');
      const linkedinStats = calculateStats(linkedinRes.data || [], 'likes_count', 'comments_count', 'views_count');
      const facebookStats = calculateStats(facebookRes.data || [], 'likes_count', 'comments_count');
      const tiktokStats = calculateStats(tiktokRes.data || [], 'digg_count', 'comment_count', 'play_count');

      setPlatformStats({
        instagram: {
          ...instagramStats,
          followers: 0 // Will be populated when Instagram API data is available
        },
        linkedin: {
          ...linkedinStats,
          connections: 0 // Will be populated when LinkedIn API data is available
        },
        facebook: {
          ...facebookStats,
          likes: 0 // Will be populated when Facebook API data is available
        },
        tiktok: {
          ...tiktokStats,
          views: tiktokStats.reach || 0
        }
      });
    } catch (error) {
      console.error('Error loading platform stats:', error);
      // Set empty stats for error state
      setPlatformStats({
        instagram: { posts: 0, followers: 0, engagement: 0 },
        linkedin: { posts: 0, connections: 0, engagement: 0 },
        facebook: { posts: 0, likes: 0, engagement: 0 },
        tiktok: { posts: 0, views: 0, engagement: 0 }
      });
    }
  };

  const checkWorkflowStatus = async () => {
    try {
      const { data: companyMember } = await supabase
        .from('company_members')
        .select(`
          company_id,
          companies (
            id, name, country, description, website_url, industry_sector
          )
        `)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .limit(1)
        .single();

      const [campaignRes] = await Promise.all([
        supabase.from('marketing_insights').select('*').eq('user_id', userId).limit(1)
      ]);

      setWorkflow({
        setup: companyMember?.companies ? true : false,
        analysis: false,
        strategy: (campaignRes.data?.length || 0) > 0,
        content: false,
        automation: false
      });

      if (companyMember?.companies) {
        const company = companyMember.companies;
        setCompanyData({
          nombre_empresa: company.name || '',
          pais: company.country || '',
          objetivo_de_negocio: company.description || '',
          propuesta_de_valor: '',
          url_sitio_web: company.website_url || ''
        });
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
    }
  };

  // Helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    else if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString();
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      if (diffHours < 1) return 'En menos de 1 hora';
      return `En ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    }
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 7) return `En ${diffDays} días`;
    return date.toLocaleDateString();
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'audience': return Users;
      case 'content': return PenTool;
      case 'performance': return TrendingUp;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'audience': return 'text-blue-600';
      case 'content': return 'text-green-600';
      case 'performance': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'image': return Image;
      default: return MessageCircle;
    }
  };

  const getPlatformInfo = (platform: keyof typeof platformStats) => {
    const configs = {
      instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-500' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-600' },
      facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-700' },
      tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black' }
    };
    return configs[platform] || { name: platform, icon: '🌐', color: 'bg-gray-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AdvancedAILoader 
          isVisible={true}
          currentStep={2}
          totalSteps={6}
          stepTitle="Inicializando Marketing Hub..."
          stepDescription="Cargando datos de tu ecosistema de marketing"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {realMetrics.map((metric, index) => (
          <Card key={index} className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full bg-gradient-to-br ${
                  metric.color === 'text-purple-600' ? 'from-purple-100 to-purple-50' :
                  metric.color === 'text-pink-600' ? 'from-pink-100 to-pink-50' :
                  metric.color === 'text-blue-600' ? 'from-blue-100 to-blue-50' :
                  'from-green-100 to-green-50'
                }`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
                <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                  {metric.change}
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                {metric.description && (
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 lg:w-fit lg:grid-cols-8 mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Crear</span>
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Audiencias</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">Campañas</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Contenido</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="space-y-6">
            {/* Enhanced Content Analysis - Full Width for Wow Effect */}
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <PieChart className="w-6 h-6" />
                  Análisis Inteligente de Contenido
                </CardTitle>
                <p className="text-blue-100">Insights avanzados sobre el rendimiento de tu contenido</p>
              </CardHeader>
              <CardContent className="p-6">
                <ContentAnalysisDashboard profile={profile} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enhanced Network Analysis */}
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 via-white to-emerald-50">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5" />
                    Rendimiento por Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(platformStats)
                      .filter(([platform]) => (socialConnections as any)[platform as keyof typeof socialConnections])
                      .map(([platform, stats]) => {
                        const platformInfo = getPlatformInfo(platform as keyof typeof platformStats);
                        const engagementRate = stats.posts > 0 ? (stats.engagement / stats.posts).toFixed(1) : '0';
                        return (
                          <div key={platform} className="relative overflow-hidden p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg">
                                  {platformInfo.icon}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{platformInfo.name}</p>
                                  <p className="text-sm text-gray-500">{stats.posts} publicaciones</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  {formatNumber(stats.engagement)}
                                </p>
                                <p className="text-xs text-gray-500">total engagement</p>
                                {stats.posts > 0 && (
                                  <p className="text-xs font-medium text-blue-600">{engagementRate} avg/post</p>
                                )}
                              </div>
                            </div>
                            {stats.posts > 0 && (
                              <div className="mt-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min((stats.engagement / 1000) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 via-white to-pink-50">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Acciones Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="w-full justify-start bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Crear Contenido
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('analyze')}
                      variant="outline"
                      className="w-full justify-start border-purple-300 hover:bg-purple-50"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Gestionar Audiencias
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('campaigns')}
                      variant="outline"
                      className="w-full justify-start border-blue-300 hover:bg-blue-50"
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      Ver Campañas
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('history')}
                      variant="outline"
                      className="w-full justify-start border-green-300 hover:bg-green-50"
                    >
                      <HistoryIcon className="w-4 h-4 mr-2" />
                      Ver Historial
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <ContentCreatorTab 
            profile={profile} 
            topPosts={recentActivity || []}
            selectedPlatform={selectedPlatform}
          />
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Mis Audiencias
              </CardTitle>
              <p className="text-muted-foreground">
                Gestiona y analiza tus audiencias objetivo para campañas más efectivas
              </p>
            </CardHeader>
            <CardContent>
              <AudienciasManager profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignDashboard />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <ContentCalendar profile={profile} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentLibraryTab profile={profile} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UploadHistory profile={profile} />
            <ScheduledPostsManager profile={profile} />
          </div>
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración del Marketing Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SocialConnectionManager profile={profile} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingHubWow;