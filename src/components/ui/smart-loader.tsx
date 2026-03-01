import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Sparkles,
  Zap,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Send,
  Users,
  BarChart3,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  Globe,
  Loader2
} from "lucide-react";

type LoaderType = 
  | 'content-generation' 
  | 'image-generation' 
  | 'publishing' 
  | 'analysis' 
  | 'social-sync'
  | 'optimization'
  | 'generic';

interface SmartLoaderProps {
  isVisible: boolean;
  type: LoaderType;
  message?: string;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

const loaderConfigs = {
  'content-generation': {
    icon: <FileText className="h-6 w-6" />,
    title: "Generando contenido",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    steps: [
      "Analizando audiencia objetivo...",
      "Creando contenido personalizado...",
      "Optimizando para engagement...",
      "Añadiendo elementos creativos...",
      "Finalizando contenido..."
    ]
  },
  'image-generation': {
    icon: <ImageIcon className="h-6 w-6" />,
    title: "Creando imagen",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    steps: [
      "Procesando prompt visual...",
      "Generando composición...",
      "Aplicando estilos...",
      "Optimizando calidad...",
      "Imagen lista!"
    ]
  },
  'publishing': {
    icon: <Send className="h-6 w-6" />,
    title: "Publicando contenido",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    steps: [
      "Preparando publicación...",
      "Conectando con plataformas...",
      "Subiendo contenido...",
      "Verificando publicación...",
      "¡Publicado exitosamente!"
    ]
  },
  'analysis': {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analizando datos",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    steps: [
      "Recopilando datos...",
      "Procesando métricas...",
      "Generando insights...",
      "Creando recomendaciones...",
      "Análisis completado!"
    ]
  },
  'social-sync': {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Sincronizando redes",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    steps: [
      "Conectando con APIs...",
      "Descargando posts recientes...",
      "Procesando imágenes...",
      "Actualizando métricas...",
      "Sincronización completa!"
    ]
  },
  'optimization': {
    icon: <Target className="h-6 w-6" />,
    title: "Optimizando con Era",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    steps: [
      "Analizando contenido...",
      "Aplicando optimizaciones...",
      "Mejorando estructura...",
      "Validando cambios...",
      "Optimización completada!"
    ]
  },
  'generic': {
    icon: <Loader2 className="h-6 w-6 animate-spin" />,
    title: "Procesando",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    steps: [
      "Iniciando proceso...",
      "Procesando datos...",
      "Aplicando cambios...",
      "Finalizando...",
      "¡Completado!"
    ]
  }
};

export function SmartLoader({ 
  isVisible, 
  type, 
  message, 
  progress: externalProgress,
  size = 'md',
  showProgress = true
}: SmartLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const config = loaderConfigs[type];
  const currentStep = config.steps[currentStepIndex];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStepIndex(0);
      return;
    }

    // Use external progress if provided
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      const stepIndex = Math.min(
        Math.floor((externalProgress / 100) * config.steps.length),
        config.steps.length - 1
      );
      setCurrentStepIndex(stepIndex);
      return;
    }

    // Auto progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + 2, 100);
        const stepIndex = Math.min(
          Math.floor((newProgress / 100) * config.steps.length),
          config.steps.length - 1
        );
        setCurrentStepIndex(stepIndex);
        
        if (newProgress >= 100) {
          clearInterval(interval);
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, externalProgress, config.steps.length]);

  if (!isVisible) return null;

  const sizeClasses = {
    sm: "max-w-sm p-4",
    md: "max-w-md p-6", 
    lg: "max-w-lg p-8"
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <Card className={`${sizeClasses[size]} shadow-xl ${config.borderColor} border-2`}>
        <CardContent className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-center gap-3">
            <div className={`p-3 rounded-full ${config.bgColor} ${config.color}`}>
              {config.icon}
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{config.title}</h3>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          </div>

          {/* Progress */}
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progreso</span>
                <span className={`font-bold ${config.color}`}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Current Step */}
          <div className={`p-3 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${config.color} animate-pulse`} />
              <span className="text-sm font-medium">{currentStep}</span>
            </div>
          </div>

          {/* Loading indicator */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Inline loader for smaller spaces
export function InlineSmartLoader({ 
  type, 
  message, 
  size = 'sm' 
}: { 
  type: LoaderType; 
  message?: string; 
  size?: 'xs' | 'sm' | 'md' 
}) {
  const config = loaderConfigs[type];
  
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-6 w-6"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${config.color} ${sizeClasses[size]} animate-spin`}>
        {type === 'generic' ? <Loader2 className="h-full w-full" /> : config.icon}
      </div>
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </div>
  );
}