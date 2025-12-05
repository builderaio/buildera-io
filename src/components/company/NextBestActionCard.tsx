import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Clock, TrendingUp } from "lucide-react";
import { NextBestAction, NBAPriority } from "@/hooks/useNextBestAction";
import { motion } from "framer-motion";

interface NextBestActionCardProps {
  action: NextBestAction;
  onAction: (view: string) => void;
  featured?: boolean;
}

const priorityStyles: Record<NBAPriority, { bg: string; border: string; badge: string }> = {
  critical: {
    bg: 'from-red-500/10 to-orange-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500',
  },
  high: {
    bg: 'from-amber-500/10 to-yellow-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500',
  },
  medium: {
    bg: 'from-blue-500/10 to-cyan-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500',
  },
  low: {
    bg: 'from-slate-500/10 to-gray-500/10',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500',
  },
};

const priorityLabels: Record<NBAPriority, string> = {
  critical: 'Urgente',
  high: 'Importante',
  medium: 'Recomendado',
  low: 'Sugerencia',
};

export const NextBestActionCard = ({ action, onAction, featured = false }: NextBestActionCardProps) => {
  const styles = priorityStyles[action.priority];

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className={`overflow-hidden bg-gradient-to-br ${styles.bg} ${styles.border} border-2`}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center text-2xl shadow-lg shrink-0">
                  {action.icon}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${styles.badge} text-white`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {priorityLabels[action.priority]}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold">{action.title}</h3>
                  <p className="text-muted-foreground">{action.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {action.estimatedImpact}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {action.requiredTime}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                className="shrink-0"
                onClick={() => action.action.view && onAction(action.action.view)}
              >
                {action.action.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div 
      className={`
        flex items-center gap-3 p-3 rounded-lg border cursor-pointer
        transition-all duration-200 hover:shadow-md
        bg-gradient-to-r ${styles.bg} ${styles.border}
      `}
      onClick={() => action.action.view && onAction(action.action.view)}
    >
      <div className="w-10 h-10 rounded-lg bg-background/80 flex items-center justify-center text-lg shrink-0">
        {action.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{action.title}</p>
        <p className="text-xs text-muted-foreground truncate">{action.estimatedImpact}</p>
      </div>
      <Badge variant="outline" className="shrink-0 text-xs">
        {action.requiredTime}
      </Badge>
    </div>
  );
};

interface RecommendationsListProps {
  actions: NextBestAction[];
  onAction: (view: string) => void;
  maxItems?: number;
}

export const RecommendationsList = ({ actions, onAction, maxItems = 4 }: RecommendationsListProps) => {
  const displayActions = actions.slice(0, maxItems);

  if (displayActions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="font-medium">¡Todo en orden!</p>
        <p className="text-sm text-muted-foreground">No hay acciones pendientes por ahora</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayActions.map((action) => (
        <NextBestActionCard key={action.id} action={action} onAction={onAction} />
      ))}
    </div>
  );
};
