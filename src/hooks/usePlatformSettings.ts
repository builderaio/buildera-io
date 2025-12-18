import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformSetting {
  id: string;
  company_id: string;
  platform: string;
  is_active: boolean;
  auto_publish: boolean;
  require_approval: boolean;
  max_posts_per_day: number;
  preferred_content_types: string[] | null;
  character_limit_override: number | null;
  hashtag_limit: number | null;
  default_visibility: string;
  scheduling_enabled: boolean;
  analytics_tracking: boolean;
  custom_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'youtube'];

export const usePlatformSettings = (companyId: string | null) => {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!companyId) {
      setSettings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_platform_settings')
        .select('*')
        .eq('company_id', companyId)
        .order('platform', { ascending: true });

      if (error) throw error;
      
      const existingPlatforms = data?.map(s => s.platform) || [];
      const settingsWithCustom = (data || []).map(item => ({
        ...item,
        custom_settings: (item.custom_settings as Record<string, any>) || {},
      }));
      
      setSettings(settingsWithCustom);
    } catch (err) {
      console.error('Error loading platform settings:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const savePlatformSetting = async (platform: string, updates: Partial<PlatformSetting>) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_platform_settings')
        .upsert({
          company_id: companyId,
          platform,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,platform' });

      if (error) throw error;
      await loadSettings();
    } catch (err) {
      console.error('Error saving platform setting:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const deletePlatformSetting = async (platform: string) => {
    if (!companyId) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('company_platform_settings')
        .delete()
        .eq('company_id', companyId)
        .eq('platform', platform);

      if (error) throw error;
      await loadSettings();
    } catch (err) {
      console.error('Error deleting platform setting:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const getSettingForPlatform = (platform: string) => {
    return settings.find(s => s.platform === platform) || null;
  };

  return { 
    settings, 
    loading, 
    saving, 
    savePlatformSetting, 
    deletePlatformSetting, 
    getSettingForPlatform,
    availablePlatforms: PLATFORMS,
    refetch: loadSettings 
  };
};
