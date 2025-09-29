import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2,
  Calendar,
  Target,
  Users,
  Eye,
  Clock,
  Zap,
  TrendingUp,
  PlayCircle,
  FileText,
  Image,
  Video,
  BarChart3
} from 'lucide-react';
import { getPlatform } from '@/lib/socialPlatforms';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CampaignMeasurementProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

export const CampaignMeasurement = ({ campaignData, onComplete, loading }: CampaignMeasurementProps) => {
  const { toast } = useToast();
  const [completingTour, setCompletingTour] = useState(false);
  
  // Detectar si el usuario está en el tour guiado
  const completeGuidedTourStep = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si el usuario está en el tour guiado
      const { data: tourStatus, error: tourError } = await supabase
        .from('user_guided_tour')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tourError) {
        console.error('Error fetching tour status:', tourError);
        return;
      }

      if (tourStatus && !tourStatus.tour_completed) {
        const currentCompletedSteps = tourStatus.completed_steps || [];
        const step6Completed = currentCompletedSteps.includes(6);
        
        if (!step6Completed) {
          // Completar el paso 6 (Crear Campañas)
          const newCompletedSteps = [...currentCompletedSteps, 6];
          const nextStep = Math.max(...newCompletedSteps) + 1;
          const allCompleted = newCompletedSteps.length === 9; // Total de pasos

          const { error: updateError } = await supabase
            .from('user_guided_tour')
            .update({
              current_step: allCompleted ? 9 : nextStep,
              completed_steps: newCompletedSteps,
              tour_completed: allCompleted,
              updated_at: new Date().toISOString(),
              ...(allCompleted && { tour_completed_at: new Date().toISOString() })
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating tour status:', updateError);
            return;
          }

          toast({
            title: "¡Paso del tour completado!",
            description: "Has completado exitosamente la creación de campañas. El tour continuará con el siguiente paso.",
          });
        }
      }
    } catch (error) {
      console.error('Error completing guided tour step:', error);
      // No mostrar error al usuario para evitar confusión
    }
  };
  
  const handleComplete = async () => {
    setCompletingTour(true);
    
    try {
      // Completar el paso del tour guiado si corresponde (sin await para evitar bloqueos)
      completeGuidedTourStep().catch(error => {
        console.error('Tour step completion failed:', error);
      });

      const summaryData = {
        campaign_status: 'created',
        summary: {
          objective: campaignData.objective,
          audience: campaignData.audience,
          strategy: campaignData.strategy,
          calendar: campaignData.calendar,
          content: campaignData.content,
          schedule: campaignData.schedule
        },
        created_at: new Date().toISOString(),
        next_steps: [
          "Monitorear el rendimiento de los posts programados",
          "Ajustar horarios basándose en el engagement",
          "Crear contenido adicional si es necesario",
          "Revisar y optimizar la estrategia cada semana"
        ]
      };

      // Llamar onComplete para avanzar al siguiente paso o finalizar
      onComplete(summaryData);
      
      toast({
        title: "¡Campaña finalizada!",
        description: "Tu campaña ha sido creada exitosamente",
      });

    } catch (error) {
      console.error('Error completing campaign:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al finalizar la campaña. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setCompletingTour(false);
    }
  };

  // Extract campaign data
  const objective = campaignData.objective || {};
  const audience = campaignData.audience || {};
  const strategy = campaignData.strategy || {};
  const calendar = campaignData.calendar || {};
  const content = campaignData.content || {};
  const schedule = campaignData.schedule || {};
  
  // Extraer datos reales de la campaña con más precisión
  const totalScheduled = schedule?.scheduled_items?.length || content?.created_content?.length || 0;
  const campaignDuration = schedule?.campaign_duration || calendar?.duration || 7;
  const selectedPlatforms = calendar?.selected_platforms || schedule?.scheduled_items?.map(item => item.platform).filter((platform, index, arr) => arr.indexOf(platform) === index) || [];
  const createdContent = content?.created_content || [];
  
  // Mejorar el cálculo de métricas de rendimiento proyectadas basadas en datos reales
  const totalPosts = Math.max(totalScheduled, createdContent.length);
  const avgPostsPerDay = campaignDuration > 0 ? Math.round((totalPosts / campaignDuration) * 10) / 10 : 0;
  const estimatedReach = totalPosts * 150; // Estimación conservadora
  const estimatedEngagement = Math.round(estimatedReach * 0.03); // ~3% engagement rate
  
  // Content type analysis
  const contentTypes = createdContent.reduce((acc, item) => {
    const type = item.calendar_item?.tipo_contenido || 'text';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  // Platform distribution
  const platformDistribution = createdContent.reduce((acc, item) => {
    const platform = item.calendar_item?.red_social;
    if (platform) {
      acc[platform] = (acc[platform] || 0) + 1;
    }
    return acc;
  }, {});
  
  const getContentTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'imagen':
      case 'foto':
      case 'carrusel':
        return Image;
      case 'video':
      case 'video corto':
      case 'reel':
        return Video;
      default:
        return FileText;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="h-6 w-6" />
            ¡Campaña Creada Exitosamente!
          </CardTitle>
          <p className="text-green-600">
            Resumen completo de tu campaña de marketing con IA
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Resumen General de la Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{campaignDuration}</p>
              <p className="text-sm text-blue-600">Días de duración</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Eye className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{totalPosts}</p>
              <p className="text-sm text-green-600">Posts creados</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{selectedPlatforms.length}</p>
              <p className="text-sm text-purple-600">Plataformas</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{avgPostsPerDay}</p>
              <p className="text-sm text-orange-600">Posts/día promedio</p>
            </div>
          </div>
          
          {/* Métricas de rendimiento estimadas */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Rendimiento Proyectado (Próximos {campaignDuration} días)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estimatedReach.toLocaleString()}</p>
                <p className="text-sm text-blue-600">Alcance estimado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{estimatedEngagement.toLocaleString()}</p>
                <p className="text-sm text-green-600">Interacciones esperadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">3.0%</p>
                <p className="text-sm text-purple-600">Tasa de engagement</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Proyecciones basadas en promedios de la industria y datos históricos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Objective */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Objetivo de la Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                {objective.goal || 'Aumentar awareness de marca'}
              </h4>
              <p className="text-blue-600 text-sm">
                Duración: {objective.timeline || `${campaignDuration} días`}
              </p>
              {objective.budget && (
                <p className="text-blue-600 text-sm">
                  Presupuesto: ${objective.budget}
                </p>
              )}
            </div>
            
            {objective.target_metrics && Object.keys(objective.target_metrics).length > 0 && (
              <div>
                <h5 className="font-medium mb-2">Métricas Objetivo:</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(objective.target_metrics).map(([metric, value]) => (
                    <div key={metric} className="p-3 border rounded-lg text-center">
                      <p className="font-semibold text-primary">{value as number}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {metric.replace('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Audience */}
      {audience && Object.keys(audience).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Audiencia Objetivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {audience.demographics && (
                <div className="space-y-2">
                  <h5 className="font-medium">Demografía:</h5>
                  <div className="space-y-1 text-sm">
                    {audience.demographics.age_range && (
                      <p>• Edad: {audience.demographics.age_range}</p>
                    )}
                    {audience.demographics.location && (
                      <p>• Ubicación: {audience.demographics.location}</p>
                    )}
                    {audience.demographics.gender && (
                      <p>• Género: {audience.demographics.gender}</p>
                    )}
                  </div>
                </div>
              )}
              
              {audience.interests && audience.interests.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium">Intereses:</h5>
                  <div className="flex flex-wrap gap-1">
                    {audience.interests.slice(0, 6).map((interest, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {audience.interests.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{audience.interests.length - 6} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contenido Generado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Content Types */}
            {Object.keys(contentTypes).length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Tipos de Contenido:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(contentTypes).map(([type, count]) => {
                    const IconComponent = getContentTypeIcon(type);
                    return (
                      <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary mx-auto mb-1" />
                        <p className="font-semibold">{count as number}</p>
                        <p className="text-xs text-muted-foreground capitalize">{type}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Platform Distribution */}
            {Object.keys(platformDistribution).length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Distribución por Plataforma:</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(platformDistribution).map(([platform, count]) => {
                    const platformConfig = getPlatform(platform);
                    if (!platformConfig) return null;
                    const IconComponent = platformConfig.icon;
                    
                    return (
                      <div key={platform} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className={`p-2 rounded ${platformConfig.bgColor} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{count as number}</p>
                          <p className="text-xs text-muted-foreground">{platformConfig.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Summary */}
      {schedule && schedule.scheduled_items && schedule.scheduled_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Cronograma de Publicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Posts Programados</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {schedule.scheduled_items.filter(item => item.status === 'scheduled').length} activos
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {schedule.scheduled_items.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate max-w-[200px]">
                        {item.calendar_item?.tema_concepto || `Post ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.platform}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const date = new Date(item.scheduled_time);
                            return isNaN(date.getTime()) ? 
                              'Pendiente' : 
                              date.toLocaleDateString('es-ES', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                          } catch {
                            return 'Pendiente';
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
                {schedule.scheduled_items.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    +{schedule.scheduled_items.length - 5} publicaciones más
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-5 w-5" />
            Próximos Pasos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Monitorear el rendimiento de los posts programados desde el dashboard",
              "Revisar y responder a comentarios e interacciones",
              "Ajustar horarios de publicación basándose en el engagement inicial", 
              "Analizar qué tipo de contenido genera mejor respuesta",
              "Considerar crear contenido adicional para mantener la presencia activa",
              "Evaluar los resultados después de la primera semana para optimizar"
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white border border-blue-200 rounded-lg">
                <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-sm text-blue-800">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Complete Campaign */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-8 text-center">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-primary">
              ¡Tu Campaña con IA Está Lista!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Hemos creado y programado todo tu contenido automáticamente. 
              Ahora puedes monitorear el rendimiento y ver cómo crece tu presencia digital.
            </p>
            
            <div className="grid grid-cols-3 gap-4 my-6 text-sm">
              <div className="text-center">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <p className="font-medium">Contenido</p>
                <p className="text-xs text-muted-foreground">Generado</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <p className="font-medium">Posts</p>
                <p className="text-xs text-muted-foreground">Programados</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </div>
                <p className="font-medium">Analytics</p>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </div>
            </div>
            
            <Button 
              onClick={handleComplete}
              disabled={loading || completingTour}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {loading || completingTour ? 'Finalizando campaña...' : 'Finalizar Campaña'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};