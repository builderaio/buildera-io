import { useMemo, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Building2, Globe2, Tag, Mail, Phone, MapPin, Users, Target,
  CheckCircle2, AlertTriangle, XCircle, Shield, TrendingUp,
  Zap, Star, ArrowRight, Cpu, Activity, Brain, Sparkles,
  Calendar, Eye, ShieldCheck, Download, FileSearch, BarChart3,
  DollarSign, TrendingDown, Scale, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { computeDigitalMaturityScores } from './scoring/digitalMaturityScoring';
import { InteractiveActionRoadmap } from './InteractiveActionRoadmap';
import { ScoreRingWithTooltip } from './scoring/ScoreRingWithTooltip';
import { Instagram, Linkedin, Facebook, Twitter, Youtube } from 'lucide-react';

interface ExecutiveDigitalDiagnosisProps {
  results: any;
  summary?: any;
  totalTime?: number;
  onContinue: () => void;
}

const platformIcons: Record<string, any> = {
  instagram: Instagram, linkedin: Linkedin, facebook: Facebook,
  twitter: Twitter, youtube: Youtube, tiktok: Globe2,
};

const getPlatformFromUrl = (url: string): string => {
  const l = url.toLowerCase();
  if (l.includes('linkedin')) return 'linkedin';
  if (l.includes('instagram')) return 'instagram';
  if (l.includes('facebook')) return 'facebook';
  if (l.includes('twitter') || l.includes('x.com')) return 'twitter';
  if (l.includes('youtube')) return 'youtube';
  if (l.includes('tiktok')) return 'tiktok';
  return 'other';
};

const SectionHeader = ({ icon: Icon, title, color = 'text-primary' }: { icon: any; title: string; color?: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
      <Icon className={`w-4.5 h-4.5 ${color}`} />
    </div>
    <h2 className="text-base font-bold text-slate-200 uppercase tracking-wide">{title}</h2>
  </div>
);

const DataChip = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' }) => {
  const styles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-primary/10 text-blue-300 border-primary/30',
    accent: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[variant]}`}>
      {children}
    </span>
  );
};

// ── Strategic Digital Index ──
type SDITier = 'emerging' | 'building' | 'competitive' | 'reference';

function getSDITier(score: number): SDITier {
  if (score >= 75) return 'reference';
  if (score >= 55) return 'competitive';
  if (score >= 35) return 'building';
  return 'emerging';
}

const tierConfig: Record<SDITier, { color: string; border: string; bg: string; dot: string }> = {
  emerging:    { color: 'text-red-400',     border: 'border-red-500/30',     bg: 'bg-red-500/10',     dot: 'bg-red-500' },
  building:    { color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   dot: 'bg-amber-500' },
  competitive: { color: 'text-blue-400',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10',    dot: 'bg-blue-500' },
  reference:   { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
};

const StrategicDigitalIndex = ({ overallScore, t }: { overallScore: number; t: any }) => {
  const tier = getSDITier(overallScore);
  const cfg = tierConfig[tier];
  const tierLabel = t(`common:execDiagnosis.sdiTier_${tier}`);
  const interpretation = t(`common:execDiagnosis.sdiInterpretation_${tier}`);
  const benchmark = t(`common:execDiagnosis.sdiBenchmark_${tier}`);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
      {/* Score display */}
      <div className="flex items-center gap-4">
        <div className={`relative w-16 h-16 rounded-xl ${cfg.bg} border ${cfg.border} flex flex-col items-center justify-center`}>
          <span className={`text-2xl font-bold font-mono ${cfg.color}`}>{overallScore}</span>
          <span className="text-[8px] text-slate-500 uppercase">/100</span>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            {t('common:execDiagnosis.strategicDigitalIndex', 'Strategic Digital Index')}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-sm font-bold ${cfg.color}`}>{tierLabel}</span>
          </div>
        </div>
      </div>
      {/* Interpretation */}
      <div className="flex-1 min-w-0 sm:border-l border-slate-700/50 sm:pl-5 space-y-1">
        <p className="text-xs text-slate-300 leading-relaxed">{interpretation}</p>
        <p className="text-[11px] text-slate-500 italic">{benchmark}</p>
      </div>
    </div>
  );
};

// ── Competitive Positioning Assessment ──
type CompArchetype = 'micro_early' | 'boutique_specialized' | 'structured_firm' | 'market_leader';

