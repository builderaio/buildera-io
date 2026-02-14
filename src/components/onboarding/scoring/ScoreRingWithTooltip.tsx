import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Info, CheckCircle2, XCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ScoreBreakdown } from './digitalMaturityScoring';

interface ScoreRingWithTooltipProps {
  breakdown: ScoreBreakdown;
  label: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

export const ScoreRingWithTooltip = ({
  breakdown, label, icon: Icon, color, delay = 0,
}: ScoreRingWithTooltipProps) => {
  const { t } = useTranslation(['common']);
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= breakdown.score) {
          setDisplayScore(breakdown.score);
          clearInterval(interval);
        } else {
          setDisplayScore(current);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [breakdown.score, delay]);

  const getScoreColor = (s: number) => {
    if (s >= 75) return 'text-emerald-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.6, type: 'spring' }}
      className="flex flex-col items-center gap-3"
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 cursor-help group">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted)/0.2)" strokeWidth="4" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={color}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: delay / 1000 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Icon className="w-5 h-5 mb-1" style={{ color }} />
                <span className={`text-2xl sm:text-3xl font-bold ${getScoreColor(displayScore)}`}>
                  {displayScore}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                <Info className="w-3 h-3 text-slate-300" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="w-72 p-0 bg-slate-900 border-slate-700 shadow-xl"
          >
            <div className="p-3 border-b border-slate-700/50">
              <p className="text-xs font-semibold text-slate-200">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {t('common:scoring.howCalculated', 'Score breakdown by criteria')}
              </p>
            </div>
            <div className="p-2 max-h-60 overflow-y-auto space-y-1">
              {breakdown.criteria.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {c.met ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500/60 flex-shrink-0" />
                    )}
                    <span className={c.met ? 'text-slate-300' : 'text-slate-500'}>
                      {t(`common:${c.labelKey}`, c.key)}
                    </span>
                  </div>
                  <span className={`font-mono flex-shrink-0 ${c.met ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {c.points}/{c.maxPoints}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-slate-700/50 flex justify-between px-4">
              <span className="text-[10px] text-slate-500 font-semibold">
                {t('common:scoring.total', 'Total')}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-200">
                {breakdown.score}/100
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="text-xs sm:text-sm text-slate-400 font-medium text-center max-w-[120px]">
        {label}
      </span>
    </motion.div>
  );
};
