import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentPreferences {
  id: string;
  company_id: string;
  default_creativity_level: number;
  default_content_length: string;
  preferred_ai_model: string | null;
  auto_approve_content: boolean;
  require_human_review: boolean;
  max_daily_executions: number;
  notification_preferences: {
    on_completion: boolean;
    on_error: boolean;
    daily_summary: boolean;
  };
  content_guidelines: string | null;
  quality_threshold: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_NOTIFICATION_PREFS = {
  on_completion: true,
  on_error: true,
  daily_summary: true,
};

export const useAgentPreferences = (companyId: string | null) => {
  const [preferences, setPreferences] = useState<AgentPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    if (!companyId) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_agent_preferences')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPreferences({
          ...data,
          notification_preferences: (data.notification_preferences as AgentPreferences['notification_preferences']) || DEFAULT_NOTIFICATION_PREFS,
        });
      } else {
        setPreferences(null);
      }
    } catch (err) {
      console.error('Error loading agent preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (updates: Partial<AgentPreferences>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_agent_preferences')
        .upsert({
          company_id: companyId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (error) throw error;
      await loadPreferences();
    } catch (err) {
      console.error('Error saving agent preferences:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { preferences, loading, saving, savePreferences, refetch: loadPreferences };
};
