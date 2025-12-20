import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface CRMContact {
  id: string;
  company_id: string;
  account_id?: string;
  business_type: 'b2c' | 'b2b';
  contact_type: 'lead' | 'customer' | 'churned' | 'prospect';
  lifecycle_stage: 'subscriber' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer' | 'evangelist';
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  job_title?: string;
  department?: string;
  linkedin_url?: string;
  birthdate?: string;
  gender?: string;
  location?: string;
  city?: string;
  country?: string;
  source: string;
  source_details?: Json;
  lifetime_value: number;
  acquisition_cost: number;
  engagement_score: number;
  ai_enrichment?: Json;
  ai_tags?: string[];
  ai_next_best_action?: string;
  last_ai_analysis?: string;
  custom_fields?: Json;
  tags?: string[];
  is_subscribed_email: boolean;
  is_subscribed_sms: boolean;
  owner_user_id?: string;
  is_active: boolean;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  company_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  business_type?: 'b2c' | 'b2b';
  contact_type?: 'lead' | 'customer' | 'churned' | 'prospect';
  lifecycle_stage?: string;
  account_id?: string;
  job_title?: string;
  department?: string;
  source?: string;
  tags?: string[];
  custom_fields?: Json;
}

export interface ContactFilters {
  search?: string;
  business_type?: 'b2c' | 'b2b' | 'all';
  contact_type?: string;
  lifecycle_stage?: string;
  tags?: string[];
}

export const useCRMContacts = (companyId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ContactFilters>({});

  const { data: contacts, isLoading, error, refetch } = useQuery({
    queryKey: ['crm-contacts', companyId, filters],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.business_type && filters.business_type !== 'all') {
        query = query.eq('business_type', filters.business_type);
      }
      if (filters.contact_type) {
        query = query.eq('contact_type', filters.contact_type);
      }
      if (filters.lifecycle_stage) {
        query = query.eq('lifecycle_stage', filters.lifecycle_stage);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CRMContact[];
    },
    enabled: !!companyId,
  });

  const createContact = useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', companyId] });
      toast({ title: 'Contacto creado', description: 'El contacto se ha creado exitosamente' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMContact> & { id: string }) => {
      // Convert to database-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', companyId] });
      toast({ title: 'Contacto actualizado' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_contacts')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-contacts', companyId] });
      toast({ title: 'Contacto eliminado' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getContactById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as CRMContact;
  }, []);

  const getContactStats = useCallback(async () => {
    if (!companyId) return null;
    
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('contact_type, lifecycle_stage, business_type')
      .eq('company_id', companyId)
      .eq('is_active', true);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      byType: {} as Record<string, number>,
      byStage: {} as Record<string, number>,
      byBusinessType: { b2c: 0, b2b: 0 }
    };
    
    data.forEach(contact => {
      stats.byType[contact.contact_type] = (stats.byType[contact.contact_type] || 0) + 1;
      stats.byStage[contact.lifecycle_stage] = (stats.byStage[contact.lifecycle_stage] || 0) + 1;
      if (contact.business_type === 'b2c' || contact.business_type === 'b2b') {
        stats.byBusinessType[contact.business_type]++;
      }
    });
    
    return stats;
  }, [companyId]);

  return {
    contacts: contacts || [],
    isLoading,
    error,
    filters,
    setFilters,
    refetch,
    createContact,
    updateContact,
    deleteContact,
    getContactById,
    getContactStats,
  };
};
