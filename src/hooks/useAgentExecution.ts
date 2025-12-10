import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { saveAgentParameters } from '@/utils/companyParametersSaver';

interface AgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  execution_time_ms?: number;
  parametersSaved?: string[];
}

interface OnboardingWowResult {
  success: boolean;
  total_execution_time_ms: number;
  agents_executed: number;
  agents_successful: number;
  results: {
    strategy: any;
    content: any;
    insights: any;
  };
  summary: {
    title: string;
    description: string;
    highlights: string[];
  };
}

export const useAgentExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const executeOnboardingOrchestrator = useCallback(async (
    userId: string,
    companyId: string,
    language: string = 'es'
  ): Promise<OnboardingWowResult | null> => {
    setIsExecuting(true);
    setProgress(10);

    try {
      console.log('🚀 Iniciando orquestación de onboarding WOW...');
      
      // Simular progreso mientras se ejecutan los agentes
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 2000);

      const { data, error } = await supabase.functions.invoke('onboarding-agent-orchestrator', {
        body: { user_id: userId, company_id: companyId, language }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      console.log('✅ Orquestación completada:', data);
      
      return data as OnboardingWowResult;

    } catch (error) {
      console.error('❌ Error en orquestación:', error);
      toast({
        title: "Error en análisis",
        description: "No pudimos completar el análisis. Intenta de nuevo.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsExecuting(false);
      setProgress(0);
    }
  }, [toast]);

  const executeAgent = useCallback(async (
    agentCode: string,
    userId: string,
    companyId: string,
    inputData?: any
  ): Promise<AgentExecutionResult> => {
    setIsExecuting(true);

    try {
      // Obtener el agente de la base de datos
      const { data: agent, error: agentError } = await supabase
        .from('platform_agents')
        .select('*')
        .eq('internal_code', agentCode)
        .eq('is_active', true)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agente no encontrado: ${agentCode}`);
      }

      // Verificar si el agente está habilitado para la empresa
      const { data: enabledAgent } = await supabase
        .from('company_enabled_agents')
        .select('id')
        .eq('company_id', companyId)
        .eq('agent_id', agent.id)
        .single();

      if (!enabledAgent && agent.is_premium) {
        throw new Error('Este agente premium no está habilitado para tu empresa');
      }

      const startTime = Date.now();

      // Ejecutar la edge function del agente
      const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
        body: { user_id: userId, company_id: companyId, ...inputData }
      });

      const executionTime = Date.now() - startTime;

      if (error) throw error;

      // Register agent usage
      const { data: usageLog } = await supabase.from('agent_usage_log').insert({
        user_id: userId,
        company_id: companyId,
        agent_id: agent.id,
        credits_consumed: agent.credits_per_use,
        input_data: inputData,
        output_summary: `Ejecución de ${agent.name}`,
        execution_time_ms: executionTime,
        status: 'completed'
      }).select('id').single();

      // Save agent outputs as reusable parameters
      let parametersSaved: string[] = [];
      if (data && typeof data === 'object') {
        const saveResult = await saveAgentParameters(
          companyId,
          agentCode,
          usageLog?.id || null,
          data,
          userId
        );
        parametersSaved = saveResult.saved;
        if (saveResult.saved.length > 0) {
          console.log(`📦 Saved ${saveResult.saved.length} parameters from ${agentCode}:`, saveResult.saved);
        }
      }

      return {
        success: true,
        data,
        execution_time_ms: executionTime,
        parametersSaved
      };

    } catch (error) {
      console.error(`Error ejecutando agente ${agentCode}:`, error);
      return {
        success: false,
        error: (error as Error).message
      };
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const getAgentUsageStats = useCallback(async (
    companyId: string
  ) => {
    const { data, error } = await supabase
      .from('agent_usage_log')
      .select(`
        agent_id,
        credits_consumed,
        created_at,
        platform_agents (
          internal_code,
          name,
          icon
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }

    // Agrupar por agente
    const statsByAgent = (data || []).reduce((acc: any, log: any) => {
      const agentCode = log.platform_agents?.internal_code || 'unknown';
      if (!acc[agentCode]) {
        acc[agentCode] = {
          name: log.platform_agents?.name || 'Desconocido',
          icon: log.platform_agents?.icon,
          total_executions: 0,
          total_credits: 0
        };
      }
      acc[agentCode].total_executions++;
      acc[agentCode].total_credits += log.credits_consumed || 0;
      return acc;
    }, {});

    return statsByAgent;
  }, []);

  return {
    isExecuting,
    progress,
    executeOnboardingOrchestrator,
    executeAgent,
    getAgentUsageStats
  };
};
