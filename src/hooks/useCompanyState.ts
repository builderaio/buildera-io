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
    // Enterprise areas
    sales: AreaState;
    finance: AreaState;
    legal: AreaState;
    hr: AreaState;
    operations: AreaState;
  };
  loading: boolean;
}

const emptyArea: AreaState = { status: 'incomplete', score: 0, missing: [] };

const initialState: CompanyState = {
  maturityLevel: 'starter',
  completionScore: 0,
  areas: {
    profile: { ...emptyArea },
    strategy: { ...emptyArea },
    content: { ...emptyArea },
    agents: { ...emptyArea },
    audience: { ...emptyArea },
    social: { ...emptyArea },
    sales: { ...emptyArea },
    finance: { ...emptyArea },
    legal: { ...emptyArea },
    hr: { ...emptyArea },
    operations: { ...emptyArea },
  },
  loading: true,
};

const getStatus = (score: number): AreaStatus => {
  if (score >= 80) return 'complete';
  if (score >= 40) return 'partial';
  return 'incomplete';
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
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all relevant data in parallel (original + enterprise)
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
        // Enterprise data
        crmDealsRes,
        crmContactsRes,
        crmActivitiesRes,
        deptConfigRes,
        deptLogsRes,
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_objectives').select('id').eq('company_id', companyId),
        supabase.from('company_audiences').select('id').eq('company_id', companyId),
        supabase.from('company_enabled_agents').select('id').eq('company_id', companyId),
        supabase.from('agent_usage_log').select('id').eq('company_id', companyId).gte('created_at', thirtyDaysAgo),
        supabase.from('content_insights').select('id').eq('user_id', userId).eq('status', 'active'),
        supabase.from('social_accounts').select('id').eq('user_id', userId),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        // Enterprise queries
        supabase.from('crm_deals').select('id, stage, amount').eq('company_id', companyId),
        supabase.from('crm_contacts').select('id').eq('company_id', companyId),
        supabase.from('crm_activities').select('id').eq('company_id', companyId).gte('created_at', thirtyDaysAgo),
        supabase.from('company_department_config').select('*').eq('company_id', companyId),
        supabase.from('department_execution_log').select('id, department').eq('company_id', companyId).gte('created_at', thirtyDaysAgo),
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
      const crmDeals = crmDealsRes.data || [];
      const crmContacts = crmContactsRes.data || [];
      const crmActivities = crmActivitiesRes.data || [];
      const deptConfigs = deptConfigRes.data || [];
      const deptLogs = deptLogsRes.data || [];

      // === Original Areas ===

      // Profile
      const profileMissing: string[] = [];
      if (!company?.name) profileMissing.push('company_name');
      if (!company?.website_url) profileMissing.push('website');
      if (!company?.industry_sector) profileMissing.push('industry');
      if (!company?.description) profileMissing.push('description');
      if (!company?.logo_url) profileMissing.push('logo');
      const profileScore = Math.round(((5 - profileMissing.length) / 5) * 100);

      // Strategy
      const strategyMissing: string[] = [];
      if (!strategy?.mision) strategyMissing.push('mission');
      if (!strategy?.vision) strategyMissing.push('vision');
      if (!strategy?.propuesta_valor) strategyMissing.push('value_proposition');
      if (objectives.length === 0) strategyMissing.push('objectives');
      const strategyScore = Math.round(((4 - strategyMissing.length) / 4) * 100);

      // Content
      const contentScore = Math.min(100, insights.length * 20);
      const contentMissing: string[] = insights.length === 0 ? ['no_insights'] : [];

      // Agents
      const agentsMissing: string[] = [];
      if (enabledAgents.length === 0) agentsMissing.push('no_enabled_agents');
      if (usageLogs.length === 0) agentsMissing.push('no_executions');
      const agentsScore = Math.min(100, (enabledAgents.length * 15) + (usageLogs.length * 5));

      // Audience
      const audienceMissing: string[] = audiences.length === 0 ? ['no_audiences'] : [];
      const audienceScore = Math.min(100, audiences.length * 33);

      // Social
      const socialMissing: string[] = social.length === 0 ? ['no_social_connections'] : [];
      const socialScore = Math.min(100, social.length * 25);

      // === Enterprise Areas ===

      // Sales (CRM health)
      const salesMissing: string[] = [];
      if (crmDeals.length === 0) salesMissing.push('no_deals');
      if (crmContacts.length === 0) salesMissing.push('no_contacts');
      if (crmActivities.length === 0) salesMissing.push('no_recent_activities');
      const salesScore = Math.min(100, (crmDeals.length * 10) + (crmContacts.length * 5) + (crmActivities.length * 3));

      // Finance (credit usage tracking)
      const financeConfig = deptConfigs.find((d: any) => d.department === 'finance');
      const financeMissing: string[] = [];
      if (!financeConfig) financeMissing.push('no_finance_config');
      if (usageLogs.length === 0) financeMissing.push('no_credit_activity');
      const financeScore = Math.min(100, (financeConfig ? 40 : 0) + (usageLogs.length * 3));

      // Legal
      const legalConfig = deptConfigs.find((d: any) => d.department === 'legal');
      const legalLogs = deptLogs.filter((l: any) => l.department === 'legal');
      const legalMissing: string[] = [];
      if (!legalConfig) legalMissing.push('no_legal_config');
      const legalScore = Math.min(100, (legalConfig ? 40 : 0) + (legalLogs.length * 15));

      // HR
      const hrConfig = deptConfigs.find((d: any) => d.department === 'hr');
      const hrLogs = deptLogs.filter((l: any) => l.department === 'hr');
      const hrMissing: string[] = [];
      if (!hrConfig) hrMissing.push('no_hr_config');
      const hrScore = Math.min(100, (hrConfig ? 40 : 0) + (hrLogs.length * 15));

      // Operations
      const opsConfig = deptConfigs.find((d: any) => d.department === 'operations');
      const opsLogs = deptLogs.filter((l: any) => l.department === 'operations');
      const opsMissing: string[] = [];
      if (!opsConfig) opsMissing.push('no_ops_config');
      const opsScore = Math.min(100, (opsConfig ? 40 : 0) + (opsLogs.length * 15));

      // Overall completion (original 6 areas weighted more heavily)
      const coreScore = (profileScore + strategyScore + contentScore + agentsScore + audienceScore + socialScore) / 6;
      const enterpriseScore = (salesScore + financeScore + legalScore + hrScore + opsScore) / 5;
      const completionScore = Math.round(coreScore * 0.7 + enterpriseScore * 0.3);

      // Maturity level
      let maturityLevel: MaturityLevel = 'starter';
      if (completionScore >= 80 && usageLogs.length >= 20) {
        maturityLevel = 'scaling';
      } else if (completionScore >= 60 && usageLogs.length >= 10) {
        maturityLevel = 'established';
      } else if (completionScore >= 30 && usageLogs.length >= 3) {
        maturityLevel = 'growing';
      }

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
          sales: { status: getStatus(salesScore), score: salesScore, missing: salesMissing },
          finance: { status: getStatus(financeScore), score: financeScore, missing: financeMissing },
          legal: { status: getStatus(legalScore), score: legalScore, missing: legalMissing },
          hr: { status: getStatus(hrScore), score: hrScore, missing: hrMissing },
          operations: { status: getStatus(opsScore), score: opsScore, missing: opsMissing },
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
