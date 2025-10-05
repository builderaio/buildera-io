import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: number;
  shouldShowGuide: boolean;
  loading: boolean;
  refreshOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
  userId?: string;
}

export const OnboardingProvider = ({ children, userId }: OnboardingProviderProps) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [shouldShowGuide, setShouldShowGuide] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshOnboardingStatus = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    console.group('🔄 [OnboardingContext] Fetching status');
    console.log('User ID:', userId);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const { data, error } = await supabase
        .from('user_onboarding_status')
        .select('dna_empresarial_completed, onboarding_completed_at, current_step')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching onboarding status:', error);
        setIsOnboardingComplete(false);
      } else {
        const hasCompletedOnboarding = data?.onboarding_completed_at || data?.dna_empresarial_completed;
        setIsOnboardingComplete(!!hasCompletedOnboarding);
        setCurrentStep(data?.current_step || 1);
        
        // Verificar si debe mostrar guía (completó onboarding recientemente y no completó el tour)
        let showGuide = false;
        if (hasCompletedOnboarding) {
          const { data: tourData } = await supabase
            .from('user_guided_tour')
            .select('tour_completed')
            .eq('user_id', userId)
            .maybeSingle();
          
          showGuide = !tourData?.tour_completed;
        }
        
        setShouldShowGuide(showGuide);

        console.log('✅ Status loaded:', {
          isComplete: !!hasCompletedOnboarding,
          currentStep: data?.current_step || 1,
          shouldShowGuide: showGuide
        });
      }
    } catch (error) {
      console.error('❌ Exception in refreshOnboardingStatus:', error);
      setIsOnboardingComplete(false);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    refreshOnboardingStatus();

    // Listener para cambios de estado
    const handleOnboardingComplete = () => {
      console.log('🔄 [OnboardingContext] Event: onboarding-completed');
      refreshOnboardingStatus();
    };

    window.addEventListener('onboarding-completed', handleOnboardingComplete);

    return () => {
      window.removeEventListener('onboarding-completed', handleOnboardingComplete);
    };
  }, [userId]);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        currentStep,
        shouldShowGuide,
        loading,
        refreshOnboardingStatus
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
