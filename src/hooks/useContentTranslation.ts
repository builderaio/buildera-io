import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ContentType = 'insight' | 'strategy' | 'post' | 'general';
type Language = 'es' | 'en' | 'pt';

interface TranslationCache {
  [key: string]: string | string[];
}

export const useContentTranslation = () => {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);
  const [cache, setCache] = useState<TranslationCache>({});

  const getCacheKey = useCallback((
    content: string | string[],
    targetLang: Language,
    sourceLang: Language,
    type: ContentType
  ) => {
    const contentStr = Array.isArray(content) ? content.join('||') : content;
    return `${sourceLang}_${targetLang}_${type}_${contentStr.substring(0, 50)}`;
  }, []);

  const translateContent = useCallback(async (
    content: string | string[],
    options?: {
      sourceLanguage?: Language;
      contentType?: ContentType;
      useCache?: boolean;
    }
  ): Promise<string | string[] | null> => {
    const targetLanguage = i18n.language as Language;
    const sourceLanguage = options?.sourceLanguage || 'es';
    const contentType = options?.contentType || 'general';
    const useCache = options?.useCache !== false;

    // Si el idioma es el mismo, devolver el contenido original
    if (sourceLanguage === targetLanguage) {
      return content;
    }

    // Verificar cache
    const cacheKey = getCacheKey(content, targetLanguage, sourceLanguage, contentType);
    if (useCache && cache[cacheKey]) {
      console.log('Using cached translation');
      return cache[cacheKey];
    }

    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          content,
          targetLanguage,
          sourceLanguage,
          contentType
        }
      });

      if (error) {
        console.error('Translation error:', error);
        
        // Manejar errores específicos
        if (error.message?.includes('rate limit')) {
          toast({
            title: t('errors.rateLimitTitle'),
            description: t('errors.rateLimitDescription'),
            variant: 'destructive'
          });
        } else if (error.message?.includes('quota')) {
          toast({
            title: t('errors.quotaTitle'),
            description: t('errors.quotaDescription'),
            variant: 'destructive'
          });
        } else {
          toast({
            title: t('errors.translationError'),
            description: t('errors.translationErrorDescription'),
            variant: 'destructive'
          });
        }
        
        return null;
      }

      const translatedContent = data?.translatedContent;

      // Guardar en cache
      if (translatedContent && useCache) {
        setCache(prev => ({
          ...prev,
          [cacheKey]: translatedContent
        }));
      }

      return translatedContent || content;

    } catch (error) {
      console.error('Translation request failed:', error);
      toast({
        title: t('errors.translationError'),
        description: t('errors.translationErrorDescription'),
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [i18n.language, cache, getCacheKey, toast, t]);

  const clearCache = useCallback(() => {
    setCache({});
  }, []);

  return {
    translateContent,
    isTranslating,
    currentLanguage: i18n.language as Language,
    clearCache
  };
};
