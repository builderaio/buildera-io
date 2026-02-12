import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, Calendar, TrendingUp, Users, Heart, Plus, 
  Zap, Target, Brain, Rocket, PenTool, Network, Video, Image,
  FolderOpen, Ear, Link2, FileText, Bot, CheckCircle
} from "lucide-react";
import { getPlatformDisplayName } from '@/lib/socialPlatforms';
import ContentCalendar from './ContentCalendar';
import AudienceHighlightsWidget from './AudienceHighlightsWidget';
import ConnectionStatusBar from './ConnectionStatusBar';
import { MarketingGettingStarted } from './MarketingGettingStarted';
import { CrearContentHub } from './CrearContentHub';
import { UnifiedLibrary } from './UnifiedLibrary';
import { CampaignDashboard } from './campaign/CampaignDashboard';
import { InstagramCommunityManager } from './instagram/InstagramCommunityManager';
import { SocialListeningPanel } from './marketing/SocialListeningPanel';
import { UTMDashboard } from './marketing/UTMDashboard';
import { ReportBuilder } from './marketing/ReportBuilder';
import { SocialAutomationRules } from './marketing/SocialAutomationRules';
import { ContentApprovalPanel } from './marketing/ContentApprovalPanel';
import { AutopilotDashboard } from './marketing/AutopilotDashboard';
import { SocialConnectionManager } from './SocialConnectionManager';
import { SocialDataImportDialog } from '../agents/SocialDataImportDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

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

