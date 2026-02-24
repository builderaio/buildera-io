import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveAgentParameters } from '@/utils/companyParametersSaver';
import { useTranslation } from 'react-i18next';

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

const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Determines if an error is retryable (5xx or network errors only).
 * 4xx errors are NOT retried.
 */
function isRetryableError(error: any): boolean {
  const message = (error?.message || '').toLowerCase();
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return true;
  }
  // Edge function errors that indicate server issues
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }
  // Supabase functions.invoke returns FunctionsFetchError for network issues
  if (error?.name === 'FunctionsHttpError') {
    const status = error?.context?.status;
    return status >= 500;
  }
  return false;
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const useAgentExecution = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation('common');

  const executeOnboardingOrchestrator = useCallback(async (
    userId: string,
    companyId: string,
    language: string = 'es'
  ): Promise<OnboardingWowResult | null> => {
    setIsExecuting(true);
    setProgress(10);

    try {
      console.log('🚀 Iniciando orquestación de onboarding WOW...');
      
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
      toast.error(t('agents.orchestrationError', 'No pudimos completar el análisis. Intenta de nuevo.'));
      return null;
    } finally {
      setIsExecuting(false);
      setProgress(0);
    }
  }, [t]);

  const executeAgent = useCallback(async (
    agentCode: string,
    userId: string,
    companyId: string,
    inputData?: any
  ): Promise<AgentExecutionResult> => {
    setIsExecuting(true);

    try {
      // 1. Fetch agent from database
      const { data: agent, error: agentError } = await supabase
        .from('platform_agents')
        .select('*')
        .eq('internal_code', agentCode)
        .eq('is_active', true)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agente no encontrado: ${agentCode}`);
      }

      // 2. Verify agent is enabled for company (premium check)
      const { data: enabledAgent } = await supabase
        .from('company_enabled_agents')
        .select('id')
        .eq('company_id', companyId)
        .eq('agent_id', agent.id)
        .single();

      if (!enabledAgent && agent.is_premium) {
        toast.error(t('agents.premiumNotEnabled', 'Este agente premium no está habilitado para tu empresa.'));
        return { success: false, error: 'Agent not enabled' };
      }

      // 3. Execute with retry for transient errors
      const startTime = Date.now();
      let lastError: Error | null = null;
      let result: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
            console.log(`🔄 Reintento ${attempt}/${MAX_RETRIES} para ${agentCode} (delay: ${delay}ms)`);
            await sleep(delay);
          }

          const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
            body: { user_id: userId, company_id: companyId, ...inputData }
          });

          if (error) throw error;

          // Check if edge function returned an error in the response body
          if (data && data.success === false) {
            const funcError = new Error(data.error || data.details || 'Agent execution failed');
            // Treat 4xx-style errors as non-retryable
            if (data.status && data.status >= 400 && data.status < 500) {
              throw funcError;
            }
            throw Object.assign(funcError, { retryable: true });
          }

          result = data;
          lastError = null;
          break; // Success — exit retry loop

        } catch (err: any) {
          lastError = err;
          if (attempt < MAX_RETRIES && (isRetryableError(err) || err.retryable)) {
            continue; // Retry
          }
          break; // Non-retryable or max retries reached
        }
      }

      const executionTime = Date.now() - startTime;

      // 4. If all attempts failed, log failure and return error
      if (lastError || !result) {
        const errorMsg = lastError?.message || 'Unknown error';
        
        // Log failed execution (no credits consumed)
        await supabase.from('agent_usage_log').insert({
          user_id: userId,
          company_id: companyId,
          agent_id: agent.id,
          credits_consumed: 0,
          input_data: inputData,
          output_summary: `Error: ${errorMsg}`,
          error_message: errorMsg,
          execution_time_ms: executionTime,
          status: 'failed'
        });

        toast.error(
          t('agents.executionError', 'El agente encontró un error. Tus créditos no fueron afectados.'),
          {
            action: {
              label: t('agents.retry', 'Reintentar'),
              onClick: () => executeAgent(agentCode, userId, companyId, inputData),
            },
          }
        );

        return { success: false, error: errorMsg };
      }

      // 5. SUCCESS — Log usage WITH credits
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

      // 6. Deduct credits only on success
      if (agent.credits_per_use > 0) {
        await supabase.rpc('deduct_company_credits', {
          _company_id: companyId,
          _credits: agent.credits_per_use
        });
      }

      // 7. Save agent outputs as reusable parameters
      let parametersSaved: string[] = [];
      if (result && typeof result === 'object') {
        const saveResult = await saveAgentParameters(
          companyId,
          agentCode,
          usageLog?.id || null,
          result,
          userId
        );
        parametersSaved = saveResult.saved;
        if (saveResult.saved.length > 0) {
          console.log(`📦 Saved ${saveResult.saved.length} parameters from ${agentCode}:`, saveResult.saved);
        }
      }

      return {
        success: true,
        data: result,
        execution_time_ms: executionTime,
        parametersSaved
      };

    } catch (error) {
      console.error(`Error ejecutando agente ${agentCode}:`, error);
      toast.error(t('agents.executionError', 'El agente encontró un error. Tus créditos no fueron afectados.'));
      return {
        success: false,
        error: (error as Error).message
      };
    } finally {
      setIsExecuting(false);
    }
  }, [t]);

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
