import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { PlusCircle, Sparkles, Lightbulb, Copy, Brain, Target, TrendingUp, Clock, ArrowRight, Edit3, Image, Send, Calendar, Loader2, Heart, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AdvancedContentCreator from "./AdvancedContentCreator";
import { useEraOptimizer } from "@/hooks/useEraOptimizer";
import SimpleContentPublisher from "./SimpleContentPublisher";
import { EraOptimizerDialog } from "@/components/ui/era-optimizer-dialog";

interface Props {
  profile: { user_id?: string };
  topPosts: any[];
  selectedPlatform: string;
  prepopulatedContent?: {
    title: string;
    format: string;
    platform: string;
    hashtags: string[];
    timing: string;
    strategy: string;
    schedule?: boolean;
    id?: string; // Add ID to track the content idea
  } | null;
  onContentUsed?: () => void;
}

export default function ContentCreatorTab({ profile, topPosts, selectedPlatform, prepopulatedContent, onContentUsed }: Props) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentPrompt, setContentPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [publisherContent, setPublisherContent] = useState('');
  const [currentContentIdeaId, setCurrentContentIdeaId] = useState<string | undefined>(undefined);
  
  // Era Optimizer hook
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
    }
  });

  // Pre-populate content when received from insights
  useEffect(() => {
    if (prepopulatedContent) {
      // Only pre-fill the content prompt (description field)
      // User must generate the actual content using the "Generar Contenido" button
      setContentPrompt(prepopulatedContent.title);
      
      // Store content idea ID if provided
      if (prepopulatedContent.id) {
        setCurrentContentIdeaId(prepopulatedContent.id);
      }
      
      // Show publisher if schedule mode (but don't pre-fill content)
      if (prepopulatedContent.schedule) {
        setShowPublisher(true);
      }
      
      toast({
        title: "Idea cargada",
        description: "Describe el contenido y usa 'Generar Contenido' para crearlo",
      });
      
      // Clear prepopulated data after use
      onContentUsed?.();
    }
  }, [prepopulatedContent]);

  const generateContent = async () => {
    if (!contentPrompt.trim()) {
      toast({ title: t('toast.error'), description: t('toast.content.enterPrompt'), variant: "destructive" });
      return;
    }
    setGeneratingContent(true);
    try {
      const topPostsContext = topPosts.slice(0, 3).map(post => ({
        text: post.text?.substring(0, 200),
        hashtags: post.hashTags?.slice(0, 5),
        engagement: (post.likes || 0) + (post.comments || 0),
        platform: post.platform
      }));

      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          prompt: contentPrompt,
          context: {
            top_posts: topPostsContext,
            platform: selectedPlatform !== 'all' ? selectedPlatform : 'general',
            user_id: profile.user_id
          }
        }
      });
      if (error) throw error;
      setGeneratedContent(data.content || data.generatedText || 'No se pudo generar contenido');
      
      // Save generated content to library if it includes suggestions
      if (data.content && profile.user_id) {
        try {
          await supabase
            .from('content_recommendations')
            .insert({
              user_id: profile.user_id,
              title: `Contenido IA - ${contentPrompt.slice(0, 50)}...`,
              description: data.content.slice(0, 200) + (data.content.length > 200 ? '...' : ''),
              recommendation_type: 'post_template',
              status: 'template',
              platform: selectedPlatform !== 'all' ? selectedPlatform : 'general',
              suggested_content: {
                content_text: data.content,
                image_url: '',
                metrics: { likes: 0, comments: 0 }
              }
            });
        } catch (saveError) {
          console.warn('Error saving generated content to library:', saveError);
        }
      }
      
      toast({ title: t('toast.content.generated'), description: t('toast.content.generatedDesc') });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: t('toast.error'), description: t('toast.content.errorGenerate'), variant: "destructive" });
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateImageWithEra = async () => {
    const contentToUse = manualContent || generatedContent;
    if (!contentToUse.trim()) {
      toast({ title: t('toast.error'), description: t('toast.content.needContent'), variant: "destructive" });
      return;
    }
    
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
        body: {
          prompt: `Create a professional social media image for this content: ${contentToUse.substring(0, 500)}`,
          user_id: profile.user_id
        }
      });
      
      if (error) throw error;
      
      setGeneratedImage(data.image_url);
      
      // Save generated image to content library using helper
      if (data.image_url && profile.user_id) {
        const { saveImageToContentLibrary } = await import('@/utils/contentLibraryHelper');
        try {
          await saveImageToContentLibrary({
            userId: profile.user_id,
            title: `Imagen IA - ${(manualContent || generatedContent).slice(0, 50)}...`,
            description: (manualContent || generatedContent).slice(0, 200) + '...',
            imageUrl: data.image_url,
            contentText: manualContent || generatedContent,
            platform: selectedPlatform !== 'all' ? selectedPlatform : 'general',
            metrics: { likes: 0, comments: 0 }
          });
        } catch (saveError) {
          console.warn('Error saving generated image to library:', saveError);
        }
      }
      
      toast({ title: t('toast.content.imageGenerated'), description: t('toast.content.imageGeneratedDesc') });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: t('toast.error'), description: t('toast.content.errorImage'), variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePublish = (content: string) => {
    setPublisherContent(content);
    setShowPublisher(true);
  };

  const handlePublishSuccess = () => {
    // Reset all form fields
    setContentPrompt('');
    setGeneratedContent('');
    setManualContent('');
    setGeneratedImage('');
    setPublisherContent('');
    setCurrentContentIdeaId(undefined);
    setShowPublisher(false);
    
    toast({
      title: "Formulario limpiado",
      description: "Puedes crear nuevo contenido ahora",
    });
  };

  if (showAdvancedCreator) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedCreator(false)}
            size="sm"
          >
            ← Volver a Creador Simple
          </Button>
        </div>
        <AdvancedContentCreator 
          profile={profile}
          topPosts={topPosts}
          selectedPlatform={selectedPlatform}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Advanced Content Creator */}
      {showAdvancedCreator ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Content Studio IA - Versión Avanzada
              </h2>
              <p className="text-muted-foreground">
                Crea, guarda y gestiona insights personalizados con generación multimedia automática
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedCreator(false)}
            >
              Volver al creador simple
            </Button>
          </div>
          
          <AdvancedContentCreator
            profile={profile}
            topPosts={topPosts}
            selectedPlatform={selectedPlatform}
          />
        </div>
      ) : (
        <>
          {/* Upgrade to Advanced Creator */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Brain className="h-5 w-5" />
                Content Studio IA - Versión Avanzada
              </CardTitle>
              <p className="text-sm text-purple-600">
                Crea, guarda y gestiona insights personalizados con generación multimedia automática
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Target className="h-4 w-4" />
                    <span>Insights persistentes y organizados</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Sparkles className="h-4 w-4" />
                    <span>Generación automática de imágenes y videos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Gestión completa de contenido multimedia</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowAdvancedCreator(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Probar Ahora <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Main Content Creator */}
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <PlusCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Crear Contenido</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Elige tu método preferido</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auto" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50">
              <TabsTrigger 
                value="auto" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Generación IA</span>
              </TabsTrigger>
              <TabsTrigger 
                value="manual" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Edit3 className="h-4 w-4" />
                <span className="font-medium">Escribir Manual</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <label className="block text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  Describe el contenido que quieres crear
                </label>
                <Textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Ej: Crea una publicación sobre los beneficios de la automatización empresarial, enfocada en ahorro de tiempo y costos..."
                  className="h-28 resize-none border-2 focus:border-primary transition-colors"
                />
              </div>
              <Button 
                onClick={generateContent} 
                disabled={generatingContent || !contentPrompt.trim()} 
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {generatingContent ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generando contenido...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generar Contenido con IA
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <label className="block text-sm font-semibold flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-primary" />
                  Escribe tu contenido
                </label>
                <Textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Escribe tu publicación aquí..."
                  className="h-36 resize-none border-2 focus:border-primary transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => optimizeWithEra(manualContent, 'social_post', {
                    platform: selectedPlatform,
                    userType: 'company'
                  })}
                  disabled={isOptimizing || !manualContent.trim()}
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Optimizar con Era
                    </>
                  )}
                </Button>
                <Button 
                  onClick={generateImageWithEra}
                  disabled={generatingImage || !manualContent.trim()}
                  size="lg"
                  variant="outline"
                  className="border-2 hover:border-primary transition-all duration-300"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4 mr-2" />
                      Generar Imagen
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Generated/Manual Content Display */}
            {(generatedContent || manualContent) && (
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50/30 to-blue-50/30 animate-scale-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Sparkles className="h-5 w-5 text-green-600" />
                    </div>
                    {manualContent ? 'Tu Contenido' : 'Contenido Generado'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-5 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-green-200/50 shadow-sm">
                      <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                        {manualContent || generatedContent}
                      </div>
                    </div>
                    
                    {/* Generated Image */}
                    {generatedImage && (
                      <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-blue-200/50 shadow-sm">
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                          <Image className="h-4 w-4" />
                          Imagen Generada
                        </h4>
                        <img 
                          src={generatedImage} 
                          alt="Generated content image" 
                          className="max-w-full h-auto rounded-lg border-2 border-border shadow-md hover:shadow-xl transition-shadow duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(manualContent || generatedContent);
                          toast({ title: t('toast.copied'), description: t('toast.copiedClipboard') });
                        }}
                        className="hover-scale"
                      >
                        <Copy className="h-4 w-4 mr-1" />Copiar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handlePublish(manualContent || generatedContent)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-300 hover-scale"
                      >
                        <Send className="h-4 w-4 mr-1" />Publicar Ahora
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          if (manualContent) {
                            setManualContent(''); 
                            setGeneratedImage('');
                          } else {
                            setGeneratedContent('');
                          }
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced Historical Performance Insights */}
      {topPosts.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 shadow-lg animate-fade-in">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-md">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Análisis de Contenido Histórico</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Aprende de tu contenido más exitoso
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {topPosts.length} posts analizados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Hashtags Section */}
              <div className="space-y-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <h4 className="font-semibold text-primary">Hashtags Exitosos</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(topPosts.flatMap(post => post.hashTags || []))).slice(0, 10).map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs hover:bg-primary hover:text-white cursor-pointer transition-all duration-200 hover-scale"
                      onClick={() => {
                        navigator.clipboard.writeText(`#${tag}`);
                        toast({ title: t('toast.copied'), description: `#${tag} ${t('toast.copiedClipboard')}` });
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Click para copiar cualquier hashtag
                </p>
              </div>
              
              {/* Formats Section */}
              <div className="space-y-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-purple-500/10 hover:border-purple-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <h4 className="font-semibold text-purple-700">Formatos Populares</h4>
                </div>
                <div className="space-y-2">
                  {Array.from(new Set(topPosts.map(post => post.type || 'POST'))).slice(0, 5).map((type, index) => {
                    const count = topPosts.filter(p => (p.type || 'POST') === type).length;
                    const percentage = (count / topPosts.length) * 100;
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{type.toLowerCase()}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full bg-purple-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Engagement Stats Section */}
              <div className="space-y-3 p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-orange-500/10 hover:border-orange-500/30 transition-colors duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <h4 className="font-semibold text-orange-700">Estadísticas Clave</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                        {Math.round(topPosts.reduce((acc, post) => acc + ((post.likes || 0) + (post.comments || 0)), 0) / topPosts.length)}
                      </span>
                      <span className="text-xs text-muted-foreground">interacciones</span>
                    </div>
                    <p className="text-xs text-muted-foreground">por post en promedio</p>
                  </div>
                  
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        Likes
                      </span>
                      <span className="font-semibold">
                        {Math.round(topPosts.reduce((acc, post) => acc + (post.likes || 0), 0) / topPosts.length)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-500" />
                        Comentarios
                      </span>
                      <span className="font-semibold">
                        {Math.round(topPosts.reduce((acc, post) => acc + (post.comments || 0), 0) / topPosts.length)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Insight */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/30">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    💡 Consejo: Usa estos datos para tu próximo contenido
                  </p>
                  <p className="text-xs text-blue-700">
                    Los hashtags y formatos mostrados aquí son los que han generado mayor engagement. 
                    Considera incorporarlos en tu siguiente publicación para maximizar el alcance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Era Optimization Dialog */}
      <EraOptimizerDialog
        isOpen={showOptimizedDialog}
        onClose={() => rejectOptimization()}
        originalText={manualContent}
        optimizedText={optimizedText}
        onAccept={acceptOptimization}
        onReject={rejectOptimization}
      />

      {/* Publisher Dialog */}
      {showPublisher && (
        <SimpleContentPublisher
          isOpen={showPublisher}
          onClose={() => setShowPublisher(false)}
          content={{
            title: 'Contenido Simple',
            content: publisherContent,
            generatedImage: generatedImage || undefined
          }}
          profile={profile}
          onSuccess={handlePublishSuccess}
          contentIdeaId={currentContentIdeaId}
        />
      )}

      {/* Smart Loaders */}
      <SmartLoader
        isVisible={generatingContent}
        type="content-generation"
        message="Creando contenido personalizado para tu audiencia..."
        size="md"
      />
      
      <SmartLoader
        isVisible={generatingImage}
        type="image-generation"
        message="Generando imagen profesional para tu contenido..."
        size="md"
      />
      
      <SmartLoader
        isVisible={isOptimizing}
        type="optimization"
        message="Era está optimizando tu contenido..."
        size="md"
      />
    </div>
  );
}