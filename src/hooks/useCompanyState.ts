import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MaturityLevel = 'starter' | 'growing' | 'established' | 'scaling';
export type AreaStatus = 'incomplete' | 'partial' | 'complete';

interface AreaState {
  status: AreaStatus;
  score: number;
  missing: string[];
}

export interface CompanyState {
  maturityLevel: MaturityLevel;
  completionScore: number;
  areas: {
    profile: AreaState;
    strategy: AreaState;
    content: AreaState;
    agents: AreaState;
    audience: AreaState;
    social: AreaState;
  };
  loading: boolean;
}

const initialState: CompanyState = {
  maturityLevel: 'starter',
  completionScore: 0,
  areas: {
    profile: { status: 'incomplete', score: 0, missing: [] },
    strategy: { status: 'incomplete', score: 0, missing: [] },
    content: { status: 'incomplete', score: 0, missing: [] },
    agents: { status: 'incomplete', score: 0, missing: [] },
    audience: { status: 'incomplete', score: 0, missing: [] },
    social: { status: 'incomplete', score: 0, missing: [] },
  },
  loading: true,
};

export const useCompanyState = (companyId?: string, userId?: string) => {
  const [state, setState] = useState<CompanyState>(initialState);

  const analyzeState = useCallback(async () => {
    if (!companyId || !userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Fetch all relevant data in parallel
      const [
        companyRes,
        strategyRes,
        objectivesRes,
        audiencesRes,
        enabledAgentsRes,
        usageLogsRes,
        insightsRes,
        socialRes,
        brandingRes,
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_objectives').select('id').eq('company_id', companyId),
        supabase.from('company_audiences').select('id').eq('company_id', companyId),
        supabase.from('company_enabled_agents').select('id').eq('company_id', companyId),
        supabase.from('agent_usage_log').select('id').eq('company_id', companyId).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('content_insights').select('id').eq('user_id', userId).eq('status', 'active'),
        supabase.from('social_accounts').select('id').eq('user_id', userId),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
      ]);

      const company = companyRes.data;
      const strategy = strategyRes.data;
      const objectives = objectivesRes.data || [];
      const audiences = audiencesRes.data || [];
      const enabledAgents = enabledAgentsRes.data || [];
      const usageLogs = usageLogsRes.data || [];
      const insights = insightsRes.data || [];
      const social = socialRes.data || [];
      const branding = brandingRes.data;

      // Analyze Profile
      const profileMissing: string[] = [];
      if (!company?.name) profileMissing.push('company_name');
      if (!company?.website_url) profileMissing.push('website');
      if (!company?.industry_sector) profileMissing.push('industry');
      if (!company?.description) profileMissing.push('description');
      if (!company?.logo_url) profileMissing.push('logo');
      const profileScore = Math.round(((5 - profileMissing.length) / 5) * 100);

      // Analyze Strategy
      const strategyMissing: string[] = [];
      if (!strategy?.mision) strategyMissing.push('mission');
      if (!strategy?.vision) strategyMissing.push('vision');
      if (!strategy?.propuesta_valor) strategyMissing.push('value_proposition');
      if (objectives.length === 0) strategyMissing.push('objectives');
      const strategyScore = Math.round(((4 - strategyMissing.length) / 4) * 100);

      // Analyze Content
      const contentScore = Math.min(100, insights.length * 20);
      const contentMissing: string[] = insights.length === 0 ? ['no_insights'] : [];

      // Analyze Agents
      const agentsMissing: string[] = [];
      if (enabledAgents.length === 0) agentsMissing.push('no_enabled_agents');
      if (usageLogs.length === 0) agentsMissing.push('no_executions');
      const agentsScore = Math.min(100, (enabledAgents.length * 15) + (usageLogs.length * 5));

      // Analyze Audience
      const audienceMissing: string[] = audiences.length === 0 ? ['no_audiences'] : [];
      const audienceScore = Math.min(100, audiences.length * 33);

      // Analyze Social
      const socialMissing: string[] = social.length === 0 ? ['no_social_connections'] : [];
      const socialScore = Math.min(100, social.length * 25);

      // Calculate overall completion
      const completionScore = Math.round(
        (profileScore + strategyScore + contentScore + agentsScore + audienceScore + socialScore) / 6
      );

      // Determine maturity level
      let maturityLevel: MaturityLevel = 'starter';
      if (completionScore >= 80 && usageLogs.length >= 20) {
        maturityLevel = 'scaling';
      } else if (completionScore >= 60 && usageLogs.length >= 10) {
        maturityLevel = 'established';
      } else if (completionScore >= 30 && usageLogs.length >= 3) {
        maturityLevel = 'growing';
      }

      const getStatus = (score: number): AreaStatus => {
        if (score >= 80) return 'complete';
        if (score >= 40) return 'partial';
        return 'incomplete';
      };

      setState({
        maturityLevel,
        completionScore,
        areas: {
          profile: { status: getStatus(profileScore), score: profileScore, missing: profileMissing },
          strategy: { status: getStatus(strategyScore), score: strategyScore, missing: strategyMissing },
          content: { status: getStatus(contentScore), score: contentScore, missing: contentMissing },
          agents: { status: getStatus(agentsScore), score: agentsScore, missing: agentsMissing },
          audience: { status: getStatus(audienceScore), score: audienceScore, missing: audienceMissing },
          social: { status: getStatus(socialScore), score: socialScore, missing: socialMissing },
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error analyzing company state:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [companyId, userId]);

  useEffect(() => {
    analyzeState();
  }, [analyzeState]);

  return { ...state, refresh: analyzeState };
};
