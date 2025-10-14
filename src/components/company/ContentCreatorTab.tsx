import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { PlusCircle, Sparkles, Lightbulb, Copy, Brain, Target, TrendingUp, Clock, ArrowRight, Edit3, Image, Send, Calendar } from "lucide-react";
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
  } | null;
  onContentUsed?: () => void;
}

export default function ContentCreatorTab({ profile, topPosts, selectedPlatform, prepopulatedContent, onContentUsed }: Props) {
  const { toast } = useToast();
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentPrompt, setContentPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showPublisher, setShowPublisher] = useState(false);
  const [publisherContent, setPublisherContent] = useState('');
  
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
      // Build content with title, strategy, and hashtags
      let content = `${prepopulatedContent.title}\n\n`;
      
      if (prepopulatedContent.strategy) {
        content += `${prepopulatedContent.strategy}\n\n`;
      }
      
      if (prepopulatedContent.hashtags && prepopulatedContent.hashtags.length > 0) {
        content += prepopulatedContent.hashtags.join(' ');
      }
      
      setManualContent(content);
      setContentPrompt(prepopulatedContent.title);
      
      // Show publisher if schedule mode
      if (prepopulatedContent.schedule) {
        setPublisherContent(content);
        setShowPublisher(true);
      }
      
      toast({
        title: "Contenido pre-cargado",
        description: "Los datos de la idea se han cargado en el editor",
      });
      
      // Clear prepopulated data after use
      onContentUsed?.();
    }
  }, [prepopulatedContent]);

  const generateContent = async () => {
    if (!contentPrompt.trim()) {
      toast({ title: "Error", description: "Por favor ingresa una descripción para el contenido", variant: "destructive" });
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
      
      toast({ title: "¡Contenido generado!", description: "Tu nuevo contenido está listo para revisar" });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: "Error", description: "No se pudo generar el contenido. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateImageWithEra = async () => {
    const contentToUse = manualContent || generatedContent;
    if (!contentToUse.trim()) {
      toast({ title: "Error", description: "Necesitas contenido para generar una imagen", variant: "destructive" });
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
      
      toast({ title: "¡Imagen generada!", description: "Tu imagen está lista" });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({ title: "Error", description: "No se pudo generar la imagen. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handlePublish = (content: string) => {
    setPublisherContent(content);
    setShowPublisher(true);
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

      {/* Simple Content Creator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Creador de Contenido Simple
          </CardTitle>
          <p className="text-sm text-muted-foreground">Crea contenido manualmente o genera con IA</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auto" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generación IA
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Escribir Manualmente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Describe el contenido que quieres crear</label>
                <Textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  placeholder="Ej: Crea una publicación sobre los beneficios de la automatización empresarial, enfocada en ahorro de tiempo y costos..."
                  className="h-24"
                />
              </div>
              <Button onClick={generateContent} disabled={generatingContent || !contentPrompt.trim()} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                {generatingContent ? "Generando contenido..." : "Generar Contenido"}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Escribe tu contenido</label>
                <Textarea
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Escribe tu publicación aquí..."
                  className="h-32"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => optimizeWithEra(manualContent, 'social_post', {
                    platform: selectedPlatform,
                    userType: 'company'
                  })}
                  disabled={isOptimizing || !manualContent.trim()}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
                >
                  {isOptimizing ? "Era optimizando..." : "Optimizar con Era"}
                </Button>
                <Button 
                  onClick={generateImageWithEra}
                  disabled={generatingImage || !manualContent.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {generatingImage ? "Generando..." : "Generar Imagen"}
                </Button>
              </div>
            </TabsContent>

            {/* Generated/Manual Content Display */}
            {(generatedContent || manualContent) && (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    {manualContent ? 'Tu Contenido' : 'Contenido Generado'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-50/50 to-blue-50/50 rounded-lg border border-green-200/50">
                      <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                        {manualContent || generatedContent}
                      </div>
                    </div>
                    
                    {/* Generated Image */}
                    {generatedImage && (
                      <div className="p-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/50">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Imagen Generada
                        </h4>
                        <img 
                          src={generatedImage} 
                          alt="Generated content image" 
                          className="max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(manualContent || generatedContent)}>
                        <Copy className="h-4 w-4 mr-1" />Copiar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handlePublish(manualContent || generatedContent)}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Send className="h-4 w-4 mr-1" />Publicar
                      </Button>
                      {!manualContent && (
                        <Button size="sm" variant="outline" onClick={() => setGeneratedContent('')}>
                          Limpiar
                        </Button>
                      )}
                      {manualContent && (
                        <Button size="sm" variant="outline" onClick={() => {setManualContent(''); setGeneratedImage('');}}>
                          Limpiar Todo
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Historical Performance Insights */}
      {topPosts.length > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análisis de Contenido Histórico
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Patrones identificados en tu contenido con mejor rendimiento
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <h4 className="font-medium">Hashtags más exitosos</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(topPosts.flatMap(post => post.hashTags || []))).slice(0, 8).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs hover:bg-primary hover:text-white transition-colors">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h4 className="font-medium">Formatos exitosos</h4>
                </div>
                <div className="space-y-1">
                  {Array.from(new Set(topPosts.map(post => post.type || 'POST'))).slice(0, 4).map((type, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="capitalize">{type.toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <h4 className="font-medium">Engagement promedio</h4>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {Math.round(topPosts.reduce((acc, post) => acc + ((post.likes || 0) + (post.comments || 0)), 0) / topPosts.length)}
                </div>
                <p className="text-xs text-muted-foreground">interacciones por post</p>
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