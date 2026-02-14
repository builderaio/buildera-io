import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Dna, TrendingUp, Target, Zap, Brain,
  ArrowRight, CheckCircle2, Clock, AlertTriangle,
  BarChart3, Crosshair, Shield, Cpu
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePlayToWin } from '@/hooks/usePlayToWin';
import { cn } from '@/lib/utils';

interface StrategicControlCenterProps {
  profile: any;
}

// Deterministic priority generator based on strategy completeness
function generatePriorities(strategy: any, t: any) {
  const priorities: {
    id: string;
    title: string;
    description: string;
    urgency: 'high' | 'medium' | 'low';
    impact: number;
    icon: typeof Target;
    actionView: string;
  }[] = [];

  // Check brand identity
  priorities.push({
    id: 'brand',
    title: t('journey.scc.priorityBrand', 'Definir identidad de marca'),
    description: t('journey.scc.priorityBrandDesc', 'Tu marca visual y verbal es necesaria para que los agentes generen contenido alineado.'),
    urgency: 'high',
    impact: 25,
    icon: Target,
    actionView: 'adn-empresa',
  });

  // Check channels
  priorities.push({
    id: 'channels',
    title: t('journey.scc.priorityChannels', 'Conectar canales digitales'),
    description: t('journey.scc.priorityChannelsDesc', 'Sin canales conectados, el sistema no puede publicar ni analizar rendimiento.'),
    urgency: 'high',
    impact: 20,
    icon: Zap,
    actionView: 'marketing-hub',
  });

  // Check products/services
  priorities.push({
    id: 'products',
    title: t('journey.scc.priorityProducts', 'Registrar productos o servicios'),
    description: t('journey.scc.priorityProductsDesc', 'Los agentes necesitan conocer tu oferta para generar estrategias de contenido relevantes.'),
    urgency: 'medium',
    impact: 15,
    icon: BarChart3,
    actionView: 'negocio',
  });

  // Check audiences
  if (!strategy?.targetSegments?.length) {
    priorities.push({
      id: 'audience',
      title: t('journey.scc.priorityAudience', 'Profundizar perfil de audiencia'),
      description: t('journey.scc.priorityAudienceDesc', 'Expande tus segmentos objetivo con datos demográficos y comportamentales.'),
      urgency: 'medium',
      impact: 15,
      icon: Crosshair,
      actionView: 'negocio',
    });
  }

  // Activate autopilot
  priorities.push({
    id: 'autopilot',
    title: t('journey.scc.priorityAutopilot', 'Activar Autopilot de Marketing'),
    description: t('journey.scc.priorityAutopilotDesc', 'Permite que el sistema ejecute decisiones de contenido autónomamente.'),
    urgency: 'low',
    impact: 30,
    icon: Brain,
    actionView: 'autopilot',
  });

  return priorities.sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

// Generate weekly decisions based on strategy
function generateWeeklyDecisions(strategy: any, t: any) {
  const decisions: { title: string; reason: string; action: string; actionView: string }[] = [];

  if (strategy?.winningAspiration) {
    decisions.push({
      title: t('journey.scc.decision1', 'Completar el ADN de marca'),
      reason: t('journey.scc.decision1Reason', 'Tu misión está definida pero el sistema necesita tu identidad visual para generar contenido alineado.'),
      action: t('journey.scc.decision1Action', 'Configurar marca'),
      actionView: 'adn-empresa',
    });
  }

  decisions.push({
    title: t('journey.scc.decision2', 'Conectar al menos 1 red social'),
    reason: t('journey.scc.decision2Reason', 'Sin conexión a canales, el Autopilot no puede ejecutar. Esta acción desbloquea el 60% del sistema.'),
    action: t('journey.scc.decision2Action', 'Conectar canal'),
    actionView: 'marketing-hub',
  });

  decisions.push({
    title: t('journey.scc.decision3', 'Revisar estrategia expandida'),
    reason: t('journey.scc.decision3Reason', 'Completar los 5 pilares estratégicos aumenta la precisión de las decisiones autónomas en un 40%.'),
    action: t('journey.scc.decision3Action', 'Expandir estrategia'),
    actionView: 'estrategia-ptw',
  });

  return decisions.slice(0, 3);
}

// Calculate projected score
function calculateProjectedScore(strategy: any): { current: number; projected: number } {
  let current = 0;
  if (strategy?.winningAspiration && strategy.winningAspiration.length >= 20) current += 15;
  if (strategy?.targetSegments?.length > 0) current += 15;
  if (strategy?.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20) current += 15;
  if (strategy?.aspirationTimeline) current += 5;
  if (strategy?.moatType) current += 5;

  // Projected: what score would be with full ADN completion
  const projected = Math.min(100, current + 45); // brand(15) + channels(15) + products(10) + audience(5)

  return { current, projected };
}

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

  const priorities = useMemo(() => generatePriorities(strategy, t), [strategy, t]);
  const decisions = useMemo(() => generateWeeklyDecisions(strategy, t), [strategy, t]);
  const scores = useMemo(() => calculateProjectedScore(strategy), [strategy]);

  const handleNavigate = (view: string) => {
    navigate(`/company-dashboard?view=${view}`);
  };

  const urgencyConfig = {
    high: { label: t('journey.scc.urgencyHigh', 'Urgente'), color: 'bg-destructive/10 text-destructive border-destructive/30' },
    medium: { label: t('journey.scc.urgencyMedium', 'Importante'), color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
    low: { label: t('journey.scc.urgencyLow', 'Recomendado'), color: 'bg-primary/10 text-primary border-primary/30' },
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
              {t('journey.scc.subtitle', 'Prioridades operativas post-activación')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Score Projection */}
      <motion.div {...fadeUp(0.1)}>
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="pt-5">
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
                <p className="text-xs text-muted-foreground">
                  {t('journey.scc.scoreProjection', 'Si completas las prioridades activas, tu índice subirá de {{from}} a {{to}} esta semana.', {
                    from: scores.current,
                    to: scores.projected,
                  })}
                </p>
              </div>
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
              {t('journey.scc.dynamicPrioritiesDesc', 'Generadas automáticamente basándose en tu Strategic DNA.')}
            </p>
          </motion.div>

          {priorities.slice(0, 5).map((priority, i) => {
            const Icon = priority.icon;
            const urgency = urgencyConfig[priority.urgency];
            return (
              <motion.div key={priority.id} {...fadeUp(0.2 + i * 0.05)}>
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            +{priority.impact} {t('journey.scc.indexPoints', 'pts al índice')}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleNavigate(priority.actionView)}
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
          })}
        </div>

        {/* Right Column: Decisions + Agent */}
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
                  {t('journey.scc.weeklyDecisionsDesc', 'Recomendaciones del sistema basadas en tu perfil operativo.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {decisions.map((decision, i) => (
                  <div key={i} className="space-y-2 pb-3 last:pb-0 border-b last:border-0">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{decision.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{decision.reason}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs"
                      onClick={() => handleNavigate(decision.actionView)}
                    >
                      {decision.action}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

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
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{t('journey.scc.agentDNA', 'Strategic DNA cargado')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{t('journey.scc.agentMission', 'Core Mission Logic configurada')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{t('journey.scc.agentICP', 'ICP primario definido')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{t('journey.scc.agentPositioning', 'Positioning Engine activo')}</span>
                  </div>
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

          {/* Strategic DNA Summary */}
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
