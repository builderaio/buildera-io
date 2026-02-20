/**
 * Strategic State Engine (SSE)
 * 
 * Core architectural layer that maintains the living strategic state
 * of each company. Provides versioned snapshots, memory recording,
 * score history tracking, and self-recalibrating index logic.
 * 
 * This is proprietary logic — the competitive moat of Buildera.
 */

import { supabase } from '@/integrations/supabase/client';
import { StrategicGap, StrategicScores, StrategicProfile, OperationalMaturity, DiagnosticPresence } from '@/hooks/useStrategicControlData';
import { PlayToWinStrategy, BusinessModelType } from '@/types/playToWin';

// ─── Types ───

export type MaturityStage = 'early' | 'growth' | 'consolidated' | 'scale';

export interface StrategicStateSnapshot {
  id: string;
  company_id: string;
  version: number;
  maturity_stage: MaturityStage;
  business_model: string | null;
  strategic_dna_snapshot: Record<string, any>;
  active_gaps: any[];
  resolved_gaps: any[];
  structural_risks: any[];
  capability_index: number;
  sdi_score: number;
  score_breakdown: Record<string, any>;
  trigger_reason: string;
  triggered_by: string | null;
  created_at: string;
}

export interface ScoreHistoryEntry {
  id: string;
  company_id: string;
  sdi_score: number;
  foundation_score: number;
  presence_score: number;
  execution_score: number;
  gaps_score: number;
  weight_adjustments: Record<string, number>;
  weeks_below_threshold: Record<string, number>;
  consistency_bonus: number;
  stagnation_penalty: number;
  recorded_at: string;
}

export interface StrategicMemoryEntry {
  id: string;
  company_id: string;
  decision_id: string | null;
  gap_id: string | null;
  action_type: string;
  action_key: string;
  action_description: string | null;
  sdi_before: number | null;
  sdi_after: number | null;
  sdi_delta: number;
  dimension_impacted: string | null;
  impact_magnitude: string | null;
  behavioral_pattern: string | null;
  maturity_stage_at_time: string | null;
  business_model_at_time: string | null;
  context_snapshot: Record<string, any>;
  created_at: string;
}

// ─── Maturity Stage Derivation ───

export function deriveMaturityStage(
  sdiScore: number,
  totalExecutions: number,
  resolvedGapsCount: number,
  activeGapsCount: number
): MaturityStage {
  const gapResolutionRate = (resolvedGapsCount + activeGapsCount) > 0
    ? resolvedGapsCount / (resolvedGapsCount + activeGapsCount)
    : 0;

  if (sdiScore >= 75 && totalExecutions >= 50 && gapResolutionRate >= 0.7) return 'scale';
  if (sdiScore >= 55 && totalExecutions >= 20 && gapResolutionRate >= 0.4) return 'consolidated';
  if (sdiScore >= 35 && totalExecutions >= 5) return 'growth';
  return 'early';
}

// ─── Capability Index ───
// Composite metric: how much of the platform is being used effectively

export function calculateCapabilityIndex(
  operational: OperationalMaturity | null,
  gaps: StrategicGap[],
  scores: StrategicScores
): number {
  if (!operational) return 0;

  const agentCapability = Math.min(25, operational.activeAgents * 5);
  const executionCapability = Math.min(25, Math.floor(operational.totalExecutions / 2));
  const channelCapability = Math.min(15, operational.connectedChannels * 5);
  const strategyCapability = Math.min(20, (scores.categoryTotals.foundation / 30) * 20);
  const gapMgmtCapability = gaps.length > 0
    ? Math.min(15, (gaps.filter(g => g.resolved_at).length / gaps.length) * 15)
    : 0;

  return Math.round(agentCapability + executionCapability + channelCapability + strategyCapability + gapMgmtCapability);
}

// ─── Self-Recalibrating Index ───

export interface RecalibrationResult {
  adjustedWeights: Record<string, number>;
  consistencyBonus: number;
  stagnationPenalty: number;
  weeksBelowThreshold: Record<string, number>;
}

