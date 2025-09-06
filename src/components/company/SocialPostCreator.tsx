import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Clock
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
        body: { action: 'post_content', data: postData }
      });

      if (error) throw error;

      if (data?.success || data?.job_id) {
        toast({
          title: scheduledDate ? "📅 Post programado" : "🚀 Post publicado",
          description: scheduledDate 
            ? "Su contenido ha sido programado exitosamente"
            : "Su contenido ha sido publicado en las plataformas seleccionadas",
        });

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

    } catch (error) {
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

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
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
            <Label htmlFor="content">Contenido adicional</Label>
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