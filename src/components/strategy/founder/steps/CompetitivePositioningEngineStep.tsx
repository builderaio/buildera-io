import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, HelpCircle, DollarSign, Award, Heart, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PlayToWinStrategy, MoatType } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import InferredFieldCard from '../InferredFieldCard';
import { cn } from '@/lib/utils';

interface CompetitivePositioningEngineStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
}

const moatOptions: { value: MoatType; labelKey: string; fallback: string; descKey: string; descFallback: string; icon: React.ComponentType<any> }[] = [
  { value: 'cost', labelKey: 'journey.sdna.moatCost', fallback: 'Liderazgo en costo', descKey: 'journey.sdna.moatCostDesc', descFallback: 'Ofreces más valor a menor precio', icon: DollarSign },
  { value: 'differentiation', labelKey: 'journey.sdna.moatDiff', fallback: 'Diferenciación', descKey: 'journey.sdna.moatDiffDesc', descFallback: 'Producto/servicio superior o único', icon: Award },
  { value: 'focus', labelKey: 'journey.sdna.moatFocus', fallback: 'Especialización de nicho', descKey: 'journey.sdna.moatFocusDesc', descFallback: 'Dominas un segmento específico', icon: Layers },
  { value: 'network_effects', labelKey: 'journey.sdna.moatNetwork', fallback: 'Efectos de red', descKey: 'journey.sdna.moatNetworkDesc', descFallback: 'Más usuarios = más valor', icon: Heart },
];

export default function CompetitivePositioningEngineStep({ strategy, onUpdate, isSaving, diagnosticData }: CompetitivePositioningEngineStepProps) {
  const { t } = useTranslation();
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState(strategy.competitiveAdvantage || '');
  const [moatType, setMoatType] = useState<MoatType | null>(strategy.moatType || null);
  const [category, setCategory] = useState(diagnosticData?.competitiveCategory || '');
  const [keyAssets, setKeyAssets] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    await onUpdate({ competitiveAdvantage, moatType });
    setHasChanges(false);
  }, [competitiveAdvantage, moatType, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => { if (hasChanges) saveChanges(); }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAdvantageChange = (value: string) => { setCompetitiveAdvantage(value); setHasChanges(true); };
  const handleMoatChange = (value: string) => { setMoatType(value as MoatType); setHasChanges(true); };

  const isValid = competitiveAdvantage.length >= 20;

  // Build inferred positioning text
  const inferredPositioning = diagnosticData?.competitiveAdvantage || null;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono text-primary uppercase tracking-wider mb-1">
                {t('journey.sdna.moduleLabel', 'Módulo')} 3/3
              </p>
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.sdna.module3Title', 'Competitive Positioning Engine')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.sdna.module3LongDesc', 'Define la categoría en la que compites, tu diferenciador estructural y los activos clave que debes construir.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Competitive Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('journey.sdna.competitiveCategory', 'Categoría en la que compites')}</CardTitle>
          <CardDescription>{t('journey.sdna.competitiveCategoryHint', '¿En qué mercado/categoría te posicionas? Sé específico.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <InferredFieldCard
            label={t('journey.sdna.competitiveCategory', 'Categoría competitiva')}
            inferredValue={diagnosticData?.competitiveCategory || null}
            currentValue={category}
            onChange={setCategory}
            placeholder={t('journey.sdna.competitiveCategoryPlaceholder', 'Ej: Automatización de marketing para PYMEs en LATAM')}
            minHeight="60px"
          />
        </CardContent>
      </Card>

      {/* Structural Differentiator (Moat Type) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            {t('journey.sdna.structuralDiff', 'Diferenciador estructural')}
          </CardTitle>
          <CardDescription>{t('journey.sdna.structuralDiffHint', '¿Cuál es la barrera competitiva que te protege?')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={moatType || ''} onValueChange={handleMoatChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {moatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={`moat-${option.value}`} className="peer sr-only" />
                  <Label htmlFor={`moat-${option.value}`} className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted/50",
                    moatType === option.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}>
                    <div className={cn("p-2 rounded-lg shrink-0", moatType === option.value ? "bg-primary/20" : "bg-muted")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">{t(option.labelKey, option.fallback)}</span>
                      <span className="text-sm text-muted-foreground">{t(option.descKey, option.descFallback)}</span>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Competitive Advantage Description */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t('journey.sdna.advantageDesc', 'Describe tu ventaja competitiva')}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    {t('journey.sdna.advantageExampleText', '"Combinamos IA propietaria + metodología de consultoría estratégica..."')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>{t('journey.sdna.advantageHint', '¿Por qué un cliente informado te elegiría sobre la mejor alternativa?')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InferredFieldCard
            label={t('journey.sdna.advantageDesc', 'Ventaja competitiva')}
            inferredValue={inferredPositioning}
            currentValue={competitiveAdvantage}
            onChange={handleAdvantageChange}
            placeholder={t('journey.sdna.advantagePlaceholder', 'Ej: Mi plataforma integra diagnóstico, estrategia y ejecución...')}
            showDualState={!!inferredPositioning}
            currentStateLabel={t('journey.sdna.detectedState', 'Estado actual detectado')}
            desiredStateLabel={t('journey.sdna.desiredState', 'Posicionamiento futuro deseado')}
            minHeight="120px"
          />
          <div className="flex items-center justify-between text-sm">
            <span className={cn("transition-colors", isValid ? "text-green-600" : "text-muted-foreground")}>
              {competitiveAdvantage.length}/20 {t('common.minCharacters', 'caracteres mínimos')}
              {isValid && " ✓"}
            </span>
            {isSaving && <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Key Assets to Build */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('journey.sdna.keyAssets', 'Activos clave que debes construir')}</CardTitle>
          <CardDescription>{t('journey.sdna.keyAssetsHint', '¿Qué necesitas desarrollar para sostener tu ventaja a largo plazo?')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={keyAssets}
            onChange={(e) => setKeyAssets(e.target.value)}
            placeholder={t('journey.sdna.keyAssetsPlaceholder', 'Ej: 1) Base de datos de benchmarks por industria...')}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
