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
      // Cargar desde content_insights (nueva estructura)
      const { data: audienceData, error: audienceError } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('insight_type', 'audience')
        .eq('source', 'ai_generated')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: contentData, error: contentError } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', userId)
        .eq('insight_type', 'content_idea')
        .eq('source', 'ai_generated')
        .order('created_at', { ascending: false })
        .limit(4);

      if (audienceError) throw audienceError;
      if (contentError) throw contentError;

      if (audienceData || contentData) {
        setInsights({
          audience_insights: audienceData?.map(d => ({
            title: d.title,
            strategy: d.content
          })) || [],
          content_ideas: contentData?.map(d => ({
            title: d.title,
            format: d.format,
            platform: d.platform,
            hashtags: d.hashtags,
            timing: d.timing,
            strategy: d.content
          })) || [],
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

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {insights.audience_insights?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Insights de Audiencia</div>
          </div>
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {insights.content_ideas?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Ideas de Contenido</div>
          </div>
        </div>
      </Card>

      {/* Tabs de contenido */}
      <Tabs defaultValue="audience" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audience">Insights de Audiencia</TabsTrigger>
          <TabsTrigger value="ideas">Ideas de Contenido</TabsTrigger>
        </TabsList>

        <TabsContent value="audience" className="space-y-3">
          {insights.audience_insights?.map((insight: any, idx: number) => (
            <Card key={idx} className="p-4 border-l-4 border-primary">
              <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
              <p className="text-sm text-muted-foreground">{insight.strategy}</p>
            </Card>
          ))}
          {(!insights.audience_insights || insights.audience_insights.length === 0) && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No hay insights de audiencia disponibles.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="space-y-3">
          {insights.content_ideas?.map((idea: any, idx: number) => (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-foreground">{idea.title}</h4>
                <Badge variant="outline">{idea.platform}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{idea.strategy}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {idea.hashtags?.map((tag: string, tagIdx: number) => (
                  <Badge key={tagIdx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Formato: {idea.format}</span>
                {idea.timing && <span>⏰ {idea.timing}</span>}
              </div>
            </Card>
          ))}
          {(!insights.content_ideas || insights.content_ideas.length === 0) && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No hay ideas de contenido disponibles.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
