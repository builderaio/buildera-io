import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Zap, Shield, BookOpen, Eye, Settings, Play, Pause,
  CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp,
  Activity, BarChart3, RefreshCw, Link2, Upload, Loader2,
  Instagram, Linkedin, Facebook, Music2, Download
} from "lucide-react";

interface AutopilotDashboardProps {
  companyId?: string;
  profile?: any;
}

interface AutopilotConfig {
  id?: string;
  company_id: string;
  autopilot_enabled: boolean;
  execution_frequency: string;
  max_posts_per_day: number;
  max_credits_per_cycle: number;
  require_human_approval: boolean;
  allowed_actions: string[];
  brand_guardrails: any;
  active_hours: any;
  last_execution_at: string | null;
  total_cycles_run: number;
}

interface ExecutionLog {
  id: string;
  cycle_id: string;
  phase: string;
  status: string;
  decisions_made: any[];
  actions_taken: any[];
  content_generated: number;
  content_approved: number;
  content_rejected: number;
  content_pending_review: number;
  credits_consumed: number;
  execution_time_ms: number;
  error_message: string | null;
  created_at: string;
}

interface Decision {
  id: string;
  decision_type: string;
  priority: string;
  description: string;
  reasoning: string;
  guardrail_result: string;
  action_taken: boolean;
  expected_impact: any;
  actual_impact: any;
  created_at: string;
}

const PHASE_ICONS: Record<string, React.ComponentType<any>> = {
  sense: Eye,
  think: Brain,
  act: Zap,
  guard: Shield,
  learn: BookOpen,
};

const PHASE_COLORS: Record<string, string> = {
  sense: 'text-blue-500',
  think: 'text-purple-500',
  act: 'text-orange-500',
  guard: 'text-green-500',
  learn: 'text-cyan-500',
};

