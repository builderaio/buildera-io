import { useState, useEffect } from "react";
import { 
  Sparkles, Target, TrendingUp, Users, Zap, BookOpen, 
  Store, UserCheck, Network, Brain, BarChart3, Calendar,
  ArrowRight, Trophy, Rocket, Star, Eye, Heart, MessageCircle,
  Share2, Clock, CheckCircle2, AlertTriangle, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface MandoCentralProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

interface DashboardSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  metrics: {
    label: string;
    value: string | number;
    trend?: string;
  }[];
  action: string;
  view: string;
  badge?: string;
  progress?: number;
}

const MandoCentral = ({ profile, onNavigate }: MandoCentralProps) => {
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalReach: 0,
    totalEngagement: 0,
    contentGenerated: 0,
    audiencesCreated: 0,
    expertsAvailable: 0,
    activeCampaigns: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🎯 MandoCentral useEffect - profile:', profile);
    if (profile?.user_id) {
      loadDashboardData();
    } else {
      console.warn('⚠️ No profile or user_id found, setting loading to false');
      setLoading(false);
    }
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    console.log('🚀 Starting loadDashboardData for user:', profile?.user_id);
    setLoading(true);
    try {
      // Cargar datos de la empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('created_by', profile.user_id)
        .maybeSingle();
      
      if (companyError) {
        console.error('❌ Error loading company:', companyError);
      }
      
      console.log('✅ Company data loaded:', company);
      
      setCompanyData(company);

      // Cargar métricas de diferentes secciones
      const [
        socialConnections,
        contentRecommendations,
        audiences,
        campaigns,
        insights,
        experts
      ] = await Promise.all([
        // Conexiones sociales
        Promise.all([
          supabase.from('linkedin_connections').select('id').eq('user_id', profile.user_id),
          supabase.from('facebook_instagram_connections').select('id').eq('user_id', profile.user_id),
          supabase.from('tiktok_connections').select('id').eq('user_id', profile.user_id)
        ]),
        // Contenido generado
        supabase.from('content_recommendations').select('id, status').eq('user_id', profile.user_id),
        // Audiencias
        supabase.from('company_audiences').select('id').eq('user_id', profile.user_id),
        // Campañas
        supabase.from('marketing_campaigns').select('id, status').eq('user_id', profile.user_id),
        // Insights
        supabase.from('audience_insights').select('id').eq('user_id', profile.user_id),
        // Expertos disponibles
        supabase.from('experts').select('id').eq('is_available', true).limit(10)
      ]);

      const connectionsCount = socialConnections.reduce((acc, conn) => acc + (conn.data?.length || 0), 0);
      
      console.log('📊 Stats calculated:', {
        contentGenerated: contentRecommendations.data?.length || 0,
        audiencesCreated: audiences.data?.length || 0,
        expertsAvailable: experts.data?.length || 0,
        activeCampaigns: campaigns.data?.filter(c => c.status === 'active').length || 0,
        connectionsCount
      });
      
      setStats({
        totalReach: 0, // Se calculará con datos reales
        totalEngagement: 0,
        contentGenerated: contentRecommendations.data?.length || 0,
        audiencesCreated: audiences.data?.length || 0,
        expertsAvailable: experts.data?.length || 0,
        activeCampaigns: campaigns.data?.filter(c => c.status === 'active').length || 0
      });

      // Construir secciones del dashboard
      const dashboardSections: DashboardSection[] = [
        {
          id: 'adn-empresa',
          title: 'ADN del Negocio',
          description: 'Define la identidad, valores y estrategia de tu negocio',
          icon: Building2,
          gradient: 'from-blue-500 via-blue-600 to-indigo-600',
          metrics: [
            { label: 'Perfil completado', value: company ? '100%' : '0%' },
            { label: 'Objetivos definidos', value: company?.description ? 'Sí' : 'No' }
          ],
          action: 'Configurar ADN',
          view: 'adn-empresa',
          badge: company ? 'Configurado' : 'Pendiente',
          progress: company ? 100 : 0
        },
        {
          id: 'marketing-hub',
          title: 'Marketing Hub',
          description: 'Crea, programa y publica contenido en todas tus redes sociales',
          icon: Rocket,
          gradient: 'from-purple-500 via-pink-500 to-rose-500',
          metrics: [
            { label: 'Contenido generado', value: stats.contentGenerated, trend: '+12%' },
            { label: 'Redes conectadas', value: connectionsCount },
            { label: 'Campañas activas', value: stats.activeCampaigns }
          ],
          action: 'Ir al Hub',
          view: 'marketing-hub',
          badge: 'Popular',
          progress: 75
        },
        {
          id: 'audiencias',
          title: 'Audiencias',
          description: 'Analiza y segmenta tu audiencia para contenido personalizado',
          icon: Users,
          gradient: 'from-cyan-500 via-teal-500 to-emerald-500',
          metrics: [
            { label: 'Audiencias creadas', value: stats.audiencesCreated },
            { label: 'Insights generados', value: insights.data?.length || 0 },
            { label: 'Segmentación', value: 'Avanzada' }
          ],
          action: 'Gestionar Audiencias',
          view: 'audiencias-manager',
          progress: 60
        },
        {
          id: 'inteligencia',
          title: 'Inteligencia Competitiva',
          description: 'Monitorea competidores y tendencias del mercado',
          icon: Brain,
          gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
          metrics: [
            { label: 'Análisis realizados', value: '0', trend: 'Nuevo' },
            { label: 'Competidores', value: '0' },
            { label: 'Tendencias', value: 'Disponibles' }
          ],
          action: 'Ver Análisis',
          view: 'inteligencia-competitiva',
          badge: 'IA',
          progress: 0
        },
        {
          id: 'analytics',
          title: 'Analytics de Contenido',
          description: 'Mide el rendimiento de tu contenido en tiempo real',
          icon: BarChart3,
          gradient: 'from-orange-500 via-amber-500 to-yellow-500',
          metrics: [
            { label: 'Alcance total', value: formatNumber(stats.totalReach) },
            { label: 'Engagement', value: formatNumber(stats.totalEngagement), trend: '+8%' },
            { label: 'Tasa conversión', value: '0%' }
          ],
          action: 'Ver Métricas',
          view: 'content-analysis-dashboard',
          progress: 40
        },
        {
          id: 'academia',
          title: 'Academia Buildera',
          description: 'Aprende estrategias de marketing digital con IA',
          icon: BookOpen,
          gradient: 'from-green-500 via-emerald-500 to-teal-500',
          metrics: [
            { label: 'Cursos disponibles', value: '50+' },
            { label: 'Certificaciones', value: '12' },
            { label: 'Progreso', value: '0%' }
          ],
          action: 'Comenzar a Aprender',
          view: 'academia-buildera',
          badge: 'Nuevo',
          progress: 0
        },
        {
          id: 'expertos',
          title: 'Red de Expertos',
          description: 'Conecta con especialistas en marketing y negocios',
          icon: UserCheck,
          gradient: 'from-red-500 via-rose-500 to-pink-500',
          metrics: [
            { label: 'Expertos disponibles', value: stats.expertsAvailable },
            { label: 'Consultas', value: '0' },
            { label: 'Rating promedio', value: '4.8⭐' }
          ],
          action: 'Ver Expertos',
          view: 'expertos',
          progress: 0
        },
        {
          id: 'marketplace',
          title: 'Marketplace',
          description: 'Descubre agentes IA y herramientas para tu negocio',
          icon: Store,
          gradient: 'from-indigo-500 via-blue-500 to-sky-500',
          metrics: [
            { label: 'Agentes disponibles', value: '100+' },
            { label: 'Mis agentes', value: '0' },
            { label: 'Categorías', value: '12' }
          ],
          action: 'Explorar',
          view: 'marketplace',
          badge: 'Destacado',
          progress: 0
        },
        {
          id: 'base-conocimiento',
          title: 'Base de Conocimiento',
          description: 'Centraliza y organiza toda la información de tu negocio',
          icon: Network,
          gradient: 'from-slate-500 via-gray-600 to-zinc-600',
          metrics: [
            { label: 'Documentos', value: '0' },
            { label: 'Categorías', value: '0' },
            { label: 'Último update', value: 'Nunca' }
          ],
          action: 'Gestionar Archivos',
          view: 'base-conocimiento',
          progress: 0
        }
      ];

      setSections(dashboardSections);
      console.log('✅ Dashboard sections created:', dashboardSections.length);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar algunos datos del dashboard",
        variant: "destructive",
      });
      
      // Cargar secciones por defecto aunque haya error
      const defaultSections: DashboardSection[] = [
        {
          id: 'adn-empresa',
          title: 'ADN del Negocio',
          description: 'Define la identidad, valores y estrategia de tu negocio',
          icon: Building2,
          gradient: 'from-blue-500 via-blue-600 to-indigo-600',
          metrics: [
            { label: 'Perfil completado', value: '0%' },
            { label: 'Objetivos definidos', value: 'No' }
          ],
          action: 'Configurar ADN',
          view: 'adn-empresa',
          badge: 'Pendiente',
          progress: 0
        },
        {
          id: 'marketing-hub',
          title: 'Marketing Hub',
          description: 'Crea, programa y publica contenido en todas tus redes sociales',
          icon: Rocket,
          gradient: 'from-purple-500 via-pink-500 to-rose-500',
          metrics: [
            { label: 'Contenido generado', value: 0 },
            { label: 'Redes conectadas', value: 0 },
            { label: 'Campañas activas', value: 0 }
          ],
          action: 'Ir al Hub',
          view: 'marketing-hub',
          badge: 'Popular',
          progress: 0
        }
      ];
      setSections(defaultSections);
    } finally {
      console.log('✅ Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate(`/company-dashboard?view=${view}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <p className="text-muted-foreground">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Mando Central
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            ¡Bienvenido, {profile?.full_name?.split(' ')[0] || "Usuario"}! 🚀
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl">
            Tu centro de comando para gestionar todo tu ecosistema de marketing digital con el poder de la IA
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Alcance</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalReach)}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Engagement</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.totalEngagement)}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Contenido</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.contentGenerated}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-white/80" />
                <span className="text-sm text-white/80">Campañas</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold">Tu Ecosistema Digital</h2>
          <Badge variant="outline" className="hidden md:flex">
            {sections.length} Herramientas disponibles
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            
            return (
              <Card 
                key={section.id}
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2"
                onClick={() => handleNavigate(section.view)}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    
                    {section.badge && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {section.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-4">
                  {/* Metrics */}
                  <div className="space-y-3">
                    {section.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{metric.value}</span>
                          {metric.trend && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                              {metric.trend}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress Bar */}
                  {section.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{section.progress}%</span>
                      </div>
                      <Progress value={section.progress} className="h-2" />
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(section.view);
                    }}
                  >
                    <span>{section.action}</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>

                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Banner */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">¿Listo para impulsar tu negocio?</h3>
                <p className="text-muted-foreground">Comienza creando tu primera campaña de marketing con IA</p>
              </div>
            </div>
            
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleNavigate('marketing-hub')}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Crear Campaña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MandoCentral;