import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, Star, ArrowRight, CheckCircle2, Circle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ActionItem {
  action?: string;
  reason?: string;
  [key: string]: any;
}

interface InteractiveActionRoadmapProps {
  actionPlan: {
    short_term?: ActionItem[];
    mid_term?: ActionItem[];
    long_term?: ActionItem[];
  };
  currentScore: number;
}

type Phase = 'short' | 'mid' | 'long';

// Deterministic score impact per action based on phase
const IMPACT_PER_ACTION: Record<Phase, number> = {
  short: 5,
  mid: 3,
  long: 2,
};

const phaseConfig: Record<Phase, {
  color: string; bg: string; border: string; dot: string;
  icon: typeof Zap; periodKey: string; daysLabel: string;
}> = {
  short: {
    color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20',
    dot: 'bg-emerald-500', icon: Zap, periodKey: 'shortTerm', daysLabel: '30',
  },
  mid: {
    color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/20',
    dot: 'bg-blue-500', icon: TrendingUp, periodKey: 'midTerm', daysLabel: '90',
  },
  long: {
    color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-500/20',
    dot: 'bg-purple-500', icon: Star, periodKey: 'longTerm', daysLabel: '6-12',
  },
};

export const InteractiveActionRoadmap = ({ actionPlan, currentScore }: InteractiveActionRoadmapProps) => {
  const { t } = useTranslation(['common']);

  // Build flat list with phase tags
  const allActions = useMemo(() => {
    const items: { phase: Phase; idx: number; text: string; reason?: string }[] = [];
    (actionPlan.short_term || []).forEach((a, i) =>
      items.push({ phase: 'short', idx: i, text: a.action || (a as any as string), reason: a.reason })
    );
    (actionPlan.mid_term || []).forEach((a, i) =>
      items.push({ phase: 'mid', idx: i, text: a.action || (a as any as string), reason: a.reason })
    );
    (actionPlan.long_term || []).forEach((a, i) =>
      items.push({ phase: 'long', idx: i, text: a.action || (a as any as string), reason: a.reason })
    );
    return items;
  }, [actionPlan]);

  // Track checked state: "phase-idx"
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleAction = useCallback((key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Calculate projected score
  const { projectedScore, checkedByPhase, totalChecked } = useMemo(() => {
    const byPhase: Record<Phase, number> = { short: 0, mid: 0, long: 0 };
    checked.forEach(key => {
      const phase = key.split('-')[0] as Phase;
      byPhase[phase]++;
    });
    let bonus = 0;
    (['short', 'mid', 'long'] as Phase[]).forEach(p => {
      bonus += byPhase[p] * IMPACT_PER_ACTION[p];
    });
    return {
      projectedScore: Math.min(100, currentScore + bonus),
      checkedByPhase: byPhase,
      totalChecked: checked.size,
    };
  }, [checked, currentScore]);

  const scoreDelta = projectedScore - currentScore;

  // Determine the dominant phase for the projection message
  const dominantPhase: Phase = checkedByPhase.short > 0 ? 'short' : checkedByPhase.mid > 0 ? 'mid' : 'long';
  const daysLabel = phaseConfig[dominantPhase].daysLabel;

  if (allActions.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* Score Projection Banner */}
      <AnimatePresence mode="wait">
        {totalChecked > 0 && (
          <motion.div
            key="projection"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-lg p-4 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Score bar */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {t('common:execDiagnosis.projectedIndex', 'Projected Strategic Digital Index')}
                  </span>
                  <span className="font-mono font-bold text-primary">
                    {currentScore} → {projectedScore}
                    <span className="text-emerald-400 ml-1.5">(+{scoreDelta})</span>
                  </span>
                </div>
                <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-slate-600 rounded-full"
                    style={{ width: `${currentScore}%` }}
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                    initial={{ width: `${currentScore}%` }}
                    animate={{ width: `${projectedScore}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {t('common:execDiagnosis.projectionMessage', {
                count: totalChecked,
                days: daysLabel,
                from: currentScore,
                to: projectedScore,
              })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['short', 'mid', 'long'] as Phase[]).map(phase => {
          const actions = phase === 'short'
            ? actionPlan.short_term
            : phase === 'mid'
              ? actionPlan.mid_term
              : actionPlan.long_term;

          if (!actions?.length) return null;

          const cfg = phaseConfig[phase];
          const PhaseIcon = cfg.icon;
          const phaseChecked = checkedByPhase[phase];
          const phaseTotal = actions.length;

          return (
            <div key={phase} className={`${cfg.bg} border ${cfg.border} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PhaseIcon className={`w-4 h-4 ${cfg.color}`} />
                  <div>
                    <p className={`text-xs font-bold ${cfg.color} uppercase`}>
                      {t(`common:execDiagnosis.${cfg.periodKey}`)}
                    </p>
                    <p className={`text-[10px] ${cfg.color} opacity-60`}>
                      {cfg.daysLabel} {phase === 'long' ? t('common:execDiagnosis.months') : t('common:execDiagnosis.days')}
                    </p>
                  </div>
                </div>
                {phaseChecked > 0 && (
                  <span className={`text-[10px] font-mono ${cfg.color} px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border}`}>
                    {phaseChecked}/{phaseTotal}
                  </span>
                )}
              </div>

              {/* Phase mini progress */}
              {phaseTotal > 1 && (
                <div className="h-1 bg-slate-800 rounded-full mb-3 overflow-hidden">
                  <motion.div
                    className={`h-full ${cfg.dot} rounded-full`}
                    animate={{ width: `${(phaseChecked / phaseTotal) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              <ul className="space-y-2.5">
                {actions.map((action: any, idx: number) => {
                  const key = `${phase}-${idx}`;
                  const isChecked = checked.has(key);
                  const text = action.action || action;

                  return (
                    <li
                      key={idx}
                      className={`text-xs cursor-pointer group transition-all rounded-md p-2 -mx-1 ${
                        isChecked ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'
                      }`}
                      onClick={() => toggleAction(key)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex-shrink-0">
                          {isChecked ? (
                            <CheckCircle2 className={`w-4 h-4 ${cfg.color}`} />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-medium transition-colors ${
                            isChecked ? 'text-slate-500 line-through' : 'text-slate-200'
                          }`}>{text}</p>
                          {action.reason && (
                            <p className="text-slate-600 text-[11px] mt-1">{action.reason}</p>
                          )}
                          {!isChecked && (
                            <p className="text-[10px] text-primary/50 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-2.5 h-2.5" />
                              +{IMPACT_PER_ACTION[phase]} {t('common:execDiagnosis.indexPoints', 'index points')}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
