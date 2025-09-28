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
  Youtube
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
  const { toast } = useToast();

  // Debug logging and better data access
  console.log('ContentScheduling - campaignData:', campaignData);
  console.log('ContentScheduling - campaignData.content:', campaignData.content);
  
  const createdContent = campaignData.content?.created_content || [];
  const totalItems = createdContent.length;
  
  console.log('ContentScheduling - createdContent:', createdContent);
  console.log('ContentScheduling - totalItems:', totalItems);

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
          // Format scheduled date properly for Upload-Post API
          const { fecha, hora_publicacion } = contentItem.calendar_item;
          const scheduledDateTime = new Date(`${fecha}T${hora_publicacion || '09:00'}:00`);
          
          if (isNaN(scheduledDateTime.getTime())) {
            throw new Error(`Fecha inválida para el contenido ${i + 1}: ${fecha} ${hora_publicacion}`);
          }

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
                scheduledDate: scheduledDateTime.toISOString(),
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
            scheduled_time: scheduledDateTime.toISOString(),
            status: 'scheduled',
            auto_publish: schedulingSettings.autoPublish,
            upload_post_result: result
          };

          scheduled.push(scheduledItem);
          setScheduledItems([...scheduled]);

          toast({
            title: `Contenido ${i + 1} programado`,
            description: `Programado para ${scheduledDateTime.toLocaleDateString('es-ES')} a las ${scheduledDateTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
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
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Contenido Programado
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                        <Badge className="bg-red-100 text-red-800 text-xs">
                          Error
                        </Badge>
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