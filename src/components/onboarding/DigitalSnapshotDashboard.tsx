import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Eye, ShieldCheck, FileText, Brain, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, ArrowRight, Activity, Cpu, Zap,
  Globe2, Target, Users, BarChart3, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DigitalSnapshotDashboardProps {
  results: any;
  companyName: string;
  onContinue: () => void;
  onViewFullReport: () => void;
}

// Compute scores from extracted data
function computeScores(results: any) {
  const basic = results?.basic_info || {};
  const digital = results?.digital_presence || {};
  const identity = basic.identity || {};
  const seo = basic.seo || {};
  const products = basic.products || {};
  const contact = basic.contact || {};
  const audience = basic.audience || {};

  // Digital Visibility Score (0-100)
  let visibility = 0;
  if (identity.url) visibility += 15;
  if (seo.title) visibility += 10;
  if (seo.description) visibility += 10;
  if ((seo.keyword || seo.keywords || []).length > 0) visibility += 10;
  if ((contact.social_links || []).length > 0) visibility += Math.min(20, (contact.social_links || []).length * 5);
  if ((digital.what_is_working || []).length > 0) visibility += Math.min(20, (digital.what_is_working || []).length * 5);
  if (digital.digital_footprint_summary) visibility += 10;
  if (digital.competitive_positioning) visibility += 5;
  visibility = Math.min(100, visibility);

  // Trust & Credibility Score (0-100)
  let trust = 0;
  if (identity.company_name) trust += 10;
  if (identity.logo) trust += 15;
  if (identity.slogan) trust += 5;
  if ((contact.email || []).length > 0) trust += 10;
  if ((contact.phone || []).length > 0) trust += 10;
  if ((contact.address || []).length > 0) trust += 10;
  if ((contact.social_links || []).length >= 3) trust += 15;
  else if ((contact.social_links || []).length > 0) trust += 8;
  if ((digital.key_risks || []).length === 0) trust += 15;
  else if ((digital.key_risks || []).length <= 2) trust += 8;
  if (identity.founding_date) trust += 10;
  trust = Math.min(100, trust);

  // Content Maturity Score (0-100)
  let content = 0;
  if ((products.service || products.services || []).length > 0) content += 15;
  if ((products.offer || products.offers || []).length > 0) content += 10;
  if ((audience.segment || audience.segments || []).length > 0) content += 10;
  if ((audience.profession || audience.professions || []).length > 0) content += 5;
  if ((audience.target_user || audience.target_users || []).length > 0) content += 5;
  if (seo.description) content += 10;
  if ((digital.what_is_working || []).length >= 3) content += 15;
  else if ((digital.what_is_working || []).length > 0) content += 8;
  if ((digital.what_is_missing || []).length <= 2) content += 15;
  else content += 5;
  if (digital.action_plan?.short_term?.length > 0) content += 10;
  if (digital.executive_diagnosis?.highest_leverage_focus) content += 5;
  content = Math.min(100, content);

  return { visibility, trust, content };
}

// Animated score ring
const ScoreRing = ({ score, label, icon: Icon, color, delay = 0 }: {
  score: number; label: string; icon: any; color: string; delay?: number;
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 1;
        if (current >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(current);
        }
      }, 20);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

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
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
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
      </div>
      <span className="text-xs sm:text-sm text-slate-400 font-medium text-center max-w-[120px]">
        {label}
      </span>
    </motion.div>
  );
};

