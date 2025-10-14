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
  onCreateContent?: (contentData?: ParsedContentIdea) => void;
  onOpenCalendar?: (contentData?: ParsedContentIdea) => void;
  onOpenCreator?: () => void;
}

interface ParsedInsight {
  title: string;
  content: string;
}

export interface ParsedContentIdea {
  title: string;
  format: string;
  platform: string;
  hashtags: string[];
  timing: string;
  strategy: string;
  schedule?: boolean;
}

const InsightsRenderer = ({ insights, onCreateContent, onOpenCalendar, onOpenCreator }: InsightsRendererProps) => {
  
  const parseInsights = (rawInsights: string) => {
    const audienceInsights: ParsedInsight[] = [];
    const contentIdeas: ParsedContentIdea[] = [];
    
    console.log('🔍 Raw insights:', rawInsights);
    
    // First, split by content ideas section marker
    const contentIdeasSectionRegex = /\*\*[💡🔥✨]*\s*(IDEAS?\s+DE\s+CONTENIDO|CONTENT\s+IDEAS?)\*\*/i;
    const parts = rawInsights.split(contentIdeasSectionRegex);
    
    console.log('📦 Parts after split:', parts.length, parts);
    
    const audiencePart = parts[0] || '';
    const contentPart = parts.length > 1 ? parts[parts.length - 1] : '';
    
    console.log('👥 Audience part:', audiencePart);
    console.log('💡 Content part:', contentPart);
    
    // Parse audience insights
    const audienceSections = audiencePart.split(/\*\*Título\*\*:/i).filter(s => s.trim());
    audienceSections.forEach(section => {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      const title = lines[0].trim();
      
      // Skip if this is a section marker
      if (/^(IDEAS?\s+DE\s+CONTENIDO|CONTENT\s+IDEAS?)$/i.test(title)) return;
      
      // Look for **Estrategia**: pattern
      const estrategiaMatch = section.match(/\*\*Estrategia\*\*:\s*(.+)/is);
      const content = estrategiaMatch ? estrategiaMatch[1].trim() : lines.slice(1).join(' ').trim();
      
      if (content && content.length > 10) {
        audienceInsights.push({ title, content });
      }
    });
    
    // Parse content ideas
    const contentSections = contentPart.split(/\*\*Título\*\*:/i).filter(s => s.trim());
    contentSections.forEach(section => {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      const title = lines[0].trim();
      
      // Skip if this is a section marker
      if (/^(IDEAS?\s+DE\s+CONTENIDO|CONTENT\s+IDEAS?)$/i.test(title)) return;
      
      // Check if this has format/platform indicators (content idea)
      const hasFormatIndicators = lines.some(line => 
        /^(Story|Reel|Post|Video|Carrusel|Photo)/i.test(line) ||
        /^(Instagram|LinkedIn|TikTok|Facebook|Twitter)/i.test(line)
      );
      
      if (hasFormatIndicators) {
        let format = '';
        let platform = '';
        let hashtags: string[] = [];
        let strategy = '';
        
        // Find format
        const formatLine = lines.find(l => /^(Story|Reel|Post|Video|Carrusel|Photo)$/i.test(l));
        if (formatLine) {
          format = formatLine;
        }
        
        // Find platform
        const platformLine = lines.find(l => /^(Instagram|LinkedIn|TikTok|Facebook|Twitter)$/i.test(l));
        if (platformLine) {
          platform = platformLine;
        }
        
        // Find strategy
        const strategyIndex = lines.findIndex(l => /^Estrategia:/i.test(l));
        if (strategyIndex >= 0) {
          strategy = lines.slice(strategyIndex + 1)
            .filter(l => !l.startsWith('#') && !l.toLowerCase().includes('hashtags'))
            .join(' ')
            .trim();
        }
        
        // Find hashtags
        const hashtagsIndex = lines.findIndex(l => /hashtags sugeridos:/i.test(l));
        if (hashtagsIndex >= 0) {
          hashtags = lines.slice(hashtagsIndex + 1)
            .filter(l => l.startsWith('#'))
            .map(l => l.trim());
        }
        
        contentIdeas.push({ title, format, platform, hashtags, timing: '', strategy });
      }
    });
    
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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Insights de Audiencia
              </h3>
              <p className="text-sm text-muted-foreground">Patrones identificados en tu audiencia</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {audienceInsights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
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
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent/50">
              <Lightbulb className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-foreground to-accent-foreground/70 bg-clip-text text-transparent">
                Ideas de Contenido
              </h3>
              <p className="text-sm text-muted-foreground">Ideas específicas listas para crear</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contentIdeas.map((idea, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/50">
                <CardHeader className="pb-4 bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg leading-tight flex-1 font-semibold">
                      {idea.title}
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getFormatIcon(idea.format)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {idea.format && (
                      <Badge variant="secondary" className="text-xs font-medium">
                        {idea.format}
                      </Badge>
                    )}
                    {idea.platform && (
                      <Badge 
                        className={`text-white text-xs font-medium ${getPlatformColor(idea.platform)}`}
                      >
                        {idea.platform}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-4">
                  {/* Strategy */}
                  {idea.strategy && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Estrategia:
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {idea.strategy}
                      </p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {idea.hashtags.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5" />
                        Hashtags sugeridos:
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {idea.hashtags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timing */}
                  {idea.timing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-2 rounded-md">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Mejor momento: {idea.timing}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => onCreateContent?.(idea)}
                      className="flex-1"
                    >
                      <PlusCircle className="h-4 w-4 mr-1.5" />
                      Crear Ahora
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onOpenCalendar?.(idea)}
                    >
                      <Calendar className="h-4 w-4 mr-1.5" />
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