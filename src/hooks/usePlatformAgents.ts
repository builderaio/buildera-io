import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformAgent {
  id: string;
  internal_code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  execution_type: string;
  edge_function_name: string;
  credits_per_use: number;
  is_premium: boolean;
  min_plan_required: string;
  is_onboarding_agent: boolean;
  sort_order: number;
  is_active: boolean;
  input_schema?: any;
  output_schema?: any;
  sample_output?: any;
  recurring_capable?: boolean;
  // Dynamic payload mapping fields
  context_requirements?: any;
  payload_template?: any;
}

interface EnabledAgent {
  agent_id: string;
  enabled_at: string;
}

export const usePlatformAgents = (companyId?: string) => {
  const [agents, setAgents] = useState<PlatformAgent[]>([]);
  const [enabledAgents, setEnabledAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener todos los agentes activos
      const { data: agentsData, error: agentsError } = await supabase
        .from('platform_agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (agentsError) throw agentsError;

      setAgents(agentsData || []);

      // Si hay companyId, obtener agentes habilitados
      if (companyId) {
        const { data: enabledData, error: enabledError } = await supabase
          .from('company_enabled_agents')
          .select('agent_id')
          .eq('company_id', companyId);

        if (enabledError) throw enabledError;

        setEnabledAgents((enabledData || []).map(e => e.agent_id));
      }

    } catch (err) {
      console.error('Error fetching agents:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const enableAgent = useCallback(async (agentId: string, userId: string) => {
    if (!companyId) return false;

    try {
      const { error } = await supabase
        .from('company_enabled_agents')
        .insert({
          company_id: companyId,
          agent_id: agentId,
          enabled_by: userId
        });

      if (error) throw error;

      setEnabledAgents(prev => [...prev, agentId]);
      return true;
    } catch (err) {
      console.error('Error enabling agent:', err);
      return false;
    }
  }, [companyId]);

  const disableAgent = useCallback(async (agentId: string) => {
    if (!companyId) return false;

    try {
      const { error } = await supabase
        .from('company_enabled_agents')
        .delete()
        .eq('company_id', companyId)
        .eq('agent_id', agentId);

      if (error) throw error;

      setEnabledAgents(prev => prev.filter(id => id !== agentId));
      return true;
    } catch (err) {
      console.error('Error disabling agent:', err);
      return false;
    }
  }, [companyId]);

  const isAgentEnabled = useCallback((agentId: string) => {
    return enabledAgents.includes(agentId);
  }, [enabledAgents]);

  const getAgentsByCategory = useCallback((category: string) => {
    return agents.filter(a => a.category === category);
  }, [agents]);

  const getOnboardingAgents = useCallback(() => {
    return agents.filter(a => a.is_onboarding_agent);
  }, [agents]);

  const getPremiumAgents = useCallback(() => {
    return agents.filter(a => a.is_premium);
  }, [agents]);

  return {
    agents,
    enabledAgents,
    loading,
    error,
    enableAgent,
    disableAgent,
    isAgentEnabled,
    getAgentsByCategory,
    getOnboardingAgents,
    getPremiumAgents,
    refetch: fetchAgents
  };
};
