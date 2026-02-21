import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, HelpCircle, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import InferredFieldCard from '../InferredFieldCard';
import { cn } from '@/lib/utils';
import { BusinessModel } from './BusinessModelStep';
import { getBusinessModelContext } from '@/lib/businessModelContext';

interface CoreMissionLogicStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
  businessModel?: BusinessModel | null;
}

const timelineOptions = [
  { value: '1_year', labelKey: 'journey.sdna.timeline1y', fallback: '1 Año', descKey: 'journey.sdna.timeline1yDesc', descFallback: 'Validar modelo y primeros clientes' },
  { value: '3_years', labelKey: 'journey.sdna.timeline3y', fallback: '3 Años', descKey: 'journey.sdna.timeline3yDesc', descFallback: 'Escalar operación y consolidar posición' },
];

export default function CoreMissionLogicStep({ strategy, onUpdate, isSaving, diagnosticData, businessModel }: CoreMissionLogicStepProps) {
  const { t } = useTranslation();
  const bmCtx = getBusinessModelContext(businessModel || null);
  const [aspiration, setAspiration] = useState(strategy.winningAspiration || '');
  const [currentSituation, setCurrentSituation] = useState(strategy.currentSituation || '');
  const [futurePositioning, setFuturePositioning] = useState(strategy.futurePositioning || '');
  const [timeline, setTimeline] = useState<'1_year' | '3_years' | '5_years'>(
    strategy.aspirationTimeline || '1_year'
  );
  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    await onUpdate({ 
      winningAspiration: aspiration, 
      aspirationTimeline: timeline,
      currentSituation,
      futurePositioning
    });
    setHasChanges(false);
  }, [aspiration, timeline, currentSituation, futurePositioning, hasChanges, onUpdate]);

  // Keep refs in sync for flush-on-unmount
  const saveRef = useRef(saveChanges);
  saveRef.current = saveChanges;
  const hasChangesRef = useRef(hasChanges);
  hasChangesRef.current = hasChanges;

  // Flush pending changes on unmount
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        saveRef.current();
      }
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (hasChanges) saveChanges(); }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleChange = (value: string) => { setAspiration(value); setHasChanges(true); };
  const handleTimelineChange = (value: string) => { setTimeline(value as any); setHasChanges(true); };

  const inferredProblem = diagnosticData?.structuralProblem || null;
  const inferredTransformation = diagnosticData?.transformation || null;
  const hasScores = !!diagnosticData?.executiveDiagnosis;
  const hasPrimaryConstraint = !!diagnosticData?.primaryConstraint;
  const hasLeverageFocus = !!diagnosticData?.highestLeverageFocus;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Cpu className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono text-primary uppercase tracking-wider mb-1">
                {t('journey.sdna.moduleLabel', 'Módulo')} 1/3
              </p>
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.sdna.module1Title', 'Core Mission Logic')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.sdna.module1LongDesc')}
              </CardDescription>
              {/* Business model context hint */}
              <p className="text-xs text-primary/70 mt-2 italic">
                {t(bmCtx.problemFocus)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Diagnosis Score Context */}
      {hasScores && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {t('journey.sdna.diagnosisContext')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('journey.sdna.scoreVisibility'), value: diagnosticData!.executiveDiagnosis!.visibility },
                    { label: t('journey.sdna.scoreTrust'), value: diagnosticData!.executiveDiagnosis!.trust },
                    { label: t('journey.sdna.scorePositioning'), value: diagnosticData!.executiveDiagnosis!.positioning },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-md bg-background/60">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-700/70 italic">
                  {t('journey.sdna.scoresUsedForInference')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Constraint & Highest Leverage Focus */}
      {(hasPrimaryConstraint || hasLeverageFocus) && (
        <Card className="border-muted">
          <CardContent className="pt-4 space-y-3">
            {hasPrimaryConstraint && (
              <div>
                <p className="text-xs font-medium text-destructive/80 mb-1">
                  {t('journey.sdna.primaryConstraint', 'Restricción Principal Detectada')}
                </p>
                <p className="text-sm text-muted-foreground">{diagnosticData!.primaryConstraint}</p>
              </div>
            )}
            {hasLeverageFocus && (
              <div>
                <p className="text-xs font-medium text-primary/80 mb-1">
                  {t('journey.sdna.highestLeverage', 'Mayor Punto de Apalancamiento')}
                </p>
                <p className="text-sm text-muted-foreground">{diagnosticData!.highestLeverageFocus}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current State Detected */}
      {diagnosticData?.currentState && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              {t('journey.sdna.detectedState')}
            </CardTitle>
            <CardDescription>{t('journey.sdna.detectedStateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <InferredFieldCard
              label={t('journey.sdna.currentSituation')}
              inferredValue={diagnosticData.currentState}
              currentValue={currentSituation}
              onChange={(v) => { setCurrentSituation(v); setHasChanges(true); }}
              showDualState={false}
              minHeight="80px"
            />
          </CardContent>
        </Card>
      )}

      {/* Structural Problem - with BM-aware placeholders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t('journey.sdna.structuralProblem')}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">{t('journey.sdna.structuralProblemExample')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('journey.sdna.structuralProblemExampleText')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            {t(bmCtx.transformationFocus)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InferredFieldCard
            label={t('journey.sdna.problemAndTransformation')}
            inferredValue={inferredProblem}
            currentValue={aspiration}
            onChange={handleChange}
            placeholder={t(bmCtx.problemPlaceholderKey)}
            showDualState={!!inferredProblem}
            currentStateLabel={t('journey.sdna.detectedState')}
            desiredStateLabel={t('journey.sdna.desiredState')}
            minHeight="140px"
          />
          <div className="flex items-center justify-between text-sm">
            <span className={cn("transition-colors", aspiration.length >= 20 ? "text-green-600" : "text-muted-foreground")}>
              {aspiration.length}/20 {t('common.minCharacters', 'caracteres mínimos')}
              {aspiration.length >= 20 && " ✓"}
            </span>
            {isSaving && <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Desired Future State */}
      {diagnosticData?.desiredState && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t('journey.sdna.desiredState')}
            </CardTitle>
            <CardDescription>{t('journey.sdna.desiredStateDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <InferredFieldCard
              label={t('journey.sdna.futurePositioning')}
              inferredValue={diagnosticData.desiredState}
              currentValue={futurePositioning}
              onChange={(v) => { setFuturePositioning(v); setHasChanges(true); }}
              showDualState={false}
              minHeight="80px"
            />
          </CardContent>
        </Card>
      )}

      {/* Impact Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            {t('journey.sdna.impactTimeline')}
          </CardTitle>
          <CardDescription>
            {t('journey.sdna.impactTimelineHint')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={timeline} onValueChange={handleTimelineChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {timelineOptions.map((opt) => (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                <Label
                  htmlFor={opt.value}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted/50",
                    timeline === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}
                >
                  <span className="font-semibold text-lg">{t(opt.labelKey, opt.fallback)}</span>
                  <span className="text-sm text-muted-foreground">{t(opt.descKey, opt.descFallback)}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
