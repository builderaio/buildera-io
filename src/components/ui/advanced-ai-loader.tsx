import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Sparkles,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Eye,
  MessageCircle,
  Calendar,
  Hash,
  Zap,
  Award,
  CheckCircle2
} from "lucide-react";

interface AdvancedAILoaderProps {
  isVisible: boolean;
}

const AdvancedAILoader = ({ isVisible }: AdvancedAILoaderProps) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Recopilando datos",
      description: "Analizando posts, comentarios y engagement de todas las plataformas",
      duration: 2000
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Análisis de audiencia",
      description: "Identificando patrones de comportamiento y demografía",
      duration: 2500
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Métricas de rendimiento",
      description: "Calculando ROI, engagement rate y tendencias de crecimiento",
      duration: 2000
    },
    {
      icon: <Brain className="h-5 w-5" />,
      title: "IA de reasoning",
      description: "Aplicando modelos avanzados para insights estratégicos profundos",
      duration: 3000
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Estrategias de crecimiento",
      description: "Generando recomendaciones personalizadas y roadmap ejecutivo",
      duration: 2500
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Informe ejecutivo",
      description: "Compilando análisis completo con proyecciones de ROI",
      duration: 2000
    }
  ];

  const insights = [
    "📊 Análisis de 50+ métricas de rendimiento",
    "🎯 Identificación de oportunidades de crecimiento",
    "💡 Recomendaciones estratégicas personalizadas",
    "📈 Proyecciones de ROI y crecimiento",
    "🔍 Análisis competitivo del mercado",
    "⏰ Optimización de timing y frecuencia",
    "💬 Análisis de sentiment y engagement",
    "🎨 Insights sobre contenido de alto rendimiento"
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let totalDuration = 0;
    const stepDurations = steps.map(step => step.duration);
    const totalTime = stepDurations.reduce((acc, duration) => acc + duration, 0);

    const progressTimer = setInterval(() => {
      totalDuration += 100;
      const newProgress = Math.min((totalDuration / totalTime) * 100, 100);
      setProgress(newProgress);

      // Determinar el paso actual
      let accumulatedTime = 0;
      let currentStepIndex = 0;
      
      for (let i = 0; i < stepDurations.length; i++) {
        accumulatedTime += stepDurations[i];
        if (totalDuration <= accumulatedTime) {
          currentStepIndex = i;
          break;
        }
      }

      setCurrentStep(currentStepIndex);

      // Marcar pasos completados
      const completed = [];
      let completedTime = 0;
      for (let i = 0; i < stepDurations.length; i++) {
        completedTime += stepDurations[i];
        if (totalDuration > completedTime) {
          completed.push(i);
        }
      }
      setCompletedSteps(completed);

      if (newProgress >= 100) {
        clearInterval(progressTimer);
      }
    }, 100);

    return () => clearInterval(progressTimer);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-2 border-primary/20">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-primary animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Análisis Avanzado con IA
            </h2>
            <p className="text-muted-foreground mt-2">
              Procesando con modelos de reasoning de última generación
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso general</span>
              <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Current Step */}
          <div className="mb-8">
            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="p-2 bg-primary/10 rounded-full">
                {steps[currentStep]?.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{steps[currentStep]?.title}</h3>
                <p className="text-sm text-muted-foreground">{steps[currentStep]?.description}</p>
              </div>
              <div className="animate-spin">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Steps Progress */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                  completedSteps.includes(index) 
                    ? 'bg-green-50 border border-green-200' 
                    : currentStep === index 
                    ? 'bg-primary/5 border border-primary/20' 
                    : 'bg-muted/30'
                }`}
              >
                <div className={`p-1 rounded-full ${
                  completedSteps.includes(index) 
                    ? 'bg-green-100 text-green-600' 
                    : currentStep === index 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  completedSteps.includes(index) 
                    ? 'text-green-700' 
                    : currentStep === index 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* What to Expect */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Qué encontrarás en tu análisis:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Premium Badge */}
          <div className="flex justify-center mt-6">
            <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
              <Award className="h-3 w-3 mr-1" />
              Análisis Premium Exclusivo
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAILoader;