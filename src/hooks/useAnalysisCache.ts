import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisCacheMetadata {
  exists: boolean;
  count: number;
  lastUpdate: string | null;
  platform?: string;
}

interface AnalysisCacheData {
  audienceInsights: AnalysisCacheMetadata;
  contentAnalysis: AnalysisCacheMetadata;
  buyerPersonas: AnalysisCacheMetadata;
  socialAccounts: AnalysisCacheMetadata;
  companyProfile: AnalysisCacheMetadata;
  loading: boolean;
}

export const useAnalysisCache = (userId: string | null) => {
  const [cacheData, setCacheData] = useState<AnalysisCacheData>({
    audienceInsights: { exists: false, count: 0, lastUpdate: null },
    contentAnalysis: { exists: false, count: 0, lastUpdate: null },
    buyerPersonas: { exists: false, count: 0, lastUpdate: null },
    socialAccounts: { exists: false, count: 0, lastUpdate: null },
    companyProfile: { exists: false, count: 0, lastUpdate: null },
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setCacheData(prev => ({ ...prev, loading: false }));
      return;
    }

    loadCacheMetadata();
  }, [userId]);

  const loadCacheMetadata = async () => {
    if (!userId) return;

    try {
      const [
        audienceResult,
        contentResult,
        personasResult,
        socialAccountsResult,
        companyResult,
      ] = await Promise.all([
        // Audience insights
        supabase
          .from('audience_insights')
          .select('id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        // Content analysis
        supabase
          .from('social_content_analysis')
          .select('id, created_at, platform')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),

        // Buyer personas (from company_audiences)
        supabase
          .from('company_audiences')
          .select('id, created_at')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),

        // Social accounts
        supabase
          .from('social_accounts')
          .select('id, created_at, platform')
          .eq('user_id', userId)
          .eq('is_connected', true)
          .neq('platform', 'upload_post_profile'),

        // Company profile
        supabase
          .from('company_members')
          .select('company:companies!inner(id, updated_at, name, description, industry_sector)')
          .eq('user_id', userId)
          .eq('is_primary', true)
          .single(),
      ]);

      setCacheData({
        audienceInsights: {
          exists: (audienceResult.data?.length ?? 0) > 0,
          count: audienceResult.data?.length ?? 0,
          lastUpdate: audienceResult.data?.[0]?.created_at ?? null,
        },
        contentAnalysis: {
          exists: (contentResult.data?.length ?? 0) > 0,
          count: contentResult.data?.length ?? 0,
          lastUpdate: contentResult.data?.[0]?.created_at ?? null,
          platform: contentResult.data?.[0]?.platform,
        },
        buyerPersonas: {
          exists: (personasResult.data?.length ?? 0) > 0,
          count: personasResult.data?.length ?? 0,
          lastUpdate: personasResult.data?.[0]?.created_at ?? null,
        },
        socialAccounts: {
          exists: (socialAccountsResult.data?.length ?? 0) > 0,
          count: socialAccountsResult.data?.length ?? 0,
          lastUpdate: socialAccountsResult.data?.[0]?.created_at ?? null,
          platform: socialAccountsResult.data?.[0]?.platform,
        },
        companyProfile: {
          exists: !!companyResult.data?.company,
          count: companyResult.data?.company ? 1 : 0,
          lastUpdate: (companyResult.data?.company as any)?.updated_at ?? null,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error loading cache metadata:', error);
      setCacheData(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshCache = () => {
    setCacheData(prev => ({ ...prev, loading: true }));
    loadCacheMetadata();
  };

  return { ...cacheData, refreshCache };
};
