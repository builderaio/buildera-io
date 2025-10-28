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

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('get-company-data', {
        body: { company_id: companyId }
      });

      if (error) {
        console.error('❌ [useCompanyData] Edge function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      console.log('✅ [useCompanyData] Data fetched:', {
        objectives: data.objectives?.length || 0,
        audiences: data.audiences?.length || 0
      });

      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
