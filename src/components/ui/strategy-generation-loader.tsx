import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Brain,
  Users,
  BarChart3
} from "lucide-react";

interface Stage {
  name: string;
  description: string;
  progress: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface StrategyGenerationLoaderProps {
  isVisible: boolean;
  estimatedTime?: number; // in seconds
}

const stages: Stage[] = [
  {
    name: "Análisis Competitivo",
    description: "Investigando a tu competencia en el mercado",
    progress: 20,
    icon: Search,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    name: "Mensaje Diferenciador",
    description: "Creando tu propuesta única de valor",
    progress: 40,
    icon: Target,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  {
    name: "Estrategias de Funnel",
    description: "Diseñando el recorrido de tu cliente",
    progress: 60,
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    name: "Calendario Editorial",
    description: "Planificando tu contenido estratégicamente",
    progress: 80,
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    name: "Optimización Final",
    description: "Perfeccionando todos los detalles",
    progress: 100,
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/5"
  }
];

const marketingTips = [
  {
    icon: Brain,
    tip: "El 60% de las empresas que usan estrategias de marketing planificadas logran sus objetivos"
  },
  {
    icon: Users,
    tip: "Conocer a tu audiencia aumenta la efectividad de tus campañas en un 73%"
  },
  {
    icon: Target,
    tip: "Las empresas con estrategia clara tienen 313% más probabilidades de éxito"
  },
  {
    icon: BarChart3,
    tip: "El contenido personalizado genera 6 veces más conversiones"
  },
  {
    icon: Lightbulb,
    tip: "La consistencia en redes sociales aumenta el engagement hasta un 67%"
  }
];

export function StrategyGenerationLoader({ 
  isVisible, 
  estimatedTime = 150 // 2.5 minutes default
}: StrategyGenerationLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);

  const currentStage = stages[currentStageIndex];
  const CurrentTipIcon = marketingTips[currentTipIndex].icon;

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStageIndex(0);
      setCurrentTipIndex(0);
      setTimeRemaining(estimatedTime);
      return;
    }

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (estimatedTime * 10); // Update every 100ms
        const newProgress = Math.min(prev + increment, 99); // Cap at 99% until actually done
        
        // Update stage based on progress
        const stageIndex = stages.findIndex(s => s.progress > newProgress);
        setCurrentStageIndex(stageIndex === -1 ? stages.length - 1 : Math.max(0, stageIndex - 1));
        
        return newProgress;
      });
    }, 100);

    // Time remaining countdown
    const timeInterval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Rotate tips every 8 seconds
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % marketingTips.length);
    }, 8000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
      clearInterval(tipInterval);
    };
  }, [isVisible, estimatedTime]);

  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden">
          <CardContent className="p-8 space-y-8">
            {/* Header with animated icon */}
            <div className="text-center space-y-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
              >
                <Brain className="h-12 w-12 text-primary" />
              </motion.div>
              
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Generando tu Estrategia de Marketing
                </h2>
                <p className="text-muted-foreground mt-2">
                  Nuestra IA está analizando datos y creando una estrategia personalizada para ti
                </p>
              </div>

              {/* Time remaining */}
              <Badge variant="outline" className="text-sm px-4 py-1">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Tiempo estimado: {formatTime(timeRemaining)}
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Progreso General</span>
                <span className="font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Stages Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Proceso de Creación
              </h3>
              <div className="space-y-3">
                {stages.map((stage, index) => {
                  const StageIcon = stage.icon;
                  const isComplete = progress >= stage.progress;
                  const isCurrent = currentStageIndex === index;
                  
                  return (
                    <motion.div
                      key={stage.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        isCurrent 
                          ? `${stage.bgColor} border-current shadow-md` 
                          : isComplete
                          ? 'bg-muted/30 border-muted'
                          : 'bg-background border-border'
                      }`}
                    >
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        isComplete ? 'bg-green-100' : stage.bgColor
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : isCurrent ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <StageIcon className={`h-5 w-5 ${stage.color}`} />
                          </motion.div>
                        ) : (
                          <StageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm ${
                            isCurrent ? stage.color : isComplete ? 'text-green-600' : 'text-muted-foreground'
                          }`}>
                            {stage.name}
                          </p>
                          {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                              En proceso
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {stage.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-medium text-muted-foreground">
                          {stage.progress}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Marketing Tip */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 rounded-lg border-2 border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-full bg-primary/20">
                    <CurrentTipIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Sabías que...
                    </p>
                    <p className="text-sm text-foreground font-medium">
                      {marketingTips[currentTipIndex].tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Loading indicator dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
