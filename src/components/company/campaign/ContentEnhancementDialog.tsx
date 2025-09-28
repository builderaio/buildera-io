import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Upload, 
  FolderOpen, 
  Image as ImageIcon, 
  Video, 
  Check,
  Loader2,
  Play,
  Eye,
  Download
} from 'lucide-react';
import ContentImageSelector from '../ContentImageSelector';

interface ContentEnhancementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: any;
  profile: { user_id?: string };
  onMediaAdded: (mediaUrl: string, mediaType: 'image' | 'video') => void;
}

export const ContentEnhancementDialog = ({ 
  isOpen, 
  onClose, 
  contentItem, 
  profile,
  onMediaAdded 
}: ContentEnhancementDialogProps) => {
  const [activeTab, setActiveTab] = useState('ai');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const { toast } = useToast();

  const contentType = contentItem?.calendar_item?.tipo_contenido?.toLowerCase() || '';
  const needsImage = contentType.includes('imagen') || contentType.includes('carrusel') || contentType.includes('historia');
  const needsVideo = contentType.includes('video') || contentType.includes('reel');
  
  // Determinar el tipo de contenido específico sugerido
  const getSuggestedContentType = () => {
    if (contentType.includes('video')) return { type: 'video', label: 'Video', icon: Video };
    if (contentType.includes('reel')) return { type: 'video', label: 'Reel', icon: Video };
    if (contentType.includes('imagen')) return { type: 'image', label: 'Imagen', icon: ImageIcon };
    if (contentType.includes('carrusel')) return { type: 'image', label: 'Carrusel de imágenes', icon: ImageIcon };
    if (contentType.includes('historia')) return { type: 'image', label: 'Historia/Story', icon: ImageIcon };
    return { type: 'image', label: 'Contenido visual', icon: ImageIcon };
  };
  
  const suggestedContent = getSuggestedContentType();

  const generateImageWithAI = async () => {
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
        body: {
          input: {
            identidad_visual: {
              paleta_de_colores: { primario: "#0D0D2B", acento: "#3D52D5" },
              estilo_imagenes: "Moderno y profesional"
            },
            calendario_item: contentItem.calendar_item,
            content_text: contentItem.content?.texto_final || contentItem.content?.generatedText
          }
        }
      });

      if (error) throw error;

      // Save to content library
      await supabase.from('content_library').insert({
        user_id: profile.user_id,
        title: `Imagen - ${contentItem.calendar_item.tema_concepto}`,
        description: contentItem.content?.texto_final?.substring(0, 200) || '',
        file_url: data.image_url,
        file_type: 'image',
        platform: contentItem.calendar_item.red_social,
        tags: contentItem.content?.hashtags || []
      });

      setGeneratedMedia({ url: data.image_url, type: 'image' });
      toast({
        title: "¡Imagen generada!",
        description: "Tu imagen ha sido creada y guardada en la biblioteca"
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const generateVideoWithAI = async () => {
    setGeneratingVideo(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-hub-reel-creator', {
        body: {
          input: {
            concepto_visual: contentItem.calendar_item.tema_concepto,
            calendario_item: contentItem.calendar_item,
            content_text: contentItem.content?.texto_final || contentItem.content?.generatedText
          }
        }
      });

      if (error) throw error;

      // Save to content library  
      await supabase.from('content_library').insert({
        user_id: profile.user_id,
        title: `Video - ${contentItem.calendar_item.tema_concepto}`,
        description: contentItem.content?.texto_final?.substring(0, 200) || '',
        file_url: data.video_url,
        file_type: 'video',
        platform: contentItem.calendar_item.red_social,
        tags: contentItem.content?.hashtags || []
      });

      setGeneratedMedia({ url: data.video_url, type: 'video' });
      toast({
        title: "¡Video generado!",
        description: "Tu video ha sido creado y guardado en la biblioteca"
      });
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: "Error", 
        description: "No se pudo generar el video. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setGeneratingVideo(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Archivo no válido",
        description: "Solo se permiten archivos de imagen o video",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(true);
    try {
      // Upload to Supabase Storage
      const fileName = `campaign-content/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-files')
        .getPublicUrl(fileName);

      // Save to content library
      await supabase.from('content_library').insert({
        user_id: profile.user_id,
        title: `${isImage ? 'Imagen' : 'Video'} - ${contentItem.calendar_item.tema_concepto}`,
        description: contentItem.content?.texto_final?.substring(0, 200) || '',
        file_url: publicUrl,
        file_type: isImage ? 'image' : 'video',
        platform: contentItem.calendar_item.red_social,
        tags: contentItem.content?.hashtags || []
      });

      setGeneratedMedia({ url: publicUrl, type: isImage ? 'image' : 'video' });
      toast({
        title: "¡Archivo subido!",
        description: `Tu ${isImage ? 'imagen' : 'video'} ha sido subido y guardado en la biblioteca`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el archivo. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSelectFromLibrary = (imageUrl: string) => {
    setGeneratedMedia({ url: imageUrl, type: 'image' });
    setShowImageSelector(false);
    toast({
      title: "¡Imagen seleccionada!",
      description: "La imagen ha sido agregada a tu contenido"
    });
  };

  const handleAddMedia = () => {
    if (generatedMedia) {
      onMediaAdded(generatedMedia.url, generatedMedia.type);
      setGeneratedMedia(null);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Completar Contenido - {contentItem?.calendar_item?.tema_concepto}
          </DialogTitle>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{contentItem?.calendar_item?.red_social}</Badge>
              <Badge variant="secondary">{contentItem?.calendar_item?.tipo_contenido}</Badge>
            </div>
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <suggestedContent.icon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Contenido sugerido: {suggestedContent.label}</p>
                <p className="text-sm text-muted-foreground">
                  Según tu calendario, este post necesita un {suggestedContent.label.toLowerCase()} para completarse.
                </p>
              </div>
            </div>
          </div>
          </DialogHeader>

          {/* Generated content preview */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">{contentItem?.calendar_item?.tema_concepto}</p>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {contentItem?.content?.texto_final || contentItem?.content?.generatedText || 'Contenido generado'}
              </p>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Generar con IA
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Desde Biblioteca
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Subir Archivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-4">
              {/* Recommended option based on content type */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm font-medium text-primary">Recomendado para este contenido</span>
                </div>
                <Card className={`border-2 transition-all hover:shadow-md ${
                  suggestedContent.type === 'image' ? 'border-primary/30 bg-primary/5' : 'border-red-500/30 bg-red-50'
                }`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      suggestedContent.type === 'image' ? 'bg-primary/10' : 'bg-red-500/10'
                    }`}>
                      <suggestedContent.icon className={`h-8 w-8 ${
                        suggestedContent.type === 'image' ? 'text-primary' : 'text-red-600'
                      }`} />
                    </div>
                    <h3 className="font-semibold mb-2">
                      Generar {suggestedContent.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {suggestedContent.type === 'image' 
                        ? `Crea una ${suggestedContent.label.toLowerCase()} perfecta para tu ${contentItem?.calendar_item?.tipo_contenido} usando IA`
                        : `Crea un ${suggestedContent.label.toLowerCase()} dinámico para tu ${contentItem?.calendar_item?.tipo_contenido} usando IA`
                      }
                    </p>
                    <Button 
                      onClick={suggestedContent.type === 'image' ? generateImageWithAI : generateVideoWithAI}
                      disabled={suggestedContent.type === 'image' ? generatingImage : generatingVideo}
                      className="w-full"
                      size="lg"
                    >
                      {(suggestedContent.type === 'image' ? generatingImage : generatingVideo) ? 
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                        <suggestedContent.icon className="h-4 w-4 mr-2" />
                      }
                      {(suggestedContent.type === 'image' ? generatingImage : generatingVideo) ? 
                        'Generando...' : 
                        `Generar ${suggestedContent.label}`
                      }
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Alternative options */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Otras opciones disponibles</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedContent.type !== 'image' && (
                    <Card className="cursor-pointer transition-all hover:shadow-md opacity-75">
                      <CardContent className="p-4 text-center">
                        <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium mb-2 text-sm">Generar Imagen</h3>
                        <Button 
                          onClick={generateImageWithAI}
                          disabled={generatingImage}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          {generatingImage ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <ImageIcon className="h-3 w-3 mr-2" />}
                          {generatingImage ? 'Generando...' : 'Generar'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {suggestedContent.type !== 'video' && (
                    <Card className="cursor-pointer transition-all hover:shadow-md opacity-75">
                      <CardContent className="p-4 text-center">
                        <div className="bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Video className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="font-medium mb-2 text-sm">Generar Video</h3>
                        <Button 
                          onClick={generateVideoWithAI}
                          disabled={generatingVideo}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          {generatingVideo ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Play className="h-3 w-3 mr-2" />}
                          {generatingVideo ? 'Generando...' : 'Generar'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Biblioteca de Contenido</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecciona {suggestedContent.type === 'image' ? 'una imagen' : 'un video'} de tu biblioteca existente
                    {suggestedContent.type === 'image' ? ' (recomendado para este tipo de contenido)' : ' (recomendado para este tipo de contenido)'}
                  </p>
                  <Button 
                    onClick={() => setShowImageSelector(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Explorar Biblioteca
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Subir Archivo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sube {suggestedContent.type === 'image' ? 'una imagen' : 'un video'} desde tu computador (máx. 10MB)
                    {suggestedContent.type === 'image' ? ' - Recomendado: JPG, PNG para este contenido' : ' - Recomendado: MP4, MOV para este contenido'}
                  </p>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingFile}
                      className="w-full cursor-pointer"
                      variant="outline"
                    >
                      {uploadingFile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      {uploadingFile ? 'Subiendo...' : 'Seleccionar Archivo'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Formatos: JPG, PNG, GIF, MP4, MOV, AVI
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generated media preview */}
          {generatedMedia && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">¡Listo para agregar!</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {generatedMedia.type === 'image' ? (
                      <img 
                        src={generatedMedia.url} 
                        alt="Generated content"
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-red-100 rounded-md flex items-center justify-center">
                        <Video className="h-8 w-8 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {generatedMedia.type === 'image' ? 'Imagen generada' : 'Video generado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {contentItem?.calendar_item?.tema_concepto}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-between gap-4 pt-4 border-t">
            <Button variant="outline" onClick={handleSkip}>
              Omitir por ahora
            </Button>
            {generatedMedia ? (
              <Button onClick={handleAddMedia} className="bg-primary hover:bg-primary/90">
                <Check className="h-4 w-4 mr-2" />
                Agregar a Contenido
              </Button>
            ) : (
              <Button disabled variant="secondary">
                Selecciona o genera contenido
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ContentImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelectImage={handleSelectFromLibrary}
        profile={profile}
      />
    </>
  );
};