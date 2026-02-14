import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically advance journey_current_step based on user milestones.
 * Step 1: Registration completed
 * Step 2: Onboarding/diagnostic completed
 * Step 3: First social network connected
 * Step 4: First content published
 * Step 5: Autopilot activated
 */
export const useJourneyProgression = (companyId?: string) => {
  const advanceToStep = useCallback(async (step: number) => {
    if (!companyId) return;
    
    try {
      // Only advance forward, never go back
      const { data: company } = await supabase
        .from('companies')
        .select('journey_current_step')
        .eq('id', companyId)
        .single();

      const currentStep = company?.journey_current_step || 1;
      if (step <= currentStep) return;

      await supabase
        .from('companies')
        .update({ 
          journey_current_step: step,
          ...(step === 5 ? { journey_completed_at: new Date().toISOString() } : {})
        })
        .eq('id', companyId);

      console.log(`✅ Journey advanced to step ${step}`);
    } catch (error) {
      console.error('Error advancing journey step:', error);
    }
  }, [companyId]);

  const checkAndAdvance = useCallback(async () => {
    if (!companyId) return;

    try {
      const [socialRes, postsRes, autopilotRes, deptRes, strategyRes] = await Promise.all([
        supabase.from('social_accounts').select('id').eq('is_connected', true).limit(1),
        supabase.from('scheduled_posts').select('id').limit(1),
        supabase.from('company_autopilot_config').select('autopilot_enabled').eq('company_id', companyId).eq('autopilot_enabled', true).maybeSingle(),
        supabase.from('company_department_config').select('id').eq('company_id', companyId).eq('autopilot_enabled', true).limit(1),
        // Step 2: Check if onboarding/diagnostic was completed
        supabase.from('company_strategy').select('id').eq('company_id', companyId).maybeSingle(),
      ]);

      // Step 2: Onboarding completed (strategy or digital presence exists)
      if (strategyRes.data) {
        await advanceToStep(2);
      }

      // Step 5: ANY autopilot active (marketing OR enterprise department)
      const anyAutopilotActive = !!autopilotRes.data || (deptRes.data?.length || 0) > 0;

      if (anyAutopilotActive) {
        await advanceToStep(5);
      } else if ((postsRes.data?.length || 0) > 0) {
        await advanceToStep(4);
      } else if ((socialRes.data?.length || 0) > 0) {
        await advanceToStep(3);
      }
    } catch (error) {
      console.error('Error checking journey progression:', error);
    }
  }, [companyId, advanceToStep]);

  return { advanceToStep, checkAndAdvance };
};
