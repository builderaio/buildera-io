import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranslatedContent } from "@/components/company/TranslatedContent";
import { useTranslation } from "react-i18next";
import { Brain, Lightbulb } from "lucide-react";

interface TranslatedInsightCardProps {
  title: string;
  content: string;
  category?: string;
  type: 'audience' | 'content';
  priority?: 'alta' | 'media' | 'baja';
  sourceLanguage?: 'es' | 'en' | 'pt';
}

/**
 * InsightCard component with automatic translation support
 * 
 * Usage:
 * ```tsx
 * <TranslatedInsightCard
 *   title="Insight Title"
 *   content="Insight content in Spanish"
 *   type="audience"
 *   sourceLanguage="es"
 * />
 * ```
 */
export const TranslatedInsightCard = ({
  title,
  content,
  category,
  type,
  priority,
  sourceLanguage = 'es'
}: TranslatedInsightCardProps) => {
  const { t } = useTranslation('marketing');

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'baja': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const Icon = type === 'audience' ? Brain : Lightbulb;

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold flex-1">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <TranslatedContent
              content={title}
              sourceLanguage={sourceLanguage}
              contentType="insight"
              className="flex-1"
            />
          </CardTitle>
          {priority && (
            <Badge className={`text-xs ${getPriorityColor(priority)}`}>
              {t('insights.priority.label')} {t(`insights.priority.${priority}`)}
            </Badge>
          )}
        </div>
        {category && (
          <Badge variant="outline" className="text-xs w-fit">
            {category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <TranslatedContent
          content={content}
          sourceLanguage={sourceLanguage}
          contentType="insight"
          className="text-sm text-muted-foreground leading-relaxed"
        />
      </CardContent>
    </Card>
  );
};
