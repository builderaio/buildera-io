import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GuidedStep {
  id: number;
  title: string;
  description: string;
  target_section: string;
  action_required: string;
  validation_query?: string;
  completed: boolean;
}

interface UseGuidedTourReturn {
  currentStep: number;
  steps: GuidedStep[];
  isGuideModeActive: boolean;
  completedSteps: number[];
  loading: boolean;
  startGuidedTour: () => void;
  completeStep: (stepId: number) => Promise<void>;
  skipTour: () => Promise<void>;
  showGuideAgain: () => void;
  checkStepCompletion: (stepId: number) => Promise<boolean>;
  getNextIncompleteStep: () => GuidedStep | null;
}

export const useGuidedTour = (userId: string | undefined): UseGuidedTourReturn => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isGuideModeActive, setIsGuideModeActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const steps: GuidedStep[] = [
    {
      id: 1,
      title: "Actualizar Información Empresarial",
      description: "Completa el perfil de tu empresa en ADN Empresarial para personalizar todas las herramientas",
      target_section: "adn-empresa",
      action_required: "Completar información básica de la empresa",
      validation_query: "company_strategy",
      completed: false
    },
    {
      id: 2,
      title: "Conectar Redes Sociales",
      description: "Conecta tus cuentas de LinkedIn, Instagram, Facebook y TikTok en el Marketing Hub",
      target_section: "marketing-hub",
      action_required: "Conectar al menos una red social",
      validation_query: "social_connections",
      completed: false
    },
    {
      id: 3,
      title: "Actualizar URLs de Redes",
      description: "Verifica y actualiza las URLs de tus redes sociales en la configuración",
      target_section: "configuracion",
      action_required: "Configurar URLs válidas de redes sociales",
      validation_query: "company_social_urls",
      completed: false
    },
    {
      id: 4,
      title: "Analizar Audiencias",
      description: "Ejecuta el análisis de audiencias para entender mejor a tus seguidores",
      target_section: "inteligencia-competitiva",
      action_required: "Ejecutar análisis de audiencia",
      validation_query: "audience_analysis",
      completed: false
    },
    {
      id: 5,
      title: "Crear Audiencias Personalizadas",
      description: "Define audiencias específicas basadas en los análisis realizados",
      target_section: "inteligencia-competitiva",
      action_required: "Crear al menos una audiencia personalizada",
      validation_query: "custom_audiences",
      completed: false
    },
    {
      id: 6,
      title: "Analizar Contenido Existente",
      description: "Analiza tu contenido actual para identificar patrones y oportunidades",
      target_section: "marketing-hub",
      action_required: "Ejecutar análisis de contenido",
      validation_query: "content_analysis",
      completed: false
    },
    {
      id: 7,
      title: "Crear Contenido Simple",
      description: "Genera tu primer contenido usando las herramientas de IA",
      target_section: "marketing-hub",
      action_required: "Crear y publicar contenido",
      validation_query: "generated_content",
      completed: false
    },
    {
      id: 8,
      title: "Crear Campañas de Marketing",
      description: "Diseña tu primera campaña usando el Campaign Wizard",
      target_section: "marketing-hub",
      action_required: "Completar una campaña",
      validation_query: "marketing_campaigns",
      completed: false
    },
    {
      id: 9,
      title: "Contratar Agentes Especializados",
      description: "Explora y contrata agentes IA especializados en el Marketplace",
      target_section: "marketplace",
      action_required: "Contratar al menos un agente",
      validation_query: "hired_agents",
      completed: false
    }
  ];

  useEffect(() => {
    if (userId) {
      loadTourProgress();
    }
  }, [userId]);

  const loadTourProgress = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Verificar si el usuario ya completó el tour
      const { data: tourStatus, error } = await supabase
        .from('user_guided_tour')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading tour progress:', error);
        return;
      }

      if (tourStatus) {
        setCompletedSteps(tourStatus.completed_steps || []);
        setCurrentStep(tourStatus.current_step || 1);
        setIsGuideModeActive(!tourStatus.tour_completed);
      } else {
        // Usuario nuevo, verificar si necesita tour
        const shouldShowTour = await checkIfUserNeedsTour();
        setIsGuideModeActive(shouldShowTour);
      }
    } catch (error) {
      console.error('Error in loadTourProgress:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfUserNeedsTour = async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Verificar si el usuario completó onboarding recientemente
      const { data: onboardingStatus } = await supabase
        .from('user_onboarding_status')
        .select('onboarding_completed_at, dna_empresarial_completed')
        .eq('user_id', userId)
        .single();

      // Si completó onboarding en las últimas 48 horas, mostrar tour
      if (onboardingStatus?.onboarding_completed_at) {
        const completedDate = new Date(onboardingStatus.onboarding_completed_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 3600);
        return hoursDiff <= 48;
      }

      return false;
    } catch (error) {
      console.error('Error checking if user needs tour:', error);
      return false;
    }
  };

  const startGuidedTour = async () => {
    if (!userId) return;

    try {
      setIsGuideModeActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);

      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: 1,
          completed_steps: [],
          tour_started_at: new Date().toISOString(),
          tour_completed: false
        }, {
          onConflict: 'user_id'
        });

      toast({
        title: "¡Tour Iniciado!",
        description: "Era te acompañará paso a paso en tu experiencia",
      });
    } catch (error) {
      console.error('Error starting guided tour:', error);
    }
  };

  const checkStepCompletion = async (stepId: number): Promise<boolean> => {
    if (!userId) return false;

    const step = steps.find(s => s.id === stepId);
    if (!step) return false;

    try {
      switch (step.validation_query) {
        case 'company_strategy':
          const { data: strategy } = await supabase
            .from('company_strategy')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          return !!strategy;

        case 'social_connections':
          const [linkedin, facebook, tiktok] = await Promise.all([
            supabase.from('linkedin_connections').select('id').eq('user_id', userId).limit(1),
            supabase.from('facebook_instagram_connections').select('id').eq('user_id', userId).limit(1),
            supabase.from('tiktok_connections').select('id').eq('user_id', userId).limit(1)
          ]);
          return (linkedin.data?.length || 0) > 0 || 
                 (facebook.data?.length || 0) > 0 || 
                 (tiktok.data?.length || 0) > 0;

        case 'company_social_urls':
          const { data: company } = await supabase
            .from('companies')
            .select('linkedin_url, facebook_url, instagram_url, tiktok_url')
            .eq('created_by', userId)
            .maybeSingle();
          
          if (!company) return false;
          
          const validUrls = [
            company.linkedin_url,
            company.facebook_url,
            company.instagram_url,
            company.tiktok_url
          ].filter(url => url && url !== 'No tiene' && url.trim() !== '');
          
          return validUrls.length > 0;

        case 'audience_analysis':
          const { data: audienceAnalysis } = await supabase
            .from('audience_analysis')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          return (audienceAnalysis?.length || 0) > 0;

        case 'custom_audiences':
          const { data: customAudiences } = await supabase
            .from('custom_audiences')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          return (customAudiences?.length || 0) > 0;

        case 'content_analysis':
          const { data: contentAnalysis } = await supabase
            .from('content_insights')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          return (contentAnalysis?.length || 0) > 0;

        case 'generated_content':
          const [posts, tiktokPosts, instagramPosts] = await Promise.all([
            supabase.from('linkedin_posts').select('id').eq('user_id', userId).limit(1),
            supabase.from('tiktok_posts').select('id').eq('user_id', userId).limit(1),
            supabase.from('instagram_posts').select('id').eq('user_id', userId).limit(1)
          ]);
          return (posts.data?.length || 0) > 0 || 
                 (tiktokPosts.data?.length || 0) > 0 || 
                 (instagramPosts.data?.length || 0) > 0;

        case 'marketing_campaigns':
          const { data: campaigns } = await supabase
            .from('marketing_campaigns')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          return (campaigns?.length || 0) > 0;

        case 'hired_agents':
          const { data: hiredAgents } = await supabase
            .from('user_hired_agents')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          return (hiredAgents?.length || 0) > 0;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking step ${stepId} completion:`, error);
      return false;
    }
  };

  const completeStep = async (stepId: number) => {
    if (!userId || completedSteps.includes(stepId)) return;

    try {
      const newCompletedSteps = [...completedSteps, stepId];
      const nextStep = stepId + 1;
      
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(nextStep);

      // Si es el último paso, completar el tour
      const allStepsCompleted = newCompletedSteps.length === steps.length;
      
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: allStepsCompleted ? stepId : nextStep,
          completed_steps: newCompletedSteps,
          tour_completed: allStepsCompleted,
          updated_at: new Date().toISOString(),
          ...(allStepsCompleted && { tour_completed_at: new Date().toISOString() })
        }, {
          onConflict: 'user_id'
        });

      if (allStepsCompleted) {
        setIsGuideModeActive(false);
        toast({
          title: "¡Felicitaciones!",
          description: "Has completado el tour guiado. Ahora Era estará disponible como asistente cuando lo necesites.",
        });
      } else {
        toast({
          title: "¡Paso Completado!",
          description: `Excelente progreso. Paso ${stepId} de ${steps.length} completado.`,
        });
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const skipTour = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          tour_completed: true,
          tour_skipped: true,
          tour_completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      setIsGuideModeActive(false);
      
      toast({
        title: "Tour Omitido",
        description: "Puedes reactivar el tour cuando quieras desde la configuración.",
      });
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const showGuideAgain = async () => {
    if (!userId) return;

    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          tour_completed: false,
          tour_skipped: false,
          current_step: 1,
          completed_steps: [],
          tour_started_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      setIsGuideModeActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);
      
      toast({
        title: "Tour Reactivado",
        description: "Era volverá a acompañarte paso a paso.",
      });
    } catch (error) {
      console.error('Error reactivating tour:', error);
    }
  };

  const getNextIncompleteStep = (): GuidedStep | null => {
    return steps.find(step => !completedSteps.includes(step.id)) || null;
  };

  return {
    currentStep,
    steps: steps.map(step => ({
      ...step,
      completed: completedSteps.includes(step.id)
    })),
    isGuideModeActive,
    completedSteps,
    loading,
    startGuidedTour,
    completeStep,
    skipTour,
    showGuideAgain,
    checkStepCompletion,
    getNextIncompleteStep
  };
};