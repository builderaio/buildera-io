import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunicationSettings {
  id: string;
  company_id: string;
  forbidden_words: string[] | null;
  approved_slogans: string[] | null;
  hashtag_strategy: {
    always_use: string[];
    never_use: string[];
    campaign_specific: string[];
  };
  tone_by_platform: Record<string, string>;
  emoji_usage: string;
  language_formality: string;
  call_to_action_phrases: string[] | null;
  content_pillars: string[] | null;
  topics_to_avoid: string[] | null;
  response_templates: any[];
  created_at: string;
  updated_at: string;
}

const DEFAULT_TONE_BY_PLATFORM = {
  instagram: 'casual',
  facebook: 'friendly',
  linkedin: 'professional',
  tiktok: 'fun',
  twitter: 'conversational',
};

const DEFAULT_HASHTAG_STRATEGY = {
  always_use: [],
  never_use: [],
  campaign_specific: [],
};

export const useCommunicationSettings = (companyId: string | null) => {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!companyId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_communication_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          ...data,
          hashtag_strategy: (data.hashtag_strategy as CommunicationSettings['hashtag_strategy']) || DEFAULT_HASHTAG_STRATEGY,
          tone_by_platform: (data.tone_by_platform as Record<string, string>) || DEFAULT_TONE_BY_PLATFORM,
          response_templates: (data.response_templates as any[]) || [],
        });
      } else {
        setSettings(null);
      }
    } catch (err) {
      console.error('Error loading communication settings:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (updates: Partial<CommunicationSettings>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_communication_settings')
        .upsert({
          company_id: companyId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (error) throw error;
      await loadSettings();
    } catch (err) {
      console.error('Error saving communication settings:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, saveSettings, refetch: loadSettings };
};
