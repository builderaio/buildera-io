import { useEffect, useState } from 'react';
import { useContentTranslation } from '@/hooks/useContentTranslation';
import { Loader2 } from 'lucide-react';

interface TranslatedContentProps {
  content: string | string[];
  sourceLanguage?: 'es' | 'en' | 'pt';
  contentType?: 'insight' | 'strategy' | 'post' | 'general';
  className?: string;
  fallbackToOriginal?: boolean;
  renderContent?: (content: string | string[]) => React.ReactNode;
}

/**
 * Component that automatically translates content based on user's language preference
 * 
 * Usage:
 * ```tsx
 * // Simple text translation
 * <TranslatedContent 
 *   content="Este es un insight de marketing" 
 *   contentType="insight"
 * />
 * 
 * // Array of texts
 * <TranslatedContent 
 *   content={['Insight 1', 'Insight 2']} 
 *   contentType="insight"
 * />
 * 
 * // Custom rendering
 * <TranslatedContent 
 *   content="Marketing strategy"
 *   contentType="strategy"
 *   renderContent={(translated) => (
 *     <div className="custom-class">{translated}</div>
 *   )}
 * />
 * ```
 */
export const TranslatedContent = ({
  content,
  sourceLanguage = 'es',
  contentType = 'general',
  className = '',
  fallbackToOriginal = true,
  renderContent
}: TranslatedContentProps) => {
  const { translateContent, isTranslating, currentLanguage } = useContentTranslation();
  const [translatedContent, setTranslatedContent] = useState<string | string[] | null>(null);

  useEffect(() => {
    const translate = async () => {
      // Si el idioma actual es el mismo que el origen, usar el contenido original
      if (currentLanguage === sourceLanguage) {
        setTranslatedContent(content);
        return;
      }

      const result = await translateContent(content, {
        sourceLanguage,
        contentType,
        useCache: true
      });

      if (result) {
        setTranslatedContent(result);
      } else if (fallbackToOriginal) {
        setTranslatedContent(content);
      }
    };

    translate();
  }, [content, sourceLanguage, contentType, currentLanguage, translateContent, fallbackToOriginal]);

  if (isTranslating && !translatedContent) {
    return (
      <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Traduciendo...</span>
      </div>
    );
  }

  const displayContent = translatedContent || content;

  if (renderContent) {
    return <>{renderContent(displayContent)}</>;
  }

  // Renderizado por defecto
  if (Array.isArray(displayContent)) {
    return (
      <div className={className}>
        {displayContent.map((item, index) => (
          <div key={index} className="mb-2">
            {item}
          </div>
        ))}
      </div>
    );
  }

  return <div className={className}>{displayContent}</div>;
};
