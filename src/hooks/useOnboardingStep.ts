import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingStep = (userId?: string) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Obtener el paso actual del usuario
  const fetchCurrentStep = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_onboarding_status')
        .select('current_step')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current step:', error);
        return;
      }

      if (data?.current_step) {
        setCurrentStep(data.current_step);
      }
    } catch (error) {
      console.error('Error in fetchCurrentStep:', error);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar el paso actual en la base de datos
  const updateCurrentStep = async (step: number) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_onboarding_status')
        .upsert({
          user_id: userId,
          current_step: step,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating current step:', error);
        return;
      }

      setCurrentStep(step);
      console.log(`✅ Paso de onboarding actualizado a: ${step}`);
    } catch (error) {
      console.error('Error in updateCurrentStep:', error);
    }
  };

  // Avanzar al siguiente paso
  const nextStep = () => {
    const nextStepNumber = currentStep + 1;
    updateCurrentStep(nextStepNumber);
  };

  // Ir a un paso específico
  const goToStep = (step: number) => {
    updateCurrentStep(step);
  };

  useEffect(() => {
    if (userId) {
      fetchCurrentStep();
    }
  }, [userId]);

  return {
    currentStep,
    loading,
    updateCurrentStep,
    nextStep,
    goToStep,
    refreshStep: fetchCurrentStep
  };
};