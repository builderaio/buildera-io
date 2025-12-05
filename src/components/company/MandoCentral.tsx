import { useState, useEffect } from "react";
import { Bot, Zap, Store, ArrowRight, Clock, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePlatformAgents, PlatformAgent } from "@/hooks/usePlatformAgents";
import { useCompanyCredits } from "@/hooks/useCompanyCredits";
import { useCompanyState } from "@/hooks/useCompanyState";
import { useNextBestAction } from "@/hooks/useNextBestAction";
import { CompanyStateCard } from "./CompanyStateCard";
import { NextBestActionCard, RecommendationsList } from "./NextBestActionCard";
import { QuickAgentsGrid } from "./QuickAgentsGrid";
import { AgentInteractionPanel } from "@/components/agents/AgentInteractionPanel";

interface MandoCentralProps {
  profile: any;
  onNavigate?: (view: string) => void;
}

interface ActivityLog {
  id: string;
  created_at: string;
  status: string;
  output_summary: string | null;
  error_message: string | null;
  credits_consumed: number;
  platform_agents: {
    name: string;
    icon: string | null;
  } | null;
}

// Helper: Format relative time
const formatTimeAgo = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return t('time.now', 'Ahora');
  if (diffMins < 60) return t('time.minutesAgo', 'Hace {{count}} min', { count: diffMins });
  if (diffHours < 24) return t('time.hoursAgo', 'Hace {{count}}h', { count: diffHours });
  return t('time.daysAgo', 'Hace {{count}}d', { count: diffDays });
};

// Helper: Get contextual activity message
const getActivityMessage = (activity: ActivityLog, t: any): string => {
  const agentName = activity.platform_agents?.name || t('common:agent', 'Agente');
  
  switch (activity.status) {
    case 'running':
      return t('activity.running', '{{agent}} ejecutando...', { agent: agentName });
    case 'completed':
      return activity.output_summary || t('activity.completed', '{{agent}} completado', { agent: agentName });
    case 'failed':
      return activity.error_message 
        ? t('activity.failedWithError', 'Error: {{error}}', { error: activity.error_message })
        : t('activity.failed', 'Falló: {{agent}}', { agent: agentName });
    case 'pending':
      return t('activity.pending', '{{agent}} en cola', { agent: agentName });
    default:
      return agentName;
  }
};

// Helper: Get status icon component
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-destructive shrink-0" />;
    case 'running':
      return <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-amber-500 shrink-0" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground shrink-0" />;
  }
};

// Helper: Get status badge variant
const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Helper: Get status badge label
const getStatusBadgeLabel = (status: string, t: any): string => {
  switch (status) {
    case 'completed':
      return '✓';
    case 'failed':
      return '✗';
    case 'running':
      return '...';
    case 'pending':
      return '◷';
    default:
      return '?';
  }
};

const MandoCentral = ({ profile, onNavigate }: MandoCentralProps) => {
  const { t } = useTranslation(['common', 'company']);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgent | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const navigate = useNavigate();
  
  const { agents, enabledAgents: enabledAgentIds } = usePlatformAgents(companyId || undefined);
  const { totalCredits, usedCredits, availableCredits, refetch: refetchCredits } = useCompanyCredits(companyId || undefined, profile?.user_id);
  const companyState = useCompanyState(companyId || undefined, profile?.user_id);
  
  // Filter agents to get full PlatformAgent objects for enabled ones
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
        const { data: usageLogs } = await supabase
          .from('agent_usage_log')
          .select(`
            id, 
            created_at, 
            status, 
            output_summary, 
            error_message,
            credits_consumed,
            platform_agents(name, icon)
          `)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentActivity((usageLogs as ActivityLog[]) || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      navigate(`/company-dashboard?view=${view}`);
    }
  };

  const handleAgentClick = (agent: PlatformAgent) => {
    setSelectedAgent(agent);
    setAgentPanelOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  const featuredAction = nextBestActions[0];
  const otherActions = nextBestActions.slice(1);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            ¡Hola, {profile?.full_name?.split(' ')[0] || "Usuario"}! 👋
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-8 px-3 gap-2">
            <Bot className="w-4 h-4" />
            {enabledAgentIds.length} agentes
          </Badge>
          <Badge variant="outline" className="h-8 px-3 gap-2 bg-amber-500/10 border-amber-500/30 text-amber-600">
            <Zap className="w-4 h-4" />
            {availableCredits} cr
          </Badge>
        </div>
      </div>

      {/* Featured Next Best Action */}
      {featuredAction && (
        <NextBestActionCard 
          action={featuredAction} 
          onAction={handleNavigate} 
          featured 
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - State & Recommendations */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company State */}
            <CompanyStateCard state={companyState} />
            
            {/* Quick Agents */}
            <QuickAgentsGrid 
              agents={enabledAgentsList}
              onAgentClick={handleAgentClick}
              onViewAll={() => handleNavigate('marketplace')}
            />
          </div>

          {/* More Recommendations */}
          {otherActions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Más recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecommendationsList 
                  actions={otherActions} 
                  onAction={handleNavigate}
                  maxItems={3}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Activity */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <StatusIcon status={activity.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getActivityMessage(activity, t)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>{formatTimeAgo(activity.created_at, t)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {activity.credits_consumed} cr
                          </span>
                        </p>
                      </div>
                      <Badge 
                        variant={getStatusBadgeVariant(activity.status)} 
                        className="shrink-0 text-xs px-1.5"
                      >
                        {getStatusBadgeLabel(activity.status, t)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA - Discover Agents */}
          {agents.length > enabledAgentIds.length && (
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Marketplace</h3>
                    <p className="text-sm text-muted-foreground">
                      {agents.length - enabledAgentIds.length} agentes disponibles
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="secondary"
                  onClick={() => handleNavigate('marketplace')}
                >
                  Explorar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}
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
        }}
      />
    </div>
  );
};

export default MandoCentral;
