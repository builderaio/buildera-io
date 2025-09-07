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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [currentView, setCurrentView] = useState("main");
  const [audiences, setAudiences] = useState<AudienceSegment[]>([]);
  const [icpProfile, setIcpProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<AudienceSegment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [companyData, setCompanyData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  
  // Estado para creación de audiencia (mover hooks fuera de funciones internas)
  const [newAudienceName, setNewAudienceName] = useState('');
  const [newAudienceDescription, setNewAudienceDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  
  // Estado para estadísticas de redes sociales
  const [socialStats, setSocialStats] = useState<any[]>([]);
  const [socialStatsLoading, setSocialStatsLoading] = useState(true);
  const [hasSocialConnections, setHasSocialConnections] = useState(false);
  
  // Stats de la dashboard
  const [stats, setStats] = useState({
    totalAudiences: 0,
    totalReach: 0,
    averageConversion: 0,
    avgAcquisitionCost: 0,
    totalLifetimeValue: 0,
    highPerformingSegments: 0
  });

  // Log para debugging
  console.log('AudienciasManager - profile:', profile);

  useEffect(() => {
    const init = async () => {
      try {
        let uid = profile?.user_id || userId;
        if (!uid) {
          const { data: { session } } = await supabase.auth.getSession();
          uid = session?.user?.id || null;
          if (uid) setUserId(uid);
        }
        if (uid) {
          console.log('AudienciasManager - Cargando datos para user_id:', uid);
          await Promise.all([
            loadAudiences(uid),
            loadCompanyData(uid),
            loadSocialAudienceStats(uid),
          ]);
        } else {
          console.log('AudienciasManager - Sin user_id disponible');
        }
      } catch (e) {
        console.error('AudienciasManager - Error inicializando:', e);
      }
    };
    init();
  }, [profile?.user_id, userId]);

  const loadCompanyData = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) {
      console.log('AudienciasManager - No se puede cargar datos de empresa sin user_id');
      return;
    }

    try {
      console.log('AudienciasManager - Cargando datos de empresa para user_id:', resolvedUid);
      
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
        
        console.log('AudienciasManager - Datos de empresa cargados:', company?.name);
        setCompanyData(company);
      } else {
        console.log('AudienciasManager - No se encontró empresa principal para el usuario');
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const loadAudiences = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) {
      console.log('AudienciasManager - No se puede cargar audiencias sin user_id');
      return;
    }

    try {
      setLoading(true);
      console.log('AudienciasManager - Cargando audiencias para user_id:', resolvedUid);
      
      const { data, error } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('user_id', resolvedUid)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('AudienciasManager - Error al cargar audiencias:', error);
        throw error;
      }
      
      console.log('AudienciasManager - Audiencias cargadas:', data?.length || 0);
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

  const loadSocialAudienceStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) {
      console.log('AudienciasManager - No se puede cargar stats sin user_id');
      return;
    }
    
    setSocialStatsLoading(true);
    try {
      console.log('AudienciasManager - Cargando estadísticas sociales para user_id:', resolvedUid);
      
      const { data, error } = await supabase.functions.invoke('get-social-audience-stats', {
        body: {}
      });

      if (error) throw error;

      console.log('Social audience stats response:', data);
      
      if (data.success) {
        setSocialStats(data.data || []);
        setHasSocialConnections(data.data && data.data.length > 0);
      } else {
        throw new Error(data.error || 'Failed to load social stats');
      }
    } catch (error) {
      console.error('Error loading social audience stats:', error);
      setSocialStats([]);
      setHasSocialConnections(false);
    } finally {
      setSocialStatsLoading(false);
    }
  };

  const calculateStats = () => {
    if (audiences.length === 0) return;
    
    const totalReach = audiences.reduce((sum, aud) => sum + aud.estimated_size, 0);
    const avgConversion = audiences.reduce((sum, aud) => sum + aud.conversion_potential, 0) / audiences.length;
    const avgAcquisition = audiences.reduce((sum, aud) => sum + (aud.acquisition_cost_estimate || 0), 0) / audiences.length;
    const totalLTV = audiences.reduce((sum, aud) => sum + (aud.lifetime_value_estimate || 0), 0);
    const highPerforming = audiences.filter(aud => aud.confidence_score > 80).length;

    setStats({
      totalAudiences: audiences.length,
      totalReach,
      averageConversion: Math.round(avgConversion),
      avgAcquisitionCost: Math.round(avgAcquisition),
      totalLifetimeValue: Math.round(totalLTV),
      highPerformingSegments: highPerforming
    });
  };

  useEffect(() => {
    calculateStats();
  }, [audiences]);

  // Renderizar vista principal de audiencias
  const renderMainAudienceView = () => {
    if (socialStatsLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
              <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary relative z-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">🚀 Analizando tu Audiencia</h3>
            <p className="text-muted-foreground">Extrayendo insights valiosos de tus redes sociales...</p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!hasSocialConnections) {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center py-16 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl opacity-50"></div>
            <div className="relative z-10">
              <div className="mb-6">
                <div className="relative inline-block">
                  <WifiOff className="h-20 w-20 mx-auto text-muted-foreground/60" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🔗 Conecta tu Ecosistema Digital
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Desbloquea insights profundos de audiencia conectando tus redes sociales. 
                <br className="hidden sm:block" />
                <span className="font-medium text-foreground">Es el primer paso hacia el éxito.</span>
              </p>
              <Button 
                onClick={() => setCurrentView('connections')} 
                size="lg"
                className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover-scale"
              >
                <Wifi className="h-5 w-5" />
                Conectar Mis Redes Sociales
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    const totalFollowers = socialStats.reduce((acc, stat) => acc + (stat.usersCount || 0), 0);
    const avgEngagement = socialStats.reduce((acc, stat) => acc + (stat.avgER || 0), 0) / socialStats.length * 100;
    const avgQuality = socialStats.reduce((acc, stat) => acc + (stat.qualityScore || 0), 0) / socialStats.length * 100;
    const totalInteractions = socialStats.reduce((acc, stat) => acc + (stat.avgInteractions || 0), 0);

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Hero Dashboard */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Brain className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">🧠 Inteligencia de Audiencia</h2>
                <p className="text-blue-100 text-lg">Insights en tiempo real de {socialStats.length} plataformas conectadas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-scale transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-emerald-400/20 rounded-xl">
                    <Users2 className="w-6 h-6 text-emerald-200" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-medium">Alcance Total</p>
                    <p className="text-3xl font-bold">{(totalFollowers / 1000).toFixed(1)}K</p>
                  </div>
                </div>
                <p className="text-xs text-blue-200">+{((totalFollowers * 0.05) / 1000).toFixed(1)}K este mes</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-scale transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-yellow-400/20 rounded-xl">
                    <Zap className="w-6 h-6 text-yellow-200" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-medium">Engagement</p>
                    <p className="text-3xl font-bold">{avgEngagement.toFixed(1)}%</p>
                  </div>
                </div>
                <p className="text-xs text-blue-200">
                  {avgEngagement > 3 ? '🔥 Excelente' : avgEngagement > 1.5 ? '👍 Bueno' : '📈 Mejorable'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-scale transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-purple-400/20 rounded-xl">
                    <Target className="w-6 h-6 text-purple-200" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-medium">Calidad Score</p>
                    <p className="text-3xl font-bold">{avgQuality.toFixed(0)}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-200">
                  {avgQuality > 70 ? '⭐ Premium' : avgQuality > 50 ? '✨ Buena' : '🚀 En crecimiento'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover-scale transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-pink-400/20 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-pink-200" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-medium">Interacciones</p>
                    <p className="text-3xl font-bold">{(totalInteractions / 1000).toFixed(1)}K</p>
                  </div>
                </div>
                <p className="text-xs text-blue-200">Por publicación promedio</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 hover-scale"
                onClick={() => setActiveTab("create")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Crear Audiencia IA
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8"
                onClick={() => loadSocialAudienceStats()}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Actualizar Datos
              </Button>
            </div>
          </div>
        </div>

        {/* Análisis Detallado por Plataforma */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">📊 Análisis Detallado por Plataforma</h3>
              <p className="text-muted-foreground">Insights profundos de cada una de tus audiencias</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {socialStats.map((stat, index) => (
              <Card key={index} className="overflow-hidden hover-scale transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                        stat.socialType === 'INST' ? 'bg-gradient-to-br from-pink-500 to-purple-600' :
                        stat.socialType === 'FB' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                        stat.socialType === 'TW' ? 'bg-gradient-to-br from-sky-400 to-sky-600' :
                        stat.socialType === 'TT' ? 'bg-gradient-to-br from-black to-gray-800' :
                        stat.socialType === 'YT' ? 'bg-gradient-to-br from-red-500 to-red-700' :
                        'bg-gradient-to-br from-gray-400 to-gray-600'
                      }`}>
                        <span className="text-white text-xl">
                          {stat.socialType === 'INST' ? '📸' :
                           stat.socialType === 'FB' ? '👥' :
                           stat.socialType === 'TW' ? '🐦' :
                           stat.socialType === 'TT' ? '🎵' :
                           stat.socialType === 'YT' ? '📺' : '📱'}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          @{stat.screenName}
                          {stat.verified && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>}
                        </CardTitle>
                        <CardDescription className="text-base font-medium">{stat.name}</CardDescription>
                      </div>
                    </div>
                    {stat.error && (
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ {stat.error}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6 p-6">
                  {/* Métricas principales */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-700">{stat.usersCount?.toLocaleString() || 0}</div>
                      <div className="text-sm font-medium text-blue-600">👥 Seguidores</div>
                      <div className="text-xs text-blue-500 mt-1">Base de audiencia</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-700">{(stat.avgER * 100 || 0).toFixed(1)}%</div>
                      <div className="text-sm font-medium text-emerald-600">⚡ Engagement</div>
                      <div className="text-xs text-emerald-500 mt-1">Tasa de interacción</div>
                    </div>
                  </div>

                  {/* Métricas secundarias */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-700">{(stat.qualityScore * 100 || 0).toFixed(0)}</div>
                      <div className="text-xs text-purple-600">🏆 Calidad</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-700">{stat.avgInteractions?.toLocaleString() || 0}</div>
                      <div className="text-xs text-orange-600">💬 Interacciones</div>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-lg font-bold text-pink-700">{stat.lastPosts?.length || 0}</div>
                      <div className="text-xs text-pink-600">📝 Posts</div>
                    </div>
                  </div>

                  {/* Demografía visual */}
                  {stat.genders && stat.genders.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        👫 Distribución por Género
                      </h4>
                      <div className="space-y-2">
                        {stat.genders.map((gender: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-sm font-medium w-20">
                              {gender.name === 'm' ? '👨 Hombres' : '👩 Mujeres'}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${gender.name === 'm' ? 'bg-blue-500' : 'bg-pink-500'}`}
                                style={{ width: `${gender.percent}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{gender.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top países con flags */}
                  {stat.countries && stat.countries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        🌍 Top Países de Audiencia
                      </h4>
                      <div className="space-y-2">
                        {stat.countries.slice(0, 4).map((country: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {country.name === 'US' ? '🇺🇸' : 
                                 country.name === 'BR' ? '🇧🇷' : 
                                 country.name === 'MX' ? '🇲🇽' : 
                                 country.name === 'AR' ? '🇦🇷' : 
                                 country.name === 'ES' ? '🇪🇸' : '🌍'}
                              </span>
                              <span className="text-sm font-medium">{country.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(country.percent * 2, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-gray-700 w-8">{country.percent}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rango de edades */}
                  {stat.ages && stat.ages.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        🎂 Distribución por Edad
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {stat.ages.slice(0, 4).map((age: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                            <span className="text-xs font-medium">
                              {age.name.replace('_', '-')} años
                            </span>
                            <span className="text-xs font-bold text-purple-700">{age.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ¡Potencia tu Marketing con IA!
              </h3>
              <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                Ahora que conoces a tu audiencia, es momento de crear campañas hyper-segmentadas 
                que conviertan como nunca antes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setActiveTab('create')} 
                  size="lg"
                  className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover-scale"
                >
                  <Sparkles className="h-5 w-5" />
                  Crear Audiencia Personalizada
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="gap-3 px-8 py-6 text-lg font-semibold hover-scale"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-5 w-5" />
                  Ver Analytics Avanzados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAudiencesView = () => {
    const filteredAudiences = audiences.filter(audience =>
      audience.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    return (
      <div className="space-y-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar audiencia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          {/* Filter by Platform (if needed) */}
        </div>
  
        {/* Audience List */}
        {filteredAudiences.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAudiences.map((audience) => (
              <Card key={audience.id} className="bg-white shadow-sm rounded-md overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{audience.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500">{audience.description || 'Sin descripción'}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Tamaño Estimado:</span>
                    <span>{audience.estimated_size ? audience.estimated_size.toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Confianza:</span>
                    <span>{audience.confidence_score ? `${audience.confidence_score}%` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Creación:</span>
                    <span>{new Date(audience.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button variant="link" onClick={() => setSelectedAudience(audience)}>
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Lightbulb className="h-10 w-10 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron audiencias</h3>
            <p className="text-gray-500">Crea nuevas audiencias para segmentar a tus clientes.</p>
          </div>
        )}
      </div>
    );
  };

  const renderCreateAudienceView = () => {
    const handlePlatformToggle = (platform: string) => {
      setSelectedPlatforms(prev =>
        prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
      );
    };
  
    const handleSubmit = async (e: any) => {
      e.preventDefault();
      if (!newAudienceName.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la audiencia es obligatorio.",
          variant: "destructive",
        });
        return;
      }
  
      setAnalyzing(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");
  
        const newAudience = {
          user_id: user.id,
          company_id: companyData?.id,
          name: newAudienceName,
          description: newAudienceDescription,
          is_active: true,
          tags: selectedPlatforms,
        };
  
        const { data, error } = await supabase
          .from('company_audiences')
          .insert([newAudience])
          .select()
          .single();
  
        if (error) throw error;
  
        toast({
          title: "Éxito",
          description: "Audiencia creada correctamente.",
        });
  
        setAudiences(prev => [...prev, data]);
        setNewAudienceName('');
        setNewAudienceDescription('');
        setSelectedPlatforms([]);
        setActiveTab('audiences');
      } catch (error: any) {
        console.error("Error creating audience:", error);
        toast({
          title: "Error",
          description: `Error al crear la audiencia: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setAnalyzing(false);
      }
    };
  
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Audiencia</CardTitle>
            <CardDescription>Define los parámetros de tu audiencia ideal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Audiencia</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Ej: Clientes interesados en tecnología"
                  value={newAudienceName}
                  onChange={(e) => setNewAudienceName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción detallada de la audiencia"
                  value={newAudienceDescription}
                  onChange={(e) => setNewAudienceDescription(e.target.value)}
                />
              </div>
              <div>
                <Label>Plataformas</Label>
                <div className="flex flex-wrap gap-2">
                  {['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube'].map(platform => (
                    <Button
                      key={platform}
                      variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                      onClick={() => handlePlatformToggle(platform)}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={analyzing} className="w-full">
                {analyzing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </div>
                ) : (
                  "Crear Audiencia"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderICPView = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ideal Customer Profile (ICP)</CardTitle>
            <CardDescription>Define tu cliente ideal.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Contenido del ICP aquí.</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAnalyticsView = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Analiza el rendimiento de tus audiencias.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Contenido de Analytics aquí.</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando audiencias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Audiencias</h1>
          <p className="text-muted-foreground">
            Analiza y gestiona las audiencias de tu empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentView === 'main' && hasSocialConnections && (
            <Button onClick={() => setActiveTab('create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Audiencia
            </Button>
          )}
          <Button variant="outline" onClick={() => loadAudiences()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="audiences">Audiencias</TabsTrigger>
          <TabsTrigger value="create">Crear</TabsTrigger>
          <TabsTrigger value="icp">ICP</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderMainAudienceView()}
        </TabsContent>

        <TabsContent value="audiences" className="space-y-6">
          {renderAudiencesView()}
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          {renderCreateAudienceView()}
        </TabsContent>

        <TabsContent value="icp" className="space-y-6">
          {renderICPView()}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {renderAnalyticsView()}
        </TabsContent>
      </Tabs>

      {/* Social Connection Manager */}
      {currentView === 'connections' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('main')}
              className="gap-2"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Volver
            </Button>
          </div>
          <SocialConnectionManager 
            profile={profile}
            onConnectionsUpdated={() => loadSocialAudienceStats()}
          />
        </div>
      )}
    </div>
  );
};

export default AudienciasManager;
