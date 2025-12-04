import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface AgentConfiguration {
  id: string;
  company_id: string;
  agent_id: string;
  user_id: string;
  configuration: Record<string, any>;
  is_recurring: boolean;
  schedule_config: ScheduleConfig | null;
  next_execution_at: string | null;
  last_execution_at: string | null;
  total_executions: number;
  last_execution_status: string | null;
  last_execution_result: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  days?: number[]; // 0-6 for weekly (0=Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
}

export interface ExecutionResult {
  id: string;
  agent_id: string;
  user_id: string;
  company_id: string;
  status: string;
  credits_consumed: number;
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  output_summary: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export function useAgentConfiguration(companyId?: string, agentId?: string) {
  const { toast } = useToast();
  const [configuration, setConfiguration] = useState<AgentConfiguration | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfiguration = useCallback(async () => {
    if (!companyId || !agentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_agent_configurations')
        .select('*')
        .eq('company_id', companyId)
        .eq('agent_id', agentId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfiguration({
          ...data,
          configuration: (data.configuration as Record<string, any>) || {},
          schedule_config: data.schedule_config as unknown as ScheduleConfig | null,
          last_execution_result: (data.last_execution_result as Record<string, any>) || null,
        });
      } else {
        setConfiguration(null);
      }
    } catch (error) {
      console.error('Error loading agent configuration:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, agentId]);

  const loadExecutionHistory = useCallback(async () => {
    if (!companyId || !agentId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('agent_usage_log')
        .select('*')
        .eq('agent_id', agentId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setExecutionHistory((data || []).map(item => ({
        ...item,
        input_data: (item.input_data as Record<string, any>) || null,
        output_data: (item.output_data as Record<string, any>) || null,
      })));
    } catch (error) {
      console.error('Error loading execution history:', error);
    }
  }, [companyId, agentId]);

  useEffect(() => {
    loadConfiguration();
    loadExecutionHistory();
  }, [loadConfiguration, loadExecutionHistory]);

  const saveConfiguration = async (
    config: Record<string, any>,
    isRecurring: boolean = false,
    scheduleConfig: ScheduleConfig | null = null
  ): Promise<boolean> => {
    if (!companyId || !agentId) return false;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Calculate next execution if recurring
      let nextExecution: string | null = null;
      if (isRecurring && scheduleConfig) {
        nextExecution = calculateNextExecution(scheduleConfig);
      }

      const configData = {
        company_id: companyId,
        agent_id: agentId,
        user_id: userData.user.id,
        configuration: config as Json,
        is_recurring: isRecurring,
        schedule_config: scheduleConfig as unknown as Json,
        next_execution_at: nextExecution,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('company_agent_configurations')
        .upsert(configData, { 
          onConflict: 'company_id,agent_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      setConfiguration({
        ...data,
        configuration: (data.configuration as Record<string, any>) || {},
        schedule_config: data.schedule_config as unknown as ScheduleConfig | null,
        last_execution_result: (data.last_execution_result as Record<string, any>) || null,
      });

      toast({
        title: "Configuración guardada",
        description: "La configuración del agente se ha guardado correctamente",
      });

      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = async (
    scheduleConfig: ScheduleConfig | null,
    isActive: boolean = true
  ): Promise<boolean> => {
    if (!configuration) return false;

    setSaving(true);
    try {
      const nextExecution = scheduleConfig ? calculateNextExecution(scheduleConfig) : null;

      const { error } = await supabase
        .from('company_agent_configurations')
        .update({
          is_recurring: !!scheduleConfig,
          schedule_config: scheduleConfig as unknown as Json,
          next_execution_at: nextExecution,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configuration.id);

      if (error) throw error;

      setConfiguration(prev => prev ? {
        ...prev,
        is_recurring: !!scheduleConfig,
        schedule_config: scheduleConfig,
        next_execution_at: nextExecution,
        is_active: isActive,
      } : null);

      toast({
        title: "Programación actualizada",
        description: scheduleConfig 
          ? "El agente se ejecutará automáticamente según la programación"
          : "La ejecución automática ha sido desactivada",
      });

      return true;
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la programación",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const recordExecution = async (
    status: string,
    outputData: Record<string, any> | null,
    outputSummary: string | null,
    creditsConsumed: number,
    executionTimeMs?: number,
    errorMessage?: string
  ) => {
    if (!configuration) return;

    try {
      // Update configuration with last execution info
      await supabase
        .from('company_agent_configurations')
        .update({
          total_executions: configuration.total_executions + 1,
          last_execution_at: new Date().toISOString(),
          last_execution_status: status,
          last_execution_result: outputData as Json,
          // Calculate next execution if recurring
          next_execution_at: configuration.is_recurring && configuration.schedule_config
            ? calculateNextExecution(configuration.schedule_config)
            : null,
        })
        .eq('id', configuration.id);

      // Reload data
      loadConfiguration();
      loadExecutionHistory();
    } catch (error) {
      console.error('Error recording execution:', error);
    }
  };

  return {
    configuration,
    executionHistory,
    loading,
    saving,
    saveConfiguration,
    updateSchedule,
    recordExecution,
    reload: () => {
      loadConfiguration();
      loadExecutionHistory();
    },
    hasConfiguration: !!configuration,
  };
}

function calculateNextExecution(schedule: ScheduleConfig): string {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If the time has passed today, start from tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  switch (schedule.frequency) {
    case 'daily':
      // Already set to next occurrence
      break;
    
    case 'weekly':
      if (schedule.days && schedule.days.length > 0) {
        // Find the next matching day
        let found = false;
        for (let i = 0; i < 7 && !found; i++) {
          const dayOfWeek = next.getDay();
          if (schedule.days.includes(dayOfWeek)) {
            found = true;
          } else {
            next.setDate(next.getDate() + 1);
          }
        }
      }
      break;
    
    case 'monthly':
      if (schedule.dayOfMonth) {
        next.setDate(schedule.dayOfMonth);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
      }
      break;
  }

  return next.toISOString();
}

export default useAgentConfiguration;