// Sub-navigation for Autopilot section
const AutopilotSubNav = ({ activeSubTab, onSubTabChange }: { activeSubTab: string; onSubTabChange: (tab: string) => void }) => {
  const { t } = useTranslation('marketing');
  const subTabs = [
    { id: 'status', label: t('hub.autopilotSubs.status', 'Status'), icon: Brain },
    { id: 'automation', label: t('hub.autopilotSubs.automation', 'Automation'), icon: Bot },
    { id: 'approvals', label: t('hub.autopilotSubs.approvals', 'Approvals'), icon: CheckCircle },
    { id: 'listening', label: t('hub.autopilotSubs.listening', 'Listening'), icon: Ear },
    { id: 'attribution', label: t('hub.autopilotSubs.attribution', 'Attribution'), icon: Link2 },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {subTabs.map(tab => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSubTabChange(tab.id)}
            className="gap-1.5 text-xs"
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

// Sub-navigation for Dashboard section
const DashboardSubNav = ({ activeSubTab, onSubTabChange }: { activeSubTab: string; onSubTabChange: (tab: string) => void }) => {
  const { t } = useTranslation('marketing');
  const subTabs = [
    { id: 'overview', label: t('hub.dashboardSubs.overview', 'Overview'), icon: BarChart3 },
    { id: 'library', label: t('hub.dashboardSubs.library', 'Library'), icon: FolderOpen },
    { id: 'reports', label: t('hub.dashboardSubs.reports', 'Reports'), icon: FileText },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {subTabs.map(tab => {
        const Icon = tab.icon;
        return (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSubTabChange(tab.id)}
            className="gap-1.5 text-xs"
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
};

const MarketingHubWow = ({ profile }: MarketingHubWowProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('marketing');
  
  const getInitialTab = () => {
    const tab = searchParams.get('tab');
    // Map old tabs to new structure
    const tabMapping: Record<string, string> = {
      'listening': 'autopilot',
      'utm': 'autopilot',
      'reports': 'dashboard',
      'automation': 'autopilot',
      'approvals': 'autopilot',
      'content': 'dashboard',
    };
    if (tab && tabMapping[tab]) return tabMapping[tab];
    const allowed = new Set(['dashboard', 'create', 'campaigns', 'calendar', 'autopilot']);
    if (tab && allowed.has(tab)) return tab;
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [autopilotSubTab, setAutopilotSubTab] = useState('status');
  const [dashboardSubTab, setDashboardSubTab] = useState('overview');
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      const tabMapping: Record<string, string> = {
        'listening': 'autopilot',
        'utm': 'autopilot',
        'reports': 'dashboard',
        'automation': 'autopilot',
        'approvals': 'autopilot',
        'content': 'dashboard',
      };
      // Map old sub-tabs
      if (tab === 'listening') setAutopilotSubTab('listening');
      else if (tab === 'utm') setAutopilotSubTab('attribution');
      else if (tab === 'automation') setAutopilotSubTab('automation');
      else if (tab === 'approvals') setAutopilotSubTab('approvals');
      else if (tab === 'reports') setDashboardSubTab('reports');
      else if (tab === 'content') setDashboardSubTab('library');
      
      const mapped = tabMapping[tab] || tab;
      const allowed = new Set(['dashboard', 'create', 'campaigns', 'calendar', 'autopilot']);
      if (allowed.has(mapped) && mapped !== activeTab) setActiveTab(mapped);
    }
  }, [searchParams]);

  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Handle action=connect deep link
  useEffect(() => {
    if (searchParams.get('action') === 'connect') {
      setShowConnectDialog(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [realMetrics, setRealMetrics] = useState<QuickStat[]>([]);
  const [socialConnections, setSocialConnections] = useState({
    linkedin: false, instagram: false, facebook: false, tiktok: false
  });
  const [platformStats, setPlatformStats] = useState({
    instagram: { posts: 0, followers: 0, engagement: 0 },
    linkedin: { posts: 0, connections: 0, engagement: 0 },
    facebook: { posts: 0, likes: 0, engagement: 0 },
    tiktok: { posts: 0, views: 0, engagement: 0 }
  });

  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        if (profile?.user_id) {
          setUserId(profile.user_id);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          setUserId(user?.id ?? null);
        }
      } catch (e) {
        console.warn('Could not resolve userId:', e);
      }
    };
    resolve();
  }, [profile?.user_id]);

  useEffect(() => {
    if (userId) initializeMarketingHub();
  }, [userId]);

  const initializeMarketingHub = async () => {
    setLoading(true);
    try {
      await Promise.all([loadConnections(), loadRealMetrics(), loadPlatformStats()]);
    } catch (error) {
      console.error('Error initializing Marketing Hub:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_connected')
        .eq('user_id', userId)
        .eq('is_connected', true);

      if (error) throw error;

      let platforms = new Set((data || []).map((a: any) => a.platform));

      if (!platforms.size) {
        const init = await supabase.functions.invoke('upload-post-manager', {
          body: { action: 'init_profile', data: {} }
        });
        const companyUsername = (init.data as any)?.companyUsername;
        if (companyUsername) {
          await supabase.functions.invoke('upload-post-manager', {
            body: { action: 'get_connections', data: { companyUsername } }
          });
          const { data: refreshed } = await supabase
            .from('social_accounts')
            .select('platform, is_connected')
            .eq('user_id', userId)
            .eq('is_connected', true);
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
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const [
        currentInsights, previousInsights,
        currentPosts, previousPosts,
        campaignsRes, actionsRes
      ] = await Promise.all([
        supabase.from('marketing_insights').select('*').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
        supabase.from('marketing_insights').select('*').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
        Promise.all([
          supabase.from('linkedin_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('instagram_posts').select('like_count, comment_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString()),
          supabase.from('tiktok_posts').select('digg_count, comment_count, created_at').eq('user_id', userId).gte('created_at', currentPeriodStart.toISOString())
        ]),
        Promise.all([
          supabase.from('linkedin_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('instagram_posts').select('like_count, comment_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString()),
          supabase.from('tiktok_posts').select('digg_count, comment_count, created_at').eq('user_id', userId).gte('created_at', previousPeriodStart.toISOString()).lt('created_at', currentPeriodStart.toISOString())
        ]),
        supabase.from('marketing_campaigns').select('*').eq('user_id', userId).in('status', ['active', 'running']),
        supabase.from('marketing_actionables').select('status').eq('user_id', userId).eq('status', 'completed')
      ]);

      const totalInsights = currentInsights.data?.length || 0;
      const previousTotalInsights = previousInsights.data?.length || 0;
      const insightsGrowth = previousTotalInsights > 0 ? 
        ((totalInsights - previousTotalInsights) / previousTotalInsights * 100).toFixed(1) : 
        totalInsights > 0 ? '100' : '0';

      const calculateEngagement = (platformPosts: any[]) => {
        return platformPosts.reduce((total, posts) => {
          return total + (posts.data || []).reduce((sum: number, post: any) => {
            const likes = post.likes_count || post.like_count || post.digg_count || 0;
            const comments = post.comments_count || post.comment_count || 0;
            return sum + likes + comments;
          }, 0);
        }, 0);
      };

      const currentEngagement = calculateEngagement(currentPosts);
      const previousEngagement = calculateEngagement(previousPosts);
      const engagementGrowth = previousEngagement > 0 ? 
        ((currentEngagement - previousEngagement) / previousEngagement * 100).toFixed(1) : 
        currentEngagement > 0 ? '100' : '0';

      const activeCampaigns = campaignsRes.data?.length || 0;
      const completedActions = actionsRes.data?.length || 0;
      const automationScore = totalInsights > 0 ? Math.round((completedActions / totalInsights) * 100) : 0;

      const insightsGrowthNum = parseFloat(insightsGrowth);
      const engagementGrowthNum = parseFloat(engagementGrowth);

      const metrics: QuickStat[] = [
        {
          label: t("hub.metrics.insights"),
          value: totalInsights.toString(),
          change: `${insightsGrowthNum >= 0 ? '+' : ''}${insightsGrowth}%`,
          trend: insightsGrowthNum > 0 ? "up" : insightsGrowthNum < 0 ? "down" : "neutral",
          icon: Brain,
          color: "text-primary",
          description: t("hub.metrics.insightsDesc")
        },
        {
          label: t("hub.metrics.engagement"),
          value: formatNumber(currentEngagement),
          change: `${engagementGrowthNum >= 0 ? '+' : ''}${engagementGrowth}%`,
          trend: engagementGrowthNum > 0 ? "up" : engagementGrowthNum < 0 ? "down" : "neutral",
          icon: Heart,
          color: "text-secondary",
          description: t("hub.metrics.engagementDesc")
        },
        {
          label: t("hub.metrics.campaigns"),
          value: activeCampaigns.toString(),
          change: activeCampaigns > 0 ? `${activeCampaigns} ${t("hub.metrics.running")}` : t("hub.metrics.noCampaigns"),
          trend: activeCampaigns > 0 ? "up" : "neutral",
          icon: Rocket,
          color: "text-primary",
          description: t("hub.metrics.campaignsDesc")
        },
        {
          label: t("hub.metrics.automation"),
          value: `${automationScore}%`,
          change: completedActions > 0 ? `${completedActions} ${t("hub.metrics.actions")}` : t("hub.metrics.noActions"),
          trend: automationScore > 70 ? "up" : automationScore > 30 ? "neutral" : "down",
          icon: Zap,
          color: "text-primary",
          description: t("hub.metrics.automationDesc")
        }
      ];

      setRealMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setRealMetrics([
        { label: t("hub.metrics.insights"), value: "0", change: t("hub.metrics.startingAnalysis"), trend: "neutral", icon: Brain, color: "text-primary" },
        { label: t("hub.metrics.engagement"), value: "0", change: t("hub.metrics.noData"), trend: "neutral", icon: Heart, color: "text-secondary" },
        { label: t("hub.metrics.campaigns"), value: "0", change: t("hub.metrics.createFirst"), trend: "neutral", icon: Rocket, color: "text-primary" },
        { label: t("hub.metrics.automation"), value: "0%", change: t("hub.metrics.configureAuto"), trend: "neutral", icon: Zap, color: "text-primary" }
      ]);
    }
  };

  const loadPlatformStats = async () => {
    try {
      const [instagramRes, linkedinRes, facebookRes, tiktokRes] = await Promise.all([
        supabase.from('instagram_posts').select('like_count, comment_count, reach, created_at').eq('user_id', userId),
        supabase.from('linkedin_posts').select('likes_count, comments_count, views_count, created_at').eq('user_id', userId),
        supabase.from('facebook_posts').select('likes_count, comments_count, created_at').eq('user_id', userId),
        supabase.from('tiktok_posts').select('digg_count, comment_count, play_count, created_at').eq('user_id', userId)
      ]);

      const calculateStats = (posts: any[], likeField: string, commentField: string, reachField?: string) => {
        if (!posts || posts.length === 0) return { posts: 0, engagement: 0, reach: 0 };
        const totalLikes = posts.reduce((sum, post) => sum + (post[likeField] || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post[commentField] || 0), 0);
        const totalReach = reachField ? posts.reduce((sum, post) => sum + (post[reachField] || 0), 0) : 0;
        return { posts: posts.length, engagement: totalLikes + totalComments, reach: totalReach };
      };

      setPlatformStats({
        instagram: { ...calculateStats(instagramRes.data || [], 'like_count', 'comment_count', 'reach'), followers: 0 },
        linkedin: { ...calculateStats(linkedinRes.data || [], 'likes_count', 'comments_count', 'views_count'), connections: 0 },
        facebook: { ...calculateStats(facebookRes.data || [], 'likes_count', 'comments_count'), likes: 0 },
        tiktok: { ...calculateStats(tiktokRes.data || [], 'digg_count', 'comment_count', 'play_count'), views: 0 }
      });
    } catch (error) {
      console.error('Error loading platform stats:', error);
      setPlatformStats({
        instagram: { posts: 0, followers: 0, engagement: 0 },
        linkedin: { posts: 0, connections: 0, engagement: 0 },
        facebook: { posts: 0, likes: 0, engagement: 0 },
        tiktok: { posts: 0, views: 0, engagement: 0 }
      });
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    else if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPlatformInfo = (platform: keyof typeof platformStats) => {
    const configs = {
      instagram: { name: 'Instagram', icon: '📷', color: 'bg-secondary' },
      linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-primary' },
      facebook: { name: 'Facebook', icon: '📘', color: 'bg-primary' },
      tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-foreground' }
    };
    return configs[platform] || { name: platform, icon: '🌐', color: 'bg-muted' };
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', 'marketing-hub');
    nextParams.set('tab', value);
    setSearchParams(nextParams);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t("hub.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards - Brand-aligned */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {realMetrics.map((metric, index) => (
          <Card key={index} className="overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'} className="text-xs">
                  {metric.change}
                </Badge>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold mb-1">{metric.value}</p>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                {metric.description && (
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs - Reduced from 11 to 5 */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full lg:w-fit mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t("hub.tabs.dashboard")}</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("hub.tabs.create")}</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">{t("hub.tabs.campaigns")}</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">{t("hub.tabs.calendar")}</span>
          </TabsTrigger>
          <TabsTrigger value="autopilot" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">{t("hub.tabs.autopilot")}</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab with sub-navigation */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardSubNav activeSubTab={dashboardSubTab} onSubTabChange={setDashboardSubTab} />
          
          {dashboardSubTab === 'overview' && (
            <>
              <ConnectionStatusBar connections={socialConnections} onConnectClick={() => setShowConnectDialog(true)} />
              
              {userId && (
                <MarketingGettingStarted userId={userId} onNavigateTab={handleTabChange} onImportData={() => setShowImportDialog(true)} />
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Platform Performance */}
                <Card className="lg:col-span-2 overflow-hidden border shadow-sm">
                  <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Network className="w-5 h-5 text-primary" />
                      {t("hub.platformPerformance")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {Object.entries(platformStats)
                        .filter(([platform]) => (socialConnections as any)[platform])
                        .map(([platform, stats]) => {
                          const platformInfo = getPlatformInfo(platform as keyof typeof platformStats);
                          const engagementRate = stats.posts > 0 ? (stats.engagement / stats.posts).toFixed(1) : '0';
                          return (
                            <div key={platform} className="relative overflow-hidden p-4 bg-muted/50 rounded-lg border hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                    {platformInfo.icon}
                                  </div>
                                  <div>
                                    <p className="font-semibold">{platformInfo.name}</p>
                                    <p className="text-sm text-muted-foreground">{stats.posts} {t("hub.publications")}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-primary">{formatNumber(stats.engagement)}</p>
                                  <p className="text-xs text-muted-foreground">{t("hub.totalEngagement")}</p>
                                  {stats.posts > 0 && (
                                    <p className="text-xs font-medium text-primary">{engagementRate} {t("hub.avgPerPost")}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {Object.values(socialConnections).every(v => !v) && (
                        <div className="text-center py-8">
                          <Network className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground mb-4">{t("hub.connectToSeeMetrics")}</p>
                          <Button variant="outline" onClick={() => setShowConnectDialog(true)}>
                            {t("hub.connectNetworks")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Audiences Widget */}
                <Card className="overflow-hidden border shadow-sm">
                  <CardHeader className="bg-secondary/5 border-b">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-5 h-5 text-secondary" />
                      {t("hub.yourAudiences")}
                    </CardTitle>
                    <CardDescription>{t("hub.audiencesDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <AudienceHighlightsWidget userId={userId || undefined} />
                  </CardContent>
                </Card>
              </div>

              {/* Instagram Community Manager */}
              {socialConnections.instagram && (
                <InstagramCommunityManager profile={profile} />
              )}

              {/* Quick Actions */}
              <Card className="overflow-hidden border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Rocket className="w-5 h-5 text-primary" />
                    {t("hub.quickActions")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button onClick={() => handleTabChange('create')} className="h-auto py-4 flex-col gap-2">
                      <PenTool className="w-5 h-5" />
                      <span className="text-sm">{t("hub.createContent")}</span>
                    </Button>
                    <Button onClick={() => handleTabChange('campaigns')} variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Target className="w-5 h-5" />
                      <span className="text-sm">{t("hub.newCampaign")}</span>
                    </Button>
                    <Button onClick={() => handleTabChange('calendar')} variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm">{t("hub.viewCalendar")}</span>
                    </Button>
                    <Button onClick={() => handleTabChange('autopilot')} variant="outline" className="h-auto py-4 flex-col gap-2 border-primary/30 hover:bg-primary/5">
                      <Brain className="w-5 h-5 text-primary" />
                      <span className="text-sm">{t("hub.tabs.autopilot")}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {dashboardSubTab === 'library' && (
            <UnifiedLibrary profile={profile} />
          )}

          {dashboardSubTab === 'reports' && (
            <ReportBuilder profile={profile} companyId={profile?.company_id} />
          )}
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6">
          <CrearContentHub
            profile={profile}
            selectedPlatform={selectedPlatform}
            onNavigateTab={handleTabChange}
          />
        </TabsContent>

        {/* Autopilot Tab with sub-navigation */}
        <TabsContent value="autopilot" className="space-y-6">
          <AutopilotSubNav activeSubTab={autopilotSubTab} onSubTabChange={setAutopilotSubTab} />
          
          {autopilotSubTab === 'status' && (
            <AutopilotDashboard companyId={profile?.company_id} profile={profile} />
          )}
          {autopilotSubTab === 'automation' && (
            <SocialAutomationRules companyId={profile?.company_id} />
          )}
          {autopilotSubTab === 'approvals' && (
            <ContentApprovalPanel companyId={profile?.company_id} />
          )}
          {autopilotSubTab === 'listening' && (
            <SocialListeningPanel profile={profile} companyId={profile?.company_id} />
          )}
          {autopilotSubTab === 'attribution' && (
            <UTMDashboard companyId={profile?.company_id} />
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <CampaignDashboard />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <ContentCalendar profile={profile} />
        </TabsContent>
      </Tabs>

      {/* Social Connection Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={(open) => {
        setShowConnectDialog(open);
        if (!open) loadConnections();
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("hub.connectNetworksTitle", "Conectar Redes Sociales")}</DialogTitle>
            <DialogDescription>{t("hub.connectNetworksDesc", "Conecta tus redes sociales para publicar contenido y analizar métricas.")}</DialogDescription>
          </DialogHeader>
          <SocialConnectionManager 
            profile={profile} 
            onConnectionsUpdated={() => {
              loadConnections();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Social Data Import Dialog */}
      {userId && (
        <SocialDataImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          userId={userId}
          companyId={profile?.company_id || ''}
          onSuccess={() => {
            initializeMarketingHub();
          }}
        />
      )}
    </div>
  );
};

export default MarketingHubWow;
