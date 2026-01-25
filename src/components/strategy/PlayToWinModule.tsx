import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Map, Zap, Wrench, Settings, BarChart3, 
  ChevronRight, Sparkles, CheckCircle2, Circle,
  ArrowLeft, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import { PTW_STEPS } from '@/types/playToWin';

// Import step components
import WinningAspirationStep from './steps/WinningAspirationStep';
import WhereToPlayStep from './steps/WhereToPlayStep';
import HowToWinStep from './steps/HowToWinStep';
import CapabilitiesStep from './steps/CapabilitiesStep';
import ManagementSystemsStep from './steps/ManagementSystemsStep';
import StrategyDashboard from './dashboard/StrategyDashboard';

interface PlayToWinModuleProps {
  companyId: string;
  companyName?: string;
}

const stepIcons: Record<string, React.ReactNode> = {
  Trophy: <Trophy className="h-5 w-5" />,
  Map: <Map className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />
};

export default function PlayToWinModule({ companyId, companyName }: PlayToWinModuleProps) {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'wizard' | 'dashboard'>('wizard');
  const [localStep, setLocalStep] = useState(1);
  
  const {
    strategy,
    reviews,
    isLoading,
    isSaving,
    initializeStrategy,
    updateStrategy,
    setCurrentStep,
    createReview
  } = usePlayToWin(companyId);

  // Initialize strategy if none exists
  useEffect(() => {
    if (!isLoading && !strategy && companyId) {
      initializeStrategy();
    }
  }, [isLoading, strategy, companyId, initializeStrategy]);

  // Sync local step with strategy
  useEffect(() => {
    if (strategy?.currentStep) {
      setLocalStep(strategy.currentStep);
    }
  }, [strategy?.currentStep]);

  const handleStepChange = async (step: number) => {
    setLocalStep(step);
    await setCurrentStep(step);
  };

  const handleNext = () => {
    if (localStep < 5) {
      handleStepChange(localStep + 1);
    } else {
      setActiveView('dashboard');
    }
  };

  const handlePrevious = () => {
    if (localStep > 1) {
      handleStepChange(localStep - 1);
    }
  };

  const renderStepContent = () => {
    if (!strategy) return null;

    switch (localStep) {
      case 1:
        return (
          <WinningAspirationStep
            strategy={strategy}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 2:
        return (
          <WhereToPlayStep
            strategy={strategy}
            companyId={companyId}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 3:
        return (
          <HowToWinStep
            strategy={strategy}
            companyId={companyId}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 4:
        return (
          <CapabilitiesStep
            strategy={strategy}
            onUpdate={updateStrategy}
            isSaving={isSaving}
          />
        );
      case 5:
        return (
          <ManagementSystemsStep
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Play to Win Strategy</h1>
                <p className="text-sm text-muted-foreground">
                  {companyName ? `${companyName} • ` : ''}
                  {t('ptw.subtitle', 'Define tu estrategia ganadora paso a paso')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress indicator */}
              <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                <span className="text-sm font-medium">{strategy?.completionPercentage || 0}%</span>
                <Progress value={strategy?.completionPercentage || 0} className="w-24 h-2" />
              </div>
              
              {/* View toggle */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={activeView === 'wizard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('wizard')}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">Wizard</span>
                </Button>
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeView === 'wizard' ? (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
              {/* Sidebar - Step Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Cascada Estratégica</CardTitle>
                    <CardDescription>5 decisiones clave</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {PTW_STEPS.map((step) => {
                      const isActive = localStep === step.id;
                      const isCompleted = (strategy?.completionPercentage || 0) >= (step.id * 20);
                      
                      return (
                        <button
                          key={step.id}
                          onClick={() => handleStepChange(step.id)}
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
                              stepIcons[step.icon]
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
                    
                    {/* Dashboard link */}
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-all"
                      >
                        <div className="flex-shrink-0 p-2 rounded-md bg-muted">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">Dashboard</div>
                          <div className="text-xs text-muted-foreground">
                            Ver métricas y progreso
                          </div>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={localStep}
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
                    disabled={localStep === 1}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {PTW_STEPS.map((step) => (
                      <button
                        key={step.id}
                        onClick={() => handleStepChange(step.id)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          localStep === step.id 
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
                    {localStep === 5 ? 'Ver Dashboard' : 'Siguiente'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StrategyDashboard
                strategy={strategy}
                reviews={reviews}
                onCreateReview={createReview}
                onBackToWizard={() => setActiveView('wizard')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
