import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  X, 
  SkipForward,
  Sparkles,
  RefreshCw,
  MessageCircle,
  Zap,
  Settings,
  BarChart3,
  Users,
  FileText,
  Megaphone,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  target_section: string;
  tab?: string;
  completed: boolean;
  icon?: any;
  actionText?: string;
  color?: string;
}

interface SimpleEraGuideProps {
  userId: string;
  currentSection: string;
  onNavigate: (section: string, params?: Record<string, string>) => void;
}

const SimpleEraGuide = ({ userId, currentSection, onNavigate }: SimpleEraGuideProps) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedCount, setConnectedCount] = useState(0);
  const TOTAL_PLATFORMS = 8;

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Paso 1: Completar Perfil Empresarial",
      description: "Actualiza la información de tu empresa (misión, valores, productos/servicios) en la sección ADN Empresa. Esto ayuda a Era a personalizar mejor sus recomendaciones.",
      target_section: "adn-empresa",
      completed: false,
      icon: Settings,
      actionText: "Ir a ADN Empresa",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Paso 2: Conectar Redes Sociales",
      description: "Conecta al menos una red social (LinkedIn, Instagram, Facebook, TikTok) usando el botón 'Conectar' en esta página. Una vez conectada, presiona 'Verificar conexión' para continuar.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: Zap,
      actionText: "Ir a Configuración",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      title: "Paso 3: Configurar URLs de Redes",
      description: "Agrega las URLs públicas de tus perfiles sociales conectados en la sección 'Conexiones de Redes Sociales'. Esto permite que Era analice tu contenido. Presiona 'Marcar completado' cuando termines.",
      target_section: "marketing-hub",
      tab: "configuracion",
      completed: false,
      icon: Settings,
      actionText: "Ir a Configuración",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      title: "Paso 4: Analizar Audiencias",
      description: "Usa la herramienta de análisis para descubrir insights sobre tu audiencia actual: demografía, intereses y comportamientos. Presiona el botón para iniciar el análisis con IA.",
      target_section: "audiencias-manager",
      completed: false,
      icon: BarChart3,
      actionText: "Ir a Audiencias",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      title: "Paso 5: Analizar Contenido",
      description: "Evalúa el rendimiento de tu contenido existente. Era identificará qué tipo de publicaciones funcionan mejor para optimizar tu estrategia. Espera a que se complete el análisis.",
      target_section: "content-analysis-dashboard",
      completed: false,
      icon: FileText,
      actionText: "Analizar Contenido",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: 6,
      title: "Paso 6: Crear Segmentos de Audiencia",
      description: "Define audiencias específicas por red social según los insights obtenidos. Esto permitirá personalizar tu contenido para cada plataforma y audiencia.",
      target_section: "audiencias-manager",
      completed: false,
      icon: Users,
      actionText: "Crear Audiencias",
      color: "from-pink-500 to-pink-600"
    },
    {
      id: 7,
      title: "Paso 7: Crear tu Primera Campaña",
      description: "Diseña una campaña de marketing completa usando el asistente. Define objetivos, audiencia, estrategia y contenido. Era te guiará en cada paso del proceso.",
      target_section: "marketing-hub",
      completed: false,
      icon: Megaphone,
      actionText: "Ir a Campañas",
      color: "from-red-500 to-red-600"
    },
    {
      id: 8,
      title: "Paso 8: Generar Contenido con IA",
      description: "Crea tu primer contenido optimizado usando la IA de Era. Selecciona el tipo de contenido, plataforma y tono. Era generará publicaciones listas para usar.",
      target_section: "marketing-hub",
      tab: "create",
      completed: false,
      icon: Sparkles,
      actionText: "Crear Contenido",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: 9,
      title: "Paso 9: Explorar Agentes Especializados",
      description: "Visita el Marketplace para descubrir agentes especializados que pueden ampliar las capacidades de tu negocio: ventas, atención al cliente, análisis, y más.",
      target_section: "marketplace",
      completed: false,
      icon: ShoppingCart,
      actionText: "Ver Marketplace",
      color: "from-indigo-500 to-indigo-600"
    }
  ] as (GuideStep & { icon: any; actionText: string; color: string })[];

  useEffect(() => {
    loadTourProgress();
  }, [userId]);

  // Auto-save tour state when step changes
  useEffect(() => {
    if (isActive && userId) {
      saveTourState();
    }
  }, [currentStep, completedSteps, isActive, userId]);

  // Save tour state when component unmounts (user navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId) {
        // Forzar guardado en beforeunload
        saveTourState(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Siempre guardar al desmontar el componente, incluso si el tour no está activo
      if (userId) {
        console.log('🔄 Saving tour state on unmount...');
        saveTourState(true);
      }
    };
  }, [isActive, userId, currentStep, completedSteps]);

  // Cargar conteo de conexiones para mostrar "X/8 plataformas conectadas" en el paso 2
  useEffect(() => {
    if (!userId || !isActive) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('social_accounts')
          .select('platform, is_connected')
          .eq('user_id', userId);
        const count = (data || []).filter(acc => acc.is_connected && (acc as any).platform !== 'upload_post_profile').length;
        setConnectedCount(count);
      } catch (e) {
        console.warn('No se pudo cargar el conteo de conexiones:', e);
      }
    })();
  }, [userId, isActive, currentStep]);

  const loadTourProgress = async () => {
    if (!userId) return;

    try {
      const { data: tourStatus } = await supabase
        .from('user_guided_tour')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (tourStatus) {
        setCompletedSteps(tourStatus.completed_steps || []);
        setCurrentStep(tourStatus.current_step || 1);
        setIsActive(!tourStatus.tour_completed);
        console.log('📖 Tour progress loaded:', {
          currentStep: tourStatus.current_step,
          completedSteps: tourStatus.completed_steps,
          isActive: !tourStatus.tour_completed
        });
      } else {
        // Check if user needs tour (completed onboarding recently OR has incomplete tour)
        const { data: onboarding } = await supabase
          .from('user_onboarding_status')
          .select('onboarding_completed_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (onboarding?.onboarding_completed_at) {
          const completedDate = new Date(onboarding.onboarding_completed_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 3600);
          
          // Start tour for recent onboarding (within 7 days instead of 48 hours for better UX)
          if (hoursDiff <= 168) { // 7 days
            setIsActive(true);
            startTour();
          }
        }
      }
    } catch (error) {
      console.error('Error loading tour progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTourState = async (forceSave: boolean = false) => {
    // Si no está activo y no es un guardado forzado, no guardar
    if (!userId || (!isActive && !forceSave)) return;

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

      if (error) {
        console.error('❌ Error saving tour state:', error);
      } else {
        console.log('💾 Tour state saved:', {
          currentStep,
          completedSteps,
          isCompleted: completedSteps.length === steps.length
        });
      }
    } catch (error) {
      console.error('❌ Exception saving tour state:', error);
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
    } catch (error) {
      console.error('Error starting tour:', error);
    }
  };

  const completeStep = async (stepId: number) => {
    if (completedSteps.includes(stepId)) return;

    try {
      const newCompletedSteps = [...completedSteps, stepId];
      
      // Solo completar el paso actual, sin lógica especial
      let finalCompletedSteps = newCompletedSteps;
      
      const nextStep = Math.max(...finalCompletedSteps) + 1;
      const allCompleted = finalCompletedSteps.length === steps.length;

      setCompletedSteps(finalCompletedSteps);
      setCurrentStep(nextStep);

      // Save state immediately after step completion
      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: allCompleted ? Math.max(...finalCompletedSteps) : nextStep,
          completed_steps: finalCompletedSteps,
          tour_completed: allCompleted,
          updated_at: new Date().toISOString(),
          ...(allCompleted && { tour_completed_at: new Date().toISOString() })
        });

      console.log('✅ Step completed and saved:', {
        stepId,
        currentStep: allCompleted ? Math.max(...finalCompletedSteps) : nextStep,
        completedSteps: finalCompletedSteps,
        allCompleted
      });

      // Navegar al siguiente paso si tiene tab específico y estamos en la misma sección
      if (!allCompleted) {
        const nextStepData = steps.find(s => s.id === nextStep);
        if (nextStepData?.tab && nextStepData.target_section === currentSection) {
          console.log('🎯 Navegando al tab del siguiente paso:', nextStepData.tab);
          onNavigate(nextStepData.target_section, { tab: nextStepData.tab });
        }
      }

      if (allCompleted) {
        setIsActive(false);
        toast({
          title: "¡Tour completado exitosamente! 🎉",
          description: "Has dominado todas las funciones principales de Buildera. Era está lista para asistirte en todo momento.",
        });
      }

    } catch (error) {
      console.error('Error completing step:', error);
      toast({
        title: "Error al guardar progreso",
        description: "No se pudo guardar tu progreso. Por favor, verifica tu conexión e inténtalo nuevamente.",
        variant: "destructive"
      });
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
      toast({
        title: "Tour completado",
        description: "Puedes reactivar el tour guiado en cualquier momento presionando el botón Era (círculo morado) en la esquina inferior derecha.",
      });
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
        description: "El tour guiado ha sido reiniciado desde el principio. ¡Comencemos!",
      });
    } catch (error) {
      console.error('Error restarting tour:', error);
    }
  };

  const nextIncompleteStep = steps.find(step => !completedSteps.includes(step.id));
  const progressPercentage = (completedSteps.length / steps.length) * 100;
  
  // Verificar si estamos en la sección correcta Y tab correcto (si aplica)
  const isCurrentSectionRelevant = (() => {
    if (!nextIncompleteStep) return false;
    const isSameSection = nextIncompleteStep.target_section === currentSection;
    
    // Si el paso tiene un tab específico, verificar que estemos en ese tab
    if (nextIncompleteStep.tab) {
      const urlParams = new URLSearchParams(window.location.search);
      const currentTab = urlParams.get('tab');
      return isSameSection && currentTab === nextIncompleteStep.tab;
    }
    
    return isSameSection;
  })();
  
  // Verificar si el paso 2 (conectar redes) puede completarse usando el mismo conteo que Conexiones de Redes Sociales
  const canCompleteNetworkStep = async () => {
    if (nextIncompleteStep?.id !== 2) return true;
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_connected')
        .eq('user_id', userId);
      if (error) throw error as any;
      const count = (data || []).filter(acc => acc.is_connected && (acc as any).platform !== 'upload_post_profile').length;
      setConnectedCount(count);
      console.log('🔍 Conteo de conexiones (tour):', { connected: count, total: TOTAL_PLATFORMS });
      return count > 0;
    } catch (error) {
      console.error('Error checking network connections:', error);
      return false;
    }
  };
  if (loading) return null;

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
                      Era
                    </motion.h3>
                    <p className="text-sm text-muted-foreground">Tu Asistente Empresarial</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                    onClick={skipTour}
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
                      <p className="text-sm text-muted-foreground mb-3">
                        {nextIncompleteStep.description}
                      </p>
                      {nextIncompleteStep.id === 1 && (
                        <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="font-medium text-blue-900 mb-1">Estado de conexiones:</p>
                          <p className="text-blue-700">{connectedCount} de {TOTAL_PLATFORMS} plataformas conectadas</p>
                          {connectedCount === 0 && (
                            <p className="text-xs text-blue-600 mt-1">Conecta al menos una red para continuar</p>
                          )}
                        </div>
                      )}

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
                            console.log('🎯 Navegando a sección:', nextIncompleteStep.target_section);
                            // Si tiene tab específico, navegar con ese parámetro
                            const navParams = nextIncompleteStep.tab ? { tab: nextIncompleteStep.tab } : undefined;
                            onNavigate(nextIncompleteStep.target_section, navParams);
                          }}
                          size="sm"
                          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-medium"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          {nextIncompleteStep.actionText}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={async () => {
                            // Verificar si es el paso de conectar redes
                            if (nextIncompleteStep.id === 1) {
                              const canComplete = await canCompleteNetworkStep();
                              if (!canComplete) {
                                toast({
                                  title: "Conecta al menos una red social",
                                  description: "Para continuar, presiona el botón 'Conectar' en una de las plataformas disponibles (LinkedIn, Instagram, Facebook o TikTok).",
                                  variant: "destructive"
                                });
                                return;
                              }
                            }
                            completeStep(nextIncompleteStep.id);
                          }}
                          size="sm"
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {nextIncompleteStep.id === 1 ? "Verificar y continuar" : "Marcar como completado"}
                        </Button>
                      </motion.div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={skipTour}
                      className="hover:bg-destructive/10"
                    >
                      <SkipForward className="w-4 h-4" />
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
                    Has completado exitosamente el tour guiado de Buildera. Ahora conoces las funciones principales de la plataforma y Era está lista para asistirte en cualquier momento.
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
  );
};

export default SimpleEraGuide;