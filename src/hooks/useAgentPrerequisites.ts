import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Prerequisite {
  type: 'strategy' | 'audiences' | 'branding' | 'social_connected';
  required: boolean;
  fields?: string[];
  minCount?: number;
  platforms?: string[];
  message: string;
  actionUrl: string;
}

export interface PrerequisiteStatus {
  canExecute: boolean;
  blockers: Array<{
    type: string;
    message: string;
    actionUrl: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    actionUrl: string;
  }>;
  completedItems: Array<{
    type: string;
    message: string;
  }>;
  loading: boolean;
}

interface CompanyData {
  strategy: any | null;
  audiences: any[];
  branding: any | null;
  socialConnections: {
    linkedin: boolean;
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
  };
}

export const useAgentPrerequisites = (
  agentCode: string | null,
  companyId: string | null,
  userId: string | null
) => {
  const [status, setStatus] = useState<PrerequisiteStatus>({
    canExecute: true,
    blockers: [],
    warnings: [],
    completedItems: [],
    loading: true
  });

  const checkPrerequisites = useCallback(async () => {
    if (!agentCode || !companyId) {
      setStatus({ canExecute: true, blockers: [], warnings: [], completedItems: [], loading: false });
      return;
    }

    setStatus(prev => ({ ...prev, loading: true }));

    try {
      // Fetch agent prerequisites from database
      const { data: agentData, error: agentError } = await supabase
        .from('platform_agents')
        .select('prerequisites')
        .eq('internal_code', agentCode)
        .single();

      if (agentError || !agentData) {
        console.error('Error fetching agent prerequisites:', agentError);
        setStatus({ canExecute: true, blockers: [], warnings: [], completedItems: [], loading: false });
        return;
      }

      const prerequisites = (agentData.prerequisites as unknown as Prerequisite[]) || [];
      
      if (prerequisites.length === 0) {
        setStatus({ canExecute: true, blockers: [], warnings: [], completedItems: [], loading: false });
        return;
      }

      // Fetch company data in parallel
      const [strategyResult, audiencesResult, brandingResult, socialResults] = await Promise.all([
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_audiences').select('*').eq('company_id', companyId).eq('is_active', true),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        Promise.all([
          supabase.from('linkedin_connections').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('facebook_instagram_connections').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('tiktok_connections').select('id').eq('user_id', userId).maybeSingle(),
        ])
      ]);

      const companyData: CompanyData = {
        strategy: strategyResult.data,
        audiences: audiencesResult.data || [],
        branding: brandingResult.data,
        socialConnections: {
          linkedin: !!socialResults[0].data,
          instagram: !!socialResults[1].data,
          facebook: !!socialResults[1].data,
          tiktok: !!socialResults[2].data,
        }
      };

      // Evaluate each prerequisite
      const blockers: PrerequisiteStatus['blockers'] = [];
      const warnings: PrerequisiteStatus['warnings'] = [];
      const completedItems: PrerequisiteStatus['completedItems'] = [];

      // Define completed messages for each type
      const completedMessages: Record<string, string> = {
        strategy: 'Estrategia empresarial configurada',
        audiences: 'Audiencias definidas',
        branding: 'Identidad de marca configurada',
        social_connected: 'Redes sociales conectadas'
      };

      for (const prereq of prerequisites) {
        const isMet = evaluatePrerequisite(prereq, companyData);
        
        if (isMet) {
          completedItems.push({
            type: prereq.type,
            message: completedMessages[prereq.type] || `${prereq.type} configurado`
          });
        } else {
          const issue = {
            type: prereq.type,
            message: prereq.message,
            actionUrl: prereq.actionUrl
          };
          
          if (prereq.required) {
            blockers.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }

      setStatus({
        canExecute: blockers.length === 0,
        blockers,
        warnings,
        completedItems,
        loading: false
      });
    } catch (error) {
      console.error('Error checking prerequisites:', error);
      setStatus({ canExecute: true, blockers: [], warnings: [], completedItems: [], loading: false });
    }
  }, [agentCode, companyId, userId]);

  useEffect(() => {
    checkPrerequisites();
  }, [checkPrerequisites]);

  return { ...status, refresh: checkPrerequisites };
};

function evaluatePrerequisite(prereq: Prerequisite, data: CompanyData): boolean {
  switch (prereq.type) {
    case 'strategy':
      if (!data.strategy) return false;
      if (prereq.fields) {
        return prereq.fields.every(field => {
          const value = data.strategy[field];
          return value !== null && value !== undefined && value !== '';
        });
      }
      return true;

    case 'audiences':
      const minCount = prereq.minCount || 1;
      return data.audiences.length >= minCount;

    case 'branding':
      if (!data.branding) return false;
      if (prereq.fields) {
        return prereq.fields.every(field => {
          const value = data.branding[field];
          return value !== null && value !== undefined && value !== '';
        });
      }
      return true;

    case 'social_connected':
      if (!prereq.platforms || prereq.platforms.length === 0) {
        // Any social connection is enough
        return Object.values(data.socialConnections).some(v => v);
      }
      // Check specific platforms
      return prereq.platforms.some(platform => 
        data.socialConnections[platform as keyof typeof data.socialConnections]
      );

    default:
      return true;
  }
}
