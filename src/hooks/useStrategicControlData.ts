import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayToWinStrategy } from '@/types/playToWin';

// ─── Types ───

export type PrioritySource = 'dna' | 'diagnostic';
export type StrategicVariable = 'positioning' | 'channel' | 'offer' | 'authority' | 'audience' | 'brand' | 'visibility' | 'trust';

export interface StrategicPriority {
  id: string;
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  impactPoints: number;
  source: PrioritySource;
  variable: StrategicVariable;
  actionView: string;
}

export interface WeeklyDecision {
  title: string;
  reason: string;
  action: string;
  actionView: string;
  source: PrioritySource;
  variable: StrategicVariable;
}

export interface DiagnosticPresence {
  digitalFootprintSummary: string | null;
  whatIsWorking: string[];
  whatIsMissing: string[];
  keyRisks: string[];
  competitivePositioning: string | null;
  actionPlan: string[];
  executiveDiagnosis: {
    scores?: { visibility: number; trust: number; positioning: number; overall: number };
    sdiLevel?: string;
    highestLeverageFocus?: string;
    revenueAtRisk?: any;
    archetype?: string;
  } | null;
}

export interface StrategicScores {
  current: number;
  projected: number;
  breakdown: { label: string; value: number; max: number; category: 'foundation' | 'presence' | 'execution' | 'gaps' }[];
  categoryTotals: { foundation: number; presence: number; execution: number; gaps: number };
}

export interface OperationalMaturity {
  activeAgents: number;
  totalExecutions: number;
  successfulExecutions: number;
  connectedChannels: number;
  priorityChannelsConnected: number;
  hasBrandIdentity: boolean;
  hasProducts: boolean;
  hasAudiences: boolean;
}

// ─── Hook ───

export function useStrategicControlData(companyId: string | undefined) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticPresence | null>(null);
  const [operational, setOperational] = useState<OperationalMaturity | null>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    
    const fetchAll = async () => {
      setIsLoadingDiagnostic(true);
      try {
        // Parallel fetches
        const [diagRes, agentsRes, companyRes, productsRes, audiencesRes] = await Promise.all([
          supabase
            .from('company_digital_presence')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('company_agent_configurations')
            .select('is_active, total_executions, last_execution_status')
            .eq('company_id', companyId),
          supabase
            .from('companies')
            .select('facebook_url, twitter_url, linkedin_url, instagram_url, youtube_url, tiktok_url, logo_url')
            .eq('id', companyId)
            .maybeSingle(),
          supabase
            .from('company_products')
            .select('id')
            .eq('company_id', companyId)
            .limit(1),
          supabase
            .from('company_audiences')
            .select('id')
            .eq('company_id', companyId)
            .limit(1),
        ]);

        // Diagnostic
        if (diagRes.data) {
          const exec = diagRes.data.executive_diagnosis as any;
          setDiagnostic({
            digitalFootprintSummary: diagRes.data.digital_footprint_summary,
            whatIsWorking: Array.isArray(diagRes.data.what_is_working) ? diagRes.data.what_is_working as string[] : [],
            whatIsMissing: Array.isArray(diagRes.data.what_is_missing) ? diagRes.data.what_is_missing as string[] : [],
            keyRisks: Array.isArray(diagRes.data.key_risks) ? diagRes.data.key_risks as string[] : [],
            competitivePositioning: diagRes.data.competitive_positioning,
            actionPlan: Array.isArray(diagRes.data.action_plan) ? diagRes.data.action_plan as string[] : [],
            executiveDiagnosis: exec ? {
              scores: exec.scores || null,
              sdiLevel: exec.sdi_level || exec.sdiLevel || null,
              highestLeverageFocus: exec.highest_leverage_focus || null,
              revenueAtRisk: exec.revenue_at_risk || null,
              archetype: exec.archetype || null,
            } : null,
          });
        }

        // Operational maturity
        const agents = agentsRes.data || [];
        const activeAgents = agents.filter((a: any) => a.is_active).length;
        const totalExec = agents.reduce((sum: number, a: any) => sum + (a.total_executions || 0), 0);
        const successExec = agents.filter((a: any) => a.last_execution_status === 'success').length;

        const comp = companyRes.data;
        const socialUrls = comp ? [comp.facebook_url, comp.twitter_url, comp.linkedin_url, comp.instagram_url, comp.youtube_url, comp.tiktok_url] : [];
        const connectedChannels = socialUrls.filter(Boolean).length;

        setOperational({
          activeAgents,
          totalExecutions: totalExec,
          successfulExecutions: successExec,
          connectedChannels,
          priorityChannelsConnected: Math.min(connectedChannels, 3),
          hasBrandIdentity: !!comp?.logo_url,
          hasProducts: !!(productsRes.data && productsRes.data.length > 0),
          hasAudiences: !!(audiencesRes.data && audiencesRes.data.length > 0),
        });
      } catch (err) {
        console.error('Error fetching strategic control data:', err);
      } finally {
        setIsLoadingDiagnostic(false);
      }
    };

    fetchAll();
  }, [companyId]);

  return { diagnostic, operational, isLoadingDiagnostic };
}

