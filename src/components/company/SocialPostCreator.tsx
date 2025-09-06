import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EraOptimizerButton } from "@/components/ui/era-optimizer-button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Calendar, 
  Image as ImageIcon, 
  Video, 
  Type, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles
} from "lucide-react";

interface SocialPostCreatorProps {
  profile: any;
  onPostCreated?: () => void;
}

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  isConnected: boolean;
}

export const SocialPostCreator = ({ profile, onPostCreated }: SocialPostCreatorProps) => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postType, setPostType] = useState<'text' | 'photo' | 'video'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyUsername, setCompanyUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  const [pendingUploads, setPendingUploads] = useState<Array<{
    requestId: string;
    title: string;
    platforms: string[];
    status: 'pending' | 'in_progress' | 'completed';
    completed: number;
    total: number;
    createdAt: Date;
  }>>([]);
  const { toast } = useToast();

  // Resolver userId y luego cargar
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      try {
        if (profile?.user_id) {
          if (active) setUserId(profile.user_id);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (active) setUserId(user?.id ?? null);
        }
      } catch (e) {
        console.warn('No se pudo resolver userId:', e);
      }
    };
    resolve();
    return () => { active = false; };
  }, [profile?.user_id]);

  useEffect(() => {
    if (!userId) return;
    loadAvailablePlatforms();
    getCompanyUsername();
  }, [userId]);

  const loadAvailablePlatforms = async () => {
    try {
      if (!userId) return;
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, platform_display_name, is_connected')
        .eq('user_id', userId)
        .eq('is_connected', true)
        .neq('platform', 'upload_post_profile');

      if (error) throw error;

      const platformConfig = {
        facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
        instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
        linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
        tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black' },
        youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-600' },
        twitter: { name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
      };

      const connectedPlatforms = data?.map(account => ({
        id: account.platform,
        name: platformConfig[account.platform as keyof typeof platformConfig]?.name || account.platform,
        icon: platformConfig[account.platform as keyof typeof platformConfig]?.icon || '🌐',
        color: platformConfig[account.platform as keyof typeof platformConfig]?.color || 'bg-gray-600',
        isConnected: account.is_connected
      })) || [];

      setPlatforms(connectedPlatforms);
    } catch (error) {
      console.error('Error loading platforms:', error);
    }
  };

  const getCompanyUsername = async () => {
    try {
      if (!userId) return;
      const { data, error } = await supabase
        .from('social_accounts')
        .select('company_username')
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;
      if (data?.[0]?.company_username) {
        setCompanyUsername(data[0].company_username);
      }
    } catch (error) {
      console.error('Error getting company username:', error);
    }
  };

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
    } else {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
    }
  };

  const handleMediaUrlChange = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls);
  };

  const addMediaUrl = () => {
    setMediaUrls(prev => [...prev, '']);
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Campo requerido",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Plataformas requeridas",
        description: "Seleccione al menos una plataforma",
        variant: "destructive"
      });
      return false;
    }

    if (postType !== 'text' && mediaUrls.filter(url => url.trim()).length === 0) {
      toast({
        title: "Media requerida",
        description: "Agregue al menos una URL de imagen o video",
        variant: "destructive"
      });
      return false;
    }

    if (scheduledDate) {
      const selectedDateTime = new Date(scheduledDate);
      const now = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1); // Máximo 1 año

      if (selectedDateTime <= now) {
        toast({
          title: "Fecha inválida",
          description: "La fecha debe ser futura",
          variant: "destructive"
        });
        return false;
      }

      if (selectedDateTime > maxDate) {
        toast({
          title: "Fecha inválida",
          description: "La fecha no puede ser mayor a 1 año",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const generateIntelligentContent = async () => {
    if (!selectedPlatforms.length) {
      toast({
        title: "Seleccione plataformas",
        description: "Debe seleccionar al menos una plataforma para generar contenido",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Determinar el tipo de generador a usar según el tipo de post
      let edgeFunction = 'marketing-hub-post-creator';
      if (postType === 'photo') {
        edgeFunction = 'marketing-hub-image-creator';
      } else if (postType === 'video') {
        edgeFunction = 'marketing-hub-reel-creator';
      }

      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: {
          input: {
            tono_de_la_marca: 'profesional y cercano',
            buyer_persona_objetivo: 'audiencia general',
            calendario_item: {
              tema_concepto: title || `Contenido para ${selectedPlatforms.join(', ')}`,
              titulo_gancho: title || '',
              tipo_contenido: postType,
              plataformas: selectedPlatforms,
              objetivo: 'engagement y alcance'
            },
            contexto_adicional: content
          }
        }
      });

      if (error) throw error;

      if (data?.message) {
        // Generar contenido basado en la respuesta
        const generatedTitle = title || `Nuevo post para ${selectedPlatforms.join(' y ')}`;
        const generatedContent = `${content}\n\nGenerado automáticamente para maximizar engagement en ${selectedPlatforms.join(', ')}\n\n#marketing #contenido #socialmedia`;

        setTitle(generatedTitle);
        setContent(generatedContent);

        toast({
          title: "✨ Contenido generado",
          description: "Se ha generado contenido optimizado para tus plataformas seleccionadas",
        });
      }

    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: "Error generando contenido",
        description: "No se pudo generar el contenido automáticamente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!companyUsername) {
      toast({
        title: "Error",
        description: "No se encontró el nombre de usuario de la empresa",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const postData = {
        companyUsername,
        platforms: selectedPlatforms,
        title: title.trim(),
        content: content.trim(),
        mediaUrls: mediaUrls.filter(url => url.trim()),
        postType,
        scheduledDate: scheduledDate || undefined
      };

      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { 
          action: 'post_content', 
          data: { ...postData, async_upload: true } // Usar upload asíncrono
        }
      });

      if (error) throw error;

      if (data?.success) {
        // Si hay un request_id, significa que es un upload asíncrono
        if (data.request_id) {
          const newUpload = {
            requestId: data.request_id,
            title: postData.title,
            platforms: postData.platforms,
            status: 'pending' as const,
            completed: 0,
            total: postData.platforms.length,
            createdAt: new Date()
          };
          
          setPendingUploads(prev => [...prev, newUpload]);
          
          toast({
            title: "📤 Upload iniciado",
            description: "Su contenido está siendo procesado. Puede seguir el progreso arriba.",
          });
        } else {
          toast({
            title: scheduledDate ? "📅 Post programado" : "🚀 Post publicado",
            description: scheduledDate 
              ? "Su contenido ha sido programado exitosamente"
              : "Su contenido ha sido publicado en las plataformas seleccionadas",
          });
        }

        // Limpiar formulario
        setTitle('');
        setContent('');
        setMediaUrls(['']);
        setSelectedPlatforms([]);
        setScheduledDate('');

        onPostCreated?.();
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: "Error al publicar",
        description: `No se pudo ${scheduledDate ? 'programar' : 'publicar'} el contenido: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Mínimo 10 minutos en el futuro
    return now.toISOString().slice(0, 16);
  };

  const checkUploadStatus = async (requestId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_upload_status', data: { requestId } }
      });

      if (error) throw error;

      return data?.status;
    } catch (error) {
      console.error('Error checking upload status:', error);
      return null;
    }
  };

  const pollPendingUploads = async () => {
    if (pendingUploads.length === 0) return;

    const updatedUploads = [];
    
    for (const upload of pendingUploads) {
      if (upload.status !== 'completed') {
        const status = await checkUploadStatus(upload.requestId);
        if (status) {
          updatedUploads.push({
            ...upload,
            status: status.status,
            completed: status.completed || upload.completed,
            total: status.total || upload.total
          });
        } else {
          updatedUploads.push(upload);
        }
      }
    }

    setPendingUploads(updatedUploads.filter(upload => upload.status !== 'completed'));
  };

  // Poll pending uploads every 5 seconds
  useEffect(() => {
    if (pendingUploads.length === 0) return;

    const interval = setInterval(pollPendingUploads, 5000);
    return () => clearInterval(interval);
  }, [pendingUploads]);

  // Remove completed uploads after a delay
  useEffect(() => {
    const completedUploads = pendingUploads.filter(upload => upload.status === 'completed');
    if (completedUploads.length > 0) {
      const timer = setTimeout(() => {
        setPendingUploads(prev => prev.filter(upload => upload.status !== 'completed'));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingUploads]);

  if (platforms.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sin conexiones</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Conecte sus redes sociales para comenzar a crear y publicar contenido.
          </p>
          <p className="text-sm text-muted-foreground">
            Vaya a la pestaña "Panel" para conectar sus redes sociales.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Crear Contenido Social
          </CardTitle>
        </CardHeader>

        {/* Uploads en progreso */}
        {pendingUploads.length > 0 && (
          <div className="px-6 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Uploads en progreso</h4>
            {pendingUploads.map((upload) => (
              <div key={upload.requestId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {upload.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{upload.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>
                        {upload.status === 'completed' ? '✅ Completado' :
                         upload.status === 'in_progress' ? '⏳ En progreso' : '⏸️ Pendiente'}
                      </span>
                      <span>•</span>
                      <span>{upload.completed}/{upload.total} plataformas</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {upload.platforms.map(platformId => {
                    const platform = platforms.find(p => p.id === platformId);
                    return platform ? (
                      <span key={platformId} className="text-xs">
                        {platform.icon}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <CardContent className="space-y-6">
          {/* Tipo de contenido */}
          <div className="space-y-3">
            <Label>Tipo de contenido</Label>
            <div className="flex gap-2">
              {[
                { type: 'text', icon: Type, label: 'Texto' },
                { type: 'photo', icon: ImageIcon, label: 'Imagen' },
                { type: 'video', icon: Video, label: 'Video' }
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={postType === type ? "default" : "outline"}
                  onClick={() => setPostType(type as typeof postType)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Plataformas */}
          <div className="space-y-3">
            <Label>Plataformas de destino</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.id}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                  />
                  <label
                    htmlFor={platform.id}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <span className="text-lg">{platform.icon}</span>
                    {platform.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Generador de contenido inteligente */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Generador de Contenido Inteligente
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateIntelligentContent}
                disabled={loading || !selectedPlatforms.length}
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Usa IA para generar título y contenido optimizado para las plataformas seleccionadas
            </p>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center justify-between">
              <span>Título *</span>
              <EraOptimizerButton
                currentText={title}
                fieldType="título de post social"
                context={{
                  postType,
                  selectedPlatforms,
                  contentType: 'social_media_title'
                }}
                onOptimized={setTitle}
                size="sm"
                variant="outline"
                disabled={!title.trim()}
              />
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del post..."
              className="w-full"
            />
          </div>

          {/* Contenido */}
          <div className="space-y-2">
            <Label htmlFor="content" className="flex items-center justify-between">
              <span>Contenido adicional</span>
              <EraOptimizerButton
                currentText={content}
                fieldType="contenido de post social"
                context={{
                  postType,
                  selectedPlatforms,
                  title,
                  contentType: 'social_media_content'
                }}
                onOptimized={setContent}
                size="sm"
                variant="outline"
                disabled={!content.trim()}
              />
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descripción, hashtags, etc..."
              className="min-h-[100px]"
            />
          </div>

          {/* URLs de medios (si no es texto) */}
          {postType !== 'text' && (
            <div className="space-y-3">
              <Label>URLs de {postType === 'photo' ? 'imágenes' : 'videos'}</Label>
              {mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => handleMediaUrlChange(index, e.target.value)}
                    placeholder={`URL de ${postType === 'photo' ? 'imagen' : 'video'} ${index + 1}`}
                    className="flex-1"
                  />
                  {mediaUrls.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMediaUrl(index)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addMediaUrl}
                className="w-full"
              >
                Agregar {postType === 'photo' ? 'imagen' : 'video'}
              </Button>
            </div>
          )}

          {/* Programación */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Programar publicación (opcional)
            </Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={getMinDateTime()}
              className="w-full"
            />
            {scheduledDate && (
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertDescription>
                  El contenido se publicará el {new Date(scheduledDate).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botón de envío */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {scheduledDate ? 'Programando...' : 'Publicando...'}
              </>
            ) : (
              <>
                {scheduledDate ? (
                  <Calendar className="w-5 h-5 mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {scheduledDate ? 'Programar Publicación' : 'Publicar Ahora'}
              </>
            )}
          </Button>

          {/* Info de plataformas seleccionadas */}
          {selectedPlatforms.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Se publicará en:</span>
              {selectedPlatforms.map(platformId => {
                const platform = platforms.find(p => p.id === platformId);
                return platform ? (
                  <Badge key={platformId} variant="secondary" className="flex items-center gap-1">
                    <span>{platform.icon}</span>
                    {platform.name}
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};