import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Upload, CheckCircle2, Clock, AlertCircle, Loader2, Edit3, Save, X, Calendar, Image, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ContentImageSelector from "./ContentImageSelector";
import { SmartLoader } from "@/components/ui/smart-loader";
import { getPlatformIcon, getPlatformColor, getPlatform } from "@/lib/socialPlatforms";

interface SocialAccount {
  platform: string;
  platform_display_name: string;
  is_connected: boolean;
  company_username: string;
  page_id?: string;
  page_name?: string;
}

interface SimpleContent {
  title: string;
  content: string;
  generatedImage?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  content: SimpleContent;
  profile: { user_id?: string };
  onSuccess?: () => void;
  contentIdeaId?: string;
  generatedContentId?: string;
  source?: 'insight' | 'manual' | 'ai';
}

export default function SimpleContentPublisher({ 
  isOpen, 
  onClose, 
  content, 
  profile, 
  onSuccess, 
  contentIdeaId,
  generatedContentId,
  source = 'manual'
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [editingContent, setEditingContent] = useState<string>(content.content);
  const [isEditing, setIsEditing] = useState(false);
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedContentImage, setSelectedContentImage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Fetch social accounts when dialog opens
  useEffect(() => {
    if (isOpen && profile.user_id) {
      fetchSocialAccounts();
    }
  }, [isOpen, profile.user_id]);

  // Update editing content when prop changes and detect if needs generation
  useEffect(() => {
    setEditingContent(content.content);
    // Detectar si necesita generación de contenido
    setNeedsGeneration(!!contentIdeaId && source === 'insight');
  }, [content.content, contentIdeaId, source]);

  const fetchSocialAccounts = async () => {
    try {
      const accounts: SocialAccount[] = [];

      // 1) Prefer unified social_accounts table
      const { data: unified, error: unifiedError } = await supabase
        .from('social_accounts')
        .select('platform, platform_display_name, is_connected, company_username, facebook_page_id, linkedin_page_id, platform_username')
        .eq('user_id', profile.user_id)
        .eq('is_connected', true)
        .neq('platform', 'upload_post_profile');

      if (unifiedError) {
        console.warn('social_accounts query error:', unifiedError);
      }

      if (unified && unified.length > 0) {
        unified.forEach((row: any) => {
          accounts.push({
            platform: row.platform,
            platform_display_name: row.platform_display_name || row.platform,
            is_connected: true,
            company_username: row.company_username || row.platform_username || 'mi_cuenta',
            page_id: row.facebook_page_id || row.linkedin_page_id || undefined,
            page_name: row.platform_username || undefined,
          });
        });
      }

      // 2) Fallback to legacy connection tables if nothing found
      if (accounts.length === 0) {
        // Facebook/Instagram legacy
        const { data: fbData } = await supabase
          .from('facebook_instagram_connections')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (fbData) {
          if (fbData.facebook_user_id) {
            const userData = fbData.user_data as any;
            accounts.push({
              platform: 'facebook',
              platform_display_name: 'Facebook',
              is_connected: true,
              company_username: userData?.name || 'Mi Página',
              page_id: fbData.facebook_user_id,
              page_name: userData?.name,
            });
          }
          // Instagram could be added here if needed
        }

        // LinkedIn legacy
        const { data: linkedinData } = await supabase
          .from('linkedin_connections')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (linkedinData && linkedinData.company_page_id) {
          accounts.push({
            platform: 'linkedin',
            platform_display_name: 'LinkedIn',
            is_connected: true,
            company_username: linkedinData.company_page_name || 'Mi Perfil',
            page_id: linkedinData.company_page_id,
            page_name: linkedinData.company_page_name,
          });
        }

        // TikTok legacy
        const { data: tiktokData } = await supabase
          .from('tiktok_connections')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (tiktokData?.access_token) {
          const userData = tiktokData.user_data as any;
          accounts.push({
            platform: 'tiktok',
            platform_display_name: 'TikTok',
            is_connected: true,
            company_username: userData?.display_name || '@mitiktok',
          });
        }
      }

      setSocialAccounts(accounts);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cuentas sociales',
        variant: 'destructive'
      });
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const saveEditedContent = () => {
    setIsEditing(false);
    toast({
      title: "Contenido actualizado",
      description: "Los cambios han sido guardados"
    });
  };

  const handleGenerateContentFromInsight = async () => {
    if (!profile.user_id) return;
    
    setIsGeneratingContent(true);
    
    try {
      toast({
        title: "Generando contenido",
        description: "La IA está creando tu publicación...",
      });

      const { data, error } = await supabase.functions.invoke('generate-company-content', {
        body: {
          user_id: profile.user_id,
          prompt: `Basándote en esta estrategia de contenido: "${content.content}", 
                   genera una publicación atractiva y profesional para redes sociales. 
                   Incluye un gancho inicial, desarrollo del mensaje y call-to-action.`,
          content_type: 'social_post',
          tone: 'professional'
        }
      });

      if (error) throw error;

      if (data?.content) {
        setEditingContent(data.content);
        setNeedsGeneration(false);
        toast({
          title: "¡Contenido generado!",
          description: "Revisa y edita el contenido antes de publicar",
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el contenido",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!editingContent) {
      toast({
        title: "Error",
        description: "No hay contenido para generar la imagen",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketing-hub-image-creator", {
        body: {
          prompt: editingContent,
          imageType: "post",
          aspectRatio: "1:1",
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setSelectedContentImage(data.imageUrl);
        toast({
          title: "¡Imagen generada!",
          description: "La imagen ha sido generada con IA exitosamente",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una plataforma",
        variant: "destructive"
      });
      return;
    }

    if (publishMode === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast({
        title: "Error",
        description: "Selecciona fecha y hora para la publicación programada",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Determinar el username del perfil en Upload-Post
      let companyUsername = socialAccounts[0]?.company_username;
      if (!companyUsername && profile.user_id) {
        const { data: initData, error: initError } = await supabase.functions.invoke('upload-post-manager', {
          body: { action: 'init_profile', data: {} }
        });
        if (initError) throw new Error('No se pudo inicializar el perfil de Upload-Post');
        companyUsername = initData?.companyUsername;
      }
      if (!companyUsername) {
        throw new Error('No se encontró el perfil de Upload-Post (companyUsername)');
      }

      // Si hay imagen generada o seleccionada, guardarla en la biblioteca de contenidos
      const finalImage = selectedContentImage || content.generatedImage;
      if (finalImage && !selectedContentImage) {
        try {
          await supabase
            .from('content_recommendations')
            .insert({
              user_id: profile.user_id,
              title: content.title || 'Imagen generada',
              description: editingContent.slice(0, 200) + (editingContent.length > 200 ? '...' : ''),
              recommendation_type: 'post_template',
              status: 'template',
              platform: selectedPlatforms.join(', '),
              suggested_content: {
                content_text: editingContent,
                image_url: finalImage,
                metrics: { likes: 0, comments: 0 }
              }
            });
        } catch (saveError) {
          console.warn('Error saving to content library:', saveError);
        }
      }

      // Preparar payload para la función edge
      const isPhoto = Boolean(finalImage);
      const postType: 'text' | 'photo' | 'video' = isPhoto ? 'photo' : 'text';
      const title = content.title?.trim() || editingContent.slice(0, 80);
      const mediaUrls = isPhoto && finalImage ? [finalImage] : undefined;
      const scheduledISO = publishMode === 'scheduled'
        ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
        : undefined;

      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: {
          action: 'post_content',
          data: {
            companyUsername,
            platforms: selectedPlatforms,
            title,
            content: editingContent,
            mediaUrls,
            postType,
            scheduledDate: scheduledISO,
            async_upload: true,
          }
        }
      });

      if (error) throw error;

      console.log('Successfully published via edge function:', data);
      
      // Guardar en scheduled_posts para el calendario
      if (publishMode === 'scheduled' && scheduledISO) {
        try {
          const contentData = typeof editingContent === 'string' ? editingContent : JSON.stringify(editingContent);
          await supabase
            .from('scheduled_posts')
            .insert({
              user_id: profile.user_id,
              company_page_id: companyUsername,
              platform: selectedPlatforms[0], // Primary platform
              content: { text: contentData, mediaUrls, title },
              scheduled_for: scheduledISO,
              status: 'scheduled'
            });
        } catch (schedError) {
          console.warn('Error saving to scheduled_posts:', schedError);
        }
      }
      
      toast({
        title: publishMode === 'immediate' ? '¡Publicado!' : '¡Programado!',
        description: `Contenido ${publishMode === 'immediate' ? 'publicado' : 'programado'} en ${selectedPlatforms.length} plataforma(s)`,
      });
      
      // Mark content idea as completed and update tracking
      if (contentIdeaId) {
        try {
          // Update insight status to completed and mark as having generated content
          await supabase
            .from('content_insights')
            .update({ 
              status: 'completed',
              has_generated_content: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', contentIdeaId);
          
          // Keep legacy table for backward compatibility
          await supabase
            .from('completed_content_ideas')
            .insert({
              user_id: profile.user_id,
              content_idea_id: contentIdeaId,
              completed_at: new Date().toISOString(),
            });
        } catch (ideaError) {
          console.warn('Error marking content idea as completed:', ideaError);
        }
      }
      
      // Update generated content status if provided
      if (generatedContentId) {
        try {
          await supabase
            .from('generated_content')
            .update({
              publication_status: publishMode === 'scheduled' ? 'scheduled' : 'published',
              published_at: publishMode === 'scheduled' ? scheduledISO : new Date().toISOString()
            })
            .eq('id', generatedContentId);
        } catch (genError) {
          console.warn('Error updating generated content status:', genError);
        }
      }
      
      console.log('📊 Content tracking:', { source, contentIdeaId, generatedContentId, publishMode });
      
      // Call success callback to reset form
      onSuccess?.();
      
      // Close dialog and navigate to posts tab
      onClose();
      
      // Navigate to calendar tab if scheduled
      if (publishMode === 'scheduled') {
        setTimeout(() => {
          const calendarTab = document.querySelector('[data-value="calendar"]');
          if (calendarTab) {
            (calendarTab as HTMLElement).click();
          }
        }, 500);
      } else {
        // Navigate to content tab for immediate posts
        setTimeout(() => {
          const contentTab = document.querySelector('[data-value="content"]');
          if (contentTab) {
            (contentTab as HTMLElement).click();
            setTimeout(() => {
              const postsTab = document.querySelector('[data-value="post"]');
              if (postsTab) {
                (postsTab as HTMLElement).click();
              }
            }, 100);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error('Error publishing content:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo publicar el contenido',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors: Record<string, string> = {
      'facebook': 'bg-blue-600',
      'instagram': 'bg-gradient-to-r from-purple-600 to-pink-600',
      'twitter': 'bg-sky-500',
      'linkedin': 'bg-blue-800',
      'tiktok': 'bg-black',
      'youtube': 'bg-red-600'
    };
    return colors[platform] || 'bg-gray-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Publicar Contenido
            {contentIdeaId && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Desde Insight
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview and Edit */}
          <Card>
            <CardContent className="pt-6">
              {needsGeneration ? (
                // Modo: Generar contenido desde insight
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-2">Estrategia del Insight</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {content.content}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateContentFromInsight}
                    disabled={isGeneratingContent}
                    className="w-full"
                    size="lg"
                  >
                    {isGeneratingContent ? (
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

                  <p className="text-xs text-muted-foreground text-center">
                    La IA creará una publicación profesional basada en esta estrategia
                  </p>
                </div>
              ) : (
                // Modo: Editar contenido generado
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">Contenido</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      {isEditing ? 'Guardar' : 'Editar'}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[120px]"
                        placeholder="Edita tu contenido..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEditedContent}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingImage ? "Generando..." : "Generar Imagen"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingContent(content.content);
                          setIsEditing(false);
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap p-3 bg-muted rounded-md">
                      {editingContent || content.content}
                    </p>
                  )}

                  {/* Image Section */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Imagen</Label>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowImageSelector(true)}
                        className="text-xs"
                      >
                        <Image className="h-3 w-3 mr-1" />
                        Seleccionar de biblioteca
                      </Button>
                    </div>
                    
                    {(selectedContentImage || content.generatedImage) && (
                      <div className="relative">
                        <img 
                          src={selectedContentImage || content.generatedImage} 
                          alt="Content image" 
                          className="max-w-full h-auto rounded-lg border max-h-48 object-cover"
                        />
                        {selectedContentImage && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 p-1 h-6 w-6"
                            onClick={() => setSelectedContentImage('')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {!selectedContentImage && !content.generatedImage && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">No hay imagen seleccionada</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Publishing Mode */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium mb-3 block">Modo de Publicación</Label>
              <RadioGroup value={publishMode} onValueChange={(value: 'immediate' | 'scheduled') => setPublishMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Publicar inmediatamente
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Programar publicación
                  </Label>
                </div>
              </RadioGroup>

              {publishMode === 'scheduled' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium mb-3 block">Plataformas</Label>
              {socialAccounts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No hay cuentas sociales conectadas</p>
                  <p className="text-sm">Conecta tus cuentas en configuración</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {socialAccounts.map((account) => {
                    const PlatformIcon = getPlatformIcon(account.platform);
                    const platformInfo = getPlatform(account.platform);
                    const platformColor = getPlatformColor(account.platform);
                    
                    return (
                      <div
                        key={account.platform}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePlatformToggle(account.platform)}
                      >
                        <Checkbox
                          checked={selectedPlatforms.includes(account.platform)}
                          onChange={() => handlePlatformToggle(account.platform)}
                        />
                        <PlatformIcon 
                          className="h-5 w-5 flex-shrink-0" 
                          style={{ color: platformColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className="text-white border-0"
                              style={{ backgroundColor: platformColor }}
                            >
                              {platformInfo?.name || account.platform_display_name}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            @{account.company_username}
                          </p>
                          {account.page_name && (account.platform === 'facebook' || account.platform === 'linkedin') && (
                            <p className="text-xs text-muted-foreground truncate">
                              Página: {account.page_name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={loading || selectedPlatforms.length === 0 || needsGeneration}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : needsGeneration ? (
                'Genera contenido primero'
              ) : publishMode === 'immediate' ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publicar Ahora
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Programar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      <ContentImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelectImage={(imageUrl, contentText) => {
          setSelectedContentImage(imageUrl);
          if (contentText && !isEditing) {
            setEditingContent(contentText);
          }
        }}
        profile={profile}
      />

      <SmartLoader
        isVisible={loading}
        type="publishing"
        message={publishMode === 'immediate' ? 'Publicando en redes sociales...' : 'Programando publicación...'}
        size="md"
      />
    </Dialog>
  );
}