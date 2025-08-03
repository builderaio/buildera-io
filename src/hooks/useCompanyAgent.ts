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
      }
    } catch (error) {
      console.error('Error updating company agent:', error);
    }
  }, [user?.user_id, enabled]);

  const triggerAgentUpdate = useCallback(() => {
    updateCompanyAgent();
  }, [updateCompanyAgent]);

  // Escuchar cambios en las tablas relevantes
  useEffect(() => {
    if (!user?.user_id || !enabled) return;

    const channels: any[] = [];

    // Escuchar cambios en la estrategia empresarial
    const strategyChannel = supabase
      .channel('company_strategy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_strategy',
          filter: `user_id=eq.${user.user_id}`
        },
        () => {
          console.log('Company strategy changed, updating agent...');
          setTimeout(updateCompanyAgent, 1000); // Delay para asegurar que los datos estén actualizados
        }
      )
      .subscribe();

    channels.push(strategyChannel);

    // Escuchar cambios en el branding
    const brandingChannel = supabase
      .channel('company_branding_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_branding',
          filter: `user_id=eq.${user.user_id}`
        },
        () => {
          console.log('Company branding changed, updating agent...');
          setTimeout(updateCompanyAgent, 1000);
        }
      )
      .subscribe();

    channels.push(brandingChannel);

    // Escuchar cambios en los objetivos
    const objectivesChannel = supabase
      .channel('company_objectives_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'company_objectives',
          filter: `user_id=eq.${user.user_id}`
        },
        () => {
          console.log('Company objectives changed, updating agent...');
          setTimeout(updateCompanyAgent, 1000);
        }
      )
      .subscribe();

    channels.push(objectivesChannel);

    // Escuchar cambios en la información de la empresa
    const companyChannel = supabase
      .channel('companies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies'
        },
        (payload) => {
          // Verificar si el usuario es miembro de esta empresa
          if (payload.new && (payload.new as any).created_by === user.user_id) {
            console.log('Company information changed, updating agent...');
            setTimeout(updateCompanyAgent, 1000);
          }
        }
      )
      .subscribe();

    channels.push(companyChannel);

    // Limpiar suscripciones al desmontar
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.user_id, enabled, updateCompanyAgent]);

  return {
    updateCompanyAgent: triggerAgentUpdate
  };
};