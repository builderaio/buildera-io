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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import { Sparkles, BarChart3, Calendar, TrendingUp, Users, Heart, MessageCircle, ArrowRight, Plus, ChevronRight, Zap, Eye, Target, Brain, Rocket, Star, Activity, PieChart, LineChart, CheckCircle2, PlayCircle, Image, Video, PenTool, Globe, Wand2, Camera, TrendingDown, Hash, Clock, Award, Network, Share2, Download, Upload, RefreshCw, Filter, Search, Settings, History as HistoryIcon, Linkedin, Instagram, Facebook, Music } from "lucide-react";
import { SOCIAL_PLATFORMS, getPlatform, getPlatformDisplayName, getPlatformIcon } from '@/lib/socialPlatforms';
import { SocialConnectionManager } from './SocialConnectionManager';
import ContentCreatorTab from './ContentCreatorTab';
import ContentLibraryTab from './ContentLibraryTab';
import { ScheduledPostsManager } from './ScheduledPostsManager';
import { UploadHistory } from './UploadHistory';
import MarketingHubOrchestrator from './MarketingHubOrchestrator';
import AudienciasManager from './AudienciasManager';
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
  objective_id?: string; // ID del objetivo seleccionado
  redes_socciales_activas?: string[]; // Redes sociales conectadas
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
const MarketingHubWow = ({
  profile
}: MarketingHubWowProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  // Set initial tab from URL ?tab=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const view = params.get('view');
    
    // If coming from audiencias route, open analyze tab
    if (view === 'marketing-hub' && tab === 'analyze') {
      setActiveTab('analyze');
    } else if (tab) {
      const allowed = new Set(['dashboard', 'create', 'analyze', 'campaign-wizard', 'configuracion']);
      if (tab && allowed.has(tab)) setActiveTab(tab);
    }
  }, []);
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
    instagram: {
      posts: 0,
      followers: 0,
      engagement: 0
    },
    linkedin: {
      posts: 0,
      connections: 0,
      engagement: 0
    },
    facebook: {
      posts: 0,
      likes: 0,
      engagement: 0
    },
    tiktok: {
      posts: 0,
      views: 0,
      engagement: 0
    }
  });
  const {
    toast
  } = useToast();
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      try {
        if (profile?.user_id) {
          if (active) setUserId(profile.user_id);
        } else {
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();
          if (active) setUserId(user?.id ?? null);
        }
      } catch (e) {
        console.warn('No se pudo resolver userId:', e);
      }
    };
    resolve();
    return () => {
      active = false;
    };
  }, [profile?.user_id]);
  useEffect(() => {
    if (userId) {
      initializeMarketingHub();
    }
  }, [userId]);
  const initializeMarketingHub = async () => {
    setLoading(true);
    try {
      await Promise.all([loadConnections(), loadRealMetrics(), loadRecentActivity(), loadUpcomingPosts(), loadPlatformStats(), checkWorkflowStatus()]);
    } catch (error) {
      console.error('Error initializing Marketing Hub:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadConnections = async () => {
    try {
      // 1) Leer desde la BD
      const {
        data,
        error
      } = await supabase.from('social_accounts').select('platform, is_connected').eq('user_id', userId).eq('is_connected', true);
      if (error) throw error;
      let platforms = new Set((data || []).map((a: any) => a.platform));

      // 2) Si no hay conexiones, forzar sincronización con Upload-Post y volver a leer
      if (!platforms.size) {
        console.log('ℹ️ No hay conexiones en BD. Intentando sincronizar con Upload-Post...');
        // inicializar/obtener username
        const init = await supabase.functions.invoke('upload-post-manager', {
          body: {
            action: 'init_profile',
            data: {}
          }
        });
        const companyUsername = (init.data as any)?.companyUsername;
        if (companyUsername) {
          await supabase.functions.invoke('upload-post-manager', {
            body: {
              action: 'get_connections',
              data: {
                companyUsername
              }
            }
          });
          const {
            data: refreshed
          } = await supabase.from('social_accounts').select('platform, is_connected').eq('user_id', userId).eq('is_connected', true);
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
      const [insightsRes, actionablesRes, postsRes, campaignsRes] = await Promise.all([supabase.from('marketing_insights').select('*').eq('user_id', userId), supabase.from('marketing_actionables').select('status').eq('user_id', userId).eq('status', 'completed'), supabase.from('linkedin_posts').select('likes_count, comments_count').eq('user_id', userId), supabase.from('marketing_insights').select('*').eq('user_id', userId)]);
      const totalInsights = insightsRes.data?.length || 0;
      const completedActions = actionablesRes.data?.length || 0;
      const posts = postsRes.data || [];
      const campaigns = campaignsRes.data?.length || 0;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalEngagement = totalLikes + totalComments;
      const metrics: QuickStat[] = [{
        label: "Insights Generados",
        value: totalInsights.toString(),
        change: totalInsights > 0 ? `+${Math.min(totalInsights, 15)}` : "0",
        trend: "up",
        icon: Brain,
        color: "text-purple-600",
        description: "Análisis inteligentes generados"
      }, {
        label: "Engagement Total",
        value: formatNumber(totalEngagement),
        change: totalEngagement > 0 ? "+12.5%" : "0%",
        trend: totalEngagement > 0 ? "up" : "neutral",
        icon: Heart,
        color: "text-pink-600",
        description: "Interacciones en todas las plataformas"
      }, {
        label: "Campañas Activas",
        value: campaigns.toString(),
        change: campaigns > 0 ? `+${campaigns}` : "0",
        trend: campaigns > 0 ? "up" : "neutral",
        icon: Rocket,
        color: "text-blue-600",
        description: "Campañas de marketing en ejecución"
      }, {
        label: "Score de Automatización",
        value: `${Math.round(completedActions / Math.max(totalInsights, 1) * 100)}%`,
        change: completedActions > 0 ? "+15%" : "0%",
        trend: completedActions > 0 ? "up" : "neutral",
        icon: Zap,
        color: "text-green-600",
        description: "Eficiencia de automatización"
      }];
      setRealMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };
  const loadRecentActivity = async () => {
    try {
      const [insights, posts, campaigns] = await Promise.all([supabase.from('marketing_insights').select('created_at, title, insight_type').eq('user_id', userId).order('created_at', {
        ascending: false
      }).limit(5), supabase.from('linkedin_posts').select('posted_at, content').eq('user_id', userId).order('posted_at', {
        ascending: false
      }).limit(3), supabase.from('marketing_campaigns').select('created_at, name, status').eq('user_id', userId).order('created_at', {
        ascending: false
      }).limit(2)]);
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
      const {
        data: scheduledPosts
      } = await supabase.from('scheduled_posts').select('*').eq('user_id', userId).gte('scheduled_for', new Date().toISOString()).order('scheduled_for', {
        ascending: true
      }).limit(5);
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
      const [instagramRes, linkedinRes, facebookRes, tiktokRes] = await Promise.all([supabase.from('instagram_posts').select('like_count, comment_count, reach').eq('user_id', userId), supabase.from('linkedin_posts').select('likes_count, comments_count').eq('user_id', userId), supabase.from('facebook_posts').select('likes_count, comments_count, reach').eq('user_id', userId), supabase.from('tiktok_posts').select('digg_count, comment_count, play_count').eq('user_id', userId)]);
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
      const {
        data: companyMember,
        error: memberError
      } = await supabase.from('company_members').select(`
          company_id,
          companies (
            id,
            name,
            country,
            description,
            website_url,
            industry_sector
          )
        `).eq('user_id', userId).eq('is_primary', true).limit(1).single();
      console.log('Company member result:', {
        companyMember,
        memberError
      });
      const [campaignRes] = await Promise.all([supabase.from('marketing_insights').select('*').eq('user_id', userId).limit(1)]);
      setWorkflow({
        setup: companyMember?.companies ? true : false,
        analysis: false,
        // Se establecerá según análisis previos
        strategy: (campaignRes.data?.length || 0) > 0,
        content: false,
        // Se establecerá según contenido generado
        automation: false // Se establecerá según automatizaciones activas
      });
      if (companyMember?.companies) {
        const company = companyMember.companies;
        console.log('Company data found:', company);

        // Enriquecer datos desde company_strategy, company_objectives, company_branding y conexiones sociales
        const [objectivesRes, strategyRes, brandingRes, connectionsRes] = await Promise.all([supabase.from('company_objectives').select('id, title, description, status, priority').eq('company_id', company.id).eq('status', 'active').order('priority', {
          ascending: false
        }), supabase.from('company_strategy').select('propuesta_valor, vision, mision').eq('company_id', company.id).limit(1).maybeSingle(), supabase.from('company_branding').select('brand_voice, visual_identity, full_brand_data').eq('company_id', company.id).limit(1).maybeSingle(),
        // Obtener conexiones sociales activas
        Promise.all([supabase.from('linkedin_connections').select('id').eq('user_id', userId).limit(1), supabase.from('facebook_instagram_connections').select('id').eq('user_id', userId).limit(1), supabase.from('tiktok_connections').select('id').eq('user_id', userId).limit(1)])]);
        const objectives = objectivesRes.data as CompanyObjective[] || [];
        const strategy = strategyRes.data as any | null;
        const branding = brandingRes.data as any | null;
        const [linkedinConn, facebookConn, tiktokConn] = connectionsRes;

        // Guardar objetivos disponibles
        setAvailableObjectives(objectives);

        // Determinar redes sociales activas
        const redesSocialesActivas = [];
        if (linkedinConn.data && linkedinConn.data.length > 0) redesSocialesActivas.push('linkedin');
        if (facebookConn.data && facebookConn.data.length > 0) redesSocialesActivas.push('instagram', 'facebook');
        if (tiktokConn.data && tiktokConn.data.length > 0) redesSocialesActivas.push('tiktok');

        // Obtener propuesta de valor de company_strategy primero
        const propuestaDeValor = strategy?.propuesta_valor || branding?.brand_voice?.propuesta_de_valor || branding?.full_brand_data?.propuesta_de_valor || branding?.brand_voice?.unified_message || company.description || '';
        const newCompanyData: CompanyData = {
          nombre_empresa: company.name || '',
          pais: company.country || '',
          objetivo_de_negocio: '',
          // Se seleccionará desde el diálogo
          propuesta_de_valor: propuestaDeValor,
          url_sitio_web: company.website_url || '',
          objective_id: '',
          redes_socciales_activas: redesSocialesActivas
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

    // Verificar datos de empresa y cargar si están faltantes
    if (!companyData.nombre_empresa) {
      console.log('⚠️ Datos de empresa no cargados, recargando...');
      await checkWorkflowStatus();
    }

    // Usar datos existentes de la empresa
    const existingData = {
      ...companyData,
      redes_socciales_activas: Object.keys(socialConnections).filter(platform => socialConnections[platform as keyof typeof socialConnections])
    };
    console.log('📊 Datos de empresa para campaña:', existingData);

    // Verificar si hay redes sociales configuradas
    const hasConnections = existingData.redes_socciales_activas && existingData.redes_socciales_activas.length > 0;
    if (!hasConnections) {
      toast({
        title: "Redes sociales requeridas",
        description: "Debe configurar al menos una red social antes de crear una campaña. Vaya a la pestaña Dashboard para conectar sus redes sociales.",
        variant: "destructive"
      });
      return;
    }

    // Verificar datos mínimos de la empresa
    if (!existingData.nombre_empresa || !existingData.propuesta_de_valor) {
      toast({
        title: "Datos de empresa incompletos",
        description: "Se necesitan datos básicos de la empresa para crear la campaña. Por favor complete el perfil de empresa.",
        variant: "destructive"
      });
      return;
    }

    // Solo solicitar objetivo si no se ha proporcionado uno
    if (!dataOverride && (!existingData.objetivo_de_negocio || !existingData.objective_id && !customObjective)) {
      console.log('=== DEBUG: Solicitando objetivo de campaña ===');
      setShowObjectiveDialog(true);
      return;
    }

    // Usar el objetivo proporcionado o el existente
    const finalData = dataOverride || {
      ...existingData,
      objetivo_de_negocio: customObjective || existingData.objetivo_de_negocio,
      objective_id: selectedObjective || existingData.objective_id
    };
    console.log('=== DEBUG: Iniciando campaña con datos validados:', finalData);
    setCurrentProcess('intelligent-campaign');
    setProcessStep(0);
    setTotalSteps(8);
    setAnalysisProgress(0);
    setShowResults(false);
    try {
      // Paso 1: Análisis de audiencia
      updateProcess(1, "Análisis de Audiencia", "Identificando tu audiencia objetivo ideal...");
      let audienceResult;
      try {
        audienceResult = await callMarketingFunction('marketing-hub-target-audience', finalData);
      } catch (error) {
        console.warn('Error en análisis de audiencia, continuando...', error);
        audienceResult = {
          data: {
            audiencia_objetivo: "Audiencia general"
          }
        };
      }
      setAnalysisProgress(15);

      // Extraer audiencia objetivo del resultado para usar en siguiente paso
      const audienciaObjetivo = audienceResult?.data?.audiencia_objetivo || "Audiencia general";

      // Paso 2: Estrategia de marketing
      updateProcess(2, "Estrategia Inteligente", "Desarrollando estrategia personalizada...");
      const strategyData = {
        ...finalData,
        audiencia_objetivo: audienciaObjetivo
      };
      try {
        await callMarketingFunction('marketing-hub-marketing-strategy', strategyData);
      } catch (error) {
        console.warn('Error en estrategia de marketing, continuando...', error);
      }
      setAnalysisProgress(30);

      // Paso 3: Calendario de contenido
      updateProcess(3, "Calendario de Contenido", "Creando calendario optimizado...");
      const calendarData = {
        ...finalData,
        audiencia_objetivo: audienciaObjetivo,
        fecha_inicio_calendario: new Date().toISOString().split('T')[0],
        numero_dias_generar: 14
      };
      try {
        await callMarketingFunction('marketing-hub-content-calendar', calendarData);
      } catch (error) {
        console.warn('Error en calendario de contenido, continuando...', error);
      }
      setAnalysisProgress(45);

      // Paso 4: Análisis de plataformas conectadas
      updateProcess(4, "Análisis de Redes Sociales", "Analizando plataformas conectadas...");
      try {
        await analyzeConnectedPlatforms();
      } catch (error) {
        console.warn('Error en análisis de plataformas, continuando...', error);
      }
      setAnalysisProgress(60);

      // Paso 5: Creación de contenido
      updateProcess(5, "Creación de Contenido", "Generando posts optimizados...");
      try {
        await createOptimizedContent();
      } catch (error) {
        console.warn('Error en creación de contenido, continuando...', error);
      }
      setAnalysisProgress(75);

      // Paso 6: Análisis avanzado
      updateProcess(6, "Análisis Avanzado", "Ejecutando análisis inteligente...");
      try {
        await runAdvancedAnalysis();
      } catch (error) {
        console.warn('Error en análisis avanzado, continuando...', error);
      }
      setAnalysisProgress(90);

      // Paso 7: Optimización
      updateProcess(7, "Optimización Final", "Aplicando mejores prácticas...");
      try {
        await optimizeCampaign();
      } catch (error) {
        console.warn('Error en optimización, continuando...', error);
      }
      setAnalysisProgress(100);

      // Paso 8: Resultados
      updateProcess(8, "¡Campaña Lista!", "Su campaña inteligente está lista para ejecutar");
      setShowResults(true);
      setWorkflow(prev => ({
        ...prev,
        analysis: true,
        strategy: true,
        content: true
      }));
      toast({
        title: "🚀 ¡Campaña Inteligente Creada!",
        description: "Su campaña de marketing ha sido generada con IA avanzada"
      });

      // Recargar métricas y actividad
      try {
        await Promise.all([loadRealMetrics(), loadRecentActivity(), loadUpcomingPosts()]);
      } catch (error) {
        console.warn('Error recargando métricas, continuando...', error);
      }
    } catch (error: any) {
      console.error('❌ Error creating intelligent campaign:', error);
      toast({
        title: "Error en la campaña",
        description: `No se pudo completar la campaña inteligente: ${error.message || 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setCurrentProcess(null);
      setProcessStep(0);
    }
  };
  const handleObjectiveSelection = async () => {
    const objectiveData = {
      ...companyData,
      objetivo_de_negocio: customObjective || companyData.objetivo_de_negocio,
      objective_id: selectedObjective || companyData.objective_id,
      redes_socciales_activas: Object.keys(socialConnections).filter(platform => socialConnections[platform as keyof typeof socialConnections])
    };
    setShowObjectiveDialog(false);

    // Continuar con la campaña usando los datos existentes + objetivo
    startIntelligentCampaign(objectiveData);
  };
  const analyzeConnectedPlatforms = async () => {
    const connectedPlatforms = Object.entries(socialConnections).filter(([_, connected]) => connected).map(([platform, _]) => platform);
    console.log(`📱 Analizando ${connectedPlatforms.length} plataformas conectadas:`, connectedPlatforms);
    for (const platform of connectedPlatforms) {
      try {
        console.log(`🔍 Analizando ${platform}...`);
        await supabase.functions.invoke(`${platform}-intelligent-analysis`, {
          body: {
            platform
          }
        });
        console.log(`✅ Análisis de ${platform} completado`);
      } catch (error) {
        console.error(`❌ Error analyzing ${platform}:`, error);
        // Continuar con la siguiente plataforma sin fallar
      }
    }
  };
  const createOptimizedContent = async () => {
    const contentTypes = ['post', 'image', 'reel'];
    for (const type of contentTypes) {
      try {
        console.log(`🎨 Creando contenido ${type}...`);
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
            tema_concepto: companyData.propuesta_de_valor || "Contenido optimizado"
          }
        });
        console.log(`✅ Contenido ${type} creado exitosamente`);
      } catch (error) {
        console.error(`❌ Error creating ${type}:`, error);
        // Continuar con el siguiente tipo de contenido sin fallar
      }
    }
  };
  const runAdvancedAnalysis = async () => {
    try {
      await Promise.all([supabase.functions.invoke('advanced-social-analyzer', {
        body: {
          action: 'comprehensive_analysis'
        }
      }), supabase.functions.invoke('content-insights-analyzer', {
        body: {
          platform: null
        }
      }), supabase.functions.invoke('calculate-social-analytics', {
        body: {}
      })]);
    } catch (error) {
      console.error('Error in advanced analysis:', error);
    }
  };
  const optimizeCampaign = async () => {
    // Aplicar optimizaciones finales y configurar automatizaciones
    try {
      await supabase.functions.invoke('premium-ai-insights', {
        body: {
          optimize: true
        }
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
    console.log(`🔄 Calling marketing function: ${functionName}`, data);
    try {
      const {
        data: result,
        error
      } = await supabase.functions.invoke(functionName, {
        body: {
          input: data
        },
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });
      if (error) {
        console.error(`❌ Error in ${functionName}:`, error);
        throw error;
      }
      console.log(`✅ Success in ${functionName}:`, result);
      return result;
    } catch (error) {
      console.error(`🚨 Fatal error in ${functionName}:`, error);
      throw error;
    }
  };
  const updateProcess = (step: number, title: string, description: string) => {
    setProcessStep(step);
    setStepDetails({
      title,
      description
    });
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
      case 'optimal_timing':
        return Clock;
      case 'content_performance':
        return BarChart3;
      case 'hashtag_optimization':
        return Hash;
      case 'sentiment_analysis':
        return Heart;
      default:
        return Sparkles;
    }
  };
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'optimal_timing':
        return 'text-blue-600';
      case 'content_performance':
        return 'text-green-600';
      case 'hashtag_optimization':
        return 'text-purple-600';
      case 'sentiment_analysis':
        return 'text-pink-600';
      default:
        return 'text-yellow-600';
    }
  };
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'reel':
        return PlayCircle;
      default:
        return PenTool;
    }
  };
  const getPlatformIcon = (platform: string) => {
    const platformConfig = getPlatform(platform);
    if (!platformConfig) return Globe;
    
    const IconComponent = platformConfig.icon;
    switch (platform?.toLowerCase()) {
      case 'linkedin':
        return Linkedin;
      case 'instagram':
        return Instagram; 
      case 'facebook':
        return Facebook;
      case 'tiktok':
        return Music; // Usando Music como representativo de TikTok
      default:
        return Globe;
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
              
              
            </div>

            
          </div>
        </div>

        {/* Process Loading */}
        {currentProcess && <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
                <AdvancedAILoader isVisible={true} currentStep={processStep} totalSteps={totalSteps} stepTitle={stepDetails.title} stepDescription={stepDetails.description} />
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso de la campaña</span>
                  <span className="text-sm text-muted-foreground">{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} className="h-3 bg-primary/10" />
              </div>
            </CardContent>
          </Card>}

        {/* Metrics Dashboard */}
        

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 h-16 p-1 bg-muted/50 backdrop-blur-sm rounded-2xl">
            {[{
            value: "dashboard",
            icon: BarChart3,
            label: "Panel"
          }, {
            value: "analyze",
            icon: Users,
            label: "Audiencias"
          }, {
            value: "create",
            icon: Wand2,
            label: "Contenido"
          }, {
            value: "campaign-wizard",
            icon: Rocket,
            label: "Campañas"
          }, {
            value: "configuracion",
            icon: Settings,
            label: "Configuración"
          }].map(tab => <TabsTrigger key={tab.value} value={tab.value} className="flex flex-col items-center gap-1 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl transition-all duration-300">
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </TabsTrigger>)}
          </TabsList>

          {/* Campaign Wizard Tab */}
          <TabsContent value="campaign-wizard" className="space-y-8">
            <MarketingHubOrchestrator />
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
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
                    return <div key={platform} className={`p-4 rounded-xl border-2 transition-all duration-300 ${isConnected ? 'border-green-200 bg-green-50/50 hover:shadow-md' : 'border-gray-200 bg-gray-50/50'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <PlatformIcon className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-gray-500'}`} />
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
                        </div>;
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
                  <Button onClick={() => setActiveTab("create")} className="w-full justify-between h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 group transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Contenido con IA</span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button onClick={() => setActiveTab("analyze")} variant="outline" className="w-full justify-between h-14 hover:bg-primary/5 group transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="font-medium">Análisis Inteligente</span>
                    </div>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button onClick={() => setActiveTab("schedule")} variant="outline" className="w-full justify-between h-14 hover:bg-primary/5 group transition-all duration-300">
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
                    {recentActivity.length > 0 ? recentActivity.map((activity, index) => {
                    const IconComponent = activity.icon;
                    return <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                              {activity.preview && <p className="text-xs text-muted-foreground/80 mt-1 italic">{activity.preview}</p>}
                            </div>
                            {activity.category && <Badge variant="secondary" className="text-xs">
                                {activity.category}
                              </Badge>}
                          </div>;
                  }) : <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay actividad reciente</p>
                        <p className="text-sm mt-1">Cree su primera campaña para empezar</p>
                      </div>}
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
                    {upcomingPosts.length > 0 ? upcomingPosts.map((post, index) => {
                    const IconComponent = post.icon;
                    const PlatformIcon = getPlatformIcon(post.platform);
                    return <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer group">
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
                          </div>;
                  }) : <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay posts programados</p>
                        <p className="text-sm mt-1">Programe contenido para automatizar su marketing</p>
                      </div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audiencias Tab */}
          <TabsContent value="analyze" className="space-y-8">
            <AudienciasManager profile={profile} />
          </TabsContent>

          {/* Contenido Tab */}
          <TabsContent value="create" className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Centro de Contenido</h2>
                  <p className="text-muted-foreground">
                    Gestiona tu contenido, biblioteca y publicaciones programadas
                  </p>
                </div>
              </div>

              <Tabs defaultValue="post" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="post" className="flex items-center gap-2">
                    <PenTool className="h-4 w-4" />
                    Post
                  </TabsTrigger>
                  <TabsTrigger value="biblioteca" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Biblioteca
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4" />
                    Historial
                  </TabsTrigger>
                  <TabsTrigger value="programados" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Programados
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="post" className="space-y-6">
                  <ContentCreatorTab 
                    profile={profile} 
                    topPosts={[]} 
                    selectedPlatform="instagram" 
                  />
                </TabsContent>

                <TabsContent value="biblioteca" className="space-y-6">
                  <ContentLibraryTab profile={profile} />
                </TabsContent>

                <TabsContent value="historial" className="space-y-6">
                  <UploadHistory profile={profile} />
                </TabsContent>

                <TabsContent value="programados" className="space-y-6">
                  <ScheduledPostsManager profile={profile} />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>


          {/* Configuración Tab */}
          <TabsContent value="configuracion" className="space-y-8">
            <SocialConnectionManager profile={profile} onConnectionsUpdated={loadConnections} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para seleccionar objetivo de campaña */}
      <Dialog open={showObjectiveDialog} onOpenChange={setShowObjectiveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Objetivo de la Campaña</DialogTitle>
            <DialogDescription>
              Seleccione el objetivo principal para esta campaña de marketing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Objetivo de la campaña (requerido)</Label>
              {availableObjectives && availableObjectives.length > 0 ? <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un objetivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableObjectives.map((objective: any) => <SelectItem key={objective.id} value={objective.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{objective.title}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {objective.description}
                          </span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select> : <Textarea placeholder="Describa el objetivo principal para esta campaña..." value={customObjective} onChange={e => setCustomObjective(e.target.value)} rows={3} />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowObjectiveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleObjectiveSelection} disabled={!selectedObjective && !customObjective.trim()}>
              Iniciar Campaña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingHubWow;