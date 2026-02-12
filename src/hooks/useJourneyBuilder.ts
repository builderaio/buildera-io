import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export type JourneyStepType = 
  | 'send_email'
  | 'delay'
  | 'condition'
  | 'ai_decision'
  | 'update_contact'
  | 'create_activity'
  | 'move_deal_stage'
  | 'add_tag'
  | 'remove_tag'
  | 'webhook'
  | 'enroll_in_journey'
  | 'exit'
  // Social automation types
  | 'social_reply'
  | 'social_dm'
  | 'create_post';

export interface JourneyStep {
  id: string;
  journey_id: string;
  name: string;
  description: string | null;
  position: number;
  step_type: JourneyStepType;
  step_config: Json;
  email_template_id: string | null;
  email_subject: string | null;
  email_content: string | null;
  next_step_id: string | null;
  condition_true_step_id: string | null;
  condition_false_step_id: string | null;
  ai_prompt: string | null;
  ai_options: Json;
  delay_value: number | null;
  delay_unit: string | null;
  position_x: number;
  position_y: number;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStepInput {
  journey_id: string;
  name: string;
  description?: string;
  step_type: JourneyStepType;
  step_config?: Json;
  position?: number;
  position_x?: number;
  position_y?: number;
  
  // Email specific
  email_subject?: string;
  email_content?: string;
  email_template_id?: string;
  
  // Delay specific
  delay_value?: number;
  delay_unit?: string;
  
  // AI specific
  ai_prompt?: string;
  ai_options?: Json;
  
  // Flow control
  next_step_id?: string;
  condition_true_step_id?: string;
  condition_false_step_id?: string;
}

export interface UpdateStepInput extends Partial<Omit<CreateStepInput, 'journey_id'>> {
  id: string;
}

export function useJourneyBuilder(journeyId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch all steps for a journey
  const stepsQuery = useQuery({
    queryKey: ['journey-steps', journeyId],
    queryFn: async () => {
      if (!journeyId) return [];
      
      const { data, error } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('journey_id', journeyId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as JourneyStep[];
    },
    enabled: !!journeyId,
  });

  // Create a new step
  const createStepMutation = useMutation({
    mutationFn: async (input: CreateStepInput) => {
      const { data, error } = await supabase
        .from('journey_steps')
        .insert([{
          journey_id: input.journey_id,
          name: input.name,
          description: input.description,
          step_type: input.step_type as any,
          step_config: input.step_config || {},
          position: input.position || 0,
          position_x: input.position_x || 0,
          position_y: input.position_y || 0,
          email_subject: input.email_subject,
          email_content: input.email_content,
          email_template_id: input.email_template_id,
          delay_value: input.delay_value,
          delay_unit: input.delay_unit,
          ai_prompt: input.ai_prompt,
          ai_options: input.ai_options || {},
          next_step_id: input.next_step_id,
          condition_true_step_id: input.condition_true_step_id,
          condition_false_step_id: input.condition_false_step_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as JourneyStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Update a step
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStepInput) => {
      const { data, error } = await supabase
        .from('journey_steps')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Delete a step
  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from('journey_steps')
        .delete()
        .eq('id', stepId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Connect two steps
  const connectStepsMutation = useMutation({
    mutationFn: async ({ 
      sourceId, 
      targetId, 
      connectionType = 'next' 
    }: { 
      sourceId: string; 
      targetId: string; 
      connectionType?: 'next' | 'condition_true' | 'condition_false';
    }) => {
      const updates: Record<string, string> = {};
      
      switch (connectionType) {
        case 'next':
          updates.next_step_id = targetId;
          break;
        case 'condition_true':
          updates.condition_true_step_id = targetId;
          break;
        case 'condition_false':
          updates.condition_false_step_id = targetId;
          break;
      }
      
      const { data, error } = await supabase
        .from('journey_steps')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Disconnect steps
  const disconnectStepsMutation = useMutation({
    mutationFn: async ({ 
      sourceId, 
      connectionType = 'next' 
    }: { 
      sourceId: string; 
      connectionType?: 'next' | 'condition_true' | 'condition_false';
    }) => {
      const updates: Record<string, null> = {};
      
      switch (connectionType) {
        case 'next':
          updates.next_step_id = null;
          break;
        case 'condition_true':
          updates.condition_true_step_id = null;
          break;
        case 'condition_false':
          updates.condition_false_step_id = null;
          break;
      }
      
      const { data, error } = await supabase
        .from('journey_steps')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Update step positions (for drag & drop)
  const updatePositionsMutation = useMutation({
    mutationFn: async (updates: { id: string; position_x: number; position_y: number }[]) => {
      const promises = updates.map(({ id, position_x, position_y }) =>
        supabase
          .from('journey_steps')
          .update({ position_x, position_y })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-steps', journeyId] });
    },
  });

  // Validate the journey flow
  const validateJourney = (): { valid: boolean; errors: string[] } => {
    const steps = stepsQuery.data || [];
    const errors: string[] = [];

    if (steps.length === 0) {
      errors.push('El journey debe tener al menos un paso');
      return { valid: false, errors };
    }

    // Find entry points (steps not referenced by others)
    const referencedIds = new Set<string>();
    steps.forEach(step => {
      if (step.next_step_id) referencedIds.add(step.next_step_id);
      if (step.condition_true_step_id) referencedIds.add(step.condition_true_step_id);
      if (step.condition_false_step_id) referencedIds.add(step.condition_false_step_id);
    });

    const entryPoints = steps.filter(s => !referencedIds.has(s.id));
    if (entryPoints.length === 0) {
      errors.push('No se encontró punto de entrada (todos los pasos están conectados en ciclo)');
    } else if (entryPoints.length > 1) {
      errors.push('Hay múltiples puntos de entrada. El journey debe tener un único inicio.');
    }

    // Check for orphan steps (not connected to anything)
    steps.forEach(step => {
      if (step.step_type !== 'exit') {
        const hasNext = step.next_step_id || 
                       step.condition_true_step_id || 
                       step.condition_false_step_id;
        if (!hasNext) {
          errors.push(`El paso "${step.name}" no tiene siguiente paso definido`);
        }
      }
    });

    // Validate condition steps have both branches
    steps.forEach(step => {
      if (step.step_type === 'condition' || step.step_type === 'ai_decision') {
        if (!step.condition_true_step_id || !step.condition_false_step_id) {
          errors.push(`El paso "${step.name}" debe tener ambas ramas definidas (verdadero/falso)`);
        }
      }
    });

    // Validate email steps have content
    steps.forEach(step => {
      if (step.step_type === 'send_email') {
        if (!step.email_subject || !step.email_content) {
          errors.push(`El paso de email "${step.name}" debe tener asunto y contenido`);
        }
      }
    });

    // Validate delay steps have values
    steps.forEach(step => {
      if (step.step_type === 'delay') {
        if (!step.delay_value || !step.delay_unit) {
          errors.push(`El paso de delay "${step.name}" debe tener valor y unidad definidos`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // Get the first step (entry point)
  const getEntryStep = (): JourneyStep | null => {
    const steps = stepsQuery.data || [];
    const referencedIds = new Set<string>();
    
    steps.forEach(step => {
      if (step.next_step_id) referencedIds.add(step.next_step_id);
      if (step.condition_true_step_id) referencedIds.add(step.condition_true_step_id);
      if (step.condition_false_step_id) referencedIds.add(step.condition_false_step_id);
    });

    return steps.find(s => !referencedIds.has(s.id)) || null;
  };

  return {
    // Data
    steps: stepsQuery.data || [],
    isLoading: stepsQuery.isLoading,
    error: stepsQuery.error,
    
    // Mutations
    createStep: createStepMutation.mutateAsync,
    updateStep: updateStepMutation.mutateAsync,
    deleteStep: deleteStepMutation.mutateAsync,
    connectSteps: connectStepsMutation.mutateAsync,
    disconnectSteps: disconnectStepsMutation.mutateAsync,
    updatePositions: updatePositionsMutation.mutateAsync,
    
    // Helpers
    validateJourney,
    getEntryStep,
    
    // States
    isCreating: createStepMutation.isPending,
    isUpdating: updateStepMutation.isPending,
    isDeleting: deleteStepMutation.isPending,
  };
}
