import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Upload, CheckCircle2, Clock, AlertCircle, Loader2, Edit3, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SocialAccount {
  platform: string;
  platform_display_name: string;
  is_connected: boolean;
  company_username: string;
}

interface ContentInsight {
  id: string;
  title: string;
  description?: string;
  format_type?: string;
  platform?: string;
  hashtags?: string[];
  suggested_schedule?: string;
}

interface GeneratedContent {
  id: string;
  content_text: string;
  content_type: string;
  media_url?: string;
}

interface Props {
  insight: ContentInsight;
  generatedContents: GeneratedContent[];
  userId: string;
}

export default function InsightPublisher({ insight, generatedContents, userId }: Props) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const loadSocialAccounts = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, platform_display_name, is_connected, company_username')
        .eq('user_id', userId)
        .eq('is_connected', true)
        .neq('platform', 'upload_post_profile');

      if (error) throw error;
      setSocialAccounts(data || []);
      
      // Auto-select the platform from insight if it matches available accounts
      if (insight.platform && data?.some(acc => acc.platform === insight.platform)) {
        setSelectedPlatforms([insight.platform]);
      }
    } catch (error) {
      console.error('Error loading social accounts:', error);
      toast({ title: "Error", description: "No se pudieron cargar las cuentas sociales", variant: "destructive" });
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadSocialAccounts();
    // Auto-select first content if available
    if (generatedContents.length > 0) {
      setSelectedContent(generatedContents[0]);
      setEditingContent(generatedContents[0].content_text);
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleContentSelect = (content: GeneratedContent) => {
    setSelectedContent(content);
    setEditingContent(content.content_text);
    setIsEditing(false);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && selectedContent) {
      setEditingContent(selectedContent.content_text);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // The editingContent will be used for publishing
  };

  const publishContent = async () => {
    if (!selectedContent || selectedPlatforms.length === 0) {
      toast({ title: "Selección requerida", description: "Selecciona contenido y al menos una plataforma", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      // Get company username
      const { data: accountData } = await supabase
        .from('social_accounts')
        .select('company_username')
        .eq('user_id', userId)
        .limit(1);

      const companyUsername = accountData?.[0]?.company_username;
      if (!companyUsername) {
        throw new Error('No se encontró el nombre de usuario de la empresa');
      }

      // Use edited content if available, otherwise use original
      const contentToPublish = isEditing ? editingContent : (editingContent || selectedContent.content_text);

      // Prepare content for publishing
      let publishData: any = {
        companyUsername,
        platforms: selectedPlatforms,
        textContent: contentToPublish
      };

      // Add hashtags from insight if available
      if (insight.hashtags && insight.hashtags.length > 0) {
        const hashtagText = insight.hashtags.map(tag => `#${tag}`).join(' ');
        publishData.textContent += `\n\n${hashtagText}`;
      }

      let action = 'post_content';
      
      // Determine action based on content type
      if (selectedContent.content_type === 'image' && selectedContent.media_url) {
        action = 'upload_photo';
        publishData.mediaUrl = selectedContent.media_url;
      } else if (selectedContent.content_type === 'video' && selectedContent.media_url) {
        action = 'upload_video';
        publishData.mediaUrl = selectedContent.media_url;
      } else {
        action = 'upload_text';
      }

      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action,
          data: publishData
        }
      });

      if (error) throw error;

      toast({ 
        title: "¡Contenido publicado!", 
        description: `Se ha publicado en ${selectedPlatforms.length} plataforma(s)`,
        duration: 5000
      });

      setIsOpen(false);
      
      // Show success with upload status info
      if (data?.requestId) {
        setTimeout(() => {
          toast({ 
            title: "Estado de publicación", 
            description: `ID de seguimiento: ${data.requestId}. Puedes verificar el estado en el historial.`,
            duration: 8000
          });
        }, 2000);
      }

    } catch (error) {
      console.error('Error publishing content:', error);
      toast({ 
        title: "Error al publicar", 
        description: error instanceof Error ? error.message : "No se pudo publicar el contenido", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return '💼';
      case 'facebook': return '📘';
      case 'instagram': return '📸';
      case 'twitter': return '🐦';
      case 'tiktok': return '🎵';
      default: return '📱';
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      default: return '📝';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          onClick={handleOpen}
          disabled={generatedContents.length === 0}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          <Share2 className="h-3 w-3 mr-1" />
          Publicar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publicar Insight: {insight.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Seleccionar contenido:</h4>
            <div className="grid gap-3">
              {generatedContents.map((content) => (
                <Card 
                  key={content.id}
                  className={`cursor-pointer transition-all ${
                    selectedContent?.id === content.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleContentSelect(content)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">
                        {getContentTypeIcon(content.content_type)}
                      </span>
                      <div className="flex-1 space-y-2">
                        <div className="text-sm text-muted-foreground line-clamp-3">
                          {content.content_text}
                        </div>
                        {content.media_url && (
                          <Badge variant="secondary" className="text-xs">
                            {content.content_type === 'image' ? 'Con imagen' : 'Con video'}
                          </Badge>
                        )}
                      </div>
                      {selectedContent?.id === content.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          {selectedContent && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Contenido a publicar:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditToggle}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4 mr-1" />
                      Editar
                    </>
                  )}
                </Button>
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Label htmlFor="content-editor">Editar contenido:</Label>
                  <Textarea
                    id="content-editor"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Edita tu contenido aquí..."
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Guardar cambios
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="p-4 bg-muted/50">
                  <div className="text-sm whitespace-pre-wrap">
                    {editingContent || selectedContent.content_text}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Platform Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Seleccionar plataformas:</h4>
            {socialAccounts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No hay cuentas sociales conectadas</p>
                <p className="text-sm">Conecta tus redes sociales para publicar contenido</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {socialAccounts.map((account) => (
                  <Card
                    key={account.platform}
                    className={`cursor-pointer transition-all ${
                      selectedPlatforms.includes(account.platform)
                        ? 'ring-2 ring-primary border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handlePlatformToggle(account.platform)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedPlatforms.includes(account.platform)}
                          onChange={() => handlePlatformToggle(account.platform)}
                        />
                        <span className="text-xl">
                          {getPlatformIcon(account.platform)}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">
                            {account.platform_display_name || account.platform}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Conectado
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Insight Details */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h5 className="font-medium">Detalles del insight:</h5>
            <div className="space-y-1 text-sm text-muted-foreground">
              {insight.format_type && (
                <p>📝 Formato: {insight.format_type}</p>
              )}
              {insight.platform && (
                <p>🎯 Plataforma recomendada: {insight.platform}</p>
              )}
              {insight.suggested_schedule && (
                <p>📅 Horario sugerido: {insight.suggested_schedule}</p>
              )}
              {insight.hashtags && insight.hashtags.length > 0 && (
                <p>🏷️ Hashtags: {insight.hashtags.map(tag => `#${tag}`).join(' ')}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={publishContent}
              disabled={loading || !selectedContent || selectedPlatforms.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publicar en {selectedPlatforms.length} plataforma(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}