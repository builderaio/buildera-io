import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Crosshair, Plus, Trash2, UserCheck, Bot, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { PlayToWinStrategy, TargetSegment } from '@/types/playToWin';
import { InferredStrategicData } from '@/hooks/useDiagnosticInference';
import { cn } from '@/lib/utils';

interface TargetMarketDefinitionStepProps {
  strategy: PlayToWinStrategy;
  onUpdate: (updates: Partial<PlayToWinStrategy>) => Promise<boolean>;
  isSaving: boolean;
  diagnosticData?: InferredStrategicData | null;
}

const maturityLevels = [
  { value: 'early', labelKey: 'journey.sdna.maturityEarly', fallback: 'Etapa temprana', descKey: 'journey.sdna.maturityEarlyDesc', descFallback: 'Buscando solución, aún no decidido' },
  { value: 'growing', labelKey: 'journey.sdna.maturityGrowing', fallback: 'En crecimiento', descKey: 'journey.sdna.maturityGrowingDesc', descFallback: 'Ya invierte, busca optimizar' },
  { value: 'established', labelKey: 'journey.sdna.maturityEstablished', fallback: 'Establecido', descKey: 'journey.sdna.maturityEstablishedDesc', descFallback: 'Operación estable, busca escalar' },
];

const decisionMakers = [
  { value: 'founder', labelKey: 'journey.sdna.dmFounder', fallback: 'Founder / Dueño' },
  { value: 'clevel', labelKey: 'journey.sdna.dmCLevel', fallback: 'C-Level / Director' },
  { value: 'corporate', labelKey: 'journey.sdna.dmCorporate', fallback: 'Corporativo / Comité' },
];

export default function TargetMarketDefinitionStep({ strategy, onUpdate, isSaving, diagnosticData }: TargetMarketDefinitionStepProps) {
  const { t } = useTranslation();
  
  // Pre-fill from diagnostic if available and no existing data
  const inferredSegment: TargetSegment | null = diagnosticData?.icpName ? {
    id: 'inferred-icp',
    name: diagnosticData.icpName,
    description: diagnosticData.icpDescription || '',
    size: '',
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

  const handleConfirmICP = () => {
    setIcpInferred(false);
    setHasChanges(true);
  };

  const handleEditICP = () => {
    setIcpInferred(false);
    setHasChanges(true);
  };

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
                {t('journey.sdna.module2Title', 'Target Market Definition')}
              </CardTitle>
              <CardDescription className="text-base mt-1">
                {t('journey.sdna.module2LongDesc', 'Define tu ICP primario, el nivel de madurez de tu cliente y el tipo de decisor que influencias.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ICP - Inferred or editable */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-muted-foreground" />
                {t('journey.sdna.icpDefined', 'Tu ICP Primario')}
              </CardTitle>
              <CardDescription>{t('journey.sdna.icpDefinedHint', 'Define 1-2 perfiles para máxima precisión')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {icpInferred && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <Bot className="h-3 w-3" />
                  {t('journey.sdna.inferred', 'Inferido por el sistema')}
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
          {/* Inferred confirmation bar */}
          {icpInferred && segments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="w-full text-xs text-primary/70 italic flex items-center gap-1 mb-1">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferredSource', 'Basado en análisis digital')}
              </p>
              <Button size="sm" onClick={handleConfirmICP} className="gap-1 h-8 text-xs">
                <Check className="h-3 w-3" />
                {t('journey.sdna.confirmAction', 'Confirmar')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditICP} className="gap-1 h-8 text-xs">
                {t('journey.sdna.editAction', 'Editar')}
              </Button>
            </div>
          )}

          {segments.length === 0 && (
            <div className="text-center py-6">
              <Badge variant="secondary" className="gap-1 mb-3 bg-amber-500/10 text-amber-700 border-amber-500/20">
                {t('journey.sdna.manualRequired', 'Requiere input manual')}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">
                {t('journey.sdna.noIcpEvidence', 'No se encontró evidencia suficiente para inferir tu ICP. Defínelo manualmente.')}
              </p>
              <Button onClick={addSegment} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('journey.sdna.createCustomICP', 'Crear perfil personalizado')}
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
                  <Label className="text-sm">{t('journey.sdna.icpWho', '¿Quiénes son?')}</Label>
                  <Input value={segment.name} onChange={(e) => updateSegment(segment.id, 'name', e.target.value)} placeholder={t('journey.sdna.icpWhoPlaceholder', 'Ej: Agencias de marketing digital con 3-15 empleados')} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">{t('journey.sdna.icpProblem', '¿Qué problema crítico tienen?')}</Label>
                  <Textarea value={segment.description} onChange={(e) => updateSegment(segment.id, 'description', e.target.value)} placeholder={t('journey.sdna.icpProblemPlaceholder', 'Ej: No pueden escalar más allá de 10 clientes...')} className="mt-1 min-h-[80px] resize-none" />
                </div>
                <div>
                  <Label className="text-sm">{t('journey.sdna.icpSize', 'Tamaño estimado del mercado')}</Label>
                  <Input value={segment.size} onChange={(e) => updateSegment(segment.id, 'size', e.target.value)} placeholder={t('journey.sdna.icpSizePlaceholder', 'Ej: 2,000 agencias en LATAM')} className="mt-1" />
                </div>
              </div>
            </div>
          ))}
          
          {segments.length > 0 && (
            <div className="flex items-center justify-between text-sm pt-2">
              <span className={cn("transition-colors", hasValidSegment ? "text-green-600" : "text-muted-foreground")}>
                {hasValidSegment ? '✓ ' : ''}{segments.length}/2 {t('journey.sdna.icpCount', 'perfiles definidos')}
              </span>
              {isSaving && <span className="text-muted-foreground">{t('common.saving', 'Guardando...')}</span>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Maturity Level */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('journey.sdna.clientMaturity', 'Nivel de madurez del cliente')}</CardTitle>
              <CardDescription>{t('journey.sdna.clientMaturityHint', '¿En qué etapa se encuentra tu cliente cuando te busca?')}</CardDescription>
            </div>
            {maturityInferred && (
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferred', 'Inferido')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={maturity} onValueChange={(v) => setMaturity(v as any)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {maturityLevels.map(opt => (
              <div key={opt.value}>
                <RadioGroupItem value={opt.value} id={`mat-${opt.value}`} className="peer sr-only" />
                <Label htmlFor={`mat-${opt.value}`} className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-muted/50",
                  maturity === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/30"
                )}>
                  <span className="font-semibold text-sm">{t(opt.labelKey, opt.fallback)}</span>
                  <span className="text-xs text-muted-foreground">{t(opt.descKey, opt.descFallback)}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Decision Maker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{t('journey.sdna.decisionMaker', 'Tipo de decisión que influencias')}</CardTitle>
              <CardDescription>{t('journey.sdna.decisionMakerHint', '¿Quién toma la decisión de compra?')}</CardDescription>
            </div>
            {dmInferred && (
              <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                <Bot className="h-3 w-3" />
                {t('journey.sdna.inferred', 'Inferido')}
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
    </div>
  );
}
