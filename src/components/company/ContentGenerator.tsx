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
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { parseAIServiceError, getAIErrorTranslationKey } from "@/utils/aiServiceErrors";
import { 
  Zap, 
  Sparkles, 
  Copy, 
  Share2, 
  FileText,
  Loader2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaYoutube, FaXTwitter } from 'react-icons/fa6';

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
  const { t } = useTranslation(['marketing', 'errors']);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [contentType, setContentType] = useState<string>("text");
  const [contentTone, setContentTone] = useState<string>("professional");
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(false);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: 'text-[#0077B5]' },
    { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: 'text-[#E4405F]' },
    { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: 'text-foreground' },
    { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: 'text-[#1877F2]' },
    { id: 'twitter', name: 'X (Twitter)', icon: FaXTwitter, color: 'text-foreground' },
    { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: 'text-[#FF0000]' },
  ];

  const contentTypes = [
    { id: 'text', labelKey: 'generator.types.text', icon: FileText },
    { id: 'image', labelKey: 'generator.types.image', icon: FileText },
    { id: 'video', labelKey: 'generator.types.video', icon: FileText },
  ];

  const tones = [
    { id: 'professional', labelKey: 'generator.tones.professional' },
    { id: 'casual', labelKey: 'generator.tones.casual' },
    { id: 'enthusiastic', labelKey: 'generator.tones.enthusiastic' },
    { id: 'educational', labelKey: 'generator.tones.educational' },
    { id: 'humorous', labelKey: 'generator.tones.humorous' },
    { id: 'inspirational', labelKey: 'generator.tones.inspirational' },
  ];

  const generateContent = async () => {
    if (!prompt.trim() || !selectedPlatform) {
      toast({
        title: t('errors:general.title'),
        description: t('marketing:generator.fieldsRequired'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          userId: profile?.user_id,
          prompt,
          platform: selectedPlatform,
          contentType,
          tone: contentTone,
        }
      });

      if (error) throw error;

      const contentText = data?.content || data?.generatedText || '';
      const hashtags = data?.hashtags || [];

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        platform: selectedPlatform,
        type: contentType as any,
        content: contentText,
        tone: contentTone,
        hashtags,
        created: new Date()
      };

      setGeneratedContent(prev => [newContent, ...prev]);
      
      toast({
        title: t('marketing:generator.generated'),
        description: t('marketing:generator.generatedDesc'),
      });
      
      setPrompt("");
    } catch (error) {
      console.error('Error generating content:', error);
      const parsed = await parseAIServiceError(error);
      toast({
        title: t('errors:general.title'),
        description: t(getAIErrorTranslationKey(parsed.code), {
          defaultValue: t('marketing:generator.errorGenerating'),
        }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: t('marketing:generator.copied'),
      description: t('marketing:generator.copiedDesc'),
    });
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.icon : FileText;
  };

  const getPlatformColor = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    return platform ? platform.color : 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('marketing:generator.title')}</h2>
          <p className="text-muted-foreground">
            {t('marketing:generator.subtitle')}
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by ERA
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t('marketing:generator.createNew')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">{t('marketing:generator.platform')}</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder={t('marketing:generator.selectPlatform')} />
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
              <Label htmlFor="content-type">{t('marketing:generator.contentType')}</Label>
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
                          {t(`marketing:${type.labelKey}`)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">{t('marketing:generator.tone')}</Label>
              <Select value={contentTone} onValueChange={setContentTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.id} value={tone.id}>
                      {t(`marketing:${tone.labelKey}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">{t('marketing:generator.describeContent')}</Label>
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
              placeholder={t('marketing:generator.placeholder')}
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
                {t('marketing:generator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('marketing:generator.generateWithAI')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('marketing:generator.generatedContent')}</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGeneratedContent([])}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('marketing:generator.clearAll')}
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
                          {t(`marketing:generator.tones.${content.tone}`, content.tone)}
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
                    
                    {content.hashtags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">{t('marketing:generator.suggestedHashtags')}</Label>
                        <div className="flex flex-wrap gap-1">
                          {content.hashtags.map((hashtag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {hashtag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('marketing:generator.generatedAt')} {content.created.toLocaleTimeString()}</span>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>{t('marketing:generator.readyToPublish')}</span>
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