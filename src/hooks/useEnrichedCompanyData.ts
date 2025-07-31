import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnrichedCompanyData {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  industry_sector?: string;
  company_size?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  // Campos enriquecidos del webhook
  descripcion_empresa?: string;
  industria_principal?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  webhook_data?: any;
  webhook_processed_at?: string;
  created_at: string;
  updated_at: string;
}

export const useEnrichedCompanyData = (companyId?: string) => {
  const [companyData, setCompanyData] = useState<EnrichedCompanyData | null>(null);
  const [countryData, setCountryData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrichedCompanyData = async (id: string) => {
    try {
      console.log('🔍 fetchEnrichedCompanyData called with id:', id);
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error fetching enriched company data:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log('✅ Company data fetched:', data);
      setCompanyData(data);
      
      // Obtener información del país del usuario principal de la empresa
      const { data: memberData } = await supabase
        .from('company_members')
        .select('user_id')
        .eq('company_id', id)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (memberData?.user_id) {
        const { data: countryInfo } = await supabase
          .from('profiles')
          .select('country')
          .eq('user_id', memberData.user_id)
          .maybeSingle();
        
        if (countryInfo?.country) {
          setCountryData(countryInfo.country);
        }
      }
    } catch (err: any) {
      console.error('Error in fetchEnrichedCompanyData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompanyData = () => {
    if (companyId) {
      fetchEnrichedCompanyData(companyId);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchEnrichedCompanyData(companyId);
    } else {
      setLoading(false);
    }
  }, [companyId]);

  const getSocialMediaLinks = () => {
    if (!companyData) return [];
    
    const socialLinks = [];
    
    if (companyData.facebook_url) {
      socialLinks.push({
        platform: 'Facebook',
        url: companyData.facebook_url,
        icon: 'Facebook'
      });
    }
    
    if (companyData.twitter_url) {
      socialLinks.push({
        platform: 'Twitter',
        url: companyData.twitter_url,
        icon: 'Twitter'
      });
    }
    
    if (companyData.linkedin_url) {
      socialLinks.push({
        platform: 'LinkedIn',
        url: companyData.linkedin_url,
        icon: 'Linkedin'
      });
    }
    
    if (companyData.instagram_url) {
      socialLinks.push({
        platform: 'Instagram',
        url: companyData.instagram_url,
        icon: 'Instagram'
      });
    }
    
    return socialLinks;
  };

  const isDataEnriched = () => {
    return companyData?.webhook_processed_at != null;
  };

  const getEnrichmentStatus = () => {
    if (!companyData) return 'not_loaded';
    if (companyData.webhook_processed_at) return 'enriched';
    return 'pending';
  };

  return {
    companyData,
    countryData,
    loading,
    error,
    refreshCompanyData,
    getSocialMediaLinks,
    isDataEnriched,
    getEnrichmentStatus
  };
};