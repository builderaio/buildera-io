import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdvancedAILoader from "@/components/ui/advanced-ai-loader";
import { PlusCircle, Sparkles, Lightbulb, Copy } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            Creador de Contenido IA
          </CardTitle>
          <p className="text-sm text-muted-foreground">Genera nuevo contenido basado en el rendimiento de tus publicaciones exitosas</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contenido Generado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
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

      {topPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />Insights de Contenido Exitoso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Hashtags más exitosos</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set(topPosts.flatMap(post => post.hashTags || []))).slice(0, 10).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tipos de contenido exitoso</h4>
                <div className="space-y-1 text-sm">
                  {Array.from(new Set(topPosts.map(post => post.type || 'POST'))).map((type, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
