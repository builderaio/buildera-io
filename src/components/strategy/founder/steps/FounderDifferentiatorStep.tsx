import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, HelpCircle, Sparkles, Shield, Clock, Heart, DollarSign, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { PlayToWinStrategy, MoatType } from '@/types/playToWin';
import { cn } from '@/lib/utils';

interface FounderDifferentiatorStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
}

const moatOptions: { value: MoatType; label: string; description: string; icon: React.ComponentType<any> }[] = [
  { 
    value: 'cost', 
    label: 'Precio más bajo', 
    description: 'Ofreces lo mismo pero más barato',
    icon: DollarSign
  },
  { 
    value: 'differentiation', 
    label: 'Mejor producto/servicio', 
    description: 'Ofreces algo único o de mayor calidad',
    icon: Award
  },
  { 
    value: 'focus', 
    label: 'Especialización', 
    description: 'Te enfocas en un nicho muy específico',
    icon: Shield
  },
  { 
    value: 'network_effects', 
    label: 'Efectos de red', 
    description: 'Más usuarios = más valor para todos',
    icon: Heart
  }
];

const differentiatorPrompts = [
  "A diferencia de la competencia, yo...",
  "Mis clientes me eligen porque...",
  "Lo que nadie más ofrece es...",
  "Mi ventaja única es..."
];

export default function FounderDifferentiatorStep({ strategy, onUpdate, isSaving }: FounderDifferentiatorStepProps) {
  const { t } = useTranslation();
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState(strategy.competitiveAdvantage || '');
  const [moatType, setMoatType] = useState<MoatType | null>(strategy.moatType || null);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounced save
  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    
    await onUpdate({
      competitiveAdvantage,
      moatType
    });
    setHasChanges(false);
  }, [competitiveAdvantage, moatType, hasChanges, onUpdate]);

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasChanges) {
        saveChanges();
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAdvantageChange = (value: string) => {
    setCompetitiveAdvantage(value);
    setHasChanges(true);
  };

  const handleMoatChange = (value: string) => {
    setMoatType(value as MoatType);
    setHasChanges(true);
  };

  const handlePromptClick = (prompt: string) => {
    setCompetitiveAdvantage(prompt + ' ');
    setHasChanges(true);
  };

  const advantageLength = competitiveAdvantage.length;
  const isAdvantageValid = advantageLength >= 20;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.founder.step3Title', 'Paso 3: Tu Diferenciador')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.founder.step3Description', '¿Por qué un cliente te elegiría a ti en lugar de la competencia? Define tu ventaja única.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Moat Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            {t('journey.founder.moatTitle', '¿Cuál es tu tipo de ventaja?')}
          </CardTitle>
          <CardDescription>
            {t('journey.founder.moatHint', 'Elige la estrategia principal que define cómo compites')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={moatType || ''}
            onValueChange={handleMoatChange}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {moatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                      "hover:bg-muted/50",
                      moatType === option.value
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      moatType === option.value ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">{option.label}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Competitive Advantage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t('journey.founder.advantageTitle', 'Describe tu ventaja competitiva')}
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
                    "A diferencia de las agencias grandes, yo ofrezco atención personalizada 
                    con respuesta en menos de 2 horas, y mis clientes tienen acceso directo 
                    a mí sin intermediarios."
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>
            {t('journey.founder.advantageHint', 'Sé específico sobre qué te hace diferente y mejor')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick prompts */}
          {!competitiveAdvantage && (
            <div className="flex flex-wrap gap-2">
              {differentiatorPrompts.map((prompt, i) => (
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
              value={competitiveAdvantage}
              onChange={(e) => handleAdvantageChange(e.target.value)}
              placeholder={t('journey.founder.advantagePlaceholder', 'Ej: Mis clientes me eligen porque ofrezco la mejor relación calidad-precio del mercado, con soporte 24/7 y garantía de satisfacción...')}
              className="min-h-[120px] resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                "transition-colors",
                isAdvantageValid ? "text-green-600" : "text-muted-foreground"
              )}>
                {advantageLength}/20 {t('common.minCharacters', 'caracteres mínimos')}
                {isAdvantageValid && " ✓"}
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
                {t('journey.founder.differentiatorTips', 'Consejos para definir tu diferenciador')}
              </h4>
              <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>• {t('journey.founder.differentiatorTip1', 'Piensa en lo que tus clientes NO pueden conseguir en otro lado')}</li>
                <li>• {t('journey.founder.differentiatorTip2', 'Puede ser tu experiencia, tu proceso, tu velocidad o tu enfoque')}</li>
                <li>• {t('journey.founder.differentiatorTip3', 'Si no puedes describirlo en 1 frase, simplifica')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
