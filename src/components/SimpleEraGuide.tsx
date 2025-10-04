import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStepVerifications } from '@/hooks/useStepVerifications';
import { 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  Sparkles,
  MessageCircle,
  Zap,
  Settings,
  BarChart3,
  Users,
  FileText,
  Megaphone,
  ShoppingCart,
  Loader2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GuideStep {
  id: number;
  title: string;
  what: string; // QUÉ harás
  why: string;  // POR QUÉ es importante
  how: string;  // CÓMO hacerlo
  target_section: string;
  tab?: string;
  completed: boolean;
  icon: any;
  actionText: string;
  verificationText: string;
  color: string;
  requiresManualCompletion?: boolean;
}

interface SimpleEraGuideProps {
  userId: string;
  currentSection: string;
  onNavigate: (section: string, params?: Record<string, string>) => void;
}

const SimpleEraGuide = ({ userId, currentSection, onNavigate }: SimpleEraGuideProps) => {
  const { toast } = useToast();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryData, setRecoveryData] = useState<any>(null);
  
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const verifications = useStepVerifications(userId);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Completa el ADN de tu Empresa",
      what: "Configura la información esencial de tu negocio.",
      why: "Esto permite que Era personalice todo el contenido y estrategias según tu identidad de marca única.",
      how: "Ve a ADN Empresa y completa tu misión, valores y productos/servicios. Sin esto, las recomendaciones serán genéricas.",
      target_section: "adn-empresa",
      completed: false,
      icon: Settings,
      actionText: "Ir a ADN Empresa",
      verificationText: "Verificar completado",
      color: "from-blue-500 to-blue-600",
      requiresManualCompletion: false
    },
    {
      id: 2,
      title: "Conecta tus Redes Sociales",
      what: "Vincula al menos una red social (LinkedIn, Instagram, Facebook o TikTok).",
      why: "Esto permite que Era analice tu audiencia actual, rendimiento de contenido y cree publicaciones optimizadas.",
      how: "Ve a Configuración en Marketing Hub y presiona 'Conectar' en al menos una plataforma. Recomendamos conectar todas las que uses.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: Zap,
      actionText: "Ir a Configuración",
      verificationText: "Verificar conexión",
      color: "from-green-500 to-green-600",
      requiresManualCompletion: false
    },
    {
      id: 3,
      title: "Configura URLs de tus Perfiles",
      what: "Agrega las URLs públicas de tus perfiles en redes sociales.",
      why: "Esto permite que Era analice tu contenido publicado y genere insights precisos sobre tu estrategia actual.",
      how: "En Configuración → Conexiones de Redes Sociales, agrega las URLs de tus perfiles conectados.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: MessageCircle,
      actionText: "Ir a Configuración",
      verificationText: "Verificar URLs",
      color: "from-purple-500 to-purple-600",
      requiresManualCompletion: false
    },
    {
      id: 4,
      title: "Analiza tu Audiencia",
      what: "Descubre quién conforma tu audiencia actual.",
      why: "Conocer demografía, intereses y comportamientos te permite crear contenido que realmente resuene con tu público.",
      how: "Ve a Audiencias y presiona 'Analizar con IA'. Era procesará tus datos y generará insights detallados.",
      target_section: "audiencias-manager",
      completed: false,
      icon: BarChart3,
      actionText: "Ir a Audiencias",
      verificationText: "Verificar análisis",
      color: "from-orange-500 to-orange-600",
      requiresManualCompletion: false
    },
    {
      id: 5,
      title: "Evalúa tu Contenido Existente",
      what: "Analiza el rendimiento de tus publicaciones anteriores.",
      why: "Identifica qué tipo de contenido funciona mejor para optimizar tu estrategia futura y aumentar el engagement.",
      how: "Ve a Análisis de Contenido e inicia el análisis. Era evaluará tus posts y te mostrará qué formatos y temas resonan más.",
      target_section: "content-analysis-dashboard",
      completed: false,
      icon: FileText,
      actionText: "Ir a Análisis de Contenido",
      verificationText: "Verificar análisis",
      color: "from-cyan-500 to-cyan-600",
      requiresManualCompletion: false
    },
    {
      id: 6,
      title: "Crea Segmentos de Audiencia",
      what: "Define buyer personas específicos por red social.",
      why: "Cada plataforma tiene diferentes audiencias. Personalizar tu mensaje por segmento aumenta la efectividad de tus campañas.",
      how: "En Audiencias, crea personas basados en los insights obtenidos. Define demografía, intereses y comportamientos específicos.",
      target_section: "audiencias-manager",
      completed: false,
      icon: Users,
      actionText: "Ir a Audiencias",
      verificationText: "Verificar segmentos",
      color: "from-pink-500 to-pink-600",
      requiresManualCompletion: false
    },
    {
      id: 7,
      title: "Diseña tu Primera Campaña",
      what: "Crea una campaña de marketing completa guiada por Era.",
      why: "Las campañas estructuradas generan mejores resultados que publicaciones aisladas. Era te ayudará a definir objetivos claros.",
      how: "Ve a Marketing Hub → Campañas y usa el asistente. Define objetivos, audiencia, estrategia y calendario de contenido.",
      target_section: "marketing-hub",
      completed: false,
      icon: Megaphone,
      actionText: "Ir a Campañas",
      verificationText: "✓ Completé este paso",
      color: "from-red-500 to-red-600",
      requiresManualCompletion: false
    },
    {
      id: 8,
      title: "Genera tu Primer Contenido con IA",
      what: "Crea publicaciones optimizadas usando la IA de Era.",
      why: "Ahorra tiempo y genera contenido profesional adaptado a cada plataforma y audiencia específica.",
      how: "Ve a Marketing Hub → Crear y selecciona el tipo de contenido. Era generará publicaciones listas para programar o publicar.",
      target_section: "marketing-hub",
      tab: "create",
      completed: false,
      icon: Sparkles,
      actionText: "Ir a Crear Contenido",
      verificationText: "Verificar contenido",
      color: "from-yellow-500 to-yellow-600",
      requiresManualCompletion: false
    },
    {
      id: 9,
      title: "Explora el Marketplace de Agentes",
      what: "Descubre agentes especializados para tu negocio.",
      why: "Amplía las capacidades de tu empresa con agentes de IA para ventas, atención al cliente, análisis y más.",
      how: "Visita el Marketplace y explora los agentes disponibles. Encuentra soluciones específicas para tus necesidades.",
      target_section: "marketplace",
      completed: false,
      icon: ShoppingCart,
      actionText: "Ir al Marketplace",
      verificationText: "✓ Completé este paso",
      color: "from-indigo-500 to-indigo-600",
      requiresManualCompletion: true
    }
  ];

  // Auto-save cada 30 segundos
  useEffect(() => {
    if (!isActive || !userId) return;

    autoSaveIntervalRef.current = setInterval(() => {
      console.log('💾 Auto-guardando progreso del tour...');
      saveTourState(true);
    }, 30000); // 30 segundos

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [isActive, userId, currentStep, completedSteps]);

  // Guardar antes de navegar
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId) {
        saveTourState(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (userId) {
        saveTourState(true);
      }
    };
  }, [userId, currentStep, completedSteps]);

  useEffect(() => {
    loadTourProgress();
  }, [userId]);

  const loadTourProgress = async () => {
    if (!userId) return;

    try {
      const { data: tourStatus } = await supabase
        .from('user_guided_tour')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tourStatus) {
        const hasProgress = (tourStatus.completed_steps?.length || 0) > 0;
        const isCompleted = tourStatus.tour_completed;

        // Si hay progreso pero no está completado, mostrar diálogo de recuperación
        if (hasProgress && !isCompleted) {
          setRecoveryData(tourStatus);
          setShowRecoveryDialog(true);
        } else if (isCompleted) {
          // Tour completado, no activar
          setIsActive(false);
        } else {
          // Sin progreso, verificar si es nuevo usuario
          await checkIfNewUser();
        }

        setCompletedSteps(tourStatus.completed_steps || []);
        setCurrentStep(tourStatus.current_step || 1);
      } else {
        // Sin registro, verificar si es nuevo usuario
        await checkIfNewUser();
      }
    } catch (error) {
      console.error('Error loading tour progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfNewUser = async () => {
    try {
      const { data: onboarding } = await supabase
        .from('user_onboarding_status')
        .select('onboarding_completed_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (onboarding?.onboarding_completed_at) {
        const completedDate = new Date(onboarding.onboarding_completed_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 3600);
        
        // Mostrar bienvenida para usuarios recientes (dentro de 7 días)
        if (hoursDiff <= 168) {
          setShowWelcome(true);
          setIsActive(false); // No activar hasta que acepte la bienvenida
        }
      }
    } catch (error) {
      console.error('Error checking new user:', error);
    }
  };

  const saveTourState = async (silent: boolean = false) => {
    if (!userId) return;

    try {
      const stateToSave = {
        user_id: userId,
        current_step: currentStep,
        completed_steps: completedSteps,
        tour_completed: completedSteps.length === steps.length,
        updated_at: new Date().toISOString(),
        ...(completedSteps.length === steps.length && { 
          tour_completed_at: new Date().toISOString() 
        })
      };

      const { error } = await supabase
        .from('user_guided_tour')
        .upsert(stateToSave, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setLastSaved(new Date());
      
      if (!silent) {
        toast({
          title: "✓ Progreso guardado",
          description: "Tu avance en el tour ha sido guardado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error saving tour state:', error);
      if (!silent) {
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar tu progreso. Verifica tu conexión.",
          variant: "destructive"
        });
      }
    }
  };

  const startTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: 1,
          completed_steps: [],
          tour_started_at: new Date().toISOString(),
          tour_completed: false
        });

      setIsActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);
      setShowWelcome(false);
      
      toast({
        title: "🚀 Tour iniciado",
        description: "¡Comencemos! Era te guiará paso a paso.",
      });
    } catch (error) {
      console.error('Error starting tour:', error);
    }
  };

  const verifyStepCompletion = async (stepId: number): Promise<boolean> => {
    setVerifying(true);
    
    try {
      let isComplete = false;

      switch(stepId) {
        case 1:
          isComplete = await verifications.verifyCompanyProfile();
          break;
        case 2:
          isComplete = await verifications.verifySocialConnections();
          break;
        case 3:
          isComplete = await verifications.verifySocialURLs();
          break;
        case 4:
          isComplete = await verifications.verifyAudienceAnalysis();
          break;
        case 5:
          isComplete = await verifications.verifyContentAnalysis();
          break;
        case 6:
          isComplete = await verifications.verifyBuyerPersonas();
          break;
        case 7:
          isComplete = await verifications.verifyCampaignCreated();
          break;
        case 8:
          isComplete = await verifications.verifyContentGenerated();
          break;
        case 9:
          // Paso manual (visita al marketplace)
          isComplete = true;
          break;
        default:
          isComplete = false;
      }

      return isComplete;
    } catch (error) {
      console.error('Error verifying step:', error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const completeStep = async (stepId: number) => {
    if (completedSteps.includes(stepId)) return;

    // Para pasos con verificación automática, verificar primero
    const step = steps.find(s => s.id === stepId);
    if (step && !step.requiresManualCompletion) {
      const isComplete = await verifyStepCompletion(stepId);
      
      if (!isComplete) {
        toast({
          title: "Paso incompleto",
          description: `Completa las acciones requeridas para este paso antes de continuar.`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      const newCompletedSteps = [...completedSteps, stepId];
      const nextStep = Math.max(...newCompletedSteps) + 1;
      const allCompleted = newCompletedSteps.length === steps.length;

      setCompletedSteps(newCompletedSteps);
      setCurrentStep(nextStep);

      await saveTourState(true);

      // Navegar al siguiente paso si tiene tab específico
      if (!allCompleted) {
        const nextStepData = steps.find(s => s.id === nextStep);
        if (nextStepData?.tab && nextStepData.target_section === currentSection) {
          onNavigate(nextStepData.target_section, { tab: nextStepData.tab });
        }
      }

      if (allCompleted) {
        setIsActive(false);
        toast({
          title: "¡Felicitaciones! 🎉",
          description: "Has completado el tour de Buildera. Era está lista para asistirte.",
        });
        
        window.dispatchEvent(new CustomEvent('simple-era-guide-completed'));
      } else {
        toast({
          title: "✓ Paso completado",
          description: `Paso ${stepId} de ${steps.length} completado.`,
        });
      }
    } catch (error) {
      console.error('Error completing step:', error);
    }
  };

  const skipTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          tour_completed: true,
          tour_skipped: true,
          tour_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      setIsActive(false);
      setShowSkipConfirm(false);
      
      toast({
        title: "Tour omitido",
        description: "Puedes reactivarlo en cualquier momento con el botón Era.",
      });
      
      window.dispatchEvent(new CustomEvent('simple-era-guide-completed'));
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const restartTour = async () => {
    try {
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: 1,
          completed_steps: [],
          tour_completed: false,
          tour_skipped: false,
          tour_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      setIsActive(true);
      setCurrentStep(1);
      setCompletedSteps([]);
      
      toast({
        title: "Tour reiniciado",
        description: "El tour ha sido reiniciado desde el principio.",
      });
    } catch (error) {
      console.error('Error restarting tour:', error);
    }
  };

  const handleRecoverTour = () => {
    if (recoveryData) {
      setCompletedSteps(recoveryData.completed_steps || []);
      setCurrentStep(recoveryData.current_step || 1);
      setIsActive(true);
      setShowRecoveryDialog(false);
      
      toast({
        title: "Tour recuperado",
        description: `Continuando desde el paso ${recoveryData.current_step}.`,
      });
    }
  };

  const handleRestartFromRecovery = () => {
    setShowRecoveryDialog(false);
    restartTour();
  };

  const nextIncompleteStep = steps.find(step => !completedSteps.includes(step.id));
  const progressPercentage = (completedSteps.length / steps.length) * 100;
  
  const isCurrentSectionRelevant = (() => {
    if (!nextIncompleteStep) return false;
    const isSameSection = nextIncompleteStep.target_section === currentSection;
    
    if (nextIncompleteStep.tab) {
      const urlParams = new URLSearchParams(window.location.search);
      const currentTab = urlParams.get('tab');
      return isSameSection && currentTab === nextIncompleteStep.tab;
    }
    
    return isSameSection;
  })();

  // Formato de última guardada
  const getLastSavedText = () => {
    if (!lastSaved) return null;
    const seconds = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000);
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `hace ${minutes}m`;
  };

  if (loading) return null;

  // Diálogo de bienvenida
  if (showWelcome) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <Card className="max-w-2xl w-full shadow-2xl">
              <CardContent className="p-8">
                <motion.div
                  className="flex justify-center mb-6"
                  animate={{ 
                    y: [0, -10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-2 -right-2"
                    >
                      <Sparkles className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </div>
                </motion.div>

                <h2 className="text-3xl font-bold text-center mb-4">
                  ¡Bienvenido a Buildera! 🚀
                </h2>

                <p className="text-lg text-center text-muted-foreground mb-6">
                  <strong>Era</strong> es tu asistente empresarial con IA. Este tour de <strong>9 pasos (5-10 minutos)</strong> te guiará para configurar tu plataforma y obtener el máximo valor desde el primer día.
                </p>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
                  <p className="font-semibold mb-3 text-center">Al finalizar podrás:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Generar contenido con IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Analizar audiencias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Crear campañas automatizadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Optimizar tu estrategia</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={startTour}
                    className="flex-1 h-12 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Comenzar Tour
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWelcome(false);
                      skipTour();
                    }}
                    variant="outline"
                    className="flex-1 h-12 text-lg"
                  >
                    Saltar
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Podrás reactivar el tour en cualquier momento
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Diálogo de recuperación
  if (showRecoveryDialog) {
    return (
      <AlertDialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tienes un tour en progreso</AlertDialogTitle>
            <AlertDialogDescription>
              Encontramos que habías avanzado hasta el paso {recoveryData?.current_step || 1} de {steps.length}.
              ¿Quieres continuar desde donde lo dejaste o reiniciar desde el principio?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRestartFromRecovery}>
              Reiniciar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRecoverTour}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Button
            onClick={restartTour}
            className="relative rounded-full w-16 h-16 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all duration-300"
            size="icon"
            title="Reiniciar tour de Era"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <motion.div
                className="text-xs font-bold text-white bg-black/20 px-2 py-1 rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Era
              </motion.div>
            </div>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Diálogo de confirmación de saltar */}
      <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Saltar el tour?</AlertDialogTitle>
            <AlertDialogDescription>
              Si saltas ahora, perderás el progreso del tour guiado. Podrás reactivarlo después, pero comenzarás desde el principio.
              ¿Estás seguro que quieres saltar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={skipTour} className="bg-destructive hover:bg-destructive/90">
              Sí, saltar tour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isMinimized ? 'w-16 h-16' : 'w-96'
          }`}
        >
          {isMinimized ? (
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Button
                onClick={() => setIsMinimized(false)}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                size="icon"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Bot className="w-8 h-8 text-white relative z-10" />
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1 z-20"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
                {completedSteps.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -left-2 z-20"
                  >
                    <Badge className="bg-green-500 text-white text-xs font-bold">
                      {completedSteps.length}/{steps.length}
                    </Badge>
                  </motion.div>
                )}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                  <motion.div
                    className="text-xs font-bold text-white bg-black/30 px-2 py-1 rounded-full"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Era
                  </motion.div>
                </div>
              </Button>
            </motion.div>
          ) : (
            <Card className="shadow-xl border bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="relative"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center relative overflow-hidden">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />
                        <Bot className="w-7 h-7 text-white relative z-10" />
                      </div>
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                    <div>
                      <motion.h3 
                        className="font-bold text-lg"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Era - Tour Guiado
                      </motion.h3>
                      <p className="text-xs text-muted-foreground">Tu Asistente Empresarial</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lastSaved && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Save className="w-3 h-3" />
                        <span>{getLastSavedText()}</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(true)}
                      className="h-8 w-8 hover:bg-primary/10"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSkipConfirm(true)}
                      className="h-8 w-8 hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso del Tour</span>
                    <Badge variant="secondary" className="text-xs">
                      Paso {completedSteps.length + 1} de {steps.length}
                    </Badge>
                  </div>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ originX: 0 }}
                  >
                    <Progress value={progressPercentage} className="h-3" />
                  </motion.div>
                </div>

                {/* Current Step */}
                {nextIncompleteStep && (
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${nextIncompleteStep.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <nextIncompleteStep.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div className="flex-1">
                        <h4 className="font-bold text-base mb-2">{nextIncompleteStep.title}</h4>
                        
                        <div className="space-y-2 text-sm mb-3">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="font-semibold mb-1">¿Qué harás?</p>
                            <p className="text-muted-foreground">{nextIncompleteStep.what}</p>
                          </div>
                          <div className="bg-primary/5 rounded-lg p-3">
                            <p className="font-semibold mb-1">¿Por qué es importante?</p>
                            <p className="text-muted-foreground">{nextIncompleteStep.why}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="font-semibold mb-1">¿Cómo hacerlo?</p>
                            <p className="text-muted-foreground">{nextIncompleteStep.how}</p>
                          </div>
                        </div>

                        <motion.div 
                          className="flex items-center gap-2 mb-4"
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Badge 
                            variant={isCurrentSectionRelevant ? "default" : "outline"}
                            className={isCurrentSectionRelevant ? "bg-green-100 text-green-800 border-green-300" : ""}
                          >
                            {isCurrentSectionRelevant ? "✓ Ya estás en la sección correcta" : "📍 Necesitas ir a otra sección"}
                          </Badge>
                        </motion.div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {!isCurrentSectionRelevant ? (
                        <motion.div
                          className="flex-1"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => {
                              const navParams = nextIncompleteStep.tab ? { tab: nextIncompleteStep.tab } : undefined;
                              onNavigate(nextIncompleteStep.target_section, navParams);
                            }}
                            size="sm"
                            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            {nextIncompleteStep.actionText} →
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex-1"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={() => completeStep(nextIncompleteStep.id)}
                            size="sm"
                            disabled={verifying}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                          >
                            {verifying ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verificando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {nextIncompleteStep.verificationText}
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSkipConfirm(true)}
                        className="hover:bg-destructive/10"
                        title="Saltar tour"
                      >
                        Saltar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Completed */}
                {completedSteps.length === steps.length && (
                  <motion.div 
                    className="text-center py-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div 
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center mx-auto mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <h4 className="font-bold text-xl mb-2">¡Felicitaciones! 🎉</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Has completado exitosamente el tour de Buildera. Ahora conoces todas las funciones principales y Era está lista para asistirte en cualquier momento.
                    </p>
                    <Button
                      onClick={skipTour}
                      size="sm"
                      className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Comenzar a usar Buildera
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default SimpleEraGuide;
