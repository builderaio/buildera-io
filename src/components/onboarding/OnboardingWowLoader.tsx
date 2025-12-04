import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Palette, Lightbulb, CheckCircle2, Loader2 } from 'lucide-react';

interface OnboardingWowLoaderProps {
  progress: number;
  currentPhase: 'strategy' | 'content' | 'insights' | 'complete';
}

const phases = [
  { 
    id: 'strategy', 
    icon: Brain, 
    title: 'Analizando tu negocio',
    description: 'Generando estrategia de marketing personalizada...'
  },
  { 
    id: 'content', 
    icon: Palette, 
    title: 'Creando contenido',
    description: 'Diseñando posts optimizados para tus redes...'
  },
  { 
    id: 'insights', 
    icon: Lightbulb, 
    title: 'Generando insights',
    description: 'Identificando oportunidades de crecimiento...'
  },
  { 
    id: 'complete', 
    icon: CheckCircle2, 
    title: '¡Listo!',
    description: 'Tu estrategia está preparada'
  }
];

export const OnboardingWowLoader = ({ progress, currentPhase }: OnboardingWowLoaderProps) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  useEffect(() => {
    const index = phases.findIndex(p => p.id === currentPhase);
    if (index >= 0) setCurrentPhaseIndex(index);
  }, [currentPhase]);

  // Determinar fase automáticamente basada en progreso
  useEffect(() => {
    if (progress < 30) setCurrentPhaseIndex(0);
    else if (progress < 60) setCurrentPhaseIndex(1);
    else if (progress < 90) setCurrentPhaseIndex(2);
    else setCurrentPhaseIndex(3);
  }, [progress]);

  const CurrentIcon = phases[currentPhaseIndex].icon;

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardContent className="pt-8 pb-6">
        <div className="text-center space-y-6">
          {/* Icono animado */}
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.3, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-primary/30"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.6, 0.4, 0.6]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            />
            <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhaseIndex}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {currentPhaseIndex < 3 ? (
                    <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                  ) : (
                    <CurrentIcon className="w-8 h-8 text-primary-foreground" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Título y descripción */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhaseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-semibold text-foreground">
                {phases[currentPhaseIndex].title}
              </h3>
              <p className="text-muted-foreground">
                {phases[currentPhaseIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Barra de progreso */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress}% completado
            </p>
          </div>

          {/* Indicadores de fase */}
          <div className="flex justify-center gap-3 pt-2">
            {phases.slice(0, 3).map((phase, index) => {
              const Icon = phase.icon;
              const isActive = index === currentPhaseIndex;
              const isComplete = index < currentPhaseIndex;
              
              return (
                <motion.div
                  key={phase.id}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isComplete 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
