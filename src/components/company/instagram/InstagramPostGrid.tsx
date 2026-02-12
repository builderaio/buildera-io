import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Heart, MessageCircle, ExternalLink } from 'lucide-react';

interface InstagramPostGridProps {
  companyUsername: string;
  onSelectPost: (mediaId: string, postUrl?: string) => void;
}

interface MediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  like_count?: number;
  comments_count?: number;
}

export const InstagramPostGrid = ({ companyUsername, onSelectPost }: InstagramPostGridProps) => {
  const { t } = useTranslation('marketing');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (companyUsername) loadMedia();
  }, [companyUsername]);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('upload-post-manager', {
        body: { action: 'get_instagram_media', data: { profile: companyUsername } }
      });
      if (fnError) throw fnError;
      setMedia(data?.data || []);
    } catch (e: any) {
      console.error('Error loading Instagram media:', e);
      setError(e.message || t('hub.instagram.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{t('hub.instagram.loadingPosts')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={loadMedia}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('hub.instagram.retry')}
        </Button>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('hub.instagram.noPosts')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {media.length} {t('hub.instagram.postsFound')}
        </span>
        <Button variant="ghost" size="sm" onClick={loadMedia}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden border bg-muted/30 hover:shadow-md transition-all"
            onClick={() => onSelectPost(item.id, item.permalink)}
          >
            {(item.media_url || item.thumbnail_url) ? (
              <img
                src={item.thumbnail_url || item.media_url}
                alt={item.caption?.substring(0, 50) || 'Instagram post'}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full aspect-square bg-muted flex items-center justify-center">
                <span className="text-4xl">📷</span>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-4 text-white">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" /> {item.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" /> {item.comments_count || 0}
                </span>
              </div>
            </div>
            {/* Type badge */}
            {item.media_type && item.media_type !== 'IMAGE' && (
              <Badge className="absolute top-2 left-2 text-xs" variant="secondary">
                {item.media_type}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
