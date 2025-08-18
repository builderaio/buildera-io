import { useState, useCallback } from 'react';
import { executeCompanyWebhooks } from '@/utils/webhookProcessor';

export const useFirstTimeSave = (userId: string | undefined) => {
  const [isFirstSave, setIsFirstSave] = useState(true);
  const [hasTriggeredWebhook, setHasTriggeredWebhook] = useState(false);

  const triggerWebhookOnFirstSave = useCallback(async (companyName: string, websiteUrl?: string, country?: string) => {
    if (!userId || !isFirstSave || hasTriggeredWebhook) {
      return;
    }

    try {
      console.log("🔗 Ejecutando webhooks para primera vez guardando cambios (registro social)");
      
      const result = await executeCompanyWebhooks(
        userId,
        companyName,
        websiteUrl || '',
        country,
        'first_save_social'
      );
      
      if (result.success) {
        console.log("✅ Webhooks de primer guardado ejecutados exitosamente");
      } else {
        console.error("❌ Error en webhooks de primer guardado:", result.error);
      }
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