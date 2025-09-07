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
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Analizando audiencias de redes sociales...</p>
          </div>
        </div>
      );
    }

    if (!hasSocialConnections) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <WifiOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Conecta tus redes sociales</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Para analizar las audiencias de tus redes sociales, primero necesitas conectar tus cuentas.
            </p>
            <Button onClick={() => setCurrentView('connections')} className="gap-2">
              <Wifi className="h-4 w-4" />
              Conectar Redes Sociales
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Panorama general */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Panorama General de Audiencias
                </CardTitle>
                <CardDescription>
                  Resumen de todas tus audiencias conectadas
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSocialAudienceStats()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {socialStats.reduce((acc, stat) => acc + (stat.usersCount || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Seguidores</div>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <div className="text-2xl font-bold text-secondary">
                  {socialStats.length}
                </div>
                <div className="text-sm text-muted-foreground">Redes Conectadas</div>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <div className="text-2xl font-bold text-accent">
                  {(socialStats.reduce((acc, stat) => acc + (stat.avgER || 0), 0) / socialStats.length * 100 || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Engagement Promedio</div>
              </div>
              <div className="text-center p-4 bg-green-500/5 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(socialStats.reduce((acc, stat) => acc + (stat.qualityScore || 0), 0) / socialStats.length * 100 || 0).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Score de Calidad</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas por plataforma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {socialStats.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stat.socialType === 'INST' ? 'bg-pink-500/10 text-pink-600' :
                      stat.socialType === 'FB' ? 'bg-blue-500/10 text-blue-600' :
                      stat.socialType === 'TW' ? 'bg-sky-500/10 text-sky-600' :
                      stat.socialType === 'TT' ? 'bg-black/10 text-black' :
                      stat.socialType === 'YT' ? 'bg-red-500/10 text-red-600' :
                      'bg-gray-500/10 text-gray-600'
                    }`}>
                      {stat.socialType === 'INST' ? '📸' :
                       stat.socialType === 'FB' ? '👥' :
                       stat.socialType === 'TW' ? '🐦' :
                       stat.socialType === 'TT' ? '🎵' :
                       stat.socialType === 'YT' ? '📺' : '📱'}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        @{stat.screenName}
                        {stat.verified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                      </CardTitle>
                      <CardDescription>{stat.name}</CardDescription>
                    </div>
                  </div>
                  {stat.error && (
                    <Badge variant="destructive" className="text-xs">
                      Error: {stat.error}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">{stat.usersCount?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Seguidores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{(stat.avgER * 100 || 0).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Engagement Rate</div>
                  </div>
                </div>

                {/* Demografía de audiencia */}
                {stat.genders && stat.genders.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Género de Audiencia</h4>
                    <div className="space-y-1">
                      {stat.genders.map((gender: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{gender.name === 'm' ? 'Masculino' : 'Femenino'}</span>
                          <span>{gender.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top países */}
                {stat.countries && stat.countries.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top Países</h4>
                    <div className="space-y-1">
                      {stat.countries.slice(0, 3).map((country: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{country.name}</span>
                          <span>{country.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Últimos posts */}
                {stat.lastPosts && stat.lastPosts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Últimos Posts</h4>
                    <div className="text-sm text-muted-foreground">
                      {stat.lastPosts.length} posts recientes analizados
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botón para crear audiencias personalizadas */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">¿Listo para crear audiencias personalizadas?</h3>
              <p className="text-muted-foreground mb-4">
                Usa los datos de tus redes sociales para crear audiencias segmentadas
              </p>
              <Button onClick={() => setActiveTab('create')} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Audiencia Personalizada
              </Button>
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