// Animated stat card
const StatCard = ({ icon: Icon, label, value, delay = 0 }: {
  icon: any; label: string; value: string | number; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 flex items-center gap-3"
  >
    <div className="w-8 h-8 rounded-md bg-slate-700/80 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-300" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 truncate">{label}</p>
      <p className="text-sm font-semibold text-slate-200 truncate">{value}</p>
    </div>
  </motion.div>
);

// Brain pulse animation
const BrainPulse = () => (
  <div className="absolute -top-3 -right-3 z-10">
    <motion.div
      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
    >
      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
    </motion.div>
  </div>
);

export const DigitalSnapshotDashboard = ({
  results, companyName, onContinue, onViewFullReport
}: DigitalSnapshotDashboardProps) => {
  const { t } = useTranslation(['common']);
  const scores = useMemo(() => computeScores(results), [results]);

  const basic = results?.basic_info || {};
  const digital = results?.digital_presence || {};
  const identity = basic.identity || {};
  const products = basic.products || {};
  const contact = basic.contact || {};
  const execDiag = digital.executive_diagnosis || {};

  const overallScore = Math.round((scores.visibility + scores.trust + scores.content) / 3);

  const workingCount = (digital.what_is_working || []).length;
  const missingCount = (digital.what_is_missing || []).length;
  const risksCount = (digital.key_risks || []).length;
  const socialCount = (contact.social_links || []).length;
  const servicesCount = (products.service || products.services || []).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <BrainPulse />
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                {t('common:snapshot.engineActive', 'Digital Snapshot Engine • Active')}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {companyName}
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            {t('common:snapshot.subtitle', 'Enterprise Brain has completed the initial analysis. Here\'s your digital snapshot.')}
          </p>
        </motion.div>

        {/* Overall Score + 3 Score Rings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                {t('common:snapshot.digitalHealth', 'Digital Health Assessment')}
              </h2>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${overallScore >= 60 ? 'bg-emerald-500' : overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-xs font-mono text-slate-300">
                {t('common:snapshot.overallScore', 'Overall')}: {overallScore}/100
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
            <ScoreRing
              score={scores.visibility}
              label={t('common:snapshot.visibilityScore', 'Digital Visibility')}
              icon={Eye}
              color="#3b82f6"
              delay={300}
            />
            <ScoreRing
              score={scores.trust}
              label={t('common:snapshot.trustScore', 'Trust & Credibility')}
              icon={ShieldCheck}
              color="#8b5cf6"
              delay={600}
            />
            <ScoreRing
              score={scores.content}
              label={t('common:snapshot.contentScore', 'Content Maturity')}
              icon={FileText}
              color="#f59e0b"
              delay={900}
            />
          </div>
        </motion.div>

        {/* Executive Diagnosis */}
        {(execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                {t('common:snapshot.executiveSummary', 'Executive Diagnosis')}
              </h2>
            </div>
            {execDiag.current_state && (
              <div className="bg-slate-800/60 rounded-lg p-4 border-l-2 border-primary">
                <p className="text-xs text-primary font-semibold mb-1">
                  {t('common:snapshot.currentState', 'Current State')}
                </p>
                <p className="text-sm text-slate-300">{execDiag.current_state}</p>
              </div>
            )}
            {execDiag.primary_constraint && (
              <div className="bg-slate-800/60 rounded-lg p-4 border-l-2 border-red-500/70">
                <p className="text-xs text-red-400 font-semibold mb-1">
                  {t('common:snapshot.primaryConstraint', 'Primary Constraint')}
                </p>
                <p className="text-sm text-slate-300">{execDiag.primary_constraint}</p>
              </div>
            )}
            {execDiag.highest_leverage_focus && (
              <div className="bg-slate-800/60 rounded-lg p-4 border-l-2 border-emerald-500/70">
                <p className="text-xs text-emerald-400 font-semibold mb-1">
                  {t('common:snapshot.highestLeverage', 'Highest Leverage Focus')}
                </p>
                <p className="text-sm text-slate-300">{execDiag.highest_leverage_focus}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
        >
          <StatCard icon={Globe2} label={t('common:snapshot.socialChannels', 'Social Channels')} value={socialCount} delay={0.7} />
          <StatCard icon={Target} label={t('common:snapshot.services', 'Services')} value={servicesCount} delay={0.8} />
          <StatCard icon={CheckCircle2} label={t('common:snapshot.strengths', 'Strengths')} value={workingCount} delay={0.9} />
          <StatCard icon={AlertTriangle} label={t('common:snapshot.gaps', 'Gaps Detected')} value={missingCount} delay={1.0} />
          <StatCard icon={XCircle} label={t('common:snapshot.risks', 'Active Risks')} value={risksCount} delay={1.1} />
        </motion.div>

        {/* Strengths & Gaps Quick View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(digital.what_is_working || []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">
                  {t('common:snapshot.whatWorks', 'What\'s Working')}
                </h3>
              </div>
              <ul className="space-y-2">
                {(digital.what_is_working || []).slice(0, 4).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {(digital.what_is_missing || []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">
                  {t('common:snapshot.whatsMissing', 'Critical Gaps')}
                </h3>
              </div>
              <ul className="space-y-2">
                {(digital.what_is_missing || []).slice(0, 4).map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Action Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"
            >
              <Zap className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-white">
                {t('common:snapshot.nextPhase', 'Next: Strategic DNA Configuration')}
              </p>
              <p className="text-xs text-slate-400">
                {t('common:snapshot.nextPhaseDesc', 'Define your mission, vision, and value proposition with AI assistance.')}
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onViewFullReport}
              className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('common:snapshot.viewFullReport', 'Full Report')}
            </Button>
            <Button
              onClick={onContinue}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              {t('common:snapshot.continueStrategy', 'Continue')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* Enterprise Brain Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex items-center justify-center gap-4 text-xs text-slate-600 py-2"
        >
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('common:snapshot.brainOnline', 'Enterprise Brain Online')}
          </span>
          <span>•</span>
          <span>{t('common:snapshot.analysisComplete', 'Analysis Complete')}</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString()}</span>
        </motion.div>
      </div>
    </div>
  );
};

export default DigitalSnapshotDashboard;
