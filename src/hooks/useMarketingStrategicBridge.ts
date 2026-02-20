/**
 * Marketing ↔ Strategic State Engine Bridge
 * 
 * Connects the Marketing Hub to the SSE, translating marketing actions
 * into strategic state mutations. This is the Impact Engine.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  recordStrategicMemory,
  fetchLatestSnapshot,
  type MaturityStage,
  type StrategicStateSnapshot,
} from '@/lib/strategicStateEngine';
import type { StrategicGap } from '@/hooks/useStrategicControlData';

// ─── Types ───

export type StrategicDimension = 'brand' | 'acquisition' | 'authority' | 'operations';

export interface MarketingImpactEvent {
  eventType: 'campaign_created' | 'post_published' | 'automation_activated' | 'automation_deactivated' | 'engagement_spike' | 'conversion' | 'onboarding_step' | 'approval_completed';
  eventSource: 'campaign' | 'autopilot' | 'manual' | 'automation_rule' | 'onboarding';
  sourceId?: string;
  dimension: StrategicDimension;
  gapId?: string;
  evidence?: Record<string, any>;
}

export interface AutopilotMaturityGate {
  mode: 'supervised' | 'semi-auto' | 'autonomous_optional';
  features: string[];
  label: string;
}

export interface GapCampaignSuggestion {
  gapKey: string;
  gapTitle: string;
  campaignType: string;
  dimension: StrategicDimension;
  suggestedTone: string;
  description: string;
}

export interface StrategicContext {
  maturityStage: MaturityStage;
  businessModel: string | null;
  activeGaps: StrategicGap[];
  latestSnapshot: StrategicStateSnapshot | null;
  currentSdi: number;
}

// ─── Impact Calculation Logic (Deterministic) ───

const IMPACT_MAP: Record<string, { dimensions: Partial<Record<StrategicDimension, number>>; sdiDelta: number }> = {
  post_published: { dimensions: { brand: 1, authority: 1 }, sdiDelta: 1 },
  campaign_created: { dimensions: { acquisition: 2 }, sdiDelta: 2 },
  automation_activated: { dimensions: { operations: 2 }, sdiDelta: 2 },
  automation_deactivated: { dimensions: { operations: -1 }, sdiDelta: -1 },
  engagement_spike: { dimensions: { brand: 2, authority: 2 }, sdiDelta: 3 },
  conversion: { dimensions: { acquisition: 3 }, sdiDelta: 3 },
  approval_completed: { dimensions: { operations: 1 }, sdiDelta: 1 },
  onboarding_step: { dimensions: {}, sdiDelta: 0 }, // overridden per step
};

const ONBOARDING_IMPACT: Record<string, { dimension: StrategicDimension; sdiDelta: number }> = {
  connectSocial: { dimension: 'acquisition', sdiDelta: 3 },
  completeBrand: { dimension: 'brand', sdiDelta: 3 },
  importSocialData: { dimension: 'operations', sdiDelta: 2 },
  firstPost: { dimension: 'brand', sdiDelta: 2 },
  activateAutopilot: { dimension: 'operations', sdiDelta: 4 },
};

// ─── Hook ───

export function useMarketingStrategicBridge(companyId: string | undefined) {
  const [strategicContext, setStrategicContext] = useState<StrategicContext>({
    maturityStage: 'early',
    businessModel: null,
    activeGaps: [],
    latestSnapshot: null,
    currentSdi: 0,
  });
  const [loading, setLoading] = useState(true);

  // ─── Load strategic context ───
  useEffect(() => {
    if (!companyId) return;
    
    const load = async () => {
      setLoading(true);
      try {
        const [snapshotData, gapsRes] = await Promise.all([
          fetchLatestSnapshot(companyId),
          supabase
            .from('company_strategic_gaps')
            .select('*')
            .eq('company_id', companyId)
            .is('resolved_at', null),
        ]);

        setStrategicContext({
          maturityStage: (snapshotData?.maturity_stage as MaturityStage) || 'early',
          businessModel: snapshotData?.business_model || null,
          activeGaps: (gapsRes.data || []) as StrategicGap[],
          latestSnapshot: snapshotData,
          currentSdi: snapshotData?.sdi_score || 0,
        });
      } catch (e) {
        console.error('Error loading strategic context:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  // ─── Impact Engine: Record marketing impact ───
  const recordMarketingImpact = useCallback(async (event: MarketingImpactEvent) => {
    if (!companyId) return;

    const impact = IMPACT_MAP[event.eventType] || { dimensions: {}, sdiDelta: 0 };
    const sdiBefore = strategicContext.currentSdi;
    const sdiAfter = Math.max(0, Math.min(100, sdiBefore + impact.sdiDelta));
    const snapshotVersion = strategicContext.latestSnapshot?.version || 0;

    // Persist to marketing_strategic_impact
    try {
      await supabase.from('marketing_strategic_impact' as any).insert({
        company_id: companyId,
        event_type: event.eventType,
        event_source: event.eventSource,
        source_id: event.sourceId || null,
        strategic_dimension: event.dimension,
        gap_id: event.gapId || null,
        snapshot_version: snapshotVersion,
        sdi_before: sdiBefore,
        sdi_after: sdiAfter,
        dimension_delta: impact.dimensions,
        evidence: event.evidence || {},
      });

      // Record in strategic memory
      await recordStrategicMemory(companyId, {
        actionType: `marketing_${event.eventType}`,
        actionKey: event.sourceId || event.eventType,
        actionDescription: `Marketing event: ${event.eventType} (${event.dimension})`,
        sdiBefore,
        sdiAfter,
        dimensionImpacted: event.dimension,
        maturityStage: strategicContext.maturityStage,
        businessModel: strategicContext.businessModel || undefined,
        contextSnapshot: { event_source: event.eventSource, evidence: event.evidence },
      });

      // Update local state
      setStrategicContext(prev => ({
        ...prev,
        currentSdi: sdiAfter,
      }));
    } catch (e) {
      console.error('Error recording marketing impact:', e);
    }
  }, [companyId, strategicContext]);

  // ─── Onboarding step impact ───
  const recordOnboardingImpact = useCallback(async (stepKey: string) => {
    if (!companyId) return;
    
    const impact = ONBOARDING_IMPACT[stepKey];
    if (!impact) return;

    await recordMarketingImpact({
      eventType: 'onboarding_step',
      eventSource: 'onboarding',
      sourceId: stepKey,
      dimension: impact.dimension,
      evidence: { step: stepKey },
    });

    // Override SDI delta for onboarding (custom values)
    const sdiBefore = strategicContext.currentSdi;
    const sdiAfter = Math.max(0, Math.min(100, sdiBefore + impact.sdiDelta));

    try {
      // Update the last inserted record with correct delta
      await supabase
        .from('marketing_strategic_impact' as any)
        .update({ sdi_before: sdiBefore, sdi_after: sdiAfter, dimension_delta: { [impact.dimension]: impact.sdiDelta } })
        .eq('company_id', companyId)
        .eq('event_type', 'onboarding_step')
        .eq('source_id', stepKey)
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (e) {
      console.error('Error updating onboarding impact:', e);
    }
  }, [companyId, strategicContext, recordMarketingImpact]);

  // ─── Dimension recommendation based on content type ───
  const getRecommendedDimension = useCallback((contentType?: string): StrategicDimension => {
    // If there's a critical gap, recommend its dimension
    const criticalGap = strategicContext.activeGaps.find(g => g.urgency === 'critical');
    if (criticalGap) {
      const varToD: Record<string, StrategicDimension> = {
        positioning: 'brand', brand: 'brand', visibility: 'brand',
        channel: 'acquisition', audience: 'acquisition',
        authority: 'authority', trust: 'authority',
        offer: 'operations',
      };
      return varToD[criticalGap.variable] || 'brand';
    }

    // Default based on content type
    if (contentType === 'campaign') return 'acquisition';
    if (contentType === 'automation') return 'operations';
    return 'brand';
  }, [strategicContext.activeGaps]);

  // ─── Gap-Campaign Linking ───
  const getGapCampaignSuggestions = useMemo((): GapCampaignSuggestion[] => {
    const { activeGaps, businessModel } = strategicContext;
    const isB2B = businessModel === 'B2B' || businessModel === 'B2B2C';

    return activeGaps.slice(0, 5).map(gap => {
      const varToSuggestion: Record<string, { type: string; dim: StrategicDimension; desc: string }> = {
        positioning: {
          type: isB2B ? 'Thought Leadership' : 'Brand Awareness',
          dim: 'brand',
          desc: isB2B ? 'Posiciona tu expertise con contenido de liderazgo' : 'Aumenta reconocimiento de marca',
        },
        brand: {
          type: 'Brand Building',
          dim: 'brand',
          desc: 'Refuerza identidad y diferenciación de marca',
        },
        visibility: {
          type: 'Social Reach',
          dim: 'brand',
          desc: 'Amplifica alcance en canales digitales',
        },
        channel: {
          type: isB2B ? 'Lead Generation' : 'Traffic Campaign',
          dim: 'acquisition',
          desc: isB2B ? 'Genera leads cualificados' : 'Aumenta tráfico a canales',
        },
        audience: {
          type: isB2B ? 'Lead Nurturing' : 'Audience Growth',
          dim: 'acquisition',
          desc: isB2B ? 'Nutre y cualifica leads existentes' : 'Crece tu base de audiencia',
        },
        authority: {
          type: 'Content Authority',
          dim: 'authority',
          desc: 'Establece autoridad mediante contenido experto',
        },
        trust: {
          type: 'Trust Building',
          dim: 'authority',
          desc: 'Construye confianza con prueba social y testimonios',
        },
        offer: {
          type: 'Conversion Optimization',
          dim: 'operations',
          desc: 'Optimiza la propuesta de valor y conversión',
        },
      };

      const suggestion = varToSuggestion[gap.variable] || {
        type: 'General Campaign',
        dim: 'brand' as StrategicDimension,
        desc: 'Campaña para abordar brecha estratégica',
      };

      return {
        gapKey: gap.gap_key,
        gapTitle: gap.title,
        campaignType: suggestion.type,
        dimension: suggestion.dim,
        suggestedTone: isB2B ? 'profesional' : 'cercano',
        description: suggestion.desc,
      };
    });
  }, [strategicContext]);

  // ─── Autopilot Maturity Gate ───
  const getAutopilotMaturityGate = useCallback((): AutopilotMaturityGate => {
    switch (strategicContext.maturityStage) {
      case 'early':
        return { mode: 'supervised', features: ['suggestions'], label: 'Supervisado' };
      case 'growth':
        return { mode: 'semi-auto', features: ['suggestions', 'partial_automation', 'optimized_approvals'], label: 'Semi-autónomo' };
      case 'consolidated':
      case 'scale':
        return { mode: 'autonomous_optional', features: ['all', 'social_listening', 'attribution'], label: 'Autónomo (opcional)' };
      default:
        return { mode: 'supervised', features: ['suggestions'], label: 'Supervisado' };
    }
  }, [strategicContext.maturityStage]);

  // ─── Fetch accumulated strategic impact ───
  const fetchStrategicImpactSummary = useCallback(async () => {
    if (!companyId) return null;

    try {
      const { data } = await supabase
        .from('marketing_strategic_impact' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return null;

      const events = data as any[];
      const totalDelta = events.reduce((sum: number, e: any) => sum + ((e.sdi_after || 0) - (e.sdi_before || 0)), 0);
      const dimensionAgg: Record<string, number> = {};
      events.forEach((e: any) => {
        const delta = e.dimension_delta || {};
        Object.entries(delta).forEach(([dim, val]) => {
          dimensionAgg[dim] = (dimensionAgg[dim] || 0) + (val as number);
        });
      });

      const gapsReduced = events.filter((e: any) => e.gap_id).length;
      const mostReinforced = Object.entries(dimensionAgg).sort((a, b) => b[1] - a[1])[0];

      return {
        totalSdiContribution: totalDelta,
        gapsReduced,
        mostReinforcedDimension: mostReinforced ? mostReinforced[0] : null,
        mostReinforcedValue: mostReinforced ? mostReinforced[1] : 0,
        recentEvents: events.slice(0, 10),
        dimensionBreakdown: dimensionAgg,
      };
    } catch (e) {
      console.error('Error fetching impact summary:', e);
      return null;
    }
  }, [companyId]);

  return {
    // Context
    strategicContext,
    loading,

    // Impact Engine
    recordMarketingImpact,
    recordOnboardingImpact,
    
    // Recommendations
    getRecommendedDimension,
    getGapCampaignSuggestions,
    getAutopilotMaturityGate,
    
    // Analytics
    fetchStrategicImpactSummary,
  };
}
