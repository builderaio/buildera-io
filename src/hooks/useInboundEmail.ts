import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface InboundMailboxConfig {
  email: string | null;
  forwarding_enabled: boolean;
  agent_processing: boolean;
}

export interface InboundEmailConfig {
  id?: string;
  company_id: string;
  
  // Mailbox configurations
  billing: InboundMailboxConfig;
  notifications: InboundMailboxConfig;
  support: InboundMailboxConfig;
  marketing: InboundMailboxConfig;
  general: InboundMailboxConfig;
  
  // SendGrid configuration
  sendgrid_inbound_enabled: boolean;
  sendgrid_parse_domain: string | null;
  sendgrid_webhook_secret: string | null;
  
  // Global settings
  is_active: boolean;
  auto_categorize: boolean;
  retention_days: number;
}

export interface InboundEmail {
  id: string;
  company_id: string;
  mailbox_type: 'billing' | 'notifications' | 'support' | 'marketing' | 'general';
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  attachments: any[];
  received_at: string;
  processed_at: string | null;
  processing_status: 'pending' | 'processing' | 'processed' | 'failed' | 'archived';
  agent_id: string | null;
  agent_analysis: any;
  agent_actions_taken: any[];
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  tags: string[];
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  notes: string | null;
}

const defaultConfig: Omit<InboundEmailConfig, 'company_id'> = {
  billing: { email: null, forwarding_enabled: false, agent_processing: false },
  notifications: { email: null, forwarding_enabled: false, agent_processing: false },
  support: { email: null, forwarding_enabled: false, agent_processing: false },
  marketing: { email: null, forwarding_enabled: false, agent_processing: false },
  general: { email: null, forwarding_enabled: false, agent_processing: false },
  sendgrid_inbound_enabled: false,
  sendgrid_parse_domain: null,
  sendgrid_webhook_secret: null,
  is_active: false,
  auto_categorize: true,
  retention_days: 90,
};

// Transform database row to config object
const transformDbToConfig = (data: any, companyId: string): InboundEmailConfig => ({
  id: data.id,
  company_id: companyId,
  billing: {
    email: data.billing_email,
    forwarding_enabled: data.billing_forwarding_enabled ?? false,
    agent_processing: data.billing_agent_processing ?? false,
  },
  notifications: {
    email: data.notifications_email,
    forwarding_enabled: data.notifications_forwarding_enabled ?? false,
    agent_processing: data.notifications_agent_processing ?? false,
  },
  support: {
    email: data.support_email,
    forwarding_enabled: data.support_forwarding_enabled ?? false,
    agent_processing: data.support_agent_processing ?? false,
  },
  marketing: {
    email: data.marketing_email,
    forwarding_enabled: data.marketing_forwarding_enabled ?? false,
    agent_processing: data.marketing_agent_processing ?? false,
  },
  general: {
    email: data.general_email,
    forwarding_enabled: data.general_forwarding_enabled ?? false,
    agent_processing: data.general_agent_processing ?? false,
  },
  sendgrid_inbound_enabled: data.sendgrid_inbound_enabled ?? false,
  sendgrid_parse_domain: data.sendgrid_parse_domain,
  sendgrid_webhook_secret: data.sendgrid_webhook_secret,
  is_active: data.is_active ?? false,
  auto_categorize: data.auto_categorize ?? true,
  retention_days: data.retention_days ?? 90,
});

// Transform config to database format
const transformConfigToDb = (config: InboundEmailConfig) => ({
  company_id: config.company_id,
  billing_email: config.billing.email,
  billing_forwarding_enabled: config.billing.forwarding_enabled,
  billing_agent_processing: config.billing.agent_processing,
  notifications_email: config.notifications.email,
  notifications_forwarding_enabled: config.notifications.forwarding_enabled,
  notifications_agent_processing: config.notifications.agent_processing,
  support_email: config.support.email,
  support_forwarding_enabled: config.support.forwarding_enabled,
  support_agent_processing: config.support.agent_processing,
  marketing_email: config.marketing.email,
  marketing_forwarding_enabled: config.marketing.forwarding_enabled,
  marketing_agent_processing: config.marketing.agent_processing,
  general_email: config.general.email,
  general_forwarding_enabled: config.general.forwarding_enabled,
  general_agent_processing: config.general.agent_processing,
  sendgrid_inbound_enabled: config.sendgrid_inbound_enabled,
  sendgrid_parse_domain: config.sendgrid_parse_domain,
  sendgrid_webhook_secret: config.sendgrid_webhook_secret,
  is_active: config.is_active,
  auto_categorize: config.auto_categorize,
  retention_days: config.retention_days,
});

