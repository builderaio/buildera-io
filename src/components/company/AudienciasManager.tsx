import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Brain, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Sparkles,
  Play,
  Zap,
  Eye,
  Clock,
  DollarSign,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  Download,
  Share2,
  Settings,
  PlusCircle,
  ArrowRight,
  Gauge,
  ThumbsUp,
  Lightbulb,
  Rocket,
  Database,
  Users2,
  LineChart,
  PieChart,
  BarChart,
  Calendar,
  ShoppingCart,
  Mail,
  MessageSquare,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music,
  X,
  Building,
  Wifi,
  WifiOff,
  Plus,
  ChevronRight
} from "lucide-react";
import { SocialConnectionManager } from "./SocialConnectionManager";
import SocialAnalysisDisplay from "./SocialAnalysisDisplay";

interface AudienciasManagerProps {
  profile: any;
}

interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  estimated_size?: number;
  confidence_score?: number;
  conversion_potential?: number;
  acquisition_cost_estimate?: number;
  lifetime_value_estimate?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  company_id: string;
  is_active?: boolean;
  ai_insights?: any;
  age_ranges?: any;
  gender_split?: any;
  geographic_locations?: any;
  interests?: any;
  income_ranges?: any;
  education_levels?: any;
  job_titles?: any;
  industries?: any;
  company_sizes?: any;
  relationship_status?: any;
  device_usage?: any;
  platform_preferences?: any;
  content_preferences?: any;
  engagement_patterns?: any;
  online_behaviors?: any;
  purchase_behaviors?: any;
  brand_affinities?: any;
  influencer_following?: any;
  hashtag_usage?: any;
  content_consumption_habits?: any;
  active_hours?: any;
  facebook_targeting?: any;
  instagram_targeting?: any;
  linkedin_targeting?: any;
  twitter_targeting?: any;
  tiktok_targeting?: any;
  youtube_targeting?: any;
  goals?: string[];
  pain_points?: string[];
  motivations?: string[];
  challenges?: string[];
  tags?: string[];
  custom_attributes?: any;
  last_analysis_date?: string;
  professional_level?: any;
}

