import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  FileText,
  Image,
  Video,
  TrendingUp,
  Users,
  Target
} from "lucide-react";

interface Stage {
  name: string;
  description: string;
  progress: number;
  icon: React.ElementType;
  color: string;
}

interface CalendarGenerationLoaderProps {
  isVisible: boolean;
  estimatedTime?: number; // in seconds
  postsToGenerate?: number;
}

const stages: Stage[] = [
  {
    name: "Analizando Estrategia",
    description: "Revisando tu estrategia de marketing",
    progress: 15,
    icon: Target,
    color: "text-blue-600"
  },
  {
    name: "Identificando Audiencias",
    description: "Entendiendo a tus buyer personas",
    progress: 30,
    icon: Users,
    color: "text-purple-600"
  },
  {
    name: "Planificando Contenido",
    description: "Distribuyendo posts por plataforma",
    progress: 50,
    icon: Calendar,
    color: "text-orange-600"
  },
  {
    name: "Creando Copies",
    description: "Escribiendo contenido atractivo",
    progress: 70,
    icon: FileText,
    color: "text-green-600"
  },
  {
    name: "Optimizando Timing",
    description: "Seleccionando mejores horarios",
    progress: 85,
    icon: Clock,
    color: "text-cyan-600"
  },
  {
    name: "Finalizando Calendario",
    description: "Últimos ajustes y validación",
    progress: 100,
    icon: Sparkles,
    color: "text-primary"
  }
];

const contentTips = [
  {
    icon: TrendingUp,
    tip: "El mejor momento para publicar varía según tu audiencia y plataforma"
  },
  {
    icon: Image,
    tip: "Las publicaciones con imágenes obtienen 650% más engagement"
  },
  {
    icon: Video,
    tip: "Los videos generan 1200% más compartidos que texto e imagen"
  },
  {
    icon: Users,
    tip: "Publicar consistentemente aumenta tu alcance orgánico en un 50%"
  },
  {
    icon: Calendar,
    tip: "Un calendario editorial reduce el estrés y mejora la calidad del contenido"
  }
];

export function CalendarGenerationLoader({ 
  isVisible, 
  estimatedTime = 90,
  postsToGenerate = 25
}: CalendarGenerationLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(estimatedTime);
  const [postsGenerated, setPostsGenerated] = useState(0);

  const currentStage = stages[currentStageIndex];
  const CurrentTipIcon = contentTips[currentTipIndex].icon;

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStageIndex(0);
      setCurrentTipIndex(0);
      setTimeRemaining(estimatedTime);
      setPostsGenerated(0);
      return;
    }

    // Progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (estimatedTime * 10);
        const newProgress = Math.min(prev + increment, 99);
        
        const stageIndex = stages.findIndex(s => s.progress > newProgress);
        setCurrentStageIndex(stageIndex === -1 ? stages.length - 1 : Math.max(0, stageIndex - 1));
        
        // Simulate posts being generated
        const expectedPosts = Math.floor((newProgress / 100) * postsToGenerate);
        setPostsGenerated(expectedPosts);
        
        return newProgress;
      });
    }, 100);

    const timeInterval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % contentTips.length);
    }, 7000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(timeInterval);
      clearInterval(tipInterval);
    };
  }, [isVisible, estimatedTime, postsToGenerate]);

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
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-orange-200 shadow-2xl overflow-hidden">
          <CardContent className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <motion.div
                animate={{ 
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="inline-flex p-4 rounded-full bg-gradient-to-br from-orange-100 to-amber-50"
              >
                <Calendar className="h-10 w-10 text-orange-600" />
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Creando tu Calendario de Contenido
                </h2>
                <p className="text-muted-foreground mt-2">
                  Generando {postsToGenerate} publicaciones estratégicas
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  {formatTime(timeRemaining)}
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1 bg-orange-100 text-orange-700">
                  <FileText className="h-3 w-3 mr-2" />
                  {postsGenerated} / {postsToGenerate} posts
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">Progreso</span>
                <span className="font-bold text-orange-600">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Stage Highlight */}
            <motion.div
              key={currentStageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border-2 border-orange-200"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex-shrink-0 p-3 rounded-full bg-white shadow-md"
                >
                  <currentStage.icon className={`h-6 w-6 ${currentStage.color}`} />
                </motion.div>
                <div className="flex-1">
                  <p className={`font-semibold ${currentStage.color}`}>
                    {currentStage.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentStage.description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stages List */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {stages.map((stage, index) => {
                const StageIcon = stage.icon;
                const isComplete = progress >= stage.progress;
                const isCurrent = currentStageIndex === index;
                
                return (
                  <motion.div
                    key={stage.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      isCurrent 
                        ? 'bg-orange-50 border-orange-300' 
                        : isComplete
                        ? 'bg-green-50 border-green-300'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className={`flex-shrink-0 p-1.5 rounded-full ${
                      isComplete ? 'bg-green-100' : 'bg-background'
                    }`}>
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <StageIcon className={`h-4 w-4 ${isCurrent ? stage.color : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <p className="text-xs font-medium truncate">
                      {stage.name.split(' ')[0]}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Content Tip */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-full bg-blue-100">
                    <CurrentTipIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                      💡 Tip de Contenido
                    </p>
                    <p className="text-sm text-foreground">
                      {contentTips[currentTipIndex].tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Loading dots */}
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.15
                  }}
                  className="w-2 h-2 rounded-full bg-orange-600"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
