import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Instagram, 
  Linkedin, 
  Music, 
  Facebook, 
  Twitter, 
  Youtube,
  CheckCircle,
  Loader2,
  Sparkles,
  Edit3,
  Eye,
  RefreshCw,
  Target
} from 'lucide-react';

interface ContentCalendarProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

import { SOCIAL_PLATFORMS, getPlatform, getPlatformDisplayName, getPlatformIcon } from '@/lib/socialPlatforms';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00'
];

export const ContentCalendar = ({ campaignData, onComplete, loading }: ContentCalendarProps) => {
  const [calendar, setCalendar] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('7');
  const [isEditing, setIsEditing] = useState(false);
  const [editedCalendar, setEditedCalendar] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadConnectedPlatforms();
  }, []);

  const loadConnectedPlatforms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('social_accounts')
        .select('platform, is_connected')
        .eq('user_id', user.id)
        .eq('is_connected', true);

      if (error) throw error;

      const platforms = (data || [])
        .filter(acc => acc.platform !== 'upload_post_profile')
        .map(acc => acc.platform);
      
      setConnectedPlatforms(platforms);
      setSelectedPlatforms(platforms);
    } catch (error) {
      console.error('Error loading connected platforms:', error);
    }
  };

  const generateCalendar = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Selecciona plataformas",
        description: "Debes seleccionar al menos una plataforma para generar el calendario",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const calendarInput = {
        ...campaignData.company,
        fecha_inicio_calendario: startDate,
        numero_dias_generar: parseInt(duration),
        plataformas_seleccionadas: selectedPlatforms,
        audiencia_objetivo: {
          buyer_personas: campaignData.audience?.buyer_personas || []
        },
        // Pasar toda la estrategia de marketing generada en el paso anterior
        estrategia_de_marketing: campaignData.strategy?.strategy || campaignData.strategy || {}
      };

      console.log('📅 Enviando datos para calendario:', calendarInput);
      console.log('🔍 Debug - estrategia completa:', campaignData.strategy);
      console.log('🔍 Debug - strategy.strategy:', campaignData.strategy?.strategy);
      console.log('🔍 Debug - estrategia enviada:', calendarInput.estrategia_de_marketing);
      
      const { data, error } = await supabase.functions.invoke('marketing-hub-content-calendar', {
        body: { input: calendarInput }
      });

      console.log('📅 Respuesta de función calendar:', { data, error });

      if (error) {
        console.error('❌ Error en función calendar:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No se recibieron datos de la función calendar');
        throw new Error('No se recibieron datos del calendario');
      }

      console.log('📅 Estructura de data recibida:', Object.keys(data));
      console.log('📅 Calendario editorial:', data.calendario_editorial);
      console.log('📊 Distribución funnel:', data.resumen?.distribucion_funnel);
      console.log('🎯 Alineación estratégica:', data.resumen?.alineacion_estrategica);
      
      // Handle the actual API response structure
      const calendarItems = data.calendario_editorial || data.output?.calendario_editorial || [];
      setCalendar({ ...data, calendario_editorial: calendarItems });
      setEditedCalendar(calendarItems);
      
      toast({
        title: "¡Calendario generado!",
        description: "Tu calendario de contenido está listo para revisar",
      });
    } catch (error: any) {
      toast({
        title: "Error al generar calendario",
        description: error.message || "No se pudo generar el calendario",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateCalendarItem = (index: number, field: string, value: any) => {
    setEditedCalendar(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleComplete = () => {
    if (!calendar) {
      toast({
        title: "Calendario requerido",
        description: "Primero debes generar el calendario de contenido",
        variant: "destructive"
      });
      return;
    }

    const calendarData = {
      calendar: calendar,
      calendar_items: isEditing ? editedCalendar : (calendar.calendario_editorial || []),
      edited_calendar: isEditing ? editedCalendar : undefined,
      final_calendar: isEditing ? editedCalendar : (calendar.calendario_editorial || []),
      selected_platforms: selectedPlatforms,
      duration: parseInt(duration),
      start_date: startDate
    };

    onComplete(calendarData);
  };

  const getFunnelStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'awareness': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'consideration': return 'bg-green-100 text-green-800 border-green-300';
      case 'conversion': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'loyalty': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getFunnelStageName = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'awareness': return 'Conciencia';
      case 'consideration': return 'Consideración';
      case 'conversion': return 'Conversión';
      case 'loyalty': return 'Lealtad';
      default: return stage || 'Sin etapa';
    }
  };

  const canGenerate = selectedPlatforms.length > 0;
  const canProceed = calendar && !generating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-orange-800">
            <Calendar className="h-6 w-6" />
            Calendario de Contenido Estratégico
          </CardTitle>
          <p className="text-orange-600">
            Programa tu contenido de manera inteligente para maximizar el impacto
          </p>
        </CardHeader>
      </Card>

      {/* Calendar Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Configuración del Calendario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Plataformas Conectadas ({connectedPlatforms.length})
            </Label>
            {connectedPlatforms.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">
                  No tienes plataformas conectadas. 
                  <Button variant="link" className="p-0 ml-1">
                    Conectar redes sociales
                  </Button>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {connectedPlatforms.map(platform => {
                  const platformConfig = getPlatform(platform);
                  if (!platformConfig) return null;
                  
                  const IconComponent = platformConfig.icon;
                  const isSelected = selectedPlatforms.includes(platform);
                  
                  return (
                    <div
                      key={platform}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedPlatforms(prev => 
                          isSelected 
                            ? prev.filter(p => p !== platform)
                            : [...prev, platform]
                        );
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded ${platformConfig.bgColor} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{platformConfig.name}</p>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={isSelected} />
                            <span className="text-xs text-muted-foreground">Incluir</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Fecha de Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="duration">Duración (días)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">1 Semana (7 días)</SelectItem>
                  <SelectItem value="14">2 Semanas (14 días)</SelectItem>
                  <SelectItem value="30">1 Mes (30 días)</SelectItem>
                  <SelectItem value="90">3 Meses (90 días)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateCalendar}
            disabled={!canGenerate || generating || loading}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generando Calendario...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                Generar Calendario con IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Calendar */}
      {calendar && (
        <>
          {/* Funnel Alignment Summary */}
          {calendar.resumen?.distribucion_funnel && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <Target className="h-5 w-5" />
                  Alineación con Estrategia del Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(calendar.resumen.distribucion_funnel).map(([stage, count]) => (
                    <div key={stage} className="text-center">
                      <div className={`p-3 rounded-lg border-2 ${getFunnelStageColor(stage)}`}>
                        <div className="text-2xl font-bold">{count as number}</div>
                        <div className="text-xs font-medium">{getFunnelStageName(stage)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">✅ Calendario alineado:</span> El contenido está distribuido estratégicamente
                    según las etapas del funnel de marketing para maximizar la conversión.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <CheckCircle className="h-5 w-5" />
                  Calendario Generado ({editedCalendar.length} posts)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {isEditing ? 'Vista Previa' : 'Editar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCalendar}
                    disabled={generating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {editedCalendar.map((item: any, index: number) => {
                  const platformConfig = getPlatform(item.red_social);
                  const IconComponent = platformConfig?.icon || Calendar;
                  const hora = item.hora_publicacion || item.hora || '10:00';
                  
                  return (
                    <Card key={index} className="bg-white border-l-4 border-l-primary/30 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${platformConfig?.bgColor || 'bg-gray-500'} text-white shadow-lg`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div className="flex-1 space-y-3">
                            {isEditing ? (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium">Plataforma</Label>
                                    <Select
                                      value={item.red_social}
                                      onValueChange={(value) => updateCalendarItem(index, 'red_social', value)}
                                    >
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {selectedPlatforms.map(platform => (
                                          <SelectItem key={platform} value={platform}>
                                            {getPlatformDisplayName(platform)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium">Fecha</Label>
                                    <Input
                                      type="date"
                                      value={item.fecha}
                                      onChange={(e) => updateCalendarItem(index, 'fecha', e.target.value)}
                                      className="h-9 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium">Hora</Label>
                                    <Select
                                      value={hora}
                                      onValueChange={(value) => updateCalendarItem(index, 'hora_publicacion', value)}
                                    >
                                      <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeSlots.map(time => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                   <div>
                                     <Label className="text-xs font-medium">Etapa Funnel</Label>
                                     <Select
                                       value={item.funnel_stage || item.etapa_funnel || item.categoria_enfoque || 'awareness'}
                                       onValueChange={(value) => {
                                         updateCalendarItem(index, 'funnel_stage', value);
                                         updateCalendarItem(index, 'etapa_funnel', value);
                                         updateCalendarItem(index, 'categoria_enfoque', value);
                                       }}
                                     >
                                       <SelectTrigger className="h-9 text-sm">
                                         <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                         <SelectItem value="awareness">Conciencia</SelectItem>
                                         <SelectItem value="consideration">Consideración</SelectItem>
                                         <SelectItem value="conversion">Conversión</SelectItem>
                                         <SelectItem value="loyalty">Lealtad</SelectItem>
                                       </SelectContent>
                                     </Select>
                                   </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium">Título/Gancho</Label>
                                    <Input
                                      value={item.titulo_gancho || item.tema_concepto}
                                      onChange={(e) => updateCalendarItem(index, 'titulo_gancho', e.target.value)}
                                      className="text-sm"
                                      placeholder="Título llamativo..."
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium">Tipo de Contenido</Label>
                                    <Input
                                      value={item.tipo_contenido}
                                      onChange={(e) => updateCalendarItem(index, 'tipo_contenido', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium">Copy/Mensaje</Label>
                                  <textarea
                                    value={item.copy_mensaje || ''}
                                    onChange={(e) => updateCalendarItem(index, 'copy_mensaje', e.target.value)}
                                    className="w-full p-2 text-sm border rounded-md resize-none"
                                    rows={3}
                                    placeholder="Texto del post..."
                                  />
                                </div>
                              </>
                            ) : (
                              // Vista previa - mostrar información del calendario con etapa del funnel
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {getPlatformDisplayName(item.red_social)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {item.fecha} • {hora}
                                  </Badge>
                                   <Badge className={`text-xs ${getFunnelStageColor(item.funnel_stage || item.etapa_funnel || item.categoria_enfoque)}`}>
                                     🎯 {getFunnelStageName(item.funnel_stage || item.etapa_funnel || item.categoria_enfoque)}
                                   </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {item.tipo_contenido}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-foreground">
                                    {item.titulo_gancho || item.tema_concepto}
                                  </p>
                                  {item.copy_mensaje && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {item.copy_mensaje}
                                    </p>
                                  )}
                                  {item.descripcion_creativo && (
                                    <p className="text-xs text-muted-foreground/80 mt-1 italic">
                                      📝 {item.descripcion_creativo}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Complete Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleComplete}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Creación de Contenido'}
        </Button>
      </div>
    </div>
  );
};