import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CreditUsage {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  usageHistory: {
    date: string;
    credits: number;
    agentName: string;
  }[];
}

export const useCompanyCredits = (companyId?: string, userId?: string) => {
  const [credits, setCredits] = useState<CreditUsage>({
    totalCredits: 100, // Default credits for free tier
    usedCredits: 0,
    availableCredits: 100,
    usageHistory: []
  });
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!companyId || !userId) {
      setLoading(false);
      return;
    }

    try {
      // Get usage from agent_usage_log for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usageData, error } = await supabase
        .from('agent_usage_log')
        .select(`
          credits_consumed,
          created_at,
          agent_id
        `)
        .eq('company_id', companyId)
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching usage:', error);
        setLoading(false);
        return;
      }

      // Get agent names
      const agentIds = [...new Set(usageData?.map(log => log.agent_id).filter(Boolean) || [])];
      let agentNames: Record<string, string> = {};
      
      if (agentIds.length > 0) {
        const { data: agents } = await supabase
          .from('platform_agents')
          .select('id, name')
          .in('id', agentIds);
        
        agentNames = (agents || []).reduce((acc, agent) => {
          acc[agent.id] = agent.name;
          return acc;
        }, {} as Record<string, string>);
      }

      const usedCredits = usageData?.reduce((sum, log) => sum + (log.credits_consumed || 0), 0) || 0;
      const totalCredits = 100; // TODO: Get from subscription plan

      setCredits({
        totalCredits,
        usedCredits,
        availableCredits: Math.max(0, totalCredits - usedCredits),
        usageHistory: usageData?.slice(0, 10).map(log => ({
          date: log.created_at || '',
          credits: log.credits_consumed || 0,
          agentName: log.agent_id ? agentNames[log.agent_id] || 'Agente' : 'Unknown'
        })) || []
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, userId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    ...credits,
    loading,
    refetch: fetchCredits
  };
};

export default useCompanyCredits;
