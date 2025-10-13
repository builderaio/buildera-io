import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, Target, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InsightsCard } from "./insights/InsightsCard";
import { AudienceSegmentCard } from "./insights/AudienceSegmentCard";
import { RecommendationsList } from "./insights/RecommendationsList";

interface AudienceInsightsPanelProps {
  userId: string;
  companyId: string;
  socialStats: any;
  autoGenerate?: boolean;
  onInsightsGenerated?: () => void;
}

export const AudienceInsightsPanel = ({ 
  userId, 
  companyId, 
  socialStats,
  autoGenerate = false,
  onInsightsGenerated
}: AudienceInsightsPanelProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [hasCheckedAutoGenerate, setHasCheckedAutoGenerate] = useState(false);
  const { toast } = useToast();

  const generateAudienceInsights = async () => {
    setIsGenerating(true);
    try {
      console.log('🎯 Generating audience insights...');

      const { data, error } = await supabase.functions.invoke(
        'audience-intelligence-analysis',
        {
          body: {
            userId,
            companyId,
            socialStats,
          }
        }
      );

      if (error) throw error;

      setInsights(data.insights);
      
      toast({
        title: "✨ Insights generados",
        description: "El análisis de audiencia ha sido completado exitosamente.",
      });

      onInsightsGenerated?.();

    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error al generar insights",
        description: "No se pudieron generar los insights de audiencia. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('audience_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('insight_type', 'ai_generated')
        .order('last_ai_analysis_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const rawInsights = data.raw_insights as any;
        setInsights({
          audience_segments: data.audience_segments,
          key_insights: rawInsights?.key_insights || [],
          recommendations: data.ai_recommendations,
          detailed_analysis: data.ai_generated_insights,
        });
      }
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  // Cargar insights existentes y auto-generar si es necesario
  useEffect(() => {
    const init = async () => {
      await loadExistingInsights();
      
      // Si autoGenerate está activado y no hay insights, generar automáticamente
      if (autoGenerate && !insights && !hasCheckedAutoGenerate) {
        setHasCheckedAutoGenerate(true);
        console.log('Auto-generando insights...');
        await generateAudienceInsights();
      }
    };
    
    init();
  }, [userId, autoGenerate]);

  if (!insights) {
    return (
      <Card className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Genera Insights de Audiencia con IA
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Obtén un análisis profundo de tu audiencia, segmentos detallados y recomendaciones
            personalizadas basadas en IA.
          </p>
        </div>
        <Button
          onClick={generateAudienceInsights}
          disabled={isGenerating}
          size="lg"
          className="mx-auto"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Insights
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Análisis de Audiencia con IA
            </h3>
          </div>
          <Button
            onClick={generateAudienceInsights}
            disabled={isGenerating}
            size="sm"
            variant="outline"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {insights.audience_segments?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Segmentos</div>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {insights.key_insights?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Insights</div>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {insights.recommendations?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Acciones</div>
          </div>
        </div>
      </Card>

      {/* Tabs de contenido */}
      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Acciones</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.audience_segments?.map((segment: any, idx: number) => (
              <AudienceSegmentCard key={idx} {...segment} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          {insights.key_insights?.map((insight: any, idx: number) => (
            <InsightsCard key={idx} {...insight} />
          ))}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <RecommendationsList 
            recommendations={insights.recommendations || []}
            onApply={(rec) => {
              toast({
                title: "Recomendación guardada",
                description: "Esta acción ha sido agregada a tu lista de tareas.",
              });
            }}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {insights.detailed_analysis && (
            <>
              {insights.detailed_analysis.fortalezas && (
                <Card className="p-4 border-l-4 border-green-500">
                  <h4 className="font-semibold text-foreground mb-2">💪 Fortalezas</h4>
                  <ul className="space-y-1">
                    {insights.detailed_analysis.fortalezas.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge className="mt-0.5 h-1.5 w-1.5 p-0 rounded-full bg-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {insights.detailed_analysis.oportunidades && (
                <Card className="p-4 border-l-4 border-blue-500">
                  <h4 className="font-semibold text-foreground mb-2">🎯 Oportunidades</h4>
                  <ul className="space-y-1">
                    {insights.detailed_analysis.oportunidades.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge className="mt-0.5 h-1.5 w-1.5 p-0 rounded-full bg-blue-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {insights.detailed_analysis.debilidades && (
                <Card className="p-4 border-l-4 border-yellow-500">
                  <h4 className="font-semibold text-foreground mb-2">⚠️ Áreas de mejora</h4>
                  <ul className="space-y-1">
                    {insights.detailed_analysis.debilidades.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge className="mt-0.5 h-1.5 w-1.5 p-0 rounded-full bg-yellow-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {insights.detailed_analysis.tendencias_emergentes && (
                <Card className="p-4 border-l-4 border-purple-500">
                  <h4 className="font-semibold text-foreground mb-2">📈 Tendencias emergentes</h4>
                  <ul className="space-y-1">
                    {insights.detailed_analysis.tendencias_emergentes.map((item: string, idx: number) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Badge className="mt-0.5 h-1.5 w-1.5 p-0 rounded-full bg-purple-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
