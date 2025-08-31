import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingStatus = (userId?: string) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_onboarding_status')
          .select('dna_empresarial_completed, onboarding_completed_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboardingComplete(false);
        } else {
          // Usuario completa onboarding si tiene onboarding_completed_at O si tiene dna_empresarial_completed
          const hasCompletedOnboarding = data?.onboarding_completed_at || data?.dna_empresarial_completed;
          setIsOnboardingComplete(!!hasCompletedOnboarding);
        }
      } catch (error) {
        console.error('Error in checkOnboardingStatus:', error);
        setIsOnboardingComplete(false);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [userId]);

  return { isOnboardingComplete, loading };
};