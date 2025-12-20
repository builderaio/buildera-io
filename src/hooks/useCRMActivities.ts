import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CRMActivity {
  id: string;
  company_id: string;
  contact_id?: string;
  deal_id?: string;
  account_id?: string;
  activity_type: string;
  subject?: string;
  description?: string;
  activity_date: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  created_by_user_id?: string;
  ai_generated: boolean;
  related_email_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityInput {
  company_id: string;
  contact_id?: string;
  deal_id?: string;
  account_id?: string;
  activity_type: string;
  subject?: string;
  description?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
  ai_generated?: boolean;
}

export const useCRMActivities = (companyId: string | undefined, contactId?: string, dealId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading, refetch } = useQuery({
    queryKey: ['crm-activities', companyId, contactId, dealId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from('crm_activities')
        .select('*')
        .eq('company_id', companyId)
        .order('activity_date', { ascending: false })
        .limit(100);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }
      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CRMActivity[];
    },
    enabled: !!companyId,
  });

  const createActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          ...input,
          created_by_user_id: user.user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', companyId] });
      toast({ title: 'Actividad registrada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const completeActivity = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('crm_activities')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', companyId] });
      toast({ title: 'Actividad completada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities', companyId] });
      toast({ title: 'Actividad eliminada' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Get pending tasks
  const { data: pendingTasks } = useQuery({
    queryKey: ['crm-pending-tasks', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('company_id', companyId)
        .eq('activity_type', 'task')
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as CRMActivity[];
    },
    enabled: !!companyId,
  });

  return {
    activities: activities || [],
    pendingTasks: pendingTasks || [],
    isLoading,
    refetch,
    createActivity,
    completeActivity,
    deleteActivity,
  };
};
