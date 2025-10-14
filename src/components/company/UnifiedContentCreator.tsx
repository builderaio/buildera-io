import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InsightsManager } from "./insights/InsightsManager";
import SimpleContentPublisher from "./SimpleContentPublisher";
import { Lightbulb, Edit3, Sparkles, Loader2, Image as ImageIcon, Video } from "lucide-react";
import { generateAIText, generateAIImage, saveInsight, saveGeneratedContent } from "@/utils/contentGeneration";
import { SmartLoader } from "@/components/ui/smart-loader";
import ContentImageSelector from "./ContentImageSelector";

interface Props {
  profile: { user_id?: string };
  topPosts?: any[];
  selectedPlatform?: string;
  prepopulatedContent?: any;
  onContentUsed?: () => void;
}

export default function UnifiedContentCreator({ profile, topPosts = [], selectedPlatform = 'general', prepopulatedContent, onContentUsed }: Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'insights' | 'create' | 'library'>('insights');
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');
  
  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('post');
  const [selectedPlatformLocal, setSelectedPlatformLocal] = useState(selectedPlatform);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  
  // Manual Creation states
  const [manualText, setManualText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Insights generation states
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [newInsightsIds, setNewInsightsIds] = useState<string[]>([]);
  
  // Publisher states
  const [showPublisher, setShowPublisher] = useState(false);
  const [publisherContent, setPublisherContent] = useState<{ title: string; content: string; generatedImage?: string }>({ title: '', content: '' });
  const [currentInsightId, setCurrentInsightId] = useState<string | undefined>();
  const [currentGeneratedContentId, setCurrentGeneratedContentId] = useState<string | undefined>();

  // Image selector
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedContentImage, setSelectedContentImage] = useState<string>('');

  // Auto-open publisher when prepopulated content arrives from performance tab
  useEffect(() => {
    if (prepopulatedContent) {
      setPublisherContent({
        title: prepopulatedContent.title || '',
        content: prepopulatedContent.strategy || prepopulatedContent.content || '',
        generatedImage: ''
      });
      setCurrentInsightId(prepopulatedContent.id);
      setShowPublisher(true);
      
      // Notify parent that content was used
      if (onContentUsed) {
        onContentUsed();
      }
      
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [prepopulatedContent, onContentUsed]);

  const handleGenerateAI = async () => {
    if (!profile.user_id) {
      toast({ title: "Error", description: "Usuario no autenticado", variant: "destructive" });
      return;
    }

    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Por favor ingresa una descripción", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generar texto
      const text = await generateAIText(aiPrompt, profile.user_id, selectedPlatformLocal);
      setGeneratedText(text);
      
      toast({ 
        title: "¡Contenido generado!", 
        description: "El texto ha sido generado exitosamente" 
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ 
        title: "Error", 
        description: "No se pudo generar el contenido", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!profile.user_id || !generatedText) {
      toast({ title: "Error", description: "Primero genera el texto", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
        body: { prompt: generatedText, userId: profile.user_id }
      });

      if (error) throw error;
      
      setGeneratedImage(data?.imageUrl || '');
      toast({ title: "¡Imagen generada!", description: "La imagen ha sido creada exitosamente" });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Error", description: "No se pudo generar la imagen", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeWithEra = async () => {
    if (!profile.user_id || !manualText.trim()) {
      toast({ title: "Error", description: "Escribe algo primero", variant: "destructive" });
      return;
    }

    setIsOptimizing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('era-content-optimizer', {
        body: { 
          content: manualText,
          platform: selectedPlatformLocal,
          userId: profile.user_id
        }
      });

      if (error) throw error;
      
      setManualText(data?.optimizedContent || manualText);
      toast({ title: "¡Contenido optimizado!", description: "Tu contenido ha sido mejorado por Era" });
    } catch (error) {
      console.error('Error optimizing:', error);
      toast({ title: "Error", description: "No se pudo optimizar el contenido", variant: "destructive" });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePublishAI = async () => {
    if (!profile.user_id || !generatedText) return;

    try {
      // Guardar insight
      const insightId = await saveInsight(profile.user_id, 'Contenido generado por IA', generatedText, {
        type: 'content_ideas',
        format: selectedFormat,
        platform: selectedPlatformLocal,
        source: 'ai_generated'
      });

      // Guardar contenido generado
      const contentId = await saveGeneratedContent(profile.user_id, generatedText, {
        contentType: selectedFormat,
        mediaUrl: generatedImage || selectedContentImage,
        insightId,
        generationPrompt: aiPrompt
      });

      setCurrentInsightId(insightId);
      setCurrentGeneratedContentId(contentId);
      setPublisherContent({ 
        title: 'Contenido IA', 
        content: generatedText,
        generatedImage: generatedImage || selectedContentImage
      });
      setShowPublisher(true);
    } catch (error) {
      console.error('Error preparing publish:', error);
      toast({ title: "Error", description: "No se pudo preparar la publicación", variant: "destructive" });
    }
  };

  const handlePublishManual = async () => {
    if (!profile.user_id || !manualText.trim()) return;

    try {
      // Guardar insight
      const insightId = await saveInsight(profile.user_id, 'Contenido manual', manualText, {
        type: 'content_ideas',
        format: selectedFormat,
        platform: selectedPlatformLocal,
        source: 'user_created'
      });

      // Guardar contenido generado
      const contentId = await saveGeneratedContent(profile.user_id, manualText, {
        contentType: selectedFormat,
        mediaUrl: selectedContentImage,
        insightId
      });

      setCurrentInsightId(insightId);
      setCurrentGeneratedContentId(contentId);
      setPublisherContent({ 
        title: 'Contenido Manual', 
        content: manualText,
        generatedImage: selectedContentImage
      });
      setShowPublisher(true);
    } catch (error) {
      console.error('Error preparing publish:', error);
      toast({ title: "Error", description: "No se pudo preparar la publicación", variant: "destructive" });
    }
  };

  const handleInsightCreateContent = (insight: any) => {
    // 1. Feedback inmediato
    toast({
      title: "Preparando contenido",
      description: "Configurando el publicador con tu insight...",
    });

    // 2. Configurar contenido correctamente (priorizar strategy)
    setPublisherContent({
      title: insight.title,
      content: insight.strategy || insight.content || '',
      generatedImage: ''
    });
    
    // 3. Guardar ID para tracking
    setCurrentInsightId(insight.id);
    
    // 4. Cambiar a modo de creación para contexto visual
    setCreateMode('ai');
    
    // 5. Abrir el publisher
    setShowPublisher(true);
    
    // 6. Scroll suave al top para que el dialog sea visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateMoreInsights = async () => {
    if (!profile.user_id) {
      toast({ 
        title: "Error", 
        description: "Usuario no autenticado", 
        variant: "destructive" 
      });
      return;
    }

    setIsGeneratingInsights(true);
    
    try {
      toast({
        title: "Generando insights",
        description: "La IA está analizando tu contenido...",
      });

      const { data, error } = await supabase.functions.invoke('content-insights-generator', {
        body: {
          user_id: profile.user_id,
          platform: selectedPlatformLocal !== 'general' ? selectedPlatformLocal : null,
          top_posts: topPosts.slice(0, 10).map(post => ({
            platform: post.platform,
            text: post.text,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.rePosts || 0,
            views: post.videoViews || post.views || 0
          }))
        }
      });

      if (error) throw error;

      if (data?.saved_insights_ids && data.saved_insights_ids.length > 0) {
        setNewInsightsIds(data.saved_insights_ids);
        toast({
          title: "¡Insights generados!",
          description: `Se generaron ${data.saved_insights_ids.length} nuevos insights`,
        });
      } else {
        toast({
          title: "Información",
          description: "No se generaron nuevos insights en este momento",
        });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar los insights",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Crear Nuevo
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Biblioteca
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Insights */}
        <TabsContent value="insights" className="space-y-4">
          <InsightsManager
            userId={profile.user_id || ''}
            onCreateContent={handleInsightCreateContent}
            onGenerateMore={handleGenerateMoreInsights}
            isGenerating={isGeneratingInsights}
            newInsightsIds={newInsightsIds}
          />
        </TabsContent>

        {/* Tab 2: Crear Nuevo */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="ai">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generación IA
                  </TabsTrigger>
                  <TabsTrigger value="manual">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Escritura Manual
                  </TabsTrigger>
                </TabsList>

                {/* Generación IA */}
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Formato</Label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="post">📱 Post</SelectItem>
                            <SelectItem value="image">🎨 Imagen</SelectItem>
                            <SelectItem value="video">🎥 Video</SelectItem>
                            <SelectItem value="reel">🎬 Reel</SelectItem>
                            <SelectItem value="story">⭐ Historia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Plataforma</Label>
                        <Select value={selectedPlatformLocal} onValueChange={setSelectedPlatformLocal}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Describe tu idea</Label>
                      <Textarea
                        placeholder="Ej: Un post motivacional sobre emprendimiento para LinkedIn..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <Button onClick={handleGenerateAI} disabled={isGenerating} className="w-full">
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generar Contenido con IA
                        </>
                      )}
                    </Button>

                    {generatedText && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label>Contenido Generado</Label>
                          <Textarea
                            value={generatedText}
                            onChange={(e) => setGeneratedText(e.target.value)}
                            rows={6}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleGenerateImage} disabled={isGenerating}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Generar Imagen
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowImageSelector(true)}>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Seleccionar Imagen
                          </Button>
                        </div>

                        {(generatedImage || selectedContentImage) && (
                          <div className="rounded-lg overflow-hidden border">
                            <img 
                              src={generatedImage || selectedContentImage} 
                              alt="Generated" 
                              className="w-full h-auto"
                            />
                          </div>
                        )}

                        <Button onClick={handlePublishAI} className="w-full">
                          Publicar Contenido
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Escritura Manual */}
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Formato</Label>
                        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="post">📱 Post</SelectItem>
                            <SelectItem value="image">🎨 Imagen</SelectItem>
                            <SelectItem value="video">🎥 Video</SelectItem>
                            <SelectItem value="reel">🎬 Reel</SelectItem>
                            <SelectItem value="story">⭐ Historia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Plataforma</Label>
                        <Select value={selectedPlatformLocal} onValueChange={setSelectedPlatformLocal}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Escribe tu contenido</Label>
                      <Textarea
                        placeholder="Escribe aquí tu contenido..."
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        rows={8}
                      />
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={handleOptimizeWithEra} 
                      disabled={isOptimizing}
                      className="w-full"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Optimizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Optimizar con Era
                        </>
                      )}
                    </Button>

                    <Button variant="outline" onClick={() => setShowImageSelector(true)}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Seleccionar Imagen
                    </Button>

                    {selectedContentImage && (
                      <div className="rounded-lg overflow-hidden border">
                        <img src={selectedContentImage} alt="Selected" className="w-full h-auto" />
                      </div>
                    )}

                    <Button onClick={handlePublishManual} className="w-full" disabled={!manualText.trim()}>
                      Publicar Contenido
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Biblioteca */}
        <TabsContent value="library">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Biblioteca de contenido generado (próximamente)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Selector Dialog - Temporalmente deshabilitado */}
      {showImageSelector && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <Card className="w-full max-w-2xl">
            <CardContent className="pt-6">
              <p className="text-center">Selector de imágenes (próximamente)</p>
              <Button onClick={() => setShowImageSelector(false)} className="mt-4 w-full">
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Publisher Dialog */}
      <SimpleContentPublisher
        isOpen={showPublisher}
        onClose={() => {
          setShowPublisher(false);
          setCurrentInsightId(undefined);
          setCurrentGeneratedContentId(undefined);
          setPublisherContent({ title: '', content: '' });
        }}
        content={publisherContent}
        profile={profile}
        contentIdeaId={currentInsightId}
        generatedContentId={currentGeneratedContentId}
        source={currentInsightId ? 'insight' : (createMode === 'ai' ? 'ai' : 'manual')}
        onSuccess={() => {
          setShowPublisher(false);
          
          toast({ 
            title: "¡Contenido publicado exitosamente!", 
            description: "Tu contenido está disponible en tus redes sociales",
            duration: 5000 
          });
          
          // Reset states
          setAiPrompt('');
          setGeneratedText('');
          setGeneratedImage('');
          setManualText('');
          setSelectedContentImage('');
          setCurrentInsightId(undefined);
          setCurrentGeneratedContentId(undefined);
          setPublisherContent({ title: '', content: '' });
        }}
      />

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Generando contenido con IA...</p>
          </div>
        </div>
      )}
    </div>
  );
}