export async function calculateRecalibration(
  companyId: string,
  currentScores: StrategicScores,
  maturityStage: MaturityStage
): Promise<RecalibrationResult> {
  // Fetch recent score history (last 8 weeks)
  const { data: history } = await supabase
    .from('company_score_history')
    .select('*')
    .eq('company_id', companyId)
    .order('recorded_at', { ascending: false })
    .limit(8);

  const entries = (history || []) as ScoreHistoryEntry[];

  // Base weights by maturity stage
  const baseWeights: Record<MaturityStage, Record<string, number>> = {
    early: { foundation: 1.3, presence: 1.0, execution: 0.8, gaps: 0.9 },
    growth: { foundation: 1.1, presence: 1.2, execution: 1.1, gaps: 1.0 },
    consolidated: { foundation: 0.9, presence: 1.1, execution: 1.3, gaps: 1.1 },
    scale: { foundation: 0.8, presence: 1.0, execution: 1.2, gaps: 1.3 },
  };

  const weights = { ...baseWeights[maturityStage] };

  // Track stagnation: weeks each dimension has been below threshold
  const threshold = 40;
  const weeksBelowThreshold: Record<string, number> = {
    foundation: 0, presence: 0, execution: 0, gaps: 0,
  };

  if (entries.length >= 2) {
    for (const entry of entries) {
      if (entry.foundation_score < threshold) weeksBelowThreshold.foundation++;
      if (entry.presence_score < threshold) weeksBelowThreshold.presence++;
      if (entry.execution_score < threshold) weeksBelowThreshold.execution++;
      if (entry.gaps_score < threshold) weeksBelowThreshold.gaps++;
    }
  }

  // Progressive penalty: if a dimension stagnates 3+ weeks, increase its weight (forces attention)
  let stagnationPenalty = 0;
  for (const [dim, weeks] of Object.entries(weeksBelowThreshold)) {
    if (weeks >= 4) {
      weights[dim] = (weights[dim] || 1) * 1.5;
      stagnationPenalty += 3;
    } else if (weeks >= 3) {
      weights[dim] = (weights[dim] || 1) * 1.25;
      stagnationPenalty += 1;
    }
  }

  // Consistency bonus: if all dimensions improved over last 4 entries
  let consistencyBonus = 0;
  if (entries.length >= 4) {
    const oldest = entries[entries.length - 1];
    const newest = entries[0];
    const allImproved = 
      newest.foundation_score >= oldest.foundation_score &&
      newest.presence_score >= oldest.presence_score &&
      newest.execution_score >= oldest.execution_score &&
      newest.gaps_score >= oldest.gaps_score;
    
    if (allImproved) consistencyBonus = 5;
  }

  return {
    adjustedWeights: weights,
    consistencyBonus,
    stagnationPenalty,
    weeksBelowThreshold,
  };
}

// ─── State Snapshot Creation ───

