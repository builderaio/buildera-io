import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFirstTimeSave = (userId: string | undefined) => {
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [hasTriggeredWebhook, setHasTriggeredWebhook] = useState(false);

  const triggerWebhookOnFirstSave = useCallback(async (companyName: string, websiteUrl?: string, country?: string) => {
    if (!userId || !isFirstSave || hasTriggeredWebhook) {
      return;
    }

    try {
      console.log("🔗 Ejecutando webhook para primera vez guardando cambios (registro social)");
      
      await supabase.functions.invoke('process-company-webhooks', {
        body: {
          user_id: userId,
          company_name: companyName,
          website_url: websiteUrl || '',
          country: country,
          trigger_type: 'first_save_social'
        }
      });
      
      console.log("✅ Webhook de primer guardado enviado exitosamente");
      setHasTriggeredWebhook(true);
      setIsFirstSave(false);
    } catch (error) {
      console.error("❌ Error enviando webhook de primer guardado:", error);
      // No bloquear el guardado si falla el webhook
    }
  }, [userId, isFirstSave, hasTriggeredWebhook]);

  const markAsNotFirstSave = useCallback(() => {
    setIsFirstSave(false);
  }, []);

  return {
    isFirstSave,
    triggerWebhookOnFirstSave,
    markAsNotFirstSave
  };
};