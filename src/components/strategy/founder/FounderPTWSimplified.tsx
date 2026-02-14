import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';

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
  {
    id: 1,
    key: 'core_mission',
    icon: Cpu,
  },
  {
    id: 2,
    key: 'target_market',
    icon: Crosshair,
  },
  {
    id: 3,
    key: 'competitive_positioning',
    icon: Shield,
  }
];

export default function FounderPTWSimplified({ 
  companyId, 
  companyName,
  onComplete 
}: FounderPTWSimplifiedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0 = intro
  const [isComplete, setIsComplete] = useState(false);
  
  const {
    strategy,
    isLoading,
    isSaving,
    initializeStrategy,
    updateStrategy
  } = usePlayToWin(companyId);

  useEffect(() => {
    if (!isLoading && !strategy && companyId) {
      initializeStrategy();
    }
  }, [isLoading, strategy, companyId, initializeStrategy]);

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      await updateStrategy({ 
        status: 'in_progress',
        generatedWithAI: false 
      });
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToADN = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/company-dashboard?view=strategic-control');
    }
  };

  const handleExpandStrategy = () => {
    navigate('/company-dashboard?view=estrategia-ptw');
  };

  const calculateActivation = () => {
    if (!strategy) return 0;
    let activation = 0;
    if (strategy.winningAspiration && strategy.winningAspiration.length >= 20) activation += 33;
    if (strategy.targetSegments && strategy.targetSegments.length > 0) activation += 33;
    if (strategy.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20) activation += 34;
    return activation;
  };

  const renderStepContent = () => {
    if (!strategy) return null;
    switch (currentStep) {
      case 1:
        return <CoreMissionLogicStep strategy={strategy} onUpdate={updateStrategy} isSaving={isSaving} />;
      case 2:
        return <TargetMarketDefinitionStep strategy={strategy} onUpdate={updateStrategy} isSaving={isSaving} />;
      case 3:
        return <CompetitivePositioningEngineStep strategy={strategy} onUpdate={updateStrategy} isSaving={isSaving} />;
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
        strategy={strategy}
        onGoToADN={handleGoToADN}
        onExpandStrategy={handleExpandStrategy}
      />
    );
  }

  const activation = calculateActivation();

  // Intro screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Title */}
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

            {/* Why this matters */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-destructive">
                      {t('journey.sdna.whyCriticalTitle', '¿Por qué es crítica esta configuración?')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('journey.sdna.whyCriticalDesc', 'Sin estos datos, el sistema opera a ciegas. Cada agente de IA, cada decisión autónoma y cada contenido generado depende de estas 3 definiciones. Completarlas correctamente multiplica la precisión del sistema en un orden de magnitud.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System impact */}
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
                    t('journey.sdna.impact1', 'Los agentes de marketing generarán contenido alineado con tu posicionamiento real.'),
                    t('journey.sdna.impact2', 'Las decisiones autónomas se calibrarán según tu mercado objetivo y nivel competitivo.'),
                    t('journey.sdna.impact3', 'El Autopilot priorizará acciones que construyan tus activos estratégicos clave.'),
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* What changes after */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <Rocket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      {t('journey.sdna.afterTitle', '¿Qué cambiará después de completarlo?')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('journey.sdna.afterDesc', 'Se generará tu Strategic Operating Profile — el documento que define cómo opera tu negocio dentro del sistema. Todos los módulos se desbloquean y el Cerebro Empresarial comienza a tomar decisiones informadas.')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3 Modules Preview */}
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

            {/* CTA */}
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

  // Module screens (steps 1-3)
  return (
    <div className="min-h-screen bg-background">
      {/* Header with activation bar */}
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
          {/* Activation Progress Bar */}
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
                  const isCompleted = currentStep > mod.id;
                  const ModIcon = mod.icon;
                  
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setCurrentStep(mod.id)}
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
                disabled={currentStep <= 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.previous', 'Anterior')}
              </Button>
              
              <div className="flex items-center gap-2">
                {STRATEGIC_MODULES.map((mod) => (
                  <button
                    key={mod.id}
                    onClick={() => setCurrentStep(mod.id)}
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
