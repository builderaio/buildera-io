import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, HelpCircle, DollarSign, Award, Heart, Layers, AlertTriangle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, MoatType } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import InferredFieldCard from '../InferredFieldCard';
import { cn } from '@/lib/utils';
import { BusinessModel } from './BusinessModelStep';
import { getBusinessModelContext } from '@/lib/businessModelContext';

interface CompetitivePositioningEngineStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
  businessModel?: BusinessModel | null;
}

const moatOptions: { value: MoatType; labelKey: string; fallback: string; descKey: string; descFallback: string; icon: React.ComponentType<any> }[] = [
  { value: 'cost', labelKey: 'journey.sdna.moatCost', fallback: 'Liderazgo en costo', descKey: 'journey.sdna.moatCostDesc', descFallback: 'Ofreces más valor a menor precio', icon: DollarSign },
  { value: 'differentiation', labelKey: 'journey.sdna.moatDiff', fallback: 'Diferenciación', descKey: 'journey.sdna.moatDiffDesc', descFallback: 'Producto/servicio superior o único', icon: Award },
  { value: 'focus', labelKey: 'journey.sdna.moatFocus', fallback: 'Especialización de nicho', descKey: 'journey.sdna.moatFocusDesc', descFallback: 'Dominas un segmento específico', icon: Layers },
  { value: 'network_effects', labelKey: 'journey.sdna.moatNetwork', fallback: 'Efectos de red', descKey: 'journey.sdna.moatNetworkDesc', descFallback: 'Más usuarios = más valor', icon: Heart },
];

export interface StepFlushHandle {
  flush: () => Promise<void>;
}

