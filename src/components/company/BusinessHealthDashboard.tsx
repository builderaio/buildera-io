import { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Minus, Target, Zap, Bot,
  ArrowRight, Sparkles, Clock, CheckCircle2, XCircle, Loader2,
  BarChart3, Users, MessageSquare, ShoppingCart, RefreshCw, Brain,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlatformAgents, PlatformAgent } from "@/hooks/usePlatformAgents";
import { useCompanyCredits } from "@/hooks/useCompanyCredits";
import { useCompanyState } from "@/hooks/useCompanyState";
import { useNextBestAction } from "@/hooks/useNextBestAction";
import { useBusinessHealth, BusinessHealthKPI, ObjectiveProgress } from "@/hooks/useBusinessHealth";
import { useDepartmentUnlocking } from "@/hooks/useDepartmentUnlocking";
import { AgentInteractionPanel } from "@/components/agents/AgentInteractionPanel";
import { EnterpriseAutopilotWelcome } from "@/components/company/EnterpriseAutopilotWelcome";
import { cn } from "@/lib/utils";

interface BusinessHealthDashboardProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

// KPI Card Component
const KPICard = ({ kpi, icon: Icon }: { kpi: BusinessHealthKPI; icon: React.ElementType }) => {
  const { t } = useTranslation(['common']);
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus;
  const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{kpi.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold">
                {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
              </span>
              {kpi.unit && <span className="text-sm text-muted-foreground">{kpi.unit}</span>}
            </div>
          </div>
          <div className={cn(
            "p-2 sm:p-2.5 rounded-xl",
            kpi.trend === 'up' ? 'bg-emerald-500/10' : kpi.trend === 'down' ? 'bg-destructive/10' : 'bg-muted'
          )}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
        </div>
        
        {kpi.trendPercentage > 0 && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span>{kpi.trendPercentage}% {t('common:dashboard.vsPreviousMonth', 'vs. previous month')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Objective Progress Card
const ObjectiveCard = ({ objective }: { objective: ObjectiveProgress }) => {
  const { t } = useTranslation(['common']);
  const trendColor = objective.trend === 'improving' 
    ? 'bg-emerald-500' 
    : objective.trend === 'declining' 
      ? 'bg-destructive' 
      : 'bg-amber-500';

  return (
    <div className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{objective.title}</h4>
          {objective.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {objective.description}
            </p>
          )}
        </div>
        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", trendColor)} />
      </div>
      
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('common:dashboard.progress', 'Progress')}</span>
          <span className="font-medium">{Math.round(objective.progress)}%</span>
        </div>
        <Progress value={objective.progress} className="h-1.5" />
      </div>
    </div>
  );
};

// Activity Item
interface ActivityLog {
  id: string;
  created_at: string;
  status: string;
  output_summary: string | null;
  error_message: string | null;
  credits_consumed: number;
  platform_agents: { name: string; icon: string | null } | null;
}

const ActivityItem = ({ activity }: { activity: ActivityLog }) => {
  const { t } = useTranslation(['common']);
  const StatusIcon = activity.status === 'completed' 
    ? CheckCircle2 
    : activity.status === 'failed' 
      ? XCircle 
      : activity.status === 'running'
        ? Loader2
        : Clock;

  const statusColor = activity.status === 'completed' 
    ? 'text-emerald-500' 
    : activity.status === 'failed' 
      ? 'text-destructive' 
      : activity.status === 'running'
        ? 'text-primary animate-spin'
        : 'text-amber-500';

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return t('common:time.now');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <StatusIcon className={cn("w-4 h-4 shrink-0", statusColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {activity.platform_agents?.name || t('common:agent')}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimeAgo(activity.created_at)} • {activity.credits_consumed} cr
        </p>
      </div>
    </div>
  );
};

// Enterprise Autopilot Status Card
const EnterpriseAutopilotStatusCard = ({ companyId, departments, onNavigate }: { companyId: string; departments: any[]; onNavigate: (view: string) => void }) => {
  const { t } = useTranslation(['common']);
  const [lastExecution, setLastExecution] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('autopilot_execution_log')
        .select('status, phase, credits_consumed, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastExecution(data);
    };
    fetchData();
  }, [companyId]);

  const activeDepts = departments.filter(d => d.autopilot_enabled).length;
  const totalDepts = departments.length;
  const hasActive = activeDepts > 0;

  return (
    <Card className={cn(
      "border overflow-hidden",
      hasActive ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent" : "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
    )}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            hasActive ? "bg-emerald-500/10" : "bg-primary/10"
          )}>
            <Brain className={cn("w-5 h-5", hasActive ? "text-emerald-500" : "text-primary")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{t('common:enterprise.autopilot.title')}</h3>
              <Badge variant={hasActive ? "default" : "secondary"} className={cn(
                "text-[10px]",
                hasActive ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : ""
              )}>
                {activeDepts}/{totalDepts} {t('common:enterprise.departments.marketing') ? '' : ''}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasActive 
                ? `${activeDepts} ${t('common:enterprise.departments.marketing', 'dept').replace(/Marketing/i, t('common:enterprise.autopilot.actions_short', 'departments'))} ${t('common:enterprise.autopilot_active', 'active')}`
                : t('common:enterprise.autopilot.subtitle')}
            </p>
            {lastExecution && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {t('common:dashboard.last', 'Last')}: {lastExecution.status} • {lastExecution.credits_consumed} cr
              </p>
            )}
          </div>
          <Button 
            size="sm" 
            variant={hasActive ? "outline" : "default"}
            onClick={() => onNavigate('autopilot')}
            className="shrink-0"
          >
            {hasActive ? t('common:actions.view') : t('common:dashboard.activate', 'Activate')}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
