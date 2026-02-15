import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Plus, Trash2, UserCheck, Bot, Check, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, TargetSegment } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import InferredFieldCard from '../InferredFieldCard';
import { cn } from '@/lib/utils';
import { BusinessModel } from './BusinessModelStep';
import { getBusinessModelContext } from '@/lib/businessModelContext';

interface TargetMarketDefinitionStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
  businessModel?: BusinessModel | null;
}

export default function TargetMarketDefinitionStep({ strategy, onUpdate, isSaving, diagnosticData, businessModel }: TargetMarketDefinitionStepProps) {
  const { t } = useTranslation();
  const bmCtx = getBusinessModelContext(businessModel || null);

  // Pre-fill from diagnostic if available and no existing data
  const inferredSegment: TargetSegment | null = diagnosticData?.icpName ? {
    id: 'inferred-icp',
    name: diagnosticData.icpName,
    description: diagnosticData.icpDescription || '',
    size: diagnosticData.marketSize || '',
    growthPotential: 'medium',
  } : null;

  const initialSegments = strategy.targetSegments?.length 
    ? strategy.targetSegments 
    : inferredSegment ? [inferredSegment] : [];

  const [segments, setSegments] = useState<TargetSegment[]>(initialSegments);
  const [icpInferred, setIcpInferred] = useState(
    !strategy.targetSegments?.length && !!inferredSegment
  );
  const [maturity, setMaturity] = useState(
    diagnosticData?.clientMaturity || (strategy.aspirationTimeline === '1_year' ? 'early' : 'growing')
  );
  const [maturityInferred] = useState(!!diagnosticData?.clientMaturity && !strategy.aspirationTimeline);
  const [decisionMaker, setDecisionMaker] = useState(diagnosticData?.decisionMaker || 'founder');
  const [dmInferred] = useState(!!diagnosticData?.decisionMaker);
  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = useCallback(async () => {
    if (!hasChanges) return;
    await onUpdate({ targetSegments: segments });
    setHasChanges(false);
  }, [segments, hasChanges, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => { if (hasChanges) saveChanges(); }, 1500);
    return () => clearTimeout(timer);
  }, [hasChanges, saveChanges]);

  const handleConfirmICP = () => { setIcpInferred(false); setHasChanges(true); };
  const handleEditICP = () => { setIcpInferred(false); setHasChanges(true); };

  const addSegment = () => {
    const newSegment: TargetSegment = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      size: '',
      growthPotential: 'medium'
    };
    setSegments([...segments, newSegment]);
    setHasChanges(true);
  };

  const updateSegment = (id: string, field: keyof TargetSegment, value: string) => {
    setSegments(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
    setHasChanges(true);
    if (icpInferred) setIcpInferred(false);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const hasValidSegment = segments.some(s => s.name.length > 0 && s.description.length > 0);
  const hasPainPoints = diagnosticData?.icpPainPoints && diagnosticData.icpPainPoints.length > 0;
  const hasGoals = diagnosticData?.icpGoals && diagnosticData.icpGoals.length > 0;

  const inferredIcpDetail = diagnosticData?.icpDescription 
    ? [
        diagnosticData.icpDescription,
        hasPainPoints ? `\n${t('journey.sdna.bm.painPointsLabel', 'Dolores')}: ${diagnosticData.icpPainPoints.join(', ')}` : '',
        hasGoals ? `\n${t('journey.sdna.bm.goalsLabel', 'Objetivos')}: ${diagnosticData.icpGoals.join(', ')}` : '',
      ].filter(Boolean).join('')
    : null;

  // Use BM-aware maturity options
  const maturityOptions = bmCtx.maturityOptions;

  // Decision maker options (only for B2B / B2B2C / Mixed)
  const decisionMakers = [
    { value: 'founder', labelKey: 'journey.sdna.dmFounder', fallback: 'Founder / Dueño' },
    { value: 'clevel', labelKey: 'journey.sdna.dmCLevel', fallback: 'C-Level / Director' },
    { value: 'corporate', labelKey: 'journey.sdna.dmCorporate', fallback: 'Corporativo / Comité' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Crosshair className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono text-primary uppercase tracking-wider mb-1">
                {t('journey.sdna.moduleLabel', 'Módulo')} 2/3
              </p>
              <CardTitle className="text-xl sm:text-2xl">
                {t('journey.sdna.module2Title')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t(bmCtx.icpLabel)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Inferred Audience Context */}
      {inferredIcpDetail && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('journey.sdna.detectedAudience')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InferredFieldCard
              label={t('journey.sdna.audienceProfile')}
              inferredValue={inferredIcpDetail}
              currentValue=""
              onChange={() => {}}
              showDualState={true}
              currentStateLabel={t('journey.sdna.detectedState')}
              desiredStateLabel={t('journey.sdna.desiredState')}
              minHeight="100px"
            />
          </CardContent>
        </Card>
      )}

      {/* ICP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                {t('journey.sdna.icpDefined')}
              </CardTitle>
              <CardDescription>{t('journey.sdna.icpDefinedHint')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {icpInferred && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <Bot className="h-3 w-3" />
                  {t('journey.sdna.inferred')}
                </Badge>
              )}
              {segments.length < 2 && !icpInferred && (
                <Button onClick={addSegment} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('common.add', 'Añadir')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {icpInferred && segments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="w-full text-xs text-primary/70 italic flex items-center gap-1 mb-1">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferredSource')}
              </p>
              <Button size="sm" onClick={handleConfirmICP} className="gap-1 h-8 text-xs">
                <Check className="h-3 w-3" />
                {t('journey.sdna.confirmAction')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditICP} className="gap-1 h-8 text-xs">
                {t('journey.sdna.editAction')}
              </Button>
            </div>
          )}

          {segments.length === 0 && (
            <div className="text-center py-6">
              <Badge variant="secondary" className="gap-1 mb-3 bg-amber-500/10 text-amber-700 border-amber-500/20">
                {t('journey.sdna.manualRequired')}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">
                {t('journey.sdna.noIcpEvidence')}
              </p>
              <Button onClick={addSegment} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('journey.sdna.createCustomICP')}
              </Button>
            </div>
          )}

          {segments.map((segment, index) => (
            <div key={segment.id} className="p-4 bg-muted/30 rounded-lg space-y-4">
              <div className="flex items-start justify-between gap-4">
                <Badge variant="secondary" className="shrink-0">ICP {index + 1}</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeSegment(segment.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm">{t('journey.sdna.icpWho')}</Label>
                  <Input value={segment.name} onChange={(e) => updateSegment(segment.id, 'name', e.target.value)} placeholder={t(bmCtx.icpWhoPlaceholderKey)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t('journey.sdna.icpProblem')}</Label>
                  <Textarea value={segment.description} onChange={(e) => updateSegment(segment.id, 'description', e.target.value)} placeholder={t(bmCtx.icpProblemPlaceholderKey)} className="mt-1 min-h-[80px] resize-none" />
                </div>
                <div>
                  <Label className="text-sm">{t('journey.sdna.icpSize')}</Label>
                  <Input value={segment.size} onChange={(e) => updateSegment(segment.id, 'size', e.target.value)} placeholder={t('journey.sdna.icpSizePlaceholder')} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
          
          {segments.length > 0 && (
            <div className="flex items-center justify-between text-sm pt-2">
              <span className={cn("transition-colors", hasValidSegment ? "text-green-600" : "text-muted-foreground")}>
                {hasValidSegment ? '✓ ' : ''}{segments.length}/2 {t('journey.sdna.icpCount')}
              </span>
              {isSaving && <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Maturity Level - BM aware */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('journey.sdna.clientMaturity')}</CardTitle>
              <CardDescription>{t('journey.sdna.clientMaturityHint')}</CardDescription>
            </div>
            {maturityInferred && (
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferred')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={maturity} onValueChange={(v) => setMaturity(v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {maturityOptions.map(opt => (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={`mat-${opt.value}`} className="peer sr-only" />
                <Label htmlFor={`mat-${opt.value}`} className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-muted/50",
                  maturity === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                )}>
                  <span className="font-semibold text-sm">{t(opt.labelKey)}</span>
                  <span className="text-xs text-muted-foreground">{t(opt.descKey)}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Decision Maker - only shown for B2B/B2B2C/Mixed */}
      {bmCtx.showDecisionMaker && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t(bmCtx.decisionMakerLabel, t('journey.sdna.decisionMaker'))}</CardTitle>
                <CardDescription>{t('journey.sdna.decisionMakerHint')}</CardDescription>
              </div>
              {dmInferred && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <Bot className="h-3 w-3" />
                  {t('journey.sdna.inferred')}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup value={decisionMaker} onValueChange={(v) => setDecisionMaker(v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {decisionMakers.map(opt => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`dm-${opt.value}`} className="peer sr-only" />
                  <Label htmlFor={`dm-${opt.value}`} className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-muted/50 text-center",
                    decisionMaker === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                  )}>
                    <span className="font-semibold text-sm">{t(opt.labelKey, opt.fallback)}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
