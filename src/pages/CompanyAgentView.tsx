import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Bot, 
  Settings, 
  Play, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Calendar,
  History,
  Loader2
} from 'lucide-react';
import { AgentIconRenderer } from '@/components/agents/AgentIconRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/contexts/CompanyContext';
import { usePlatformAgents, PlatformAgent } from '@/hooks/usePlatformAgents';
import { useAgentConfiguration, ScheduleConfig } from '@/hooks/useAgentConfiguration';
import { useCompanyCredits } from '@/hooks/useCompanyCredits';
import { AgentConfigurationWizard } from '@/components/agents/AgentConfigurationWizard';
import { AgentResultsView } from '@/components/agents/AgentResultsView';
import { AgentScheduleManager } from '@/components/agents/AgentScheduleManager';
import { buildAgentPayload, getAgentDataRequirements } from '@/utils/agentPayloadMapper';

const CompanyAgentView = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const { company } = useCompany();
  
  const { agents, loading: agentsLoading, isAgentEnabled } = usePlatformAgents(company?.id);
  const { availableCredits } = useCompanyCredits(company?.id);
  
  const [agent, setAgent] = useState<PlatformAgent | null>(null);
  const [executing, setExecuting] = useState(false);
  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Additional data for agent payload mapping
  const [strategyData, setStrategyData] = useState<any>(null);
  const [audiencesData, setAudiencesData] = useState<any[]>([]);
  const [brandingData, setBrandingData] = useState<any>(null);

  const {
    configuration,
    executionHistory,
    loading: configLoading,
    saving,
    saveConfiguration,
    updateSchedule,
    recordExecution,
    reload
  } = useAgentConfiguration(company?.id, agentId);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (agentId && agents.length > 0) {
      const foundAgent = agents.find(a => a.id === agentId);
      setAgent(foundAgent || null);
    }
  }, [agentId, agents]);

  // Load additional data needed for agent execution
  useEffect(() => {
    const loadAgentContextData = async () => {
      if (!company?.id || !agent) return;
      
      // Get requirements from agent config or fallback to hardcoded
      const agentContextReqs = (agent as any).context_requirements;
      const requirements = getAgentDataRequirements(agent.internal_code, agentContextReqs);
      
      // Load data based on agent requirements
      if (requirements.needsStrategy) {
        const { data } = await supabase
          .from('company_strategy')
          .select('*')
          .eq('company_id', company.id)
          .maybeSingle();
        setStrategyData(data);
      }
      
      if (requirements.needsAudiences) {
        const { data } = await supabase
          .from('company_audiences')
          .select('*')
          .eq('company_id', company.id)
          .eq('is_active', true);
        setAudiencesData(data || []);
      }
      
      if (requirements.needsBranding) {
        const { data } = await supabase
          .from('company_branding')
          .select('*')
          .eq('company_id', company.id)
          .maybeSingle();
        setBrandingData(data);
      }
    };
    
    loadAgentContextData();
  }, [company?.id, agent]);

  const handleExecute = async () => {
    if (!agent || !company?.id || !userId) {
      toast({
        title: t('common:error', 'Error'),
        description: t('common:missingData', 'Faltan datos necesarios'),
        variant: "destructive"
      });
      return;
    }

    if ((availableCredits || 0) < agent.credits_per_use) {
      toast({
        title: t('common:insufficientCredits', 'Créditos insuficientes'),
        description: t('common:needMoreCredits', 'Necesitas más créditos'),
        variant: "destructive"
      });
      return;
    }

    setExecuting(true);
    const startTime = Date.now();
    
    try {
      const { data: logEntry, error: logError } = await supabase
        .from('agent_usage_log')
        .insert({
          agent_id: agent.id,
          user_id: userId,
          company_id: company.id,
          credits_consumed: agent.credits_per_use,
          status: 'running',
          input_data: configuration?.configuration || {}
        })
        .select()
        .single();

      if (logError) throw logError;

      // Build the specific payload for this agent using the mapper
      // Pass payload_template from agent config for dynamic mapping
      const agentPayloadTemplate = (agent as any).payload_template;
      const agentPayload = buildAgentPayload(
        agent.internal_code,
        {
          company: company,
          strategy: strategyData,
          audiences: audiencesData,
          branding: brandingData,
          configuration: configuration?.configuration || {},
          userId: userId || undefined,
          language: 'es'
        },
        agentPayloadTemplate
      );

      // Add execution metadata
      const fullPayload = {
        ...agentPayload,
        agentId: agent.id,
        logId: logEntry.id
      };

      console.log(`[AgentView] Executing ${agent.internal_code} with payload:`, fullPayload);

      const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
        body: fullPayload
      });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      await supabase
        .from('agent_usage_log')
        .update({
          status: 'completed',
          output_data: data,
          output_summary: data?.summary || 'Ejecución completada',
          execution_time_ms: executionTime
        })
        .eq('id', logEntry.id);

      await recordExecution(
        'completed', 
        data, 
        data?.summary || 'Ejecución completada',
        agent.credits_per_use,
        executionTime
      );

      setLatestResult({
        id: logEntry.id,
        status: 'completed',
        output_data: data,
        execution_time_ms: executionTime,
        created_at: new Date().toISOString()
      });

      toast({
        title: t('common:success', 'Éxito'),
        description: `${agent.name} ejecutado correctamente`
      });

      reload();
    } catch (error) {
      console.error('Error executing agent:', error);
      await recordExecution(
        'failed', 
        null, 
        (error as Error).message,
        agent.credits_per_use,
        Date.now() - startTime,
        (error as Error).message
      );
      toast({
        title: t('common:error', 'Error'),
        description: t('common:executionFailed', 'No se pudo ejecutar'),
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleConfigSave = async (config: Record<string, any>) => {
    const success = await saveConfiguration(config, false, null);
    if (success) {
      setShowConfigWizard(false);
      toast({
        title: t('common:success', 'Configuración guardada'),
      });
    }
    return success;
  };

  const handleScheduleUpdate = async (scheduleConfig: ScheduleConfig | null, isActive: boolean) => {
    const success = await updateSchedule(scheduleConfig, isActive);
    if (success) {
      toast({
        title: t('common:success', 'Programación actualizada'),
      });
    }
    return success;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (agentsLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('common:loading', 'Cargando...')}</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('common:agentNotFound', 'Agente no encontrado')}</h1>
          <p className="text-muted-foreground mb-4">
            {t('common:agentNotFoundDesc', 'El agente que buscas no existe o no está habilitado.')}
          </p>
          <Button onClick={() => navigate('/company/agents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common:backToAgents', 'Volver a Mis Agentes')}
          </Button>
        </div>
      </div>
    );
  }

  const hasEnoughCredits = (availableCredits || 0) >= agent.credits_per_use;
  const hasInputSchema = agent.input_schema && typeof agent.input_schema === 'object' && Object.keys(agent.input_schema).length > 0;
  const isRecurringCapable = hasInputSchema && (agent.input_schema as any)?.recurring_capable === true;
  const isEnabled = isAgentEnabled(agent.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/company/agents')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common:backToAgents', 'Volver a Mis Agentes')}
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <AgentIconRenderer icon={agent.icon} size="xl" fallback="🤖" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{agent.name}</h1>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline">{agent.category}</Badge>
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {isEnabled ? 'Habilitado' : 'No habilitado'}
                  </Badge>
                  {agent.is_premium && (
                    <Badge className="bg-amber-500">Premium</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{agent.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="text-right mr-4">
                <p className="text-sm text-muted-foreground">{t('common:cost', 'Costo')}</p>
                <p className="text-lg font-bold flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {agent.credits_per_use} cr
                </p>
              </div>
              <Button
                onClick={handleExecute}
                disabled={executing || !hasEnoughCredits || !isEnabled}
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common:executing', 'Ejecutando...')}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {t('common:execute', 'Ejecutar')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t('common:overview', 'Resumen')}</TabsTrigger>
            <TabsTrigger value="configuration">{t('common:configuration', 'Configuración')}</TabsTrigger>
            <TabsTrigger value="results">{t('common:results', 'Resultados')}</TabsTrigger>
            {isRecurringCapable && (
              <TabsTrigger value="schedule">{t('common:schedule', 'Programación')}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    {t('common:agentInfo', 'Información del Agente')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:type', 'Tipo')}:</span>
                    <p className="font-medium capitalize">{agent.execution_type}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:function', 'Función')}:</span>
                    <p className="font-medium">{agent.edge_function_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:minPlan', 'Plan mínimo')}:</span>
                    <p className="font-medium capitalize">{agent.min_plan_required}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {t('common:configStatus', 'Estado de Configuración')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:configured', 'Configurado')}:</span>
                    <p className="font-medium flex items-center gap-2">
                      {configuration ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Sí
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          No
                        </>
                      )}
                    </p>
                  </div>
                  {configuration && (
                    <>
                      <div>
                        <span className="text-sm text-muted-foreground">{t('common:lastExecution', 'Última ejecución')}:</span>
                        <p className="font-medium">
                          {configuration.last_execution_at 
                            ? formatDate(configuration.last_execution_at)
                            : 'Nunca'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">{t('common:totalExecutions', 'Total ejecuciones')}:</span>
                        <p className="font-medium">{configuration.total_executions}</p>
                      </div>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowConfigWizard(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {configuration ? t('common:editConfig', 'Editar configuración') : t('common:configure', 'Configurar')}
                  </Button>
                </CardContent>
              </Card>

              {/* Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {t('common:performance', 'Rendimiento')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:successRate', 'Tasa de éxito')}:</span>
                    <p className="font-medium text-2xl text-emerald-600">
                      {executionHistory.length > 0
                        ? Math.round((executionHistory.filter(e => e.status === 'completed').length / executionHistory.length) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:avgTime', 'Tiempo promedio')}:</span>
                    <p className="font-medium">
                      {executionHistory.length > 0
                        ? `${(executionHistory.reduce((sum, e) => sum + (e.execution_time_ms || 0), 0) / executionHistory.length / 1000).toFixed(1)}s`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('common:creditsUsed', 'Créditos usados')}:</span>
                    <p className="font-medium">
                      {configuration?.total_executions 
                        ? configuration.total_executions * agent.credits_per_use
                        : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Executions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('common:recentExecutions', 'Ejecuciones Recientes')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {executionHistory.length > 0 ? (
                  <div className="space-y-3">
                    {executionHistory.slice(0, 5).map((exec) => (
                      <div 
                        key={exec.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(exec.status)}
                          <div>
                            <p className="font-medium">{exec.output_summary || exec.status}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(exec.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {exec.execution_time_ms && (
                            <p className="text-sm">{(exec.execution_time_ms / 1000).toFixed(1)}s</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t('common:noExecutionsYet', 'Aún no hay ejecuciones')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('common:currentConfiguration', 'Configuración Actual')}</CardTitle>
                <CardDescription>
                  {t('common:configDesc', 'Parámetros de entrada para la ejecución del agente')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configuration ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(configuration.configuration, null, 2)}
                      </pre>
                    </div>
                    <Button onClick={() => setShowConfigWizard(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      {t('common:editConfiguration', 'Editar Configuración')}
                    </Button>
                  </div>
                ) : hasInputSchema ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('common:noConfigYet', 'Este agente requiere configuración antes de ejecutarse')}
                    </p>
                    <Button onClick={() => setShowConfigWizard(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      {t('common:configureNow', 'Configurar Ahora')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                    <p className="text-muted-foreground">
                      {t('common:noConfigNeeded', 'Este agente no requiere configuración adicional')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {hasInputSchema && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('common:inputSchema', 'Esquema de Entrada')}</CardTitle>
                  <CardDescription>
                    {t('common:inputSchemaDesc', 'Parámetros que acepta este agente')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(agent.input_schema, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <AgentResultsView
              results={executionHistory}
              latestResult={latestResult}
              agentName={agent.name}
              loading={configLoading}
            />
          </TabsContent>

          {isRecurringCapable && (
            <TabsContent value="schedule" className="space-y-6">
              <AgentScheduleManager
                agentName={agent.name}
                isRecurringCapable={isRecurringCapable}
                currentSchedule={configuration?.schedule_config || null}
                isActive={configuration?.is_active || false}
                nextExecutionAt={configuration?.next_execution_at || null}
                lastExecutionAt={configuration?.last_execution_at || null}
                lastExecutionStatus={configuration?.last_execution_status || null}
                totalExecutions={configuration?.total_executions || 0}
                onUpdateSchedule={handleScheduleUpdate}
                saving={saving}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Configuration Wizard */}
      {hasInputSchema && (
      <AgentConfigurationWizard
        isOpen={showConfigWizard}
        onClose={() => setShowConfigWizard(false)}
        agentName={agent.name}
        agentDescription={agent.description}
        creditsPerUse={agent.credits_per_use}
        inputSchema={agent.input_schema as any}
        existingConfig={configuration?.configuration as Record<string, any>}
        onSave={handleConfigSave}
        saving={saving}
      />
      )}
    </div>
  );
};

export default CompanyAgentView;
