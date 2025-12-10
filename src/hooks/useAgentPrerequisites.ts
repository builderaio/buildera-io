import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AlternativeAction {
  type: 'scrape' | 'connect' | 'generate';
  label: string;
  agentCode?: string;
}

export interface Prerequisite {
  type: 'strategy' | 'audiences' | 'branding' | 'social_connected' | 'social_data';
  required: boolean;
  fields?: string[];
  minCount?: number;
  minPosts?: number;
  platforms?: string[];
  message: string;
  actionUrl: string;
  alternativeAction?: AlternativeAction;
}

export interface PrerequisiteStatus {
  canExecute: boolean;
  blockers: Array<{
    type: string;
    message: string;
    actionUrl: string;
    alternativeAction?: AlternativeAction;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    actionUrl: string;
    alternativeAction?: AlternativeAction;
  }>;
  completedItems: Array<{
    type: string;
    message: string;
    details?: string;
  }>;
  socialDataStatus?: {
    instagram: number;
    linkedin: number;
    facebook: number;
    tiktok: number;
    total: number;
  };
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
  socialPosts: {
    instagram: number;
    linkedin: number;
    facebook: number;
    tiktok: number;
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

      // Fetch company data and social posts in parallel
      const [strategyResult, audiencesResult, brandingResult, socialResults, postsResults] = await Promise.all([
        supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle(),
        supabase.from('company_audiences').select('*').eq('company_id', companyId).eq('is_active', true),
        supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle(),
        Promise.all([
          supabase.from('linkedin_connections').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('facebook_instagram_connections').select('id').eq('user_id', userId).maybeSingle(),
          supabase.from('tiktok_connections').select('id').eq('user_id', userId).maybeSingle(),
        ]),
        // Count posts per platform
        Promise.all([
          supabase.from('instagram_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('linkedin_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('facebook_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('tiktok_posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
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
        },
        socialPosts: {
          instagram: postsResults[0].count || 0,
          linkedin: postsResults[1].count || 0,
          facebook: postsResults[2].count || 0,
          tiktok: postsResults[3].count || 0,
        }
      };

      // Evaluate each prerequisite
      const blockers: PrerequisiteStatus['blockers'] = [];
      const warnings: PrerequisiteStatus['warnings'] = [];
      const completedItems: PrerequisiteStatus['completedItems'] = [];

      // Define completed messages and details for each type
      const getCompletedInfo = (prereq: Prerequisite): { message: string; details?: string } => {
        switch (prereq.type) {
          case 'strategy':
            return { 
              message: 'Estrategia empresarial configurada',
              details: companyData.strategy?.propuesta_valor?.substring(0, 50) + '...' || undefined
            };
          case 'audiences':
            return { 
              message: 'Audiencias definidas',
              details: `${companyData.audiences.length} audiencia(s) activa(s)`
            };
          case 'branding':
            return { 
              message: 'Identidad de marca configurada',
              details: companyData.branding?.primary_color ? `Color principal: ${companyData.branding.primary_color}` : undefined
            };
          case 'social_connected':
            const connected = Object.entries(companyData.socialConnections)
              .filter(([_, v]) => v)
              .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
            return { 
              message: 'Redes sociales conectadas',
              details: connected.length > 0 ? connected.join(', ') : undefined
            };
          case 'social_data':
            const total = Object.values(companyData.socialPosts).reduce((a, b) => a + b, 0);
            return { 
              message: 'Datos de redes sociales disponibles',
              details: `${total} publicaciones importadas`
            };
          default:
            return { message: `${prereq.type} configurado` };
        }
      };

      for (const prereq of prerequisites) {
        const isMet = evaluatePrerequisite(prereq, companyData);
        
        if (isMet) {
          const info = getCompletedInfo(prereq);
          completedItems.push({
            type: prereq.type,
            message: info.message,
            details: info.details
          });
        } else {
          const issue = {
            type: prereq.type,
            message: prereq.message,
            actionUrl: prereq.actionUrl,
            alternativeAction: prereq.alternativeAction
          };
          
          if (prereq.required) {
            blockers.push(issue);
          } else {
            warnings.push(issue);
          }
        }
      }

      // Calculate social data status
      const socialDataStatus = {
        instagram: companyData.socialPosts.instagram,
        linkedin: companyData.socialPosts.linkedin,
        facebook: companyData.socialPosts.facebook,
        tiktok: companyData.socialPosts.tiktok,
        total: Object.values(companyData.socialPosts).reduce((a, b) => a + b, 0)
      };

      setStatus({
        canExecute: blockers.length === 0,
        blockers,
        warnings,
        completedItems,
        socialDataStatus,
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

    case 'social_data':
      // Validate that we have actual social posts/data
      const totalPosts = Object.values(data.socialPosts).reduce((a, b) => a + b, 0);
      const minPosts = prereq.minPosts || 1;
      
      if (prereq.platforms && prereq.platforms.length > 0) {
        // Check specific platforms
        const platformPosts = prereq.platforms.reduce((sum, platform) => {
          return sum + (data.socialPosts[platform as keyof typeof data.socialPosts] || 0);
        }, 0);
        return platformPosts >= minPosts;
      }
      
      return totalPosts >= minPosts;

    default:
      return true;
  }
}
