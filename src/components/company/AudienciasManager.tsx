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

  // Cuando se cargan datos de la empresa, preparar la confirmación de URLs automáticamente
  useEffect(() => {
    if (!companyData) return;
    const urls = extractSocialUrls(companyData);
    setSocialUrls(urls);
    if (Object.keys(urls).length > 0) {
      setShowUrlConfirmation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    
    if (Object.keys(urls).length > 0) {
      setShowUrlConfirmation(true);
      return true;
    }
    return false;
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

  const loadSocialAudienceStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;
    
    setSocialStatsLoading(true);
    
    // Primero verificar si hay URLs de redes sociales en la empresa
    if (companyData && !showUrlConfirmation) {
      const hasUrls = checkCompanySocialUrls();
      if (hasUrls) {
        setSocialStatsLoading(false);
        return;
      }
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-social-audience', {
        body: { urls: [] as any[] }
      });

      if (error) throw error;

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
                onClick={() => setShowUrlConfirmation(true)}
                size="lg"
                className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Target className="h-5 w-5" />
                Analizar URLs de la Empresa
                <ArrowRight className="h-4 w-4" />
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
        {/* Header del Perfil Principal */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 rounded-2xl p-6">
          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              {socialStats.map((profile, index) => (
                <div key={index} className="flex items-center gap-2">
                  {profile.socialType === 'INST' && <Instagram className="w-5 h-5 text-pink-500" />}
                  {profile.socialType === 'FB' && <Facebook className="w-5 h-5 text-blue-600" />}
                  {profile.socialType === 'TW' && <Twitter className="w-5 h-5 text-blue-400" />}
                  {profile.socialType === 'TT' && <Music className="w-5 h-5 text-black" />}
                  {profile.socialType === 'YT' && <Youtube className="w-5 h-5 text-red-500" />}
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
                <p className="text-lg text-muted-foreground">@{mainProfile.screenName || 'usuario'}</p>
                <p className="text-sm text-muted-foreground mt-1">{mainProfile.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold">{((socialStats.reduce((acc, s) => acc + (s.usersCount || 0), 0)) / 1000).toFixed(1)}K</p>
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
                      {Math.round((mainProfile.qualityScore || 0.8) * 100)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {(mainProfile.qualityScore || 0.8) > 0.7 ? 'Saludable' : 'Necesita Atención'}
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
                        <p className="text-muted-foreground">@{mainProfile.screenName}</p>
                        {mainProfile.verified && <CheckCircle className="w-4 h-4 text-blue-500 inline ml-2" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{mainProfile.description}</p>
                    <div className="bg-primary/5 rounded-lg p-3">
                      <p className="text-2xl font-bold text-primary">{((socialStats.reduce((acc, s) => acc + (s.usersCount || 0), 0)) / 1000).toFixed(1)}K</p>
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
                        {Object.entries(mainProfile.countries || {}).slice(0, 3).map(([country, percentage]: [string, any], idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{country}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Género</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Masculino</p>
                          <p className="font-semibold text-sm">{mainProfile.genders?.male || 50}%</p>
                        </div>
                        <div className="bg-pink-100 dark:bg-pink-900/30 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Femenino</p>
                          <p className="font-semibold text-sm">{mainProfile.genders?.female || 50}%</p>
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
            
            {userId && <SocialAnalysisDisplay userId={userId} />}
          </div>
          
          {/* Frescura de Datos */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Datos actualizados: {new Date(mainProfile.timeStatistics || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar Análisis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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

  return (
    <div className="space-y-6">
      {renderMainAudienceView()}
    </div>
  );
};

export default AudienciasManager;