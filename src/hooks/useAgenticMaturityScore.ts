import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgenticPillarScore {
  score: number;
  maxScore: number;
  details: { label: string; met: boolean; points: number }[];
}

export interface AgenticMaturityData {
  businessModel: AgenticPillarScore;
  operatingModel: AgenticPillarScore;
  governance: AgenticPillarScore;
  workforce: AgenticPillarScore;
  technologyData: AgenticPillarScore;
  composite: number;
  loading: boolean;
  persistSnapshot: () => Promise<void>;
}

export function useAgenticMaturityScore(companyId: string | null): AgenticMaturityData {
  const [companyData, setCompanyData] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [autopilotLogs, setAutopilotLogs] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [brandingData, setBrandingData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) { setLoading(false); return; }

    const load = async () => {
      setLoading(true);
      const [
        companyRes, agentsRes, socialRes, membersRes,
        autopilotRes, capsRes, stratRes, brandRes, prodsRes,
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('company_agent_configurations').select('*').eq('company_id', companyId),
        supabase.from('social_accounts').select('*').eq('company_id', companyId),
        supabase.from('company_members').select('*').eq('company_id', companyId),
        supabase.from('autopilot_execution_log').select('id, status').eq('company_id', companyId).limit(50),
        supabase.from('autopilot_capabilities').select('*').eq('company_id', companyId),
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_products').select('id').eq('company_id', companyId),
      ]);

      setCompanyData(companyRes.data);
      setAgents(agentsRes.data || []);
      setSocialAccounts(socialRes.data || []);
      setTeamMembers(membersRes.data || []);
      setAutopilotLogs(autopilotRes.data || []);
      setCapabilities(capsRes.data || []);
      setStrategyData(stratRes.data);
      setBrandingData(brandRes.data);
      setProducts(prodsRes.data || []);
      setLoading(false);
    };
    load();
  }, [companyId]);

  const businessModel = useMemo<AgenticPillarScore>(() => {
    const details = [
      { label: 'agenticMaturity.bm.website', met: !!companyData?.website_url, points: 15 },
      { label: 'agenticMaturity.bm.socialChannels', met: socialAccounts.length >= 1, points: 20 },
      { label: 'agenticMaturity.bm.multiChannel', met: socialAccounts.length >= 3, points: 15 },
      { label: 'agenticMaturity.bm.products', met: products.length >= 1, points: 20 },
      { label: 'agenticMaturity.bm.strategy', met: !!strategyData?.propuesta_valor, points: 15 },
      { label: 'agenticMaturity.bm.branding', met: !!brandingData?.brand_voice, points: 15 },
    ];
    const score = details.filter(d => d.met).reduce((s, d) => s + d.points, 0);
    return { score, maxScore: 100, details };
  }, [companyData, socialAccounts, products, strategyData, brandingData]);

  const operatingModel = useMemo<AgenticPillarScore>(() => {
    const activeAgents = agents.filter(a => a.is_active);
    const details = [
      { label: 'agenticMaturity.om.agentsConfigured', met: agents.length >= 1, points: 20 },
      { label: 'agenticMaturity.om.agentsActive', met: activeAgents.length >= 3, points: 20 },
      { label: 'agenticMaturity.om.agentsDiverse', met: activeAgents.length >= 5, points: 15 },
      { label: 'agenticMaturity.om.autopilotRuns', met: autopilotLogs.length >= 1, points: 25 },
      { label: 'agenticMaturity.om.recurringExecs', met: agents.some(a => a.is_recurring), points: 20 },
    ];
    const score = details.filter(d => d.met).reduce((s, d) => s + d.points, 0);
    return { score, maxScore: 100, details };
  }, [agents, autopilotLogs]);

  const governance = useMemo<AgenticPillarScore>(() => {
    const activeCaps = capabilities.filter(c => c.is_active);
    const successfulRuns = autopilotLogs.filter(l => l.status === 'completed');
    const details = [
      { label: 'agenticMaturity.gov.capsActive', met: activeCaps.length >= 1, points: 25 },
      { label: 'agenticMaturity.gov.guardrails', met: capabilities.some(c => c.required_maturity), points: 20 },
      { label: 'agenticMaturity.gov.successRate', met: successfulRuns.length >= 3, points: 25 },
      { label: 'agenticMaturity.gov.autopilotCycles', met: autopilotLogs.length >= 5, points: 15 },
      { label: 'agenticMaturity.gov.humanReview', met: capabilities.some(c => !c.auto_activate), points: 15 },
    ];
    const score = details.filter(d => d.met).reduce((s, d) => s + d.points, 0);
    return { score, maxScore: 100, details };
  }, [capabilities, autopilotLogs]);

  const workforce = useMemo<AgenticPillarScore>(() => {
    const details = [
      { label: 'agenticMaturity.wf.teamConfigured', met: teamMembers.length >= 2, points: 25 },
      { label: 'agenticMaturity.wf.rolesAssigned', met: teamMembers.some(m => m.role && m.role !== 'member'), points: 25 },
      { label: 'agenticMaturity.wf.ownerDefined', met: teamMembers.some(m => m.role === 'owner'), points: 20 },
      { label: 'agenticMaturity.wf.multipleRoles', met: new Set(teamMembers.map(m => m.role)).size >= 3, points: 15 },
      { label: 'agenticMaturity.wf.teamSize', met: teamMembers.length >= 5, points: 15 },
    ];
    const score = details.filter(d => d.met).reduce((s, d) => s + d.points, 0);
    return { score, maxScore: 100, details };
  }, [teamMembers]);

  const technologyData = useMemo<AgenticPillarScore>(() => {
    const details = [
      { label: 'agenticMaturity.td.socialIntegrations', met: socialAccounts.length >= 1, points: 25 },
      { label: 'agenticMaturity.td.multiPlatform', met: socialAccounts.length >= 2, points: 20 },
      { label: 'agenticMaturity.td.dataProprietary', met: !!companyData?.description && !!strategyData?.mision, points: 20 },
      { label: 'agenticMaturity.td.agentProtocols', met: agents.length >= 2 && autopilotLogs.length >= 1, points: 20 },
      { label: 'agenticMaturity.td.fullStack', met: socialAccounts.length >= 3 && agents.length >= 3, points: 15 },
    ];
    const score = details.filter(d => d.met).reduce((s, d) => s + d.points, 0);
    return { score, maxScore: 100, details };
  }, [socialAccounts, companyData, strategyData, agents, autopilotLogs]);

  const composite = useMemo(() => {
    return Math.round(
      (businessModel.score + operatingModel.score + governance.score + workforce.score + technologyData.score) / 5
    );
  }, [businessModel, operatingModel, governance, workforce, technologyData]);

  const persistSnapshot = useCallback(async () => {
    if (!companyId) return;
    await supabase.from('agentic_maturity_scores').insert({
      company_id: companyId,
      business_model_score: businessModel.score,
      operating_model_score: operatingModel.score,
      governance_score: governance.score,
      workforce_score: workforce.score,
      technology_data_score: technologyData.score,
      composite_score: composite,
      pillar_details: {
        businessModel: businessModel.details,
        operatingModel: operatingModel.details,
        governance: governance.details,
        workforce: workforce.details,
        technologyData: technologyData.details,
      },
    });
  }, [companyId, businessModel, operatingModel, governance, workforce, technologyData, composite]);

  return { businessModel, operatingModel, governance, workforce, technologyData, composite, loading, persistSnapshot };
}
