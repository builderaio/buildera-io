import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Image, Check, Video, FileText } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  suggested_content: {
    content_text: string;
    image_url: string;
    metrics?: {
      likes: number;
      comments: number;
    };
  };
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, contentText?: string, mediaType?: 'image' | 'video' | 'pdf') => void;
  profile: { user_id?: string };
}

export default function ContentImageSelector({ isOpen, onClose, onSelectImage, profile }: Props) {
  const { toast } = useToast();
  const [savedContent, setSavedContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const loadSavedContent = async () => {
    if (!profile?.user_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_recommendations')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('recommendation_type', 'post_template')
        .eq('status', 'template')
        .not('suggested_content->image_url', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        platform: item.platform,
        created_at: item.created_at,
        suggested_content: item.suggested_content as {
          content_text: string;
          image_url: string;
          metrics?: { likes: number; comments: number; };
        }
      }));
      
      setSavedContent(transformedData);
    } catch (error) {
      console.error('Error loading saved content:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el contenido guardado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSavedContent();
    }
  }, [isOpen, profile?.user_id]);

  const handleSelectImage = (item: ContentItem) => {
    setSelectedImage(item.suggested_content.image_url);
    // Detectar el tipo de medio por la URL
    const url = item.suggested_content.image_url.toLowerCase();
    let mediaType: 'image' | 'video' | 'pdf' = 'image';
    if (url.includes('/content-videos/') || url.match(/\.(mp4|mov|avi)$/)) {
      mediaType = 'video';
    } else if (url.includes('/content-documents/') || url.endsWith('.pdf')) {
      mediaType = 'pdf';
    }
    onSelectImage(item.suggested_content.image_url, item.suggested_content.content_text, mediaType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Seleccionar desde la biblioteca
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Imágenes, videos y documentos guardados
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando contenido...</p>
            </div>
          </div>
        ) : savedContent.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                <Image className="w-8 h-8 text-primary" />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8 text-blue-600" />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No hay archivos guardados</h3>
            <p className="text-muted-foreground">Aún no tienes imágenes, videos o documentos en tu biblioteca. Crea y publica contenido para guardar los archivos generados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedContent.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedImage === item.suggested_content.image_url ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectImage(item)}
              >
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    {/* Detectar el tipo de medio */}
                    {item.suggested_content.image_url.toLowerCase().match(/\.(mp4|mov|avi)$/) || 
                     item.suggested_content.image_url.includes('/content-videos/') ? (
                      <div className="relative">
                        <video 
                          src={item.suggested_content.image_url} 
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                          <Video className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    ) : item.suggested_content.image_url.toLowerCase().endsWith('.pdf') || 
                          item.suggested_content.image_url.includes('/content-documents/') ? (
                      <div className="w-full h-32 bg-red-50 dark:bg-red-950 rounded-md flex items-center justify-center">
                        <FileText className="h-12 w-12 text-red-600" />
                      </div>
                    ) : (
                      <img 
                        src={item.suggested_content.image_url} 
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    {selectedImage === item.suggested_content.image_url && (
                      <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {item.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    
                    {item.suggested_content?.metrics && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>♥ {item.suggested_content.metrics.likes || 0}</span>
                        <span>💬 {item.suggested_content.metrics.comments || 0}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}