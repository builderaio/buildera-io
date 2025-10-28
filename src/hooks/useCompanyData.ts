import { useQuery } from '@tanstack/react-query';
import { edgeFunctions } from '@/services/edgeFunctions';
import type { CompanyData } from '@/services/edgeFunctions/types';

/**
 * Hook to fetch company data (objectives and audiences)
 * Uses the centralized Edge Functions service
 */
export const useCompanyData = (companyId: string | undefined) => {
  return useQuery({
    queryKey: ['company-data', companyId],
    queryFn: async (): Promise<CompanyData> => {
      if (!companyId) {
        throw new Error('No company ID provided');
      }

      console.log('🔄 [useCompanyData] Fetching via edgeFunctions.data.getCompanyData');

      const { data, error } = await edgeFunctions.data.getCompanyData(companyId);

      if (error) {
        console.error('❌ [useCompanyData] Error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned');
      }

      console.log('✅ [useCompanyData] Success:', {
        objectives: data.objectives.length,
        audiences: data.audiences.length
      });

      return data;
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
