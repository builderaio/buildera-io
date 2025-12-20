import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyManagement } from '@/hooks/useCompanyManagement';
import { Json } from '@/integrations/supabase/types';

export type JourneyTriggerType = 
  | 'lifecycle_change'
  | 'manual'
  | 'tag_added'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'form_submit'
  | 'inbound_email'
  | 'ai_triggered'
  | 'contact_created'
  | 'activity_completed';

export type JourneyStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface JourneyDefinition {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  status: JourneyStatus;
  trigger_type: JourneyTriggerType;
  trigger_conditions: Json;
  goal_type: string | null;
  goal_conditions: Json;
  allow_re_enrollment: boolean;
  re_enrollment_delay_days: number;
  max_enrollments_per_contact: number;
  entry_segment_conditions: Json;
  exit_conditions: Json;
  is_template: boolean;
  template_category: string | null;
  tags: string[];
  total_enrolled: number;
  total_completed: number;
  total_goal_reached: number;
  conversion_rate: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJourneyInput {
  name: string;
  description?: string;
  trigger_type: JourneyTriggerType;
  trigger_conditions?: Json;
  goal_type?: string;
  goal_conditions?: Json;
  allow_re_enrollment?: boolean;
  entry_segment_conditions?: Json;
  tags?: string[];
}

export interface UpdateJourneyInput extends Partial<CreateJourneyInput> {
  status?: JourneyStatus;
}

export function useJourneyDefinitions() {
  const queryClient = useQueryClient();
  const { primaryCompany } = useCompanyManagement();
  const companyId = primaryCompany?.id;

  // Fetch all journeys for the company
  const journeysQuery = useQuery({
    queryKey: ['journeys', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('journey_definitions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JourneyDefinition[];
    },
    enabled: !!companyId,
  });

  // Fetch a single journey by ID
  const useJourneyById = (journeyId: string | undefined) => {
    return useQuery({
      queryKey: ['journey', journeyId],
      queryFn: async () => {
        if (!journeyId) return null;
        
        const { data, error } = await supabase
          .from('journey_definitions')
          .select('*')
          .eq('id', journeyId)
          .single();

        if (error) throw error;
        return data as JourneyDefinition;
      },
      enabled: !!journeyId,
    });
  };

  // Create a new journey
  const createJourneyMutation = useMutation({
    mutationFn: async (input: CreateJourneyInput) => {
      if (!companyId) throw new Error('No company selected');

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('journey_definitions')
        .insert([{
          company_id: companyId,
          name: input.name,
          description: input.description,
          trigger_type: input.trigger_type,
          trigger_conditions: input.trigger_conditions || {},
          goal_type: input.goal_type,
          goal_conditions: input.goal_conditions || {},
          allow_re_enrollment: input.allow_re_enrollment || false,
          entry_segment_conditions: input.entry_segment_conditions || {},
          tags: input.tags || [],
          created_by: user?.id,
          status: 'draft',
        }])
        .select()
        .single();

      if (error) throw error;
      return data as JourneyDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
    },
  });

  // Update a journey
  const updateJourneyMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateJourneyInput & { id: string }) => {
      const { data, error } = await supabase
        .from('journey_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyDefinition;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journey', data.id] });
    },
  });

  // Delete a journey
  const deleteJourneyMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      const { error } = await supabase
        .from('journey_definitions')
        .delete()
        .eq('id', journeyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
    },
  });

  // Activate a journey
  const activateJourneyMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      const { data, error } = await supabase
        .from('journey_definitions')
        .update({ status: 'active' })
        .eq('id', journeyId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyDefinition;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journey', data.id] });
    },
  });

  // Pause a journey
  const pauseJourneyMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      const { data, error } = await supabase
        .from('journey_definitions')
        .update({ status: 'paused' })
        .eq('id', journeyId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyDefinition;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
      queryClient.invalidateQueries({ queryKey: ['journey', data.id] });
    },
  });

  // Clone a journey
  const cloneJourneyMutation = useMutation({
    mutationFn: async (journeyId: string) => {
      // Fetch the original journey
      const { data: original, error: fetchError } = await supabase
        .from('journey_definitions')
        .select('*')
        .eq('id', journeyId)
        .single();

      if (fetchError) throw fetchError;

      const { data: { user } } = await supabase.auth.getUser();

      // Create a copy
      const { data: clone, error: cloneError } = await supabase
        .from('journey_definitions')
        .insert([{
          company_id: original.company_id,
          name: `${original.name} (Copy)`,
          description: original.description,
          trigger_type: original.trigger_type,
          trigger_conditions: original.trigger_conditions,
          goal_type: original.goal_type,
          goal_conditions: original.goal_conditions,
          allow_re_enrollment: original.allow_re_enrollment,
          re_enrollment_delay_days: original.re_enrollment_delay_days,
          max_enrollments_per_contact: original.max_enrollments_per_contact,
          entry_segment_conditions: original.entry_segment_conditions,
          exit_conditions: original.exit_conditions,
          tags: original.tags,
          created_by: user?.id,
          status: 'draft',
        }])
        .select()
        .single();

      if (cloneError) throw cloneError;

      // Clone steps
      const { data: steps } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId);

      if (steps && steps.length > 0) {
        const stepIdMap: Record<string, string> = {};
        
        // First pass: create steps without references
        for (const step of steps) {
          const newStepId = crypto.randomUUID();
          stepIdMap[step.id] = newStepId;
          
          await supabase
            .from('journey_steps')
            .insert([{
              id: newStepId,
              journey_id: clone.id,
              name: step.name,
              description: step.description,
              position: step.position,
              step_type: step.step_type,
              step_config: step.step_config,
              email_template_id: step.email_template_id,
              email_subject: step.email_subject,
              email_content: step.email_content,
              ai_prompt: step.ai_prompt,
              ai_options: step.ai_options,
              delay_value: step.delay_value,
              delay_unit: step.delay_unit,
              position_x: step.position_x,
              position_y: step.position_y,
            }]);
        }

        // Second pass: update step references
        for (const step of steps) {
          const updates: Record<string, string | null> = {};
          if (step.next_step_id) updates.next_step_id = stepIdMap[step.next_step_id];
          if (step.condition_true_step_id) updates.condition_true_step_id = stepIdMap[step.condition_true_step_id];
          if (step.condition_false_step_id) updates.condition_false_step_id = stepIdMap[step.condition_false_step_id];
          
          if (Object.keys(updates).length > 0) {
            await supabase
              .from('journey_steps')
              .update(updates)
              .eq('id', stepIdMap[step.id]);
          }
        }
      }

      return clone as JourneyDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys', companyId] });
    },
  });

  return {
    // Queries
    journeys: journeysQuery.data || [],
    isLoading: journeysQuery.isLoading,
    error: journeysQuery.error,
    useJourneyById,
    
    // Mutations
    createJourney: createJourneyMutation.mutateAsync,
    updateJourney: updateJourneyMutation.mutateAsync,
    deleteJourney: deleteJourneyMutation.mutateAsync,
    activateJourney: activateJourneyMutation.mutateAsync,
    pauseJourney: pauseJourneyMutation.mutateAsync,
    cloneJourney: cloneJourneyMutation.mutateAsync,
    
    // Mutation states
    isCreating: createJourneyMutation.isPending,
    isUpdating: updateJourneyMutation.isPending,
    isDeleting: deleteJourneyMutation.isPending,
  };
}
