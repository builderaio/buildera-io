import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InsightCard } from "./InsightCard";
import { InsightsFilters } from "./InsightsFilters";
import { DismissInsightDialog } from "./DismissInsightDialog";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface Insight {
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
  dismissed_reason?: string;
}

interface InsightsManagerProps {
  userId: string;
  onCreateContent?: (insight: any) => void;
  onGenerateMore?: () => void;
  isGenerating?: boolean;
  newInsightsIds?: string[];
}

export const InsightsManager = ({
  userId,
  onCreateContent,
  onGenerateMore,
  isGenerating,
  newInsightsIds = []
}: InsightsManagerProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('active');
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [insightToDismiss, setInsightToDismiss] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      
      // Cast the data to match our Insight interface
      const typedData = (data || []).map(item => ({
        ...item,
        insight_type: item.insight_type as 'audience' | 'content_idea',
        status: item.status as 'active' | 'completed' | 'dismissed' | 'archived'
      }));
      
      setInsights(typedData);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los insights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [userId]);

  useEffect(() => {
    let filtered = insights;

    switch (activeFilter) {
      case 'active':
        filtered = insights.filter(i => i.status === 'active');
        break;
      case 'completed':
        filtered = insights.filter(i => i.status === 'completed');
        break;
      case 'dismissed':
        filtered = insights.filter(i => i.status === 'dismissed');
        break;
      case 'audience':
        filtered = insights.filter(i => i.insight_type === 'audience');
        break;
      case 'content_ideas':
        filtered = insights.filter(i => i.insight_type === 'content_idea');
        break;
      default:
        filtered = insights;
    }

    setFilteredInsights(filtered);
  }, [insights, activeFilter]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleComplete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_insights')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      triggerConfetti();
      toast({
        title: "¡Excelente!",
        description: "Insight marcado como completado",
      });

      loadInsights();
    } catch (error) {
      console.error('Error completing insight:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el insight",
        variant: "destructive"
      });
    }
  };

  const handleDismiss = (id: string) => {
    setInsightToDismiss(id);
    setDismissDialogOpen(true);
  };

  const confirmDismiss = async (reason: string) => {
    if (!insightToDismiss) return;

    try {
      const { error } = await supabase
        .from('content_insights')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          dismissed_reason: reason
        })
        .eq('id', insightToDismiss);

      if (error) throw error;

      toast({
        title: "Insight descartado",
        description: "Gracias por tu feedback",
      });

      setDismissDialogOpen(false);
      setInsightToDismiss(null);
      loadInsights();
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast({
        title: "Error",
        description: "No se pudo descartar el insight",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_insights')
        .update({
          status: 'active',
          completed_at: null,
          dismissed_at: null,
          dismissed_reason: null
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Insight restaurado",
        description: "El insight está activo nuevamente",
      });

      loadInsights();
    } catch (error) {
      console.error('Error restoring insight:', error);
      toast({
        title: "Error",
        description: "No se pudo restaurar el insight",
        variant: "destructive"
      });
    }
  };

  const counts = {
    all: insights.length,
    active: insights.filter(i => i.status === 'active').length,
    completed: insights.filter(i => i.status === 'completed').length,
    dismissed: insights.filter(i => i.status === 'dismissed').length,
    audience: insights.filter(i => i.insight_type === 'audience').length,
    content_ideas: insights.filter(i => i.insight_type === 'content_idea').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Gestión de Insights</h2>
          {onGenerateMore && (
            <Button
              onClick={onGenerateMore}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-accent"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar Más Insights
                </>
              )}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Insights</span>
            </div>
            <p className="text-3xl font-bold animate-counter">{counts.all}</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Activos</span>
            </div>
            <p className="text-3xl font-bold text-blue-500 animate-counter">{counts.active}</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Completados</span>
            </div>
            <p className="text-3xl font-bold text-green-500 animate-counter">{counts.completed}</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">Tasa de Conversión</span>
            </div>
            <p className="text-3xl font-bold text-accent animate-counter">
              {counts.all > 0 ? Math.round((counts.completed / counts.all) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <InsightsFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-12 bg-card/30 rounded-lg border-2 border-dashed">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No hay insights {activeFilter !== 'all' ? `${activeFilter}s` : ''}</h3>
            <p className="text-muted-foreground">
              {activeFilter === 'active' && "Genera nuevos insights para comenzar"}
              {activeFilter === 'completed' && "Aún no has completado ningún insight"}
              {activeFilter === 'dismissed' && "No has descartado ningún insight"}
            </p>
          </div>
        ) : (
          filteredInsights.map((insight, index) => (
            <div
              key={insight.id}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <InsightCard
                insight={insight}
                isNew={newInsightsIds.includes(insight.id)}
                onComplete={handleComplete}
                onDismiss={handleDismiss}
                onRestore={handleRestore}
                onCreateContent={onCreateContent}
              />
            </div>
          ))
        )}
      </div>

      <DismissInsightDialog
        open={dismissDialogOpen}
        onOpenChange={setDismissDialogOpen}
        onConfirm={confirmDismiss}
      />
    </div>
  );
};