// ─── Priority Generation ───

export function generateIntegratedPriorities(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  t: any
): StrategicPriority[] {
  const priorities: StrategicPriority[] = [];
  const scores = diagnostic?.executiveDiagnosis?.scores;

  // ── From Diagnostic: gaps converted to priorities ──
  if (scores) {
    if (scores.visibility < 40) {
      priorities.push({
        id: 'diag-visibility',
        title: t('journey.scc.p.lowVisibility', 'Visibilidad digital crítica'),
        description: t('journey.scc.p.lowVisibilityDesc', 'Tu score de visibilidad es {{score}}/100. Necesitas mejorar SEO y presencia en canales.', { score: scores.visibility }),
        urgency: 'critical',
        impactPoints: 20,
        source: 'diagnostic',
        variable: 'visibility',
        actionView: 'adn-empresa',
      });
    } else if (scores.visibility < 60) {
      priorities.push({
        id: 'diag-visibility-med',
        title: t('journey.scc.p.medVisibility', 'Mejorar visibilidad digital'),
        description: t('journey.scc.p.medVisibilityDesc', 'Score: {{score}}/100. Hay margen para mejorar el alcance orgánico.', { score: scores.visibility }),
        urgency: 'medium',
        impactPoints: 12,
        source: 'diagnostic',
        variable: 'visibility',
        actionView: 'marketing-hub',
      });
    }

    if (scores.trust < 40) {
      priorities.push({
        id: 'diag-trust',
        title: t('journey.scc.p.lowTrust', 'Confianza digital insuficiente'),
        description: t('journey.scc.p.lowTrustDesc', 'Score: {{score}}/100. Faltan señales de credibilidad (testimonios, certificaciones, casos).', { score: scores.trust }),
        urgency: 'critical',
        impactPoints: 18,
        source: 'diagnostic',
        variable: 'trust',
        actionView: 'adn-empresa',
      });
    } else if (scores.trust < 60) {
      priorities.push({
        id: 'diag-trust-med',
        title: t('journey.scc.p.medTrust', 'Fortalecer confianza online'),
        description: t('journey.scc.p.medTrustDesc', 'Score: {{score}}/100. Agrega pruebas sociales y mejora la identidad de marca.', { score: scores.trust }),
        urgency: 'medium',
        impactPoints: 10,
        source: 'diagnostic',
        variable: 'trust',
        actionView: 'adn-empresa',
      });
    }

    if (scores.positioning < 40) {
      priorities.push({
        id: 'diag-positioning',
        title: t('journey.scc.p.lowPositioning', 'Posicionamiento competitivo débil'),
        description: t('journey.scc.p.lowPositioningDesc', 'Score: {{score}}/100. Tu diferenciación no es clara para el mercado.', { score: scores.positioning }),
        urgency: 'critical',
        impactPoints: 20,
        source: 'diagnostic',
        variable: 'positioning',
        actionView: 'adn-empresa',
      });
    }
  }

  // From Diagnostic: key risks → priorities
  if (diagnostic?.keyRisks?.length) {
    diagnostic.keyRisks.slice(0, 2).forEach((risk, i) => {
      priorities.push({
        id: `diag-risk-${i}`,
        title: t('journey.scc.p.detectedRisk', 'Riesgo detectado'),
        description: risk,
        urgency: 'high',
        impactPoints: 10,
        source: 'diagnostic',
        variable: 'authority',
        actionView: 'adn-empresa',
      });
    });
  }

  // From Diagnostic: missing items → priorities
  if (diagnostic?.whatIsMissing?.length) {
    diagnostic.whatIsMissing.slice(0, 2).forEach((gap, i) => {
      priorities.push({
        id: `diag-gap-${i}`,
        title: t('journey.scc.p.detectedGap', 'Brecha operativa'),
        description: gap,
        urgency: 'high',
        impactPoints: 8,
        source: 'diagnostic',
        variable: 'offer',
        actionView: 'negocio',
      });
    });
  }

  // ── From Strategic DNA: completeness gaps ──
  if (!strategy?.winningAspiration || strategy.winningAspiration.length < 20) {
    priorities.push({
      id: 'dna-mission',
      title: t('journey.scc.p.dnaMission', 'Definir misión estratégica'),
      description: t('journey.scc.p.dnaMissionDesc', 'Sin una misión clara, los agentes no pueden alinear el contenido con tu propósito.'),
      urgency: 'high',
      impactPoints: 15,
      source: 'dna',
      variable: 'positioning',
      actionView: 'adn-empresa',
    });
  }

  if (!strategy?.targetSegments?.length) {
    priorities.push({
      id: 'dna-audience',
      title: t('journey.scc.p.dnaAudience', 'Definir audiencia objetivo'),
      description: t('journey.scc.p.dnaAudienceDesc', 'Los agentes necesitan un ICP claro para personalizar mensajes y campañas.'),
      urgency: 'high',
      impactPoints: 15,
      source: 'dna',
      variable: 'audience',
      actionView: 'negocio',
    });
  }

  if (!strategy?.competitiveAdvantage || strategy.competitiveAdvantage.length < 20) {
    priorities.push({
      id: 'dna-advantage',
      title: t('journey.scc.p.dnaAdvantage', 'Articular ventaja competitiva'),
      description: t('journey.scc.p.dnaAdvantageDesc', 'Define qué te hace único para que el sistema diferencie tu comunicación.'),
      urgency: 'medium',
      impactPoints: 12,
      source: 'dna',
      variable: 'positioning',
      actionView: 'adn-empresa',
    });
  }

  // DNA: brand identity
  priorities.push({
    id: 'dna-brand',
    title: t('journey.scc.p.dnaBrand', 'Completar identidad de marca'),
    description: t('journey.scc.p.dnaBrandDesc', 'Voz, tono visual y paleta son necesarios para contenido coherente.'),
    urgency: 'medium',
    impactPoints: 10,
    source: 'dna',
    variable: 'brand',
    actionView: 'adn-empresa',
  });

  // DNA: channels
  priorities.push({
    id: 'dna-channels',
    title: t('journey.scc.p.dnaChannels', 'Conectar canales digitales'),
    description: t('journey.scc.p.dnaChannelsDesc', 'Sin canales conectados, el Autopilot no puede publicar ni analizar rendimiento.'),
    urgency: 'high',
    impactPoints: 20,
    source: 'dna',
    variable: 'channel',
    actionView: 'marketing-hub',
  });

  // Sort: critical first, then by impact
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return priorities.sort((a, b) => {
    const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    return diff !== 0 ? diff : b.impactPoints - a.impactPoints;
  });
}

