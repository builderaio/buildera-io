import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Sparkles, HelpCircle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PlayToWinStrategy } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface FounderAspirationStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const timelineOptions = [
  { value: '1_year', label: '1 Año', description: 'Validar la idea y primeros clientes' },
  { value: '3_years', label: '3 Años', description: 'Crecimiento y escala inicial' }
];

const aspirationPrompts = [
  "Quiero que mi negocio sea reconocido como...",
  "En 1 año, mi empresa habrá logrado...",
  "El éxito para mí significa...",
  "Mi objetivo principal es..."
];

export default function FounderAspirationStep({ strategy, onUpdate, isSaving }: FounderAspirationStepProps) {
  const { t } = useTranslation();
  const [aspiration, setAspiration] = useState(strategy.winningAspiration || '');
  const [timeline, setTimeline] = useState<'1_year' | '3_years' | '5_years'>(
    strategy.aspirationTimeline || '1_year'
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      winningAspiration: aspiration,
      aspirationTimeline: timeline
    });
    setHasChanges(false);
  }, [aspiration, timeline, hasChanges, onUpdate]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) {
        saveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAspirationChange = (value: string) => {
    setAspiration(value);
    setHasChanges(true);
  };

  const handleTimelineChange = (value: string) => {
    const typedValue = value as '1_year' | '3_years' | '5_years';
    setTimeline(typedValue);
    setHasChanges(true);
  };

  const handlePromptClick = (prompt: string) => {
    setAspiration(prompt + ' ');
    setHasChanges(true);
  };

  const aspirationLength = aspiration.length;
  const isAspirationValid = aspirationLength >= 20;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.founder.step1Title', 'Paso 1: Tu Visión de Éxito')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.founder.step1Description', '¿Qué significa el éxito para tu negocio en el próximo año? Sé específico y ambicioso.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            {t('journey.founder.timelineTitle', '¿En cuánto tiempo quieres lograrlo?')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={timeline}
            onValueChange={handleTimelineChange}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {timelineOptions.map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-lg border-2 p-4 cursor-pointer transition-all",
                    "hover:bg-muted/50",
                    timeline === option.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-muted/30"
                  )}
                >
                  <span className="font-semibold text-lg">{option.label}</span>
                  <span className="text-sm text-muted-foreground">{option.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Aspiration Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t('journey.founder.aspirationTitle', 'Describe tu visión de éxito')}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="font-medium mb-1">Ejemplo:</p>
                  <p className="text-sm text-muted-foreground">
                    "Quiero tener 50 clientes satisfechos, generar $5,000 mensuales y ser 
                    reconocido como la mejor opción para pequeños restaurantes en mi ciudad."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            {t('journey.founder.aspirationHint', 'Sé específico: incluye números, clientes o impacto que quieres lograr')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick prompts */}
          {!aspiration && (
            <div className="flex flex-wrap gap-2">
              {aspirationPrompts.map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {prompt}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              value={aspiration}
              onChange={(e) => handleAspirationChange(e.target.value)}
              placeholder={t('journey.founder.aspirationPlaceholder', 'Ej: Quiero tener 100 clientes activos, generar $10,000 en ingresos mensuales y ser la opción #1 para...')}
              className="min-h-[120px] resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "transition-colors",
                isAspirationValid ? "text-green-600" : "text-muted-foreground"
              )}>
                {aspirationLength}/20 {t('common.minCharacters', 'caracteres mínimos')}
                {isAspirationValid && " ✓"}
              </span>
              {isSaving && (
                <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg h-fit">
              <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                {t('journey.founder.tips', 'Consejos')}
              </h4>
              <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('journey.founder.tip1', 'Incluye números específicos (clientes, ingresos, alcance)')}</li>
                <li>• {t('journey.founder.tip2', 'Piensa en cómo se verá tu negocio cuando "ganes"')}</li>
                <li>• {t('journey.founder.tip3', 'Sé ambicioso pero realista para tu primer año')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
