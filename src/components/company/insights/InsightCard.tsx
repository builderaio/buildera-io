import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Sparkles, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InsightCardProps {
  insight: {
    id: string;
    insight_type: 'audience' | 'content_idea';
    title: string;
    content?: string;
    strategy?: string;
    format?: string;
    platform?: string;
    hashtags?: string[];
    timing?: string;
    status: 'active' | 'completed' | 'dismissed' | 'archived';
    generated_at: string;
    completed_at?: string;
    dismissed_at?: string;
  };
  isNew?: boolean;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  onCreateContent?: (insight: any) => void;
  hideRestoreButton?: boolean;
}

// Mapeo de formatos a términos claros en español
const formatLabels: Record<string, string> = {
  'image': '🎨 Gráfico/Infografía',
  'photo': '📸 Fotografía',
  'video': '🎥 Video',
  'text': '📝 Publicación de texto',
  'post': '📱 Post',
  'reel': '🎬 Reel',
  'story': '⭐ Historia',
  'carousel': '🎠 Carrusel',
  'article': '📄 Artículo',
  'infographic': '📊 Infografía',
  'gif': '🎞️ GIF animado',
  'poll': '📊 Encuesta',
  'live': '🔴 Transmisión en vivo'
};

export const InsightCard = ({
  insight,
  isNew,
  onComplete,
  onDismiss,
  onRestore,
  onCreateContent,
  hideRestoreButton = false
}: InsightCardProps) => {
  const isAudience = insight.insight_type === 'audience';
  const isActive = insight.status === 'active';
  const isCompleted = insight.status === 'completed';
  const isDismissed = insight.status === 'dismissed';

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-500/10 border-green-500/20';
    if (isDismissed) return 'bg-gray-500/10 border-gray-500/20';
    return 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20';
  };

  const getStatusBadge = () => {
    if (isCompleted) return { label: 'Completado', variant: 'default' as const, icon: Check };
    if (isDismissed) return { label: 'Descartado', variant: 'secondary' as const, icon: X };
    if (isNew) return { label: 'NUEVO', variant: 'default' as const, icon: Sparkles };
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <Card 
      className={`p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${getStatusColor()} ${
        isNew ? 'animate-slide-up-fade' : 'animate-fade-in'
      } ${isActive ? 'border-l-4 border-l-primary' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${isAudience ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
            {isAudience ? (
              <TrendingUp className="w-5 h-5 text-blue-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-500" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{insight.title}</h3>
              {statusBadge && (
                <Badge variant={statusBadge.variant} className="animate-bounce-subtle">
                  <statusBadge.icon className="w-3 h-3 mr-1" />
                  {statusBadge.label}
                </Badge>
              )}
            </div>
            {insight.content && (
              <p className="text-sm text-muted-foreground mb-3">{insight.content}</p>
            )}
            {insight.strategy && (
              <div className="bg-accent/20 rounded-lg p-3 mb-3">
                <p className="text-sm"><strong>Estrategia:</strong> {insight.strategy}</p>
              </div>
            )}
            {!isAudience && (
              <div className="flex flex-wrap gap-2 mb-3">
                {insight.format && (
                  <Badge variant="outline" className="font-medium">
                    {formatLabels[insight.format.toLowerCase()] || insight.format}
                  </Badge>
                )}
                {insight.platform && (
                  <Badge variant="outline" className="capitalize">{insight.platform}</Badge>
                )}
                {insight.timing && (
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {insight.timing}
                  </Badge>
                )}
              </div>
            )}
            {insight.hashtags && insight.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {insight.hashtags.map((tag, idx) => (
                  <span key={idx} className="text-xs text-primary">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                Generado {format(new Date(insight.generated_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {isActive && (
          <>
            {!isAudience && onCreateContent && (
              <Button
                size="sm"
                onClick={() => onCreateContent(insight)}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Crear Ahora
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(insight.id)}
              className="hover:bg-green-500/10 hover:border-green-500"
            >
              <Check className="w-4 h-4 mr-2" />
              Marcar Completado
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss(insight.id)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Descartar
            </Button>
          </>
        )}
        {(isCompleted || isDismissed) && !hideRestoreButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(insight.id)}
            className="hover:bg-primary/10 hover:border-primary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar
          </Button>
        )}
      </div>
    </Card>
  );
};
