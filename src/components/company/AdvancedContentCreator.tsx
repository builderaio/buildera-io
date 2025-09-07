import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Sparkles, Trash2, RefreshCw, Image, Video, Copy, Download, Share2, Plus, Lightbulb } from "lucide-react";
import ContentCreationLoader from "@/components/ui/content-creation-loader";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  profile: { user_id?: string };
  topPosts: any[];
  selectedPlatform: string;
}

interface ContentInsight {
  id: string;
  title: string;
  description?: string;
  format_type?: string;
  platform?: string;
  hashtags?: string[];
  suggested_schedule?: string;
  raw_insight?: string;
  created_at: string;
}

interface GeneratedContent {
  id: string;
  insight_id?: string;
  content_text: string;
  content_type: string; // Allow any string from database
  media_url?: string;
  generation_prompt?: string;
  created_at: string;
}

export default function AdvancedContentCreator({ profile, topPosts, selectedPlatform }: Props) {
  const { toast } = useToast();
  
  // Loading states
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingContent, setLoadingContent] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState<string | null>(null);
  const [currentLoadingStep, setCurrentLoadingStep] = useState<string>("");
  
  // Data states
  const [insights, setInsights] = useState<ContentInsight[]>([]);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<ContentInsight | null>(null);

  // Load existing insights on component mount
  useEffect(() => {
    console.log('AdvancedContentCreator mounted with profile:', profile);
    if (profile.user_id) {
      loadInsights();
      loadGeneratedContents();
    }
  }, [profile.user_id]);

  const loadInsights = async () => {
    if (!profile.user_id) {
      console.log('No user_id available');
      return;
    }
    
    console.log('Loading insights for user:', profile.user_id);
    
    try {
      const { data, error } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Supabase error loading insights:', error);
        throw error;
      }
      
      console.log('Loaded insights:', data);
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({ 
        title: "Error al cargar insights", 
        description: "No se pudieron cargar los insights existentes", 
        variant: "destructive" 
      });
    }
  };

  const loadGeneratedContents = async () => {
    if (!profile.user_id) return;
    
    try {
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setGeneratedContents(data || []);
    } catch (error) {
      console.error('Error loading generated contents:', error);
    }
  };

  const generateAIInsights = async () => {
    setLoadingInsights(true);
    const steps = [
      "Analizando tu audiencia...",
      "Identificando patrones de contenido...", 
      "Generando insights personalizados...",
      "Creando ideas específicas...",
      "Guardando insights..."
    ];
    
    try {
      // Simulate step progression
      for (let i = 0; i < steps.length; i++) {
        setCurrentLoadingStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const topPostsContext = topPosts.slice(0, 5).map(post => ({
        text: post.text?.substring(0, 200),
        hashtags: post.hashTags?.slice(0, 5),
        likes: post.likes || 0,
        comments: post.comments || 0,
        platform: post.platform,
        type: post.type
      }));

      const { data, error } = await supabase.functions.invoke('content-insights-generator', {
        body: {
          user_id: profile.user_id,
          platform: selectedPlatform !== 'all' ? selectedPlatform : null,
          top_posts: topPostsContext
        }
      });
      
      if (error) throw error;
      
      // Parse and save insights to database
      const aiInsights = data.insights || '';
      await saveInsightsToDatabase(aiInsights);
      
      toast({ 
        title: "🎉 ¡Insights generados!", 
        description: "Se han creado nuevas ideas personalizadas para tu contenido" 
      });
      
      await loadInsights();
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({ 
        title: "Error", 
        description: "No se pudieron generar los insights. Intenta de nuevo.", 
        variant: "destructive" 
      });
    } finally {
      setLoadingInsights(false);
      setCurrentLoadingStep("");
    }
  };

  const saveInsightsToDatabase = async (rawInsights: string) => {
    try {
      // Parse insights to extract individual ideas
      const ideas = parseInsightsToIdeas(rawInsights);
      
      // Save each idea as a separate insight
      for (const idea of ideas) {
        await supabase.from('content_insights').insert({
          user_id: profile.user_id,
          title: idea.title,
          description: idea.description,
          format_type: idea.format,
          platform: idea.platform,
          hashtags: idea.hashtags,
          suggested_schedule: idea.schedule,
          raw_insight: rawInsights
        });
      }
    } catch (error) {
      console.error('Error saving insights:', error);
    }
  };

  const parseInsightsToIdeas = (text: string) => {
    const ideas: Array<{ title: string; description?: string; format?: string; platform?: string; hashtags?: string[]; schedule?: string }> = [];
    const lines = text.split(/\r?\n/);
    let current: any = null;
    
    for (const line of lines) {
      const titleMatch = line.match(/\*\*Título\/tema\*\*:\s*(.+)/i);
      if (titleMatch) {
        if (current) ideas.push(current);
        current = { title: titleMatch[1].trim().replace(/"/g, '') };
        continue;
      }
      if (!current) continue;
      
      const formatMatch = line.match(/\*\*Formato sugerido\*\*:\s*(.+)/i);
      if (formatMatch) current.format = formatMatch[1].trim();
      
      const platformMatch = line.match(/\*\*Plataforma recomendada\*\*:\s*(.+)/i);
      if (platformMatch) current.platform = platformMatch[1].trim();
      
      const hashtagsMatch = line.match(/\*\*Hashtags\*\*:\s*(.+)/i);
      if (hashtagsMatch) {
        current.hashtags = hashtagsMatch[1]
          .split(/[,#]/)
          .map((t) => t.replace(/[#\s]/g, '').trim())
          .filter(Boolean)
          .slice(0, 6);
      }
      
      const scheduleMatch = line.match(/\*\*Hora\/día sugerido para publicar\*\*:\s*(.+)/i);
      if (scheduleMatch) current.schedule = scheduleMatch[1].trim();
    }
    
    if (current) ideas.push(current);
    return ideas;
  };

  const deleteInsight = async (insightId: string) => {
    try {
      const { error } = await supabase
        .from('content_insights')
        .delete()
        .eq('id', insightId);
        
      if (error) throw error;
      
      // Also delete related generated content
      await supabase
        .from('generated_content')
        .delete()
        .eq('insight_id', insightId);
        
      await loadInsights();
      await loadGeneratedContents();
      
      toast({ title: "Insight eliminado", description: "El insight y su contenido relacionado han sido eliminados" });
    } catch (error) {
      console.error('Error deleting insight:', error);
      toast({ title: "Error", description: "No se pudo eliminar el insight", variant: "destructive" });
    }
  };

  const generateContentFromInsight = async (insight: ContentInsight) => {
    setLoadingContent(insight.id);
    const steps = [
      "Creando contenido atractivo...",
      "Optimizando el copy...",
      "Añadiendo elementos visuales...",
      "Personalizando para tu audiencia...",
      "Finalizando el post..."
    ];
    
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentLoadingStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          prompt: `Crear contenido para: ${insight.title}. Formato: ${insight.format_type}. Plataforma: ${insight.platform}. Incluir hashtags: ${insight.hashtags?.join(', ')}`,
          context: {
            top_posts: topPosts.slice(0, 3),
            platform: insight.platform || selectedPlatform,
            user_id: profile.user_id
          }
        }
      });
      
      if (error) throw error;
      
      // Save generated content to database
      const { error: saveError } = await supabase
        .from('generated_content')
        .insert({
          user_id: profile.user_id,
          insight_id: insight.id,
          content_text: data.content,
          content_type: 'text',
          generation_prompt: insight.title
        });
        
      if (saveError) throw saveError;
      
      await loadGeneratedContents();
      
      toast({ 
        title: "✨ ¡Contenido creado!", 
        description: "Tu nuevo post está listo para publicar" 
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: "Error", description: "No se pudo generar el contenido", variant: "destructive" });
    } finally {
      setLoadingContent(null);
      setCurrentLoadingStep("");
    }
  };

  const generateImage = async (content: GeneratedContent) => {
    setLoadingMedia(content.id);
    const steps = [
      "Interpretando tu concepto...",
      "Generando elementos visuales...",
      "Aplicando estilo de marca...",
      "Optimizando composición...",
      "Creando imagen final..."
    ];
    
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentLoadingStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 700));
      }
      
      const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
        body: {
          prompt: `Create a professional social media image for: ${content.content_text.substring(0, 200)}`,
          user_id: profile.user_id,
          content_id: content.id
        }
      });
      
      if (error) throw error;
      
      // Update content with media URL
      await supabase
        .from('generated_content')
        .update({ 
          content_type: 'image',
          media_url: data.image_url 
        })
        .eq('id', content.id);
        
      await loadGeneratedContents();
      
      toast({ title: "🖼️ ¡Imagen creada!", description: "Tu imagen profesional está lista" });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Error", description: "No se pudo generar la imagen", variant: "destructive" });
    } finally {
      setLoadingMedia(null);
      setCurrentLoadingStep("");
    }
  };

  const generateVideo = async (content: GeneratedContent) => {
    setLoadingMedia(content.id);
    const steps = [
      "Conceptualizando el video...",
      "Generando storyboard...",
      "Creando elementos visuales...",
      "Sincronizando audio...",
      "Renderizando video final..."
    ];
    
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentLoadingStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      const { data, error } = await supabase.functions.invoke('marketing-hub-reel-creator', {
        body: {
          prompt: content.content_text,
          user_id: profile.user_id,
          content_id: content.id
        }
      });
      
      if (error) throw error;
      
      // Update content with media URL
      await supabase
        .from('generated_content')
        .update({ 
          content_type: 'video',
          media_url: data.video_url 
        })
        .eq('id', content.id);
        
      await loadGeneratedContents();
      
      toast({ title: "🎥 ¡Video creado!", description: "Tu video promocional está listo" });
    } catch (error) {
      console.error('Error generating video:', error);
      toast({ title: "Error", description: "No se pudo generar el video", variant: "destructive" });
    } finally {
      setLoadingMedia(null);
      setCurrentLoadingStep("");
    }
  };

  const getContentForInsight = (insightId: string) => {
    return generatedContents.filter(content => content.insight_id === insightId);
  };

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Content Studio IA
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={loadInsights}
                variant="outline" 
                size="sm"
                disabled={loadingInsights}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                onClick={generateAIInsights} 
                disabled={loadingInsights || !profile.user_id}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {loadingInsights ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Generar Insights
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {loadingInsights && (
              <ContentCreationLoader 
                type="insights" 
                isVisible={loadingInsights}
                currentStep={currentLoadingStep}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      <AnimatePresence>
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <InsightCard 
                  insight={insight}
                  onDelete={deleteInsight}
                  onGenerateContent={generateContentFromInsight}
                  isGenerating={loadingContent === insight.id}
                  generatedContents={getContentForInsight(insight.id)}
                  onGenerateImage={generateImage}
                  onGenerateVideo={generateVideo}
                  isGeneratingMedia={loadingMedia}
                  currentLoadingStep={currentLoadingStep}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {insights.length === 0 && !loadingInsights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay insights aún</h3>
          <p className="text-muted-foreground mb-4">Genera tu primer set de insights personalizados</p>
          <Button onClick={generateAIInsights} disabled={!profile.user_id}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Generar Insights
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Insight Card Component
function InsightCard({ 
  insight, 
  onDelete, 
  onGenerateContent, 
  isGenerating, 
  generatedContents,
  onGenerateImage,
  onGenerateVideo,
  isGeneratingMedia,
  currentLoadingStep 
}: {
  insight: ContentInsight;
  onDelete: (id: string) => void;
  onGenerateContent: (insight: ContentInsight) => void;
  isGenerating: boolean;
  generatedContents: GeneratedContent[];
  onGenerateImage: (content: GeneratedContent) => void;
  onGenerateVideo: (content: GeneratedContent) => void;
  isGeneratingMedia: string | null;
  currentLoadingStep: string;
}) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado", description: "Contenido copiado al portapapeles" });
  };

  return (
    <Card className="border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-base leading-tight">{insight.title}</h3>
            <div className="flex flex-wrap gap-1">
              {insight.format_type && (
                <Badge variant="secondary" className="text-xs">
                  {insight.format_type}
                </Badge>
              )}
              {insight.platform && (
                <Badge variant="outline" className="text-xs">
                  {insight.platform}
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(insight.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Hashtags */}
        {insight.hashtags && insight.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {insight.hashtags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {insight.hashtags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{insight.hashtags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Schedule */}
        {insight.suggested_schedule && (
          <p className="text-xs text-muted-foreground">
            📅 {insight.suggested_schedule}
          </p>
        )}

        {/* Generate Content Button */}
        <Button
          onClick={() => onGenerateContent(insight)}
          disabled={isGenerating}
          size="sm"
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Crear Contenido
            </>
          )}
        </Button>

        {/* Loading State for Content Generation */}
        <AnimatePresence>
          {isGenerating && (
            <ContentCreationLoader 
              type="content" 
              isVisible={isGenerating}
              currentStep={currentLoadingStep}
            />
          )}
        </AnimatePresence>

        {/* Generated Contents */}
        <AnimatePresence>
          {generatedContents.map((content) => (
            <motion.div
              key={content.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-border rounded-lg p-3 space-y-3"
            >
              {/* Content Text */}
              <div className="text-sm text-foreground line-clamp-3">
                {content.content_text}
              </div>
              
              {/* Media Preview */}
              {content.media_url && (
                <div className="rounded-lg overflow-hidden">
                  {content.content_type === 'image' ? (
                    <img 
                      src={content.media_url} 
                      alt="Generated content" 
                      className="w-full h-32 object-cover"
                    />
                  ) : content.content_type === 'video' ? (
                    <video 
                      src={content.media_url} 
                      className="w-full h-32 object-cover"
                      controls
                    />
                  ) : null}
                </div>
              )}

              {/* Loading States for Media Generation */}
              <AnimatePresence>
                {isGeneratingMedia === content.id && (
                  <ContentCreationLoader 
                    type={content.content_type === 'video' ? 'video' : 'image'} 
                    isVisible={true}
                    currentStep={currentLoadingStep}
                  />
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(content.content_text)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                {!content.media_url && content.content_type === 'text' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateImage(content)}
                      disabled={isGeneratingMedia === content.id}
                    >
                      <Image className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateVideo(content)}
                      disabled={isGeneratingMedia === content.id}
                    >
                      <Video className="h-3 w-3" />
                    </Button>
                  </>
                )}
                
                {content.media_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(content.media_url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}