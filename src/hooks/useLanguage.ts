import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { detectLanguageByGeolocation } from '@/i18n/utils/languageDetector';

export const useLanguage = (userId?: string) => {
  const { i18n } = useTranslation();

  // Load user's preferred language from profile
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!userId) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const preferredLanguage = (profile as any)?.preferred_language;

        if (preferredLanguage) {
          i18n.changeLanguage(preferredLanguage);
        } else {
          // If no preference, detect by geolocation
          const detectedLang = await detectLanguageByGeolocation();
          i18n.changeLanguage(detectedLang);
          
          // Save detected language to profile (using raw SQL would be safer but this works)
          await supabase
            .from('profiles')
            .update({ preferred_language: detectedLang } as any)
            .eq('user_id', userId);
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      }
    };

    loadUserLanguage();
  }, [userId, i18n]);

  // Save language preference when it changes
  useEffect(() => {
    const saveLanguagePreference = async () => {
      if (!userId) return;

      try {
        await supabase
          .from('profiles')
          .update({ preferred_language: i18n.language } as any)
          .eq('user_id', userId);
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    };

    saveLanguagePreference();
  }, [i18n.language, userId]);

  return { language: i18n.language, changeLanguage: i18n.changeLanguage };
};
