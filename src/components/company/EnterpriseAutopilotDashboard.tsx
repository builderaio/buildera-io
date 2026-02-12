import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Zap, Shield, Activity, Clock, ChevronRight,
  TrendingUp, Globe, Lightbulb, BookOpen, Unlock, ToggleLeft, ToggleRight,
  Building2, ShoppingCart, DollarSign, Scale, Users, Settings2,
  AlertTriangle, CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw,
  Link2, Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useDepartmentUnlocking, DepartmentConfig, DepartmentType } from "@/hooks/useDepartmentUnlocking";
import { useCompanyState } from "@/hooks/useCompanyState";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EnterpriseAutopilotDashboardProps {
  profile: any;
  companyId: string | null;
}

const DEPT_ICONS: Record<DepartmentType, React.ElementType> = {
  marketing: TrendingUp,
  sales: ShoppingCart,
  finance: DollarSign,
  legal: Scale,
  hr: Users,
  operations: Settings2,
};

const DEPT_COLORS: Record<DepartmentType, string> = {
  marketing: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  sales: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  finance: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  legal: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
  hr: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
  operations: "from-orange-500/20 to-red-500/20 border-orange-500/30",
};

interface ExecutionLog {
  id: string;
  department: string;
  phase: string;
  status: string;
  created_at: string;
  execution_time_ms: number;
  content_generated: number;
  content_approved: number;
  content_rejected: number;
  error_message: string | null;
}

interface Capability {
  id: string;
  department: string;
  capability_code: string;
  capability_name: string;
  description: string | null;
  is_active: boolean;
  activated_at: string | null;
  required_maturity: string;
  status?: string;
  source?: string;
  auto_activate?: boolean;
  proposed_reason?: string;
  gap_evidence?: any;
  trial_expires_at?: string;
}

interface IntelSignal {
  id: string;
  source: string;
  data: any;
  structured_signals: any[];
  relevance_score: number;
  fetched_at: string;
}

interface MemoryEntry {
  id: string;
  department: string;
  decision_type: string;
  outcome_evaluation: string;
  outcome_score: number | null;
  lesson_learned: string | null;
  created_at: string;
}

