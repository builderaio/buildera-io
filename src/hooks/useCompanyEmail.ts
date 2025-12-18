import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface CompanyEmailConfig {
  id?: string;
  company_id: string;
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_secure: boolean;
  from_email: string | null;
  from_name: string | null;
  is_active: boolean;
  billing_email: string | null;
  notifications_email: string | null;
  support_email: string | null;
  marketing_email: string | null;
  general_email: string | null;
}

const defaultConfig: Omit<CompanyEmailConfig, 'company_id'> = {
  smtp_host: null,
  smtp_port: 587,
  smtp_user: null,
  smtp_password: null,
  smtp_secure: true,
  from_email: null,
  from_name: null,
  is_active: false,
  billing_email: null,
  notifications_email: null,
  support_email: null,
  marketing_email: null,
  general_email: null,
};

export function useCompanyEmail(companyId: string | null) {
  const { t } = useTranslation('common');
  const [config, setConfig] = useState<CompanyEmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const fetchConfig = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_email_config')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as CompanyEmailConfig);
      } else {
        setConfig({ ...defaultConfig, company_id: companyId });
      }
    } catch (error) {
      console.error('Error fetching email config:', error);
      setConfig({ ...defaultConfig, company_id: companyId });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveConfig = async (newConfig: Partial<CompanyEmailConfig>) => {
    if (!companyId || !config) return false;

    setSaving(true);
    try {
      const configToSave = { ...config, ...newConfig, company_id: companyId };
      
      if (config.id) {
        const { error } = await supabase
          .from('company_email_config')
          .update(configToSave)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('company_email_config')
          .insert(configToSave)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setConfig(data as CompanyEmailConfig);
          return true;
        }
      }

      setConfig(configToSave);
      toast.success(t('adn.email.saved'));
      return true;
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error(t('adn.email.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config?.smtp_host || !config?.smtp_user) {
      toast.error(t('adn.email.testMissingFields'));
      return false;
    }

    setTesting(true);
    setConnectionStatus('idle');

    try {
      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        body: {
          host: config.smtp_host,
          port: config.smtp_port,
          user: config.smtp_user,
          password: config.smtp_password,
          secure: config.smtp_secure,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionStatus('success');
        toast.success(t('adn.email.connectionSuccess'));
        return true;
      } else {
        setConnectionStatus('error');
        toast.error(data?.message || t('adn.email.connectionError'));
        return false;
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('error');
      toast.error(t('adn.email.connectionError'));
      return false;
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: keyof CompanyEmailConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  return {
    config,
    loading,
    saving,
    testing,
    connectionStatus,
    saveConfig,
    testConnection,
    updateField,
    refetch: fetchConfig,
  };
}
