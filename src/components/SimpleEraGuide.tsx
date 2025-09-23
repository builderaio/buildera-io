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
  completed: boolean;
  icon?: any;
  actionText?: string;
  color?: string;
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
      description: "Completa el perfil de tu empresa para personalizar la experiencia",
      target_section: "adn-empresa",
      completed: false,
      icon: Settings,
      actionText: "Completar perfil",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: 2,
      title: "Conectar Redes Sociales",
      description: "Conecta LinkedIn, Instagram y otras redes sociales",
      target_section: "configuracion",
      completed: false,
      icon: Zap,
      actionText: "Ir a configuración",
      color: "from-green-500 to-green-600"
    },
    {
      id: 3,
      title: "Configurar URLs de Redes",
      description: "Actualiza las URLs de tus perfiles sociales",
      target_section: "configuracion",
      completed: false,
      icon: Settings,
      actionText: "Configurar URLs",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: 4,
      title: "Analizar Audiencias",
      description: "Descubre insights sobre tu audiencia actual",
      target_section: "inteligencia-competitiva",
      completed: false,
      icon: BarChart3,
      actionText: "Analizar audiencia",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: 5,
      title: "Crear Audiencias Personalizadas",
      description: "Define segmentos específicos de audiencia",
      target_section: "inteligencia-competitiva",
      completed: false,
      icon: Users,
      actionText: "Crear audiencias",
      color: "from-pink-500 to-pink-600"
    },
    {
      id: 6,
      title: "Analizar Contenido",
      description: "Evalúa el rendimiento de tu contenido actual",
      target_section: "marketing-hub",
      completed: false,
      icon: FileText,
      actionText: "Analizar contenido",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      id: 7,
      title: "Crear Contenido",
      description: "Genera contenido optimizado con IA",
      target_section: "marketing-hub",
      completed: false,
      icon: Sparkles,
      actionText: "Crear contenido",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      id: 8,
      title: "Crear Campañas",
      description: "Diseña campañas de marketing efectivas",
      target_section: "marketing-hub",
      completed: false,
      icon: Megaphone,
      actionText: "Crear campaña",
      color: "from-red-500 to-red-600"
    },
    {
      id: 9,
      title: "Contratar Agentes",
      description: "Amplía tus capacidades con agentes especializados",
      target_section: "marketplace",
      completed: false,
      icon: ShoppingCart,
      actionText: "Ver marketplace",
      color: "from-indigo-500 to-indigo-600"
    }
  ] as (GuideStep & { icon: any; actionText: string; color: string })[];

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
          title: "¡Felicitaciones! 🎉",
          description: "Has completado el tour guiado. Era está disponible como asistente.",
        });
      } else {
        toast({
          title: "¡Paso Completado! ✅",
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
  
  // Verificar si el paso 2 (conectar redes) puede completarse
  const canCompleteNetworkStep = async () => {
    if (nextIncompleteStep?.id !== 2) return true;
    
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('linkedin_url, facebook_url, instagram_url, tiktok_url')
        .eq('created_by', userId)
        .single();
      
      if (companies) {
        const hasConnectedNetworks = !!(companies.linkedin_url || companies.facebook_url || companies.instagram_url || companies.tiktok_url);
        return hasConnectedNetworks;
      }
    } catch (error) {
      console.error('Error checking network connections:', error);
    }
    
    return false;
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
            onClick={startTour}
            className="relative rounded-full w-16 h-16 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all duration-300"
            size="icon"
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
                    {completedSteps.length}/{steps.length}
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
                          {isCurrentSectionRelevant ? "✓ Sección actual" : "📍 Ir a sección"}
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
                            onNavigate(nextIncompleteStep.target_section);
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
                            if (nextIncompleteStep.id === 2) {
                              const canComplete = await canCompleteNetworkStep();
                              if (!canComplete) {
                                toast({
                                  title: "Conexión requerida",
                                  description: "Debes conectar al menos una red social antes de continuar",
                                  variant: "destructive",
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
                          {nextIncompleteStep.id === 2 ? "Verificar conexión" : "Marcar completado"}
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
                    Has completado el tour guiado. Ahora dominas Buildera y Era está lista para asistirte.
                  </p>
                  <Button
                    onClick={skipTour}
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Activar Era como Asistente
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