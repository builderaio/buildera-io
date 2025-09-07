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

  const loadSocialAudienceStats = async (uid?: string) => {
    const resolvedUid = uid || profile?.user_id || userId;
    if (!resolvedUid) return;
    
    setSocialStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-social-audience-stats', {
        body: {}
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

    if (!hasSocialConnections) {
      return (
        <div className="text-center py-16">
          <WifiOff className="h-20 w-20 mx-auto text-muted-foreground/60 mb-6" />
          <h3 className="text-2xl font-bold mb-3">🔗 Conecta tu Ecosistema Digital</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Desbloquea insights profundos de audiencia conectando tus redes sociales.
          </p>
          <Button 
            onClick={() => setCurrentView('connections')} 
            size="lg"
            className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Wifi className="h-5 w-5" />
            Conectar Mis Redes Sociales
            <ArrowRight className="h-4 w-4" />
          </Button>
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

        {/* Sistema de Pestañas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-14 p-1 bg-muted/50">
            <TabsTrigger value="dashboard" className="text-sm font-medium">
              <Gauge className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="audiencia" className="text-sm font-medium">
              <Users className="w-4 h-4 mr-2" />
              Audiencia
            </TabsTrigger>
            <TabsTrigger value="contenido" className="text-sm font-medium">
              <BarChart3 className="w-4 h-4 mr-2" />
              Contenido
            </TabsTrigger>
            <TabsTrigger value="colaboraciones" className="text-sm font-medium">
              <Share2 className="w-4 h-4 mr-2" />
              Colaboraciones
            </TabsTrigger>
            <TabsTrigger value="tendencias" className="text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-2" />
              Tendencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">🧠 Dashboard de Inteligencia</h2>
              <p className="text-lg text-muted-foreground">El vistazo WOW - 80% del valor en 20% del tiempo</p>
            </div>
          </TabsContent>

          <TabsContent value="audiencia" className="space-y-6 mt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">🔬 Radiografía de la Audiencia</h2>
              <p className="text-lg text-muted-foreground">¿Quiénes son realmente tus seguidores?</p>
            </div>
          </TabsContent>

          <TabsContent value="contenido" className="space-y-6 mt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">📊 Análisis de Contenido</h2>
              <p className="text-lg text-muted-foreground">Qué contenido funciona, cuándo publicarlo y por qué</p>
            </div>
          </TabsContent>

          <TabsContent value="colaboraciones" className="space-y-6 mt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">🤝 Red de Colaboraciones</h2>
              <p className="text-lg text-muted-foreground">Tu ecosistema: con quién colaboras y quién te da visibilidad</p>
            </div>
          </TabsContent>

          <TabsContent value="tendencias" className="space-y-6 mt-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">📈 Tendencias e Historial</h2>
              <p className="text-lg text-muted-foreground">La evolución de tu perfil a lo largo del tiempo</p>
            </div>
          </TabsContent>
        </Tabs>
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
        <SocialConnectionManager />
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