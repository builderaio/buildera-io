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
    totalCredits: 100,
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

      // Check sessionStorage cache for subscription status
      const CACHE_KEY = 'subscription-status-cache';
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      let cachedSubscription: any = null;
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL) {
            cachedSubscription = { data: parsed.data, error: null };
          }
        }
      } catch {}

      // Fetch usage data and subscription plan credits in parallel
      const [usageResult, subscriptionResult] = await Promise.all([
        supabase
          .from('agent_usage_log')
          .select('credits_consumed, created_at, agent_id')
          .eq('company_id', companyId)
          .gte('created_at', startOfMonth.toISOString())
          .order('created_at', { ascending: false }),
        cachedSubscription || supabase.functions.invoke('check-subscription-status'),
      ]);

      // Cache result if freshly fetched
      if (!cachedSubscription && subscriptionResult.data) {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: subscriptionResult.data,
            timestamp: Date.now()
          }));
        } catch {}
      }

      if (usageResult.error) {
        console.error('Error fetching usage:', usageResult.error);
        setLoading(false);
        return;
      }

      const usageData = usageResult.data;

      // Get total credits from subscription plan
      let totalCredits = 100; // Default fallback
      if (subscriptionResult.data?.limits?.credits_monthly) {
        const planCredits = subscriptionResult.data.limits.credits_monthly;
        totalCredits = planCredits === -1 ? Infinity : planCredits;
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

      setCredits({
        totalCredits: totalCredits === Infinity ? -1 : totalCredits,
        usedCredits,
        availableCredits: totalCredits === Infinity ? Infinity : Math.max(0, totalCredits - usedCredits),
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
