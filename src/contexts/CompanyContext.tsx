import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  industry_sector?: string;
  company_size?: string;
  country?: string;
  propuesta_valor?: string;
  target_market?: string;
  pain_points?: string[];
  valores_empresa?: string[];
  vision?: string;
  mision?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
}

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPrimaryCompany = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCompany(null);
        setLoading(false);
        return;
      }

      // Fetch primary company for the user
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select(`
          is_primary,
          companies (
            id,
            name,
            description,
            logo_url,
            website_url,
            industry_sector,
            company_size,
            country,
            facebook_url,
            instagram_url,
            linkedin_url,
            twitter_url,
            tiktok_url,
            youtube_url,
            company_strategy (
              propuesta_valor,
              target_market,
              pain_points,
              valores_empresa,
              vision,
              mision
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (memberError) throw memberError;

      if (memberData?.companies) {
        const companyBase = memberData.companies as any;
        const strategy = companyBase.company_strategy?.[0];
        
        const mergedCompany: Company = {
          id: companyBase.id,
          name: companyBase.name,
          description: companyBase.description,
          logo_url: companyBase.logo_url,
          website_url: companyBase.website_url,
          industry_sector: companyBase.industry_sector,
          company_size: companyBase.company_size,
          country: companyBase.country,
          facebook_url: companyBase.facebook_url,
          instagram_url: companyBase.instagram_url,
          linkedin_url: companyBase.linkedin_url,
          twitter_url: companyBase.twitter_url,
          tiktok_url: companyBase.tiktok_url,
          youtube_url: companyBase.youtube_url,
          ...strategy
        };

        console.log('🏢 [CompanyContext] Primary company loaded:', {
          id: mergedCompany.id,
          name: mergedCompany.name,
          hasStrategy: !!strategy
        });

        setCompany(mergedCompany);
      } else {
        setCompany(null);
      }
    } catch (err: any) {
      console.error('❌ [CompanyContext] Error fetching company:', err);
      setError(err.message || 'Error al cargar empresa');
      toast({
        title: 'Error al cargar empresa',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrimaryCompany();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPrimaryCompany();
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshCompany = async () => {
    await fetchPrimaryCompany();
  };

  return (
    <CompanyContext.Provider value={{ company, loading, error, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
