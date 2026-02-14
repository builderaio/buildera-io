import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Cpu, Sparkles, HelpCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PlayToWinStrategy } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import InferredFieldCard from '../InferredFieldCard';
import { cn } from '@/lib/utils';

interface CoreMissionLogicStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
}

const timelineOptions = [
  { value: '1_year', labelKey: 'journey.sdna.timeline1y', fallback: '1 Año', descKey: 'journey.sdna.timeline1yDesc', descFallback: 'Validar modelo y primeros clientes' },
  { value: '3_years', labelKey: 'journey.sdna.timeline3y', fallback: '3 Años', descKey: 'journey.sdna.timeline3yDesc', descFallback: 'Escalar operación y consolidar posición' },
];

export default function CoreMissionLogicStep({ strategy, onUpdate, isSaving, diagnosticData }: CoreMissionLogicStepProps) {
  const { t } = useTranslation();
  const [aspiration, setAspiration] = useState(strategy.winningAspiration || '');
  const [timeline, setTimeline] = useState<'1_year' | '3_years' | '5_years'>(
    strategy.aspirationTimeline || '1_year'
  );
  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    await onUpdate({ winningAspiration: aspiration, aspirationTimeline: timeline });
    setHasChanges(false);
  }, [aspiration, timeline, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => { if (hasChanges) saveChanges(); }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleChange = (value: string) => { setAspiration(value); setHasChanges(true); };
  const handleTimelineChange = (value: string) => { setTimeline(value as any); setHasChanges(true); };

  // Build inferred text combining problem + transformation
  const inferredMission = diagnosticData
    ? [diagnosticData.structuralProblem, diagnosticData.transformation].filter(Boolean).join('\n\n') || null
    : null;

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
                {t('journey.sdna.module1LongDesc', 'Define el problema estructural que resuelves, la transformación que prometes y el horizonte temporal de impacto.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Structural Problem + Transformation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t('journey.sdna.structuralProblem', 'Problema estructural y transformación prometida')}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">{t('journey.sdna.structuralProblemExample', 'Ejemplo:')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('journey.sdna.structuralProblemExampleText', '"Las PYMEs pierden 40% de oportunidades de venta..."')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            {t('journey.sdna.structuralProblemHint', 'Describe qué falla en el mercado y qué transformación entregas. Sé específico con datos o métricas.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InferredFieldCard
            label={t('journey.sdna.currentVsDesired', 'Misión y transformación')}
            inferredValue={inferredMission}
            currentValue={aspiration}
            onChange={handleChange}
            placeholder={t('journey.sdna.structuralProblemPlaceholder', 'Ej: Los negocios locales pierden clientes porque no pueden competir digitalmente...')}
            showDualState={!!inferredMission}
            currentStateLabel={t('journey.sdna.detectedState', 'Estado actual detectado')}
            desiredStateLabel={t('journey.sdna.desiredState', 'Posicionamiento futuro deseado')}
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

      {/* Impact Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            {t('journey.sdna.impactTimeline', 'Horizonte temporal de impacto')}
          </CardTitle>
          <CardDescription>
            {t('journey.sdna.impactTimelineHint', '¿En cuánto tiempo tu cliente verá la transformación?')}
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
