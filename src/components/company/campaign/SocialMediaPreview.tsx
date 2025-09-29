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
  Users,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getPlatform, getPlatformColor } from '@/lib/socialPlatforms';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveImageToContentLibrary } from '@/utils/contentLibraryHelper';

interface SocialMediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: any;
  companyProfile?: any;
}

export const SocialMediaPreview = ({ isOpen, onClose, contentItem, companyProfile }: SocialMediaPreviewProps) => {
  const [companyData, setCompanyData] = useState<any>(null);
  const [socialAccounts, setSocialAccounts] = useState<any>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();

  // Debug logging to see what's being passed
  console.log('SocialMediaPreview - contentItem:', contentItem);
  console.log('SocialMediaPreview - companyProfile:', companyProfile);

  if (!contentItem) {
    console.log('SocialMediaPreview - No contentItem provided');
    return null;
  }

  const platform = contentItem.calendar_item?.red_social?.toLowerCase();
  const platformInfo = getPlatform(platform || '');
  const contentText = contentItem.content?.texto_final || contentItem.content?.generatedText || '';
  const mediaUrl = contentItem.media?.url;
  const mediaType = contentItem.media?.type;
  const hashtags = contentItem.content?.hashtags || [];
  
  // Handle carousel content
  const isCarousel = contentItem.content?.content_type === 'carousel' || 
                     contentItem.calendar_item?.tipo_contenido?.toLowerCase().includes('carrusel');
  const carouselImages = contentItem.content?.carousel_images || [];
  const hasCarouselImages = isCarousel && carouselImages.length > 0;
  
  // Get suggested publication time
  const suggestedTime = contentItem.calendar_item?.hora || '12:00';
  
  // Dummy image for preview when no media exists
  const dummyImage = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop";

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyProfile?.primary_company_id) return;

      try {
        // Get company info
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyProfile.primary_company_id)
          .single();

        setCompanyData(company);

        // Get social connections
        const connections: any = {};
        
        // LinkedIn
        const { data: linkedinData } = await supabase
          .from('linkedin_connections')
          .select('*')
          .eq('user_id', companyProfile.user_id)
          .maybeSingle();
        
        if (linkedinData) connections.linkedin = linkedinData;

        // Facebook/Instagram
        const { data: facebookData } = await supabase
          .from('facebook_instagram_connections')
          .select('*')
          .eq('user_id', companyProfile.user_id)
          .maybeSingle();
        
        if (facebookData) {
          connections.facebook = facebookData;
          connections.instagram = facebookData;
        }

        // TikTok
        const { data: tiktokData } = await supabase
          .from('tiktok_connections')
          .select('*')
          .eq('user_id', companyProfile.user_id)
          .maybeSingle();
        
        if (tiktokData) connections.tiktok = tiktokData;

        setSocialAccounts(connections);
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };

    fetchCompanyData();
  }, [companyProfile]);

  // Get user data based on platform and company
  const getUserData = () => {
    const companyName = companyData?.name || companyProfile?.company_name || "Tu Empresa";
    const companyLogo = companyData?.logo_url || companyProfile?.avatar_url || "/lovable-uploads/df793eae-f9ea-4291-9de2-ecf01e5005d5.png";
    
    let username = "@tuempresa";
    
    // Get platform-specific username
    switch (platform) {
      case 'linkedin':
      case 'li':
        username = socialAccounts.linkedin?.company_name || companyName;
        break;
      case 'instagram':
      case 'ig':
        username = socialAccounts.instagram?.instagram_username ? `@${socialAccounts.instagram.instagram_username}` : "@tuempresa";
        break;
      case 'facebook':
      case 'fb':
        username = socialAccounts.facebook?.facebook_page_name || companyName;
        break;
      case 'tiktok':
      case 'tt':
        username = socialAccounts.tiktok?.tiktok_username ? `@${socialAccounts.tiktok.tiktok_username}` : "@tuempresa";
        break;
      case 'youtube':
      case 'yt':
        username = companyName;
        break;
      default:
        username = "@tuempresa";
    }

    return {
      name: companyName,
      username: username,
      avatar: companyLogo,
      verified: true
    };
  };

  const mockUser = getUserData();

  // Download content as image
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a canvas to render the preview content
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('No se pudo crear el canvas');
      }

      // Set canvas size based on platform
      let width = 400;
      let height = 400;
      
      if (platform === 'instagram' || platform === 'ig') {
        width = 1080;
        height = 1080;
      } else if (platform === 'facebook' || platform === 'fb') {
        width = 1200;
        height = 630;
      } else if (platform === 'linkedin' || platform === 'li') {
        width = 1200;
        height = 627;
      } else if (platform === 'tiktok' || platform === 'tt') {
        width = 1080;
        height = 1920;
      }

      canvas.width = width;
      canvas.height = height;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw platform color header
      if (platformInfo?.officialColor) {
        ctx.fillStyle = platformInfo.officialColor;
        ctx.fillRect(0, 0, width, 80);
      }

      // Draw text content
      if (contentText) {
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'left';
        
        // Split text into lines to fit canvas
        const maxWidth = width - 40;
        const lineHeight = 24;
        const words = contentText.split(' ');
        let lines = [];
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width < maxWidth) {
            currentLine = testLine;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        });
        
        if (currentLine) {
          lines.push(currentLine);
        }

        // Draw text lines
        lines.forEach((line, index) => {
          ctx.fillText(line, 20, 120 + (index * lineHeight));
        });
      }

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${platform}-preview-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Descarga completada",
            description: "El contenido se ha descargado exitosamente",
          });
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error downloading content:', error);
      toast({
        title: "Error en la descarga",
        description: "No se pudo descargar el contenido",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Save content to library
  const handleSaveToLibrary = async () => {
    if (!companyProfile?.user_id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const title = contentItem.calendar_item?.tema_concepto || `Post de ${platform}`;
      const description = contentText || contentItem.calendar_item?.descripcion_creativo || `Contenido para ${platform}`;
      
      // If there's media, use it; otherwise use the dummy image
      const imageUrl = contentItem.media?.url || dummyImage;
      
      const success = await saveImageToContentLibrary({
        userId: companyProfile.user_id,
        title,
        description,
        imageUrl,
        contentText,
        platform: platform || 'general',
        metrics: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0
        }
      });

      if (success) {
        toast({
          title: "¡Guardado exitosamente!",
          description: "El contenido se ha agregado a tu biblioteca",
        });
      } else {
        toast({
          title: "Contenido ya existe",
          description: "Este contenido ya está en tu biblioteca",
        });
      }
      
    } catch (error) {
      console.error('Error saving to library:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el contenido en la biblioteca",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
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
        <div className="relative aspect-square bg-gray-100">
          {hasCarouselImages ? (
            // Carousel view
            <div className="relative w-full h-full">
              <img 
                src={carouselImages[currentImageIndex]?.url || dummyImage} 
                alt={`Carousel image ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover" 
              />
              
              {/* Carousel navigation */}
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev > 0 ? prev - 1 : carouselImages.length - 1
                    )}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev < carouselImages.length - 1 ? prev + 1 : 0
                    )}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {carouselImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Image counter */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                    {currentImageIndex + 1}/{carouselImages.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single image view
            mediaUrl ? (
              mediaType === 'image' ? (
                <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              )
            ) : (
              <img src={dummyImage} alt="Preview" className="w-full h-full object-cover" />
            )
          )}
        </div>

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
          <p className="text-xs text-gray-500 mt-2">Programado para las {suggestedTime}</p>
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
            <p className="text-xs text-gray-500">Programado para {suggestedTime} • 🌐</p>
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
        <div className="relative aspect-video bg-gray-100">
          {mediaUrl ? (
            mediaType === 'image' ? (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            )
          ) : (
            <img src={dummyImage} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>

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
                <span>Programado para {suggestedTime}</span>
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
        <div className="relative aspect-video bg-gray-100">
          {mediaUrl ? (
            mediaType === 'image' ? (
              <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white" />
              </div>
            )
          ) : (
            <img src={dummyImage} alt="Preview" className="w-full h-full object-cover" />
          )}
        </div>

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
            <img src={dummyImage} alt="Preview" className="w-full h-full object-cover" />
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
            <img src={dummyImage} alt="Preview" className="w-full h-full object-cover" />
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
                1.2K visualizaciones • Programado para {suggestedTime}
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
                {hasCarouselImages && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Carrusel con {carouselImages.length} imágenes
                  </Badge>
                )}
                {mediaType && !hasCarouselImages && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Con {mediaType === 'image' ? 'imagen' : 'video'}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                📅 {contentItem.calendar_item?.fecha} • 🕒 {suggestedTime}
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

          {hasCarouselImages && (
            <div>
              <h4 className="font-medium mb-2">Imágenes del carrusel</h4>
              <div className="grid grid-cols-3 gap-2">
                {carouselImages.map((image, index) => (
                  <div 
                    key={index}
                    className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.title || `Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
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
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Descargando...' : 'Descargar'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleSaveToLibrary}
              disabled={isSaving}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Agregar a biblioteca'}
            </Button>
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