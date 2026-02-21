import React, { useState, useEffect } from 'react';
import { PlayToWinStrategy } from '@/types/playToWin';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Crosshair, Shield,
  ChevronRight, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, Rocket,
  Dna, AlertTriangle, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import { useDiagnosticInference } from '@/hooks/useDiagnosticInference';
import { useNavigate } from 'react-router-dom';

import BusinessModelStep, { BusinessModel } from './steps/BusinessModelStep';
import CoreMissionLogicStep from './steps/CoreMissionLogicStep';
import TargetMarketDefinitionStep from './steps/TargetMarketDefinitionStep';
import CompetitivePositioningEngineStep from './steps/CompetitivePositioningEngineStep';
import StrategicProfileGenerated from './StrategicProfileGenerated';

interface FounderPTWSimplifiedProps {
  companyId: string;
  companyName?: string;
  onComplete?: () => void;
}

const STRATEGIC_MODULES = [
  { id: 1, key: 'core_mission', icon: Cpu },
  { id: 2, key: 'target_market', icon: Crosshair },
  { id: 3, key: 'competitive_positioning', icon: Shield },
];

// Steps: 0=intro, 0.5=business model, 1-3=modules
type FlowStep = 'intro' | 'business_model' | 1 | 2 | 3;

export default function FounderPTWSimplified({ 
  companyId, 
  companyName,
  onComplete 
}: FounderPTWSimplifiedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro');
  const [businessModel, setBusinessModel] = useState<BusinessModel | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const {
    strategy,
    isLoading,
    isSaving,
    initializeStrategy,
    updateStrategy,
    refetch
  } = usePlayToWin(companyId);

  const { inferredData, isLoading: isDiagnosticLoading } = useDiagnosticInference(companyId);

  useEffect(() => {
    const init = async () => {
      if (!isLoading && !strategy && companyId) {
        const created = await initializeStrategy();
        if (!created) {
          console.error('Failed to initialize PTW strategy for company:', companyId);
        }
      }
    };
    init();
  }, [isLoading, strategy, companyId, initializeStrategy]);

  const handleNext = async () => {
    if (currentStep === 'intro') {
      setCurrentStep('business_model');
    } else if (currentStep === 'business_model') {
      if (businessModel) {
        await updateStrategy({ businessModel: businessModel as any });
      }
      setCurrentStep(1);
    } else if (typeof currentStep === 'number' && currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    } else {
      await updateStrategy({ 
        status: 'in_progress',
        generatedWithAI: false 
      });
      // Re-fetch from DB to ensure we have the latest persisted data
      await refetch();
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'business_model') {
      setCurrentStep('intro');
    } else if (currentStep === 1) {
      setCurrentStep('business_model');
    } else if (typeof currentStep === 'number' && currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleGoToADN = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/company-dashboard?view=strategic-control');
    }
  };


  const calculateActivation = () => {
    if (!strategy) return 0;
    let activation = 0;
    if (strategy.winningAspiration && strategy.winningAspiration.length >= 20) activation += 33;
    if (strategy.targetSegments && strategy.targetSegments.length > 0) activation += 33;
    if (strategy.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20) activation += 34;
    return activation;
  };

  const defaultStrategy: PlayToWinStrategy = {
    id: '',
    companyId: companyId,
    businessModel: businessModel as any || null,
    winningAspiration: '',
    aspirationMetrics: [],
    aspirationTimeline: '1_year',
    currentSituation: '',
    futurePositioning: '',
    targetMarkets: [],
    targetSegments: [],
    geographicFocus: [],
    channelsFocus: [],
    desiredAudiencePositioning: '',
    competitiveAdvantage: '',
    differentiationFactors: [],
    valuePropositionCanvas: null,
    moatType: null,
    competitiveCategory: '',
    keyAssets: '',
    requiredCapabilities: [],
    capabilityRoadmap: [],
    reviewCadence: 'monthly',
    okrs: [],
    kpiDefinitions: [],
    governanceModel: null,
    currentStep: 1,
    completionPercentage: 0,
    status: 'draft',
    generatedWithAI: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastReviewDate: null,
    nextReviewDate: null,
  };

  const activeStrategy = strategy || defaultStrategy;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CoreMissionLogicStep strategy={activeStrategy} onUpdate={updateStrategy} isSaving={isSaving} diagnosticData={inferredData} businessModel={businessModel} />;
      case 2:
        return <TargetMarketDefinitionStep strategy={activeStrategy} onUpdate={updateStrategy} isSaving={isSaving} diagnosticData={inferredData} businessModel={businessModel} />;
      case 3:
        return <CompetitivePositioningEngineStep strategy={activeStrategy} onUpdate={updateStrategy} isSaving={isSaving} diagnosticData={inferredData} businessModel={businessModel} />;
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
      <StrategicProfileGenerated
        companyName={companyName}
        strategy={activeStrategy}
        onGoToADN={handleGoToADN}
      />
    );
  }

  const activation = calculateActivation();

  // Intro screen
  if (currentStep === 'intro') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Dna className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t('journey.sdna.title', 'Strategic DNA Activation')}
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                {companyName && <span className="text-foreground font-medium">{companyName} — </span>}
                {t('journey.sdna.subtitle', 'Configura el núcleo operativo de tu sistema de inteligencia empresarial.')}
              </p>
            </div>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-destructive">
                      {t('journey.sdna.whyCriticalTitle', '¿Por qué es crítica esta configuración?')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('journey.sdna.whyCriticalDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t('journey.sdna.systemImpactTitle', '¿Cómo impactará al sistema?')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {[
                    t('journey.sdna.impact1'),
                    t('journey.sdna.impact2'),
                    t('journey.sdna.impact3'),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <Rocket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {t('journey.sdna.afterTitle')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('journey.sdna.afterDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold text-center text-sm text-muted-foreground uppercase tracking-wider">
                {t('journey.sdna.modulesPreview', '3 Módulos Estratégicos')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STRATEGIC_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div key={mod.id} className="p-4 rounded-lg border bg-card text-center space-y-2">
                      <Icon className="h-6 w-6 mx-auto text-primary" />
                      <p className="font-medium text-sm">
                        {t(`journey.sdna.module${mod.id}Title`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`journey.sdna.module${mod.id}Desc`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-4">
              <Button size="lg" onClick={handleNext} className="gap-2 px-8">
                {t('journey.sdna.startActivation', 'Iniciar Activación')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Business Model Selection step
  if (currentStep === 'business_model') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <BusinessModelStep
            value={businessModel}
            onChange={setBusinessModel}
            onNext={handleNext}
          />
        </div>
      </div>
    );
  }

  // Module screens (steps 1-3)
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Dna className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">
                {t('journey.sdna.title', 'Strategic DNA Activation')}
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activation}% → 100%
            </span>
          </div>
          <div className="space-y-1">
            <Progress value={activation} className="h-2" />
            <p className="text-[11px] text-muted-foreground text-center">
              {t('journey.sdna.activationLabel', 'Activación del Sistema')}: {activation}%
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {t('journey.sdna.modulesTitle', 'Módulos Estratégicos')}
                </CardTitle>
                <CardDescription>
                  {t('journey.sdna.modulesSubtitle', '3 definiciones críticas')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {STRATEGIC_MODULES.map((mod) => {
                  const isActive = currentStep === mod.id;
                  const isCompleted = typeof currentStep === 'number' && currentStep > mod.id;
                  const ModIcon = mod.icon;
                  
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setCurrentStep(mod.id as 1 | 2 | 3)}
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
                          <ModIcon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {t(`journey.sdna.module${mod.id}Title`)}
                        </div>
                        <div className={cn(
                          "text-xs truncate",
                          isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {t(`journey.sdna.module${mod.id}Desc`)}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
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
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.previous', 'Anterior')}
              </Button>
              
              <div className="flex items-center gap-2">
                {STRATEGIC_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setCurrentStep(mod.id as 1 | 2 | 3)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      currentStep === mod.id 
                        ? "w-6 bg-primary" 
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Module ${mod.id}`}
                  />
                ))}
              </div>
              
              <Button onClick={handleNext} className="gap-2">
                {currentStep === 3 ? (
                  <>
                    <Rocket className="h-4 w-4" />
                    {t('journey.sdna.generateProfile', 'Generar Perfil')}
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
