import { useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dna, TrendingUp, Target, Zap, Brain,
  ArrowRight, CheckCircle2, Clock, AlertTriangle,
  BarChart3, Crosshair, Shield, Cpu, Eye, Lock,
  Activity, FileWarning, Lightbulb, Flame, Sparkles,
  ChevronDown, Calendar, User, Layers,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import {
  useStrategicControlData,
  generateIntegratedPriorities,
  calculateIntegratedScore,
  StrategicPriority,
  WeeklyDecision,
} from '@/hooks/useStrategicControlData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BusinessModelType } from '@/types/playToWin';

interface StrategicControlCenterProps {
  profile: any;
}

const variableIcons: Record<string, typeof Target> = {
  positioning: Crosshair,
  channel: Zap,
  offer: BarChart3,
  authority: Shield,
  audience: Target,
  brand: Dna,
  visibility: Eye,
  trust: Lock,
};

const variableLabels: Record<string, string> = {
  positioning: 'Posicionamiento',
  channel: 'Canal',
  offer: 'Oferta',
  authority: 'Autoridad',
  audience: 'Audiencia',
  brand: 'Marca',
  visibility: 'Visibilidad',
  trust: 'Confianza',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function StrategicControlCenter({ profile }: StrategicControlCenterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companyId = profile?.primary_company_id;
  const companyName = profile?.company_name;

  const { strategy } = usePlayToWin(companyId);
  const {
    diagnostic, operational, strategicProfile,
    strategicGaps, weeklyDecisions, weekStart, daysRemaining,
    syncStrategicGaps, completeDecision, createWeeklyDecisions,
    updateBusinessModel,
  } = useStrategicControlData(companyId);

  // Update business model from strategy
  useEffect(() => {
    if (strategy?.businessModel) {
      updateBusinessModel(strategy.businessModel as BusinessModelType);
    }
  }, [strategy?.businessModel, updateBusinessModel]);

  // Compute resolved gap keys for filtering
  const resolvedGapKeys = useMemo(() => {
    return new Set(strategicGaps.filter(g => g.resolved_at).map(g => g.gap_key));
  }, [strategicGaps]);

  const priorities = useMemo(
    () => generateIntegratedPriorities(strategy, diagnostic, t, strategy?.businessModel as BusinessModelType | null, resolvedGapKeys),
    [strategy, diagnostic, t, resolvedGapKeys]
  );

  const scores = useMemo(
    () => calculateIntegratedScore(strategy, diagnostic, operational, strategicGaps),
    [strategy, diagnostic, operational, strategicGaps]
  );

  // Sync gaps and create weekly decisions on load
  useEffect(() => {
    if (priorities.length > 0 && companyId) {
      syncStrategicGaps(priorities);
    }
  }, [priorities.length, companyId]); // intentionally sparse deps

  useEffect(() => {
    if (diagnostic && companyId) {
      createWeeklyDecisions(strategy, diagnostic, strategy?.businessModel as BusinessModelType | null, t);
    }
  }, [diagnostic, companyId]); // intentionally sparse deps

  const handleNavigate = (view: string) => {
    navigate(`/company-dashboard?view=${view}`);
  };

  const handleCompleteDecision = async (decision: WeeklyDecision) => {
    if (!decision.id) return;
    const prevScore = scores.current;
    await completeDecision(decision.id, decision.gapKey);
    toast.success(t('journey.scc.decisionCompleted', '¡Decisión completada!'), {
      description: t('journey.scc.decisionCompletedDesc', 'El sistema está recalculando tu índice estratégico.'),
    });
  };

  const urgencyConfig = {
    critical: { label: t('journey.scc.urgencyCritical', 'Crítico'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    high: { label: t('journey.scc.urgencyHigh', 'Urgente'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    medium: { label: t('journey.scc.urgencyMedium', 'Importante'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    low: { label: t('journey.scc.urgencyLow', 'Recomendado'), color: 'bg-primary/10 text-primary border-primary/30' },
  };

  const sdiLevelConfig: Record<string, { label: string; color: string }> = {
    Emerging: { label: t('journey.scc.sdiEmerging', 'Emergente'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    Building: { label: t('journey.scc.sdiBuilding', 'En construcción'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    Competitive: { label: t('journey.scc.sdiCompetitive', 'Competitivo'), color: 'bg-primary/10 text-primary border-primary/30' },
    Reference: { label: t('journey.scc.sdiReference', 'Referente'), color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  };

  const bmLabels: Record<string, string> = {
    b2b: 'B2B',
    b2c: 'B2C',
    b2b2c: 'B2B2C',
    mixed: t('journey.scc.bmMixed', 'Mixto'),
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Dna className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t('journey.scc.title', 'Strategic Control Center')}
            </h1>
            <p className="text-muted-foreground">
              {companyName && <span className="font-medium text-foreground">{companyName}</span>}
              {companyName && ' — '}
              {t('journey.scc.subtitle', 'Motor de ejecución estratégica')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ STRATEGIC PROFILE BLOCK ═══ */}
      <motion.div {...fadeUp(0.03)}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {t('journey.scc.profileTitle', 'Tu Perfil Estratégico Actual')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {/* Archetype */}
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs bg-primary/5 border-primary/20">
                <Brain className="h-3.5 w-3.5" />
                {strategicProfile.archetype
                  ? strategicProfile.archetype
                  : t('journey.scc.profileNoArchetype', 'Sin arquetipo detectado')}
              </Badge>
              {/* SDI Level */}
              <Badge variant="outline" className={cn('gap-1.5 px-3 py-1.5 text-xs', sdiLevelConfig[strategicProfile.sdiLevel]?.color)}>
                <Layers className="h-3.5 w-3.5" />
                SDI: {sdiLevelConfig[strategicProfile.sdiLevel]?.label || strategicProfile.sdiLevel}
              </Badge>
              {/* Business Model */}
              <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs bg-secondary/50 border-secondary/30">
                <BarChart3 className="h-3.5 w-3.5" />
                {strategy?.businessModel
                  ? bmLabels[strategy.businessModel] || strategy.businessModel
                  : t('journey.scc.profileNoBM', 'Modelo no definido')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Insight Estratégico Actual */}
      <StrategicInsightBlock
        diagnostic={diagnostic}
        priorities={priorities}
        strategy={strategy}
        urgencyConfig={urgencyConfig}
        onNavigate={handleNavigate}
        t={t}
      />

      {/* Score Projection + Diagnostic Breakdown */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1 w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold">
                      {t('journey.scc.strategicIndex', 'Strategic Digital Index')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-bold text-lg">{scores.current}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-bold text-lg text-primary">{scores.projected}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded-full"
                    style={{ width: `${scores.projected}%` }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${scores.current}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* 4-Pillar Strategic Maturity Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'foundation', icon: Dna, label: t('journey.scc.pillarFoundation', 'Fundamento'), value: scores.categoryTotals.foundation, max: 30 },
                { key: 'presence', icon: Eye, label: t('journey.scc.pillarPresence', 'Presencia'), value: scores.categoryTotals.presence, max: 25 },
                { key: 'execution', icon: Zap, label: t('journey.scc.pillarExecution', 'Ejecución'), value: scores.categoryTotals.execution, max: 25 },
                { key: 'gaps', icon: Shield, label: t('journey.scc.pillarGaps', 'Brechas'), value: scores.categoryTotals.gaps, max: 20 },
              ].map((pillar) => {
                const Icon = pillar.icon;
                const pct = Math.round((pillar.value / pillar.max) * 100);
                const color = pct < 30 ? 'text-destructive' : pct < 60 ? 'text-amber-600' : 'text-primary';
                return (
                  <div key={pillar.key} className="text-center p-3 rounded-lg bg-background/60 border space-y-1.5">
                    <Icon className={cn('h-4 w-4 mx-auto', color)} />
                    <p className={cn('text-lg font-bold', color)}>{pillar.value}<span className="text-xs text-muted-foreground font-normal">/{pillar.max}</span></p>
                    <p className="text-[10px] text-muted-foreground">{pillar.label}</p>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', pct < 30 ? 'bg-destructive' : pct < 60 ? 'bg-amber-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Priorities */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div {...fadeUp(0.15)}>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('journey.scc.dynamicPriorities', 'Prioridades Dinámicas')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('journey.scc.dynamicPrioritiesDesc', 'Generadas desde tu Strategic DNA y el Diagnóstico Ejecutivo.')}
            </p>
          </motion.div>

          {priorities.slice(0, 6).map((priority, i) => (
            <PriorityCard
              key={priority.id}
              priority={priority}
              urgencyConfig={urgencyConfig}
              onNavigate={handleNavigate}
              t={t}
              delay={0.2 + i * 0.05}
            />
          ))}
        </div>

        {/* Right Column: Decisions + Agent + DNA */}
        <div className="space-y-4">
          {/* Weekly Decisions with Persistence */}
          <motion.div {...fadeUp(0.2)}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('journey.scc.weeklyDecisions', '3 Decisiones Esta Semana')}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {t('journey.scc.weekInfo', 'Semana del {{date}} — {{days}} días restantes', {
                    date: weekStart,
                    days: daysRemaining,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {weeklyDecisions.length > 0 ? (
                  weeklyDecisions.map((decision, i) => (
                    <PersistentDecisionItem
                      key={decision.id || i}
                      decision={decision}
                      index={i}
                      onNavigate={handleNavigate}
                      onComplete={handleCompleteDecision}
                      t={t}
                    />
                  ))
                ) : (
                  // Fallback: show static decisions if no persistent ones
                  <p className="text-xs text-muted-foreground text-center py-3">
                    {t('journey.scc.noDecisions', 'Las decisiones semanales se generarán automáticamente.')}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Gap Resolution Progress */}
          {strategicGaps.length > 0 && (
            <motion.div {...fadeUp(0.23)}>
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {t('journey.scc.gapProgress', 'Progreso de Brechas')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {strategicGaps.filter(g => g.resolved_at).length}/{strategicGaps.length} {t('journey.scc.resolved', 'resueltas')}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {Math.round((strategicGaps.filter(g => g.resolved_at).length / strategicGaps.length) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(strategicGaps.filter(g => g.resolved_at).length / strategicGaps.length) * 100}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Detected Risks from Diagnostic */}
          {diagnostic?.keyRisks && diagnostic.keyRisks.length > 0 && (
            <motion.div {...fadeUp(0.25)}>
              <Card className="border-destructive/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-destructive" />
                    {t('journey.scc.detectedRisks', 'Riesgos Detectados')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {diagnostic.keyRisks.slice(0, 3).map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                  <Badge variant="outline" className="mt-3 text-[10px] bg-destructive/5 text-destructive border-destructive/20">
                    {t('journey.scc.sourceDiagnostic', 'Diagnóstico')}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Agent Card */}
          <motion.div {...fadeUp(0.3)}>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  {t('journey.scc.agentReady', 'Agente Estratégico Activo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-xs text-muted-foreground">
                  {[
                    { done: !!strategy?.winningAspiration, label: t('journey.scc.agentDNA', 'Strategic DNA cargado') },
                    { done: !!strategy?.targetSegments?.length, label: t('journey.scc.agentICP', 'ICP primario definido') },
                    { done: !!strategy?.competitiveAdvantage, label: t('journey.scc.agentPositioning', 'Positioning Engine activo') },
                    { done: !!diagnostic?.executiveDiagnosis?.scores, label: t('journey.scc.agentDiag', 'Diagnóstico ejecutivo integrado') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Activity className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                      <span className={cn(!item.done && 'opacity-50')}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full gap-2" size="sm" onClick={() => handleNavigate('agentes')}>
                  <Zap className="h-3.5 w-3.5" />
                  {t('journey.scc.useAgent', 'Usar Agente Estratégico')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* DNA Snapshot */}
          <motion.div {...fadeUp(0.35)}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dna className="h-4 w-4 text-primary" />
                  {t('journey.scc.dnaSnapshot', 'DNA Snapshot')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Cpu, label: 'Mission', value: strategy?.winningAspiration },
                  { icon: Crosshair, label: 'Target', value: strategy?.targetSegments?.[0]?.name },
                  { icon: Shield, label: 'Moat', value: strategy?.moatType?.replace('_', ' ') },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium shrink-0">{item.label}:</span>
                      <span className="text-muted-foreground truncate">
                        {item.value
                          ? (typeof item.value === 'string' && item.value.length > 40 ? item.value.slice(0, 40) + '...' : item.value)
                          : '—'}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function PriorityCard({
  priority,
  urgencyConfig,
  onNavigate,
  t,
  delay,
}: {
  priority: StrategicPriority;
  urgencyConfig: Record<string, { label: string; color: string }>;
  onNavigate: (view: string) => void;
  t: any;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = variableIcons[priority.variable] || Target;
  const urgency = urgencyConfig[priority.urgency];
  const sourceLabel = priority.source === 'diagnostic'
    ? t('journey.scc.sourceDiagnostic', 'Diagnóstico')
    : t('journey.scc.sourceDNA', 'DNA');
  const sourceColor = priority.source === 'diagnostic'
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-primary/10 text-primary border-primary/20';

  const hasNarrative = priority.gapKey || priority.riskMitigated || priority.strategicImpact;

  return (
    <motion.div {...fadeUp(delay)}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm">{priority.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{priority.description}</p>
                </div>
                <Badge variant="outline" className={cn('text-[10px] shrink-0', urgency.color)}>
                  {urgency.label}
                </Badge>
              </div>

              {/* Strategic Narrative (expandable) */}
              {hasNarrative && (
                <div>
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary transition-colors"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {t('journey.scc.whyImportant', 'Por qué es importante')}
                    <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-2.5 rounded-md bg-muted/50 space-y-1.5 text-[11px]">
                          {priority.gapKey && (
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              <span><span className="font-medium">{t('journey.scc.narrative.gapLabel', 'Brecha:')}</span> {priority.gapKey}</span>
                            </div>
                          )}
                          {priority.riskMitigated && (
                            <div className="flex items-start gap-1.5">
                              <Shield className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                              <span><span className="font-medium">{t('journey.scc.narrative.riskLabel', 'Riesgo:')}</span> {priority.riskMitigated}</span>
                            </div>
                          )}
                          {priority.strategicImpact && (
                            <div className="flex items-start gap-1.5">
                              <TrendingUp className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                              <span><span className="font-medium">{t('journey.scc.narrative.impactLabel', 'Impacto:')}</span> {priority.strategicImpact}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', sourceColor)}>
                    {sourceLabel}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] bg-muted">
                    {variableLabels[priority.variable] || priority.variable}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{priority.impactPoints} pts
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => onNavigate(priority.actionView)}
                >
                  {t('journey.scc.execute', 'Ejecutar')}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PersistentDecisionItem({
  decision,
  index,
  onNavigate,
  onComplete,
  t,
}: {
  decision: WeeklyDecision;
  index: number;
  onNavigate: (view: string) => void;
  onComplete: (decision: WeeklyDecision) => void;
  t: any;
}) {
  const isCompleted = !!decision.completedAt;
  const sourceLabel = decision.source === 'diagnostic'
    ? t('journey.scc.sourceDiagnostic', 'Diagnóstico')
    : t('journey.scc.sourceDNA', 'DNA');
  const sourceColor = decision.source === 'diagnostic'
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-primary/10 text-primary border-primary/20';

  return (
    <div className={cn('space-y-2 pb-3 last:pb-0 border-b last:border-0', isCompleted && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <button
          onClick={() => !isCompleted && onComplete(decision)}
          disabled={isCompleted}
          className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors',
            isCompleted
              ? 'bg-emerald-500/20'
              : 'bg-primary/10 hover:bg-primary/20 cursor-pointer'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <span className="text-[10px] font-bold text-primary">{index + 1}</span>
          )}
        </button>
        <div className="min-w-0">
          <p className={cn('font-medium text-sm', isCompleted && 'line-through text-muted-foreground')}>
            {decision.title}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{decision.reason}</p>
          {isCompleted && decision.completedAt && (
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {t('journey.scc.completedOn', 'Completada')}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className={cn('text-[9px]', sourceColor)}>{sourceLabel}</Badge>
            <Badge variant="secondary" className="text-[9px] bg-muted">
              {variableLabels[decision.variable] || decision.variable}
            </Badge>
          </div>
        </div>
      </div>
      {!isCompleted && (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={() => onNavigate(decision.actionView)}
          >
            {t('journey.scc.d.takeAction', 'Tomar acción')}
          </Button>
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1"
            onClick={() => onComplete(decision)}
          >
            <CheckCircle2 className="h-3 w-3" />
            {t('journey.scc.d.complete', 'Completar')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Strategic Insight Block ───

function StrategicInsightBlock({
  diagnostic,
  priorities,
  strategy,
  urgencyConfig,
  onNavigate,
  t,
}: {
  diagnostic: any;
  priorities: StrategicPriority[];
  strategy: any;
  urgencyConfig: Record<string, { label: string; color: string }>;
  onNavigate: (view: string) => void;
  t: any;
}) {
  const topPriority = priorities[0];
  const scores = diagnostic?.executiveDiagnosis?.scores;

  const mainGap = useMemo(() => {
    if (!scores) return null;
    const areas = [
      { key: 'visibility', label: t('journey.scc.scoreVisibility', 'Visibilidad'), score: scores.visibility, icon: Eye },
      { key: 'trust', label: t('journey.scc.scoreTrust', 'Confianza'), score: scores.trust, icon: Lock },
      { key: 'positioning', label: t('journey.scc.scorePositioning', 'Posicionamiento'), score: scores.positioning, icon: Crosshair },
    ];
    return areas.sort((a, b) => a.score - b.score)[0];
  }, [scores, t]);

  const primaryRisk = diagnostic?.keyRisks?.[0] || null;

  const opportunity = useMemo(() => {
    if (diagnostic?.actionPlan?.[0]) return diagnostic.actionPlan[0];
    if (topPriority) return topPriority.description;
    return null;
  }, [diagnostic, topPriority]);

  const urgencyLevel = useMemo(() => {
    if (!scores) return 'medium';
    const overall = scores.overall ?? Math.round((scores.visibility + scores.trust + scores.positioning) / 3);
    if (overall < 30) return 'critical';
    if (overall < 50) return 'high';
    if (overall < 70) return 'medium';
    return 'low';
  }, [scores]);

  const urgency = urgencyConfig[urgencyLevel];
  const hasData = mainGap || primaryRisk || opportunity;

  if (!hasData) return null;

  const GapIcon = mainGap?.icon || AlertTriangle;

  return (
    <motion.div {...fadeUp(0.05)}>
      <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-transparent to-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {t('journey.scc.insightTitle', 'Insight Estratégico Actual')}
            </CardTitle>
            <Badge variant="outline" className={cn('text-[10px]', urgency.color)}>
              {urgency.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainGap && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
                <div className="p-1.5 bg-destructive/10 rounded-md shrink-0">
                  <GapIcon className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('journey.scc.insightGap', 'Principal Brecha')}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {mainGap.label}: <span className="text-destructive">{mainGap.score}/100</span>
                  </p>
                </div>
              </div>
            )}

            {primaryRisk && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
                <div className="p-1.5 bg-destructive/10 rounded-md shrink-0">
                  <Flame className="h-4 w-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('journey.scc.insightRisk', 'Riesgo Asociado')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{primaryRisk}</p>
                </div>
              </div>
            )}

            {opportunity && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
                <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {t('journey.scc.insightOpportunity', 'Oportunidad Prioritaria')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opportunity}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border">
              <div className={cn('p-1.5 rounded-md shrink-0', urgencyLevel === 'critical' || urgencyLevel === 'high' ? 'bg-destructive/10' : 'bg-amber-500/10')}>
                <AlertTriangle className={cn('h-4 w-4', urgencyLevel === 'critical' || urgencyLevel === 'high' ? 'text-destructive' : 'text-amber-600')} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {t('journey.scc.insightUrgency', 'Nivel de Urgencia')}
                </p>
                <p className="text-sm font-semibold mt-0.5">
                  <span className={cn(
                    urgencyLevel === 'critical' || urgencyLevel === 'high' ? 'text-destructive' : 
                    urgencyLevel === 'medium' ? 'text-amber-600' : 'text-primary'
                  )}>
                    {urgency.label}
                  </span>
                  {scores && (
                    <span className="text-xs text-muted-foreground ml-1.5 font-normal">
                      (SDI: {scores.overall ?? Math.round((scores.visibility + scores.trust + scores.positioning) / 3)}/100)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {topPriority && (
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-2 text-xs"
              onClick={() => onNavigate(topPriority.actionView)}
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {t('journey.scc.insightAction', 'Resolver brecha prioritaria')}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
