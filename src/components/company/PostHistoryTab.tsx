import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartLoader } from "@/components/ui/smart-loader";
import { ExternalLink, Download, RefreshCw, Heart, MessageCircle, Eye, Video, Image } from "lucide-react";

interface Profile { 
  user_id?: string;
  primary_company_id?: string;
}

interface Post {
  id: string;
  platform: string;
  caption?: string;
  content?: string;
  text?: string;
  title?: string;
  postUrl?: string;
  post_url?: string;
  image?: string;
  videoLink?: string;
  video_url?: string;
  post_image_url?: string;
  likes?: number;
  like_count?: number;
  comments?: number;
  comment_count?: number;
  posted_at?: string;
  created_at?: string;
}

export default function PostHistoryTab({ profile }: { profile: Profile }) {
  const { toast } = useToast();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const loadPostHistory = async () => {
    if (!profile?.user_id) return;
    
    try {
      // Obtener posts de Instagram
      const { data: igPosts } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('posted_at', { ascending: false })
        .limit(20);

      // Obtener posts de LinkedIn
      const { data: liPosts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('posted_at', { ascending: false })
        .limit(20);

      // Obtener posts de TikTok
      const { data: ttPosts } = await supabase
        .from('tiktok_posts')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('posted_at', { ascending: false })
        .limit(20);

      // Combinar y normalizar posts
      const allPosts = [
        ...(igPosts || []).map(p => ({ ...p, platform: 'Instagram' })),
        ...(liPosts || []).map(p => ({ ...p, platform: 'LinkedIn' })),
        ...(ttPosts || []).map(p => ({ ...p, platform: 'TikTok' }))
      ].sort((a, b) => new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime());

      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading post history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de posts",
        variant: "destructive"
      });
    }
  };

  const saveAssetToLibrary = async (post: Post) => {
    if (!profile?.user_id) return;

    const assetUrl = post.image || post.post_image_url || post.videoLink || post.video_url;
    if (!assetUrl) {
      toast({
        title: "Sin archivo",
        description: "Este post no contiene imágenes o videos para guardar",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('download-content-asset', {
        body: {
          asset_url: assetUrl,
          user_id: profile.user_id,
          company_id: profile.primary_company_id,
          content_type: post.videoLink || post.video_url ? 'video' : 'image',
          post_data: {
            platform: post.platform,
            caption: post.caption || post.content || post.text || post.title,
            post_url: post.postUrl || post.post_url,
            metrics: {
              likes: post.likes || post.like_count || 0,
              comments: post.comments || post.comment_count || 0
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Asset guardado",
        description: "El archivo se ha guardado en tu biblioteca de contenidos"
      });
    } catch (error) {
      console.error('Error saving asset:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el archivo en la biblioteca",
        variant: "destructive"
      });
    }
  };

  const refreshHistory = async () => {
    setHistoryLoading(true);
    await loadPostHistory();
    setHistoryLoading(false);
    toast({ title: "Historial actualizado", description: "Se ha actualizado el historial de posts" });
  };

  useEffect(() => {
    setHistoryLoading(true);
    loadPostHistory().finally(() => setHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id]);

  if (historyLoading) {
    return (
      <SmartLoader
        isVisible={true}
        type="generic"
        message="Cargando historial de posts..."
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
              <ExternalLink className="h-5 w-5 text-primary" />
              Historial de Posts
              <Badge variant="secondary" className="ml-2">{posts.length} publicaciones</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshHistory}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Historial de todas tus publicaciones en redes sociales con enlaces a los posts originales.
          </p>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                <ExternalLink className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No se han encontrado publicaciones. Conecta tus redes sociales para ver el historial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => {
                const postUrl = post.postUrl || post.post_url;
                const imageUrl = post.image || post.post_image_url;
                const videoUrl = post.videoLink || post.video_url;
                const content = post.caption || post.content || post.text || post.title || '';
                const likes = post.likes || post.like_count || 0;
                const comments = post.comments || post.comment_count || 0;

                return (
                  <Card key={post.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{post.platform}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.posted_at || post.created_at || '').toLocaleDateString()}
                        </span>
                      </div>

                      {/* Media preview */}
                      {(imageUrl || videoUrl) && (
                        <div className="relative">
                          {videoUrl ? (
                            <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">Video</span>
                            </div>
                          ) : imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt="Post content" 
                              className="w-full h-32 object-cover rounded-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : null}
                        </div>
                      )}

                      {/* Content */}
                      <div>
                        <p className="text-sm line-clamp-3">{content}</p>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {comments}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {postUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(postUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver Post
                          </Button>
                        )}
                        
                        {(imageUrl || videoUrl) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveAssetToLibrary(post)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}