import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import { PlusCircle, Sparkles, Lightbulb, Copy, Brain, Target, TrendingUp, Clock, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AdvancedContentCreator from "./AdvancedContentCreator";

interface Props {
  profile: { user_id?: string };
  topPosts: any[];
  selectedPlatform: string;
}

export default function ContentCreatorTab({ profile, topPosts, selectedPlatform }: Props) {
  const { toast } = useToast();
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentPrompt, setContentPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(false);

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
      toast({ title: "¡Contenido generado!", description: "Tu nuevo contenido está listo para revisar" });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({ title: "Error", description: "No se pudo generar el contenido. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setGeneratingContent(false);
    }
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
          <p className="text-sm text-muted-foreground">Genera contenido rápido basado en tus publicaciones exitosas</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Describe el contenido que quieres crear</label>
            <textarea
              value={contentPrompt}
              onChange={(e) => setContentPrompt(e.target.value)}
              placeholder="Ej: Crea una publicación sobre los beneficios de la automatización empresarial, enfocada en ahorro de tiempo y costos..."
              className="w-full h-24 px-3 py-2 border border-border rounded-lg bg-background resize-none"
            />
          </div>
          <Button onClick={generateContent} disabled={generatingContent || !contentPrompt.trim()} className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            {generatingContent ? (<><AdvancedAILoader isVisible={true} />Generando contenido...</>) : (<><Sparkles className="h-4 w-4 mr-2" />Generar Contenido</>)}
          </Button>
          {generatedContent && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  Contenido Generado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-green-50/50 to-blue-50/50 rounded-lg border border-green-200/50">
                    <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                      <Copy className="h-4 w-4 mr-1" />Copiar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setGeneratedContent('')}>Limpiar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
    </div>
  );
}