const CompetitivePositioningEngineStep = forwardRef<StepFlushHandle, CompetitivePositioningEngineStepProps>(function CompetitivePositioningEngineStep({ strategy, onUpdate, isSaving, diagnosticData, businessModel }, ref) {
  const { t } = useTranslation();
  const bmCtx = getBusinessModelContext(businessModel || null);
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState(strategy.competitiveAdvantage || '');
  const [moatType, setMoatType] = useState<MoatType | null>(
    strategy.moatType || diagnosticData?.suggestedMoat || null
  );
  const [moatInferred] = useState(!!diagnosticData?.suggestedMoat && !strategy.moatType);
  const [category, setCategory] = useState(strategy.competitiveCategory || diagnosticData?.competitiveCategory || '');
  const [keyAssets, setKeyAssets] = useState(strategy.keyAssets || '');
  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    await onUpdate({ competitiveAdvantage, moatType, competitiveCategory: category, keyAssets });
    setHasChanges(false);
  }, [competitiveAdvantage, moatType, category, keyAssets, hasChanges, onUpdate]);

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

  // Expose flush method to parent via ref
  useImperativeHandle(ref, () => ({
    flush: async () => {
      if (hasChangesRef.current) await saveRef.current();
    }
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => { if (hasChanges) saveChanges(); }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleAdvantageChange = (value: string) => { setCompetitiveAdvantage(value); setHasChanges(true); };
  const handleMoatChange = (value: string) => { setMoatType(value as MoatType); setHasChanges(true); };
  const handleCategoryChange = (value: string) => { setCategory(value); setHasChanges(true); };
  const handleKeyAssetsChange = (value: string) => { setKeyAssets(value); setHasChanges(true); };

  const isValid = competitiveAdvantage.length >= 20;
  const inferredPositioning = diagnosticData?.competitiveAdvantage || null;
  const inferredKeyAssets = diagnosticData?.keyAssets || null;
  const hasRisks = diagnosticData?.keyRisks && diagnosticData.keyRisks.length > 0;
  const hasSeoKeywords = diagnosticData?.seoKeywords && diagnosticData.seoKeywords.length > 0;
  const hasProductAdvantage = !!diagnosticData?.productBasedAdvantage;

  // Sort moat options: emphasized ones first based on business model
  const sortedMoatOptions = [...moatOptions].sort((a, b) => {
    const aEmph = bmCtx.moatEmphasis.indexOf(a.value);
    const bEmph = bmCtx.moatEmphasis.indexOf(b.value);
    if (aEmph !== -1 && bEmph === -1) return -1;
    if (aEmph === -1 && bEmph !== -1) return 1;
    if (aEmph !== -1 && bEmph !== -1) return aEmph - bEmph;
    return 0;
  });

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
                {t('journey.sdna.module3Title')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.sdna.module3LongDesc')}
              </CardDescription>
              <p className="text-xs text-primary/70 mt-2 italic">
                {t(bmCtx.advantageFocusKey)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Risks from Diagnosis */}
      {hasRisks && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('journey.sdna.detectedRisks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2 mb-2">
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferred')}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {diagnosticData!.keyRisks.map((risk, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {risk}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-destructive/60 italic mt-2 flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {t('journey.sdna.inferredSource')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* SEO Keywords & Product Signals */}
      {(hasSeoKeywords || hasProductAdvantage) && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              {t('journey.sdna.marketSignals', 'Señales de Mercado Detectadas')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasSeoKeywords && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {t('journey.sdna.seoKeywords', 'Keywords SEO')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {diagnosticData!.seoKeywords.slice(0, 8).map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            {hasProductAdvantage && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t('journey.sdna.productAdvantage', 'Ventaja por Portafolio')}
                </p>
                <p className="text-sm text-muted-foreground">{diagnosticData!.productBasedAdvantage}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Competitive Category */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('journey.sdna.competitiveCategory')}</CardTitle>
          <CardDescription>{t('journey.sdna.competitiveCategoryHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <InferredFieldCard
            label={t('journey.sdna.competitiveCategory')}
            inferredValue={diagnosticData?.competitiveCategory || null}
            currentValue={category}
            onChange={handleCategoryChange}
            placeholder={t('journey.sdna.competitiveCategoryPlaceholder')}
            showDualState={!!diagnosticData?.competitiveCategory}
            currentStateLabel={t('journey.sdna.detectedState')}
            desiredStateLabel={t('journey.sdna.desiredState')}
            minHeight="60px"
          />
        </CardContent>
      </Card>

      {/* Structural Differentiator (Moat Type) - sorted by BM */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                {t('journey.sdna.structuralDiff')}
              </CardTitle>
              <CardDescription>{t('journey.sdna.structuralDiffHint')}</CardDescription>
            </div>
            {moatInferred && (
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferred')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={moatType || ''} onValueChange={handleMoatChange} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedMoatOptions.map((option) => {
              const Icon = option.icon;
              const isEmphasized = bmCtx.moatEmphasis.includes(option.value);
              return (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={`moat-${option.value}`} className="peer sr-only" />
                  <Label htmlFor={`moat-${option.value}`} className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted/50 relative",
                    moatType === option.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}>
                    <div className={cn("p-2 rounded-lg shrink-0", moatType === option.value ? "bg-primary/20" : "bg-muted")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-semibold block">{t(option.labelKey, option.fallback)}</span>
                      <span className="text-sm text-muted-foreground">{t(option.descKey, option.descFallback)}</span>
                    </div>
                    {isEmphasized && (
                      <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary border-primary/20">
                        {t('journey.sdna.bm.recommended', 'Recomendado')}
                      </Badge>
                    )}
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
            <CardTitle className="text-lg">{t('journey.sdna.advantageDesc')}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><HelpCircle className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-sm text-muted-foreground">
                    {t('journey.sdna.advantageExampleText')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>{t('journey.sdna.advantageHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InferredFieldCard
            label={t('journey.sdna.advantageDesc')}
            inferredValue={inferredPositioning}
            currentValue={competitiveAdvantage}
            onChange={handleAdvantageChange}
            placeholder={t(bmCtx.advantagePlaceholderKey)}
            showDualState={!!inferredPositioning}
            currentStateLabel={t('journey.sdna.detectedState')}
            desiredStateLabel={t('journey.sdna.desiredState')}
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
          <CardTitle className="text-lg">{t('journey.sdna.keyAssets')}</CardTitle>
          <CardDescription>{t('journey.sdna.keyAssetsHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <InferredFieldCard
            label={t('journey.sdna.keyAssets')}
            inferredValue={inferredKeyAssets}
            currentValue={keyAssets}
            onChange={handleKeyAssetsChange}
            placeholder={t('journey.sdna.keyAssetsPlaceholder')}
            showDualState={!!inferredKeyAssets}
            currentStateLabel={t('journey.sdna.detectedState')}
            desiredStateLabel={t('journey.sdna.desiredState')}
            minHeight="100px"
          />
        </CardContent>
      </Card>
    </div>
  );
});

export default CompetitivePositioningEngineStep;
