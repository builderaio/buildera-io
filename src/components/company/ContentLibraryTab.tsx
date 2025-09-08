import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { Image, Heart, MessageCircle, Copy, Eye, RefreshCw } from "lucide-react";

interface Profile { user_id?: string }

export default function ContentLibraryTab({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [savedContent, setSavedContent] = useState<any[]>([]);

  const loadSavedContent = async () => {
    if (!profile?.user_id) return;
    try {
      const { data, error } = await supabase
        .from('content_recommendations')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('recommendation_type', 'post_template')
        .eq('status', 'template')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedContent(data || []);
    } catch (error) {
      console.error('Error loading saved content:', error);
    }
  };

  useEffect(() => {
    setLibraryLoading(true);
    loadSavedContent().finally(() => setLibraryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  const deleteFromLibrary = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_recommendations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Contenido eliminado", description: "El contenido se ha eliminado de tu biblioteca" });
      loadSavedContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({ title: "Error", description: "No se pudo eliminar el contenido", variant: "destructive" });
    }
  };

  const refreshLibrary = async () => {
    setLibraryLoading(true);
    await loadSavedContent();
    setLibraryLoading(false);
    toast({ title: "Biblioteca actualizada", description: "Se ha actualizado el contenido de tu biblioteca" });
  };

  if (libraryLoading) {
    return (
      <SmartLoader
        isVisible={true}
        type="generic"
        message="Cargando tu biblioteca de contenidos..."
        size="md"
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Biblioteca de Contenidos
              <Badge variant="secondary" className="ml-2">{savedContent.length} elementos</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshLibrary}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Guarda y reutiliza tus mejores contenidos. Las imágenes se guardan automáticamente al analizar redes sociales y generar contenido.</p>
        </CardHeader>
        <CardContent>
          {savedContent.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                <Image className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Biblioteca vacía</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">Aún no has guardado ningún contenido. Ve a la pestaña "Posts" y guarda tus publicaciones más exitosas.</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✨ Guarda contenido desde la pestaña "Posts"</p>
                <p>🎨 Reutiliza imágenes exitosas</p>
                <p>📝 Crea plantillas de texto</p>
                <p>📊 Filtra por rendimiento</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedContent.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{item.platform}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.suggested_content?.image_url && (
                      <img src={item.suggested_content.image_url} alt="Content" className="w-full h-32 object-cover rounded-md" />
                    )}
                    <div>
                      <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                    {item.suggested_content?.metrics && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.suggested_content.metrics.likes || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{item.suggested_content.metrics.comments || 0}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                        if (item.suggested_content?.content_text) {
                          navigator.clipboard.writeText(item.suggested_content.content_text);
                          toast({ title: "Texto copiado", description: "El contenido se ha copiado al portapapeles" });
                        }
                      }}>
                        <Copy className="h-3 w-3 mr-1" />Copiar texto
                      </Button>
                      {item.suggested_content?.image_url && (
                        <Button size="sm" variant="outline" onClick={() => {
                          navigator.clipboard.writeText(item.suggested_content.image_url);
                          toast({ title: "URL copiada", description: "La URL de la imagen se ha copiado al portapapeles" });
                        }}>
                          <Image className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteFromLibrary(item.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