const AudienciasManager = ({ profile }: AudienciasManagerProps) => {
  console.log('🎯 AudienciasManager component rendered with profile:', profile);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentView, setCurrentView] = useState("main");
  const [showAudienceCreationDialog, setShowAudienceCreationDialog] = useState(false);
  const [suggestedAudiences, setSuggestedAudiences] = useState<any[]>([]);
  const [generatingAudiences, setGeneratingAudiences] = useState(false);
  const [audiences, setAudiences] = useState<AudienceSegment[]>([]);
  const [icpProfile, setIcpProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [companyData, setCompanyData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  
  const [newAudienceName, setNewAudienceName] = useState('');
  const [newAudienceDescription, setNewAudienceDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [socialStatsLoading, setSocialStatsLoading] = useState(true);
  const [hasSocialConnections, setHasSocialConnections] = useState(false);
  const [showUrlConfirmation, setShowUrlConfirmation] = useState(false);
  const [socialUrls, setSocialUrls] = useState<any>({});
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>([]);
  const [analyzingUrls, setAnalyzingUrls] = useState(false);
  
  const [stats, setStats] = useState({
    totalAudiences: 0,
    totalReach: 0,
    averageConversion: 0,
    avgAcquisitionCost: 0,
    totalLifetimeValue: 0,
    highPerformingSegments: 0
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [existingAnalysisCount, setExistingAnalysisCount] = useState(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState<string | null>(null);

  // Separate useEffect to listen for URL parameter changes
  useEffect(() => {
    const handleURLChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('audience_view');
      
      if (viewParam === 'create') {
        setCurrentView('create-audience');
      } else if (viewParam === 'suggestions') {
        setCurrentView('audience-suggestions');
      }
    };

    // Listen for URL changes (back/forward navigation)
    window.addEventListener('popstate', handleURLChange);
    
    // Check URL on component mount/update
    handleURLChange();

    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        let uid = profile?.user_id || userId;
        if (!uid) {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id || null;
          if (uid) setUserId(uid);
        }
        
        console.log('🔍 AudienciasManager - userId actual:', uid);
        console.log('🔍 AudienciasManager - profile:', profile);
        
        // Check URL params to determine initial view
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('audience_view');
        
        if (viewParam === 'create') {
          console.log('🎯 Setting currentView to create-audience from URL param');
          setCurrentView('create-audience');
        } else if (viewParam === 'suggestions') {
          console.log('🎯 Setting currentView to audience-suggestions from URL param');
          setCurrentView('audience-suggestions');
        }
        
        if (uid) {
          await Promise.all([
            loadAudiences(uid),
            loadCompanyData(uid),
            loadSocialAudienceStats(uid),
          ]);
        }
      } catch (e) {
        console.error('Error inicializando:', e);
      }
    };
    init();
  }, [profile?.user_id, userId]);

  const loadCompanyData = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;

    try {
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', resolvedUid)
        .eq('is_primary', true)
        .single();

      if (memberData) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', memberData.company_id)
          .single();
        
        setCompanyData(company);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  // Cuando se cargan datos de la empresa, preparar URLs sin forzar confirmación automática
  useEffect(() => {
    if (!companyData) return;
    const urls = extractSocialUrls(companyData);
    setSocialUrls(urls);
    // No activar confirmación aquí; la lógica dependerá de si existen análisis previos
  }, [companyData]);

  const loadAudiences = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('user_id', resolvedUid)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudiences(data || []);
    } catch (error) {
      console.error('Error loading audiences:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las audiencias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIAudiences = async () => {
    if (!userId || !companyData?.id) {
      toast({
        title: "Error",
        description: "Datos de usuario o empresa no disponibles",
        variant: "destructive"
      });
      return;
    }

    setAiGenerating(true);
    try {
      console.log('🤖 Iniciando generación de audiencias con IA...');
      
      const { data, error } = await supabase.functions.invoke('ai-audience-generator', {
        body: {
          user_id: userId,
          company_id: companyData.id
        }
      });

      if (error) {
        console.error('Error en la función de IA:', error);
        throw error;
      }

      console.log('✅ Respuesta de la IA:', data);

      if (data.success && data.audiences?.length > 0) {
        await loadAudiences(userId);
        setCurrentView('main');
        
        toast({
          title: "¡Audiencias Generadas con IA!",
          description: `Se crearon ${data.generated_count} audiencias inteligentes basadas en tus datos`,
        });
      } else {
        throw new Error(data.error || 'No se pudieron generar audiencias');
      }

    } catch (error) {
      console.error('Error generando audiencias con IA:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar las audiencias con IA. Verifica que tengas datos de análisis disponibles.",
        variant: "destructive"
      });
    } finally {
      setAiGenerating(false);
    }
  };

  const extractSocialUrls = (company: any) => {
    const urls: any = {};
    const supported = ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook'];
    if (company?.instagram_url && supported.includes('instagram')) urls.instagram = company.instagram_url;
    if (company?.facebook_url && supported.includes('facebook')) urls.facebook = company.facebook_url;
    if (company?.twitter_url && supported.includes('twitter')) urls.twitter = company.twitter_url;
    if (company?.linkedin_url && supported.includes('linkedin')) {/* not supported - ignore */}
    if (company?.tiktok_url && supported.includes('tiktok')) urls.tiktok = company.tiktok_url;
    if (company?.youtube_url && supported.includes('youtube')) urls.youtube = company.youtube_url;
    return urls;
  };

  const checkCompanySocialUrls = () => {
    if (!companyData) return false;
    const urls = extractSocialUrls(companyData);
    setSocialUrls(urls);
    
    // Solo retornar si hay URLs, pero NO activar automáticamente la confirmación
    return Object.keys(urls).length > 0;
  };

  const analyzeWithConfirmedUrls = async () => {
    if (confirmedUrls.length === 0) {
      toast({
        title: "Error",
        description: "Por favor confirma al menos una URL de red social",
        variant: "destructive"
      });
      return;
    }

    setAnalyzingUrls(true);
    try {
      const urlsToAnalyze = confirmedUrls.map(platform => ({
        platform,
        url: socialUrls[platform]
      }));

      const { data, error } = await supabase.functions.invoke('analyze-social-audience', {
        body: { urls: urlsToAnalyze }
      });

      if (error) throw error;

      if (data.success) {
        setSocialStats(data.data || []);
        setHasSocialConnections(true);
        setShowUrlConfirmation(false);
        toast({
          title: "Análisis Completado",
          description: `Se analizaron ${data.data?.length || 0} perfiles exitosamente`,
        });
      } else {
        throw new Error(data.error || 'Failed to analyze URLs');
      }
    } catch (error) {
      console.error('Error analyzing social URLs:', error);
      toast({
        title: "Error en el Análisis",
        description: "No se pudieron analizar las redes sociales",
        variant: "destructive"
      });
    } finally {
      setAnalyzingUrls(false);
    }
  };

  // Función para analizar todas las redes con URLs configuradas de un solo clic
  const analyzeAllNetworksWithUrls = async () => {
    if (!companyData) {
      toast({
        title: "Error",
        description: "No se encontró información de la empresa",
        variant: "destructive"
      });
      return;
    }

    const urls = extractSocialUrls(companyData);
    if (Object.keys(urls).length === 0) {
      toast({
        title: "Sin URLs",
        description: "No se encontraron URLs de redes sociales configuradas",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    try {
      // Preparar URLs para análisis
      const urlsToAnalyze = Object.entries(urls).map(([platform, url]) => ({
        platform,
        url: url as string
      }));

      console.log('🚀 Iniciando análisis de todas las redes:', urlsToAnalyze);

      // Usar la función analyze-social-audience para obtener datos frescos
      const { data, error } = await supabase.functions.invoke('analyze-social-audience', {
        body: { urls: urlsToAnalyze }
      });

      if (error) throw error;

      if (data.success) {
        // Recargar los datos después del análisis
        await loadSocialAudienceStats();
        
        toast({
          title: "✅ Análisis Completado",
          description: `Se analizaron ${data.results?.length || urlsToAnalyze.length} redes sociales exitosamente`,
        });
      } else {
        throw new Error(data.error || 'Failed to analyze audience stats');
      }
    } catch (error) {
      console.error('Error analyzing all networks:', error);
      toast({
        title: "Error en el Análisis",
        description: "No se pudieron analizar las audiencias. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSocialAudienceStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;
    
    setSocialStatsLoading(true);
    
    try {
      // PRIMERO: Consultar directamente la tabla social_analysis para ver si hay datos existentes
      const { data: existingAnalyses, error } = await supabase
        .from('social_analysis')
        .select('*')
        .eq('user_id', resolvedUid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Actualizar metadatos de análisis existente
      if (existingAnalyses && existingAnalyses.length > 0) {
        setExistingAnalysisCount(existingAnalyses.length);
        setLastAnalysisDate(existingAnalyses[0].created_at);
      }

      // Si hay análisis existentes, configurar el estado para mostrarlos y NO mostrar confirmación
      if (existingAnalyses && existingAnalyses.length > 0) {
        setSocialStats(existingAnalyses);
        setHasSocialConnections(true);
        setShowUrlConfirmation(false); // Asegurarse de no mostrar confirmación
      } else {
        // SOLO si no hay análisis existentes, verificar URLs de empresa para mostrar confirmación
        setSocialStats([]);
        setHasSocialConnections(false);
        setExistingAnalysisCount(0);
        setLastAnalysisDate(null);
        
        // Verificar si hay URLs de redes sociales en la empresa para análisis inicial
        if (companyData) {
          const urls = extractSocialUrls(companyData);
          setSocialUrls(urls);
          
          if (Object.keys(urls).length > 0) {
            setShowUrlConfirmation(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading social audience stats:', error);
      setSocialStats([]);
      setHasSocialConnections(false);
    } finally {
      setSocialStatsLoading(false);
    }
  };

  // Renderizar vista principal con pestañas organizadas
  const renderMainAudienceView = () => {
    if (socialStatsLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center animate-fade-in">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">🚀 Analizando tu Audiencia</h3>
            <p className="text-muted-foreground">Extrayendo insights valiosos de tus redes sociales...</p>
          </div>
        </div>
      );
    }

    // Vista de confirmación de URLs
    if (showUrlConfirmation) {
      return (
        <div className="space-y-8 animate-fade-in">
          <div className="text-center">
            <Target className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold mb-2">🎯 Confirma tus Redes Sociales</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Hemos encontrado estas URLs en tu perfil de empresa. Confirma cuáles quieres analizar.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
            {Object.entries(socialUrls).map(([platform, url]: [string, any]) => (
              <div key={platform} className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
                <div className="flex items-center space-x-3 flex-1">
                  {platform === 'instagram' && <Instagram className="w-5 h-5 text-pink-500" />}
                  {platform === 'facebook' && <Facebook className="w-5 h-5 text-blue-600" />}
                  {platform === 'twitter' && <Twitter className="w-5 h-5 text-blue-400" />}
                  {platform === 'tiktok' && <Music className="w-5 h-5 text-black" />}
                  {platform === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                  
                  <div className="flex-1">
                    <p className="font-medium capitalize">{platform}</p>
                    <p className="text-sm text-muted-foreground truncate">{url}</p>
                  </div>
                </div>
                
                <input
                  type="checkbox"
                  checked={confirmedUrls.includes(platform)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConfirmedUrls([...confirmedUrls, platform]);
                    } else {
                      setConfirmedUrls(confirmedUrls.filter(p => p !== platform));
                    }
                  }}
                  className="w-5 h-5"
                />
              </div>
            ))}
          </div>

          <div className="text-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setShowUrlConfirmation(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={analyzeWithConfirmedUrls}
              disabled={confirmedUrls.length === 0 || analyzingUrls}
              className="gap-2"
            >
              {analyzingUrls ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analizando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analizar {confirmedUrls.length} Red{confirmedUrls.length > 1 ? 'es' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (!hasSocialConnections) {
      return (
        <div className="text-center py-16">
          <WifiOff className="h-20 w-20 mx-auto text-muted-foreground/60 mb-6" />
          <h3 className="text-2xl font-bold mb-3">🔗 Conecta tu Ecosistema Digital</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Desbloquea insights profundos de audiencia conectando tus redes sociales.
          </p>
          <div className="space-y-4">
            {companyData && Object.keys(extractSocialUrls(companyData)).length > 0 ? (
              <Button 
                onClick={analyzeAllNetworksWithUrls}
                size="lg"
                disabled={analyzing}
                className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Target className="h-5 w-5" />
                    Analizar Todas las Redes (Un Solo Clic)
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : null}
            
            <Button 
              onClick={() => setCurrentView('connections')} 
              size="lg"
              variant="outline"
              className="gap-3 px-8 py-6 text-lg font-semibold"
            >
              <Wifi className="h-5 w-5" />
              Conectar Nuevas Redes Sociales
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    const mainProfile = socialStats[0] || {};
    
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Banner de Estado Existente */}
        {existingAnalysisCount > 0 && lastAnalysisDate && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                      ✓ Análisis de Audiencia Existente
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {existingAnalysisCount} {existingAnalysisCount === 1 ? 'red social analizada' : 'redes sociales analizadas'} • 
                      Última actualización: {new Date(lastAnalysisDate).toLocaleDateString('es', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={analyzeAllNetworksWithUrls}
                  disabled={analyzing}
                  variant="outline"
                  className="gap-2 border-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
              <div className="mt-4 flex gap-2 text-xs text-green-700 dark:text-green-300">
                <Eye className="w-4 h-4" />
                <span>Los datos se muestran a continuación. Puedes actualizarlos para obtener información más reciente.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Análisis */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold">🎯 Análisis de Audiencias</h2>
          <div className="flex gap-3">
            <Button 
              onClick={analyzeAllNetworksWithUrls}
              disabled={analyzing}
              size="lg"
              className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold px-6 py-3"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analizando Todas las Redes...
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  {existingAnalysisCount > 0 ? 'Actualizar Análisis' : 'Analizar Todas las Redes'}
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => loadSocialAudienceStats()}
              disabled={socialStatsLoading}
              variant="outline"
              className="gap-2"
            >
              {socialStatsLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Actualizar Vista
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Header del Perfil Principal */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 rounded-2xl p-6">
          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              {socialStats.map((profile, index) => (
                <div key={index} className="flex items-center gap-2">
                  {profile.social_type === 'INST' && <Instagram className="w-5 h-5 text-pink-500" />}
                  {profile.social_type === 'FB' && <Facebook className="w-5 h-5 text-blue-600" />}
                  {profile.social_type === 'TW' && <Twitter className="w-5 h-5 text-blue-400" />}
                  {profile.social_type === 'TT' && <Music className="w-5 h-5 text-black" />}
                  {profile.social_type === 'YT' && <Youtube className="w-5 h-5 text-red-500" />}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-4 flex-1">
              {mainProfile.image && (
                <img 
                  src={mainProfile.image} 
                  alt={mainProfile.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {mainProfile.name || 'Mi Perfil'}
                  {mainProfile.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                </h1>
                <p className="text-lg text-muted-foreground">@{mainProfile.screen_name || 'usuario'}</p>
                <p className="text-sm text-muted-foreground mt-1">{mainProfile.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold">{((socialStats.reduce((acc, s) => acc + (s.users_count || 0), 0)) / 1000).toFixed(1)}K</p>
              <p className="text-sm text-muted-foreground">Total Seguidores</p>
            </div>
          </div>
        </div>

        {/* Vista Unificada: Radiografía de la Audiencia */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">🔬 Radiografía de la Audiencia</h2>
            <p className="text-xl text-muted-foreground">¿Quiénes son realmente tus seguidores?</p>
          </div>
          
          {/* KPIs Principales en Cards horizontales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Puntaje de Calidad</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((mainProfile.quality_score || 0.8) * 100)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {(mainProfile.quality_score || 0.8) > 0.7 ? 'Saludable' : 'Necesita Atención'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ThumbsUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Engagement Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {((mainProfile.avgER || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Crecimiento 6M</p>
                    <p className="text-2xl font-bold text-purple-600">
                      +{((mainProfile.pctUsersCount180d || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Audiencia Real</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.round((mainProfile.membersTypes?.real || 75))}%
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Perfil Principal */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información del Perfil */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Perfil Principal
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {mainProfile.image && (
                        <img src={mainProfile.image} alt="Profile" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
                      )}
                      <div>
                        <p className="font-semibold text-lg">{mainProfile.name}</p>
                        <p className="text-muted-foreground">@{mainProfile.screen_name}</p>
                        {mainProfile.verified && <CheckCircle className="w-4 h-4 text-blue-500 inline ml-2" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{mainProfile.description}</p>
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">{((socialStats.reduce((acc, s) => acc + (s.users_count || 0), 0)) / 1000).toFixed(1)}K</p>
                      <p className="text-sm text-muted-foreground">Total Seguidores</p>
                    </div>
                  </div>
                </div>
                
                {/* ADN del Perfil */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    ADN del Perfil
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Categorías</p>
                      <div className="flex flex-wrap gap-2">
                        {(mainProfile.categories || ['General']).map((cat: string, idx: number) => (
                          <Badge key={idx} variant="secondary">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Temas Clave</p>
                      <div className="flex flex-wrap gap-2">
                        {(mainProfile.tags || []).slice(0, 4).map((tag: string, idx: number) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Tipo de Cuenta</p>
                      <Badge variant="default">{mainProfile.type || 'Perfil'}</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Demografía Rápida */}
                <div className="lg:col-span-1">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Demografía Clave
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Top 3 Países</p>
                      <div className="space-y-1">
                        {(mainProfile.countries || []).slice(0, 3).map((country: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{country.name}</span>
                            <span className="font-medium">{Math.round(country.percent * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Género</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Masculino</p>
                          <p className="font-semibold text-sm">{Math.round((mainProfile.genders?.find((g: any) => g.name === 'm')?.percent || 0) * 100)}%</p>
                        </div>
                        <div className="bg-pink-100 dark:bg-pink-900/30 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Femenino</p>
                          <p className="font-semibold text-sm">{Math.round((mainProfile.genders?.find((g: any) => g.name === 'f')?.percent || 0) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Edad Dominante</p>
                      <p className="font-semibold">25-34 años</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis Detallado de la Audiencia */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">📊 Análisis Profundo de la Audiencia</h3>
              <p className="text-muted-foreground">Datos detallados desde tus redes sociales conectadas</p>
            </div>
            
            {userId ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">userId: {userId}</p>
                <SocialAnalysisDisplay userId={userId} companyData={companyData} />
              </div>
            ) : (
              <div className="text-center p-4">
                <p className="text-muted-foreground">Usuario no identificado</p>
              </div>
            )}
          </div>
          
          {/* Frescura de Datos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Datos actualizados: {new Date(mainProfile.time_statistics || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar Análisis
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Call to Action: Crear Audiencias */}
          <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold mb-3">🎯 Crea Audiencias Objetivo</h3>
                  <p className="text-lg text-muted-foreground mb-4">
                    Basado en tu radiografía de audiencia, crea segmentos específicos para campañas más efectivas
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Utiliza los datos demográficos, intereses y comportamientos de tus seguidores para crear audiencias personalizadas
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => setCurrentView('create-audience')}
                  >
                    <PlusCircle className="w-5 h-5" />
                    Crear Nueva Audiencia
                    <ArrowRight className="w-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-3 px-8 py-6 text-lg font-semibold border-primary/30 hover:bg-primary/5"
                    onClick={() => setCurrentView('audience-suggestions')}
                  >
                    <Lightbulb className="w-5 h-5" />
                    Ver Sugerencias IA
                  </Button>
                </div>
                
                {/* Stats Preview */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/20">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{audiences.length}</p>
                    <p className="text-xs text-muted-foreground">Audiencias Creadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{socialStats.length}</p>
                    <p className="text-xs text-muted-foreground">Fuentes de Datos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round((mainProfile.quality_score || 0.8) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Calidad de Datos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audiencias Existentes */}
          {audiences.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">📋 Mis Audiencias</h3>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {audiences.length} audiencia{audiences.length > 1 ? 's' : ''} creada{audiences.length > 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadAudiences()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Actualizar
                  </Button>
                </div>
              </div>

              <div className="grid gap-4">
                {audiences.map((audience) => (
                  <Card key={audience.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold">{audience.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {audience.estimated_size && (
                                  <span>{audience.estimated_size.toLocaleString()} usuarios estimados</span>
                                )}
                                {audience.confidence_score && (
                                  <span>Confianza: {Math.round(audience.confidence_score * 100)}%</span>
                                )}
                                <span>Creado: {new Date(audience.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          {audience.description && (
                            <p className="text-muted-foreground mb-4">{audience.description}</p>
                          )}
                          
                          {/* Mostrar tags y atributos */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {audience.goals?.map((goal, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                🎯 {goal}
                              </Badge>
                            ))}
                            {audience.pain_points?.slice(0, 2).map((point, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                ⚠️ {point}
                              </Badge>
                            ))}
                            {audience.ai_insights?.generatedFrom && (
                              <Badge variant="default" className="text-xs">
                                🤖 Generado por IA
                              </Badge>
                            )}
                          </div>
                          
                          {/* Indicadores de rendimiento */}
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                            <div className="text-center">
                              <p className="text-lg font-semibold text-green-600">
                                {audience.conversion_potential ? Math.round(audience.conversion_potential * 100) : 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">Potencial de Conversión</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-blue-600">
                                ${(audience.lifetime_value_estimate || 0).toFixed(0)}
                              </p>
                              <p className="text-xs text-muted-foreground">Valor de Vida Estimado</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-semibold text-orange-600">
                                ${(audience.acquisition_cost_estimate || 0).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">Costo de Adquisición</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex flex-col gap-2 ml-6">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAudience(audience)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalles
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => editAudience(audience)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Settings className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteAudience(audience.id)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <X className="w-4 h-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Editar audiencia
  const editAudience = (audience: AudienceSegment) => {
    setSelectedAudience(audience);
    setNewAudienceName(audience.name);
    setNewAudienceDescription(audience.description || '');
    setCurrentView('edit-audience');
  };

  // Eliminar audiencia
  const deleteAudience = async (audienceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta audiencia?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('company_audiences')
        .delete()
        .eq('id', audienceId)
        .eq('user_id', userId);

      if (error) throw error;

      setAudiences(audiences.filter(a => a.id !== audienceId));
      toast({
        title: "Audiencia Eliminada",
        description: "La audiencia se eliminó exitosamente",
      });
    } catch (error) {
      console.error('Error deleting audience:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la audiencia",
        variant: "destructive"
      });
    }
  };

  // Generar sugerencias de audiencias basadas en datos sociales
  const generateAudienceSuggestions = async () => {
    setGeneratingAudiences(true);
    try {
      const mainProfile = socialStats[0] || {};
      
      // Analizar los datos sociales existentes para generar sugerencias
      const audienceData = {
        demographics: {
          countries: mainProfile.countries || [],
          genders: mainProfile.genders || [],
          ageGroups: ['18-24', '25-34', '35-44', '45-54'],
        },
        interests: mainProfile.interests || [],
        socialStats: socialStats,
        qualityScore: mainProfile.quality_score || 0,
        engagementRate: mainProfile.avgER || 0
      };

      // Crear sugerencias basadas en datos existentes
      const suggestions = [
        {
          name: "Audiencia Principal",
          description: `Seguidores principales basados en tu demografía más activa`,
          estimatedSize: Math.round((mainProfile.users_count || 1000) * 0.6),
          confidence: 85,
          criteria: {
            countries: audienceData.demographics.countries.slice(0, 2),
            genders: audienceData.demographics.genders,
            ageRange: "25-34"
          }
        },
        {
          name: "Audiencia de Alto Engagement",
          description: "Usuarios con mayor probabilidad de interactuar con tu contenido",
          estimatedSize: Math.round((mainProfile.users_count || 1000) * 0.2),
          confidence: 92,
          criteria: {
            engagementLevel: "high",
            countries: audienceData.demographics.countries.slice(0, 1),
            interests: audienceData.interests?.slice(0, 3) || []
          }
        },
        {
          name: "Audiencia Emergente",
          description: "Segmento con potencial de crecimiento basado en tendencias",
          estimatedSize: Math.round((mainProfile.users_count || 1000) * 0.15),
          confidence: 76,
          criteria: {
            ageRange: "18-24",
            growthTrend: "high",
            newFollowers: true
          }
        }
      ];

      setSuggestedAudiences(suggestions);
    } catch (error) {
      console.error('Error generating audience suggestions:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar sugerencias de audiencia",
        variant: "destructive"
      });
    } finally {
      setGeneratingAudiences(false);
    }
  };

  // Crear audiencia desde sugerencia
  const createAudienceFromSuggestion = async (suggestion: any) => {
    try {
      const newAudience = {
        name: suggestion.name,
        description: suggestion.description,
        estimated_size: suggestion.estimatedSize,
        confidence_score: suggestion.confidence / 100,
        user_id: userId,
        company_id: companyData?.id,
        ai_insights: {
          generatedFrom: 'social_analysis',
          criteria: suggestion.criteria,
          createdAt: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('company_audiences')
        .insert(newAudience)
        .select()
        .single();

      if (error) throw error;

      setAudiences([...audiences, data]);
      toast({
        title: "Audiencia Creada",
        description: `Se creó la audiencia "${suggestion.name}" exitosamente`,
      });
    } catch (error) {
      console.error('Error creating audience:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia",
        variant: "destructive"
      });
    }
  };

  // Renderizar vista de sugerencias de audiencias
  const renderAudienceSuggestionsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('main')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Sugerencias de Audiencias IA</h2>
        </div>

        {suggestedAudiences.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground/60 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Generar Sugerencias Inteligentes</h3>
              <p className="text-muted-foreground mb-6">
                Analiza tu radiografía de audiencia para crear sugerencias personalizadas de segmentos objetivo
              </p>
              <Button 
                onClick={generateAudienceSuggestions}
                disabled={generatingAudiences}
                size="lg"
                className="gap-2"
              >
                {generatingAudiences ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando Sugerencias...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generar Sugerencias IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {suggestedAudiences.map((suggestion, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">{suggestion.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Confianza: {suggestion.confidence}% • {suggestion.estimatedSize.toLocaleString()} usuarios estimados
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {suggestion.criteria.countries?.map((country: any, idx: number) => (
                          <Badge key={idx} variant="outline">{country.name}</Badge>
                        ))}
                        {suggestion.criteria.ageRange && (
                          <Badge variant="outline">{suggestion.criteria.ageRange} años</Badge>
                        )}
                        {suggestion.criteria.engagementLevel && (
                          <Badge variant="outline">Alto Engagement</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => createAudienceFromSuggestion(suggestion)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Audiencia
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              variant="outline" 
              onClick={generateAudienceSuggestions}
              disabled={generatingAudiences}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerar Sugerencias
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar vista de creación de audiencia personalizada
  const renderCreateAudienceView = () => {
    const mainProfile = socialStats[0] || {};
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('main')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Crear Nueva Audiencia</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const audienceData = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  user_id: userId,
                  company_id: companyData?.id,
                  estimated_size: parseInt(formData.get('estimatedSize') as string) || 0,
                  goals: (formData.get('goals') as string)?.split(',').map(g => g.trim()) || [],
                  pain_points: (formData.get('painPoints') as string)?.split(',').map(p => p.trim()) || [],
                  ai_insights: {
                    createdManually: true,
                    basedOnRadiography: true,
                    sourceData: socialStats.map(s => s.social_type),
                    createdAt: new Date().toISOString()
                  }
                };

                const { data, error } = await supabase
                  .from('company_audiences')
                  .insert(audienceData)
                  .select()
                  .single();

                if (error) throw error;

                setAudiences([...audiences, data]);
                setCurrentView('main');
                toast({
                  title: "Audiencia Creada",
                  description: `Se creó la audiencia "${audienceData.name}" exitosamente`,
                });
              } catch (error) {
                console.error('Error creating audience:', error);
                toast({
                  title: "Error",
                  description: "No se pudo crear la audiencia",
                  variant: "destructive"
                });
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Nombre de la Audiencia</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Ej: Emprendedores Tecnológicos" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedSize">Tamaño Estimado</Label>
                  <Input 
                    id="estimatedSize" 
                    name="estimatedSize" 
                    type="number" 
                    placeholder="1000" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Describe las características principales de esta audiencia..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="goals">Objetivos (separados por comas)</Label>
                  <Textarea 
                    id="goals" 
                    name="goals" 
                    placeholder="Innovación, Productividad, Crecimiento..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="painPoints">Puntos de Dolor (separados por comas)</Label>
                  <Textarea 
                    id="painPoints" 
                    name="painPoints" 
                    placeholder="Falta de tiempo, Recursos limitados..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Contexto de los datos */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Datos de tu Radiografía
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• {socialStats.length} redes sociales analizadas</p>
                    <p>• {(mainProfile.users_count || 0).toLocaleString()} seguidores totales</p>
                    <p>• {mainProfile.countries?.length || 0} países identificados</p>
                    <p>• Calidad de datos: {Math.round((mainProfile.quality_score || 0.8) * 100)}%</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Crear Audiencia Manual
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleGenerateAIAudiences}
                  disabled={aiGenerating}
                  className="gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar con IA
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentView('main')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar vista de edición de audiencia
  const renderEditAudienceView = () => {
    const mainProfile = socialStats[0] || {};
    
    if (!selectedAudience) {
      setCurrentView('main');
      return null;
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('main')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Editar Audiencia</h2>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              try {
                const audienceData = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  estimated_size: parseInt(formData.get('estimatedSize') as string) || selectedAudience.estimated_size,
                  goals: (formData.get('goals') as string)?.split(',').map(g => g.trim()) || selectedAudience.goals,
                  pain_points: (formData.get('painPoints') as string)?.split(',').map(p => p.trim()) || selectedAudience.pain_points,
                  updated_at: new Date().toISOString()
                };

                const { data, error } = await supabase
                  .from('company_audiences')
                  .update(audienceData)
                  .eq('id', selectedAudience.id)
                  .eq('user_id', userId)
                  .select()
                  .single();

                if (error) throw error;

                setAudiences(audiences.map(a => a.id === selectedAudience.id ? data : a));
                setCurrentView('main');
                setSelectedAudience(null);
                toast({
                  title: "Audiencia Actualizada",
                  description: `Se actualizó la audiencia "${audienceData.name}" exitosamente`,
                });
              } catch (error) {
                console.error('Error updating audience:', error);
                toast({
                  title: "Error",
                  description: "No se pudo actualizar la audiencia",
                  variant: "destructive"
                });
              }
            }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Nombre de la Audiencia</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={selectedAudience.name}
                    placeholder="Ej: Emprendedores Tecnológicos" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimatedSize">Tamaño Estimado</Label>
                  <Input 
                    id="estimatedSize" 
                    name="estimatedSize" 
                    type="number" 
                    defaultValue={selectedAudience.estimated_size || ''}
                    placeholder="1000" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={selectedAudience.description || ''}
                  placeholder="Describe las características principales de esta audiencia..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="goals">Objetivos (separados por comas)</Label>
                  <Textarea 
                    id="goals" 
                    name="goals" 
                    defaultValue={selectedAudience.goals?.join(', ') || ''}
                    placeholder="Innovación, Productividad, Crecimiento..."
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="painPoints">Puntos de Dolor (separados por comas)</Label>
                  <Textarea 
                    id="painPoints" 
                    name="painPoints" 
                    defaultValue={selectedAudience.pain_points?.join(', ') || ''}
                    placeholder="Falta de tiempo, Recursos limitados..."
                    rows={2}
                  />
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Información de la Audiencia
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Creada: {new Date(selectedAudience.created_at).toLocaleDateString()}</p>
                    <p>• Confianza: {Math.round((selectedAudience.confidence_score || 0) * 100)}%</p>
                    <p>• Potencial de conversión: {Math.round((selectedAudience.conversion_potential || 0) * 100)}%</p>
                    {selectedAudience.ai_insights?.generatedFrom && (
                      <p>• Generada por: {selectedAudience.ai_insights.generatedFrom === 'social_analysis' ? 'Análisis de redes sociales' : 'Manual'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Guardar Cambios
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentView('main')}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar vista de conexiones sociales
  const renderConnectionsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('main')}
            className="gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Volver
          </Button>
          <h2 className="text-2xl font-bold">Conectar Redes Sociales</h2>
        </div>
        <SocialConnectionManager profile={profile} />
      </div>
    );
  };

  if (currentView === 'connections') {
    return renderConnectionsView();
  }

  if (currentView === 'create-audience') {
    return renderCreateAudienceView();
  }

  if (currentView === 'edit-audience') {
    return renderEditAudienceView();
  }

  if (currentView === 'audience-suggestions') {
    return renderAudienceSuggestionsView();
  }

  return (
    <div className="space-y-6">
      {renderMainAudienceView()}
    </div>
  );
};

export default AudienciasManager;