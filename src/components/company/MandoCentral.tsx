import { useState, useEffect } from "react";
import { Activity, Clock, Users, Zap, Store, UserCheck, Bot, TrendingUp, Sparkles, Target, ArrowRight, Eye, Heart, AlertTriangle, CheckCircle2, Calendar, MessageCircle, Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import CampaignWizardQuickAccess from './CampaignWizardQuickAccess';

interface MandoCentralProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

interface MarketingKPI {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuickWin {
  id: string;
  title: string;
  description: string;
  impact: string;
  urgency: 'urgent' | 'high' | 'medium';
  action: string;
  onClick: () => void;
  icon: any;
  color: string;
}

interface GrowthOpportunity {
  id: string;
  title: string;
  description: string;
  potential_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  data_source: string;
  onClick: () => void;
}

const MandoCentral = ({ profile, onNavigate }: MandoCentralProps) => {
  console.log('🎯 MandoCentral component rendered with profile:', profile);
  const [marketingKPIs, setMarketingKPIs] = useState<MarketingKPI[]>([]);
  const [quickWins, setQuickWins] = useState<QuickWin[]>([]);
  const [growthOpportunities, setGrowthOpportunities] = useState<GrowthOpportunity[]>([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      loadDashboardData();
    }
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMarketingKPIs(),
        loadQuickWins(),
        loadGrowthOpportunities(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar algunos datos del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMarketingKPIs = async () => {
    try {
      // Obtener datos reales del marketing hub
      const [instagramPosts, tiktokPosts, insights, actionables] = await Promise.all([
        supabase
          .from('instagram_posts')
          .select('like_count, comment_count, reach, impressions, posted_at')
          .eq('user_id', profile.user_id)
          .gte('posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('tiktok_posts')
          .select('digg_count, comment_count, play_count, posted_at')
          .eq('user_id', profile.user_id)
          .gte('posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        
        supabase
          .from('marketing_insights')
          .select('*')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('marketing_actionables')
          .select('*')
          .eq('user_id', profile.user_id)
      ]);

      const instagramData = instagramPosts.data || [];
      const tiktokData = tiktokPosts.data || [];
      const insightsData = insights.data || [];
      const actionablesData = actionables.data || [];

      // Calcular métricas reales
      const totalReach = instagramData.reduce((sum, post) => sum + (post.reach || post.impressions || 0), 0) +
                        tiktokData.reduce((sum, post) => sum + (post.play_count || 0), 0);
      
      const totalEngagement = instagramData.reduce((sum, post) => sum + (post.like_count || 0) + (post.comment_count || 0), 0) +
                             tiktokData.reduce((sum, post) => sum + (post.digg_count || 0) + (post.comment_count || 0), 0);
      
      const completedActions = actionablesData.filter(a => a.status === 'completed').length;
      const totalActions = actionablesData.length;
      const automationScore = totalActions > 0 ? (completedActions / totalActions * 100).toFixed(1) : '0';

      const kpis: MarketingKPI[] = [
        {
          title: "Alcance Total",
          value: formatNumber(totalReach),
          change: `${instagramData.length + tiktokData.length} posts este mes`,
          trend: totalReach > 0 ? 'up' : 'neutral',
          icon: Eye,
          color: "bg-primary/10 text-primary",
          priority: 'high'
        },
        {
          title: "Engagement",
          value: formatNumber(totalEngagement),
          change: `${Math.round((totalEngagement / Math.max(totalReach, 1)) * 100 * 100) / 100}% rate`,
          trend: totalEngagement > 100 ? 'up' : 'neutral',
          icon: Heart,
          color: "bg-pink-100 text-pink-600",
          priority: 'high'
        },
        {
          title: "Insights Generados",
          value: insightsData.length.toString(),
          change: `${insightsData.filter(i => new Date(i.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} esta semana`,
          trend: insightsData.length > 0 ? 'up' : 'neutral',
          icon: Sparkles,
          color: "bg-purple-100 text-purple-600",
          priority: 'medium'
        },
        {
          title: "Automatización",
          value: `${automationScore}%`,
          change: `${completedActions}/${totalActions} acciones`,
          trend: parseFloat(automationScore) > 70 ? 'up' : parseFloat(automationScore) > 40 ? 'neutral' : 'down',
          icon: Zap,
          color: "bg-green-100 text-green-600",
          priority: 'medium'
        }
      ];

      setMarketingKPIs(kpis);
    } catch (error) {
      console.error('Error loading marketing KPIs:', error);
      // KPIs por defecto si hay error
      setMarketingKPIs([
        {
          title: "Conecta Marketing",
          value: "0",
          change: "Configurar ahora",
          trend: 'neutral',
          icon: Target,
          color: "bg-primary/10 text-primary",
          priority: 'high'
        }
      ]);
    }
  };

  const loadQuickWins = async () => {
    try {
      const [socialConnections, recommendations, calendar] = await Promise.all([
        // Verificar conexiones sociales
        Promise.all([
          supabase.from('linkedin_connections').select('id').eq('user_id', profile.user_id).limit(1),
          supabase.from('facebook_instagram_connections').select('id').eq('user_id', profile.user_id).limit(1),
          supabase.from('tiktok_connections').select('id').eq('user_id', profile.user_id).limit(1)
        ]),
        
        // Obtener recomendaciones de contenido
        supabase
          .from('content_recommendations')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('status', 'active')
          .limit(3),
        
        // Verificar posts programados
        supabase
          .from('social_media_calendar')
          .select('*')
          .eq('user_id', profile.user_id)
          .gte('scheduled_at', new Date().toISOString())
          .limit(1)
      ]);

      const [linkedinConn, facebookConn, tiktokConn] = socialConnections;
      const hasConnections = (linkedinConn.data?.length || 0) + (facebookConn.data?.length || 0) + (tiktokConn.data?.length || 0) > 0;
      const hasRecommendations = (recommendations.data?.length || 0) > 0;
      const hasScheduledPosts = (calendar.data?.length || 0) > 0;

      const wins: QuickWin[] = [];

      // Quick Win 1: Conectar redes sociales
      if (!hasConnections) {
        wins.push({
          id: 'connect-social',
          title: 'Conectar Redes Sociales',
          description: 'Activa la sincronización automática de LinkedIn, Instagram y TikTok',
          impact: '+300% automatización',
          urgency: 'urgent',
          action: 'Conectar ahora',
          onClick: () => onNavigate?.('marketing-hub'),
          icon: Network,
          color: 'bg-blue-100 text-blue-600'
        });
      }

      // Quick Win 2: Implementar recomendaciones
      if (hasRecommendations) {
        wins.push({
          id: 'implement-recommendations',
          title: 'Aplicar Recomendaciones IA',
          description: `Tienes ${recommendations.data?.length} recomendaciones listas para implementar`,
          impact: '+150% engagement',
          urgency: 'high',
          action: 'Ver recomendaciones',
          onClick: () => onNavigate?.('marketing-hub'),
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-600'
        });
      }

      // Quick Win 3: Programar contenido
      if (hasConnections && !hasScheduledPosts) {
        wins.push({
          id: 'schedule-content',
          title: 'Programar Contenido',
          description: 'Crea tu calendario de contenido automático para la próxima semana',
          impact: '+200% consistencia',
          urgency: 'high',
          action: 'Programar posts',
          onClick: () => onNavigate?.('marketing-hub'),
          icon: Calendar,
          color: 'bg-purple-100 text-purple-600'
        });
      }

      // Quick Win por defecto: Generar contenido
      if (wins.length === 0) {
        wins.push({
          id: 'generate-content',
          title: 'Generar Contenido IA',
          description: 'Crea posts personalizados para tus redes sociales en segundos',
          impact: '+500% velocidad',
          urgency: 'medium',
          action: 'Generar contenido',
          onClick: () => onNavigate?.('marketing-hub'),
          icon: Sparkles,
          color: 'bg-yellow-100 text-yellow-600'
        });
      }

      setQuickWins(wins.slice(0, 3)); // Máximo 3 quick wins
    } catch (error) {
      console.error('Error loading quick wins:', error);
    }
  };

  const loadGrowthOpportunities = async () => {
    try {
      const { data: recommendations } = await supabase
        .from('content_recommendations')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('confidence_score', { ascending: false })
        .limit(5);

      const opportunities: GrowthOpportunity[] = [];

      recommendations?.forEach((rec, index) => {
        opportunities.push({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          potential_impact: `+${Math.round(rec.confidence_score * 100)}% mejora`,
          effort_level: index < 2 ? 'low' : index < 4 ? 'medium' : 'high',
          data_source: rec.platform,
          onClick: () => {
            // Marcar como implementada
            supabase
              .from('content_recommendations')
              .update({ status: 'implemented' })
              .eq('id', rec.id);
            onNavigate?.('marketing-hub');
          }
        });
      });

      // Oportunidades por defecto si no hay datos
      if (opportunities.length === 0) {
        opportunities.push(
          {
            id: 'default-1',
            title: 'Análisis de Audiencia',
            description: 'Descubre las preferencias y comportamientos de tu audiencia para crear contenido más efectivo',
            potential_impact: '+85% engagement',
            effort_level: 'low',
            data_source: 'IA Analytics',
            onClick: () => onNavigate?.('inteligencia-competitiva')
          },
          {
            id: 'default-2',
            title: 'Optimización de Horarios',
            description: 'Identifica los mejores momentos para publicar según tu audiencia',
            potential_impact: '+60% alcance',
            effort_level: 'low',
            data_source: 'Datos históricos',
            onClick: () => onNavigate?.('marketing-hub')
          }
        );
      }

      setGrowthOpportunities(opportunities);
    } catch (error) {
      console.error('Error loading growth opportunities:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data: dashboardAlerts } = await supabase
        .from('dashboard_alerts')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(3);

      setAlerts(dashboardAlerts || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleNavigateToWizard = () => {
    // Navegar al Marketing Hub con la tab de campaign-wizard activa
    window.location.href = '/company-dashboard?view=marketing-hub&tab=campaign-wizard';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Mando Central</h1>
        <p className="text-base md:text-lg text-muted-foreground">
          ¡Bienvenido, {profile?.full_name?.split(' ')[0] || "Usuario"}! Desde aquí puedes ver todo lo que está pasando en tu negocio y tomar las mejores decisiones para crecer.
        </p>
      </header>

      {/* Campaign Wizard Quick Access - Prominente al inicio */}
      <CampaignWizardQuickAccess onNavigateToWizard={handleNavigateToWizard} />

      {/* Hero Dashboard - Prioritized KPIs */}
      <section className="mb-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Critical Alerts */}
            {alerts.length > 0 && (
              <div className="mb-6 space-y-3">
                {alerts.slice(0, 2).map((alert: any) => (
                  <Alert key={alert.id} className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>{alert.title}</strong> - {alert.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Hero KPIs */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                Dashboard Inteligente
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {marketingKPIs.map((kpi, index) => {
                  const Icon = kpi.icon;
                  const isHighPriority = kpi.priority === 'high';
                  
                  return (
                    <Card key={index} className={`group hover:shadow-lg transition-all duration-300 ${
                      isHighPriority ? 'ring-2 ring-primary/20 shadow-lg' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${kpi.color} group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          {isHighPriority && (
                            <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                              Crítico
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                          <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                          <div className={`flex items-center text-sm ${
                            kpi.trend === "up" ? "text-green-600" : 
                            kpi.trend === "down" ? "text-red-600" : "text-muted-foreground"
                          }`}>
                            {kpi.trend === "up" && "↗ "}
                            {kpi.trend === "down" && "↘ "}
                            <span>{kpi.change}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Quick Wins Section - Apple Progressive Disclosure */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Acciones Inmediatas
          </h2>
          <Badge variant="outline" className="text-green-600 border-green-200">
            {quickWins.length} oportunidades
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickWins.map((win, index) => {
            const Icon = win.icon;
            const urgencyColors = {
              urgent: 'border-red-200 bg-red-50 hover:bg-red-100',
              high: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
              medium: 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            };

            return (
              <Card 
                key={win.id} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg group ${urgencyColors[win.urgency]}`}
                onClick={win.onClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${win.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge 
                      variant={win.urgency === 'urgent' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {win.urgency === 'urgent' ? 'Urgente' : win.urgency === 'high' ? 'Alto' : 'Medio'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {win.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {win.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {win.impact}
                      </Badge>
                      <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-medium">{win.action}</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Growth Opportunities - Apple Contextual Info */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            Oportunidades de Crecimiento
          </h2>
          <Button 
            variant="outline" 
            onClick={() => onNavigate?.('marketing-hub')}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            Ver todas las oportunidades
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {growthOpportunities.slice(0, 4).map((opportunity, index) => {
            const effortColors = {
              low: 'bg-green-100 text-green-700 border-green-200',
              medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              high: 'bg-red-100 text-red-700 border-red-200'
            };

            return (
              <Card 
                key={opportunity.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-300 group border-purple-100 hover:border-purple-200"
                onClick={opportunity.onClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-purple-600 transition-colors">
                        {opportunity.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {opportunity.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        {opportunity.potential_impact}
                      </Badge>
                      <Badge variant="outline" className={effortColors[opportunity.effort_level]}>
                        {opportunity.effort_level === 'low' ? 'Fácil' : 
                         opportunity.effort_level === 'medium' ? 'Medio' : 'Alto'} esfuerzo
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {opportunity.data_source}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">Herramientas que te van a encantar</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Descubre asistentes inteligentes especializados para cada área de tu negocio.
            </p>
            <button 
              onClick={() => onNavigate?.('marketplace')}
              className="flex items-center text-primary hover:text-accent transition-colors"
            >
              <Store className="w-5 h-5 mr-2" />
              <span>Ver Marketplace Completo</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              onClick={() => onNavigate?.('mis-agentes')}
              className="bg-primary/5 p-4 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors group"
            >
              <div className="flex items-center mb-2">
                <Bot className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-primary">Mis Agentes</h3>
                <ArrowRight className="w-4 h-4 ml-auto text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Agentes contratados</p>
            </div>
            <div 
              onClick={() => onNavigate?.('marketplace')}
              className="bg-secondary/5 p-4 rounded-lg cursor-pointer hover:bg-secondary/10 transition-colors group"
            >
              <div className="flex items-center mb-2">
                <Store className="w-5 h-5 text-secondary mr-2" />
                <h3 className="font-semibold text-secondary">Marketplace</h3>
                <ArrowRight className="w-4 h-4 ml-auto text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">15</p>
              <p className="text-sm text-muted-foreground">Agentes disponibles</p>
            </div>
            <div className="bg-accent/20 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <UserCheck className="w-5 h-5 text-accent-foreground mr-2" />
                <h3 className="font-semibold text-accent-foreground">Categorías</h3>
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Especializaciones</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Roles Empresariales Soportados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { role: "CEO/Dirección", agents: 3, color: "bg-red-100 text-red-800" },
                { role: "Marketing", agents: 5, color: "bg-purple-100 text-purple-800" },
                { role: "Ventas", agents: 4, color: "bg-blue-100 text-blue-800" },
                { role: "Finanzas", agents: 3, color: "bg-green-100 text-green-800" },
                { role: "RRHH", agents: 3, color: "bg-yellow-100 text-yellow-800" },
                { role: "Operaciones", agents: 4, color: "bg-orange-100 text-orange-800" },
                { role: "IT/Desarrollo", agents: 3, color: "bg-cyan-100 text-cyan-800" },
                { role: "Atención Cliente", agents: 5, color: "bg-pink-100 text-pink-800" }
              ].map((item, index) => (
                <div 
                  key={index} 
                  onClick={() => onNavigate?.('marketplace')}
                  className="bg-muted p-3 rounded-lg hover:bg-muted/80 transition-colors cursor-pointer group"
                >
                  <div className={`inline-flex items-center justify-between w-full px-2 py-1 rounded-full text-xs font-medium mb-1 ${item.color}`}>
                    <span>{item.role}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm font-semibold">{item.agents} agentes</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold text-primary mb-4">Ideas para hacer crecer tu negocio</h2>
        <div className="bg-card p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-muted-foreground">
              Oportunidades y recomendaciones personalizadas que hemos preparado para ti.
            </p>
            <button className="flex items-center text-primary hover:text-accent transition-colors">
              <Zap className="w-5 h-5 mr-2" />
              <span>Generar nuevos insights</span>
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
              <p className="font-bold text-primary">Oportunidad de Contenido</p>
              <p className="text-sm text-muted-foreground mt-1">
                El 25% de las búsquedas en su sitio se relacionan con "políticas de garantía". 
                Considere crear un Agente FAQ o una página dedicada para reducir consultas de soporte.
              </p>
            </div>
            <div className="bg-secondary/5 p-4 rounded-lg border-l-4 border-secondary">
              <p className="font-bold text-secondary">Optimización de Ventas</p>
              <p className="text-sm text-muted-foreground mt-1">
                Hemos detectado que los clientes que compran el Producto A, a menudo compran el Producto B dos semanas después. 
                Sugerimos un Agente de Email Marketing para una campaña de cross-selling.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MandoCentral;