// ─── Weekly Decisions ───

export function generateIntegratedDecisions(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  t: any
): WeeklyDecision[] {
  const decisions: WeeklyDecision[] = [];
  const scores = diagnostic?.executiveDiagnosis?.scores;

  // From diagnostic action plan
  if (diagnostic?.actionPlan?.length) {
    decisions.push({
      title: diagnostic.actionPlan[0],
      reason: t('journey.scc.d.actionPlanReason', 'Acción priorizada por el diagnóstico estratégico según su impacto en tu índice digital.'),
      action: t('journey.scc.d.reviewAction', 'Revisar plan'),
      actionView: 'adn-empresa',
      source: 'diagnostic',
      variable: 'authority',
    });
  }

  // From diagnostic: lowest score area
  if (scores) {
    const lowest = Object.entries(scores)
      .filter(([k]) => k !== 'overall')
      .sort(([,a], [,b]) => (a as number) - (b as number))[0];
    
    if (lowest) {
      const [area, score] = lowest;
      const variableMap: Record<string, StrategicVariable> = {
        visibility: 'visibility',
        trust: 'trust',
        positioning: 'positioning',
      };
      decisions.push({
        title: t(`journey.scc.d.improve_${area}`, `Mejorar ${area}`),
        reason: t('journey.scc.d.lowestScoreReason', 'Es tu área más débil ({{score}}/100). Mejorarlo tiene el mayor impacto en tu índice global.', { score }),
        action: t('journey.scc.d.takeAction', 'Tomar acción'),
        actionView: 'adn-empresa',
        source: 'diagnostic',
        variable: variableMap[area] || 'authority',
      });
    }
  }

  // From DNA
  if (strategy?.winningAspiration) {
    decisions.push({
      title: t('journey.scc.d.completeBrand', 'Completar identidad de marca'),
      reason: t('journey.scc.d.completeBrandReason', 'Tu misión está definida pero el sistema necesita tu identidad visual para generar contenido alineado.'),
      action: t('journey.scc.d.configureBrand', 'Configurar marca'),
      actionView: 'adn-empresa',
      source: 'dna',
      variable: 'brand',
    });
  }

  decisions.push({
    title: t('journey.scc.d.connectChannel', 'Conectar al menos 1 red social'),
    reason: t('journey.scc.d.connectChannelReason', 'Sin conexión a canales, el Autopilot no puede ejecutar. Esta acción desbloquea el 60% del sistema.'),
    action: t('journey.scc.d.connect', 'Conectar canal'),
    actionView: 'marketing-hub',
    source: 'dna',
    variable: 'channel',
  });

  return decisions.slice(0, 3);
}