function getCompArchetype(score: number): CompArchetype {
  if (score >= 75) return 'market_leader';
  if (score >= 55) return 'structured_firm';
  if (score >= 35) return 'boutique_specialized';
  return 'micro_early';
}

const archetypeLevels: CompArchetype[] = ['micro_early', 'boutique_specialized', 'structured_firm', 'market_leader'];

const CompetitivePositioningAssessment = ({ digital, scores, t }: { digital: any; scores: any; t: any }) => {
  const avg = Math.round((scores.visibility.score + scores.trust.score + scores.positioning.score) / 3);
  const archetype = getCompArchetype(avg);
  const currentIdx = archetypeLevels.indexOf(archetype);

  const archetypeColors: Record<CompArchetype, { dot: string; text: string; bg: string; border: string }> = {
    micro_early:          { dot: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' },
    boutique_specialized: { dot: 'bg-amber-500',   text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' },
    structured_firm:      { dot: 'bg-blue-500',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30' },
    market_leader:        { dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  };

  const cfg = archetypeColors[archetype];

  return (
    <div className="space-y-5">
      {/* Original AI positioning text */}
      {digital.competitive_positioning && (
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed">{digital.competitive_positioning}</p>
        </div>
      )}

      {/* Archetype classification */}
      <div className={`${cfg.bg} border ${cfg.border} rounded-lg p-5 space-y-4`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">
              {t('common:execDiagnosis.compArchetypeLabel', 'Current Competitive Archetype')}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className={`text-base font-bold ${cfg.text}`}>
                {t(`common:execDiagnosis.archetype_${archetype}`)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              {t('common:execDiagnosis.competitiveLevel', 'Competitive Level')}
            </p>
            <p className="text-sm font-mono text-slate-300">{currentIdx + 1}/4</p>
          </div>
        </div>

        {/* Level progression bar */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {archetypeLevels.map((level, idx) => {
              const lvlCfg = archetypeColors[level];
              const isActive = idx <= currentIdx;
              return (
                <div key={level} className="flex-1 space-y-1">
                  <div className={`h-1.5 rounded-full ${isActive ? lvlCfg.dot : 'bg-slate-700/50'}`} />
                  <p className={`text-[9px] text-center truncate ${isActive ? lvlCfg.text : 'text-slate-600'}`}>
                    {t(`common:execDiagnosis.archetype_${level}`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {t(`common:execDiagnosis.archetypeDesc_${archetype}`)}
        </p>
      </div>

      {/* What's needed to compete */}
      {archetype !== 'market_leader' && (
        <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {t('common:execDiagnosis.toCompeteNext', 'What You Need to Compete at the Next Level')}
            </p>
          </div>
          <ul className="space-y-2">
            {(t(`common:execDiagnosis.archetypeUpgrade_${archetype}`, { returnObjects: true }) as string[]).map((item: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <ArrowRight className="w-3 h-3 text-primary/60 mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Closing statement */}
      <div className="border-l-2 border-primary/50 pl-4 py-2">
        <p className="text-sm text-slate-300 italic font-medium leading-relaxed">
          {t(`common:execDiagnosis.archetypeClosing_${archetype}`)}
        </p>
      </div>
    </div>
  );
};

// ── Deterministic Revenue at Risk Estimation ──
type ImpactLevel = 'low' | 'medium' | 'high';

function computeRevenueRisks(digital: any, scores: any): {
  leadGen: ImpactLevel;
  missedOpps: ImpactLevel;
  dueDiligence: ImpactLevel;
} {
  const visScore = scores?.visibility?.score ?? 50;
  const trustScore = scores?.trust?.score ?? 50;
  const posScore = scores?.positioning?.score ?? 50;
  const missingCount = (digital?.what_is_missing || []).length;
  const riskCount = (digital?.key_risks || []).length;

  // Lead Gen: driven by visibility + missing items
  const leadGen: ImpactLevel = visScore < 30 || missingCount >= 5 ? 'high'
    : visScore < 55 || missingCount >= 3 ? 'medium' : 'low';

  // Missed Opportunities: driven by trust + positioning
  const missedOpps: ImpactLevel = trustScore < 30 && posScore < 40 ? 'high'
    : trustScore < 50 || posScore < 50 ? 'medium' : 'low';

  // Due Diligence: driven by trust + risk count
  const dueDiligence: ImpactLevel = trustScore < 30 || riskCount >= 5 ? 'high'
    : trustScore < 55 || riskCount >= 3 ? 'medium' : 'low';

  return { leadGen, missedOpps, dueDiligence };
}

const ImpactBadge = ({ level, t }: { level: ImpactLevel; t: any }) => {
  const config = {
    low: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: t('common:execDiagnosis.impactLow', 'Low') },
    medium: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: t('common:execDiagnosis.impactMedium', 'Medium') },
    high: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: t('common:execDiagnosis.impactHigh', 'High') },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
      {level === 'high' ? <TrendingDown className="w-3 h-3" /> : level === 'medium' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {c.label}
    </span>
  );
};

const RevenueAtRiskEstimation = ({ digital, scores, t }: { digital: any; scores: any; t: any }) => {
  const risks = useMemo(() => computeRevenueRisks(digital, scores), [digital, scores]);

  const riskItems = [
    { key: 'leadGen', icon: TrendingDown, level: risks.leadGen, title: t('common:execDiagnosis.leadGenImpact'), desc: t('common:execDiagnosis.leadGenImpactDesc') },
    { key: 'missedOpps', icon: Target, level: risks.missedOpps, title: t('common:execDiagnosis.missedOpportunities'), desc: t('common:execDiagnosis.missedOpportunitiesDesc') },
    { key: 'dueDiligence', icon: Scale, level: risks.dueDiligence, title: t('common:execDiagnosis.dueDiligenceRisk'), desc: t('common:execDiagnosis.dueDiligenceRiskDesc') },
  ];

  return (
    <div className="mt-5 bg-red-500/5 border border-red-500/20 rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-4 h-4 text-red-400" />
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
          {t('common:execDiagnosis.revenueAtRisk', 'Revenue at Risk Estimation')}
        </p>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        {t('common:execDiagnosis.revenueAtRiskDesc')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {riskItems.map(item => (
          <div key={item.key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-200">{item.title}</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">{t('common:execDiagnosis.impactLevel')}:</span>
              <ImpactBadge level={item.level} t={t} />
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Scenario */}
      <div className="bg-slate-800/40 rounded-lg border border-slate-700/40 p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Scale className="w-3 h-3" />
          {t('common:execDiagnosis.scenarioComparison')}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border-l-2 border-emerald-500/50 pl-3 space-y-1">
            <p className="text-[10px] font-bold text-emerald-400 uppercase">{t('common:execDiagnosis.withVerifiableAssets')}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t('common:execDiagnosis.scenarioWith')}</p>
          </div>
          <div className="border-l-2 border-red-500/50 pl-3 space-y-1">
            <p className="text-[10px] font-bold text-red-400 uppercase">{t('common:execDiagnosis.withoutVerifiableAssets')}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{t('common:execDiagnosis.scenarioWithout')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExecutiveDigitalDiagnosis = ({
  results, summary, totalTime, onContinue
}: ExecutiveDigitalDiagnosisProps) => {
  const { t } = useTranslation(['common']);
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const scores = useMemo(() => computeDigitalMaturityScores(results), [results]);

  const basic = results?.basic_info || {};
  const digital = results?.digital_presence || {};
  const identity = basic.identity || {};
  const seo = basic.seo || {};
  const products = basic.products || {};
  const contact = basic.contact || {};
  const market = basic.market || {};
  const audience = basic.audience || {};
  const execDiag = digital.executive_diagnosis || {};
  const actionPlan = digital.action_plan || {};

  const overallScore = Math.round(
    (scores.visibility.score + scores.trust.score + scores.positioning.score) / 3
  );

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 },
  });

  const handleDownloadPDF = useCallback(async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 10;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
      const SECTION_GAP_MM = 4;

      // Get all sections marked with data-pdf-section
      const sections = Array.from(
        reportRef.current.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[];

      // Fallback: if no sections found, use direct children
      const elements = sections.length > 0 
        ? sections 
        : Array.from(reportRef.current.children) as HTMLElement[];

      const pdf = new jsPDF('p', 'mm', 'a4');
      let currentY = MARGIN_MM;
      let isFirstSection = true;

      for (const section of elements) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#0f172a', // slate-950
          logging: false,
          windowWidth: 1200,
        });

        const scaleFactor = CONTENT_WIDTH_MM / (canvas.width / 2);
        const heightMM = (canvas.height / 2) * scaleFactor;
        const remainingSpace = A4_HEIGHT_MM - MARGIN_MM - currentY;

        // If section won't fit on current page, start a new one
        if (heightMM > remainingSpace && !isFirstSection) {
          pdf.addPage();
          currentY = MARGIN_MM;
        }

        // If section is taller than a full page, scale it down to fit
        const imgData = canvas.toDataURL('image/png');
        if (heightMM > A4_HEIGHT_MM - (MARGIN_MM * 2)) {
          // Section is too tall for one page — render at full width, let it span
          const maxH = A4_HEIGHT_MM - (MARGIN_MM * 2);
          const adjustedScale = maxH / heightMM;
          const adjustedWidth = CONTENT_WIDTH_MM * adjustedScale;
          const offsetX = MARGIN_MM + (CONTENT_WIDTH_MM - adjustedWidth) / 2;
          pdf.addImage(imgData, 'PNG', offsetX, currentY, adjustedWidth, maxH);
          currentY = A4_HEIGHT_MM - MARGIN_MM;
        } else {
          pdf.addImage(imgData, 'PNG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
          currentY += heightMM + SECTION_GAP_MM;
        }

        isFirstSection = false;
      }

      // Add page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${i} / ${totalPages}`, A4_WIDTH_MM / 2, A4_HEIGHT_MM - 5, { align: 'center' });
        pdf.text(`© ${new Date().getFullYear()} Buildera.io`, A4_WIDTH_MM - MARGIN_MM, A4_HEIGHT_MM - 5, { align: 'right' });
      }

      const companyName = (identity.company_name || 'empresa').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Diagnostico_Digital_${companyName}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  }, [downloading, identity.company_name]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" />
                {t('common:execDiagnosis.engineLabel', 'Executive Digital Diagnosis')}
              </p>
              <p className="text-sm font-semibold text-white leading-tight">
                {identity.company_name || t('common:execDiagnosis.companyProfile', 'Company Profile')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalTime && (
              <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
                {t('common:onboarding.generatedIn', { time: (totalTime / 1000).toFixed(1) })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={onContinue}
              size="sm"
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-xs"
            >
              {t('common:execDiagnosis.proceedDNA', 'Proceed to Strategic DNA')}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 1: SNAPSHOT OVERVIEW */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.section data-pdf-section {...fadeUp(0.1)} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
          <SectionHeader icon={Building2} title={t('common:execDiagnosis.snapshotOverview', 'Snapshot Overview')} />

          {/* Identity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Company Identity */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-3">
              <div className="flex items-center gap-3">
                {identity.logo && (
                  <img
                    src={identity.logo}
                    alt="Logo"
                    className="w-12 h-12 rounded-lg object-contain bg-white/5 p-1"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{identity.company_name || '—'}</p>
                  {identity.slogan && (
                    <p className="text-xs text-slate-400 italic truncate">"{identity.slogan}"</p>
                  )}
                </div>
              </div>
              {identity.url && (
                <p className="text-xs text-blue-400 truncate flex items-center gap-1">
                  <Globe2 className="w-3 h-3 flex-shrink-0" />
                  {identity.url}
                </p>
              )}
              {identity.founding_date && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {t('common:execDiagnosis.founded', 'Founded')}: {identity.founding_date}
                </p>
              )}
              {/* Contact info */}
              <div className="space-y-1 pt-1 border-t border-slate-700/50">
                {(contact.email || []).slice(0, 2).map((e: string, i: number) => (
                  <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <Mail className="w-3 h-3 flex-shrink-0 text-slate-500" /> {e}
                  </p>
                ))}
                {(contact.phone || []).slice(0, 2).map((p: string, i: number) => (
                  <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 flex-shrink-0 text-slate-500" /> {p}
                  </p>
                ))}
                {(contact.address || []).slice(0, 1).map((a: string, i: number) => (
                  <p key={i} className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0 text-slate-500" /> {a}
                  </p>
                ))}
              </div>
              {/* Social Links */}
              {contact.social_links?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contact.social_links.map((link: string, idx: number) => {
                    const platform = getPlatformFromUrl(link);
                    const Icon = platformIcons[platform] || Globe2;
                    return (
                      <a
                        key={idx} href={link} target="_blank" rel="noopener noreferrer"
                        className="w-7 h-7 rounded-md bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center transition-colors"
                        title={platform}
                      >
                        <Icon className="w-3.5 h-3.5 text-slate-300" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Industry Signals */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('common:execDiagnosis.industrySignals', 'Industry Signals')}
              </p>
              {seo.title && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">SEO Title</p>
                  <p className="text-xs text-slate-300">{seo.title}</p>
                </div>
              )}
              {seo.description && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">Meta Description</p>
                  <p className="text-xs text-slate-300 line-clamp-3">{seo.description}</p>
                </div>
              )}
              {(seo.keyword || seo.keywords || []).length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">{t('common:execDiagnosis.seoKeywords', 'SEO Keywords')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(seo.keyword || seo.keywords || []).slice(0, 8).map((kw: string, i: number) => (
                      <DataChip key={i}>{kw}</DataChip>
                    ))}
                  </div>
                </div>
              )}
              {/* Market */}
              {(market.country?.length > 0 || market.city?.length > 0) && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">{t('common:execDiagnosis.marketPresence', 'Market Presence')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(market.country || []).map((c: string, i: number) => (
                      <DataChip key={`c-${i}`} variant="primary">🌍 {c}</DataChip>
                    ))}
                    {(market.city || []).map((c: string, i: number) => (
                      <DataChip key={`ci-${i}`}>📍 {c}</DataChip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Product/Service Extraction */}
            <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('common:execDiagnosis.productExtraction', 'Product & Service Extraction')}
              </p>
              {(products.service || products.services || []).length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {t('common:execDiagnosis.servicesDetected', 'Services Detected')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(products.service || products.services || []).map((s: string, i: number) => (
                      <DataChip key={i} variant="primary">{s}</DataChip>
                    ))}
                  </div>
                </div>
              )}
              {(products.offer || products.offers || []).length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {t('common:execDiagnosis.offersDetected', 'Offers Detected')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(products.offer || products.offers || []).map((o: string, i: number) => (
                      <DataChip key={i} variant="accent">{o}</DataChip>
                    ))}
                  </div>
                </div>
              )}
              {/* Audience */}
              {((audience.segment || audience.segments || []).length > 0 ||
                (audience.profession || audience.professions || []).length > 0 ||
                (audience.target_user || audience.target_users || []).length > 0) && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {t('common:execDiagnosis.audienceDetected', 'Audience Signals')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(audience.segment || audience.segments || []).map((s: string, i: number) => (
                      <DataChip key={`s-${i}`} variant="success">{s}</DataChip>
                    ))}
                    {(audience.profession || audience.professions || []).map((p: string, i: number) => (
                      <DataChip key={`p-${i}`} variant="primary">{p}</DataChip>
                    ))}
                    {(audience.target_user || audience.target_users || []).map((tu: string, i: number) => (
                      <DataChip key={`t-${i}`} variant="warning">{tu}</DataChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 2: PERFORMANCE SIGNALS */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.section data-pdf-section {...fadeUp(0.2)} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
          <SectionHeader icon={Activity} title={t('common:execDiagnosis.performanceSignals', 'Performance Signals')} />

          {/* Executive Diagnosis Banner */}
          {(execDiag.current_state || execDiag.primary_constraint || execDiag.highest_leverage_focus) && (
            <div className="bg-slate-800/80 rounded-lg p-4 mb-5 border border-slate-700/50 space-y-3">
              <p className="text-[10px] text-primary font-mono uppercase tracking-widest mb-2">
                {t('common:execDiagnosis.aiDiagnosis', 'AI Executive Diagnosis')}
              </p>
              {execDiag.current_state && (
                <div className="border-l-2 border-primary pl-3">
                  <p className="text-[10px] text-primary font-semibold">{t('common:snapshot.currentState')}</p>
                  <p className="text-sm text-slate-300">{execDiag.current_state}</p>
                </div>
              )}
              {execDiag.primary_constraint && (
                <div className="border-l-2 border-red-500/70 pl-3">
                  <p className="text-[10px] text-red-400 font-semibold">{t('common:snapshot.primaryConstraint')}</p>
                  <p className="text-sm text-slate-300">{execDiag.primary_constraint}</p>
                </div>
              )}
              {execDiag.highest_leverage_focus && (
                <div className="border-l-2 border-emerald-500/70 pl-3">
                  <p className="text-[10px] text-emerald-400 font-semibold">{t('common:snapshot.highestLeverage')}</p>
                  <p className="text-sm text-slate-300">{execDiag.highest_leverage_focus}</p>
                </div>
              )}
            </div>
          )}

          {/* Digital Footprint */}
          {digital.digital_footprint_summary && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-5">
              <p className="text-xs text-slate-300">{digital.digital_footprint_summary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What's Working */}
            {(digital.what_is_working || []).length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {t('common:execDiagnosis.whatIsWorking', 'What is Working')}
                    <span className="ml-1.5 text-emerald-500/60">({(digital.what_is_working || []).length})</span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {(digital.what_is_working || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500/60 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* What's Missing */}
            {(digital.what_is_missing || []).length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    {t('common:execDiagnosis.whatIsMissing', 'What is Missing')}
                    <span className="ml-1.5 text-amber-500/60">({(digital.what_is_missing || []).length})</span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {(digital.what_is_missing || []).map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <AlertTriangle className="w-3 h-3 text-amber-500/60 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Risks */}
            {(digital.key_risks || []).length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-red-400" />
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                    {t('common:execDiagnosis.keyRisks', 'Key Risks')}
                    <span className="ml-1.5 text-red-500/60">({(digital.key_risks || []).length})</span>
                  </p>
                </div>
                <ul className="space-y-2">
                  {(digital.key_risks || []).map((risk: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <XCircle className="w-3 h-3 text-red-500/60 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Revenue at Risk Estimation ── */}
          <RevenueAtRiskEstimation digital={digital} scores={scores} t={t} />
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 3: COMPETITIVE POSITIONING */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.section data-pdf-section {...fadeUp(0.3)} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
          <SectionHeader icon={TrendingUp} title={t('common:execDiagnosis.competitivePositioning', 'Competitive Positioning Assessment')} />
          <CompetitivePositioningAssessment digital={digital} scores={scores} t={t} />
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 4: ACTION PLAN */}
        {/* ══════════════════════════════════════════════════════ */}
        {(actionPlan.short_term?.length > 0 || actionPlan.mid_term?.length > 0 || actionPlan.long_term?.length > 0) && (
          <motion.section data-pdf-section {...fadeUp(0.4)} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
            <SectionHeader icon={Zap} title={t('common:execDiagnosis.actionPlan', 'Recommended Action Plan')} color="text-orange-400" />
            <InteractiveActionRoadmap actionPlan={actionPlan} currentScore={overallScore} />
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* SECTION 5: MATURITY SCORES */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.section data-pdf-section {...fadeUp(0.5)} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 sm:p-6">
          {/* Strategic Digital Index Header */}
          <StrategicDigitalIndex overallScore={overallScore} t={t} />

          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 mt-6">
            <ScoreRingWithTooltip
              breakdown={scores.visibility}
              label={t('common:snapshot.visibilityScore', 'Digital Visibility')}
              icon={Eye}
              color="#3b82f6"
              delay={200}
            />
            <ScoreRingWithTooltip
              breakdown={scores.trust}
              label={t('common:snapshot.trustScore', 'Trust & Credibility')}
              icon={ShieldCheck}
              color="#8b5cf6"
              delay={400}
            />
            <ScoreRingWithTooltip
              breakdown={scores.positioning}
              label={t('common:snapshot.positioningScore', 'Positioning Clarity')}
              icon={Target}
              color="#f59e0b"
              delay={600}
            />
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* CTA: PROCEED TO STRATEGIC DNA */}
        {/* ══════════════════════════════════════════════════════ */}
        <motion.div data-pdf-section {...fadeUp(0.6)} className="bg-slate-900/80 border border-primary/30 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="w-11 h-11 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0"
            >
              <Brain className="w-5 h-5 text-primary" />
            </motion.div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">
                {t('common:execDiagnosis.ctaNextStep', 'Next: Strategic DNA Configuration')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('common:execDiagnosis.ctaNextStepSub', 'Define your mission, vision, and value proposition with AI assistance.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-2"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading 
                ? t('common:execDiagnosis.generatingPDF', 'Generating...') 
                : t('common:execDiagnosis.downloadPDF', 'Download PDF')}
            </Button>
            <Button
              onClick={onContinue}
              size="sm"
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 gap-2 px-5"
            >
              {t('common:execDiagnosis.continue', 'Continue')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Footer Status */}
        <motion.div
          {...fadeUp(0.7)}
          className="flex items-center justify-center gap-4 text-[10px] text-slate-600 py-3"
        >
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('common:snapshot.brainOnline', 'Enterprise Brain Online')}
          </span>
          <span>•</span>
          <span>{t('common:execDiagnosis.fullDiagnosisComplete', 'Full Diagnosis Complete')}</span>
          <span>•</span>
          <span>{new Date().toLocaleDateString()}</span>
        </motion.div>
      </div>
    </div>
  );
};

export default ExecutiveDigitalDiagnosis;