export function AutopilotDashboard({ companyId, profile }: AutopilotDashboardProps) {
  const { t } = useTranslation('marketing');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const [configRes, logsRes, decisionsRes] = await Promise.all([
        supabase.from('company_autopilot_config').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('autopilot_execution_log').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(50),
        supabase.from('autopilot_decisions').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
      ]);

      if (configRes.data) {
        setConfig(configRes.data as any);
      }
      setLogs((logsRes.data || []) as any);
      setDecisions((decisionsRes.data || []) as any);
    } catch (error) {
      console.error('Error loading autopilot data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveConfig = async (updates: Partial<AutopilotConfig>) => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newConfig = { ...config, ...updates, company_id: companyId, user_id: user.id };

      if (config?.id) {
        await supabase.from('company_autopilot_config').update(newConfig as any).eq('id', config.id);
      } else {
        const { data } = await supabase.from('company_autopilot_config').insert(newConfig as any).select().single();
        if (data) setConfig(data as any);
      }
      setConfig(prev => prev ? { ...prev, ...updates } : null);
      toast({ title: t('autopilot.configSaved') });
    } catch (error) {
      toast({ title: t('autopilot.configError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const [showPrereqDialog, setShowPrereqDialog] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<{id: string; platform: string; username?: string}[]>([]);
  const [importingPlatforms, setImportingPlatforms] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
  const [bootstrapProgress, setBootstrapProgress] = useState(0);

  const PLATFORM_SCRAPERS: Record<string, {scraper: string; icon: React.ComponentType<any>; name: string}> = {
    instagram: { scraper: 'instagram-scraper', icon: Instagram, name: 'Instagram' },
    linkedin: { scraper: 'linkedin-scraper', icon: Linkedin, name: 'LinkedIn' },
    facebook: { scraper: 'facebook-scraper', icon: Facebook, name: 'Facebook' },
    tiktok: { scraper: 'tiktok-scraper', icon: Music2, name: 'TikTok' },
  };

  const checkMarketingPrerequisites = async (): Promise<boolean> => {
    if (!companyId) return false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const [socialRes, igCount, liCount, fbCount, tkCount] = await Promise.all([
        supabase.from('social_accounts').select('id, platform').eq('user_id', user.id).eq('is_connected', true),
        supabase.from('instagram_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('linkedin_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('facebook_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('tiktok_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      const realAccounts = (socialRes.data || []).filter((a: any) => a.platform !== 'upload_post_profile');
      setConnectedAccounts(realAccounts);
      const totalPosts = (igCount.count || 0) + (liCount.count || 0) + (fbCount.count || 0) + (tkCount.count || 0);

      return realAccounts.length > 0 && totalPosts >= 5;
    } catch {
      return false;
    }
  };

  const handleBootstrapImport = async (platform: string) => {
    const scraperInfo = PLATFORM_SCRAPERS[platform];
    if (!scraperInfo) return;

    setImportingPlatforms(prev => ({ ...prev, [platform]: 'loading' }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke(scraperInfo.scraper, {
        body: {
          user_id: user.id,
          company_id: companyId,
        }
      });

      if (error) throw error;

      setImportingPlatforms(prev => ({ ...prev, [platform]: 'success' }));
      
      // Update progress
      const statuses = { ...importingPlatforms, [platform]: 'success' };
      const total = connectedAccounts.length;
      const done = Object.values(statuses).filter(s => s === 'success').length;
      setBootstrapProgress(Math.round((done / total) * 100));

      toast({
        title: t('autopilot.bootstrap.importSuccess', { platform: scraperInfo.name }),
        description: `${data?.posts_count || data?.posts?.length || 0} posts importados`,
      });

      // Check if all done → auto-activate
      if (done >= total) {
        setTimeout(async () => {
          const hasPrereqs = await checkMarketingPrerequisites();
          if (hasPrereqs) {
            setShowPrereqDialog(false);
            await toggleAutopilotAfterBootstrap();
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error(`Error importing from ${platform}:`, err);
      setImportingPlatforms(prev => ({ ...prev, [platform]: 'error' }));
      toast({
        title: t('autopilot.bootstrap.importError', { platform: scraperInfo.name }),
        variant: 'destructive',
      });
    }
  };

  const handleImportAll = async () => {
    for (const account of connectedAccounts) {
      const platform = account.platform;
      if (PLATFORM_SCRAPERS[platform] && importingPlatforms[platform] !== 'success') {
        await handleBootstrapImport(platform);
      }
    }
  };

  const toggleAutopilotAfterBootstrap = async () => {
    if (!config?.id) {
      // First-time smart config
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !companyId) return;
        await saveConfig({
          autopilot_enabled: true,
          require_human_approval: true,
          execution_frequency: '6h',
          max_posts_per_day: 3,
          max_credits_per_cycle: 50,
        });
        toast({
          title: t('autopilot.smartConfigApplied'),
          description: t('autopilot.bootstrap.autoActivated'),
        });
      } catch (e) {
        console.error('Error auto-activating after bootstrap:', e);
      }
    } else {
      await saveConfig({ autopilot_enabled: true });
    }
  };

  const toggleAutopilot = async () => {
    const newState = !config?.autopilot_enabled;
    
    // When activating, check prerequisites first
    if (newState) {
      const hasPrereqs = await checkMarketingPrerequisites();
      if (!hasPrereqs) {
        setShowPrereqDialog(true);
        return;
      }
    }

    // Smart pre-configuration when activating for the first time
    if (newState && !config?.id) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !companyId) return;

        const [commRes, brandRes, socialRes, companyRes] = await Promise.all([
          supabase.from('company_communication_settings').select('forbidden_words, language_formality, approved_slogans, tone_by_platform, topics_to_avoid').eq('company_id', companyId).maybeSingle(),
          supabase.from('company_branding').select('brand_voice').eq('company_id', companyId).maybeSingle(),
          supabase.from('social_accounts').select('id').eq('user_id', user.id).eq('is_connected', true),
          supabase.from('companies').select('country').eq('id', companyId).single(),
        ]);

        const brandGuardrails: any = {};
        if (commRes.data?.forbidden_words) brandGuardrails.forbidden_words = commRes.data.forbidden_words;
        if (commRes.data?.language_formality) brandGuardrails.tone = commRes.data.language_formality;
        if (commRes.data?.approved_slogans) brandGuardrails.approved_slogans = commRes.data.approved_slogans;
        if (commRes.data?.tone_by_platform) brandGuardrails.tone_by_platform = commRes.data.tone_by_platform;
        if (commRes.data?.topics_to_avoid) brandGuardrails.topics_to_avoid = commRes.data.topics_to_avoid;
        if (brandRes.data?.brand_voice) brandGuardrails.brand_voice = brandRes.data.brand_voice;

        const hasSocial = (socialRes.data?.length || 0) > 0;
        const allowedActions = hasSocial 
          ? ['create_content', 'publish', 'reply_comments', 'adjust_campaigns']
          : ['create_content'];

        const activeHours = { start: '09:00', end: '21:00' };

        await saveConfig({
          autopilot_enabled: true,
          require_human_approval: true,
          brand_guardrails: Object.keys(brandGuardrails).length > 0 ? brandGuardrails : null,
          allowed_actions: allowedActions,
          active_hours: activeHours,
          execution_frequency: '6h',
          max_posts_per_day: 3,
          max_credits_per_cycle: 50,
        });

        toast({ 
          title: t('autopilot.smartConfigApplied'),
          description: t('autopilot.smartConfigDesc'),
        });
        return;
      } catch (error) {
        console.error('Error applying smart config:', error);
      }
    }
    
    await saveConfig({ autopilot_enabled: newState });
  };

  const runManualCycle = async () => {
    if (!companyId) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-autopilot-engine', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      toast({ title: t('autopilot.cycleComplete'), description: `${data.results?.[0]?.total_decisions || 0} ${t('autopilot.decisionsGenerated')}` });
      await loadData();
    } catch (error) {
      toast({ title: t('autopilot.cycleError'), variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  // Group logs by cycle
  const cycleGroups = logs.reduce((acc, log) => {
    if (!acc[log.cycle_id]) acc[log.cycle_id] = [];
    acc[log.cycle_id].push(log);
    return acc;
  }, {} as Record<string, ExecutionLog[]>);

  const recentCycles = Object.entries(cycleGroups).slice(0, 10);

  // Stats
  const totalDecisions = decisions.length;
  const passedDecisions = decisions.filter(d => d.guardrail_result === 'passed').length;
  const blockedDecisions = decisions.filter(d => d.guardrail_result === 'blocked').length;
  const pendingDecisions = decisions.filter(d => d.guardrail_result === 'sent_to_approval').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#3c46b2] to-[#5a63d4] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8" />
              <div>
                <CardTitle className="text-xl">{t('autopilot.title')}</CardTitle>
                <CardDescription className="text-blue-100">{t('autopilot.subtitle')}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={runManualCycle}
                disabled={running}
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {running ? t('autopilot.running') : t('autopilot.runNow')}
              </Button>
              <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                <Switch
                  checked={config?.autopilot_enabled || false}
                  onCheckedChange={toggleAutopilot}
                  disabled={saving}
                />
                <span className="text-sm font-medium">
                  {config?.autopilot_enabled ? t('autopilot.active') : t('autopilot.inactive')}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100"><Activity className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold">{config?.total_cycles_run || 0}</p>
              <p className="text-xs text-muted-foreground">{t('autopilot.totalCycles')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{passedDecisions}</p>
              <p className="text-xs text-muted-foreground">{t('autopilot.approved')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100"><XCircle className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold">{blockedDecisions}</p>
              <p className="text-xs text-muted-foreground">{t('autopilot.blocked')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100"><Clock className="w-5 h-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingDecisions}</p>
              <p className="text-xs text-muted-foreground">{t('autopilot.pendingReview')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList>
          <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" />{t('autopilot.overview')}</TabsTrigger>
          <TabsTrigger value="timeline"><Activity className="w-4 h-4 mr-1" />{t('autopilot.timeline')}</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />{t('autopilot.settings')}</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('autopilot.recentDecisions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {decisions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('autopilot.noDecisions')}</p>
                ) : (
                  <div className="space-y-3">
                    {decisions.slice(0, 20).map(decision => (
                      <div key={decision.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={
                                decision.priority === 'critical' ? 'destructive' :
                                decision.priority === 'high' ? 'default' : 'secondary'
                              } className="text-xs">
                                {decision.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{decision.decision_type}</Badge>
                              {decision.guardrail_result && (
                                <Badge className={`text-xs ${
                                  decision.guardrail_result === 'passed' ? 'bg-green-100 text-green-700' :
                                  decision.guardrail_result === 'blocked' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {decision.guardrail_result === 'passed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                  {decision.guardrail_result === 'blocked' && <XCircle className="w-3 h-3 mr-1" />}
                                  {decision.guardrail_result === 'sent_to_approval' && <Clock className="w-3 h-3 mr-1" />}
                                  {decision.guardrail_result}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{decision.description}</p>
                            {decision.reasoning && (
                              <p className="text-xs text-muted-foreground mt-1">{decision.reasoning}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {new Date(decision.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('autopilot.executionTimeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {recentCycles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('autopilot.noCycles')}</p>
                ) : (
                  <div className="space-y-6">
                    {recentCycles.map(([cycleId, cycleLogs]) => {
                      const firstLog = cycleLogs[cycleLogs.length - 1];
                      const lastLog = cycleLogs[0];
                      return (
                        <div key={cycleId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium">
                              {t('autopilot.cycle')} {cycleId.substring(0, 8)}...
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(firstLog.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {['sense', 'think', 'guard', 'act', 'learn'].map(phase => {
                              const phaseLog = cycleLogs.find(l => l.phase === phase);
                              const Icon = PHASE_ICONS[phase] || Eye;
                              return (
                                <div key={phase} className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                                  phaseLog?.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  phaseLog?.status === 'failed' ? 'bg-red-100 text-red-700' :
                                  'bg-muted text-muted-foreground'
                                }`}>
                                  <Icon className="w-3 h-3" />
                                  {phase}
                                </div>
                              );
                            })}
                          </div>
                          {lastLog.execution_time_ms && (
                            <p className="text-xs text-muted-foreground mt-2">
                              ⏱️ {lastLog.execution_time_ms}ms
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('autopilot.frequency')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t('autopilot.executionFrequency')}</Label>
                  <Select
                    value={config?.execution_frequency || '6h'}
                    onValueChange={v => saveConfig({ execution_frequency: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">{t('autopilot.every1h')}</SelectItem>
                      <SelectItem value="2h">{t('autopilot.every2h')}</SelectItem>
                      <SelectItem value="6h">{t('autopilot.every6h')}</SelectItem>
                      <SelectItem value="12h">{t('autopilot.every12h')}</SelectItem>
                      <SelectItem value="24h">{t('autopilot.every24h')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('autopilot.maxPostsPerDay')}: {config?.max_posts_per_day || 3}</Label>
                  <Slider
                    value={[config?.max_posts_per_day || 3]}
                    onValueChange={([v]) => saveConfig({ max_posts_per_day: v })}
                    min={1} max={10} step={1}
                  />
                </div>
                <div>
                  <Label>{t('autopilot.maxCreditsPerCycle')}: {config?.max_credits_per_cycle || 50}</Label>
                  <Slider
                    value={[config?.max_credits_per_cycle || 50]}
                    onValueChange={([v]) => saveConfig({ max_credits_per_cycle: v })}
                    min={10} max={200} step={10}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('autopilot.guardrails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('autopilot.requireApproval')}</Label>
                  <Switch
                    checked={config?.require_human_approval ?? true}
                    onCheckedChange={v => saveConfig({ require_human_approval: v })}
                  />
                </div>
                <div>
                  <Label>{t('autopilot.activeHoursStart')}</Label>
                  <Input
                    type="time"
                    value={config?.active_hours?.start || '09:00'}
                    onChange={e => saveConfig({
                      active_hours: { ...config?.active_hours, start: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>{t('autopilot.activeHoursEnd')}</Label>
                  <Input
                    type="time"
                    value={config?.active_hours?.end || '21:00'}
                    onChange={e => saveConfig({
                      active_hours: { ...config?.active_hours, end: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bootstrap Dialog */}
      <Dialog open={showPrereqDialog} onOpenChange={setShowPrereqDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              {t('autopilot.bootstrap.title', 'Preparar datos para Autopilot')}
            </DialogTitle>
            <DialogDescription>
              {connectedAccounts.length > 0
                ? t('autopilot.bootstrap.descConnected', 'Importa tus publicaciones existentes para que el Autopilot pueda analizar y generar decisiones inteligentes.')
                : t('autopilot.bootstrap.descNoAccounts', 'Conecta al menos una red social para que el Autopilot pueda funcionar.')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {connectedAccounts.length > 0 && (
              <>
                {connectedAccounts.map(account => {
                  const scraperInfo = PLATFORM_SCRAPERS[account.platform];
                  if (!scraperInfo) return null;
                  const status = importingPlatforms[account.platform] || 'idle';
                  const Icon = scraperInfo.icon;
                  return (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm">{scraperInfo.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={status === 'success' ? 'outline' : 'default'}
                        disabled={status === 'loading' || status === 'success'}
                        onClick={() => handleBootstrapImport(account.platform)}
                      >
                        {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                        {status === 'success' && <CheckCircle className="w-4 h-4 text-green-600 mr-1" />}
                        {status === 'error' && <XCircle className="w-4 h-4 text-destructive mr-1" />}
                        {status === 'idle' && t('autopilot.bootstrap.import', 'Importar')}
                        {status === 'loading' && t('autopilot.bootstrap.importing', 'Importando...')}
                        {status === 'success' && t('autopilot.bootstrap.imported', 'Importado')}
                        {status === 'error' && t('autopilot.bootstrap.retry', 'Reintentar')}
                      </Button>
                    </div>
                  );
                })}

                {connectedAccounts.length > 1 && (
                  <Button className="w-full" onClick={handleImportAll} disabled={Object.values(importingPlatforms).some(s => s === 'loading')}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('autopilot.bootstrap.importAll', 'Importar todo')}
                  </Button>
                )}

                {bootstrapProgress > 0 && (
                  <Progress value={bootstrapProgress} className="h-2" />
                )}
              </>
            )}

            {/* Cold Start: Generate content with AI */}
            <div className="border-t pt-3 mt-1">
              <p className="text-sm text-muted-foreground mb-2">
                {t('autopilot.bootstrap.coldStartDesc', '¿Tu empresa es nueva y no tiene publicaciones? Genera tu primer contenido con IA.')}
              </p>
              <Button
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setShowPrereqDialog(false);
                  navigate('/company-dashboard?view=marketing-hub&tab=create');
                }}
              >
                <Zap className="w-4 h-4" />
                {t('autopilot.bootstrap.generateContent', 'Crear primer contenido con IA')}
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setShowPrereqDialog(false);
                navigate('/company-dashboard?view=marketing-hub&action=connect');
              }}
            >
              <Link2 className="w-4 h-4" />
              {connectedAccounts.length > 0
                ? t('autopilot.bootstrap.connectMore', 'Conectar más redes')
                : t('autopilot.prerequisites.connectNow')
              }
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPrereqDialog(false)}>
              {t('actions.cancel', 'Cancelar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
