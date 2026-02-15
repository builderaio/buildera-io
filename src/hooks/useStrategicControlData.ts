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
  breakdown: { label: string; value: number; max: number }[];
}

// ─── Hook ───

export function useStrategicControlData(companyId: string | undefined) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticPresence | null>(null);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    
    const fetch = async () => {
      setIsLoadingDiagnostic(true);
      try {
        const { data } = await supabase
          .from('company_digital_presence')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data) {
          const exec = data.executive_diagnosis as any;
          setDiagnostic({
            digitalFootprintSummary: data.digital_footprint_summary,
            whatIsWorking: Array.isArray(data.what_is_working) ? data.what_is_working as string[] : [],
            whatIsMissing: Array.isArray(data.what_is_missing) ? data.what_is_missing as string[] : [],
            keyRisks: Array.isArray(data.key_risks) ? data.key_risks as string[] : [],
            competitivePositioning: data.competitive_positioning,
            actionPlan: Array.isArray(data.action_plan) ? data.action_plan as string[] : [],
            executiveDiagnosis: exec ? {
              scores: exec.scores || null,
              sdiLevel: exec.sdi_level || exec.sdiLevel || null,
              highestLeverageFocus: exec.highest_leverage_focus || null,
              revenueAtRisk: exec.revenue_at_risk || null,
              archetype: exec.archetype || null,
            } : null,
          });
        }
      } catch (err) {
        console.error('Error fetching diagnostic for SCC:', err);
      } finally {
        setIsLoadingDiagnostic(false);
      }
    };

    fetch();
  }, [companyId]);

  return { diagnostic, isLoadingDiagnostic };
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
  diagnostic: DiagnosticPresence | null
): StrategicScores {
  const breakdown: { label: string; value: number; max: number }[] = [];
  let current = 0;

  // DNA contribution (max 55)
  const missionScore = strategy?.winningAspiration && strategy.winningAspiration.length >= 20 ? 15 : 0;
  const targetScore = strategy?.targetSegments?.length ? 15 : 0;
  const advantageScore = strategy?.competitiveAdvantage && strategy.competitiveAdvantage.length >= 20 ? 15 : 0;
  const moatScore = strategy?.moatType ? 5 : 0;
  const timelineScore = strategy?.aspirationTimeline ? 5 : 0;

  breakdown.push({ label: 'Mission', value: missionScore, max: 15 });
  breakdown.push({ label: 'Target', value: targetScore, max: 15 });
  breakdown.push({ label: 'Advantage', value: advantageScore, max: 15 });
  breakdown.push({ label: 'Moat', value: moatScore, max: 5 });
  breakdown.push({ label: 'Timeline', value: timelineScore, max: 5 });

  current += missionScore + targetScore + advantageScore + moatScore + timelineScore;

  // Diagnostic contribution (max 45)
  const scores = diagnostic?.executiveDiagnosis?.scores;
  if (scores) {
    const visScore = Math.round((scores.visibility / 100) * 15);
    const trustScore = Math.round((scores.trust / 100) * 15);
    const posScore = Math.round((scores.positioning / 100) * 15);

    breakdown.push({ label: 'Visibility', value: visScore, max: 15 });
    breakdown.push({ label: 'Trust', value: trustScore, max: 15 });
    breakdown.push({ label: 'Positioning (Diag)', value: posScore, max: 15 });

    current += visScore + trustScore + posScore;
  } else {
    breakdown.push({ label: 'Visibility', value: 0, max: 15 });
    breakdown.push({ label: 'Trust', value: 0, max: 15 });
    breakdown.push({ label: 'Positioning (Diag)', value: 0, max: 15 });
  }

  const projected = Math.min(100, current + 20);

  return { current, projected, breakdown };
}
