import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dna, TrendingUp, Target, Zap, Brain,
  ArrowRight, CheckCircle2, Clock, AlertTriangle,
  BarChart3, Crosshair, Shield, Cpu, Eye, Lock,
  Activity, FileWarning
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import {
  useStrategicControlData,
  generateIntegratedPriorities,
  generateIntegratedDecisions,
  calculateIntegratedScore,
  StrategicPriority,
  WeeklyDecision,
} from '@/hooks/useStrategicControlData';
import { cn } from '@/lib/utils';

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
  const { diagnostic } = useStrategicControlData(companyId);

  const priorities = useMemo(() => generateIntegratedPriorities(strategy, diagnostic, t), [strategy, diagnostic, t]);
  const decisions = useMemo(() => generateIntegratedDecisions(strategy, diagnostic, t), [strategy, diagnostic, t]);
  const scores = useMemo(() => calculateIntegratedScore(strategy, diagnostic), [strategy, diagnostic]);

  const handleNavigate = (view: string) => {
    navigate(`/company-dashboard?view=${view}`);
  };

  const urgencyConfig = {
    critical: { label: t('journey.scc.urgencyCritical', 'Crítico'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    high: { label: t('journey.scc.urgencyHigh', 'Urgente'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    medium: { label: t('journey.scc.urgencyMedium', 'Importante'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    low: { label: t('journey.scc.urgencyLow', 'Recomendado'), color: 'bg-primary/10 text-primary border-primary/30' },
  };

  const diagScores = diagnostic?.executiveDiagnosis?.scores;

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

            {/* Diagnostic Sub-Scores */}
            {diagScores && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'visibility', icon: Eye, label: t('journey.scc.scoreVisibility', 'Visibilidad'), value: diagScores.visibility },
                  { key: 'trust', icon: Lock, label: t('journey.scc.scoreTrust', 'Confianza'), value: diagScores.trust },
                  { key: 'positioning', icon: Crosshair, label: t('journey.scc.scorePositioning', 'Posicionamiento'), value: diagScores.positioning },
                ].map((s) => {
                  const Icon = s.icon;
                  const color = s.value < 40 ? 'text-destructive' : s.value < 60 ? 'text-amber-600' : 'text-primary';
                  return (
                    <div key={s.key} className="text-center p-3 rounded-lg bg-background/60 border">
                      <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
                      <p className={cn('text-xl font-bold', color)}>{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
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
          {/* Weekly Decisions */}
          <motion.div {...fadeUp(0.2)}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('journey.scc.weeklyDecisions', '3 Decisiones Esta Semana')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('journey.scc.weeklyDecisionsDesc', 'Recomendaciones basadas en DNA + Diagnóstico.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {decisions.map((decision, i) => (
                  <DecisionItem
                    key={i}
                    decision={decision}
                    index={i}
                    onNavigate={handleNavigate}
                    t={t}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>

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
                    { done: !!diagScores, label: t('journey.scc.agentDiag', 'Diagnóstico ejecutivo integrado') },
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

                <Button
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => handleNavigate('agentes')}
                >
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
  const Icon = variableIcons[priority.variable] || Target;
  const urgency = urgencyConfig[priority.urgency];
  const sourceLabel = priority.source === 'diagnostic'
    ? t('journey.scc.sourceDiagnostic', 'Diagnóstico')
    : t('journey.scc.sourceDNA', 'DNA');
  const sourceColor = priority.source === 'diagnostic'
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-primary/10 text-primary border-primary/20';

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

function DecisionItem({
  decision,
  index,
  onNavigate,
  t,
}: {
  decision: WeeklyDecision;
  index: number;
  onNavigate: (view: string) => void;
  t: any;
}) {
  const sourceLabel = decision.source === 'diagnostic'
    ? t('journey.scc.sourceDiagnostic', 'Diagnóstico')
    : t('journey.scc.sourceDNA', 'DNA');
  const sourceColor = decision.source === 'diagnostic'
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-primary/10 text-primary border-primary/20';

  return (
    <div className="space-y-2 pb-3 last:pb-0 border-b last:border-0">
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-primary">{index + 1}</span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">{decision.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{decision.reason}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className={cn('text-[9px]', sourceColor)}>{sourceLabel}</Badge>
            <Badge variant="secondary" className="text-[9px] bg-muted">
              {variableLabels[decision.variable] || decision.variable}
            </Badge>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full h-7 text-xs"
        onClick={() => onNavigate(decision.actionView)}
      >
        {decision.action}
      </Button>
    </div>
  );
}
