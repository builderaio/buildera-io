import { supabase } from "@/integrations/supabase/client";

export const useWelcomeEmail = () => {
  const sendWelcomeEmail = async (email: string, name: string, userType: 'developer' | 'expert' | 'company') => {
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          name,
          userType
        }
      });

      if (error) {
        console.error('Error enviando email de bienvenida:', error);
        return { success: false, error };
      }

      console.log('Email de bienvenida enviado correctamente:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      return { success: false, error };
    }
  };

  return { sendWelcomeEmail };
};