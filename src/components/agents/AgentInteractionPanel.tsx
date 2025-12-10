import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Star, Play, Clock, CheckCircle2, AlertCircle, Loader2, ArrowRight, Settings, History, Calendar } from "lucide-react";
import { AgentIconRenderer } from "./AgentIconRenderer";
import { PlatformAgent } from "@/hooks/usePlatformAgents";
import { useAgentConfiguration, ScheduleConfig } from "@/hooks/useAgentConfiguration";
import { useAgentPrerequisites } from "@/hooks/useAgentPrerequisites";
import { AgentConfigurationWizard } from "./AgentConfigurationWizard";
import { AgentResultsView } from "./AgentResultsView";
import { AgentScheduleManager } from "./AgentScheduleManager";
import { AgentPrerequisitesAlert } from "./AgentPrerequisitesAlert";
import { AgentContextSummary } from "./AgentContextSummary";
import { AgentConfigDisplay } from "./AgentConfigDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { buildAgentPayload, getAgentDataRequirements } from "@/utils/agentPayloadMapper";

interface AgentInteractionPanelProps {
  agent: PlatformAgent | null;
  isOpen: boolean;
  onClose: () => void;
  isEnabled: boolean;
  creditsAvailable: number;
  companyId?: string;
  userId?: string;
  onExecutionComplete?: () => void;
}

const categoryColors: Record<string, string> = {
  strategy: "from-blue-500 to-indigo-600",
  content: "from-purple-500 to-pink-500",
  analytics: "from-emerald-500 to-teal-500",
  branding: "from-amber-500 to-orange-500",
  assistant: "from-cyan-500 to-blue-500",
  publishing: "from-green-500 to-emerald-500",
  marketing: "from-blue-500 to-cyan-500",
};

const categoryIcons: Record<string, string> = {
  strategy: "🧠",
  content: "🎨",
  analytics: "📊",
  branding: "✨",
  assistant: "💬",
  publishing: "📤",
  marketing: "📣",
};