export function useInboundEmail(companyId: string | null) {
  const { t } = useTranslation('common');
  const [config, setConfig] = useState<InboundEmailConfig | null>(null);
  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailStats, setEmailStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    byMailbox: {} as Record<string, number>,
  });

  const fetchConfig = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('company_inbound_email_config')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(transformDbToConfig(data, companyId));
      } else {
        setConfig({ ...defaultConfig, company_id: companyId });
      }
    } catch (error) {
      console.error('Error fetching inbound email config:', error);
      setConfig({ ...defaultConfig, company_id: companyId });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchEmails = useCallback(async (filters?: {
    mailbox?: string;
    status?: string;
    limit?: number;
  }) => {
    if (!companyId) return;

    try {
      let query = supabase
        .from('company_inbound_emails')
        .select('*')
        .eq('company_id', companyId)
        .order('received_at', { ascending: false });

      if (filters?.mailbox) {
        query = query.eq('mailbox_type', filters.mailbox);
      }
      if (filters?.status) {
        query = query.eq('processing_status', filters.status);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmails(data as InboundEmail[] || []);
    } catch (error) {
      console.error('Error fetching inbound emails:', error);
    }
  }, [companyId]);

  const fetchStats = useCallback(async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('company_inbound_emails')
        .select('id, is_read, processing_status, mailbox_type')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(e => !e.is_read).length || 0,
        pending: data?.filter(e => e.processing_status === 'pending').length || 0,
        byMailbox: (data || []).reduce((acc, e) => {
          acc[e.mailbox_type] = (acc[e.mailbox_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      setEmailStats(stats);
    } catch (error) {
      console.error('Error fetching email stats:', error);
    }
  }, [companyId]);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  const saveConfig = async (updates: Partial<InboundEmailConfig>) => {
    if (!companyId || !config) return false;

    setSaving(true);
    try {
      const updatedConfig = { ...config, ...updates };
      const dbData = transformConfigToDb(updatedConfig);

      if (config.id) {
        const { error } = await supabase
          .from('company_inbound_email_config')
          .update(dbData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('company_inbound_email_config')
          .insert(dbData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setConfig(transformDbToConfig(data, companyId));
          return true;
        }
      }

      setConfig(updatedConfig);
      toast.success(t('adn.email.saved'));
      return true;
    } catch (error) {
      console.error('Error saving inbound email config:', error);
      toast.error(t('adn.email.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateMailbox = async (
    mailboxType: keyof Pick<InboundEmailConfig, 'billing' | 'notifications' | 'support' | 'marketing' | 'general'>,
    updates: Partial<InboundMailboxConfig>
  ) => {
    if (!config) return false;
    
    const currentMailbox = config[mailboxType];
    const updatedMailbox = { ...currentMailbox, ...updates };
    
    return saveConfig({ [mailboxType]: updatedMailbox });
  };

  const markEmailAsRead = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('company_inbound_emails')
        .update({ is_read: true })
        .eq('id', emailId);

      if (error) throw error;
      
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, is_read: true } : e
      ));
      fetchStats();
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const toggleEmailStar = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;

    try {
      const { error } = await supabase
        .from('company_inbound_emails')
        .update({ is_starred: !email.is_starred })
        .eq('id', emailId);

      if (error) throw error;
      
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, is_starred: !e.is_starred } : e
      ));
    } catch (error) {
      console.error('Error toggling email star:', error);
    }
  };

  const archiveEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('company_inbound_emails')
        .update({ is_archived: true })
        .eq('id', emailId);

      if (error) throw error;
      
      setEmails(prev => prev.filter(e => e.id !== emailId));
      fetchStats();
      toast.success(t('adn.email.inbound.archived'));
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  return {
    config,
    emails,
    emailStats,
    loading,
    saving,
    saveConfig,
    updateMailbox,
    fetchEmails,
    fetchStats,
    markEmailAsRead,
    toggleEmailStar,
    archiveEmail,
    refetch: fetchConfig,
  };
}
