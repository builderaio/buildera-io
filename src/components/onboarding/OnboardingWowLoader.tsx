import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Search, FileSearch, CheckCircle2, Clock, Sparkles, Brain, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LottieLoader, LottieAnimationType } from '@/components/ui/lottie-loader';

interface OnboardingWowLoaderProps {
  progress: number;
  currentPhase: 'analyzing' | 'evaluating' | 'diagnosing' | 'complete';
  estimatedTotalSeconds?: number;
}

const phases = [
  { 
    id: 'analyzing', 
    icon: Globe, 
    lottieType: 'pulsing' as LottieAnimationType,
    titleKey: 'onboarding.phases.analyzing.title',
    descriptionKey: 'onboarding.phases.analyzing.description',
    fallbackTitle: 'Analizando tu sitio web',
    fallbackDescription: 'Extrayendo información de tu empresa...'
  },
  { 
    id: 'evaluating', 
    icon: Search, 
    lottieType: 'processing' as LottieAnimationType,
    titleKey: 'onboarding.phases.evaluating.title',
    descriptionKey: 'onboarding.phases.evaluating.description',
    fallbackTitle: 'Evaluando presencia digital',
    fallbackDescription: 'Analizando redes sociales y posicionamiento...'
  },
  { 
    id: 'diagnosing', 
    icon: FileSearch, 
    lottieType: 'brain' as LottieAnimationType,
    titleKey: 'onboarding.phases.diagnosing.title',
    descriptionKey: 'onboarding.phases.diagnosing.description',
    fallbackTitle: 'Generando diagnóstico',
    fallbackDescription: 'Creando plan de acción personalizado...'
  },
  { 
    id: 'complete', 
    icon: CheckCircle2, 
    lottieType: 'success' as LottieAnimationType,
    titleKey: 'onboarding.phases.complete.title',
    descriptionKey: 'onboarding.phases.complete.description',
    fallbackTitle: '¡Análisis Completo!',
    fallbackDescription: 'Tu diagnóstico está listo'
  }
];

const waitingTips = [
  { icon: Brain, text: 'Nuestros agentes de IA están analizando más de 50 puntos de tu presencia digital' },
  { icon: Sparkles, text: 'Estamos identificando oportunidades únicas para tu negocio' },
  { icon: Zap, text: 'Un análisis manual tomaría horas - nosotros lo hacemos en minutos' },
  { icon: Globe, text: 'Analizamos tu web, redes sociales y competencia simultáneamente' },
  { icon: Search, text: 'Buscando las mejores estrategias para tu industria' },
];

// Floating particles for background ambiance
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary/20"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: '100%',
            opacity: 0 
          }}
          animate={{ 
            y: '-20%',
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
};

// Animated progress ring
const ProgressRing = ({ progress }: { progress: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted/30"
      />
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const OnboardingWowLoader = ({ 
  progress, 
  currentPhase,
  estimatedTotalSeconds = 180 
}: OnboardingWowLoaderProps) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const { t } = useTranslation(['common']);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const currentPhaseData = phases[currentPhaseIndex];
  const currentTip = waitingTips[currentTipIndex];
  const TipIcon = currentTip.icon;
  const isComplete = currentPhaseIndex === 3;

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden relative">
      <FloatingParticles />
      <CardContent className="pt-8 pb-6 relative z-10">
        <div className="text-center space-y-6">
          {/* Main Lottie Animation with Progress Ring */}
          <div className="relative w-32 h-32 mx-auto">
            <ProgressRing progress={progress} />
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhaseData.lottieType}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.4, type: 'spring' }}
                >
                  <LottieLoader 
                    type={currentPhaseData.lottieType}
                    size={80}
                    loop={!isComplete}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Progress percentage overlay */}
          <motion.div
            className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            key={progress}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {progress}%
          </motion.div>

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

          {/* Smooth animated progress bar */}
          <div className="relative">
            <Progress value={progress} className="h-2" />
            <motion.div
              className="absolute top-0 left-0 h-2 w-full rounded-full overflow-hidden"
              initial={false}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>

          {/* Time indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Clock className="w-4 h-4" />
            </motion.div>
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

          {/* Rotating tips for long waits with enhanced animation */}
          {timeInfo.isLongWait && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTipIndex}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TipIcon className="w-5 h-5 text-primary" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground text-left">
                    {currentTip.text}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Patience message for very long waits */}
          {timeInfo.isVeryLongWait && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <span className="italic">
                El análisis profundo puede tomar hasta 3 minutos. ¡Vale la pena la espera!
              </span>
            </motion.div>
          )}

          {/* Phase indicators with enhanced styling */}
          <div className="flex justify-center gap-4 pt-2">
            {phases.slice(0, 3).map((phase, index) => {
              const Icon = phase.icon;
              const isActive = index === currentPhaseIndex;
              const isPhaseComplete = index < currentPhaseIndex;
              
              return (
                <motion.div
                  key={phase.id}
                  className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isPhaseComplete 
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25' 
                      : isActive 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25' 
                        : 'bg-muted text-muted-foreground'
                  }`}
                  animate={isActive ? { 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 0 0 hsl(var(--primary) / 0.4)',
                      '0 0 0 8px hsl(var(--primary) / 0)',
                      '0 0 0 0 hsl(var(--primary) / 0)'
                    ]
                  } : {}}
                  transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                >
                  {isPhaseComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </motion.div>
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
