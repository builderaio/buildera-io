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
import { Share2, Upload, CheckCircle2, Clock, AlertCircle, Loader2, Edit3, Save, X, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SocialAccount {
  platform: string;
  platform_display_name: string;
  is_connected: boolean;
  company_username: string;
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
}

export default function SimpleContentPublisher({ isOpen, onClose, content, profile }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [editingContent, setEditingContent] = useState<string>(content.content);
  const [isEditing, setIsEditing] = useState(false);
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Fetch social accounts when dialog opens
  useEffect(() => {
    if (isOpen && profile.user_id) {
      fetchSocialAccounts();
    }
  }, [isOpen, profile.user_id]);

  // Update editing content when prop changes
  useEffect(() => {
    setEditingContent(content.content);
  }, [content.content]);

  const fetchSocialAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, platform_display_name, is_connected, company_username')
        .eq('user_id', profile.user_id)
        .eq('is_connected', true);

      if (error) throw error;
      setSocialAccounts(data || []);
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cuentas sociales",
        variant: "destructive"
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

      // Preparar payload para la función edge
      const isPhoto = Boolean(content.generatedImage);
      const postType: 'text' | 'photo' | 'video' = isPhoto ? 'photo' : 'text';
      const title = content.title?.trim() || editingContent.slice(0, 80);
      const mediaUrls = isPhoto && content.generatedImage ? [content.generatedImage] : undefined;
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
      toast({
        title: publishMode === 'immediate' ? '¡Publicado!' : '¡Programado!',
        description: `Contenido ${publishMode === 'immediate' ? 'publicado' : 'programado'} en ${selectedPlatforms.length} plataforma(s)`,
      });
      onClose();
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
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview and Edit */}
          <Card>
            <CardContent className="pt-6">
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
                <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-sm">
                  {editingContent}
                </div>
              )}

              {/* Generated Image Preview */}
              {content.generatedImage && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Imagen</Label>
                  <img 
                    src={content.generatedImage} 
                    alt="Generated content" 
                    className="max-w-full h-auto rounded-lg border max-h-48 object-cover"
                  />
                </div>
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
                  {socialAccounts.map((account) => (
                    <div
                      key={account.platform}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handlePlatformToggle(account.platform)}
                    >
                      <Checkbox
                        checked={selectedPlatforms.includes(account.platform)}
                        onChange={() => handlePlatformToggle(account.platform)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-white ${getPlatformBadgeColor(account.platform)}`}>
                            {account.platform_display_name}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          @{account.company_username}
                        </p>
                      </div>
                    </div>
                  ))}
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
              disabled={loading || selectedPlatforms.length === 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : publishMode === 'immediate' ? (
                <Upload className="h-4 w-4 mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Procesando...' : publishMode === 'immediate' ? 'Publicar Ahora' : 'Programar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}