// ─── Score Calculation (integrates diagnostic scores) ───

export function calculateIntegratedScore(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  operational: OperationalMaturity | null
): StrategicScores {
  const breakdown: StrategicScores['breakdown'] = [];

  // ═══ 1. STRATEGIC FOUNDATION (max 30) ═══
  // Mission + audience + advantage + moat + timeline
  const mission = strategy?.winningAspiration && strategy.winningAspiration.length >= 20 ? 8 : 0;
  const target = strategy?.targetSegments?.length ? 7 : 0;
  const advantage = strategy?.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20 ? 7 : 0;
  const moat = strategy?.moatType ? 4 : 0;
  const timeline = strategy?.aspirationTimeline ? 4 : 0;

  breakdown.push({ label: 'Misión Estratégica', value: mission, max: 8, category: 'foundation' });
  breakdown.push({ label: 'Audiencia Definida', value: target, max: 7, category: 'foundation' });
  breakdown.push({ label: 'Ventaja Competitiva', value: advantage, max: 7, category: 'foundation' });
  breakdown.push({ label: 'Moat Estratégico', value: moat, max: 4, category: 'foundation' });
  breakdown.push({ label: 'Horizonte Temporal', value: timeline, max: 4, category: 'foundation' });

  const foundationTotal = mission + target + advantage + moat + timeline;

  // ═══ 2. DIGITAL PRESENCE (max 25) ═══
  // Diagnostic scores (visibility, trust, positioning)
  const scores = diagnostic?.executiveDiagnosis?.scores;
  let visVal = 0, trustVal = 0, posVal = 0;
  if (scores) {
    visVal = Math.round((scores.visibility / 100) * 9);
    trustVal = Math.round((scores.trust / 100) * 8);
    posVal = Math.round((scores.positioning / 100) * 8);
  }
  breakdown.push({ label: 'Visibilidad Digital', value: visVal, max: 9, category: 'presence' });
  breakdown.push({ label: 'Confianza Online', value: trustVal, max: 8, category: 'presence' });
  breakdown.push({ label: 'Posicionamiento (Diag)', value: posVal, max: 8, category: 'presence' });

  const presenceTotal = visVal + trustVal + posVal;

  // ═══ 3. OPERATIONAL EXECUTION (max 25) ═══
  // Agents active, executions, channels connected, brand, products, audiences
  const agentsScore = operational
    ? Math.min(6, operational.activeAgents * 2)
    : 0;
  const execScore = operational
    ? Math.min(5, Math.floor(operational.totalExecutions / 5))
    : 0;
  const channelsScore = operational
    ? Math.min(6, operational.connectedChannels * 2)
    : 0;
  const brandScore = operational?.hasBrandIdentity ? 3 : 0;
  const productsScore = operational?.hasProducts ? 3 : 0;
  const audiencesScore = operational?.hasAudiences ? 2 : 0;

  breakdown.push({ label: 'Agentes Activos', value: agentsScore, max: 6, category: 'execution' });
  breakdown.push({ label: 'Ejecuciones Realizadas', value: execScore, max: 5, category: 'execution' });
  breakdown.push({ label: 'Canales Conectados', value: channelsScore, max: 6, category: 'execution' });
  breakdown.push({ label: 'Identidad de Marca', value: brandScore, max: 3, category: 'execution' });
  breakdown.push({ label: 'Productos Definidos', value: productsScore, max: 3, category: 'execution' });
  breakdown.push({ label: 'Audiencias Configuradas', value: audiencesScore, max: 2, category: 'execution' });

  const executionTotal = agentsScore + execScore + channelsScore + brandScore + productsScore + audiencesScore;

  // ═══ 4. GAP REDUCTION (max 20) ═══
  // Rewards for reducing critical gaps and risks
  const missingCount = diagnostic?.whatIsMissing?.length || 0;
  const risksCount = diagnostic?.keyRisks?.length || 0;
  const actionPlanCount = diagnostic?.actionPlan?.length || 0;

  // Fewer gaps = higher score (inverse)
  const gapReduction = missingCount === 0 ? 8 : missingCount <= 2 ? 5 : missingCount <= 4 ? 2 : 0;
  const riskReduction = risksCount === 0 ? 7 : risksCount <= 1 ? 4 : risksCount <= 3 ? 2 : 0;
  // Having action plans means diagnostic was done (base credit)
  const planCredit = actionPlanCount > 0 ? 5 : 0;

  breakdown.push({ label: 'Brechas Resueltas', value: gapReduction, max: 8, category: 'gaps' });
  breakdown.push({ label: 'Riesgos Mitigados', value: riskReduction, max: 7, category: 'gaps' });
  breakdown.push({ label: 'Plan Estratégico Activo', value: planCredit, max: 5, category: 'gaps' });

  const gapsTotal = gapReduction + riskReduction + planCredit;

  // ═══ TOTAL ═══
  const current = foundationTotal + presenceTotal + executionTotal + gapsTotal;

  // Projected: estimate if top 3 priorities were resolved
  const projectedGain = Math.min(20, (missingCount > 0 ? 6 : 0) + (risksCount > 0 ? 5 : 0) + (!strategy?.winningAspiration ? 8 : 0) + (channelsScore < 6 ? 4 : 0));
  const projected = Math.min(100, current + projectedGain);

  return {
    current,
    projected,
    breakdown,
    categoryTotals: {
      foundation: foundationTotal,
      presence: presenceTotal,
      execution: executionTotal,
      gaps: gapsTotal,
    },
  };
}
