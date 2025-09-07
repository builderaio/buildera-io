import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building
} from "lucide-react";

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

  const generateICPProfile = async () => {
    try {
      setAnalyzing(true);
      
      if (!companyData) {
        throw new Error('No se encontraron datos de la empresa');
      }

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'generate_icp',
          companyData: companyData,
          existingAudiences: audiences
        }
      });

      if (error) throw error;

      setIcpProfile(data.icp_profile);

      toast({
        title: "ICP Generado Exitosamente",
        description: "Se ha creado tu perfil de cliente ideal basado en datos de tu empresa",
      });

    } catch (error) {
      console.error('Error generating ICP:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el perfil ICP",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const createNewAudience = async (audienceData: any) => {
    try {
      setAnalyzing(true);

      const { data, error } = await supabase.functions.invoke('audience-intelligence-analysis', {
        body: {
          action: 'create_custom_audience',
          audienceData,
          companyData,
          platforms: ['facebook', 'instagram', 'linkedin', 'tiktok', 'twitter', 'youtube']
        }
      });

      if (error) throw error;

      // Guardar la audiencia en la base de datos
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', profile?.user_id)
        .eq('is_primary', true)
        .single();

      if (!memberData) throw new Error('No se encontró la empresa');

      const newAudienceData = {
        company_id: memberData.company_id,
        user_id: profile?.user_id,
        name: data.audience.name,
        description: data.audience.description,
        estimated_size: data.audience.estimated_size,
        confidence_score: data.audience.confidence_score,
        conversion_potential: data.audience.conversion_potential,
        age_ranges: data.audience.demographics.age_ranges,
        gender_split: data.audience.demographics.gender_split,
        interests: data.audience.interests,
        pain_points: data.audience.pain_points,
        motivations: data.audience.motivations,
        goals: data.audience.goals,
        facebook_targeting: data.audience.platform_targeting.facebook,
        instagram_targeting: data.audience.platform_targeting.instagram,
        linkedin_targeting: data.audience.platform_targeting.linkedin,
        tiktok_targeting: data.audience.platform_targeting.tiktok,
        twitter_targeting: data.audience.platform_targeting.twitter,
        youtube_targeting: data.audience.platform_targeting.youtube,
        acquisition_cost_estimate: data.audience.acquisition_cost || 0,
        lifetime_value_estimate: data.audience.lifetime_value || 0,
        ai_insights: data.audience.insights
      };

      const { data: newAudience, error: insertError } = await supabase
        .from('company_audiences')
        .insert([newAudienceData])
        .select()
        .single();

      if (insertError) throw insertError;

      setAudiences(prev => [newAudience, ...prev]);

      toast({
        title: "Audiencia Creada",
        description: "Nueva audiencia generada con optimización para múltiples plataformas",
      });

      setActiveTab("audiences");

    } catch (error) {
      console.error('Error creating audience:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la audiencia",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Filtrar audiencias
  const filteredAudiences = audiences.filter(audience => {
    const matchesSearch = audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (audience.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === "all" || 
                           (audience[`${filterPlatform}_targeting` as keyof AudienceSegment] !== null);
    return matchesSearch && matchesPlatform;
  });

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">AI-Powered Audiences</h2>
              <p className="text-blue-100">Audiencias predictivas que maximizan el retorno de inversión</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Rocket className="w-6 h-6 text-yellow-300" />
                <div>
                  <p className="text-sm text-blue-100">ROI Promedio</p>
                  <p className="text-2xl font-bold">{stats.averageConversion}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users2 className="w-6 h-6 text-green-300" />
                <div>
                  <p className="text-sm text-blue-100">Alcance Total</p>
                  <p className="text-2xl font-bold">{(stats.totalReach / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-300" />
                <div>
                  <p className="text-sm text-blue-100">LTV Total</p>
                  <p className="text-2xl font-bold">${(stats.totalLifetimeValue / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => setActiveTab("create")}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Crear Nueva Audiencia IA
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10"
              onClick={() => setActiveTab("icp")}
            >
              <Target className="w-5 h-5 mr-2" />
              Generar ICP
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Audiencias Activas</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalAudiences}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alto Rendimiento</p>
                <p className="text-3xl font-bold text-green-600">{stats.highPerformingSegments}</p>
                <p className="text-xs text-muted-foreground">Confianza &gt;80%</p>
              </div>
              <ThumbsUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Costo Adquisición</p>
                <p className="text-3xl font-bold text-purple-600">${stats.avgAcquisitionCost}</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiempo Ahorrado</p>
                <p className="text-3xl font-bold text-amber-600">+100h</p>
                <p className="text-xs text-muted-foreground">Automatización IA</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audiencias Destacadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Audiencias de Alto Rendimiento
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Segmentos con mayor potencial de conversión
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("audiences")}>
              Ver Todas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.slice(0, 3).map((audience) => (
              <div key={audience.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold truncate">{audience.name}</h4>
                  <Badge variant={audience.confidence_score > 80 ? "default" : "secondary"}>
                    {audience.confidence_score}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {audience.description || 'Sin descripción'}
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Alcance:</span>
                    <span className="font-medium">{(audience.estimated_size / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Conversión:</span>
                    <span className="font-medium text-green-600">{audience.conversion_potential}%</span>
                  </div>
                  <Progress value={audience.confidence_score} className="h-2" />
                </div>
              </div>
            ))}
          </div>
          {audiences.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay audiencias creadas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera audiencia con IA
              </p>
              <Button onClick={() => setActiveTab("create")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Crear Primera Audiencia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar Perfil ICP
  const renderICPProfile = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Perfil de Cliente Ideal (ICP)</h2>
        <p className="text-muted-foreground">
          Análisis profundo de tu cliente perfecto basado en datos de tu empresa
        </p>
      </div>

      {!icpProfile ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Genera tu Perfil ICP</h3>
            <p className="text-muted-foreground mb-6">
              Utiliza IA para crear un perfil detallado de tu cliente ideal
            </p>
            <Button 
              onClick={generateICPProfile} 
              disabled={analyzing}
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generando ICP...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generar Perfil ICP
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Datos Demográficos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Perfil Demográfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(icpProfile.demographic || {}).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace('_', ' ')}
                    </p>
                    <p className="text-lg font-semibold">{value as string}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Perfil Profesional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Perfil Profesional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(icpProfile.professional || {}).map(([key, value]) => (
                  <div key={key} className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground capitalize mb-1">
                      {key.replace('_', ' ')}
                    </p>
                    <p className="font-medium">{value as string}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comportamiento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Perfil Psicográfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {icpProfile.behavioral && Object.entries(icpProfile.behavioral).map(([key, values]) => (
                  <div key={key}>
                    <h4 className="font-semibold mb-3 capitalize">{key.replace('_', ' ')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(values) && values.map((value: string, index: number) => (
                        <Badge key={index} variant="outline">{value}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={generateICPProfile} disabled={analyzing}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar ICP
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Crear audiencia desde ICP
                const audienceData = {
                  name: `Audiencia ICP - ${companyData?.name || 'Principal'}`,
                  description: `Audiencia generada desde el perfil ICP de ${companyData?.name || 'la empresa'}`,
                  demographic: icpProfile.demographic,
                  professional: icpProfile.professional,
                  behavioral: icpProfile.behavioral,
                  psychographic: icpProfile.psychographic
                };
                createNewAudience(audienceData);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Crear Audiencia desde ICP
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar lista de audiencias con filtros avanzados
  const renderAudiencesList = () => (
    <div className="space-y-6">
      {/* Header con búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Mis Audiencias IA
          </h2>
          <p className="text-muted-foreground">
            Gestiona y optimiza tus segmentos de audiencia
          </p>
        </div>
        
        <Button onClick={() => setActiveTab("create")} className="shrink-0">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nueva Audiencia
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar audiencias por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                value={filterPlatform} 
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas las plataformas</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter/X</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de audiencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAudiences.map((audience) => (
          <Card key={audience.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{audience.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {audience.description || 'Sin descripción'}
                  </p>
                </div>
                <Badge 
                  variant={audience.confidence_score > 80 ? "default" : audience.confidence_score > 60 ? "secondary" : "outline"}
                  className="ml-2"
                >
                  {audience.confidence_score}% confianza
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Métricas principales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Users2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Alcance</p>
                  <p className="font-semibold text-blue-600">
                    {(audience.estimated_size / 1000).toFixed(1)}K
                  </p>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Conversión</p>
                  <p className="font-semibold text-green-600">
                    {audience.conversion_potential}%
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-2 text-sm">
                {audience.acquisition_cost_estimate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo adquisición:</span>
                    <span className="font-medium">${audience.acquisition_cost_estimate}</span>
                  </div>
                )}
                
                {audience.lifetime_value_estimate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor de vida:</span>
                    <span className="font-medium text-green-600">${audience.lifetime_value_estimate}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creada:</span>
                  <span className="font-medium">
                    {new Date(audience.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Plataformas optimizadas */}
              <div>
                <p className="text-sm font-medium mb-2">Optimizada para:</p>
                <div className="flex flex-wrap gap-2">
                  {['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((platform) => {
                    const targetingData = audience[`${platform}_targeting` as keyof AudienceSegment];
                    if (!targetingData) return null;
                    
                    const icons = {
                      facebook: Facebook,
                      instagram: Instagram,
                      linkedin: Linkedin,
                      twitter: Twitter,
                      tiktok: Music,
                      youtube: Youtube
                    };
                    
                    const Icon = icons[platform as keyof typeof icons];
                    
                    return (
                      <Badge key={platform} variant="outline" className="flex items-center gap-1">
                        {Icon && <Icon className="w-3 h-3" />}
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Progreso de confianza */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Nivel de confianza</span>
                  <span>{audience.confidence_score}%</span>
                </div>
                <Progress value={audience.confidence_score} className="h-2" />
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedAudience(audience)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver Detalles
                </Button>
                
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>
                
                <Button size="sm" variant="outline">
                  <Share2 className="w-4 h-4 mr-1" />
                  Compartir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredAudiences.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || filterPlatform !== "all" 
                ? "No se encontraron audiencias" 
                : "No hay audiencias creadas"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterPlatform !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza creando tu primera audiencia con IA"}
            </p>
            {!(searchQuery || filterPlatform !== "all") && (
              <Button onClick={() => setActiveTab("create")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Crear Primera Audiencia
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Renderizar vista por plataformas
  const renderPlatformView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Audiencias por Plataforma</h2>
        <p className="text-muted-foreground">
          Optimización específica para cada red social
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
          { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
          { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
          { id: 'tiktok', name: 'TikTok', icon: Music, color: 'bg-black' },
          { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-gray-900' },
          { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600' }
        ].map((platform) => {
          const platformAudiences = audiences.filter(aud => 
            aud[`${platform.id}_targeting` as keyof AudienceSegment] !== null
          );

          return (
            <Card key={platform.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${platform.color} text-white`}>
                    <platform.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{platform.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {platformAudiences.length} audiencias optimizadas
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {platformAudiences.slice(0, 3).map((audience) => (
                    <div key={audience.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{audience.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {audience.confidence_score}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Alcance: {(audience.estimated_size / 1000).toFixed(1)}K</span>
                        <span>Conversión: {audience.conversion_potential}%</span>
                      </div>
                    </div>
                  ))}
                  
                  {platformAudiences.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <p className="text-sm">No hay audiencias optimizadas</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => setActiveTab("create")}
                      >
                        Crear Audiencia
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Renderizar creación de audiencia
  const renderCreateAudience = () => {
    const handleCreateAudience = () => {
      if (!newAudienceName.trim() || !newAudienceDescription.trim()) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos",
          variant: "destructive"
        });
        return;
      }

      const audienceData = {
        name: newAudienceName,
        description: newAudienceDescription,
        platforms: selectedPlatforms
      };

      createNewAudience(audienceData);
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Crear Nueva Audiencia IA</h2>
          <p className="text-muted-foreground">
            Genera audiencias inteligentes con optimización automática para múltiples plataformas
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Configuración de Audiencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="audience-name">Nombre de la Audiencia</Label>
              <Input
                id="audience-name"
                value={newAudienceName}
                onChange={(e) => setNewAudienceName(e.target.value)}
                placeholder="Ej: Empresarios Jóvenes Tech"
              />
            </div>

            <div>
              <Label htmlFor="audience-description">Descripción</Label>
              <Textarea
                id="audience-description"
                value={newAudienceDescription}
                onChange={(e) => setNewAudienceDescription(e.target.value)}
                placeholder="Describe las características principales de esta audiencia..."
                rows={4}
              />
            </div>

            <div>
              <Label>Plataformas de Destino (opcional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {[
                  { id: 'facebook', name: 'Facebook', icon: Facebook },
                  { id: 'instagram', name: 'Instagram', icon: Instagram },
                  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
                  { id: 'tiktok', name: 'TikTok', icon: Music },
                  { id: 'twitter', name: 'X (Twitter)', icon: Twitter },
                  { id: 'youtube', name: 'YouTube', icon: Youtube }
                ].map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms(prev => [...prev, platform.id]);
                        } else {
                          setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={platform.id} className="flex items-center gap-2 text-sm">
                      <platform.icon className="w-4 h-4" />
                      {platform.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleCreateAudience}
              disabled={analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creando Audiencia IA...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Crear Audiencia con IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar detalles de audiencia
  const renderAudienceDetails = (audience: AudienceSegment) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold">{audience.name}</h3>
        <p className="text-muted-foreground mt-1">{audience.description || 'Sin descripción'}</p>
        <Badge className="mt-2">
          {audience.confidence_score}% Confianza
        </Badge>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Users2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Alcance</p>
          <p className="text-xl font-bold text-blue-600">
            {(audience.estimated_size / 1000).toFixed(1)}K
          </p>
        </div>
        
        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Conversión</p>
          <p className="text-xl font-bold text-green-600">
            {audience.conversion_potential}%
          </p>
        </div>

        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">CAC</p>
          <p className="text-xl font-bold text-purple-600">
            ${audience.acquisition_cost_estimate || 0}
          </p>
        </div>

        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
          <Gauge className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">LTV</p>
          <p className="text-xl font-bold text-emerald-600">
            ${audience.lifetime_value_estimate || 0}
          </p>
        </div>
      </div>

      {/* Plataformas optimizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Optimización por Plataforma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((platform) => {
              const data = audience[`${platform}_targeting` as keyof AudienceSegment];
              if (!data) return null;
              
              const icons = {
                facebook: Facebook,
                instagram: Instagram,
                linkedin: Linkedin,
                twitter: Twitter,
                tiktok: Music,
                youtube: Youtube
              };
              
              const Icon = icons[platform as keyof typeof icons];
              
              return (
                <div key={platform} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {Icon && <Icon className="w-5 h-5" />}
                    <h4 className="font-semibold capitalize">{platform}</h4>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {typeof data === 'object' && data && (data as any).description ? 
                      (data as any).description : 
                      `Estrategia optimizada para ${platform}`
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights de IA */}
      {audience.ai_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {typeof audience.ai_insights === 'string' ? 
                audience.ai_insights : 
                JSON.stringify(audience.ai_insights, null, 2)
              }
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando experiencia de audiencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header principal */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Audiencias IA Avanzadas
              </h1>
              <p className="text-muted-foreground">
                Automatiza la creación de audiencias predictivas de alto rendimiento
              </p>
            </div>
          </div>
        </div>

        {/* Navegación por tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="icp" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil ICP</span>
            </TabsTrigger>
            <TabsTrigger value="audiences" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Audiencias</span>
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Por Plataforma</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Nueva</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverview()}</TabsContent>
          <TabsContent value="icp">{renderICPProfile()}</TabsContent>
          <TabsContent value="audiences">{renderAudiencesList()}</TabsContent>
          <TabsContent value="platforms">{renderPlatformView()}</TabsContent>
          <TabsContent value="create">{renderCreateAudience()}</TabsContent>
        </Tabs>

        {/* Modal de detalles de audiencia */}
        {selectedAudience && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{selectedAudience.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAudience(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderAudienceDetails(selectedAudience)}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienciasManager;