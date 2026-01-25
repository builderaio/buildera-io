import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Users, Zap, 
  ChevronRight, Sparkles, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import { useNavigate } from 'react-router-dom';

// Import simplified step components
import FounderAspirationStep from './steps/FounderAspirationStep';
import FounderTargetCustomerStep from './steps/FounderTargetCustomerStep';
import FounderDifferentiatorStep from './steps/FounderDifferentiatorStep';
import FounderCompletionScreen from './FounderCompletionScreen';

interface FounderPTWSimplifiedProps {
  companyId: string;
  companyName?: string;
  onComplete?: () => void;
}

const FOUNDER_STEPS = [
  {
    id: 1,
    key: 'aspiration',
    title: 'Tu Visión de Éxito',
    description: '¿Qué significa ganar para ti en 1 año?',
    icon: Trophy
  },
  {
    id: 2,
    key: 'target_customer',
    title: 'Tu Cliente Ideal',
    description: '¿A quién vas a servir?',
    icon: Users
  },
  {
    id: 3,
    key: 'differentiator',
    title: 'Tu Diferenciador',
    description: '¿Qué te hace único?',
    icon: Zap
  }
];

export default function FounderPTWSimplified({ 
  companyId, 
  companyName,
  onComplete 
}: FounderPTWSimplifiedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  
  const {
    strategy,
    isLoading,
    isSaving,
    initializeStrategy,
    updateStrategy
  } = usePlayToWin(companyId);

  // Initialize strategy if none exists
  useEffect(() => {
    if (!isLoading && !strategy && companyId) {
      initializeStrategy();
    }
  }, [isLoading, strategy, companyId, initializeStrategy]);

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark as complete
      await updateStrategy({ 
        status: 'in_progress',
        generatedWithAI: false 
      });
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToDashboard = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/company-dashboard?view=comando');
    }
  };

  const handleExpandStrategy = () => {
    navigate('/company-dashboard?view=estrategia-ptw');
  };

  // Calculate progress for simplified wizard
  const calculateProgress = () => {
    if (!strategy) return 0;
    let progress = 0;
    
    // Step 1: Aspiration (33%)
    if (strategy.winningAspiration && strategy.winningAspiration.length >= 20) {
      progress += 33;
    }
    
    // Step 2: Target Customer (33%)
    if (strategy.targetSegments && strategy.targetSegments.length > 0) {
      progress += 33;
    }
    
    // Step 3: Differentiator (34%)
    if (strategy.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20) {
      progress += 34;
    }
    
    return progress;
  };

  const renderStepContent = () => {
    if (!strategy) return null;

    switch (currentStep) {
      case 1:
        return (
          <FounderAspirationStep
            strategy={strategy}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 2:
        return (
          <FounderTargetCustomerStep
            strategy={strategy}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 3:
        return (
          <FounderDifferentiatorStep
            strategy={strategy}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{t('common.loading', 'Cargando...')}</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <FounderCompletionScreen
        companyName={companyName}
        strategy={strategy}
        onGoToDashboard={handleGoToDashboard}
        onExpandStrategy={handleExpandStrategy}
      />
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">
                  {t('journey.founder.wizardTitle', 'Define tu Estrategia')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {companyName ? `${companyName} • ` : ''}
                  {t('journey.founder.wizardSubtitle', '3 decisiones clave para empezar')}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <span className="text-sm font-medium">{progress}%</span>
              <Progress value={progress} className="w-24 h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Step Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {t('journey.founder.stepsTitle', 'Tu Estrategia')}
                </CardTitle>
                <CardDescription>
                  {t('journey.founder.stepsSubtitle', '3 pasos esenciales')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {FOUNDER_STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  const StepIcon = step.icon;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 p-2 rounded-md",
                        isActive 
                          ? "bg-primary-foreground/20" 
                          : isCompleted 
                            ? "bg-green-500/10 text-green-600" 
                            : "bg-muted"
                      )}>
                        {isCompleted && !isActive ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{step.title}</div>
                        <div className={cn(
                          "text-xs truncate",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {step.description}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.previous', 'Anterior')}
              </Button>
              
              <div className="flex items-center gap-2">
                {FOUNDER_STEPS.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentStep === step.id 
                        ? "w-6 bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Ir al paso ${step.id}`}
                  />
                ))}
              </div>
              
              <Button
                onClick={handleNext}
                className="gap-2"
              >
                {currentStep === 3 ? (
                  <>
                    <PartyPopper className="h-4 w-4" />
                    {t('common.finish', 'Finalizar')}
                  </>
                ) : (
                  <>
                    {t('common.next', 'Siguiente')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
