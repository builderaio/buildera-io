import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, BarChart3, Shield, Users, Cpu, 
  CheckCircle2, Circle, Lightbulb, Sparkles,
} from 'lucide-react';
import { useAgenticMaturityScore, AgenticPillarScore } from '@/hooks/useAgenticMaturityScore';
import { cn } from '@/lib/utils';

interface AgenticMaturityAssessmentProps {
  companyId: string | null;
}

const pillarConfig = [
  { key: 'businessModel' as const, icon: BarChart3, color: 'hsl(var(--primary))' },
  { key: 'operatingModel' as const, icon: Cpu, color: 'hsl(var(--chart-2, 200 70% 50%))' },
  { key: 'governance' as const, icon: Shield, color: 'hsl(var(--chart-3, 150 60% 45%))' },
  { key: 'workforce' as const, icon: Users, color: 'hsl(var(--chart-4, 40 80% 55%))' },
  { key: 'technologyData' as const, icon: Brain, color: 'hsl(var(--chart-5, 280 65% 55%))' },
];

function getMaturityLevel(score: number): { key: string; color: string } {
  if (score >= 80) return { key: 'agenticMaturity.level.leader', color: 'text-emerald-600' };
  if (score >= 60) return { key: 'agenticMaturity.level.advanced', color: 'text-primary' };
  if (score >= 40) return { key: 'agenticMaturity.level.developing', color: 'text-amber-600' };
  return { key: 'agenticMaturity.level.initial', color: 'text-destructive' };
}

function PillarBreakdown({ pillar, label, Icon, color, t }: { 
  pillar: AgenticPillarScore; label: string; Icon: any; color: string; t: any 
}) {
  const pct = Math.round((pillar.score / pillar.maxScore) * 100);
  return (
    <div className="space-y-2 p-3 rounded-lg border bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{pillar.score}/100</span>
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="space-y-1">
        {pillar.details.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {d.met ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            )}
            <span className={cn(!d.met && 'opacity-60')}>{t(d.label, d.label.split('.').pop())}</span>
            <span className="ml-auto font-mono text-[10px]">+{d.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgenticMaturityAssessment({ companyId }: AgenticMaturityAssessmentProps) {
  const { t } = useTranslation();
  const maturity = useAgenticMaturityScore(companyId);
  const level = getMaturityLevel(maturity.composite);

  // Persist snapshot on mount
  useEffect(() => {
    if (!maturity.loading && maturity.composite > 0) {
      maturity.persistSnapshot();
    }
  }, [maturity.loading, maturity.composite]);

  if (maturity.loading) return null;

  const radarData = pillarConfig.map(p => ({
    pillar: t(`agenticMaturity.pillar.${p.key}`, p.key),
    score: maturity[p.key].score,
    fullMark: 100,
  }));

  // Find weakest pillar for recommendation
  const weakest = pillarConfig.reduce((min, p) => 
    maturity[p.key].score < maturity[min.key].score ? p : min
  , pillarConfig[0]);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/3 via-transparent to-accent/3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {t('agenticMaturity.title', 'Índice de Madurez Agéntica')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('agenticMaturity.subtitle', 'Framework McKinsey — 5 pilares de transformación')}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-2xl font-bold', level.color)}>{maturity.composite}</p>
              <Badge variant="outline" className={cn('text-[10px]', level.color)}>
                {t(level.key, level.key.split('.').pop())}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Radar Chart */}
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="pillar" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.2} 
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pillarConfig.map(p => (
              <PillarBreakdown
                key={p.key}
                pillar={maturity[p.key]}
                label={t(`agenticMaturity.pillar.${p.key}`, p.key)}
                Icon={p.icon}
                color={p.color}
                t={t}
              />
            ))}
          </div>

          {/* Recommendation */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {t('agenticMaturity.recommendation', 'Recomendación')}:
              </span>{' '}
              {t(`agenticMaturity.rec.${weakest.key}`, `Fortalece tu pilar de ${weakest.key} para avanzar en madurez agéntica.`)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
