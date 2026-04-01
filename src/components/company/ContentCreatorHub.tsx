import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Edit3, Loader2, Wand2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ContentIdeaCard } from "./ContentIdeaCard";
import SimpleContentPublisher from "./SimpleContentPublisher";
import { useEraOptimizer } from "@/hooks/useEraOptimizer";
import { EraOptimizerDialog } from "@/components/ui/era-optimizer-dialog";

interface ContentCreatorHubProps {
  profile: any;
  onContentPublished?: () => void;
}

export default function ContentCreatorHub({ profile, onContentPublished }: ContentCreatorHubProps) {
  const { toast } = useToast();
  const { t } = useTranslation(['errors', 'marketing']);
  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('general');
  const [selectedFormat, setSelectedFormat] = useState('post');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [publisherContent, setPublisherContent] = useState({ title: '', content: '', generatedImage: '' });
  const [currentInsightId, setCurrentInsightId] = useState<string>();

  const { 
    optimizeWithEra, 
    isOptimizing, 
    optimizedText, 
    showOptimizedDialog, 
    acceptOptimization, 
    rejectOptimization 
  } = useEraOptimizer({
    onOptimized: (optimized) => {
      setManualContent(optimized);
      toast({
        title: t('marketing:creator.optimized'),
        description: t('marketing:creator.optimizedDesc')
      });
    }
  });

  useEffect(() => {
    if (profile?.user_id) {
      loadContentIdeas();
    }
  }, [profile?.user_id]);

  const loadContentIdeas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('insight_type', 'content_idea')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setContentIdeas(data || []);
    } catch (error) {
      console.error('Error loading content ideas:', error);
      toast({
        title: t("errors:general.title"),
        description: "No se pudieron cargar las ideas de contenido",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!profile?.user_id) return;
    
    setIsGeneratingIdeas(true);
    try {
      toast({
        title: t('marketing:creator.generatingIdeas'),
        description: t('marketing:creator.generatingIdeasDesc'),
      });

      const { data, error } = await supabase.functions.invoke('content-insights-generator', {
        body: { 
          userId: profile.user_id,
          insightType: 'content_idea',
          count: 5
        }
      });

      if (error) throw error;

      toast({
        title: t('marketing:creator.ideasGenerated'),
        description: t('marketing:creator.ideasGeneratedDesc', { count: data?.count || 0 }),
      });

      await loadContentIdeas();
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast({
        title: t("errors:general.title"),
        description: "No se pudieron generar las ideas",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleQuickCreateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: t("errors:general.title"),
        description: "Describe tu idea de contenido",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          userId: profile.user_id,
          prompt: aiPrompt,
          platform: selectedPlatform,
          contentType: selectedFormat,
          tone: 'professional'
        }
      });

      if (error) throw error;

      setPublisherContent({
        title: aiPrompt.slice(0, 50),
        content: data.content || '',
        generatedImage: data.imageUrl || ''
      });
      setShowPublisher(true);
      setAiPrompt('');

      toast({
        title: t('marketing:creator.contentGenerated'),
        description: t('marketing:creator.reviewAndPublish'),
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: t("errors:general.title"),
        description: "No se pudo generar el contenido",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManual = () => {
    if (!manualContent.trim()) {
      toast({
        title: t("errors:general.title"),
        description: "Escribe el contenido que deseas publicar",
        variant: "destructive"
      });
      return;
    }

    setPublisherContent({
      title: 'Contenido manual',
      content: manualContent,
      generatedImage: ''
    });
    setShowPublisher(true);
  };

  const handleOptimizeWithEra = () => {
    optimizeWithEra(manualContent, 'post_content', {
      platform: selectedPlatform,
      format: selectedFormat
    });
  };

  const handleCreateContentFromIdea = (idea: any) => {
    // Enviar la información de la idea como estrategia del insight
    // para que el usuario la genere desde el modal con el botón "Generar contenido con IA"
    setPublisherContent({
      title: idea.title,
      content: idea.strategy || idea.content || '',
      generatedImage: ''
    });
    setCurrentInsightId(idea.id);
    setShowPublisher(true);
    
    toast({
      title: t('marketing:creator.preparingContent'),
      description: t('marketing:creator.preparingContentDesc'),
    });
  };

  const handleCompleteIdea = async (ideaId: string) => {
    try {
      await supabase
        .from('content_insights')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', ideaId);

      toast({
        title: t('marketing:creator.ideaCompleted'),
        description: t('marketing:creator.ideaCompletedDesc')
      });

      await loadContentIdeas();
    } catch (error) {
      console.error('Error completing idea:', error);
      toast({
        title: t("errors:general.title"),
        description: "No se pudo completar la idea",
        variant: "destructive"
      });
    }
  };

  const handleDismissIdea = async (ideaId: string) => {
    try {
      await supabase
        .from('content_insights')
        .update({ status: 'dismissed' })
        .eq('id', ideaId);

      toast({
        title: t('marketing:creator.ideaDismissed'),
        description: t('marketing:creator.ideaDismissedDesc')
      });

      await loadContentIdeas();
    } catch (error) {
      console.error('Error dismissing idea:', error);
      toast({
        title: t("errors:general.title"),
        description: "No se pudo descartar la idea",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Creation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {t('marketing:creator.quickCreation')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={creationMode} onValueChange={(v) => setCreationMode(v as 'ai' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="ai">{t('marketing:creator.withAI')}</TabsTrigger>
              <TabsTrigger value="manual">{t('marketing:creator.manual')}</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              <Textarea
                placeholder="Describe tu idea de contenido... Ejemplo: 'Crear un post sobre los beneficios del trabajo remoto'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('marketing:creator.platform')}</label>
                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('marketing:creator.format')}</label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">{t('marketing:creator.story')}</SelectItem>
                      <SelectItem value="reel">Reel/Video</SelectItem>
                      <SelectItem value="carousel">{t('marketing:creator.carousel')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleQuickCreateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('marketing:creator.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('marketing:creator.generateContent')}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Textarea
                placeholder="Escribe tu contenido aquí..."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                rows={6}
                className="resize-none"
              />

              <Button 
                variant="outline" 
                onClick={handleOptimizeWithEra} 
                disabled={isOptimizing || !manualContent.trim()}
                className="w-full"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('marketing:creator.optimizing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('marketing:creator.optimizeWithEra')}
                  </>
                )}
              </Button>

              <Button 
                onClick={handleCreateManual}
                disabled={!manualContent.trim()}
                className="w-full"
                size="lg"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {t('marketing:creator.continueWithContent')}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Ideas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            💡 {t('marketing:creator.yourContentIdeas')}
            {contentIdeas.length > 0 && (
              <Badge variant="secondary">{contentIdeas.length} {t('marketing:creator.active')}</Badge>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadContentIdeas}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              onClick={handleGenerateIdeas} 
              disabled={isGeneratingIdeas}
              size="sm"
              className="gap-2"
            >
              {isGeneratingIdeas ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {t('marketing:creator.generateIdeas')}
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Cargando ideas de contenido...</span>
              </div>
            </CardContent>
          </Card>
        ) : contentIdeas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay ideas de contenido</h3>
              <p className="text-muted-foreground text-center mb-4">
                Genera ideas con IA para comenzar a crear contenido increíble
              </p>
              <Button onClick={handleGenerateIdeas} disabled={isGeneratingIdeas}>
                <Wand2 className="w-4 h-4 mr-2" />
                Generar Ideas Ahora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {contentIdeas.map((idea) => (
              <ContentIdeaCard
                key={idea.id}
                idea={idea}
                onCreateContent={() => handleCreateContentFromIdea(idea)}
                onComplete={() => handleCompleteIdea(idea.id)}
                onDismiss={() => handleDismissIdea(idea.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Era Optimizer Dialog */}
      <EraOptimizerDialog
        isOpen={showOptimizedDialog}
        onClose={rejectOptimization}
        originalText={manualContent}
        optimizedText={optimizedText}
        onAccept={acceptOptimization}
        onReject={rejectOptimization}
      />

      {/* Publisher Modal */}
      <SimpleContentPublisher
        isOpen={showPublisher}
        onClose={() => {
          setShowPublisher(false);
          setCurrentInsightId(undefined);
          setManualContent('');
        }}
        content={publisherContent}
        profile={profile}
        contentIdeaId={currentInsightId}
        source="insight"
        onSuccess={() => {
          loadContentIdeas();
          onContentPublished?.();
        }}
      />
    </div>
  );
}
