import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  Video,
  Type,
  ExternalLink
} from "lucide-react";

interface ScheduledPostsManagerProps {
  profile: any;
  onPostsUpdated?: () => void;
}

interface ScheduledPost {
  id: string;
  job_id: string;
  platforms: string[];
  title: string;
  content?: string;
  media_urls?: string[];
  post_type: string;
  scheduled_date: string;
  status: string;
  preview_url?: string;
  created_at: string;
}

interface UploadPostJob {
  job_id: string;
  scheduled_date: string;
  post_type: string;
  profile_username: string;
  title: string;
  preview_url?: string;
}

const platformConfig = {
  facebook: { name: 'Facebook', icon: '📘', color: 'bg-blue-600' },
  instagram: { name: 'Instagram', icon: '📷', color: 'bg-pink-600' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'bg-black' },
  youtube: { name: 'YouTube', icon: '📺', color: 'bg-red-600' },
  twitter: { name: 'X (Twitter)', icon: '🐦', color: 'bg-gray-900' },
};

export const ScheduledPostsManager = ({ profile, onPostsUpdated }: ScheduledPostsManagerProps) => {
  const [localPosts, setLocalPosts] = useState<ScheduledPost[]>([]);
  const [uploadPostJobs, setUploadPostJobs] = useState<UploadPostJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyUsername, setCompanyUsername] = useState('');
  const [userId, setUserId] = useState<string | null>(profile?.user_id ?? null);
  const { toast } = useToast();

  // Resolver userId y luego cargar datos
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
    loadScheduledPosts();
    getCompanyUsername();
  }, [userId]);

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

  const loadScheduledPosts = async () => {
    try {
      if (!userId) return;
      setLoading(true);

      // Cargar posts locales de la base de datos
      const { data: localData, error: localError } = await supabase
        .from('scheduled_social_posts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['scheduled', 'published'])
        .order('scheduled_date', { ascending: true });

      if (localError) throw localError;
      setLocalPosts(localData || []);

      // Cargar posts desde Upload-Post API
      if (companyUsername) {
        await loadUploadPostJobs();
      }

    } catch (error) {
      console.error('Error loading scheduled posts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los posts programados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUploadPostJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_scheduled_posts', data: { companyUsername } }
      });

      if (error) throw error;
      setUploadPostJobs(data || []);
    } catch (error) {
      console.error('Error loading Upload-Post jobs:', error);
    }
  };

  const cancelPost = async (jobId: string, isLocal: boolean = true) => {
    try {
      setLoading(true);

      if (isLocal) {
        // Cancelar en Upload-Post API
        const { data, error } = await supabase.functions.invoke('upload-post-manager', {
          body: { action: 'cancel_scheduled_post', data: { jobId } }
        });

        if (error) throw error;
      } else {
        // Solo actualizar estado local
        await supabase
          .from('scheduled_social_posts')
          .update({ status: 'cancelled' })
          .eq('job_id', jobId)
          .eq('user_id', profile.user_id);
      }

      toast({
        title: "Post cancelado",
        description: "La publicación programada ha sido cancelada",
      });

      await loadScheduledPosts();
      onPostsUpdated?.();

    } catch (error) {
      console.error('Error canceling post:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar la publicación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    await loadScheduledPosts();
    toast({
      title: "Actualizado",
      description: "Lista de posts programados actualizada",
    });
  };

  const getPostTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'photo': return ImageIcon;
      case 'video': return Video;
      default: return Type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700"><Clock className="w-3 h-3 mr-1" />Programado</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Publicado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const now = new Date();
      const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 0) {
        return `Hace ${Math.abs(diffHours)}h`;
      } else if (diffHours < 24) {
        return `En ${diffHours}h`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `En ${diffDays}d`;
      }
    } catch {
      return 'Fecha inválida';
    }
  };

  const allPosts = [
    ...localPosts.map(post => ({ ...post, source: 'local' as const })),
    ...uploadPostJobs.map(job => ({
      id: job.job_id,
      job_id: job.job_id,
      platforms: [], // Upload-Post no proporciona esta info en el listado
      title: job.title,
      content: undefined as string | undefined,
      media_urls: undefined as string[] | undefined,
      post_type: job.post_type,
      scheduled_date: job.scheduled_date,
      status: 'scheduled',
      preview_url: job.preview_url,
      created_at: job.scheduled_date,
      source: 'upload_post' as const
    }))
  ].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Posts Programados
            </CardTitle>
            <Button
              onClick={refreshPosts}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && allPosts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Cargando posts programados...</span>
              </div>
            </div>
          ) : allPosts.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin posts programados</h3>
              <p className="text-muted-foreground">
                Cree contenido programado desde la pestaña "Crear" para verlo aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allPosts.map((post) => {
                const PostTypeIcon = getPostTypeIcon(post.post_type);
                
                return (
                  <Card key={post.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <PostTypeIcon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{post.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(post.scheduled_date)} • {(() => {
                                  try {
                                    const date = new Date(post.scheduled_date);
                                    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleString('es-ES');
                                  } catch {
                                    return 'Fecha inválida';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>

                          {post.content && (
                            <p className="text-sm text-muted-foreground ml-11">
                              {post.content.length > 100 
                                ? `${post.content.substring(0, 100)}...` 
                                : post.content}
                            </p>
                          )}

                          {post.platforms?.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-11">
                              {post.platforms.map(platformId => {
                                const platform = platformConfig[platformId as keyof typeof platformConfig];
                                return platform ? (
                                  <Badge key={platformId} variant="outline" className="text-xs">
                                    <span className="mr-1">{platform.icon}</span>
                                    {platform.name}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )}

                          {post.media_urls && post.media_urls.length > 0 && (
                            <div className="text-xs text-muted-foreground ml-11">
                              {post.media_urls.length} archivo{post.media_urls.length > 1 ? 's' : ''} adjunto{post.media_urls.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {getStatusBadge(post.status)}
                          
                          {post.preview_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(post.preview_url, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}

                          {post.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelPost(post.job_id, post.source === 'local')}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {allPosts.filter(post => post.status === 'scheduled').length > 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Los posts programados se ejecutarán automáticamente en las fechas especificadas. 
            Puede cancelarlos en cualquier momento antes de su publicación.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};