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
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideStep {
  id: number;
  title: string;
  description: string;
  target_section: string;
  completed: boolean;
}

interface SimpleEraGuideProps {
  userId: string;
  currentSection: string;
  onNavigate: (section: string) => void;
}

const SimpleEraGuide = ({ userId, currentSection, onNavigate }: SimpleEraGuideProps) => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const steps: GuideStep[] = [
    {
      id: 1,
      title: "Actualizar Información Empresarial",
      description: "Completa el perfil de tu empresa en ADN Empresarial",
      target_section: "adn-empresa",
      completed: false
    },
    {
      id: 2,
      title: "Conectar Redes Sociales",
      description: "Conecta tus cuentas en el Marketing Hub",
      target_section: "marketing-hub",
      completed: false
    },
    {
      id: 3,
      title: "Configurar URLs de Redes",
      description: "Actualiza las URLs en configuración",
      target_section: "configuracion",
      completed: false
    },
    {
      id: 4,
      title: "Analizar Audiencias",
      description: "Ejecuta análisis de audiencias",
      target_section: "inteligencia-competitiva",
      completed: false
    },
    {
      id: 5,
      title: "Crear Audiencias Personalizadas",
      description: "Define audiencias específicas",
      target_section: "inteligencia-competitiva",
      completed: false
    },
    {
      id: 6,
      title: "Analizar Contenido",
      description: "Analiza tu contenido actual",
      target_section: "marketing-hub",
      completed: false
    },
    {
      id: 7,
      title: "Crear Contenido",
      description: "Genera contenido con IA",
      target_section: "marketing-hub",
      completed: false
    },
    {
      id: 8,
      title: "Crear Campañas",
      description: "Diseña campañas de marketing",
      target_section: "marketing-hub",
      completed: false
    },
    {
      id: 9,
      title: "Contratar Agentes",
      description: "Explora el marketplace de agentes",
      target_section: "marketplace",
      completed: false
    }
  ];

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
        setCompletedSteps(tourStatus.completed_steps || []);
        setCurrentStep(tourStatus.current_step || 1);
        setIsActive(!tourStatus.tour_completed);
      } else {
        // Verificar si necesita tour (completó onboarding recientemente)
        const { data: onboarding } = await supabase
          .from('user_onboarding_status')
          .select('onboarding_completed_at')
          .eq('user_id', userId)
          .maybeSingle();

        if (onboarding?.onboarding_completed_at) {
          const completedDate = new Date(onboarding.onboarding_completed_at);
          const now = new Date();
          const hoursDiff = (now.getTime() - completedDate.getTime()) / (1000 * 3600);
          
          if (hoursDiff <= 48) {
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
      const nextStep = stepId + 1;
      const allCompleted = newCompletedSteps.length === steps.length;

      setCompletedSteps(newCompletedSteps);
      setCurrentStep(nextStep);

      await supabase
        .from('user_guided_tour')
        .upsert({
          user_id: userId,
          current_step: allCompleted ? stepId : nextStep,
          completed_steps: newCompletedSteps,
          tour_completed: allCompleted,
          updated_at: new Date().toISOString(),
          ...(allCompleted && { tour_completed_at: new Date().toISOString() })
        });

      if (allCompleted) {
        setIsActive(false);
        toast({
          title: "¡Felicitaciones!",
          description: "Has completado el tour guiado. Era está disponible como asistente.",
        });
      } else {
        toast({
          title: "¡Paso Completado!",
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
          tour_completed_at: new Date().toISOString()
        });

      setIsActive(false);
      toast({
        title: "Tour Omitido",
        description: "Puedes reactivarlo desde configuración.",
      });
    } catch (error) {
      console.error('Error skipping tour:', error);
    }
  };

  const nextIncompleteStep = steps.find(step => !completedSteps.includes(step.id));
  const progressPercentage = (completedSteps.length / steps.length) * 100;
  const isCurrentSectionRelevant = nextIncompleteStep?.target_section === currentSection;

  if (loading) return null;

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={startTour}
          className="rounded-full w-14 h-14 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
          size="icon"
        >
          <Bot className="w-6 h-6 text-white" />
        </Button>
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
          <Button
            onClick={() => setIsMinimized(false)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg relative"
            size="icon"
          >
            <Bot className="w-8 h-8 text-white" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            {completedSteps.length > 0 && (
              <Badge className="absolute -top-2 -left-2 bg-green-500 text-white text-xs">
                {completedSteps.length}/{steps.length}
              </Badge>
            )}
          </Button>
        ) : (
          <Card className="shadow-xl border bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Era</h3>
                    <p className="text-xs text-muted-foreground">Tu Guía Empresarial</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(true)}
                    className="h-8 w-8"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={skipTour}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progreso del Tour</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps.length}/{steps.length}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Current Step */}
              {nextIncompleteStep && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{nextIncompleteStep.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {nextIncompleteStep.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={isCurrentSectionRelevant ? "default" : "secondary"}>
                          {isCurrentSectionRelevant ? "Sección actual" : "Ir a sección"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isCurrentSectionRelevant ? (
                      <Button
                        onClick={() => onNavigate(nextIncompleteStep.target_section)}
                        size="sm"
                        className="flex-1"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Ir a sección
                      </Button>
                    ) : (
                      <Button
                        onClick={() => completeStep(nextIncompleteStep.id)}
                        size="sm"
                        className="flex-1"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar completado
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={skipTour}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed */}
              {completedSteps.length === steps.length && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">¡Felicitaciones!</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Has completado el tour guiado. Ahora dominas Buildera.
                  </p>
                  <Button
                    onClick={skipTour}
                    size="sm"
                    className="w-full"
                  >
                    Finalizar Tour
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SimpleEraGuide;