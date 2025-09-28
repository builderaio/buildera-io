import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark,
  MoreHorizontal,
  Play,
  ThumbsUp,
  Repeat2,
  Send,
  Eye,
  Users
} from 'lucide-react';
import { getPlatform, getPlatformColor } from '@/lib/socialPlatforms';

interface SocialMediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: any;
}

export const SocialMediaPreview = ({ isOpen, onClose, contentItem }: SocialMediaPreviewProps) => {
  if (!contentItem) return null;

  const platform = contentItem.calendar_item?.red_social?.toLowerCase();
  const platformInfo = getPlatform(platform || '');
  const contentText = contentItem.content?.texto_final || contentItem.content?.generatedText || '';
  const mediaUrl = contentItem.media?.url;
  const mediaType = contentItem.media?.type;
  const hashtags = contentItem.content?.hashtags || [];

  // Mock user data for preview
  const mockUser = {
    name: "Tu Empresa",
    username: "@tuempresa",
    avatar: "/lovable-uploads/df793eae-f9ea-4291-9de2-ecf01e5005d5.png",
    verified: true
  };

  const renderInstagramPreview = () => (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback>TE</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{mockUser.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="relative aspect-square bg-gray-100">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Heart className="h-6 w-6" />
              <MessageCircle className="h-6 w-6" />
              <Send className="h-6 w-6" />
            </div>
            <Bookmark className="h-6 w-6" />
          </div>

          {/* Likes */}
          <p className="font-semibold text-sm mb-1">1,234 likes</p>

          {/* Caption */}
          <div className="text-sm">
            <span className="font-semibold">{mockUser.username}</span>{' '}
            <span className="whitespace-pre-wrap">{contentText}</span>
            {hashtags.length > 0 && (
              <div className="mt-1">
                {hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 mr-1">
                    #{tag.replace('#', '')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Time */}
          <p className="text-xs text-gray-500 mt-2">hace 2 horas</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderLinkedInPreview = () => (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b">
          <Avatar className="h-10 w-10">
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback>TE</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{mockUser.name}</p>
              {mockUser.verified && (
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600">CEO en {mockUser.name}</p>
            <p className="text-xs text-gray-500">hace 2h • 🌐</p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm whitespace-pre-wrap mb-3">{contentText}</p>
          {hashtags.length > 0 && (
            <div className="mb-3">
              {hashtags.map((tag, index) => (
                <span key={index} className="text-blue-600 mr-2 text-sm">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="relative aspect-video bg-gray-100">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">Me gusta</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Comentar</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs">Compartir</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="text-xs">Enviar</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500">234 reacciones • 12 comentarios</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderFacebookPreview = () => (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback>TE</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{mockUser.name}</p>
                {mockUser.verified && (
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>hace 2 horas</span>
                <span>•</span>
                <Users className="h-3 w-3" />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm whitespace-pre-wrap">{contentText}</p>
          {hashtags.length > 0 && (
            <div className="mt-2">
              {hashtags.map((tag, index) => (
                <span key={index} className="text-blue-600 mr-2 text-sm">
                  #{tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        {mediaUrl && (
          <div className="relative aspect-video bg-gray-100">
            {mediaType === 'image' ? (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <Button variant="ghost" size="sm" className="flex items-center gap-2 flex-1">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">Me gusta</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 flex-1">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">Comentar</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 flex-1">
            <Share className="h-4 w-4" />
            <span className="text-sm">Compartir</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTikTokPreview = () => (
    <Card className="w-full max-w-sm mx-auto bg-black text-white rounded-none">
      <CardContent className="p-0 relative aspect-[9/16]">
        {/* Video/Media Area */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-16 w-16 text-white" />
              </div>
            ) : (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Play className="h-16 w-16 text-white" />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            {/* Left side - User info and caption */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={mockUser.avatar} />
                  <AvatarFallback>TE</AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{mockUser.username}</span>
                <Button size="sm" className="bg-red-500 hover:bg-red-600 text-xs px-3 py-1 h-6">
                  Seguir
                </Button>
              </div>
              
              <p className="text-sm mb-2 line-clamp-3">{contentText}</p>
              
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hashtags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-sm">
                      #{tag.replace('#', '')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <Heart className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs">1.2K</p>
              </div>
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs">89</p>
              </div>
              <div className="text-center">
                <Share className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs">45</p>
              </div>
              <div className="text-center">
                <Bookmark className="h-8 w-8 mx-auto mb-1" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderYouTubePreview = () => (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardContent className="p-0">
        {/* Video Thumbnail */}
        <div className="relative aspect-video bg-black">
          {mediaUrl ? (
            mediaType === 'video' ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-16 w-16 text-white" />
              </div>
            ) : (
              <img src={mediaUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <Play className="h-16 w-16 text-white" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white px-1 text-xs rounded">
            10:23
          </div>
        </div>

        {/* Video Info */}
        <div className="p-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={mockUser.avatar} />
              <AvatarFallback>TE</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {contentItem.calendar_item?.tema_concepto || 'Título del video'}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <span>{mockUser.name}</span>
                {mockUser.verified && <span>✓</span>}
              </div>
              <div className="text-xs text-gray-600">
                1.2K visualizaciones • hace 2 horas
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreview = () => {
    switch (platform) {
      case 'instagram':
      case 'ig':
        return renderInstagramPreview();
      case 'linkedin':
      case 'li':
        return renderLinkedInPreview();
      case 'facebook':
      case 'fb':
        return renderFacebookPreview();
      case 'tiktok':
      case 'tt':
        return renderTikTokPreview();
      case 'youtube':
      case 'yt':
        return renderYouTubePreview();
      default:
        return renderInstagramPreview();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {platformInfo && (
                <div 
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: platformInfo.officialColor }}
                >
                  <platformInfo.icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <span>Vista Previa - {platformInfo?.name || platform}</span>
                <p className="text-sm text-muted-foreground font-normal">
                  {contentItem.calendar_item?.tema_concepto}
                </p>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          {renderPreview()}
        </div>

        {/* Content Details */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Detalles del contenido</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{contentItem.calendar_item?.red_social}</Badge>
                <Badge variant="secondary">{contentItem.calendar_item?.tipo_contenido}</Badge>
                {mediaType && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Con {mediaType === 'image' ? 'imagen' : 'video'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                📅 {contentItem.calendar_item?.fecha} • 🕒 {contentItem.calendar_item?.hora}
              </p>
            </div>
          </div>

          {contentText && (
            <div>
              <h4 className="font-medium mb-2">Texto del post</h4>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{contentText}</p>
              </div>
            </div>
          )}

          {hashtags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Hashtags</h4>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag.replace('#', '')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Vista completa
            </Button>
            <Button>
              Programar publicación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};