export async function createStrategicSnapshot(
  companyId: string,
  params: {
    maturityStage: MaturityStage;
    businessModel: string | null;
    dnaSnapshot: Record<string, any>;
    gaps: StrategicGap[];
    scores: StrategicScores;
    capabilityIndex: number;
    structuralRisks: string[];
    triggerReason: string;
    triggeredBy?: string;
  }
): Promise<StrategicStateSnapshot | null> {
  // Get next version
  const { data: versionData } = await supabase.rpc('next_strategic_state_version', {
    p_company_id: companyId,
  });

  const version = (versionData as number) || 1;

  const activeGaps = params.gaps.filter(g => !g.resolved_at);
  const resolvedGaps = params.gaps.filter(g => g.resolved_at);

  const { data, error } = await supabase
    .from('company_strategic_state_snapshots')
    .insert({
      company_id: companyId,
      version,
      maturity_stage: params.maturityStage,
      business_model: params.businessModel,
      strategic_dna_snapshot: params.dnaSnapshot,
      active_gaps: activeGaps.map(g => ({ key: g.gap_key, title: g.title, urgency: g.urgency, weight: g.impact_weight })),
      resolved_gaps: resolvedGaps.map(g => ({ key: g.gap_key, title: g.title, resolved_at: g.resolved_at })),
      structural_risks: params.structuralRisks,
      capability_index: params.capabilityIndex,
      sdi_score: params.scores.current,
      score_breakdown: params.scores.categoryTotals,
      trigger_reason: params.triggerReason,
      triggered_by: params.triggeredBy || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating strategic snapshot:', error);
    return null;
  }
  return data as StrategicStateSnapshot;
}

// ─── Score History Recording ───

export async function recordScoreHistory(
  companyId: string,
  scores: StrategicScores,
  recalibration: RecalibrationResult
): Promise<void> {
  await supabase.from('company_score_history').insert({
    company_id: companyId,
    sdi_score: scores.current,
    foundation_score: scores.categoryTotals.foundation,
    presence_score: scores.categoryTotals.presence,
    execution_score: scores.categoryTotals.execution,
    gaps_score: scores.categoryTotals.gaps,
    weight_adjustments: recalibration.adjustedWeights,
    weeks_below_threshold: recalibration.weeksBelowThreshold,
    consistency_bonus: recalibration.consistencyBonus,
    stagnation_penalty: recalibration.stagnationPenalty,
  });
}

// ─── Strategic Memory Recording ───

export async function recordStrategicMemory(
  companyId: string,
  params: {
    decisionId?: string;
    gapId?: string;
    actionType: string;
    actionKey: string;
    actionDescription?: string;
    sdiBefore: number;
    sdiAfter: number;
    dimensionImpacted?: string;
    maturityStage?: string;
    businessModel?: string;
    contextSnapshot?: Record<string, any>;
  }
): Promise<void> {
  const delta = params.sdiAfter - params.sdiBefore;
  const magnitude = Math.abs(delta) >= 10 ? 'high' : Math.abs(delta) >= 5 ? 'medium' : delta !== 0 ? 'low' : 'none';

  await supabase.from('company_strategic_memory').insert({
    company_id: companyId,
    decision_id: params.decisionId || null,
    gap_id: params.gapId || null,
    action_type: params.actionType,
    action_key: params.actionKey,
    action_description: params.actionDescription || null,
    sdi_before: params.sdiBefore,
    sdi_after: params.sdiAfter,
    dimension_impacted: params.dimensionImpacted || null,
    impact_magnitude: magnitude,
    maturity_stage_at_time: params.maturityStage || null,
    business_model_at_time: params.businessModel || null,
    context_snapshot: params.contextSnapshot || {},
  });
}

// ─── Fetch History & Memory ───

export async function fetchScoreHistory(companyId: string, limit = 12): Promise<ScoreHistoryEntry[]> {
  const { data } = await supabase
    .from('company_score_history')
    .select('*')
    .eq('company_id', companyId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  return (data || []) as ScoreHistoryEntry[];
}

export async function fetchStrategicMemory(companyId: string, limit = 20): Promise<StrategicMemoryEntry[]> {
  const { data } = await supabase
    .from('company_strategic_memory')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as StrategicMemoryEntry[];
}

export async function fetchLatestSnapshot(companyId: string): Promise<StrategicStateSnapshot | null> {
  const { data } = await supabase
    .from('company_strategic_state_snapshots')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as StrategicStateSnapshot | null;
}

// ─── Behavioral Pattern Detection ───

export async function detectBehavioralPattern(companyId: string): Promise<string> {
  const { data: memory } = await supabase
    .from('company_strategic_memory')
    .select('action_type, sdi_delta, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(20);

  const entries = memory || [];
  if (entries.length < 3) return 'new-user';

  const completions = entries.filter((m: any) => m.action_type === 'decision_completed');
  const gapResolutions = entries.filter((m: any) => m.action_type === 'gap_resolved');
  const avgDelta = entries.reduce((sum: number, m: any) => sum + (m.sdi_delta || 0), 0) / entries.length;

  if (completions.length >= 5 && avgDelta > 2) return 'strategic-executor';
  if (gapResolutions.length >= 3) return 'gap-closer';
  if (completions.length >= 3 && avgDelta <= 0) return 'active-stagnant';
  if (entries.length >= 10 && completions.length < 2) return 'observer';
  return 'developing';
}

// ─── Structural Risks Derivation ───

export function deriveStructuralRisks(
  gaps: StrategicGap[],
  scores: StrategicScores,
  maturityStage: MaturityStage
): string[] {
  const risks: string[] = [];
  const activeGaps = gaps.filter(g => !g.resolved_at);
  const criticalGaps = activeGaps.filter(g => g.urgency === 'critical');

  if (criticalGaps.length >= 3) {
    risks.push('critical_gap_accumulation');
  }
  if (scores.categoryTotals.foundation < 10 && maturityStage !== 'early') {
    risks.push('strategic_foundation_collapse');
  }
  if (scores.categoryTotals.execution < 5 && scores.categoryTotals.foundation >= 20) {
    risks.push('strategy_execution_disconnect');
  }
  if (scores.categoryTotals.presence < 8 && maturityStage === 'growth') {
    risks.push('visibility_bottleneck');
  }
  if (activeGaps.filter(g => (g.weeks_active || 0) >= 4).length >= 2) {
    risks.push('chronic_gap_stagnation');
  }

  return risks;
}
