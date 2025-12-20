import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyManagement } from '@/hooks/useCompanyManagement';
import { Json } from '@/integrations/supabase/types';

export type EnrollmentStatus = 'active' | 'completed' | 'goal_reached' | 'exited' | 'failed' | 'paused';

export interface JourneyEnrollment {
  id: string;
  journey_id: string;
  contact_id: string;
  company_id: string;
  status: EnrollmentStatus;
  current_step_id: string | null;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  exited_at: string | null;
  goal_reached_at: string | null;
  enrollment_source: string | null;
  enrolled_by: string | null;
  exit_reason: string | null;
  context: Json;
  steps_completed: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentWithContact extends JourneyEnrollment {
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  current_step?: {
    id: string;
    name: string;
    step_type: string;
  };
}

export interface StepExecution {
  id: string;
  enrollment_id: string;
  step_id: string;
  status: 'pending' | 'scheduled' | 'executing' | 'executed' | 'failed' | 'skipped';
  scheduled_for: string | null;
  started_at: string | null;
  executed_at: string | null;
  result: Json;
  error_message: string | null;
  retry_count: number;
  decision_made: string | null;
  decision_reason: string | null;
  email_message_id: string | null;
  email_status: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useJourneyEnrollments(journeyId?: string) {
  const queryClient = useQueryClient();
  const { primaryCompany } = useCompanyManagement();
  const companyId = primaryCompany?.id;

  // Fetch enrollments for a specific journey
  const enrollmentsQuery = useQuery({
    queryKey: ['journey-enrollments', journeyId],
    queryFn: async () => {
      if (!journeyId) return [];
      
      const { data, error } = await supabase
        .from('journey_enrollments')
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, email, avatar_url),
          current_step:journey_steps(id, name, step_type)
        `)
        .eq('journey_id', journeyId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data as EnrollmentWithContact[];
    },
    enabled: !!journeyId,
  });

  // Fetch all active enrollments across all journeys for the company
  const allActiveEnrollmentsQuery = useQuery({
    queryKey: ['all-active-enrollments', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('journey_enrollments')
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, email),
          journey:journey_definitions(id, name)
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('enrolled_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch executions for an enrollment
  const useEnrollmentExecutions = (enrollmentId: string | undefined) => {
    return useQuery({
      queryKey: ['enrollment-executions', enrollmentId],
      queryFn: async () => {
        if (!enrollmentId) return [];
        
        const { data, error } = await supabase
          .from('journey_step_executions')
          .select(`
            *,
            step:journey_steps(id, name, step_type)
          `)
          .eq('enrollment_id', enrollmentId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
      },
      enabled: !!enrollmentId,
    });
  };

  // Manually enroll a contact in a journey
  const enrollContactMutation = useMutation({
    mutationFn: async ({ 
      journeyId, 
      contactId, 
      context = {} 
    }: { 
      journeyId: string; 
      contactId: string; 
      context?: Json;
    }) => {
      if (!companyId) throw new Error('No company selected');

      const { data: { user } } = await supabase.auth.getUser();

      // Get the first step of the journey
      const { data: steps } = await supabase
        .from('journey_steps')
        .select('id')
        .eq('journey_id', journeyId)
        .order('position', { ascending: true })
        .limit(1);

      const firstStepId = steps?.[0]?.id || null;

      const { data, error } = await supabase
        .from('journey_enrollments')
        .insert([{
          journey_id: journeyId,
          contact_id: contactId,
          company_id: companyId,
          current_step_id: firstStepId,
          enrollment_source: 'manual',
          enrolled_by: user?.id,
          context: context,
          status: 'active',
          started_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Create the first step execution
      if (firstStepId) {
        await supabase
          .from('journey_step_executions')
          .insert([{
            enrollment_id: data.id,
            step_id: firstStepId,
            status: 'pending',
          }]);
      }

      return data as JourneyEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments', journeyId] });
      queryClient.invalidateQueries({ queryKey: ['all-active-enrollments', companyId] });
    },
  });

  // Exit a contact from a journey
  const exitEnrollmentMutation = useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      reason 
    }: { 
      enrollmentId: string; 
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('journey_enrollments')
        .update({
          status: 'exited',
          exit_reason: reason,
          exited_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments', journeyId] });
      queryClient.invalidateQueries({ queryKey: ['all-active-enrollments', companyId] });
    },
  });

  // Pause an enrollment
  const pauseEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data, error } = await supabase
        .from('journey_enrollments')
        .update({ status: 'paused' })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments', journeyId] });
      queryClient.invalidateQueries({ queryKey: ['all-active-enrollments', companyId] });
    },
  });

  // Resume an enrollment
  const resumeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { data, error } = await supabase
        .from('journey_enrollments')
        .update({ status: 'active' })
        .eq('id', enrollmentId)
        .select()
        .single();

      if (error) throw error;
      return data as JourneyEnrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-enrollments', journeyId] });
      queryClient.invalidateQueries({ queryKey: ['all-active-enrollments', companyId] });
    },
  });

  // Get enrollment stats for a journey
  const useJourneyStats = (jId: string | undefined) => {
    return useQuery({
      queryKey: ['journey-stats', jId],
      queryFn: async () => {
        if (!jId) return null;
        
        const { data, error } = await supabase
          .from('journey_enrollments')
          .select('status')
          .eq('journey_id', jId);

        if (error) throw error;

        const stats = {
          total: data.length,
          active: data.filter(e => e.status === 'active').length,
          completed: data.filter(e => e.status === 'completed').length,
          goal_reached: data.filter(e => e.status === 'goal_reached').length,
          exited: data.filter(e => e.status === 'exited').length,
          failed: data.filter(e => e.status === 'failed').length,
          paused: data.filter(e => e.status === 'paused').length,
        };

        return stats;
      },
      enabled: !!jId,
    });
  };

  return {
    // Data
    enrollments: enrollmentsQuery.data || [],
    allActiveEnrollments: allActiveEnrollmentsQuery.data || [],
    isLoading: enrollmentsQuery.isLoading,
    error: enrollmentsQuery.error,
    
    // Sub-queries
    useEnrollmentExecutions,
    useJourneyStats,
    
    // Mutations
    enrollContact: enrollContactMutation.mutateAsync,
    exitEnrollment: exitEnrollmentMutation.mutateAsync,
    pauseEnrollment: pauseEnrollmentMutation.mutateAsync,
    resumeEnrollment: resumeEnrollmentMutation.mutateAsync,
    
    // States
    isEnrolling: enrollContactMutation.isPending,
    isExiting: exitEnrollmentMutation.isPending,
  };
}