const BusinessHealthDashboard = ({ profile, onNavigate }: BusinessHealthDashboardProps) => {
  const { t, i18n } = useTranslation(['common', 'company']);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgent | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [primaryObjective, setPrimaryObjective] = useState<string | null>(null);

  const { agents, enabledAgents: enabledAgentIds } = usePlatformAgents(companyId || undefined);
  const { availableCredits, refetch: refetchCredits } = useCompanyCredits(companyId || undefined, profile?.user_id);
  const companyState = useCompanyState(companyId || undefined, profile?.user_id);
  const businessHealth = useBusinessHealth(companyId || undefined);
  const { departments: deptConfigs } = useDepartmentUnlocking(companyId, companyState.maturityLevel);
  
  const enabledAgentsList = agents.filter(agent => enabledAgentIds.includes(agent.id));
  
  const nextBestActions = useNextBestAction({
    companyState,
    availableCredits,
    enabledAgentsCount: enabledAgentIds.length,
    totalAgentsCount: agents.length,
  });

  useEffect(() => {
    if (profile?.user_id) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [profile?.user_id]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', profile.user_id)
        .maybeSingle();
      
      setCompanyId(company?.id || null);

      if (company?.id) {
        const [usageLogs, objectivesData] = await Promise.all([
          supabase
            .from('agent_usage_log')
            .select(`
              id, created_at, status, output_summary, error_message, credits_consumed,
              platform_agents(name, icon)
            `)
            .eq('company_id', company.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('company_objectives')
            .select('title')
            .eq('company_id', company.id)
            .eq('priority', 1)
            .maybeSingle(),
        ]);

        setRecentActivity((usageLogs.data as ActivityLog[]) || []);
        setPrimaryObjective(objectivesData.data?.[0]?.title || null);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view?: string, agentId?: string) => {
    if (agentId) {
      const agent = agents.find(a => a.internal_code === agentId);
      if (agent) {
        setSelectedAgent(agent);
        setAgentPanelOpen(true);
        return;
      }
    }
    
    if (view) {
      if (onNavigate) {
        onNavigate(view);
      } else {
        navigate(`/company-dashboard?view=${view}`);
      }
    }
  };

  const handleAgentClick = (agent: PlatformAgent) => {
    setSelectedAgent(agent);
    setAgentPanelOpen(true);
  };

  const formatLocalizedDate = (language: string): string => {
    const localeMap: Record<string, string> = { es: 'es-ES', en: 'en-US', pt: 'pt-BR' };
    return new Date().toLocaleDateString(localeMap[language] || 'en-US', { 
      weekday: 'long', day: 'numeric', month: 'long' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t('common:status.loading')}</p>
        </div>
      </div>
    );
  }

  const userName = profile?.full_name?.split(' ')[0] || "Usuario";
  const featuredAction = nextBestActions[0];
  const topAgents = enabledAgentsList.slice(0, 4);

  // Detect new user with no activity
  const isNewUser = recentActivity.length === 0 
    && enabledAgentIds.length === 0 
    && !deptConfigs.some(d => d.autopilot_enabled);

  if (isNewUser) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-8">
        {/* Header */}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">
            {t('common:mando.hello', { name: userName })} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatLocalizedDate(i18n.language)}
          </p>
        </div>

        {/* Hero activation card */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold mb-1">
                  {t('common:activationWizard.heroTitle', '¡Tu negocio está listo para crecer!')}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('common:activationWizard.heroDesc', 'Completa estos pasos para activar la automatización y que Buildera trabaje por ti.')}
                </p>
                <Button onClick={() => handleNavigate('activation-wizard')}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('common:activationWizard.startActivation', 'Comenzar Activación')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activation Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {t('common:activationWizard.checklist', 'Pasos para activar tu negocio')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { step: 1, label: t('common:activationWizard.step1Title', 'Conecta tus redes sociales'), done: false },
              { step: 2, label: t('common:activationWizard.step2Title', 'Configura tu marca'), done: false },
              { step: 3, label: t('common:activationWizard.step3Title', 'Activa tu primer departamento'), done: false },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => handleNavigate('activation-wizard')}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  item.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Featured Recommendation if available */}
        {featuredAction && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {t('common:dashboard.featuredRecommendation', 'Featured Recommendation')}
                  </Badge>
                  <h3 className="font-semibold text-sm sm:text-base">{featuredAction.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {featuredAction.description}
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={() => handleNavigate(featuredAction.action.view, featuredAction.action.agentId)}
                  >
                    {featuredAction.action.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header with context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">
            {t('common:mando.hello', { name: userName })} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {formatLocalizedDate(i18n.language)}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="h-7 px-2.5 gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" />
            {enabledAgentIds.length} {t('common:mando.agents')}
          </Badge>
          <Badge variant="outline" className="h-7 px-2.5 gap-1.5 text-xs bg-amber-500/10 border-amber-500/30 text-amber-600">
            <Zap className="w-3.5 h-3.5" />
            {availableCredits} {t('common:credits')}
          </Badge>
        </div>
      </div>

      {/* Enterprise Autopilot Status Card */}
      {companyId && (
        <EnterpriseAutopilotStatusCard companyId={companyId} departments={deptConfigs} onNavigate={handleNavigate} />
      )}

      {/* Enterprise Welcome (show once when departments exist but none active) */}
      {companyId && deptConfigs.length > 0 && !deptConfigs.some(d => d.autopilot_enabled) && (
        <EnterpriseAutopilotWelcome unlockedDepartments={deptConfigs.map(d => d.department)} />
      )}

      {/* Primary Objective Banner */}
      {primaryObjective && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Target className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">{t('common:dashboard.strategicObjective', 'Strategic Objective')}:</span>
              <p className="text-sm font-medium truncate">{primaryObjective}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="shrink-0"
              onClick={() => handleNavigate('negocio')}
            >
              {t('common:actions.edit')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard kpi={businessHealth.kpis.efficiency} icon={BarChart3} />
        <KPICard kpi={businessHealth.kpis.reach} icon={Users} />
        <KPICard kpi={businessHealth.kpis.engagement} icon={MessageSquare} />
        <KPICard kpi={businessHealth.kpis.conversions} icon={ShoppingCart} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Objectives & Recommendations */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Objectives Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t('common:dashboard.objectiveProgress', 'Objective Progress')}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleNavigate('negocio')}
                >
                  {t('common:mando.viewAll')}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {businessHealth.objectives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businessHealth.objectives.slice(0, 4).map((obj) => (
                    <ObjectiveCard key={obj.id} objective={obj} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('common:dashboard.noObjectives', 'No objectives defined')}
                  </p>
                  <Button size="sm" onClick={() => handleNavigate('negocio')}>
                    {t('common:dashboard.defineObjectives', 'Define Objectives')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Featured Recommendation */}
          {featuredAction && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {t('common:dashboard.featuredRecommendation', 'Featured Recommendation')}
                    </Badge>
                    <h3 className="font-semibold text-sm sm:text-base">{featuredAction.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {featuredAction.description}
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3"
                      onClick={() => handleNavigate(featuredAction.action.view, featuredAction.action.agentId)}
                    >
                      {featuredAction.action.label}
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Agents */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  {t('common:mando.quickAgents')}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => handleNavigate('agentes')}
                >
                  {t('common:mando.viewAll')}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {topAgents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant="outline"
                    className="h-auto flex-col py-3 px-2 gap-2 hover:bg-primary/5 hover:border-primary/30"
                    onClick={() => handleAgentClick(agent)}
                  >
                    <span className="text-xl">{agent.icon || '🤖'}</span>
                    <span className="text-xs font-medium text-center line-clamp-1">
                      {agent.name}
                    </span>
                  </Button>
                ))}
                {topAgents.length === 0 && (
                  <div className="col-span-full text-center py-6">
                    <Bot className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('common:mando.noActiveAgents')}</p>
                    <Button 
                      size="sm" 
                      variant="link"
                      onClick={() => handleNavigate('agentes')}
                    >
                      {t('common:mando.exploreMarketplace')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('common:mando.recentActivity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('common:mando.noRecentActivity')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Health Score */}
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-5">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">{t('common:dashboard.healthScore', 'Health Score')}</p>
                <div className="text-4xl font-bold text-primary mb-1">
                  {businessHealth.overallScore}
                </div>
                <p className="text-xs text-muted-foreground">{t('common:dashboard.outOf100', 'out of 100')}</p>
              </div>
              <Progress value={businessHealth.overallScore} className="mt-4 h-2" />
              <Button 
                variant="secondary" 
                className="w-full mt-4" 
                size="sm"
                onClick={() => handleNavigate('inteligencia')}
              >
                {t('common:dashboard.viewDiagnostic', 'View Full Diagnostic')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Agent Interaction Panel */}
      <AgentInteractionPanel
        agent={selectedAgent}
        isOpen={agentPanelOpen}
        onClose={() => {
          setAgentPanelOpen(false);
          setSelectedAgent(null);
        }}
        isEnabled={true}
        creditsAvailable={availableCredits}
        companyId={companyId || undefined}
        userId={profile?.user_id}
        onExecutionComplete={() => {
          refetchCredits();
          loadDashboardData();
          businessHealth.refresh();
        }}
      />
    </div>
  );
};

export default BusinessHealthDashboard;