export const AgentInteractionPanel = ({
  agent,
  isOpen,
  onClose,
  isEnabled,
  creditsAvailable,
  companyId,
  userId,
  onExecutionComplete
}: AgentInteractionPanelProps) => {
  const { t, i18n } = useTranslation(['common']);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("execute");
  const [showConfigWizard, setShowConfigWizard] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);
  
  // Context data states for agent execution
  const [strategyData, setStrategyData] = useState<any>(null);
  const [audiencesData, setAudiencesData] = useState<any[]>([]);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const {
    configuration,
    executionHistory,
    loading: configLoading,
    saving,
    saveConfiguration,
    updateSchedule,
    recordExecution,
    reload
  } = useAgentConfiguration(companyId, agent?.id);

  // Check agent prerequisites
  const prerequisiteStatus = useAgentPrerequisites(
    agent?.internal_code || null,
    companyId || null,
    userId || null
  );

  // Load context data based on agent requirements
  useEffect(() => {
    const loadAgentContextData = async () => {
      if (!companyId || !agent) return;
      
      setContextLoading(true);
      try {
        // Get requirements from agent config or fallback to hardcoded
        const agentContextReqs = (agent as any).context_requirements;
        const requirements = getAgentDataRequirements(agent.internal_code, agentContextReqs);
        
        // Load data in parallel based on requirements
        const [strategyResult, audiencesResult, brandingResult] = await Promise.all([
          requirements.needsStrategy
            ? supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle()
            : Promise.resolve({ data: null }),
          requirements.needsAudiences
            ? supabase.from('company_audiences').select('*').eq('company_id', companyId).eq('is_active', true)
            : Promise.resolve({ data: [] }),
          requirements.needsBranding
            ? supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle()
            : Promise.resolve({ data: null })
        ]);
        
        setStrategyData(strategyResult.data);
        setAudiencesData(audiencesResult.data || []);
        setBrandingData(brandingResult.data);
      } catch (error) {
        console.error('Error loading agent context data:', error);
      } finally {
        setContextLoading(false);
      }
    };
    
    if (isOpen) {
      loadAgentContextData();
    }
  }, [companyId, agent, isOpen]);

  // Check if agent needs initial configuration
  const needsConfiguration = !configLoading && !configuration && agent?.input_schema;
  const hasInputSchema = agent?.input_schema && typeof agent.input_schema === 'object' && Object.keys(agent.input_schema).length > 0;
  const isRecurringCapable = hasInputSchema && (agent?.input_schema as any)?.recurring_capable === true;

  useEffect(() => {
    if (isOpen && needsConfiguration && hasInputSchema) {
      setShowConfigWizard(true);
    }
  }, [isOpen, needsConfiguration, hasInputSchema]);

  const handleExecute = async () => {
    if (!agent || !userId || !companyId) {
      toast({
        title: t('common:error', 'Error'),
        description: t('common:missingData', 'Faltan datos necesarios'),
        variant: "destructive"
      });
      return;
    }

    if (creditsAvailable < agent.credits_per_use) {
      toast({
        title: t('common:insufficientCredits', 'Créditos insuficientes'),
        description: t('common:needMoreCredits', 'Necesitas más créditos para ejecutar este agente'),
        variant: "destructive"
      });
      return;
    }

    setExecuting(true);
    const startTime = Date.now();
    
    try {
      // Load company data for payload construction
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('Error loading company data:', companyError);
      }

      // Log the execution start
      const { data: logEntry, error: logError } = await supabase
        .from('agent_usage_log')
        .insert({
          agent_id: agent.id,
          user_id: userId,
          company_id: companyId,
          credits_consumed: agent.credits_per_use,
          status: 'running',
          input_data: configuration?.configuration || {}
        })
        .select()
        .single();

      if (logError) throw logError;

      // Build payload using the mapper with full company context
      // Pass payload_template from agent config for dynamic mapping
      const agentPayloadTemplate = (agent as any).payload_template;
      const agentPayload = buildAgentPayload(
        agent.internal_code,
        {
          company: companyData,
          strategy: strategyData,
          audiences: audiencesData,
          branding: brandingData,
          configuration: configuration?.configuration || {},
          userId: userId,
          language: i18n.language || 'es'
        },
        agentPayloadTemplate
      );

      // Execute the edge function with properly constructed payload
      const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
        body: {
          ...agentPayload,
          agentId: agent.id,
          logId: logEntry.id
        }
      });

      if (error) throw error;

      const executionTime = Date.now() - startTime;

      // Update log entry with success
      await supabase
        .from('agent_usage_log')
        .update({
          status: 'completed',
          output_data: data,
          output_summary: data?.summary || 'Ejecución completada exitosamente',
          execution_time_ms: executionTime
        })
        .eq('id', logEntry.id);

      // Record execution in configuration
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

      setActiveTab("results");

      toast({
        title: t('common:success', 'Éxito'),
        description: `${agent.name} ${t('common:executedSuccessfully', 'ejecutado correctamente')}`
      });

      onExecutionComplete?.();
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
        description: t('common:executionFailed', 'No se pudo ejecutar el agente'),
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
        description: t('common:configSaved', 'Puedes ejecutar el agente ahora')
      });
    }
    return success;
  };

  const handleScheduleUpdate = async (scheduleConfig: ScheduleConfig | null, isActive: boolean) => {
    const success = await updateSchedule(scheduleConfig, isActive);
    if (success) {
      toast({
        title: t('common:success', 'Programación actualizada'),
        description: isActive 
          ? t('common:scheduleEnabled', 'El agente se ejecutará automáticamente')
          : t('common:schedulePaused', 'La programación ha sido pausada')
      });
    }
    return success;
  };

  if (!agent) return null;

  const categoryColor = categoryColors[agent.category] || "from-gray-500 to-gray-600";
  const categoryIcon = categoryIcons[agent.category] || agent.icon || "🤖";
  const hasEnoughCredits = creditsAvailable >= agent.credits_per_use;

  // Show configuration wizard if needed
  if (showConfigWizard && hasInputSchema) {
    return (
      <AgentConfigurationWizard
        isOpen={isOpen}
        onClose={() => {
          setShowConfigWizard(false);
          if (needsConfiguration) onClose();
        }}
        agentName={agent.name}
        agentDescription={agent.description}
        creditsPerUse={agent.credits_per_use}
        inputSchema={agent.input_schema as any}
        existingConfig={configuration?.configuration as Record<string, any>}
        onSave={handleConfigSave}
        saving={saving}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center text-white shadow-lg`}>
              <AgentIconRenderer icon={agent.icon || categoryIcon} size="xl" fallback={categoryIcon} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {agent.name}
                {agent.is_premium && (
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {agent.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Cost and Credits */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">{t('common:cost', 'Costo')}:</span>
                  <Badge variant="secondary" className="text-lg">
                    {agent.credits_per_use} {t('common:credits', 'créditos')}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('common:available', 'Disponible')}</p>
                  <p className={`text-lg font-bold ${hasEnoughCredits ? 'text-emerald-600' : 'text-destructive'}`}>
                    {creditsAvailable} cr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isEnabled ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="execute" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Ejecutar
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Resultados
                </TabsTrigger>
                {isRecurringCapable && (
                  <TabsTrigger value="schedule" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Programar
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="execute" className="space-y-4 mt-4">
                {/* Context Summary - Data used by agent */}
                {companyId && userId && (
                  <AgentContextSummary 
                    agent={agent} 
                    companyId={companyId} 
                    userId={userId}
                    onDataGenerated={() => {
                      prerequisiteStatus.refresh();
                      reload();
                    }}
                  />
                )}

                {/* Prerequisites Alert */}
                <AgentPrerequisitesAlert 
                  status={prerequisiteStatus} 
                  companyId={companyId}
                  onClose={onClose} 
                  onRefresh={prerequisiteStatus.refresh}
                />

                {/* Current Configuration - Human readable */}
                {configuration && (
                  <AgentConfigDisplay
                    configuration={configuration.configuration as Record<string, any>}
                    inputSchema={agent.input_schema as Record<string, any>}
                    onEdit={() => setShowConfigWizard(true)}
                  />
                )}

                {/* Execute Button */}
                <Button 
                  className="w-full h-12 text-lg"
                  onClick={handleExecute}
                  disabled={executing || !hasEnoughCredits || configLoading || !prerequisiteStatus.canExecute}
                >
                  {executing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('common:executing', 'Ejecutando...')}
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      {t('common:executeAgent', 'Ejecutar Agente')}
                    </>
                  )}
                </Button>

                {!hasEnoughCredits && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-destructive">
                      {t('common:insufficientCreditsMessage', 'No tienes créditos suficientes')}
                    </p>
                  </div>
                )}

                {!configuration && hasInputSchema && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowConfigWizard(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {t('common:configureFirst', 'Configurar antes de ejecutar')}
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="results" className="mt-4">
                <AgentResultsView
                  results={executionHistory}
                  latestResult={latestResult}
                  agentName={agent.name}
                  loading={configLoading}
                />
              </TabsContent>

              {isRecurringCapable && (
                <TabsContent value="schedule" className="mt-4">
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
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t('common:agentNotEnabled', 'Este agente no está habilitado para tu empresa')}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/marketplace/agents')}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                {t('common:viewInMarketplace', 'Ver en Marketplace')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentInteractionPanel;
