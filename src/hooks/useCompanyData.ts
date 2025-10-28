import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CompanyDataResult {
  objectives: any[];
  audiences: any[];
  company_id: string;
}

export const useCompanyData = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-data', companyId],
    queryFn: async (): Promise<CompanyDataResult> => {
      if (!companyId) {
        throw new Error('No company ID provided');
      }

      console.log('🔄 [useCompanyData] Fetching data for company:', companyId);

      // Direct Supabase query with proper error handling
      const [objectivesResult, audiencesResult] = await Promise.all([
        supabase
          .from('company_objectives')
          .select('*')
          .eq('company_id', companyId)
          .eq('status', 'active')
          .order('priority', { ascending: true }),
        supabase
          .from('company_audiences')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ]);

      if (objectivesResult.error) {
        console.error('❌ Error fetching objectives:', objectivesResult.error);
      }
      if (audiencesResult.error) {
        console.error('❌ Error fetching audiences:', audiencesResult.error);
      }

      const objectives = objectivesResult.data || [];
      const audiences = audiencesResult.data || [];

      console.log('✅ [useCompanyData] Data fetched:', {
        objectives: objectives.length,
        audiences: audiences.length,
        company_id: companyId
      });

      return {
        objectives,
        audiences,
        company_id: companyId
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
