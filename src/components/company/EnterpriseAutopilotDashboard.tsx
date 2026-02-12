import { useState, useEffect, useCallback } from "react";
import {
  Brain, Zap, Shield, Activity, Clock, ChevronRight,
  TrendingUp, Globe, Lightbulb, BookOpen, Unlock, ToggleLeft, ToggleRight,
  Building2, ShoppingCart, DollarSign, Scale, Users, Settings2,
  AlertTriangle, CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          .select('id, department, capability_code, capability_name, description, is_active, activated_at, required_maturity')
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

  const handleToggleAutopilot = async (dept: DepartmentType, enabled: boolean) => {
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
  const iqScore = Math.min(100, Math.round((totalCycles * 2 + totalLessons * 5 + activatedCaps * 10)));

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
      <Tabs defaultValue="intelligence" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
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
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{t('enterprise.autopilot.active')}</Badge>
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
    </div>
  );
};

export default EnterpriseAutopilotDashboard;
