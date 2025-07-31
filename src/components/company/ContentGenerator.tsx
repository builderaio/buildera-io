import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Sparkles, 
  Copy, 
  Download, 
  Share2, 
  Image, 
  Video, 
  FileText,
  Instagram,
  Linkedin,
  Music,
  Twitter,
  Facebook,
  Youtube,
  Loader2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

interface ContentGeneratorProps {
  profile: any;
}

interface GeneratedContent {
  id: string;
  platform: string;
  type: 'text' | 'image' | 'video';
  content: string;
  tone: string;
  hashtags: string[];
  created: Date;
}

const ContentGenerator = ({ profile }: ContentGeneratorProps) => {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [contentType, setContentType] = useState<string>("text");
  const [contentTone, setContentTone] = useState<string>("professional");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(false);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-black' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-black' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  ];

  const contentTypes = [
    { id: 'text', label: 'Post de Texto', icon: FileText },
    { id: 'image', label: 'Post con Imagen', icon: Image },
    { id: 'video', label: 'Video/Reel', icon: Video },
  ];

  const tones = [
    { id: 'professional', label: 'Profesional' },
    { id: 'casual', label: 'Casual' },
    { id: 'enthusiastic', label: 'Entusiasta' },
    { id: 'educational', label: 'Educativo' },
    { id: 'humorous', label: 'Divertido' },
    { id: 'inspirational', label: 'Inspiracional' },
  ];

  const generateContent = async () => {
    if (!prompt.trim() || !selectedPlatform) {
      toast({
        title: "Campos requeridos",
        description: "Selecciona una plataforma y describe qué contenido quieres generar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular generación de contenido con IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockContent: GeneratedContent = {
        id: Date.now().toString(),
        platform: selectedPlatform,
        type: contentType as any,
        content: generateMockContent(selectedPlatform, contentTone, prompt),
        tone: contentTone,
        hashtags: generateMockHashtags(selectedPlatform),
        created: new Date()
      };

      setGeneratedContent(prev => [mockContent, ...prev]);
      
      toast({
        title: "¡Contenido generado!",
        description: "Tu contenido ha sido creado exitosamente.",
      });
      
      setPrompt("");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el contenido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockContent = (platform: string, tone: string, userPrompt: string): string => {
    const contents = {
      linkedin: {
        professional: `🚀 Reflexiones sobre ${userPrompt}

En el panorama empresarial actual, es fundamental entender cómo ${userPrompt} puede transformar nuestros procesos y generar valor real para nuestros clientes.

Algunos puntos clave:
• Innovación constante
• Enfoque en el cliente
• Adaptabilidad al cambio

¿Qué opinas sobre esta perspectiva? Me encantaría conocer tus experiencias.`,
        casual: `Hey! 👋 

Quería compartir algunos pensamientos sobre ${userPrompt}. Últimamente he estado reflexionando sobre esto y creo que hay oportunidades increíbles por explorar.

¿Tú qué piensas? ¡Cuéntame en los comentarios!`
      },
      instagram: {
        professional: `✨ ${userPrompt} ✨

Descubre cómo esto puede cambiar tu perspectiva y generar un impacto positivo en tu día a día.

Swipe para ver más detalles ➡️`,
        casual: `Mood: pensando en ${userPrompt} 💭

¿Alguien más está obsesionado con esto? 🙋‍♀️

Stories para más contenido 👆`
      },
      tiktok: {
        professional: `🎯 Todo sobre ${userPrompt}

3 cosas que necesitas saber:
1. Es tendencia por una razón
2. Puede impactar tu rutina diaria  
3. Vale la pena probarlo

¿Ya lo intentaste? ¡Cuéntame en los comentarios! 👇`,
        casual: `POV: cuando descubres ${userPrompt} 😍

No me voy a cansar de hablar de esto tbh

¿Team sí o team no? 🤔`
      }
    };

    const platformContent = contents[platform as keyof typeof contents];
    return platformContent?.[tone as keyof typeof platformContent] || 
           `Contenido generado sobre ${userPrompt} con tono ${tone} para ${platform}.`;
  };

  const generateMockHashtags = (platform: string): string[] => {
    const hashtagSets = {
      linkedin: ['#Marketing', '#Business', '#Innovation', '#Leadership', '#Growth'],
      instagram: ['#instagood', '#marketing', '#business', '#inspiration', '#lifestyle'],
      tiktok: ['#fyp', '#viral', '#trending', '#business', '#tips'],
      facebook: ['#marketing', '#business', '#social', '#growth', '#tips'],
      twitter: ['#marketing', '#business', '#innovation', '#tech', '#growth'],
      youtube: ['#youtube', '#content', '#marketing', '#business', '#tutorial']
    };

    return hashtagSets[platform as keyof typeof hashtagSets] || ['#content', '#marketing'];
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "¡Copiado!",
      description: "El contenido ha sido copiado al portapapeles.",
    });
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.icon : FileText;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.color : 'text-gray-600';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Generador de Contenido IA</h2>
          <p className="text-muted-foreground">
            Crea contenido optimizado para cada red social con inteligencia artificial
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by ERA
        </Badge>
      </div>

      {/* Formulario de generación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Crear Nuevo Contenido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => {
                    const IconComponent = platform.icon;
                    return (
                      <SelectItem key={platform.id} value={platform.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${platform.color}`} />
                          {platform.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-type">Tipo de Contenido</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tono</Label>
              <Select value={contentTone} onValueChange={setContentTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.id} value={tone.id}>
                      {tone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">Describe tu contenido</Label>
              <EraOptimizerButton
                currentText={prompt}
                fieldType="contenido de marketing"
                context={{
                  companyName: profile?.company_name,
                  industry: profile?.industry_sector,
                  platform: selectedPlatform,
                  tone: contentTone
                }}
                onOptimized={setPrompt}
                size="sm"
                disabled={!prompt.trim()}
              />
            </div>
            <Textarea
              id="prompt"
              placeholder="Ej: Un post sobre las ventajas de trabajar en remoto, incluyendo estadísticas y consejos prácticos..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={generateContent} 
            disabled={loading || !prompt.trim() || !selectedPlatform}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando contenido...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Contenido con IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Contenido generado */}
      {generatedContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Contenido Generado</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGeneratedContent([])}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpiar Todo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {generatedContent.map((content) => {
              const IconComponent = getPlatformIcon(content.platform);
              const platformName = platforms.find(p => p.id === content.platform)?.name || content.platform;
              
              return (
                <Card key={content.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-5 w-5 ${getPlatformColor(content.platform)}`} />
                        <span className="font-medium">{platformName}</span>
                        <Badge variant="outline" className="text-xs">
                          {content.tone}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(content.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Hashtags sugeridos:</Label>
                      <div className="flex flex-wrap gap-1">
                        {content.hashtags.map((hashtag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Generado {content.created.toLocaleTimeString()}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>Listo para publicar</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGenerator;