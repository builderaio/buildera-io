import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface InsightCardProps {
  categoria: string;
  insight: string;
  evidencia?: string;
  implicacion?: string;
  prioridad?: 'alta' | 'media' | 'baja';
}

export const InsightsCard = ({ 
  categoria, 
  insight, 
  evidencia, 
  implicacion,
  prioridad 
}: InsightCardProps) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'media': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'baja': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const getCategoryIcon = (cat: string) => {
    const lowerCat = cat.toLowerCase();
    if (lowerCat.includes('tendencia') || lowerCat.includes('trend')) return TrendingUp;
    if (lowerCat.includes('alerta') || lowerCat.includes('warning')) return AlertCircle;
    if (lowerCat.includes('oportunidad') || lowerCat.includes('opportunity')) return CheckCircle2;
    return Lightbulb;
  };

  const Icon = getCategoryIcon(categoria);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xs">
              {categoria}
            </Badge>
            {prioridad && (
              <Badge className={`text-xs ${getPriorityColor(prioridad)}`}>
                Prioridad {prioridad}
              </Badge>
            )}
          </div>
          
          <p className="text-sm font-medium text-foreground">
            {insight}
          </p>
          
          {evidencia && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Evidencia:</span> {evidencia}
            </p>
          )}
          
          {implicacion && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Implicación:</span> {implicacion}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
