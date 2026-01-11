import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, FileSearch, CheckCircle2, Loader2, Clock, Sparkles, Brain, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingWowLoaderProps {
  progress: number;
  currentPhase: 'analyzing' | 'evaluating' | 'diagnosing' | 'complete';
  estimatedTotalSeconds?: number; // Optional: default 180 (3 min)
}

const phases = [
  { 
    id: 'analyzing', 
    icon: Globe, 
    titleKey: 'onboarding.phases.analyzing.title',
    descriptionKey: 'onboarding.phases.analyzing.description',
    fallbackTitle: 'Analizando tu sitio web',
    fallbackDescription: 'Extrayendo información de tu empresa...'
  },
  { 
    id: 'evaluating', 
    icon: Search, 
    titleKey: 'onboarding.phases.evaluating.title',
    descriptionKey: 'onboarding.phases.evaluating.description',
    fallbackTitle: 'Evaluando presencia digital',
    fallbackDescription: 'Analizando redes sociales y posicionamiento...'
  },
  { 
    id: 'diagnosing', 
    icon: FileSearch, 
    titleKey: 'onboarding.phases.diagnosing.title',
    descriptionKey: 'onboarding.phases.diagnosing.description',
    fallbackTitle: 'Generando diagnóstico',
    fallbackDescription: 'Creando plan de acción personalizado...'
  },
  { 
    id: 'complete', 
    icon: CheckCircle2, 
    titleKey: 'onboarding.phases.complete.title',
    descriptionKey: 'onboarding.phases.complete.description',
    fallbackTitle: '¡Análisis Completo!',
    fallbackDescription: 'Tu diagnóstico está listo'
  }
];

// Tips to show while waiting
const waitingTips = [
  { icon: Brain, text: 'Nuestros agentes de IA están analizando más de 50 puntos de tu presencia digital' },
  { icon: Sparkles, text: 'Estamos identificando oportunidades únicas para tu negocio' },
  { icon: Zap, text: 'Un análisis manual tomaría horas - nosotros lo hacemos en minutos' },
  { icon: Globe, text: 'Analizamos tu web, redes sociales y competencia simultáneamente' },
  { icon: Search, text: 'Buscando las mejores estrategias para tu industria' },
];

export const OnboardingWowLoader = ({ 
  progress, 
  currentPhase,
  estimatedTotalSeconds = 180 
}: OnboardingWowLoaderProps) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { t } = useTranslation(['common']);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate tips every 8 seconds
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % waitingTips.length);
    }, 8000);
    return () => clearInterval(tipTimer);
  }, []);

  useEffect(() => {
    const index = phases.findIndex(p => p.id === currentPhase);
    if (index >= 0) setCurrentPhaseIndex(index);
  }, [currentPhase]);

  useEffect(() => {
    if (progress < 30) setCurrentPhaseIndex(0);
    else if (progress < 60) setCurrentPhaseIndex(1);
    else if (progress < 90) setCurrentPhaseIndex(2);
    else setCurrentPhaseIndex(3);
  }, [progress]);

  // Calculate remaining time estimate
  const timeInfo = useMemo(() => {
    const estimatedRemaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
    const minutes = Math.floor(estimatedRemaining / 60);
    const seconds = estimatedRemaining % 60;
    
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const elapsedSecs = elapsedSeconds % 60;
    
    return {
      remaining: { minutes, seconds },
      elapsed: { minutes: elapsedMinutes, seconds: elapsedSecs },
      isLongWait: elapsedSeconds > 60,
      isVeryLongWait: elapsedSeconds > 120
    };
  }, [elapsedSeconds, estimatedTotalSeconds]);

  const CurrentIcon = phases[currentPhaseIndex].icon;
  const currentPhaseData = phases[currentPhaseIndex];
  const currentTip = waitingTips[currentTipIndex];
  const TipIcon = currentTip.icon;

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden">
      <CardContent className="pt-8 pb-6">
        <div className="text-center space-y-6">
          {/* Animated icon */}
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

          {/* Title and description */}
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
                {t(`common:${currentPhaseData.titleKey}`, currentPhaseData.fallbackTitle)}
              </h3>
              <p className="text-muted-foreground">
                {t(`common:${currentPhaseData.descriptionKey}`, currentPhaseData.fallbackDescription)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {progress}% {t('common:status.completed', 'completado')}
            </p>
          </div>

          {/* Time indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              {timeInfo.elapsed.minutes > 0 
                ? `${timeInfo.elapsed.minutes}m ${timeInfo.elapsed.seconds}s`
                : `${timeInfo.elapsed.seconds}s`
              }
              {timeInfo.remaining.minutes > 0 && (
                <span className="text-muted-foreground/70">
                  {' '}• ~{timeInfo.remaining.minutes}m restantes
                </span>
              )}
            </span>
          </div>

          {/* Rotating tips for long waits */}
          {timeInfo.isLongWait && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="bg-muted/50 rounded-lg p-4 border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TipIcon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    {currentTip.text}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Patience message for very long waits */}
          {timeInfo.isVeryLongWait && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground/70 italic"
            >
              El análisis profundo puede tomar hasta 3 minutos. ¡Vale la pena la espera!
            </motion.p>
          )}

          {/* Phase indicators */}
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
