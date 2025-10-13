import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para verificar automáticamente la completitud de cada paso del tour
 */
export const useStepVerifications = (userId: string) => {
  
  // Paso 1: Verificar que existan datos completos en ADN Empresa
  const verifyCompanyProfile = async (): Promise<boolean> => {
    try {
      // Obtener la empresa principal del usuario desde company_members
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (memberError || !memberData) {
        console.log('No primary company found for user');
        return false;
      }

      // Verificar que la empresa tenga información básica
      const { data, error } = await supabase
        .from('companies')
        .select('name, description, website_url, industry_sector')
        .eq('id', memberData.company_id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Debe tener al menos nombre y descripción o industria
      return !!(data?.name && (data?.description || data?.industry_sector));
    } catch (error) {
      console.error('Error verifying company profile:', error);
      return false;
    }
  };

  // Paso 2: Verificar que exista al menos 1 conexión de red social
  const verifySocialConnections = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_connected')
        .eq('user_id', userId)
        .eq('is_connected', true);
      
      if (error) throw error;
      
      // Filtrar plataformas reales (excluir upload_post_profile)
      const realConnections = (data || []).filter(
        (acc: any) => acc.platform !== 'upload_post_profile'
      );
      
      return realConnections.length > 0;
    } catch (error) {
      console.error('Error verifying social connections:', error);
      return false;
    }
  };

  // Paso 3: Verificar que existan URLs configuradas en social_accounts
  const verifySocialURLs = async (): Promise<{
    isComplete: boolean;
    configured: number;
    total: number;
    missing: string[];
  }> => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, platform_username, is_connected')
        .eq('user_id', userId)
        .eq('is_connected', true);
      
      if (error) throw error;
      
      // Filtrar plataformas reales (excluir upload_post_profile)
      const realConnections = (data || []).filter(
        (acc: any) => acc.platform !== 'upload_post_profile'
      );
      
      // Contar URLs configuradas
      const withUrls = realConnections.filter(
        (acc: any) => acc.platform_username && acc.platform_username.trim() !== ''
      );
      
      // Identificar plataformas faltantes
      const missing = realConnections
        .filter((acc: any) => !acc.platform_username || acc.platform_username.trim() === '')
        .map((acc: any) => acc.platform);
      
      return {
        isComplete: withUrls.length > 0,
        configured: withUrls.length,
        total: realConnections.length,
        missing
      };
    } catch (error) {
      console.error('Error verifying social URLs:', error);
      return { isComplete: false, configured: 0, total: 0, missing: [] };
    }
  };

  // Paso 4: Verificar que exista análisis de audiencia
  const verifyAudienceAnalysis = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('social_analysis')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying audience analysis:', error);
      return false;
    }
  };

  // Paso 5: Verificar que exista análisis de contenido
  const verifyContentAnalysis = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('social_content_analysis')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying content analysis:', error);
      return false;
    }
  };

  // Paso 6: Verificar que existan segmentos de audiencia creados
  const verifyBuyerPersonas = async (): Promise<boolean> => {
    try {
      // Verificar segmentos de audiencia en company_audiences
      const { data, error } = await supabase
        .from('company_audiences')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);
      
      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying audience segments:', error);
      return false;
    }
  };

  // Paso 7: Verificar que exista al menos 1 campaña creada
  const verifyCampaignCreated = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying campaigns:', error);
      return false;
    }
  };

  // Paso 8: Verificar que exista contenido generado
  const verifyContentGenerated = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      if (error) throw error;
      
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error verifying generated content:', error);
      return false;
    }
  };

  // Paso 9: No requiere verificación automática (visita al marketplace)
  const verifyMarketplaceVisit = async (): Promise<boolean> => {
    // Este paso se marca manualmente al visitar la sección
    return false;
  };

  return {
    verifyCompanyProfile,
    verifySocialConnections,
    verifySocialURLs,
    verifyAudienceAnalysis,
    verifyContentAnalysis,
    verifyBuyerPersonas,
    verifyCampaignCreated,
    verifyContentGenerated,
    verifyMarketplaceVisit
  };
};