const EnterpriseAutopilotDashboard = ({ profile, companyId }: EnterpriseAutopilotDashboardProps) => {
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const navigate = useNavigate();
  const companyState = useCompanyState(companyId || undefined, profile?.user_id);
  const {
    departments, loading: deptsLoading, toggleAutopilot,
    getLockedDepartments, isDepartmentUnlocked,
  } = useDepartmentUnlocking(companyId, companyState.maturityLevel);

  const [execLogs, setExecLogs] = useState<ExecutionLog[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [intelSignals, setIntelSignals] = useState<IntelSignal[]>([]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [runningDept, setRunningDept] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoadingData(true);
    try {
      const [logsRes, capsRes, intelRes, memRes] = await Promise.all([
        supabase.from('department_execution_log' as any)
          .select('id, department, phase, status, created_at, execution_time_ms, content_generated, content_approved, content_rejected, error_message')
          .eq('company_id', companyId).order('created_at', { ascending: false }).limit(30),
        supabase.from('autopilot_capabilities')
          .select('id, department, capability_code, capability_name, description, is_active, activated_at, required_maturity, status, source, auto_activate, proposed_reason, gap_evidence, trial_expires_at')
          .eq('company_id', companyId).order('department'),
        supabase.from('external_intelligence_cache')
          .select('id, source, data, structured_signals, relevance_score, fetched_at')
          .eq('company_id', companyId).order('fetched_at', { ascending: false }).limit(10),
        supabase.from('autopilot_memory')
          .select('id, department, decision_type, outcome_evaluation, outcome_score, lesson_learned, created_at')
          .eq('company_id', companyId).neq('outcome_evaluation', 'pending')
          .order('created_at', { ascending: false }).limit(15),
      ]);
      setExecLogs((logsRes.data || []) as unknown as ExecutionLog[]);
      setCapabilities((capsRes.data || []) as Capability[]);
      setIntelSignals((intelRes.data || []) as IntelSignal[]);
      setMemoryEntries((memRes.data || []) as MemoryEntry[]);
    } catch (err) {
      console.error('Error loading autopilot data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [companyId]);

  useEffect(() => { loadData(); }, [loadData]);

  const [prerequisiteDialogDept, setPrerequisiteDialogDept] = useState<string | null>(null);
  const [prerequisiteMessage, setPrerequisiteMessage] = useState<string>('');

  const checkDepartmentPrerequisites = async (dept: DepartmentType): Promise<boolean> => {
    if (!companyId || !profile?.user_id) return false;

    if (dept === 'marketing') {
      const [socialRes, igCount, liCount, fbCount, tkCount] = await Promise.all([
        supabase.from('social_accounts').select('id, platform').eq('user_id', profile.user_id).eq('is_connected', true),
        supabase.from('instagram_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('linkedin_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('facebook_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('tiktok_posts' as any).select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      const realAccounts = (socialRes.data || []).filter(a => a.platform !== 'upload_post_profile');
      const totalPosts = (igCount.count || 0) + (liCount.count || 0) + (fbCount.count || 0) + (tkCount.count || 0);
      if (realAccounts.length === 0 && totalPosts < 5) {
        setPrerequisiteMessage(t('enterprise.prerequisites.socialRequired'));
        return false;
      }
    }

    if (dept === 'sales') {
      const [deals, contacts] = await Promise.all([
        supabase.from('crm_deals').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      if ((deals.count || 0) === 0 && (contacts.count || 0) === 0) {
        setPrerequisiteMessage(t('enterprise.prerequisites.salesRequired'));
        return false;
      }
    }

    if (dept === 'finance') {
      const [usage, snapshots] = await Promise.all([
        supabase.from('agent_usage_log').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('business_health_snapshots').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);
      if ((usage.count || 0) === 0 && (snapshots.count || 0) === 0) {
        setPrerequisiteMessage(t('enterprise.prerequisites.financeRequired'));
        return false;
      }
    }

    if (dept === 'legal') {
      const { count } = await supabase.from('company_parameters')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).like('parameter_key', 'legal_%');
      if ((count || 0) === 0) {
        setPrerequisiteMessage(t('enterprise.prerequisites.legalRequired'));
        return false;
      }
    }

    if (dept === 'hr') {
      const { count } = await supabase.from('company_members')
        .select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) < 2) {
        setPrerequisiteMessage(t('enterprise.prerequisites.hrRequired'));
        return false;
      }
    }

    if (dept === 'operations') {
      const { count } = await supabase.from('ai_workforce_teams')
        .select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) === 0) {
        setPrerequisiteMessage(t('enterprise.prerequisites.operationsRequired'));
        return false;
      }
    }

    return true;
  };

  const handleToggleAutopilot = async (dept: DepartmentType, enabled: boolean) => {
    if (enabled) {
      const ok = await checkDepartmentPrerequisites(dept);
      if (!ok) {
        setPrerequisiteDialogDept(dept);
        return;
      }
    }
    const success = await toggleAutopilot(dept, enabled);
    if (success) {
      toast({
        title: enabled ? t('enterprise.autopilot_active') : t('enterprise.autopilot_inactive'),
        description: t('enterprise.departments.' + dept),
      });
    }
  };

  const handleRunCycle = async (dept: string) => {
    if (!companyId) return;
    setRunningDept(dept);
    try {
      const { data, error } = await supabase.functions.invoke('enterprise-autopilot-engine', {
        body: { company_id: companyId, department: dept },
      });
      if (error) throw error;
      toast({ title: t('enterprise.autopilot.cycleComplete'), description: `${dept}: ${data?.results?.[0]?.total_decisions || 0} ${t('enterprise.autopilot.decisions')}` });
      loadData();
    } catch (err) {
      toast({ title: t('common:errors.processingFailed'), variant: 'destructive' });
    } finally {
      setRunningDept(null);
    }
  };

  const lockedDepts = getLockedDepartments();
  const totalCycles = execLogs.filter(l => l.phase === 'act' && l.status === 'completed').length;
  const totalLessons = memoryEntries.length;
  const activatedCaps = capabilities.filter(c => c.is_active).length;
  const totalCaps = capabilities.length;
  const proposedCaps = capabilities.filter(c => (c as any).status === 'proposed' || (c as any).status === 'trial');
  const iqScore = Math.min(100, Math.round((totalCycles * 2 + totalLessons * 5 + activatedCaps * 10)));

  const handleActivateCapability = async (capId: string, mode: 'trial' | 'active') => {
    try {
      const { error } = await supabase.from('autopilot_capabilities')
        .update({ status: mode, is_active: mode === 'active' } as any)
        .eq('id', capId);
      if (error) throw error;
      toast({ title: mode === 'trial' ? t('enterprise.autopilot.genesis.trialStarted') : t('enterprise.autopilot.genesis.activated') });
      loadData();
    } catch {
      toast({ title: t('common:errors.processingFailed'), variant: 'destructive' });
    }
  };

  const handleRejectCapability = async (capId: string) => {
    try {
      const { error } = await supabase.from('autopilot_capabilities')
        .update({ status: 'deprecated', is_active: false } as any)
        .eq('id', capId);
      if (error) throw error;
      toast({ title: t('enterprise.autopilot.genesis.rejected') });
      loadData();
    } catch {
      toast({ title: t('common:errors.processingFailed'), variant: 'destructive' });
    }
  };

  if (deptsLoading || loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            {t('enterprise.autopilot.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('enterprise.autopilot.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="w-3 h-3" />
            IQ: {iqScore}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Activity className="w-3 h-3" />
            {totalCycles} {t('enterprise.autopilot.cycles')}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            {t('actions.refresh')}
          </Button>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => {
          const Icon = DEPT_ICONS[dept.department as DepartmentType];
          const colorClass = DEPT_COLORS[dept.department as DepartmentType];
          const deptLogs = execLogs.filter(l => l.department === dept.department && l.phase === 'act');
          const lastRun = deptLogs[0];
          const deptCaps = capabilities.filter(c => c.department === dept.department);
          const activeCaps = deptCaps.filter(c => c.is_active).length;
          
          return (
            <Card key={dept.id} className={cn("relative overflow-hidden border", `bg-gradient-to-br ${colorClass}`)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-background/80">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{t(`enterprise.departments.${dept.department}`)}</h3>
                      <p className="text-xs text-muted-foreground">
                        {activeCaps}/{deptCaps.length} {t('enterprise.autopilot.capabilities')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={dept.autopilot_enabled}
                    onCheckedChange={(v) => handleToggleAutopilot(dept.department as DepartmentType, v)}
                  />
                </div>

                {lastRun && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(lastRun.created_at).toLocaleDateString()}
                    {lastRun.content_generated > 0 && (
                      <Badge variant="secondary" className="text-[10px] ml-1 px-1 py-0">
                        {lastRun.content_generated} {t('enterprise.autopilot.actions_short')}
                      </Badge>
                    )}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  disabled={!!runningDept}
                  onClick={() => handleRunCycle(dept.department)}
                >
                  {runningDept === dept.department ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> {t('enterprise.autopilot.running')}</>
                  ) : (
                    <><Zap className="w-3 h-3 mr-1" /> {t('enterprise.autopilot.runCycle')}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {/* Locked departments */}
        {lockedDepts.map((def) => {
          const Icon = DEPT_ICONS[def.department];
          return (
            <Card key={def.department} className="relative overflow-hidden opacity-60 border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t(`enterprise.departments.${def.department}`)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('enterprise.requires_maturity', { level: t(`enterprise.maturity.${def.requiredLevel}`) })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Unlock className="w-3 h-3 mr-1" />
                  {t('enterprise.locked')}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs: Intelligence / Lessons / Capabilities */}
      <Tabs defaultValue={proposedCaps.length > 0 ? "suggested" : "intelligence"} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="suggested" className="text-xs relative">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {t('enterprise.autopilot.genesis.tab')}
            {proposedCaps.length > 0 && (
              <Badge className="ml-1 text-[9px] px-1 py-0 bg-destructive text-destructive-foreground">{proposedCaps.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="text-xs">
            <Globe className="w-3.5 h-3.5 mr-1" />
            {t('enterprise.autopilot.intelligence')}
          </TabsTrigger>
          <TabsTrigger value="lessons" className="text-xs">
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            {t('enterprise.autopilot.lessons')}
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="text-xs">
            <Lightbulb className="w-3.5 h-3.5 mr-1" />
            {t('enterprise.autopilot.capabilitiesTab')}
          </TabsTrigger>
        </TabsList>

        {/* Suggested Capabilities (Capability Genesis) */}
        <TabsContent value="suggested">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t('enterprise.autopilot.genesis.title')}
                {proposedCaps.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">{proposedCaps.length} {t('enterprise.autopilot.genesis.newLabel')}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposedCaps.length > 0 ? (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {proposedCaps.map((cap) => {
                      const Icon = DEPT_ICONS[cap.department as DepartmentType] || Settings2;
                      const isTrialCap = (cap as any).status === 'trial';
                      const gapEvidence = (cap as any).gap_evidence as any;
                      const evidenceCount = gapEvidence ? 
                        (gapEvidence.unmapped_agents?.length || 0) + (gapEvidence.recurring_blocks?.length || 0) +
                        (gapEvidence.unhandled_signals?.length || 0) + (gapEvidence.repeated_patterns?.length || 0) : 0;

                      return (
                        <div key={cap.id} className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">{cap.capability_name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{cap.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {(cap as any).source === 'ai_generated' && (
                                <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                  {t('enterprise.autopilot.genesis.aiSuggested')}
                                </Badge>
                              )}
                              {isTrialCap && (
                                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600">
                                  {t('enterprise.autopilot.genesis.trial')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {(cap as any).proposed_reason && (
                            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                              <span className="font-medium">{t('enterprise.autopilot.genesis.reason')}:</span> {(cap as any).proposed_reason}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {t(`enterprise.departments.${cap.department}`)}
                              </Badge>
                              {evidenceCount > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {evidenceCount} {t('enterprise.autopilot.genesis.evidencePoints')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!isTrialCap && (
                                <>
                                  <Button size="sm" variant="outline" className="text-xs h-7 px-2"
                                    onClick={() => handleActivateCapability(cap.id, 'trial')}>
                                    <Clock className="w-3 h-3 mr-1" />
                                    {t('enterprise.autopilot.genesis.startTrial')}
                                  </Button>
                                  <Button size="sm" className="text-xs h-7 px-2"
                                    onClick={() => handleActivateCapability(cap.id, 'active')}>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {t('enterprise.autopilot.genesis.activate')}
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                                onClick={() => handleRejectCapability(cap.id)}>
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('enterprise.autopilot.genesis.noSuggestions')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intelligence Feed */}
        <TabsContent value="intelligence">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                {t('enterprise.autopilot.intelligenceFeed')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {intelSignals.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {intelSignals.map((sig) => {
                      const signals = Array.isArray(sig.structured_signals) ? sig.structured_signals : [];
                      return (
                        <div key={sig.id} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs capitalize">{sig.source.replace('_', ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(sig.fetched_at).toLocaleDateString()}</span>
                          </div>
                          {signals.slice(0, 3).map((s: any, i: number) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">{s.title || s.summary || JSON.stringify(s)}</p>
                              {s.summary && s.title && <p className="text-xs text-muted-foreground">{s.summary}</p>}
                              {s.impact && (
                                <Badge variant={s.impact === 'high' ? 'destructive' : 'secondary'} className="text-[10px] mt-1">
                                  {s.impact}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('enterprise.autopilot.noIntelligence')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Learned */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {t('enterprise.autopilot.lessonsLearned')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memoryEntries.length > 0 ? (
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-2">
                    {memoryEntries.map((mem) => (
                      <div key={mem.id} className="p-3 rounded-lg border bg-card flex items-start gap-3">
                        {mem.outcome_evaluation === 'positive' ? (
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        ) : mem.outcome_evaluation === 'negative' ? (
                          <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Badge variant="outline" className="text-[10px]">{t(`enterprise.departments.${mem.department}`)}</Badge>
                            <span className="text-[10px] text-muted-foreground">{mem.decision_type}</span>
                          </div>
                          <p className="text-sm">{mem.lesson_learned || t('enterprise.autopilot.noLesson')}</p>
                          <span className="text-[10px] text-muted-foreground">{new Date(mem.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('enterprise.autopilot.noLessons')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Capabilities */}
        <TabsContent value="capabilities">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                {t('enterprise.autopilot.capabilitiesTitle')}
                <Badge variant="secondary" className="ml-auto text-xs">{activatedCaps}/{totalCaps}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Progress value={totalCaps > 0 ? (activatedCaps / totalCaps) * 100 : 0} className="h-2" />
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {capabilities.map((cap) => {
                    const Icon = DEPT_ICONS[cap.department as DepartmentType] || Settings2;
                    return (
                      <div key={cap.id} className={cn("p-3 rounded-lg border flex items-center gap-3", cap.is_active ? "bg-primary/5 border-primary/20" : "bg-muted/30")}>
                        <div className={cn("p-1.5 rounded-md", cap.is_active ? "bg-primary/10" : "bg-muted")}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cap.capability_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{cap.description}</p>
                        </div>
                        {cap.is_active ? (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            {(cap as any).status === 'trial' ? t('enterprise.autopilot.genesis.trial') : t('enterprise.autopilot.active')}
                          </Badge>
                        ) : (cap as any).status === 'deprecated' ? (
                          <Badge variant="outline" className="text-[10px] opacity-50">{t('enterprise.autopilot.genesis.deprecated')}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">{t('enterprise.autopilot.pending')}</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Execution Timeline */}
      {execLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t('enterprise.autopilot.executionTimeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1.5">
                {execLogs.slice(0, 20).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                    {log.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    )}
                    <Badge variant="outline" className="text-[10px] shrink-0">{t(`enterprise.departments.${log.department}`)}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{log.phase}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{log.execution_time_ms}ms</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Prerequisite Dialog */}
      <Dialog open={!!prerequisiteDialogDept} onOpenChange={() => setPrerequisiteDialogDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {t('enterprise.prerequisites.title')}
            </DialogTitle>
            <DialogDescription>{prerequisiteMessage}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {prerequisiteDialogDept === 'marketing' && (
              <>
                <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                  setPrerequisiteDialogDept(null);
                  navigate('/company-dashboard?view=configuracion&tab=canales');
                }}>
                  <Link2 className="w-4 h-4" />
                  {t('enterprise.prerequisites.connectNow')}
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                  setPrerequisiteDialogDept(null);
                  navigate('/company-dashboard?view=marketing');
                }}>
                  <Upload className="w-4 h-4" />
                  {t('enterprise.prerequisites.importData')}
                </Button>
              </>
            )}
            {prerequisiteDialogDept === 'sales' && (
              <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                setPrerequisiteDialogDept(null);
                navigate('/company-dashboard?view=crm');
              }}>
                <ShoppingCart className="w-4 h-4" />
                {t('enterprise.prerequisites.setupCRM')}
              </Button>
            )}
            {prerequisiteDialogDept === 'finance' && (
              <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                setPrerequisiteDialogDept(null);
                navigate('/company-dashboard?view=comando');
              }}>
                <DollarSign className="w-4 h-4" />
                {t('enterprise.prerequisites.financeRequired')}
              </Button>
            )}
            {prerequisiteDialogDept === 'hr' && (
              <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                setPrerequisiteDialogDept(null);
                navigate('/company-dashboard?view=adn-empresa');
              }}>
                <Users className="w-4 h-4" />
                {t('enterprise.prerequisites.hrRequired')}
              </Button>
            )}
            {prerequisiteDialogDept === 'legal' && (
              <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                setPrerequisiteDialogDept(null);
                navigate('/company-dashboard?view=adn-empresa');
              }}>
                <Scale className="w-4 h-4" />
                {t('enterprise.prerequisites.legalRequired')}
              </Button>
            )}
            {prerequisiteDialogDept === 'operations' && (
              <Button variant="default" className="w-full justify-start gap-2" onClick={() => {
                setPrerequisiteDialogDept(null);
                navigate('/company-dashboard?view=ai-workforce');
              }}>
                <Settings2 className="w-4 h-4" />
                {t('enterprise.prerequisites.operationsRequired')}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPrerequisiteDialogDept(null)}>
              {t('actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnterpriseAutopilotDashboard;
