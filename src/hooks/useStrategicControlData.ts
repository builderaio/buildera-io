import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlayToWinStrategy, BusinessModelType } from '@/types/playToWin';
import { getBusinessModelPriorityWeights } from '@/lib/businessModelContext';
import { startOfWeek, differenceInDays, endOfWeek, format } from 'date-fns';

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
  // Strategic narrative
  gapKey?: string;
  riskMitigated?: string;
  strategicImpact?: string;
}

export interface WeeklyDecision {
  id?: string;
  title: string;
  reason: string;
  action: string;
  actionView: string;
  source: PrioritySource;
  variable: StrategicVariable;
  decisionKey: string;
  completedAt?: string | null;
  gapKey?: string;
}

export interface StrategicGap {
  id: string;
  company_id: string;
  gap_key: string;
  title: string;
  description: string;
  variable: string;
  source: string;
  impact_weight: number;
  urgency: string;
  detected_at: string;
  resolved_at: string | null;
  resolved_by_action: string | null;
}

export interface StrategicProfile {
  archetype: string | null;
  sdiLevel: 'Emerging' | 'Building' | 'Competitive' | 'Reference';
  businessModel: BusinessModelType | null;
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

// ─── Helpers ───

function getCurrentWeekStart(): string {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

function getDaysRemainingInWeek(): number {
  const now = new Date();
  const sunday = endOfWeek(now, { weekStartsOn: 1 });
  return differenceInDays(sunday, now);
}

function deriveSdiLevel(score: number): StrategicProfile['sdiLevel'] {
  if (score >= 75) return 'Reference';
  if (score >= 55) return 'Competitive';
  if (score >= 35) return 'Building';
  return 'Emerging';
}

// ─── Hook ───

export function useStrategicControlData(companyId: string | undefined) {
  const [diagnostic, setDiagnostic] = useState<DiagnosticPresence | null>(null);
  const [operational, setOperational] = useState<OperationalMaturity | null>(null);
  const [strategicGaps, setStrategicGaps] = useState<StrategicGap[]>([]);
  const [weeklyDecisions, setWeeklyDecisions] = useState<WeeklyDecision[]>([]);
  const [isLoadingDiagnostic, setIsLoadingDiagnostic] = useState(true);
  const [strategicProfile, setStrategicProfile] = useState<StrategicProfile>({
    archetype: null,
    sdiLevel: 'Emerging',
    businessModel: null,
  });

  const weekStart = getCurrentWeekStart();
  const daysRemaining = getDaysRemainingInWeek();

  // ─── Fetch persistent gaps ───
  const fetchGaps = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('company_strategic_gaps')
      .select('*')
      .eq('company_id', companyId);
    if (data) setStrategicGaps(data as StrategicGap[]);
  }, [companyId]);

  // ─── Fetch persistent weekly decisions ───
  const fetchWeeklyDecisions = useCallback(async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('company_weekly_decisions')
      .select('*')
      .eq('company_id', companyId)
      .eq('week_start', weekStart);
    if (data && data.length > 0) {
      setWeeklyDecisions(data.map((d: any) => ({
        id: d.id,
        title: d.title,
        reason: d.reason,
        action: d.title,
        actionView: d.action_view || 'adn-empresa',
        source: d.source as PrioritySource,
        variable: d.variable as StrategicVariable,
        decisionKey: d.decision_key,
        completedAt: d.completed_at,
        gapKey: d.decision_key, // link to gap
      })));
    }
    return data;
  }, [companyId, weekStart]);

  useEffect(() => {
    if (!companyId) return;
    
    const fetchAll = async () => {
      setIsLoadingDiagnostic(true);
      try {
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

          // Update strategic profile
          if (exec) {
            const overallScore = exec.scores?.overall ?? 0;
            setStrategicProfile(prev => ({
              ...prev,
              archetype: exec.archetype || null,
              sdiLevel: deriveSdiLevel(overallScore),
            }));
          }
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

        // Fetch persistent data
        await Promise.all([fetchGaps(), fetchWeeklyDecisions()]);
      } catch (err) {
        console.error('Error fetching strategic control data:', err);
      } finally {
        setIsLoadingDiagnostic(false);
      }
    };

    fetchAll();
  }, [companyId, fetchGaps, fetchWeeklyDecisions]);

  // ─── Sync strategic gaps to DB ───
  const syncStrategicGaps = useCallback(async (generatedPriorities: StrategicPriority[]) => {
    if (!companyId) return;
    
    const existingKeys = new Set(strategicGaps.map(g => g.gap_key));
    const currentKeys = new Set(generatedPriorities.map(p => p.id));

    // Insert new gaps
    const newGaps = generatedPriorities
      .filter(p => !existingKeys.has(p.id))
      .map(p => ({
        company_id: companyId,
        gap_key: p.id,
        title: p.title,
        description: p.description,
        variable: p.variable,
        source: p.source,
        impact_weight: p.impactPoints,
        urgency: p.urgency,
      }));

    if (newGaps.length > 0) {
      await supabase.from('company_strategic_gaps').upsert(newGaps, { onConflict: 'company_id,gap_key' });
    }

    // Resolve gaps that no longer apply
    const resolvedKeys = strategicGaps
      .filter(g => !currentKeys.has(g.gap_key) && !g.resolved_at)
      .map(g => g.gap_key);

    if (resolvedKeys.length > 0) {
      await supabase
        .from('company_strategic_gaps')
        .update({ resolved_at: new Date().toISOString(), resolved_by_action: 'auto-resolved' })
        .eq('company_id', companyId)
        .in('gap_key', resolvedKeys);
    }

    await fetchGaps();
  }, [companyId, strategicGaps, fetchGaps]);

  // ─── Resolve a specific gap ───
  const resolveGap = useCallback(async (gapKey: string) => {
    if (!companyId) return;
    await supabase
      .from('company_strategic_gaps')
      .update({ resolved_at: new Date().toISOString(), resolved_by_action: 'user-completed' })
      .eq('company_id', companyId)
      .eq('gap_key', gapKey);
    await fetchGaps();
  }, [companyId, fetchGaps]);

  // ─── Complete a weekly decision ───
  const completeDecision = useCallback(async (decisionId: string, gapKey?: string) => {
    if (!decisionId) return;
    await supabase
      .from('company_weekly_decisions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', decisionId);

    // If linked to a gap, resolve it
    if (gapKey) {
      await resolveGap(gapKey);
    }

    await fetchWeeklyDecisions();
  }, [resolveGap, fetchWeeklyDecisions]);

  // ─── Create weekly decisions if none exist ───
  const createWeeklyDecisions = useCallback(async (
    strategy: PlayToWinStrategy | null,
    diagnostic: DiagnosticPresence | null,
    businessModel: BusinessModelType | null,
    t: any
  ) => {
    if (!companyId) return;
    
    // Check if already exist
    const existing = await fetchWeeklyDecisions();
    if (existing && existing.length > 0) return;

    // Generate from gaps, scores, and business model
    const decisions = generateDynamicWeeklyDecisions(strategy, diagnostic, strategicGaps, businessModel, t);
    
    const records = decisions.slice(0, 3).map(d => ({
      company_id: companyId,
      week_start: weekStart,
      decision_key: d.decisionKey,
      title: d.title,
      reason: d.reason,
      action_view: d.actionView,
      variable: d.variable,
      source: d.source,
    }));

    if (records.length > 0) {
      await supabase.from('company_weekly_decisions').upsert(records, { onConflict: 'company_id,week_start,decision_key' });
      await fetchWeeklyDecisions();
    }
  }, [companyId, weekStart, strategicGaps, fetchWeeklyDecisions]);

  // Update business model in profile
  const updateBusinessModel = useCallback((model: BusinessModelType | null) => {
    setStrategicProfile(prev => ({ ...prev, businessModel: model }));
  }, []);

  return {
    diagnostic,
    operational,
    isLoadingDiagnostic,
    strategicProfile,
    strategicGaps,
    weeklyDecisions,
    weekStart,
    daysRemaining,
    syncStrategicGaps,
    resolveGap,
    completeDecision,
    createWeeklyDecisions,
    updateBusinessModel,
    refetchGaps: fetchGaps,
  };
}

// ─── Dynamic Weekly Decision Generation ───

function generateDynamicWeeklyDecisions(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  gaps: StrategicGap[],
  businessModel: BusinessModelType | null,
  t: any
): WeeklyDecision[] {
  const decisions: WeeklyDecision[] = [];
  const scores = diagnostic?.executiveDiagnosis?.scores;

  // (a) Most critical active gap
  const activeGaps = gaps.filter(g => !g.resolved_at).sort((a, b) => {
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const diff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
    return diff !== 0 ? diff : b.impact_weight - a.impact_weight;
  });

  if (activeGaps[0]) {
    decisions.push({
      title: activeGaps[0].title,
      reason: t('journey.scc.d.criticalGapReason', 'Es tu brecha más crítica activa. Resolverla impacta +{{pts}} pts en tu índice estratégico.', { pts: activeGaps[0].impact_weight }),
      action: t('journey.scc.d.resolveGap', 'Resolver brecha'),
      actionView: 'adn-empresa',
      source: activeGaps[0].source as PrioritySource,
      variable: activeGaps[0].variable as StrategicVariable,
      decisionKey: `gap-${activeGaps[0].gap_key}`,
      gapKey: activeGaps[0].gap_key,
    });
  }

  // (b) Lowest score area
  if (scores) {
    const lowest = Object.entries(scores)
      .filter(([k]) => k !== 'overall')
      .sort(([, a], [, b]) => (a as number) - (b as number))[0];
    
    if (lowest) {
      const [area, score] = lowest;
      const variableMap: Record<string, StrategicVariable> = {
        visibility: 'visibility', trust: 'trust', positioning: 'positioning',
      };
      decisions.push({
        title: t(`journey.scc.d.improve_${area}`, `Mejorar ${area}`),
        reason: t('journey.scc.d.lowestScoreReason', 'Es tu área más débil ({{score}}/100). Mejorarlo tiene el mayor impacto en tu índice global.', { score }),
        action: t('journey.scc.d.takeAction', 'Tomar acción'),
        actionView: 'adn-empresa',
        source: 'diagnostic',
        variable: variableMap[area] || 'authority',
        decisionKey: `score-${area}`,
      });
    }
  }

  // (c) Business model specific
  const weights = getBusinessModelPriorityWeights(businessModel);
  const topWeightVar = Object.entries(weights).sort(([, a], [, b]) => b - a)[0]?.[0];
  
  if (topWeightVar && decisions.length < 3) {
    const labelMap: Record<string, string> = {
      authority: t('journey.scc.d.buildAuthority', 'Construir autoridad experta'),
      brand: t('journey.scc.d.buildBrand', 'Fortalecer marca'),
      channel: t('journey.scc.d.optimizeChannels', 'Optimizar canales'),
      visibility: t('journey.scc.d.boostVisibility', 'Aumentar visibilidad'),
      positioning: t('journey.scc.d.strengthenPositioning', 'Reforzar posicionamiento'),
      trust: t('journey.scc.d.buildTrust', 'Construir confianza'),
      offer: t('journey.scc.d.refineOffer', 'Refinar oferta'),
    };
    decisions.push({
      title: labelMap[topWeightVar] || t('journey.scc.d.modelAction', 'Acción según modelo'),
      reason: t('journey.scc.d.modelReason', 'Prioridad derivada de tu modelo de negocio ({{model}}). Esta variable tiene el mayor peso estratégico para tu tipo de empresa.', { model: businessModel || 'mixto' }),
      action: t('journey.scc.d.execute', 'Ejecutar'),
      actionView: 'adn-empresa',
      source: 'dna',
      variable: topWeightVar as StrategicVariable,
      decisionKey: `model-${topWeightVar}`,
    });
  }

  // Fallback: diagnostic action plan
  if (decisions.length < 3 && diagnostic?.actionPlan?.length) {
    diagnostic.actionPlan.slice(0, 3 - decisions.length).forEach((action, i) => {
      decisions.push({
        title: action,
        reason: t('journey.scc.d.actionPlanReason', 'Acción priorizada por el diagnóstico estratégico según su impacto en tu índice digital.'),
        action: t('journey.scc.d.reviewAction', 'Revisar plan'),
        actionView: 'adn-empresa',
        source: 'diagnostic',
        variable: 'authority',
        decisionKey: `plan-${i}`,
      });
    });
  }

  return decisions.slice(0, 3);
}

// ─── Priority Generation (with narrative + business model weights) ───

export function generateIntegratedPriorities(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  t: any,
  businessModel?: BusinessModelType | null,
  resolvedGapKeys?: Set<string>
): StrategicPriority[] {
  const priorities: StrategicPriority[] = [];
  const scores = diagnostic?.executiveDiagnosis?.scores;
  const resolved = resolvedGapKeys || new Set<string>();

  // ── From Diagnostic: gaps converted to priorities ──
  if (scores) {
    if (scores.visibility < 40 && !resolved.has('diag-visibility')) {
      priorities.push({
        id: 'diag-visibility',
        title: t('journey.scc.p.lowVisibility', 'Visibilidad digital crítica'),
        description: t('journey.scc.p.lowVisibilityDesc', 'Tu score de visibilidad es {{score}}/100. Necesitas mejorar SEO y presencia en canales.', { score: scores.visibility }),
        urgency: 'critical',
        impactPoints: 20,
        source: 'diagnostic',
        variable: 'visibility',
        actionView: 'adn-empresa',
        gapKey: 'diag-visibility',
        riskMitigated: t('journey.scc.narrative.visibilityRisk', 'Invisibilidad digital impide captar leads orgánicos'),
        strategicImpact: t('journey.scc.narrative.visibilityImpact', 'Resolver esta brecha proyecta +20 pts en el SDI'),
      });
    } else if (scores.visibility < 60 && !resolved.has('diag-visibility-med')) {
      priorities.push({
        id: 'diag-visibility-med',
        title: t('journey.scc.p.medVisibility', 'Mejorar visibilidad digital'),
        description: t('journey.scc.p.medVisibilityDesc', 'Score: {{score}}/100. Hay margen para mejorar el alcance orgánico.', { score: scores.visibility }),
        urgency: 'medium',
        impactPoints: 12,
        source: 'diagnostic',
        variable: 'visibility',
        actionView: 'marketing-hub',
        gapKey: 'diag-visibility-med',
        riskMitigated: t('journey.scc.narrative.medVisRisk', 'Crecimiento orgánico estancado'),
        strategicImpact: t('journey.scc.narrative.medVisImpact', 'Proyección: +12 pts SDI'),
      });
    }

    if (scores.trust < 40 && !resolved.has('diag-trust')) {
      priorities.push({
        id: 'diag-trust',
        title: t('journey.scc.p.lowTrust', 'Confianza digital insuficiente'),
        description: t('journey.scc.p.lowTrustDesc', 'Score: {{score}}/100. Faltan señales de credibilidad (testimonios, certificaciones, casos).', { score: scores.trust }),
        urgency: 'critical',
        impactPoints: 18,
        source: 'diagnostic',
        variable: 'trust',
        actionView: 'adn-empresa',
        gapKey: 'diag-trust',
        riskMitigated: t('journey.scc.narrative.trustRisk', 'Baja conversión por falta de credibilidad'),
        strategicImpact: t('journey.scc.narrative.trustImpact', 'Proyección: +18 pts SDI'),
      });
    } else if (scores.trust < 60 && !resolved.has('diag-trust-med')) {
      priorities.push({
        id: 'diag-trust-med',
        title: t('journey.scc.p.medTrust', 'Fortalecer confianza online'),
        description: t('journey.scc.p.medTrustDesc', 'Score: {{score}}/100. Agrega pruebas sociales y mejora la identidad de marca.', { score: scores.trust }),
        urgency: 'medium',
        impactPoints: 10,
        source: 'diagnostic',
        variable: 'trust',
        actionView: 'adn-empresa',
        gapKey: 'diag-trust-med',
        riskMitigated: t('journey.scc.narrative.medTrustRisk', 'Competidores capturan confianza del mercado'),
        strategicImpact: t('journey.scc.narrative.medTrustImpact', 'Proyección: +10 pts SDI'),
      });
    }

    if (scores.positioning < 40 && !resolved.has('diag-positioning')) {
      priorities.push({
        id: 'diag-positioning',
        title: t('journey.scc.p.lowPositioning', 'Posicionamiento competitivo débil'),
        description: t('journey.scc.p.lowPositioningDesc', 'Score: {{score}}/100. Tu diferenciación no es clara para el mercado.', { score: scores.positioning }),
        urgency: 'critical',
        impactPoints: 20,
        source: 'diagnostic',
        variable: 'positioning',
        actionView: 'adn-empresa',
        gapKey: 'diag-positioning',
        riskMitigated: t('journey.scc.narrative.posRisk', 'Commoditización y guerra de precios'),
        strategicImpact: t('journey.scc.narrative.posImpact', 'Proyección: +20 pts SDI'),
      });
    }
  }

  // From Diagnostic: key risks
  if (diagnostic?.keyRisks?.length) {
    diagnostic.keyRisks.slice(0, 2).forEach((risk, i) => {
      const key = `diag-risk-${i}`;
      if (!resolved.has(key)) {
        priorities.push({
          id: key,
          title: t('journey.scc.p.detectedRisk', 'Riesgo detectado'),
          description: risk,
          urgency: 'high',
          impactPoints: 10,
          source: 'diagnostic',
          variable: 'authority',
          actionView: 'adn-empresa',
          gapKey: key,
          riskMitigated: risk,
          strategicImpact: t('journey.scc.narrative.riskImpact', 'Mitigar este riesgo protege tu posición de mercado'),
        });
      }
    });
  }

  // From Diagnostic: missing items
  if (diagnostic?.whatIsMissing?.length) {
    diagnostic.whatIsMissing.slice(0, 2).forEach((gap, i) => {
      const key = `diag-gap-${i}`;
      if (!resolved.has(key)) {
        priorities.push({
          id: key,
          title: t('journey.scc.p.detectedGap', 'Brecha operativa'),
          description: gap,
          urgency: 'high',
          impactPoints: 8,
          source: 'diagnostic',
          variable: 'offer',
          actionView: 'negocio',
          gapKey: key,
          riskMitigated: t('journey.scc.narrative.gapRisk', 'Brecha operativa limita escalabilidad'),
          strategicImpact: t('journey.scc.narrative.gapImpact', 'Proyección: +8 pts SDI'),
        });
      }
    });
  }

  // ── From Strategic DNA: completeness gaps ──
  if ((!strategy?.winningAspiration || strategy.winningAspiration.length < 20) && !resolved.has('dna-mission')) {
    priorities.push({
      id: 'dna-mission',
      title: t('journey.scc.p.dnaMission', 'Definir misión estratégica'),
      description: t('journey.scc.p.dnaMissionDesc', 'Sin una misión clara, los agentes no pueden alinear el contenido con tu propósito.'),
      urgency: 'high',
      impactPoints: 15,
      source: 'dna',
      variable: 'positioning',
      actionView: 'adn-empresa',
      gapKey: 'dna-mission',
      riskMitigated: t('journey.scc.narrative.missionRisk', 'Sin dirección estratégica el contenido es genérico'),
      strategicImpact: t('journey.scc.narrative.missionImpact', 'Proyección: +15 pts SDI'),
    });
  }

  if ((!strategy?.targetSegments?.length) && !resolved.has('dna-audience')) {
    priorities.push({
      id: 'dna-audience',
      title: t('journey.scc.p.dnaAudience', 'Definir audiencia objetivo'),
      description: t('journey.scc.p.dnaAudienceDesc', 'Los agentes necesitan un ICP claro para personalizar mensajes y campañas.'),
      urgency: 'high',
      impactPoints: 15,
      source: 'dna',
      variable: 'audience',
      actionView: 'negocio',
      gapKey: 'dna-audience',
      riskMitigated: t('journey.scc.narrative.audienceRisk', 'Mensajes genéricos reducen tasa de conversión'),
      strategicImpact: t('journey.scc.narrative.audienceImpact', 'Proyección: +15 pts SDI'),
    });
  }

  if ((!strategy?.competitiveAdvantage || strategy.competitiveAdvantage.length < 20) && !resolved.has('dna-advantage')) {
    priorities.push({
      id: 'dna-advantage',
      title: t('journey.scc.p.dnaAdvantage', 'Articular ventaja competitiva'),
      description: t('journey.scc.p.dnaAdvantageDesc', 'Define qué te hace único para que el sistema diferencie tu comunicación.'),
      urgency: 'medium',
      impactPoints: 12,
      source: 'dna',
      variable: 'positioning',
      actionView: 'adn-empresa',
      gapKey: 'dna-advantage',
      riskMitigated: t('journey.scc.narrative.advantageRisk', 'Sin diferenciación clara compites por precio'),
      strategicImpact: t('journey.scc.narrative.advantageImpact', 'Proyección: +12 pts SDI'),
    });
  }

  if (!resolved.has('dna-brand')) {
    priorities.push({
      id: 'dna-brand',
      title: t('journey.scc.p.dnaBrand', 'Completar identidad de marca'),
      description: t('journey.scc.p.dnaBrandDesc', 'Voz, tono visual y paleta son necesarios para contenido coherente.'),
      urgency: 'medium',
      impactPoints: 10,
      source: 'dna',
      variable: 'brand',
      actionView: 'adn-empresa',
      gapKey: 'dna-brand',
      riskMitigated: t('journey.scc.narrative.brandRisk', 'Inconsistencia de marca debilita reconocimiento'),
      strategicImpact: t('journey.scc.narrative.brandImpact', 'Proyección: +10 pts SDI'),
    });
  }

  if (!resolved.has('dna-channels')) {
    priorities.push({
      id: 'dna-channels',
      title: t('journey.scc.p.dnaChannels', 'Conectar canales digitales'),
      description: t('journey.scc.p.dnaChannelsDesc', 'Sin canales conectados, el Autopilot no puede publicar ni analizar rendimiento.'),
      urgency: 'high',
      impactPoints: 20,
      source: 'dna',
      variable: 'channel',
      actionView: 'marketing-hub',
      gapKey: 'dna-channels',
      riskMitigated: t('journey.scc.narrative.channelRisk', 'Sin canales, la automatización queda bloqueada'),
      strategicImpact: t('journey.scc.narrative.channelImpact', 'Proyección: +20 pts SDI'),
    });
  }

  // Sort: urgency first, then weighted by business model
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const weights = getBusinessModelPriorityWeights(businessModel || null);

  return priorities.sort((a, b) => {
    const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    if (urgDiff !== 0) return urgDiff;
    const weightA = weights[a.variable] || 1;
    const weightB = weights[b.variable] || 1;
    return (b.impactPoints * weightB) - (a.impactPoints * weightA);
  });
}

// ─── Score Calculation (integrates persistent gap tracking) ───

export function calculateIntegratedScore(
  strategy: PlayToWinStrategy | null,
  diagnostic: DiagnosticPresence | null,
  operational: OperationalMaturity | null,
  gaps?: StrategicGap[]
): StrategicScores {
  const breakdown: StrategicScores['breakdown'] = [];

  // ═══ 1. STRATEGIC FOUNDATION (max 30) ═══
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
  const agentsScore = operational ? Math.min(6, operational.activeAgents * 2) : 0;
  const execScore = operational ? Math.min(5, Math.floor(operational.totalExecutions / 5)) : 0;
  const channelsScore = operational ? Math.min(6, operational.connectedChannels * 2) : 0;
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

  // ═══ 4. GAP REDUCTION (max 20) — now uses persistent gaps ═══
  let gapReduction = 0;
  let riskReduction = 0;
  let planCredit = 0;

  if (gaps && gaps.length > 0) {
    const totalGaps = gaps.length;
    const resolvedGaps = gaps.filter(g => g.resolved_at).length;
    const resolutionRate = totalGaps > 0 ? resolvedGaps / totalGaps : 0;
    
    // Gap resolution score: up to 8 pts based on resolution rate
    gapReduction = Math.round(resolutionRate * 8);
    
    // Active critical gaps penalize, resolved ones reward
    const activeCritical = gaps.filter(g => !g.resolved_at && (g.urgency === 'critical' || g.urgency === 'high')).length;
    riskReduction = activeCritical === 0 ? 7 : activeCritical <= 1 ? 4 : activeCritical <= 3 ? 2 : 0;
    
    // Plan credit: having gaps tracked is itself progress
    planCredit = totalGaps > 0 ? 5 : 0;
  } else {
    // Fallback to original logic when no persistent gaps
    const missingCount = diagnostic?.whatIsMissing?.length || 0;
    const risksCount = diagnostic?.keyRisks?.length || 0;
    const actionPlanCount = diagnostic?.actionPlan?.length || 0;
    gapReduction = missingCount === 0 ? 8 : missingCount <= 2 ? 5 : missingCount <= 4 ? 2 : 0;
    riskReduction = risksCount === 0 ? 7 : risksCount <= 1 ? 4 : risksCount <= 3 ? 2 : 0;
    planCredit = actionPlanCount > 0 ? 5 : 0;
  }

  breakdown.push({ label: 'Brechas Resueltas', value: gapReduction, max: 8, category: 'gaps' });
  breakdown.push({ label: 'Riesgos Mitigados', value: riskReduction, max: 7, category: 'gaps' });
  breakdown.push({ label: 'Plan Estratégico Activo', value: planCredit, max: 5, category: 'gaps' });

  const gapsTotal = gapReduction + riskReduction + planCredit;

  // ═══ TOTAL ═══
  const current = foundationTotal + presenceTotal + executionTotal + gapsTotal;
  const projectedGain = Math.min(20,
    (gaps?.filter(g => !g.resolved_at).slice(0, 3).reduce((sum, g) => sum + Math.min(8, g.impact_weight), 0) || 0)
    + (!strategy?.winningAspiration ? 8 : 0)
    + (channelsScore < 6 ? 4 : 0)
  );
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
