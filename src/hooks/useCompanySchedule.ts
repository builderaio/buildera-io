import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyScheduleConfig {
  id: string;
  company_id: string;
  timezone: string;
  business_hours_start: string;
  business_hours_end: string;
  working_days: number[];
  preferred_posting_times: Record<string, string[]>;
  content_frequency: Record<string, number>;
  created_at: string;
  updated_at: string;
}

const DEFAULT_POSTING_TIMES = {
  instagram: ['09:00', '13:00', '19:00'],
  facebook: ['10:00', '14:00', '20:00'],
  linkedin: ['08:00', '12:00', '17:00'],
  tiktok: ['12:00', '18:00', '21:00'],
  twitter: ['09:00', '12:00', '18:00'],
};

const DEFAULT_FREQUENCY = {
  instagram: 5,
  facebook: 3,
  linkedin: 2,
  tiktok: 7,
  twitter: 5,
};

export const useCompanySchedule = (companyId: string | null) => {
  const [config, setConfig] = useState<CompanyScheduleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    if (!companyId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_schedule_config')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig({
          ...data,
          preferred_posting_times: (data.preferred_posting_times as Record<string, string[]>) || DEFAULT_POSTING_TIMES,
          content_frequency: (data.content_frequency as Record<string, number>) || DEFAULT_FREQUENCY,
        });
      } else {
        setConfig(null);
      }
    } catch (err) {
      console.error('Error loading schedule config:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = async (updates: Partial<CompanyScheduleConfig>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_schedule_config')
        .upsert({
          company_id: companyId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (error) throw error;
      await loadConfig();
    } catch (err) {
      console.error('Error saving schedule config:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { config, loading, saving, saveConfig, refetch: loadConfig };
};
