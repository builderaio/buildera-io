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
import { Share2, Upload, CheckCircle2, Clock, AlertCircle, Loader2, Edit3, Save, X, Calendar, Image, Sparkles, FileUp, Video, FileText, ChevronDown, ListPlus, MessageSquare, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ContentImageSelector from "./ContentImageSelector";
import HookTemplateSelector from "./HookTemplateSelector";
import { SmartLoader } from "@/components/ui/smart-loader";
import { getPlatformIcon, getPlatformColor, getPlatform } from "@/lib/socialPlatforms";
import { useTranslation } from "react-i18next";

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

interface PlatformParams {
  instagram_media_type?: string;
  instagram_collaborators?: string;
  tiktok_privacy_level?: string;
  tiktok_is_aigc?: boolean;
  youtube_tags?: string[];
  youtube_privacy_status?: string;
  youtube_category_id?: string;
  youtube_contains_synthetic_media?: boolean;
  facebook_media_type?: string;
  pinterest_board_id?: string;
  pinterest_link?: string;
  subreddit?: string;
  flair_id?: string;
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
  const { t } = useTranslation('marketing');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [editingContent, setEditingContent] = useState<string>(content.content);
  const [isEditing, setIsEditing] = useState(false);
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled' | 'queue'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [selectedContentImage, setSelectedContentImage] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>('');
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  // New fields
  const [firstComment, setFirstComment] = useState('');
  const [platformParamsOpen, setPlatformParamsOpen] = useState(false);
  const [platformParams, setPlatformParams] = useState<PlatformParams>({});

  // Fetch social accounts when dialog opens
  useEffect(() => {
    if (isOpen && profile.user_id) {
      fetchSocialAccounts();
    }
  }, [isOpen, profile.user_id]);

  // Update editing content when prop changes and detect if needs generation
  useEffect(() => {
    setEditingContent(content.content);
    setNeedsGeneration(!!contentIdeaId && source === 'insight');
  }, [content.content, contentIdeaId, source]);

  const fetchSocialAccounts = async () => {
    try {
      const accounts: SocialAccount[] = [];

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

      if (accounts.length === 0) {
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
        }

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
        description: t('publisher.errorLoadingAccounts', 'No se pudieron cargar las cuentas sociales'),
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
      title: t('publisher.contentUpdated', 'Contenido actualizado'),
      description: t('publisher.changesSaved', 'Los cambios han sido guardados')
    });
  };

  const handleGenerateContentFromInsight = async () => {
    if (!profile.user_id) return;
    
    setIsGeneratingContent(true);
    
    try {
      toast({
        title: t('publisher.generatingContent', 'Generando contenido'),
        description: t('publisher.aiCreating', 'La IA está creando tu publicación...'),
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
          title: t('publisher.contentGenerated', '¡Contenido generado!'),
          description: t('publisher.reviewBeforePublish', 'Revisa y edita el contenido antes de publicar'),
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error",
        description: t('publisher.errorGenerating', 'No se pudo generar el contenido'),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    const validPdfType = 'application/pdf';

    let mediaType: 'image' | 'video' | 'pdf' | null = null;
    if (validImageTypes.includes(file.type)) {
      mediaType = 'image';
    } else if (validVideoTypes.includes(file.type)) {
      mediaType = 'video';
    } else if (file.type === validPdfType) {
      mediaType = 'pdf';
    } else {
      toast({
        title: t('publisher.invalidFileType', 'Tipo de archivo no válido'),
        description: t('publisher.allowedFiles', 'Solo se permiten imágenes (JPG, PNG, GIF, WEBP), videos (MP4, MOV, AVI) o PDFs'),
        variant: "destructive",
      });
      return;
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: t('publisher.fileTooLarge', 'Archivo muy grande'),
        description: t('publisher.maxFileSize', 'El archivo no debe superar los 20MB'),
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;
      const bucketName = mediaType === 'image' ? 'content-media' : 
                         mediaType === 'video' ? 'content-videos' : 
                         'content-documents';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setUploadedMediaUrl(publicUrl);
      setUploadedMediaType(mediaType);
      
      if (mediaType === 'image') {
        setSelectedContentImage(publicUrl);
      }

      toast({
        title: t('publisher.fileUploaded', '¡Archivo cargado!'),
        description: `${mediaType === 'image' ? 'Imagen' : mediaType === 'video' ? 'Video' : 'PDF'} cargado exitosamente`,
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      toast({
        title: "Error",
        description: t('publisher.uploadError', 'No se pudo cargar el archivo'),
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
      event.target.value = '';
    }
  };

  const handleGenerateImage = async () => {
    if (!editingContent) {
      toast({
        title: "Error",
        description: t('publisher.noContentForImage', 'No hay contenido para generar la imagen'),
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
        setUploadedMediaUrl(data.imageUrl);
        setUploadedMediaType('image');
        toast({
          title: t('publisher.imageGenerated', '¡Imagen generada!'),
          description: t('publisher.imageGeneratedDesc', 'La imagen ha sido generada con IA exitosamente'),
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: t('publisher.imageError', 'No se pudo generar la imagen'),
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
        description: t('publisher.selectPlatform', 'Selecciona al menos una plataforma'),
        variant: "destructive"
      });
      return;
    }

    if (publishMode === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast({
        title: "Error",
        description: t('publisher.selectDateTime', 'Selecciona fecha y hora para la publicación programada'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
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

      const isPhoto = Boolean(finalImage);
      const isVideo = uploadedMediaType === 'video';
      const postType: 'text' | 'photo' | 'video' = isVideo ? 'video' : isPhoto ? 'photo' : 'text';
      const title = content.title?.trim() || editingContent.slice(0, 80);
      const mediaUrls = (isPhoto || isVideo) && (uploadedMediaUrl || finalImage) ? [uploadedMediaUrl || finalImage] : undefined;
      const scheduledISO = publishMode === 'scheduled'
        ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
        : undefined;

      // Detect user timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: {
          action: 'post_content',
          data: {
            companyUsername,
            platforms: selectedPlatforms,
            title,
            content: editingContent,
            description: editingContent,
            mediaUrls,
            postType,
            scheduledDate: scheduledISO,
            async_upload: true,
            first_comment: firstComment || undefined,
            timezone: userTimezone,
            add_to_queue: publishMode === 'queue',
            platform_params: Object.keys(platformParams).length > 0 ? platformParams : undefined,
          }
        }
      });

      if (error) throw error;

      console.log('Successfully published via edge function:', data);
      
      if (publishMode === 'scheduled' && scheduledISO) {
        try {
          const contentData = typeof editingContent === 'string' ? editingContent : JSON.stringify(editingContent);
          await supabase
            .from('scheduled_posts')
            .insert({
              user_id: profile.user_id,
              company_page_id: companyUsername,
              platform: selectedPlatforms[0],
              content: { text: contentData, mediaUrls, title },
              scheduled_for: scheduledISO,
              status: 'scheduled'
            });
        } catch (schedError) {
          console.warn('Error saving to scheduled_posts:', schedError);
        }
      }
      
      const modeLabel = publishMode === 'immediate' ? t('publisher.published', '¡Publicado!') : 
                         publishMode === 'queue' ? t('publisher.queued', '¡Añadido a la cola!') :
                         t('publisher.scheduled', '¡Programado!');
      
      toast({
        title: modeLabel,
        description: `${t('publisher.contentIn', 'Contenido en')} ${selectedPlatforms.length} ${t('publisher.platforms', 'plataforma(s)')}`,
      });
      
      if (contentIdeaId) {
        try {
          await supabase
            .from('content_insights')
            .update({ 
              status: 'completed',
              has_generated_content: true,
              completed_at: new Date().toISOString()
            })
            .eq('id', contentIdeaId);
          
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
      
      onSuccess?.();
      onClose();
      
      if (publishMode === 'scheduled') {
        setTimeout(() => {
          const calendarTab = document.querySelector('[data-value="calendar"]');
          if (calendarTab) {
            (calendarTab as HTMLElement).click();
          }
        }, 500);
      } else {
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
        description: error.message || t('publisher.publishError', 'No se pudo publicar el contenido'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const hasInstagram = selectedPlatforms.includes('instagram');
  const hasTikTok = selectedPlatforms.includes('tiktok');
  const hasYouTube = selectedPlatforms.includes('youtube');
  const hasFacebook = selectedPlatforms.includes('facebook');
  const hasPinterest = selectedPlatforms.includes('pinterest');
  const hasReddit = selectedPlatforms.includes('reddit');
  const showPlatformParams = hasInstagram || hasTikTok || hasYouTube || hasFacebook || hasPinterest || hasReddit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('publisher.title', 'Publicar Contenido')}
            {contentIdeaId && (
              <Badge variant="secondary" className="ml-2 animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                {t('publisher.fromInsight', 'Desde Insight')}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview and Edit */}
          <Card>
            <CardContent className="pt-6">
              {needsGeneration ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-2">{t('publisher.insightStrategy', 'Estrategia del Insight')}</h4>
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
                        {t('publisher.generating', 'Generando contenido...')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        {t('publisher.generateWithAI', 'Generar Contenido con IA')}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {t('publisher.aiWillCreate', 'La IA creará una publicación profesional basada en esta estrategia')}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium">{t('publisher.content', 'Contenido')}</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      {isEditing ? t('publisher.save', 'Guardar') : t('publisher.edit', 'Editar')}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="min-h-[120px]"
                        placeholder={t('publisher.editPlaceholder', 'Edita tu contenido...')}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEditedContent}>
                          <Save className="h-4 w-4 mr-2" />
                          {t('publisher.save', 'Guardar')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleGenerateImage}
                          disabled={isGeneratingImage}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          {isGeneratingImage ? t('publisher.generatingImage', 'Generando...') : t('publisher.generateImage', 'Generar Imagen')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditingContent(content.content);
                          setIsEditing(false);
                        }}>
                          <X className="h-4 w-4 mr-2" />
                          {t('publisher.cancel', 'Cancelar')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground whitespace-pre-wrap p-3 bg-muted rounded-md">
                      {editingContent || content.content}
                    </p>
                  )}

                  {/* Hook Template Selector */}
                  <div className="mt-3">
                    <HookTemplateSelector
                      onSelect={(hookText) => {
                        const newContent = hookText + '\n\n' + (editingContent || '');
                        setEditingContent(newContent);
                        setIsEditing(true);
                      }}
                      selectedPlatforms={selectedPlatforms}
                    />
                  </div>

                  {/* Media Section */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">{t('publisher.media', 'Archivos multimedia')}</Label>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => document.getElementById('media-upload-input')?.click()}
                        disabled={isUploadingMedia}
                        className="w-full"
                      >
                        {isUploadingMedia ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileUp className="h-4 w-4 mr-2" />
                        )}
                        {t('publisher.uploadFile', 'Cargar archivo')}
                      </Button>
                      <input 
                        id="media-upload-input"
                        type="file" 
                        accept="image/*,video/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowImageSelector(true)}
                        className="w-full"
                      >
                        <Image className="h-4 w-4 mr-2" />
                        {t('publisher.library', 'Biblioteca')}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="w-full"
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {t('publisher.generateAI', 'Generar IA')}
                      </Button>
                    </div>
                    
                    {/* Media Preview */}
                    {(uploadedMediaUrl || selectedContentImage || content.generatedImage) && (
                      <div className="relative">
                        {uploadedMediaType === 'video' ? (
                          <video 
                            src={uploadedMediaUrl} 
                            controls 
                            className="max-w-full h-auto rounded-lg border max-h-48"
                          />
                        ) : uploadedMediaType === 'pdf' ? (
                          <div className="border rounded-lg p-4 bg-muted">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-red-600" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{t('publisher.pdfAttached', 'Documento PDF adjunto')}</p>
                                <a 
                                  href={uploadedMediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  {t('publisher.viewDocument', 'Ver documento')}
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={uploadedMediaUrl || selectedContentImage || content.generatedImage} 
                            alt="Content media" 
                            className="max-w-full h-auto rounded-lg border max-h-48 object-cover"
                          />
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 p-1 h-6 w-6"
                          onClick={() => {
                            setUploadedMediaUrl('');
                            setUploadedMediaType(null);
                            setSelectedContentImage('');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {!uploadedMediaUrl && !selectedContentImage && !content.generatedImage && (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <div className="flex justify-center gap-2 mb-3">
                          <Image className="h-6 w-6 text-muted-foreground" />
                          <Video className="h-6 w-6 text-muted-foreground" />
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{t('publisher.noMedia', 'No hay archivos multimedia')}</p>
                        <p className="text-xs text-muted-foreground">{t('publisher.mediaHint', 'Imágenes, videos o PDFs (máx 20MB)')}</p>
                      </div>
                    )}
                  </div>

                  {/* First Comment */}
                  <div className="mt-4">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('publisher.firstComment', 'Primer comentario (opcional)')}
                    </Label>
                    <Textarea
                      value={firstComment}
                      onChange={(e) => setFirstComment(e.target.value)}
                      placeholder={t('publisher.firstCommentPlaceholder', 'Añade un primer comentario automático (IG, FB, X, YT, Reddit, Threads, Bluesky)...')}
                      className="min-h-[60px]"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Publishing Mode */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium mb-3 block">{t('publisher.publishMode', 'Modo de Publicación')}</Label>
              <RadioGroup value={publishMode} onValueChange={(value: 'immediate' | 'scheduled' | 'queue') => setPublishMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {t('publisher.publishImmediately', 'Publicar inmediatamente')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('publisher.schedulePost', 'Programar publicación')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="queue" id="queue" />
                  <Label htmlFor="queue" className="flex items-center gap-2">
                    <ListPlus className="h-4 w-4" />
                    {t('publisher.addToQueue', 'Agregar a la cola')}
                  </Label>
                </div>
              </RadioGroup>

              {publishMode === 'scheduled' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium">{t('publisher.date', 'Fecha')}</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-sm font-medium">{t('publisher.time', 'Hora')}</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {t('publisher.timezoneNote', 'Se usará tu zona horaria local')}: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>
                </div>
              )}

              {publishMode === 'queue' && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('publisher.queueNote', 'El post se asignará automáticamente al siguiente slot disponible en tu cola de publicación.')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-sm font-medium mb-3 block">{t('publisher.platforms', 'Plataformas')}</Label>
              {socialAccounts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{t('publisher.noAccounts', 'No hay cuentas sociales conectadas')}</p>
                  <p className="text-sm">{t('publisher.connectInSettings', 'Conecta tus cuentas en configuración')}</p>
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
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
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
                              {t('publisher.page', 'Página')}: {account.page_name}
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

          {/* Platform-Specific Parameters */}
          {showPlatformParams && (
            <Collapsible open={platformParamsOpen} onOpenChange={setPlatformParamsOpen}>
              <Card>
                <CardContent className="pt-6">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <Label className="text-sm font-medium cursor-pointer">
                      {t('publisher.platformSettings', 'Configuración por plataforma')}
                    </Label>
                    <ChevronDown className={`h-4 w-4 transition-transform ${platformParamsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {/* Instagram params */}
                    {hasInstagram && (uploadedMediaType === 'video' || uploadedMediaType === 'image') && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold text-pink-600">Instagram</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.mediaType', 'Tipo de contenido')}</Label>
                          <Select 
                            value={platformParams.instagram_media_type || ''} 
                            onValueChange={(v) => setPlatformParams(p => ({ ...p, instagram_media_type: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t('publisher.selectType', 'Seleccionar tipo')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REELS">Reels</SelectItem>
                              <SelectItem value="STORIES">Stories</SelectItem>
                              <SelectItem value="IMAGE">Image</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* TikTok params */}
                    {hasTikTok && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold">TikTok</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.privacyLevel', 'Privacidad')}</Label>
                          <Select 
                            value={platformParams.tiktok_privacy_level || ''} 
                            onValueChange={(v) => setPlatformParams(p => ({ ...p, tiktok_privacy_level: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t('publisher.selectPrivacy', 'Seleccionar')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PUBLIC_TO_EVERYONE">Público</SelectItem>
                              <SelectItem value="MUTUAL_FOLLOW_FRIENDS">Amigos</SelectItem>
                              <SelectItem value="SELF_ONLY">Solo yo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={platformParams.tiktok_is_aigc || false}
                            onCheckedChange={(v) => setPlatformParams(p => ({ ...p, tiktok_is_aigc: v }))}
                          />
                          <Label className="text-xs">{t('publisher.aiGenerated', 'Contenido generado por IA')}</Label>
                        </div>
                      </div>
                    )}

                    {/* YouTube params */}
                    {hasYouTube && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold text-red-600">YouTube</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.privacy', 'Privacidad')}</Label>
                          <Select 
                            value={platformParams.youtube_privacy_status || ''} 
                            onValueChange={(v) => setPlatformParams(p => ({ ...p, youtube_privacy_status: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t('publisher.selectPrivacy', 'Seleccionar')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="public">Público</SelectItem>
                              <SelectItem value="unlisted">No listado</SelectItem>
                              <SelectItem value="private">Privado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">{t('publisher.tags', 'Tags (separados por comas)')}</Label>
                          <Input 
                            className="h-8 text-xs"
                            placeholder="tag1, tag2, tag3"
                            onChange={(e) => setPlatformParams(p => ({ 
                              ...p, 
                              youtube_tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                            }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={platformParams.youtube_contains_synthetic_media || false}
                            onCheckedChange={(v) => setPlatformParams(p => ({ ...p, youtube_contains_synthetic_media: v }))}
                          />
                          <Label className="text-xs">{t('publisher.syntheticMedia', 'Contiene medios sintéticos/IA')}</Label>
                        </div>
                      </div>
                    )}

                    {/* Facebook params */}
                    {hasFacebook && uploadedMediaType === 'video' && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold text-blue-600">Facebook</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.mediaType', 'Tipo de contenido')}</Label>
                          <Select 
                            value={platformParams.facebook_media_type || ''} 
                            onValueChange={(v) => setPlatformParams(p => ({ ...p, facebook_media_type: v }))}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={t('publisher.selectType', 'Seleccionar tipo')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="REELS">Reels</SelectItem>
                              <SelectItem value="STORIES">Stories</SelectItem>
                              <SelectItem value="VIDEO">Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Pinterest params */}
                    {hasPinterest && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold text-red-700">Pinterest</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.boardId', 'Board ID')}</Label>
                          <Input 
                            className="h-8 text-xs"
                            placeholder={t('publisher.boardIdPlaceholder', 'ID del tablero de Pinterest')}
                            value={platformParams.pinterest_board_id || ''}
                            onChange={(e) => setPlatformParams(p => ({ ...p, pinterest_board_id: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('publisher.destinationLink', 'Link de destino')}</Label>
                          <Input 
                            className="h-8 text-xs"
                            placeholder="https://..."
                            value={platformParams.pinterest_link || ''}
                            onChange={(e) => setPlatformParams(p => ({ ...p, pinterest_link: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reddit params */}
                    {hasReddit && (
                      <div className="space-y-2 p-3 border rounded-lg">
                        <Label className="text-xs font-semibold text-orange-600">Reddit</Label>
                        <div>
                          <Label className="text-xs">{t('publisher.subreddit', 'Subreddit')}</Label>
                          <Input 
                            className="h-8 text-xs"
                            placeholder="r/subreddit"
                            value={platformParams.subreddit || ''}
                            onChange={(e) => setPlatformParams(p => ({ ...p, subreddit: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('publisher.flairId', 'Flair ID (opcional)')}</Label>
                          <Input 
                            className="h-8 text-xs"
                            placeholder={t('publisher.flairIdPlaceholder', 'ID del flair')}
                            value={platformParams.flair_id || ''}
                            onChange={(e) => setPlatformParams(p => ({ ...p, flair_id: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              {t('publisher.cancel', 'Cancelar')}
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={loading || selectedPlatforms.length === 0 || needsGeneration}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('publisher.publishing', 'Publicando...')}
                </>
              ) : needsGeneration ? (
                t('publisher.generateFirst', 'Genera contenido primero')
              ) : publishMode === 'immediate' ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('publisher.publishNow', 'Publicar Ahora')}
                </>
              ) : publishMode === 'queue' ? (
                <>
                  <ListPlus className="h-4 w-4 mr-2" />
                  {t('publisher.addToQueueBtn', 'Agregar a Cola')}
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  {t('publisher.schedule', 'Programar')}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      <ContentImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelectImage={(imageUrl, contentText, mediaType) => {
          setSelectedContentImage(imageUrl);
          setUploadedMediaUrl(imageUrl);
          setUploadedMediaType(mediaType || 'image');
          if (contentText && !isEditing) {
            setEditingContent(contentText);
          }
        }}
        profile={profile}
      />

      <SmartLoader
        isVisible={loading}
        type="publishing"
        message={publishMode === 'immediate' ? t('publisher.publishingMessage', 'Publicando en redes sociales...') : 
                 publishMode === 'queue' ? t('publisher.queuingMessage', 'Añadiendo a la cola...') :
                 t('publisher.schedulingMessage', 'Programando publicación...')}
        size="md"
      />
    </Dialog>
  );
}
