import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ParameterCategory = 'strategy' | 'content' | 'audience' | 'branding' | 'analytics' | 'competitive';

const VALID_CATEGORIES: ParameterCategory[] = ['strategy', 'content', 'audience', 'branding', 'analytics', 'competitive'];

export interface CompanyParameter {
  id: string;
  company_id: string;
  category: ParameterCategory;
  parameter_key: string;
  parameter_value: any;
  source_agent_code: string | null;
  source_execution_id: string | null;
  version: number;
  is_current: boolean;
  updated_at: string;
}

export interface CompanyParametersMap {
  strategy: Record<string, any>;
  content: Record<string, any>;
  audience: Record<string, any>;
  branding: Record<string, any>;
  analytics: Record<string, any>;
  competitive: Record<string, any>;
}

const emptyParametersMap: CompanyParametersMap = {
  strategy: {},
  content: {},
  audience: {},
  branding: {},
  analytics: {},
  competitive: {},
};

export const useCompanyParameters = (companyId: string | null) => {
  const [parameters, setParameters] = useState<CompanyParametersMap>(emptyParametersMap);
  const [rawParameters, setRawParameters] = useState<CompanyParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParameters = useCallback(async () => {
    if (!companyId) {
      setParameters(emptyParametersMap);
      setRawParameters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('company_parameters')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_current', true)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      const params: CompanyParametersMap = { ...emptyParametersMap };
      const rawParams: CompanyParameter[] = [];
      
      (data || []).forEach((p: any) => {
        const category = p.category as string;
        if (VALID_CATEGORIES.includes(category as ParameterCategory)) {
          const validCategory = category as ParameterCategory;
          params[validCategory][p.parameter_key] = p.parameter_value;
          rawParams.push({
            id: p.id,
            company_id: p.company_id,
            category: validCategory,
            parameter_key: p.parameter_key,
            parameter_value: p.parameter_value,
            source_agent_code: p.source_agent_code,
            source_execution_id: p.source_execution_id,
            version: p.version,
            is_current: p.is_current,
            updated_at: p.updated_at,
          });
        }
      });

      setParameters(params);
      setRawParameters(rawParams);
    } catch (err) {
      console.error('Error loading company parameters:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadParameters();
  }, [loadParameters]);

  const getParameter = useCallback((category: ParameterCategory, key: string): any => {
    return parameters[category]?.[key] ?? null;
  }, [parameters]);

  const getParametersByCategory = useCallback((category: ParameterCategory): Record<string, any> => {
    return parameters[category] || {};
  }, [parameters]);

  const getParameterWithMeta = useCallback((key: string): CompanyParameter | null => {
    return rawParameters.find(p => p.parameter_key === key) || null;
  }, [rawParameters]);

  return {
    parameters,
    rawParameters,
    loading,
    error,
    refetch: loadParameters,
    getParameter,
    getParametersByCategory,
    getParameterWithMeta,
  };
};
