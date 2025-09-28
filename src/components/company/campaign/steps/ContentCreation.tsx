import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ContentEnhancementDialog } from '../ContentEnhancementDialog';
import { SocialMediaPreview } from '../SocialMediaPreview';
import { 
  PenTool,
  Image,
  Video,
  CheckCircle2,
  Clock,
  Play,
  Loader2,
  Sparkles,
  Download,
  Eye,
  Square,
  CheckSquare,
  Plus
} from 'lucide-react';

interface ContentCreationProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

interface ContentItem {
  id: string;
  calendar_item: any;
  status: 'pending' | 'creating' | 'completed' | 'enhanced' | 'error';
  content?: any;
  media?: {
    url: string;
    type: 'image' | 'video';
  };
  error?: string;
}

export const ContentCreation = ({ campaignData, onComplete, loading }: ContentCreationProps) => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [currentlyCreating, setCurrentlyCreating] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [enhancementDialog, setEnhancementDialog] = useState<{
    isOpen: boolean;
    item: ContentItem | null;
  }>({ isOpen: false, item: null });
  const [previewDialog, setPreviewDialog] = useState<{
    isOpen: boolean;
    item: ContentItem | null;
  }>({ isOpen: false, item: null });
  const { toast } = useToast();

  // Fetch company profile
  React.useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (!campaignData.user_id) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, companies!profiles_primary_company_id_fkey(*)')
          .eq('user_id', campaignData.user_id)
          .single();

        setCompanyProfile(profile);
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    };

    fetchCompanyProfile();
  }, [campaignData.user_id]);

  React.useEffect(() => {
    if (campaignData.calendar?.final_calendar) {
      const items: ContentItem[] = campaignData.calendar.final_calendar.map((calendarItem: any, index: number) => ({
        id: `item-${index}`,
        calendar_item: calendarItem,
        status: 'pending'
      }));
      setContentItems(items);
      // Select all items by default
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [campaignData.calendar]);

  const createSelectedContent = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Selecciona contenido",
        description: "Debes seleccionar al menos un contenido para generar",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    const updatedItems = [...contentItems];
    const itemsToCreate = updatedItems.filter(item => selectedItems.has(item.id));

    try {
      for (let i = 0; i < itemsToCreate.length; i++) {
        const item = itemsToCreate[i];
        
        setCurrentlyCreating(item.id);
        setContentItems([...updatedItems]);
        
        try {
          item.status = 'creating';
          setContentItems([...updatedItems]);

          // Determine content type and create accordingly
          const contentType = item.calendar_item.tipo_contenido?.toLowerCase();
          let content;

          if (contentType === 'image' || contentType === 'imagen') {
            content = await createImageContent(item.calendar_item);
          } else if (contentType === 'video' || contentType === 'reel') {
            content = await createVideoContent(item.calendar_item);
          } else {
            content = await createTextContent(item.calendar_item);
          }

          item.content = content;
          item.status = 'completed';
          
        } catch (error) {
          item.status = 'error';
          item.error = error.message;
          console.error(`Error creating content for ${item.id}:`, error);
        }

        setContentItems([...updatedItems]);
        
        // Small delay between content creation
        if (i < itemsToCreate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "¡Contenido creado!",
        description: `${itemsToCreate.length} contenidos han sido generados exitosamente`,
      });

    } catch (error: any) {
      toast({
        title: "Error en la creación",
        description: error.message || "Hubo un problema creando el contenido",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
      setCurrentlyCreating(null);
    }
  };

  const createTextContent = async (calendarItem: any) => {
    const { data, error } = await supabase.functions.invoke('marketing-hub-post-creator', {
      body: {
        input: {
          tono_de_la_marca: campaignData.company?.tono_marca || "Profesional y amigable",
          buyer_persona_objetivo: campaignData.audience?.buyer_personas?.[0] || {},
          calendario_item: calendarItem
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const createImageContent = async (calendarItem: any) => {
    const { data, error } = await supabase.functions.invoke('marketing-hub-image-creator', {
      body: {
        input: {
          identidad_visual: {
            paleta_de_colores: { primario: "#0D0D2B", acento: "#3D52D5" },
            estilo_imagenes: "Moderno y profesional"
          },
          calendario_item: calendarItem
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const createVideoContent = async (calendarItem: any) => {
    const { data, error } = await supabase.functions.invoke('marketing-hub-reel-creator', {
      body: {
        input: {
          concepto_visual: calendarItem.tema_concepto,
          calendario_item: calendarItem
        }
      }
    });

    if (error) throw error;
    return data;
  };

  const handleEnhanceContent = (item: ContentItem) => {
    setEnhancementDialog({ isOpen: true, item });
  };

  const handlePreviewContent = (item: ContentItem) => {
    setPreviewDialog({ isOpen: true, item });
  };

  const handleMediaAdded = (mediaUrl: string, mediaType: 'image' | 'video') => {
    if (enhancementDialog.item) {
      const updatedItems = contentItems.map(item => 
        item.id === enhancementDialog.item!.id 
          ? { 
              ...item, 
              status: 'enhanced' as const,
              media: { url: mediaUrl, type: mediaType }
            }
          : item
      );
      setContentItems(updatedItems);
      setEnhancementDialog({ isOpen: false, item: null });
      
      toast({
        title: "¡Contenido mejorado!",
        description: `Se agregó ${mediaType === 'image' ? 'imagen' : 'video'} al contenido`
      });
    }
  };

  const handleComplete = () => {
    const completedContent = contentItems
      .filter(item => item.status === 'completed' || item.status === 'enhanced')
      .map(item => ({
        calendar_item: item.calendar_item,
        content: item.content,
        media: item.media
      }));

    onComplete({
      created_content: completedContent,
      total_items: contentItems.length,
      completed_items: completedContent.length
    });
  };

  const getContentTypeIcon = (type: string) => {
    const typeStr = type?.toLowerCase() || '';
    if (typeStr.includes('image') || typeStr.includes('imagen')) {
      return Image;
    }
    if (typeStr.includes('video') || typeStr.includes('reel')) {
      return Video;
    }
    return PenTool;
  };

  const getContentTypeColor = (type: string) => {
    const typeStr = type?.toLowerCase() || '';
    if (typeStr.includes('image') || typeStr.includes('imagen')) {
      return 'bg-green-500';
    }
    if (typeStr.includes('video') || typeStr.includes('reel')) {
      return 'bg-red-500';
    }
    return 'bg-blue-500';
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === contentItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(contentItems.map(item => item.id)));
    }
  };

  const completedCount = contentItems.filter(item => item.status === 'completed' || item.status === 'enhanced').length;
  const enhancedCount = contentItems.filter(item => item.status === 'enhanced').length;
  const progress = contentItems.length > 0 ? (completedCount / contentItems.length) * 100 : 0;
  const canProceed = completedCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-pink-800">
            <PenTool className="h-6 w-6" />
            Creación de Contenido con IA
          </CardTitle>
          <p className="text-pink-600">
            Genera automáticamente todo el contenido para tu campaña
          </p>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      {contentItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Progreso de Creación
              </span>
              <Badge variant="outline">
                {completedCount}/{contentItems.length} completado
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3 mb-4" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% completado</span>
              <div className="flex items-center gap-4">
                {enhancedCount > 0 && (
                  <span className="text-purple-600 font-medium">
                    {enhancedCount} mejorado{enhancedCount !== 1 ? 's' : ''}
                  </span>
                )}
                <span>{contentItems.length} contenidos programados</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Items */}
      {contentItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Esperando calendario</h3>
            <p className="text-muted-foreground">
              Primero necesitas generar el calendario de contenido
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Create All Button */}
          {!creating && completedCount === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                   <h3 className="text-xl font-semibold">¿Listo para crear contenido?</h3>
                   <p className="text-muted-foreground">
                     Selecciona qué contenidos quieres generar ({selectedItems.size} de {contentItems.length} seleccionados)
                   </p>
                   <div className="flex gap-2">
                     <Button 
                       variant="outline"
                       onClick={toggleSelectAll}
                       disabled={creating || loading}
                       size="sm"
                     >
                       {selectedItems.size === contentItems.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                     </Button>
                     <Button 
                       onClick={createSelectedContent}
                       disabled={creating || loading || selectedItems.size === 0}
                       className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                       size="lg"
                     >
                       <Play className="w-5 h-5 mr-2" />
                       Crear Contenido Seleccionado ({selectedItems.size})
                     </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

           {/* Content Items List */}
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center justify-between">
                 <span className="flex items-center gap-2">
                   <PenTool className="h-5 w-5 text-primary" />
                   Contenido de la Campaña
                 </span>
                 <div className="flex items-center gap-2">
                   <Badge variant="outline" className="text-xs">
                     {selectedItems.size} de {contentItems.length} seleccionados
                   </Badge>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={toggleSelectAll}
                     className="text-xs"
                   >
                     {selectedItems.size === contentItems.length ? (
                       <>
                         <CheckSquare className="h-3 w-3 mr-1" />
                         Deseleccionar
                       </>
                     ) : (
                       <>
                         <Square className="h-3 w-3 mr-1" />
                         Seleccionar
                       </>
                     )}
                   </Button>
                 </div>
               </CardTitle>
             </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contentItems.map((item) => {
                  const ContentIcon = getContentTypeIcon(item.calendar_item.tipo_contenido);
                  const contentColor = getContentTypeColor(item.calendar_item.tipo_contenido);
                  const isCurrentlyCreating = currentlyCreating === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 border rounded-lg transition-all ${
                        isCurrentlyCreating ? 'border-primary bg-primary/5 shadow-md' : 'border-border'
                      }`}
                     >
                       <div className="flex items-center gap-3">
                         <button
                           onClick={() => toggleItemSelection(item.id)}
                           disabled={creating}
                           className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                         >
                           {selectedItems.has(item.id) ? (
                             <CheckSquare className="h-5 w-5 text-primary" />
                           ) : (
                             <Square className="h-5 w-5 text-muted-foreground" />
                           )}
                         </button>
                         <div className={`p-2 rounded ${contentColor} text-white`}>
                           <ContentIcon className="h-4 w-4" />
                         </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.calendar_item.tema_concepto}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.calendar_item.tipo_contenido}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.calendar_item.red_social}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.calendar_item.fecha} • {item.calendar_item.hora}
                            </span>
                          </div>
                        </div>
                         <div className="flex items-center gap-2">
                           {item.status === 'pending' && (
                             <Badge variant="secondary">Pendiente</Badge>
                           )}
                           {item.status === 'creating' && (
                             <Badge className="bg-blue-100 text-blue-800 animate-pulse">
                               <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                               Creando...
                             </Badge>
                           )}
                           {item.status === 'completed' && (
                             <>
                               <Badge className="bg-green-100 text-green-800">
                                 <CheckCircle2 className="w-3 h-3 mr-1" />
                                 Completado
                               </Badge>
                               <Button 
                                 variant="outline" 
                                 size="sm"
                                 onClick={() => handleEnhanceContent(item)}
                                 className="border-primary/30 text-primary hover:bg-primary/10"
                               >
                                 <Plus className="h-4 w-4 mr-1" />
                                 Agregar Media
                               </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handlePreviewContent(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                             </>
                           )}
                           {item.status === 'enhanced' && (
                             <>
                               <Badge className="bg-purple-100 text-purple-800">
                                 <Sparkles className="w-3 h-3 mr-1" />
                                 Mejorado
                               </Badge>
                               {item.media && (
                                 <div className="flex items-center gap-1">
                                   {item.media.type === 'image' ? (
                                     <Image className="h-4 w-4 text-green-600" />
                                   ) : (
                                     <Video className="h-4 w-4 text-red-600" />
                                   )}
                                 </div>
                               )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handlePreviewContent(item)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                             </>
                           )}
                           {item.status === 'error' && (
                             <Badge variant="destructive">Error</Badge>
                           )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Programación'}
        </Button>
      </div>

      {/* Content Enhancement Dialog */}
      <ContentEnhancementDialog
        isOpen={enhancementDialog.isOpen}
        onClose={() => setEnhancementDialog({ isOpen: false, item: null })}
        contentItem={enhancementDialog.item}
        profile={{ user_id: campaignData.user_id }}
        onMediaAdded={handleMediaAdded}
      />

      {/* Social Media Preview Dialog */}
      <SocialMediaPreview
        isOpen={previewDialog.isOpen}
        onClose={() => setPreviewDialog({ isOpen: false, item: null })}
        contentItem={previewDialog.item}
        companyProfile={companyProfile}
      />
    </div>
  );
};