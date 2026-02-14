import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Json } from '@/integrations/supabase/types';

export interface CRMAccount {
  id: string;
  company_id: string;
  account_name: string;
  legal_name?: string;
  tax_id?: string;
  industry?: string;
  company_size?: string;
  employee_count?: number;
  website?: string;
  linkedin_url?: string;
  account_type: 'prospect' | 'customer' | 'partner' | 'churned';
  account_tier: 'enterprise' | 'mid_market' | 'smb' | 'startup';
  country?: string;
  city?: string;
  address?: string;
  timezone?: string;
  annual_revenue?: number;
  lifetime_value: number;
  billing_currency: string;
  primary_contact_id?: string;
  owner_user_id?: string;
  ai_enrichment?: Json;
  custom_fields?: Json;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  company_id: string;
  account_name: string;
  legal_name?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  account_type?: 'prospect' | 'customer' | 'partner' | 'churned';
  account_tier?: 'enterprise' | 'mid_market' | 'smb' | 'startup';
  country?: string;
  city?: string;
}

export const useCRMAccounts = (companyId: string | undefined) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ['crm-accounts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('crm_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CRMAccount[];
    },
    enabled: !!companyId,
  });

  const createAccount = useMutation({
    mutationFn: async (input: CreateAccountInput) => {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-accounts', companyId] });
      toast({ title: t('toast.crm.accountCreated') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMAccount> & { id: string }) => {
      // Convert to database-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-accounts', companyId] });
      toast({ title: t('toast.crm.accountUpdated') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_accounts')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-accounts', companyId] });
      toast({ title: t('toast.crm.accountDeleted') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  const getAccountContacts = async (accountId: string) => {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true);
    if (error) throw error;
    return data;
  };

  const getAccountDeals = async (accountId: string) => {
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('account_id', accountId);
    if (error) throw error;
    return data;
  };

  return {
    accounts: accounts || [],
    isLoading,
    refetch,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountContacts,
    getAccountDeals,
  };
};
