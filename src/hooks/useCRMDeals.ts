import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Json } from '@/integrations/supabase/types';

export interface CRMDeal {
  id: string;
  company_id: string;
  contact_id?: string;
  account_id?: string;
  pipeline_id: string;
  stage_id: string;
  deal_name: string;
  description?: string;
  amount: number;
  currency: string;
  expected_close_date?: string;
  actual_close_date?: string;
  status: 'open' | 'won' | 'lost';
  probability: number;
  weighted_amount: number;
  loss_reason?: string;
  products?: Json;
  owner_user_id?: string;
  ai_predictions?: Json;
  custom_fields?: Json;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CRMPipeline {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  pipeline_type: string;
  is_default: boolean;
  is_active: boolean;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export interface CRMPipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  stage_type: 'open' | 'won' | 'lost';
  default_probability: number;
  auto_actions?: Json;
  created_at: string;
  updated_at: string;
}

export interface CreateDealInput {
  company_id: string;
  pipeline_id: string;
  stage_id: string;
  deal_name: string;
  contact_id?: string;
  account_id?: string;
  amount?: number;
  currency?: string;
  expected_close_date?: string;
  probability?: number;
  description?: string;
}

export const useCRMDeals = (companyId: string | undefined) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  // Fetch pipelines
  const { data: pipelines, isLoading: pipelinesLoading } = useQuery({
    queryKey: ['crm-pipelines', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });
      if (error) throw error;
      return data as CRMPipeline[];
    },
    enabled: !!companyId,
  });

  // Fetch stages for selected pipeline
  const { data: stages, isLoading: stagesLoading } = useQuery({
    queryKey: ['crm-pipeline-stages', selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return [];
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipelineId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as CRMPipelineStage[];
    },
    enabled: !!selectedPipelineId,
  });

  // Fetch deals
  const { data: deals, isLoading: dealsLoading, refetch: refetchDeals } = useQuery({
    queryKey: ['crm-deals', companyId, selectedPipelineId],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from('crm_deals')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (selectedPipelineId) {
        query = query.eq('pipeline_id', selectedPipelineId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CRMDeal[];
    },
    enabled: !!companyId,
  });

  // Create pipeline
  const createPipeline = useMutation({
    mutationFn: async (input: { company_id: string; name: string; pipeline_type?: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .insert([input])
        .select()
        .single();
      if (error) throw error;

      // Create default stages
      const defaultStages = [
        { pipeline_id: data.id, name: 'Nuevo', position: 0, stage_type: 'open' as const, default_probability: 10, color: '#6B7280' },
        { pipeline_id: data.id, name: 'Contactado', position: 1, stage_type: 'open' as const, default_probability: 25, color: '#3B82F6' },
        { pipeline_id: data.id, name: 'Propuesta', position: 2, stage_type: 'open' as const, default_probability: 50, color: '#8B5CF6' },
        { pipeline_id: data.id, name: 'Negociación', position: 3, stage_type: 'open' as const, default_probability: 75, color: '#F59E0B' },
        { pipeline_id: data.id, name: 'Ganado', position: 4, stage_type: 'won' as const, default_probability: 100, color: '#10B981' },
        { pipeline_id: data.id, name: 'Perdido', position: 5, stage_type: 'lost' as const, default_probability: 0, color: '#EF4444' },
      ];

      await supabase.from('crm_pipeline_stages').insert(defaultStages);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-pipelines', companyId] });
      toast({ title: t('toast.crm.pipelineCreated') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  // Create deal
  const createDeal = useMutation({
    mutationFn: async (input: CreateDealInput) => {
      const { data, error } = await supabase
        .from('crm_deals')
        .insert([input])
        .select()
        .single();
      if (error) throw error;

      // Log activity
      await supabase.from('crm_activities').insert([{
        company_id: input.company_id,
        contact_id: input.contact_id,
        deal_id: data.id,
        activity_type: 'deal_created',
        subject: `Deal creado: ${input.deal_name}`,
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', companyId] });
      toast({ title: t('toast.crm.dealCreated') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  // Update deal / move stage
  const updateDeal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMDeal> & { id: string }) => {
      // Convert to database-compatible format
      const dbUpdates: Record<string, unknown> = { ...updates };
      
      const { data, error } = await supabase
        .from('crm_deals')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Log stage change if applicable
      if (updates.stage_id) {
        await supabase.from('crm_activities').insert([{
          company_id: data.company_id,
          contact_id: data.contact_id,
          deal_id: id,
          activity_type: 'stage_change',
          subject: 'Etapa cambiada',
          metadata: { new_stage_id: updates.stage_id } as Json,
        }]);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', companyId] });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  // Close deal (won/lost)
  const closeDeal = useMutation({
    mutationFn: async ({ id, status, loss_reason }: { id: string; status: 'won' | 'lost'; loss_reason?: string }) => {
      const updates: Record<string, unknown> = {
        status,
        actual_close_date: new Date().toISOString().split('T')[0],
        probability: status === 'won' ? 100 : 0,
      };
      if (loss_reason) updates.loss_reason = loss_reason;

      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('crm_activities').insert([{
        company_id: data.company_id,
        contact_id: data.contact_id,
        deal_id: id,
        activity_type: status === 'won' ? 'deal_won' : 'deal_lost',
        subject: status === 'won' ? 'Deal ganado' : 'Deal perdido',
        metadata: { loss_reason } as Json,
      }]);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-deals', companyId] });
      toast({ title: data.status === 'won' ? t('toast.crm.dealWon') : t('toast.crm.dealLost') });
    },
    onError: (error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  // Get pipeline metrics
  const getPipelineMetrics = async () => {
    if (!companyId || !selectedPipelineId) return null;

    const { data: pipelineDeals } = await supabase
      .from('crm_deals')
      .select('amount, weighted_amount, status, stage_id')
      .eq('company_id', companyId)
      .eq('pipeline_id', selectedPipelineId);

    if (!pipelineDeals) return null;

    const openDeals = pipelineDeals.filter(d => d.status === 'open');
    const wonDeals = pipelineDeals.filter(d => d.status === 'won');
    
    return {
      totalValue: openDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      weightedValue: openDeals.reduce((sum, d) => sum + (d.weighted_amount || 0), 0),
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
      winRate: pipelineDeals.length > 0 
        ? (wonDeals.length / pipelineDeals.filter(d => d.status !== 'open').length * 100) || 0
        : 0,
    };
  };

  return {
    pipelines: pipelines || [],
    stages: stages || [],
    deals: deals || [],
    selectedPipelineId,
    setSelectedPipelineId,
    isLoading: pipelinesLoading || stagesLoading || dealsLoading,
    createPipeline,
    createDeal,
    updateDeal,
    closeDeal,
    refetchDeals,
    getPipelineMetrics,
  };
};
