import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseCompanyAgentProps {
  user: any;
  enabled?: boolean;
}

export const useCompanyAgent = ({ user, enabled = true }: UseCompanyAgentProps) => {
  const updateCompanyAgent = useCallback(async () => {
    if (!user?.user_id || !enabled) return;

    try {
      // Obtener empresa principal del usuario
      const { data: userCompany } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.user_id)
        .eq('is_primary', true)
        .single();

      if (userCompany) {
        // Actualizar el agente con la información más reciente
        await supabase.functions.invoke('create-company-agent', {
          body: {
            user_id: user.user_id,
            company_id: userCompany.company_id
          }
        });
        
        console.log('Company agent updated successfully');
        return userCompany; // Retornar para uso en realtime listeners
      }
    } catch (error) {
      console.error('Error updating company agent:', error);
      return null;
    }
  }, [user?.user_id, enabled]);

  const triggerAgentUpdate = useCallback(() => {
    updateCompanyAgent();
  }, [updateCompanyAgent]);

  // DISABLED: Este hook estaba causando loops infinitos llamando constantemente a create-company-agent
  // Los listeners de realtime han sido deshabilitados para prevenir llamadas excesivas al API gateway
  // TODO: Implementar un mecanismo de debounce más robusto o mover esta lógica al backend
  
  useEffect(() => {
    // Solo ejecutar una actualización inicial del agente
    if (user?.user_id && enabled) {
      console.log('[useCompanyAgent] Initial agent update on mount');
      updateCompanyAgent();
    }
  }, [user?.user_id, enabled, updateCompanyAgent]);

  return {
    updateCompanyAgent: triggerAgentUpdate
  };
};