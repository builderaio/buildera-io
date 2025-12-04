import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Activity, 
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Calendar,
  History,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { usePlatformAgents, PlatformAgent } from '@/hooks/usePlatformAgents';
import { AgentInteractionPanel } from '@/components/agents/AgentInteractionPanel';
import { useCompanyCredits } from '@/hooks/useCompanyCredits';
import { Json } from '@/integrations/supabase/types';

interface AgentConfiguration {
  id: string;
  agent_id: string;
  configuration: Json;
  is_recurring: boolean;
  is_active: boolean;
  next_execution_at: string | null;
  last_execution_at: string | null;
  total_executions: number;
  created_at: string;
}

interface ExecutionLog {
  id: string;
  agent_id: string;
  status: string;
  credits_consumed: number;
  output_summary: string | null;
  execution_time_ms: number | null;
  created_at: string;
  agent?: PlatformAgent;
}

const CompanyAgents = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const { company } = useCompany();
  
  const { agents, loading: agentsLoading, isAgentEnabled } = usePlatformAgents(company?.id);
  const { availableCredits, loading: creditsLoading, refetch: refetchCredits } = useCompanyCredits(company?.id);
  
  const [configurations, setConfigurations] = useState<AgentConfiguration[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agents');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [selectedAgent, setSelectedAgent] = useState<PlatformAgent | null>(null);
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (company?.id) {
      loadData();
    }
  }, [company?.id]);

  const loadData = async () => {
    if (!company?.id) return;
    
    try {
      // Load agent configurations
      const { data: configData, error: configError } = await supabase
        .from('company_agent_configurations')
        .select('id, agent_id, configuration, is_recurring, is_active, next_execution_at, last_execution_at, total_executions, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (configError) throw configError;
      setConfigurations(configData || []);

      // Load recent execution logs
      const { data: logsData, error: logsError } = await supabase
        .from('agent_usage_log')
        .select('id, agent_id, status, credits_consumed, output_summary, execution_time_ms, created_at')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setExecutionLogs(logsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEnabledAgents = () => {
    return agents.filter(agent => isAgentEnabled(agent.id));
  };

  const getScheduledAgents = () => {
    const scheduledConfigs = configurations.filter(c => c.is_recurring && c.is_active);
    const scheduledIds = scheduledConfigs.map(c => c.agent_id);
    return agents.filter(agent => scheduledIds.includes(agent.id));
  };

  const getAgentConfig = (agentId: string) => {
    return configurations.find(c => c.agent_id === agentId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAgentClick = (agent: PlatformAgent) => {
    setSelectedAgent(agent);
    setShowAgentPanel(true);
  };

  const enabledAgentsList = getEnabledAgents();
  const scheduledAgentsList = getScheduledAgents();

  if (loading || agentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('common:loading', 'Cargando...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('common:myAgents', 'Mis Agentes IA')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('common:manageAgents', 'Gestiona y ejecuta tus agentes de inteligencia artificial')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/marketplace/agents')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('common:enableMoreAgents', 'Habilitar más agentes')}
          </Button>
        </div>
      </div>

      {/* Credits Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-medium">{t('common:availableCredits', 'Créditos disponibles')}:</span>
                <Badge variant="secondary" className="text-lg">
                  {availableCredits || 0}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {enabledAgentsList.length} {t('common:agentsEnabled', 'agentes habilitados')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            {t('common:agents', 'Agentes')} ({enabledAgentsList.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('common:scheduled', 'Programados')} ({scheduledAgentsList.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            {t('common:history', 'Historial')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('common:analytics', 'Analytics')}
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          {enabledAgentsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enabledAgentsList.map((agent) => {
                const config = getAgentConfig(agent.id);
                return (
                  <Card 
                    key={agent.id} 
                    className="relative cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleAgentClick(agent)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{agent.icon || '🤖'}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg">{agent.name}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {agent.category}
                            </Badge>
                          </div>
                        </div>
                        {config?.is_active && config?.is_recurring && (
                          <Badge className="bg-emerald-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <CardDescription className="line-clamp-2">
                        {agent.description}
                      </CardDescription>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>{agent.credits_per_use} créditos</span>
                        </div>
                        {config && (
                          <span className="text-xs text-muted-foreground">
                            {config.total_executions} ejecuciones
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgentClick(agent);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Ejecutar
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/company/agents/${agent.id}`);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('common:noAgentsEnabled', 'No tienes agentes habilitados')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('common:visitMarketplace', 'Visita el marketplace para habilitar agentes')}
              </p>
              <Button onClick={() => navigate('/marketplace/agents')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('common:goToMarketplace', 'Ir al Marketplace')}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Scheduled Tab */}
        <TabsContent value="scheduled" className="space-y-6">
          {scheduledAgentsList.length > 0 ? (
            <div className="space-y-4">
              {scheduledAgentsList.map((agent) => {
                const config = getAgentConfig(agent.id);
                return (
                  <Card key={agent.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{agent.icon || '🤖'}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-sm text-muted-foreground">{agent.description}</p>
                            {config?.next_execution_at && (
                              <p className="text-sm text-primary mt-1">
                                Próxima ejecución: {formatDate(config.next_execution_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {config?.total_executions || 0} ejecuciones
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/company/agents/${agent.id}`)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Gestionar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('common:noScheduledAgents', 'No hay agentes programados')}</h3>
              <p className="text-muted-foreground">
                {t('common:configureSchedule', 'Configura la ejecución automática de tus agentes')}
              </p>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {executionLogs.length > 0 ? (
            <div className="space-y-3">
              {executionLogs.map((log) => {
                const agent = agents.find(a => a.id === log.agent_id);
                return (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium">{agent?.name || 'Agente desconocido'}</p>
                            <p className="text-sm text-muted-foreground">
                              {log.output_summary || log.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">{formatDate(log.created_at)}</p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            <Badge variant="outline">{log.credits_consumed} cr</Badge>
                            {log.execution_time_ms && (
                              <span className="text-xs text-muted-foreground">
                                {(log.execution_time_ms / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t('common:noExecutions', 'No hay ejecuciones')}</h3>
              <p className="text-muted-foreground">
                {t('common:executionsWillAppear', 'Las ejecuciones de tus agentes aparecerán aquí')}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Bot className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{enabledAgentsList.length}</p>
                    <p className="text-sm text-muted-foreground">{t('common:enabledAgents', 'Agentes Habilitados')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{executionLogs.length}</p>
                    <p className="text-sm text-muted-foreground">{t('common:totalExecutions', 'Ejecuciones Totales')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {executionLogs.filter(l => l.status === 'completed').length}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('common:completed', 'Completadas')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {executionLogs.reduce((sum, l) => sum + (l.credits_consumed || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">{t('common:creditsUsed', 'Créditos Usados')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Interaction Panel */}
      <AgentInteractionPanel
        agent={selectedAgent}
        isOpen={showAgentPanel}
        onClose={() => {
          setShowAgentPanel(false);
          setSelectedAgent(null);
        }}
        isEnabled={selectedAgent ? isAgentEnabled(selectedAgent.id) : false}
        creditsAvailable={availableCredits || 0}
        companyId={company?.id}
        userId={userId || undefined}
        onExecutionComplete={() => {
          loadData();
          refetchCredits();
        }}
      />
    </div>
  );
};

export default CompanyAgents;
