import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Lightbulb, 
  Users, 
  TrendingUp, 
  Calendar, 
  Hash, 
  ExternalLink,
  PlusCircle,
  FileText,
  Camera,
  Video,
  Zap
} from "lucide-react";

interface InsightsRendererProps {
  insights: string;
  onCreateContent?: () => void;
  onOpenCalendar?: () => void;
  onOpenCreator?: () => void;
}

interface ParsedInsight {
  title: string;
  content: string;
}

interface ParsedContentIdea {
  title: string;
  format: string;
  platform: string;
  hashtags: string[];
  timing: string;
  strategy: string;
}

const InsightsRenderer = ({ insights, onCreateContent, onOpenCalendar, onOpenCreator }: InsightsRendererProps) => {
  
  const parseInsights = (rawInsights: string) => {
    const sections = rawInsights.split(/\*\*💡 IDEAS DE CONTENIDO\*\*/);
    const audienceSection = sections[0]?.replace(/\*\*📊 INSIGHTS DE AUDIENCIA\*\*/, '').trim();
    const contentSection = sections[1]?.trim();

    // Parse audience insights
    const audienceInsights: ParsedInsight[] = [];
    if (audienceSection) {
      const insights = audienceSection.split(/\d+\.\s+\*\*/).filter(Boolean);
      insights.forEach(insight => {
        const lines = insight.split('\n');
        const title = lines[0]?.replace(/\*\*:?/, '').trim();
        const content = lines.slice(1).join(' ').replace(/^\*\*/, '').trim();
        if (title && content) {
          audienceInsights.push({ title, content });
        }
      });
    }

    // Parse content ideas
    const contentIdeas: ParsedContentIdea[] = [];
    if (contentSection) {
      const ideas = contentSection.split(/\d+\.\s+\*\*/).filter(Boolean);
      ideas.forEach(idea => {
        const lines = idea.split('\n').filter(line => line.trim());
        const title = lines[0]?.replace(/\*\*$/, '').replace(/"/g, '').trim();
        
        let format = '';
        let platform = '';
        let hashtags: string[] = [];
        let timing = '';
        let strategy = '';

        lines.forEach(line => {
          if (line.includes('**Formato sugerido**:')) {
            format = line.replace('**Formato sugerido**:', '').trim();
          } else if (line.includes('**Plataforma recomendada**:')) {
            platform = line.replace('**Plataforma recomendada**:', '').trim();
          } else if (line.includes('**Hashtags**:')) {
            const hashtagsText = line.replace('**Hashtags**:', '').trim();
            hashtags = hashtagsText.split(' ').filter(tag => tag.startsWith('#'));
          } else if (line.includes('**Hora/día sugerido**:')) {
            timing = line.replace('**Hora/día sugerido**:', '').replace('para publicar', '').trim();
          } else if (line.includes('**Estrategia**:')) {
            strategy = line.replace('**Estrategia**:', '').trim();
          }
        });

        if (title) {
          contentIdeas.push({ title, format, platform, hashtags, timing, strategy });
        }
      });
    }

    return { audienceInsights, contentIdeas };
  };

  const { audienceInsights, contentIdeas } = parseInsights(insights);

  const getFormatIcon = (format: string) => {
    if (format.toLowerCase().includes('video')) return <Video className="h-4 w-4" />;
    if (format.toLowerCase().includes('carrusel') || format.toLowerCase().includes('carousel')) return <Camera className="h-4 w-4" />;
    if (format.toLowerCase().includes('story')) return <Zap className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
      case 'instagram reels':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'linkedin':
        return 'bg-blue-600';
      case 'tiktok':
        return 'bg-black';
      case 'facebook':
        return 'bg-blue-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="space-y-8">
      {/* Audience Insights Section */}
      {audienceInsights.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">📊 Insights de Audiencia</h3>
              <p className="text-sm text-muted-foreground">Patrones identificados en tu audiencia</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {audienceInsights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {audienceInsights.length > 0 && contentIdeas.length > 0 && (
        <Separator className="my-8" />
      )}

      {/* Content Ideas Section */}
      {contentIdeas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">💡 Ideas de Contenido</h3>
                <p className="text-sm text-muted-foreground">Ideas específicas listas para crear</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onOpenCalendar}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Planificar
              </Button>
              <Button 
                size="sm"
                onClick={onOpenCreator}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Crear Contenido
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contentIdeas.map((idea, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-tight flex-1">
                      {idea.title}
                    </CardTitle>
                    {getFormatIcon(idea.format)}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {idea.format}
                    </Badge>
                    {idea.platform && (
                      <Badge 
                        className={`text-white text-xs ${getPlatformColor(idea.platform)}`}
                      >
                        {idea.platform}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Strategy */}
                  {idea.strategy && (
                    <div>
                      <h5 className="text-sm font-medium mb-1">Estrategia:</h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {idea.strategy}
                      </p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {idea.hashtags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Hashtags sugeridos:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {idea.hashtags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timing */}
                  {idea.timing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Mejor momento: {idea.timing}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={onCreateContent}
                      className="flex-1"
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Crear Ahora
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={onOpenCalendar}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Programar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action Section */}
      {(audienceInsights.length > 0 || contentIdeas.length > 0) && (
        <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold mb-2">¿Listo para crear contenido excepcional?</h4>
                <p className="text-muted-foreground">
                  Utiliza estos insights para crear contenido que conecte con tu audiencia
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Métricas
                </Button>
                <Button onClick={onOpenCreator}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Crear Contenido
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsRenderer;