import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MarketingGoals {
  id: string;
  company_id: string;
  primary_goal: string | null;
  secondary_goals: string[] | null;
  target_audience_size: number | null;
  monthly_lead_target: number | null;
  monthly_conversion_target: number | null;
  brand_awareness_target: number | null;
  engagement_rate_target: number | null;
  kpis: any[];
  campaign_budget_monthly: number | null;
  growth_timeline: string | null;
  created_at: string;
  updated_at: string;
}

export const useMarketingGoals = (companyId: string | null) => {
  const [goals, setGoals] = useState<MarketingGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGoals = useCallback(async () => {
    if (!companyId) {
      setGoals(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_marketing_goals')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setGoals({
          ...data,
          kpis: (data.kpis as any[]) || [],
        });
      } else {
        setGoals(null);
      }
    } catch (err) {
      console.error('Error loading marketing goals:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const saveGoals = async (updates: Partial<MarketingGoals>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_marketing_goals')
        .upsert({
          company_id: companyId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (error) throw error;
      await loadGoals();
    } catch (err) {
      console.error('Error saving marketing goals:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { goals, loading, saving, saveGoals, refetch: loadGoals };
};
