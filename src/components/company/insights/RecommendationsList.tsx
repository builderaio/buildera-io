import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, 
  Clock, 
  MessageSquare, 
  TrendingUp, 
  Megaphone,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

interface Recommendation {
  tipo: string;
  prioridad: 'alta' | 'media' | 'baja';
  titulo: string;
  descripcion: string;
  accion_especifica: string;
  segmento_objetivo?: string;
  impacto_esperado?: string;
  metricas_seguimiento?: string[];
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
  onApply?: (recommendation: Recommendation) => void;
}

export const RecommendationsList = ({ 
  recommendations,
  onApply 
}: RecommendationsListProps) => {
  const getTypeIcon = (tipo: string) => {
    const lowerTipo = tipo.toLowerCase();
    if (lowerTipo.includes('contenido') || lowerTipo.includes('content')) return MessageSquare;
    if (lowerTipo.includes('timing') || lowerTipo.includes('horario')) return Clock;
    if (lowerTipo.includes('targeting') || lowerTipo.includes('audiencia')) return Target;
    if (lowerTipo.includes('canal') || lowerTipo.includes('channel')) return Megaphone;
    return TrendingUp;
  };

  const getPriorityConfig = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return { color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', label: 'Alta Prioridad' };
      case 'media':
        return { color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', label: 'Media Prioridad' };
      case 'baja':
        return { color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Baja Prioridad' };
      default:
        return { color: 'bg-primary/10 text-primary border-primary/20', label: 'Prioridad Normal' };
    }
  };

  // Ordenar por prioridad
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { 'alta': 0, 'media': 1, 'baja': 2 };
    return priorityOrder[a.prioridad] - priorityOrder[b.prioridad];
  });

  return (
    <div className="space-y-4">
      {sortedRecommendations.map((rec, idx) => {
        const Icon = getTypeIcon(rec.tipo);
        const priorityConfig = getPriorityConfig(rec.prioridad);

        return (
          <Card key={idx} className={`p-4 border-l-4 ${priorityConfig.color}`}>
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground">{rec.titulo}</h4>
                      <Badge className={`text-xs ${priorityConfig.color}`}>
                        {priorityConfig.label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.tipo}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {rec.descripcion}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acción específica */}
              <div className="pl-11 space-y-2">
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-xs font-medium text-foreground mb-1">
                    Acción recomendada:
                  </p>
                  <p className="text-sm text-foreground">
                    {rec.accion_especifica}
                  </p>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {rec.segmento_objetivo && (
                    <div className="flex items-start gap-2">
                      <Target className="h-3 w-3 mt-0.5 text-primary" />
                      <div>
                        <span className="font-medium text-foreground">Segmento:</span>{' '}
                        <span className="text-muted-foreground">{rec.segmento_objetivo}</span>
                      </div>
                    </div>
                  )}
                  
                  {rec.impacto_esperado && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 mt-0.5 text-primary" />
                      <div>
                        <span className="font-medium text-foreground">Impacto:</span>{' '}
                        <span className="text-muted-foreground">{rec.impacto_esperado}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Métricas de seguimiento */}
                {rec.metricas_seguimiento && rec.metricas_seguimiento.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Métricas para medir:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rec.metricas_seguimiento.map((metrica, mIdx) => (
                        <Badge key={mIdx} variant="secondary" className="text-xs">
                          {metrica}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botón de acción */}
                {onApply && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onApply(rec)}
                    className="w-full mt-2"
                  >
                    Aplicar recomendación
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
