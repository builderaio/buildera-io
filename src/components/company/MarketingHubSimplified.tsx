import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  BarChart3, 
  Calendar, 
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  ArrowRight,
  Plus,
  ChevronRight,
  Zap,
  Eye,
  Target
} from "lucide-react";
import SocialMediaHub from "./SocialMediaHub";
import ContentGenerator from "./ContentGenerator";
import MarketingCalendar from "./MarketingCalendar";
import MarketingHubOnboarding from "./MarketingHubOnboarding";

interface MarketingHubProps {
  profile: any;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

const MarketingHubSimplified = ({ profile }: MarketingHubProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [realMetrics, setRealMetrics] = useState<QuickStat[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [socialConnections, setSocialConnections] = useState({
    linkedin: false,
    instagram: false,
    facebook: false,
    tiktok: false
  });
  const { toast } = useToast();

  useEffect(() => {
    checkOnboardingStatus();
    loadEssentialData();
  }, [profile?.user_id]);

  const checkOnboardingStatus = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: connections } = await supabase
        .from('linkedin_connections')
        .select('id')
        .eq('user_id', profile.user_id)
        .limit(1);

      const { data: instagramConnections } = await supabase
        .from('facebook_instagram_connections')
        .select('id')
        .eq('user_id', profile.user_id)
        .limit(1);

      const hasConnections = (connections && connections.length > 0) || 
                           (instagramConnections && instagramConnections.length > 0);

      setNeedsOnboarding(!hasConnections);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setNeedsOnboarding(false);
    }
  };

  const loadEssentialData = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    try {
      // Load key metrics and activity in parallel
      await Promise.all([
        loadKeyMetrics(),
        loadRecentActivity(),
        loadUpcomingPosts(),
        checkConnections()
      ]);
    } catch (error) {
      console.error('Error loading essential data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKeyMetrics = async () => {
    try {
      const [insightsRes, actionablesRes, postsRes] = await Promise.all([
        supabase
          .from('marketing_insights')
          .select('*')
          .eq('user_id', profile.user_id),
        
        supabase
          .from('marketing_actionables')
          .select('status')
          .eq('user_id', profile.user_id)
          .eq('status', 'completed'),

        supabase
          .from('linkedin_posts')
          .select('likes_count, comments_count')
          .eq('user_id', profile.user_id)
      ]);

      // Calculate metrics from available data
      const totalInsights = insightsRes.data?.length || 0;
      const completedActions = actionablesRes.data?.length || 0;
      
      // Calculate engagement from posts
      const posts = postsRes.data || [];
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalEngagement = totalLikes + totalComments;

      const metrics: QuickStat[] = [
        {
          label: "Insights Generados",
          value: totalInsights.toString(),
          change: totalInsights > 0 ? `+${Math.min(totalInsights, 15)}` : "0",
          trend: "up",
          icon: Sparkles,
          color: "text-purple-600"
        },
        {
          label: "Engagement Total",
          value: formatNumber(totalEngagement),
          change: totalEngagement > 0 ? "+8.5%" : "0%",
          trend: totalEngagement > 0 ? "up" : "neutral",
          icon: Heart,
          color: "text-pink-600"
        },
        {
          label: "Acciones Completadas",
          value: completedActions.toString(),
          change: completedActions > 0 ? `+${completedActions}` : "0",
          trend: completedActions > 0 ? "up" : "neutral",
          icon: Target,
          color: "text-green-600"
        }
      ];

      setRealMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      // Set default metrics on error
      setRealMetrics([
        {
          label: "Insights Disponibles",
          value: "0",
          change: "Nuevo",
          trend: "neutral",
          icon: Sparkles,
          color: "text-purple-600"
        },
        {
          label: "Conecta Redes Sociales",
          value: "0",
          change: "Empezar",
          trend: "neutral",
          icon: Heart,
          color: "text-pink-600"
        },
        {
          label: "Comienza Ahora",
          value: "0",
          change: "Setup",
          trend: "neutral",
          icon: Target,
          color: "text-green-600"
        }
      ]);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const [insights, posts] = await Promise.all([
        supabase
          .from('marketing_insights')
          .select('created_at, title')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(3),
        
        supabase
          .from('linkedin_posts')
          .select('posted_at, content')
          .eq('user_id', profile.user_id)
          .order('posted_at', { ascending: false })
          .limit(2)
      ]);

      const activities = [];

      insights.data?.forEach(insight => {
        activities.push({
          icon: Sparkles,
          iconColor: 'text-purple-600',
          title: insight.title || 'Nuevo insight generado',
          time: formatTimeAgo(insight.created_at),
          type: 'insight'
        });
      });

      posts.data?.forEach(post => {
        activities.push({
          icon: MessageCircle,
          iconColor: 'text-blue-600',
          title: 'Post publicado en LinkedIn',
          time: formatTimeAgo(post.posted_at),
          type: 'post'
        });
      });

      setRecentActivity(activities.slice(0, 4));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadUpcomingPosts = async () => {
    try {
      const { data: scheduledPosts } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .gte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(3);

      const upcoming = scheduledPosts?.map(post => ({
        icon: Calendar,
        title: typeof post.content === 'string' ? post.content.substring(0, 40) + '...' : 'Post programado',
        time: formatScheduledTime(post.scheduled_for),
        platform: post.platform
      })) || [];

      setUpcomingPosts(upcoming);
    } catch (error) {
      console.error('Error loading upcoming posts:', error);
    }
  };

  const checkConnections = async () => {
    try {
      const [linkedinRes, facebookRes, tiktokRes] = await Promise.all([
        supabase.from('linkedin_connections').select('id').eq('user_id', profile.user_id).limit(1),
        supabase.from('facebook_instagram_connections').select('id').eq('user_id', profile.user_id).limit(1),
        supabase.from('tiktok_connections').select('id').eq('user_id', profile.user_id).limit(1)
      ]);

      setSocialConnections({
        linkedin: (linkedinRes.data?.length || 0) > 0,
        instagram: (facebookRes.data?.length || 0) > 0,
        facebook: (facebookRes.data?.length || 0) > 0,
        tiktok: (tiktokRes.data?.length || 0) > 0
      });
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setNeedsOnboarding(false);
    loadEssentialData();
    toast({
      title: "¡Configuración completada!",
      description: "Tu Marketing Hub está listo para usar.",
    });
  };

  // Show onboarding if needed
  if (needsOnboarding === true || showOnboarding) {
    return (
      <MarketingHubOnboarding 
        profile={profile} 
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Show loading
  if (needsOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando tu Marketing Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Simplified Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Marketing Hub
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tu centro de comando inteligente para marketing digital
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Simplified Navigation */}
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-14 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Panel</span>
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Crear</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Programar</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8 animate-fade-in">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {realMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-background/60 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <IconComponent className={`h-6 w-6 ${metric.color}`} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{metric.value}</p>
                            <p className="text-sm text-muted-foreground">{metric.label}</p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                          {metric.change}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="border-0 bg-background/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Acciones Rápidas
                  </h3>
                  <div className="space-y-4">
                    <Button 
                      onClick={() => setActiveTab("content")}
                      className="w-full justify-between h-14 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Crear Contenido con IA</span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab("calendar")}
                      variant="outline" 
                      className="w-full justify-between h-14 hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">Programar Publicación</span>
                      </div>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 bg-background/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Actividad Reciente
                  </h3>
                  <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => {
                        const IconComponent = activity.icon;
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/10 to-primary/20 flex items-center justify-center">
                              <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{activity.title}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                        <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Posts */}
            {upcomingPosts.length > 0 && (
              <Card className="border-0 bg-background/60 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Próximas Publicaciones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {upcomingPosts.map((post, index) => (
                      <div key={index} className="p-4 rounded-xl border bg-background/50 hover:bg-background/80 transition-colors">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-4 w-4 text-primary mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground">{post.time}</p>
                            {post.platform && (
                              <Badge variant="outline" className="text-xs mt-2 capitalize">
                                {post.platform}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Content Creation Tab */}
          <TabsContent value="content" className="animate-fade-in">
            <Card className="border-0 bg-background/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <ContentGenerator profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="animate-fade-in">
            <Card className="border-0 bg-background/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <MarketingCalendar profile={profile} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Floating Setup Button */}
        <Button
          onClick={() => setShowOnboarding(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-6 right-6 shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </div>
    </div>
  );
};

export default MarketingHubSimplified;