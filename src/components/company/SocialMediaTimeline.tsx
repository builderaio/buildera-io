import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Eye, Calendar, TrendingUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'linkedin' | 'tiktok' | 'facebook';
  postId: string;
  caption?: string;
  content?: string;
  title?: string;
  postedAt: string;
  likes: number;
  comments: number;
  shares?: number;
  views?: number;
  engagementRate: number;
  profilePic?: string;
  profileName?: string;
  profileUsername?: string;
  mediaUrl?: string;
  hashtags?: string[];
}

interface SocialMediaTimelineProps {
  userId?: string;
}

import { SOCIAL_PLATFORMS, getPlatformDisplayName, getPlatformIcon } from '@/lib/socialPlatforms';

// Platform icons now use centralized configuration
const platformIcons = Object.fromEntries(
  Object.entries(SOCIAL_PLATFORMS).map(([key, platform]) => [
    key, 
    platform.name // Use display name from centralized config
  ])
);

const platformColors = Object.fromEntries(
  Object.entries(SOCIAL_PLATFORMS).map(([key, platform]) => [
    key,
    `hsl(var(--chart-${Object.keys(SOCIAL_PLATFORMS).indexOf(key) + 1}))`
  ])
);

export const SocialMediaTimeline: React.FC<SocialMediaTimelineProps> = ({ userId }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  useEffect(() => {
    fetchSocialPosts();
  }, [userId]);

  const fetchSocialPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch Instagram posts
      const { data: instagramPosts } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq(userId ? 'user_id' : 'user_id', userId || (await supabase.auth.getUser()).data.user?.id)
        .order('posted_at', { ascending: false });

      // Fetch LinkedIn posts
      const { data: linkedinPosts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq(userId ? 'user_id' : 'user_id', userId || (await supabase.auth.getUser()).data.user?.id)
        .order('posted_at', { ascending: false });

      // Fetch TikTok posts
      const { data: tiktokPosts } = await supabase
        .from('tiktok_posts')
        .select('*')
        .eq(userId ? 'user_id' : 'user_id', userId || (await supabase.auth.getUser()).data.user?.id)
        .order('posted_at', { ascending: false });

      // Transform and combine all posts
      const combinedPosts: SocialPost[] = [
        ...(instagramPosts || []).map(post => ({
          id: post.id,
          platform: 'instagram' as const,
          postId: post.post_id,
          caption: post.caption,
          postedAt: post.posted_at,
          likes: post.like_count || 0,
          comments: post.comment_count || 0,
          shares: 0,
          views: post.video_view_count || 0,
          engagementRate: post.engagement_rate || 0,
          profilePic: post.profile_pic_url,
          profileName: post.profile_full_name || post.owner_full_name,
          profileUsername: post.profile_username || post.owner_username,
          mediaUrl: post.display_url,
          hashtags: post.hashtags
        })),
        ...(linkedinPosts || []).map(post => ({
          id: post.id,
          platform: 'linkedin' as const,
          postId: post.post_id,
          content: post.content,
          postedAt: post.posted_at,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          views: post.views_count || 0,
          engagementRate: post.engagement_rate || 0,
          profileName: post.profile_name,
          profileUsername: post.profile_name
        })),
        ...(tiktokPosts || []).map(post => ({
          id: post.id,
          platform: 'tiktok' as const,
          postId: post.video_id,
          title: post.title,
          postedAt: post.posted_at,
          likes: post.digg_count || 0,
          comments: post.comment_count || 0,
          shares: post.share_count || 0,
          views: post.play_count || 0,
          engagementRate: 0,
          profilePic: post.profile_avatar_url,
          profileName: post.profile_display_name,
          profileUsername: post.profile_username,
          mediaUrl: post.cover_url
        }))
      ];

      // Sort by date (most recent first)
      const sortedPosts = combinedPosts
        .filter(post => post.postedAt)
        .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

      setPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching social posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedPlatform === 'all' 
    ? posts 
    : posts.filter(post => post.platform === selectedPlatform);

  const formatMetric = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline de Posts
        </CardTitle>
        
        {/* Platform Filter */}
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={selectedPlatform === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedPlatform('all')}
          >
            Todas las plataformas
          </Badge>
          {['instagram', 'linkedin', 'tiktok'].map(platform => (
            <Badge
              key={platform}
              variant={selectedPlatform === platform ? 'default' : 'outline'}
              className="cursor-pointer capitalize flex items-center gap-1"
              onClick={() => setSelectedPlatform(platform)}
            >
              {React.createElement(getPlatformIcon(platform), { className: "w-3 h-3" })}
              {getPlatformDisplayName(platform)}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron posts para mostrar</p>
            <p className="text-sm">Conecta tus redes sociales para ver el timeline</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <div key={post.id} className="relative">
                {/* Timeline line */}
                {index < filteredPosts.length - 1 && (
                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-border"></div>
                )}
                
                <div className="flex gap-4">
                  {/* Platform icon */}
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: platformColors[post.platform] + '20' }}
                  >
                    {React.createElement(getPlatformIcon(post.platform), { className: "inline w-3 h-3 mr-1" })}
                  </div>
                  
                  {/* Post content */}
                  <div className="flex-1 min-w-0">
                    <Card className="border-l-4" style={{ borderLeftColor: platformColors[post.platform] }}>
                      <CardContent className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {post.profilePic && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={post.profilePic} />
                                <AvatarFallback>
                                  {post.profileName?.[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="font-medium text-sm">{post.profileName || post.profileUsername}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {post.platform} • {formatDistanceToNow(new Date(post.postedAt), { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(post.postedAt), 'dd MMM', { locale: es })}
                          </Badge>
                        </div>
                        
                        {/* Content */}
                        <div className="mb-3">
                          {post.caption && (
                            <p className="text-sm text-foreground mb-2 line-clamp-3">
                              {post.caption}
                            </p>
                          )}
                          {post.content && (
                            <p className="text-sm text-foreground mb-2 line-clamp-3">
                              {post.content}
                            </p>
                          )}
                          {post.title && (
                            <p className="text-sm font-medium text-foreground mb-2">
                              {post.title}
                            </p>
                          )}
                          
                          {/* Hashtags */}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {post.hashtags.slice(0, 5).map((hashtag, idx) => (
                                <span key={idx} className="text-xs text-primary">
                                  #{hashtag}
                                </span>
                              ))}
                              {post.hashtags.length > 5 && (
                                <span className="text-xs text-muted-foreground">
                                  +{post.hashtags.length - 5} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Metrics */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{formatMetric(post.likes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{formatMetric(post.comments)}</span>
                          </div>
                          {post.shares && post.shares > 0 && (
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              <span>{formatMetric(post.shares)}</span>
                            </div>
                          )}
                          {post.views && post.views > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatMetric(post.views)}</span>
                            </div>
                          )}
                          {post.engagementRate > 0 && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>{post.engagementRate.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};