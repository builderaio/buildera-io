import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock,
  Calendar,
  CheckCircle2,
  Play,
  Pause,
  Settings,
  Zap,
  Loader2,
  Instagram,
  Linkedin,
  Music,
  Facebook,
  Twitter,
  Youtube,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';

interface ContentSchedulingProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

import { SOCIAL_PLATFORMS, getPlatform, getPlatformDisplayName, getPlatformIcon } from '@/lib/socialPlatforms';

export const ContentScheduling = ({ campaignData, onComplete, loading }: ContentSchedulingProps) => {
  const [schedulingSettings, setSchedulingSettings] = useState({
    autoPublish: true,
    enableNotifications: true,
    bufferTime: 5, // minutes
    retryOnError: true,
    maxRetries: 3
  });
  
  const [scheduling, setScheduling] = useState(false);
  const [scheduledItems, setScheduledItems] = useState([]);
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  // Debug logging and better data access
  console.log('ContentScheduling - campaignData:', campaignData);
  console.log('ContentScheduling - campaignData.content:', campaignData.content);
  
  const createdContent = campaignData.content?.created_content || [];
  const totalItems = createdContent.length;
  
  console.log('ContentScheduling - createdContent:', createdContent);
  console.log('ContentScheduling - totalItems:', totalItems);

  // Platform compatibility validation
  const validatePlatformCompatibility = (platform: string, postType: string) => {
    const supportedPlatforms = {
      text: ['linkedin', 'twitter', 'facebook', 'threads', 'reddit'],
      photo: ['tiktok', 'instagram', 'linkedin', 'facebook', 'twitter', 'threads', 'pinterest'],
      video: ['tiktok', 'instagram', 'linkedin', 'youtube', 'facebook', 'twitter', 'threads', 'pinterest']
    };

    // Normalize platform names (convert twitter to x for text and photo posts)
    const normalizedPlatform = platform === 'twitter' && postType !== 'video' ? 'x' : platform;
    
    return supportedPlatforms[postType as keyof typeof supportedPlatforms]?.includes(normalizedPlatform);
  };

  const scheduleAllContent = async () => {
    if (totalItems === 0) {
      toast({
        title: "No hay contenido",
        description: "Primero necesitas crear el contenido de la campaña",
        variant: "destructive"
      });
      return;
    }

    setScheduling(true);
    const scheduled = [];

    try {
      // Get user and company info for Upload-Post integration
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Get company username for Upload-Post
      const { data: socialAccountData } = await supabase
        .from('social_accounts')
        .select('company_username')
        .eq('user_id', user.id)
        .eq('platform', 'upload_post_profile')
        .limit(1);

      const companyUsername = socialAccountData?.[0]?.company_username;
      if (!companyUsername) {
        throw new Error("Perfil de Upload-Post no configurado. Configura tus conexiones sociales primero.");
      }

      for (let i = 0; i < createdContent.length; i++) {
        const contentItem = createdContent[i];
        
        try {
          // Format scheduled date properly for Upload-Post API with timezone correction
          const { fecha, hora_publicacion } = contentItem.calendar_item;
          
          // Parse the date and time
          let scheduledDateTime = new Date(`${fecha}T${hora_publicacion || '09:00'}:00`);
          
          if (isNaN(scheduledDateTime.getTime())) {
            throw new Error(`Fecha inválida para el contenido ${i + 1}: ${fecha} ${hora_publicacion}`);
          }
          
          // Ensure the scheduled date is at least 1 day in the future (24 hours + 1 hour buffer)
          const minScheduledDate = new Date();
          minScheduledDate.setHours(minScheduledDate.getHours() + 25); // 25 hours to ensure we're past "tomorrow"
          
          if (scheduledDateTime <= minScheduledDate) {
            // If the date is in the past or too close, schedule it for tomorrow at the same time
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(parseInt(hora_publicacion?.split(':')[0] || '09'), 
                             parseInt(hora_publicacion?.split(':')[1] || '00'), 0, 0);
            scheduledDateTime = tomorrow;
            
            console.log(`⏰ Adjusted schedule time for content ${i + 1} to tomorrow:`, scheduledDateTime.toISOString());
          }
          
          // Convert to ISO string for Upload-Post API (UTC)
          const scheduledDateISO = scheduledDateTime.toISOString();

          // Determine post type and extract media URLs
          let postType = 'text';
          let mediaUrls = [];
          
          if (contentItem.content?.image_urls?.length > 0) {
            postType = 'photo';
            mediaUrls = contentItem.content.image_urls;
          } else if (contentItem.content?.video_url) {
            postType = 'video';
            mediaUrls = [contentItem.content.video_url];
          }

          // Validate platform compatibility before scheduling
          const platform = contentItem.calendar_item.red_social;
          if (!validatePlatformCompatibility(platform, postType)) {
            const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
            const postTypeName = postType === 'text' ? 'texto' : postType === 'photo' ? 'foto' : 'video';
            throw new Error(`${platformName} no soporta publicaciones de ${postTypeName}. Revisa el contenido del calendario.`);
          }

          // Schedule the post via Upload-Post API
          const { data: result, error } = await supabase.functions.invoke('upload-post-manager', {
            body: {
              action: 'post_content',
              data: {
                companyUsername,
                platforms: [contentItem.calendar_item.red_social],
                title: contentItem.calendar_item.titulo_gancho || contentItem.calendar_item.tema_concepto,
                content: contentItem.content?.copy_mensaje || contentItem.calendar_item.copy_mensaje,
                mediaUrls,
                postType,
                scheduledDate: scheduledDateISO,
                async_upload: true
              }
            }
          });

          if (error) {
            throw error;
          }

          const scheduledItem = {
            id: result?.job_id || `scheduled-${i}`,
            job_id: result?.job_id,
            platform: contentItem.calendar_item.red_social,
            content: contentItem.content,
            calendar_item: contentItem.calendar_item,
            scheduled_time: scheduledDateISO,
            status: 'scheduled',
            auto_publish: schedulingSettings.autoPublish,
            upload_post_result: result
          };

          scheduled.push(scheduledItem);
          setScheduledItems([...scheduled]);

          // Format date display in local timezone
          const displayDate = scheduledDateTime.toLocaleDateString('es-ES', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
          const displayTime = scheduledDateTime.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });

          toast({
            title: `Contenido ${i + 1} programado`,
            description: `Programado para ${displayDate} a las ${displayTime}`,
          });

        } catch (itemError: any) {
          console.error(`Error scheduling item ${i}:`, itemError);
          toast({
            title: `Error en contenido ${i + 1}`,
            description: itemError.message || "Error al programar este contenido",
            variant: "destructive"
          });
          
          // Add failed item to list for visibility
          const failedItem = {
            id: `failed-${i}`,
            platform: contentItem.calendar_item.red_social,
            content: contentItem.content,
            calendar_item: contentItem.calendar_item,
            scheduled_time: `${contentItem.calendar_item.fecha}T${contentItem.calendar_item.hora_publicacion || '09:00'}:00`,
            status: 'failed',
            error: itemError.message
          };
          scheduled.push(failedItem);
          setScheduledItems([...scheduled]);
        }
      }

      const successCount = scheduled.filter(item => item.status === 'scheduled').length;
      const failedCount = scheduled.filter(item => item.status === 'failed').length;

      if (successCount > 0) {
        toast({
          title: "¡Programación completada!",
          description: `${successCount} publicaciones programadas exitosamente${failedCount > 0 ? ` (${failedCount} fallaron)` : ''}`,
        });
      } else if (failedCount > 0) {
        toast({
          title: "Error en programación",
          description: `No se pudo programar ningún contenido (${failedCount} errores)`,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Error in scheduleAllContent:', error);
      toast({
        title: "Error en programación",
        description: error?.message || "No se pudo programar el contenido",
        variant: "destructive"
      });
    } finally {
      setScheduling(false);
    }
  };

  const retryFailedContent = async () => {
    const failedItems = scheduledItems.filter(item => item.status === 'failed');
    
    if (failedItems.length === 0) {
      toast({
        title: "No hay contenido para reintentar",
        description: "Todas las publicaciones están programadas correctamente",
      });
      return;
    }

    setRetrying(true);
    let retriedCount = 0;
    let successCount = 0;

    try {
      // Get user and company info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const { data: socialAccountData } = await supabase
        .from('social_accounts')
        .select('company_username')
        .eq('user_id', user.id)
        .eq('platform', 'upload_post_profile')
        .limit(1);

      const companyUsername = socialAccountData?.[0]?.company_username;
      if (!companyUsername) {
        throw new Error("Perfil de Upload-Post no configurado");
      }

      const updatedItems = [...scheduledItems];

      for (const failedItem of failedItems) {
        retriedCount++;
        
        try {
          // Format scheduled date properly with timezone correction
          let scheduledDateTime = new Date(failedItem.scheduled_time);
          
          if (isNaN(scheduledDateTime.getTime())) {
            throw new Error(`Fecha inválida: ${failedItem.scheduled_time}`);
          }
          
          // Ensure the scheduled date is at least 1 day in the future for retry
          const minScheduledDate = new Date();
          minScheduledDate.setHours(minScheduledDate.getHours() + 25);
          
          if (scheduledDateTime <= minScheduledDate) {
            // Reschedule for tomorrow at the same time
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(scheduledDateTime.getHours(), scheduledDateTime.getMinutes(), 0, 0);
            scheduledDateTime = tomorrow;
            
            console.log(`⏰ Adjusted retry schedule time to tomorrow:`, scheduledDateTime.toISOString());
          }
          
          const scheduledDateISO = scheduledDateTime.toISOString();

          // Determine post type and extract media URLs
          let postType = 'text';
          let mediaUrls = [];
          
          if (failedItem.content?.image_urls?.length > 0) {
            postType = 'photo';
            mediaUrls = failedItem.content.image_urls;
          } else if (failedItem.content?.video_url) {
            postType = 'video';
            mediaUrls = [failedItem.content.video_url];
          }

          // Validate platform compatibility before retry
          const platform = failedItem.platform;
          if (!validatePlatformCompatibility(platform, postType)) {
            const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
            const postTypeName = postType === 'text' ? 'texto' : postType === 'photo' ? 'foto' : 'video';
            throw new Error(`${platformName} no soporta publicaciones de ${postTypeName}. Esta plataforma no es compatible con este tipo de contenido.`);
          }

          // Retry scheduling the post
          const { data: result, error } = await supabase.functions.invoke('upload-post-manager', {
            body: {
              action: 'post_content',
              data: {
                companyUsername,
                platforms: [failedItem.platform],
                title: failedItem.calendar_item.titulo_gancho || failedItem.calendar_item.tema_concepto,
                content: failedItem.content?.copy_mensaje || failedItem.calendar_item.copy_mensaje,
                mediaUrls,
                postType,
                scheduledDate: scheduledDateISO,
                async_upload: true
              }
            }
          });

          if (error) {
            throw error;
          }

          // Update the item as successfully scheduled
          const itemIndex = updatedItems.findIndex(item => item.id === failedItem.id);
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              status: 'scheduled',
              job_id: result?.job_id,
              upload_post_result: result,
              error: undefined,
              retry_count: (updatedItems[itemIndex].retry_count || 0) + 1
            };
          }

          successCount++;

          toast({
            title: `Reintento exitoso`,
            description: `Contenido para ${failedItem.platform} programado correctamente`,
          });

        } catch (retryError: any) {
          console.error(`Error retrying item ${failedItem.id}:`, retryError);
          
          // Update the error message for this item
          const itemIndex = updatedItems.findIndex(item => item.id === failedItem.id);
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              error: retryError.message,
              retry_count: (updatedItems[itemIndex].retry_count || 0) + 1
            };
          }

          toast({
            title: `Error en reintento`,
            description: `${failedItem.platform}: ${retryError.message}`,
            variant: "destructive"
          });
        }
      }

      setScheduledItems(updatedItems);

      if (successCount > 0) {
        toast({
          title: "¡Reintento completado!",
          description: `${successCount} de ${retriedCount} publicaciones programadas exitosamente`,
        });
      }

    } catch (error: any) {
      console.error('Error in retryFailedContent:', error);
      toast({
        title: "Error en reintento",
        description: error?.message || "No se pudo reintentar el contenido",
        variant: "destructive"
      });
    } finally {
      setRetrying(false);
    }
  };

  const removeFailedItem = (itemId: string) => {
    const updatedItems = scheduledItems.filter(item => item.id !== itemId);
    setScheduledItems(updatedItems);
    
    toast({
      title: "Contenido removido",
      description: "El contenido fallido ha sido removido de la lista",
    });
  };

  const handleComplete = () => {
    if (scheduledItems.length === 0) {
      toast({
        title: "Programación requerida",
        description: "Debes programar el contenido antes de continuar",
        variant: "destructive"
      });
      return;
    }

    const schedulingData = {
      scheduled_items: scheduledItems,
      settings: schedulingSettings,
      total_scheduled: scheduledItems.length,
      campaign_duration: campaignData.calendar?.duration || 7,
      start_date: campaignData.calendar?.start_date
    };

    onComplete(schedulingData);
  };

  const getScheduledByPlatform = () => {
    const platforms = {};
    scheduledItems.forEach(item => {
      const platform = item.platform;
      if (!platforms[platform]) {
        platforms[platform] = 0;
      }
      platforms[platform]++;
    });
    return platforms;
  };

  const getContentByPlatform = () => {
    const platforms = {};
    createdContent.forEach(item => {
      const platform = item.calendar_item?.red_social;
      if (platform && !platforms[platform]) {
        platforms[platform] = 0;
      }
      if (platform) {
        platforms[platform]++;
      }
    });
    return platforms;
  };

  const scheduledByPlatform = getScheduledByPlatform();
  const contentByPlatform = getContentByPlatform();
  const canProceed = scheduledItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-indigo-800">
            <Clock className="h-6 w-6" />
            Programación Automática de Contenido
          </CardTitle>
          <p className="text-indigo-600">
            Programa tu contenido para publicación automática en todas las plataformas
          </p>
        </CardHeader>
      </Card>

      {/* Scheduling Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Configuración de Programación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-publish" className="text-base font-medium">
                Publicación Automática
              </Label>
              <p className="text-sm text-muted-foreground">
                Las publicaciones se enviarán automáticamente a la hora programada
              </p>
            </div>
            <Switch
              id="auto-publish"
              checked={schedulingSettings.autoPublish}
              onCheckedChange={(checked) => 
                setSchedulingSettings(prev => ({ ...prev, autoPublish: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-base font-medium">
                Notificaciones
              </Label>
              <p className="text-sm text-muted-foreground">
                Recibe notificaciones sobre el estado de las publicaciones
              </p>
            </div>
            <Switch
              id="notifications"
              checked={schedulingSettings.enableNotifications}
              onCheckedChange={(checked) => 
                setSchedulingSettings(prev => ({ ...prev, enableNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="retry" className="text-base font-medium">
                Reintento Automático
              </Label>
              <p className="text-sm text-muted-foreground">
                Reintentar automáticamente si falla una publicación
              </p>
            </div>
            <Switch
              id="retry"
              checked={schedulingSettings.retryOnError}
              onCheckedChange={(checked) => 
                setSchedulingSettings(prev => ({ ...prev, retryOnError: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Resumen del Contenido ({totalItems} publicaciones)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalItems === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay contenido para programar. Primero crea el contenido de la campaña.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show content overview by platform */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(contentByPlatform).map(([platform, count]) => {
                  const platformConfig = getPlatform(platform);
                  if (!platformConfig) return null;
                  
                  const IconComponent = platformConfig.icon;
                  
                  return (
                    <div key={platform} className="text-center p-4 border rounded-lg">
                      <div className={`w-12 h-12 ${platformConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-2 text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <p className="font-semibold">{count as number}</p>
                      <p className="text-xs text-muted-foreground">{platformConfig.name}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Content items preview */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Vista previa del contenido:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {createdContent.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded text-sm">
                      <Badge variant="secondary" className="text-xs">
                        {item.calendar_item?.red_social || 'Sin plataforma'}
                      </Badge>
                      <span className="flex-1 truncate">
                        {item.calendar_item?.tema_concepto || 'Sin título'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.calendar_item?.fecha || 'Sin fecha'}
                      </span>
                    </div>
                  ))}
                  {createdContent.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{createdContent.length - 5} contenidos más
                    </p>
                  )}
                </div>
              </div>

              {scheduledItems.length === 0 ? (
                <div className="text-center py-8">
                  <Button 
                    onClick={scheduleAllContent}
                    disabled={scheduling || loading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    size="lg"
                  >
                    {scheduling ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Programando...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Programar Todo el Contenido
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      ¡Contenido Programado Exitosamente!
                    </h4>
                  </div>
                  <p className="text-sm text-green-700">
                    {scheduledItems.length} publicaciones han sido programadas para 
                    {schedulingSettings.autoPublish ? ' publicación automática' : ' revisión manual'}.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Items */}
      {scheduledItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Contenido Programado
              </CardTitle>
              {scheduledItems.some(item => item.status === 'failed') && (
                <Button
                  onClick={retryFailedContent}
                  disabled={retrying}
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50"
                >
                  {retrying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reintentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reintentar Fallidos
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Failed Items Summary */}
            {scheduledItems.some(item => item.status === 'failed') && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-medium text-orange-800">
                    Publicaciones con Errores
                  </h4>
                </div>
                <p className="text-xs text-orange-700">
                  {scheduledItems.filter(item => item.status === 'failed').length} publicaciones fallaron. 
                  Puedes reintentarlas o revisar los errores individualmente.
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {scheduledItems.slice(0, 10).map((item: any) => {
                const platformConfig = getPlatform(item.platform);
                const IconComponent = platformConfig?.icon || Calendar;
                
                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded ${platformConfig?.bgColor || 'bg-gray-500'} text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {item.calendar_item.tema_concepto}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(item.scheduled_time);
                            return isNaN(date.getTime()) ? 
                              'Fecha inválida' : 
                              date.toLocaleString('es-ES', {
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                          } catch {
                            return 'Fecha inválida';
                          }
                        })()}
                      </p>
                      {item.status === 'failed' && item.error && (
                        <p className="text-xs text-red-600 mt-1 truncate" title={item.error}>
                          Error: {item.error}
                        </p>
                      )}
                      {item.retry_count && item.retry_count > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Reintentos: {item.retry_count}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {platformConfig?.name || item.platform}
                      </Badge>
                      {item.status === 'scheduled' ? (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Programado
                        </Badge>
                      ) : item.status === 'failed' ? (
                        <>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Error
                          </Badge>
                          <Button
                            onClick={() => removeFailedItem(item.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Remover este contenido fallido"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
              {scheduledItems.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{scheduledItems.length - 10} más programados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Ver Resumen de Campaña'}
        </Button>
      </div>
    </div>
  );
};