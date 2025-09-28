import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Edit3, 
  Sparkles, 
  Target, 
  Zap,
  CheckCircle,
  Loader2,
  TrendingUp,
  Lightbulb
} from 'lucide-react';

interface MarketingStrategyProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

export const MarketingStrategy = ({ campaignData, onComplete, loading }: MarketingStrategyProps) => {
  const [strategy, setStrategy] = useState<any>(null);
  const [editedStrategy, setEditedStrategy] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  console.log('🔍 MarketingStrategy render - strategy:', strategy, 'generating:', generating, 'campaignData:', campaignData);

  const generateStrategy = async () => {
    console.log('🚀 Starting strategy generation');
    console.log('📋 Campaign data:', campaignData);
    
    if (!campaignData.company || !campaignData.audience) {
      console.error('❌ Missing required data:', { 
        hasCompany: !!campaignData.company, 
        hasAudience: !!campaignData.audience 
      });
      toast({
        title: "Datos insuficientes",
        description: "Necesitamos la información de empresa y audiencia para generar la estrategia",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    
    try {
      const strategyInput = {
        ...campaignData.company,
        objetivo_campana: campaignData.objective?.goal || '',
        audiencia_objetivo: {
          buyer_personas: campaignData.audience?.buyer_personas || []
        }
      };

      console.log('📤 Sending strategy input:', strategyInput);

      // Llamar función Edge (proxy) para evitar problemas de CORS y manejar auth opcional
      const { data, error } = await supabase.functions.invoke('marketing-strategy-proxy', {
        body: strategyInput
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Error al contactar el webhook');
      }

      // Verificar si el proxy devolvió un error
      if (data?.ok === false) {
        console.error('❌ N8N webhook error:', data);
        throw new Error(`Error del webhook (${data.status}): ${data.statusText || data.error || 'Error desconocido'}`);
      }

      // Extraer los datos del proxy
      const strategyData = data?.ok ? data.data : data;
      console.log('📥 Raw strategy data received:', strategyData);
      
      // Procesar la respuesta de N8N correctamente
      let processedStrategy = strategyData;
      if (Array.isArray(strategyData) && strategyData.length > 0 && strategyData[0].output) {
        processedStrategy = strategyData[0].output;
        console.log('🔄 Extracted strategy from N8N array format');
      }

      const normalizeStrategy = (raw: any) => {
        const s: any = { ...(raw || {}) };

        // Canonicalizar nombres de plataformas para evitar duplicados (p. ej. linkedin vs LinkedIn)
        const canon = (p: string) => {
          const k = (p || '').toLowerCase();
          if (k === 'linkedin' || k === 'linked in') return 'LinkedIn';
          if (k === 'instagram') return 'Instagram';
          if (k === 'tiktok' || k === 'tik tok') return 'TikTok';
          if (k === 'email' || k === 'correo' || k === 'mail') return 'Email';
          if (k === 'web' || k === 'website' || k === 'sitio' || k === 'site') return 'Web';
          return p || '';
        };

        // message_variants como objeto { Platform: message }
        if (Array.isArray(s.message_variants)) {
          s.message_variants = s.message_variants.reduce((acc: Record<string, string>, item: any) => {
            const platform = item?.platform || item?.plataforma || item?.canal;
            const msg = item?.message || item?.mensaje || '';
            if (platform && typeof msg === 'string') acc[canon(platform)] = msg;
            return acc;
          }, {} as Record<string, string>);
        } else if (s.message_variants && typeof s.message_variants === 'object') {
          s.message_variants = Object.entries(s.message_variants).reduce((acc: Record<string, string>, [k, v]) => {
            acc[canon(k)] = typeof v === 'string' ? v : String(v);
            return acc;
          }, {} as Record<string, string>);
        } else {
          s.message_variants = {};
        }

        // Asegurar arrays
        s.editorial_calendar = Array.isArray(s.editorial_calendar) ? s.editorial_calendar : [];
        s.competitors = Array.isArray(s.competitors) ? s.competitors : [];

        // Normalizar strategies (aceptar funnel_strategies)
        s.strategies = (s.strategies && typeof s.strategies === 'object')
          ? s.strategies
          : (s.funnel_strategies && typeof s.funnel_strategies === 'object') ? s.funnel_strategies : {};

        // Asegurar objetos
        s.content_plan = s.content_plan && typeof s.content_plan === 'object' ? s.content_plan : {};
        // Canonicalizar claves del plan de contenido
        s.content_plan = Object.entries(s.content_plan).reduce((acc: Record<string, any>, [k, v]) => {
          acc[canon(k)] = v;
          return acc;
        }, {} as Record<string, any>);

        // Normalizar KPIs a arreglo para evitar fallos en render
        if (Array.isArray(s.kpis_goals)) {
          // ok
        } else if (s.kpis_goals && typeof s.kpis_goals === 'object') {
          const labels: Record<string, string> = {
            reach: 'Alcance',
            impressions: 'Impresiones',
            ctr: 'CTR',
            leads: 'Leads',
            conversion_rate: 'Tasa de conversión',
            'conversion rate': 'Tasa de conversión',
            cac: 'CAC estimado'
          };
          s.kpis_goals = Object.entries(s.kpis_goals).map(([k, v]) => {
            const key = typeof k === 'string' ? k.toLowerCase() : String(k);
            return {
              kpi: labels[key] || (k as string),
              goal: String(v)
            };
          });
        } else {
          s.kpis_goals = [];
        }

        // Fallbacks de competidores
        s.competitors = s.competitors.map((c: any) => ({
          ...c,
          digital_tactics_summary: c?.digital_tactics_summary || c?.tactics || ''
        }));

        // Normalizar y deduplicar calendario editorial
        if (Array.isArray(s.editorial_calendar)) {
          s.editorial_calendar = s.editorial_calendar.map((item: any) => ({
            ...item,
            channel: canon(item?.channel || item?.red_social || item?.canal || ''),
            format: item?.format || item?.tipo_contenido || item?.tipo || '',
            title: item?.title || item?.titulo_gancho || item?.tema_concepto || '',
            cta: item?.cta || item?.call_to_action || item?.llamado_accion || '',
            date: item?.date || item?.fecha || ''
          }));
          const seen = new Set<string>();
          s.editorial_calendar = s.editorial_calendar.filter((it: any) => {
            const key = [it.date, it.channel, it.title].join('|').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        return s;
      };

      const normalized = normalizeStrategy(processedStrategy);

      console.log('✅ Processed strategy (normalized):', normalized);
      
      if (!normalized || Object.keys(normalized).length === 0) {
        throw new Error('La estrategia recibida está vacía');
      }
      
      setStrategy(normalized);
      
      // Crear un resumen editable de la estrategia basado en la nueva estructura
      const strategyText = normalized.core_message ? 
        `MENSAJE PRINCIPAL: ${normalized.core_message}

VARIACIONES POR PLATAFORMA:
${Object.entries(normalized.message_variants || {}).map(([platform, message]: [string, any]) => 
  `• ${platform.toUpperCase()}: ${message}`).join('\n')}

ESTRATEGIAS POR FUNNEL:
${Object.entries(normalized.strategies || {}).map(([key, value]: [string, any]) => 
  `• ${key.toUpperCase()}: ${value.objective}`).join('\n')}

PLAN DE CONTENIDO:
${Object.entries(normalized.content_plan || {}).map(([platform, config]: [string, any]) => 
  `• ${platform}: ${config.frequency} - ${config.tone}`).join('\n')}` 
        : JSON.stringify(normalized, null, 2);

      setEditedStrategy(strategyText);
      
      console.log('✅ Strategy state updated successfully, strategy keys:', Object.keys(normalized));
      
      toast({
        title: "¡Estrategia generada!",
        description: "Tu estrategia de marketing personalizada está lista",
      });
    } catch (error: any) {
      console.error('💥 Error generating strategy:', error);
      setStrategy(null); // Reset strategy on error

      let description = error?.message || 'No se pudo generar la estrategia. Por favor, intenta de nuevo.';
      if (error?.name === 'AbortError') {
        description = 'Tiempo de espera agotado al contactar el webhook (30s). Intenta nuevamente.';
      } else if (typeof error?.message === 'string' && error.message.includes('Failed to fetch')) {
        description = 'No se pudo conectar con el webhook. Verifica que el endpoint permita CORS y esté disponible.';
      }

      toast({
        title: 'Error al generar estrategia',
        description,
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 Strategy generation finished, setting generating=false');
      setGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!strategy) {
      toast({
        title: "Estrategia requerida",
        description: "Primero debes generar la estrategia de marketing",
        variant: "destructive"
      });
      return;
    }

    const strategyData = {
      strategy: strategy,
      competitors: strategy.competitors || [],
      content_plan: strategy.content_plan || {},
      editorial_calendar: strategy.editorial_calendar || [],
      kpis: strategy.kpis_goals || [],
      execution_plan: strategy.execution_plan || {},
      message_differentiator: {
        core: strategy.core_message || '',
        linkedin_variation: strategy.message_variants?.LinkedIn || '',
        instagram_variation: strategy.message_variants?.Instagram || '',
        tiktok_variation: strategy.message_variants?.TikTok || ''
      },
      funnel_strategies: strategy.strategies || {},
      edited_strategy: isEditing ? editedStrategy : undefined,
      final_strategy: isEditing ? editedStrategy : strategy
    };

    onComplete(strategyData);
  };

  const canProceed = strategy && !generating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-purple-800">
            <BarChart3 className="h-6 w-6" />
            Estrategia de Marketing Personalizada
          </CardTitle>
          <p className="text-purple-600">
            Genera una estrategia basada en tu audiencia y objetivos, personalízala según tus necesidades
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumen de tu Campaña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">OBJETIVO</h4>
              <p className="text-sm">{campaignData.objective?.goal || 'No definido'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">EMPRESA</h4>
              <p className="text-sm">{campaignData.company?.nombre_empresa || 'No definido'}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">AUDIENCIAS SELECCIONADAS</h4>
              <div className="flex flex-wrap gap-2">
                {campaignData.audience?.buyer_personas?.length > 0 ? (
                  campaignData.audience.buyer_personas.slice(0, 3).map((persona: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {persona.nombre_ficticio}
                    </Badge>
                  ))
                ) : campaignData.audience?.selected_audiences?.length > 0 ? (
                  campaignData.audience.selected_audiences.slice(0, 3).map((audience: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {audience.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Ninguna audiencia seleccionada</span>
                )}
                {(campaignData.audience?.buyer_personas?.length > 3 || campaignData.audience?.selected_audiences?.length > 3) && (
                  <Badge variant="secondary">
                    +{(campaignData.audience?.buyer_personas?.length || campaignData.audience?.selected_audiences?.length || 0) - 3} más
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Strategy or Loading */}
      {!strategy && !generating && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Genera tu Estrategia con IA</h3>
              <p className="text-muted-foreground">
                Basándose en tu audiencia objetivo y objetivos, crearemos una estrategia de marketing personalizada y efectiva.
              </p>
              <Button 
                onClick={generateStrategy}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Generar Estrategia con IA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {generating && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-blue-900">Generando tu Estrategia...</h3>
                <p className="text-blue-700 text-lg">
                  Nuestro algoritmo está analizando tu audiencia y creando una estrategia personalizada
                </p>
              </div>
              <div className="bg-white/50 backdrop-blur p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-blue-600 font-medium ml-3">Esto puede tomar unos segundos...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Strategy */}
      {strategy && (
        <div className="space-y-6">
          {/* Strategy Success Header */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">
                ¡Tu Estrategia está Lista! 🚀
              </CardTitle>
              <p className="text-green-600 text-lg">
                Hemos creado una estrategia de marketing personalizada basada en tu audiencia y objetivos
              </p>
            </CardHeader>
          </Card>

          {/* Message Differentiator */}
          {strategy.core_message && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  Mensaje Diferenciador Principal
                </CardTitle>
                <p className="text-muted-foreground">Tu propuesta única de valor para cada plataforma</p>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="bg-white/50 backdrop-blur p-6 rounded-xl border">
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      "{strategy.core_message}"
                    </h3>
                    <p className="text-muted-foreground">Mensaje central de tu estrategia</p>
                  </div>
                </div>
                
                {strategy.message_variants && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(strategy.message_variants).map(([platform, message]: [string, any]) => {
                      const platformColors = {
                        LinkedIn: 'border-blue-100 bg-blue-50',
                        Instagram: 'border-pink-100 bg-pink-50',
                        TikTok: 'border-purple-100 bg-purple-50'
                      };
                      
                      const platformIcons = {
                        LinkedIn: 'Li',
                        Instagram: 'Ig', 
                        TikTok: 'Tk'
                      };
                      
                      const platformIconColors = {
                        LinkedIn: 'bg-blue-100 text-blue-600',
                        Instagram: 'bg-pink-100 text-pink-600',
                        TikTok: 'bg-purple-100 text-purple-600'
                      };
                      
                      const platformTextColors = {
                        LinkedIn: 'text-blue-900',
                        Instagram: 'text-pink-900',
                        TikTok: 'text-purple-900'
                      };
                      
                      const platformMessageColors = {
                        LinkedIn: 'text-blue-700',
                        Instagram: 'text-pink-700',
                        TikTok: 'text-purple-700'
                      };
                      
                      return (
                        <div key={platform} className={`bg-white/70 p-6 rounded-xl border-2 ${platformColors[platform as keyof typeof platformColors] || 'border-gray-100 bg-gray-50'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${platformIconColors[platform as keyof typeof platformIconColors] || 'bg-gray-100 text-gray-600'}`}>
                              <span className="font-bold text-sm">{platformIcons[platform as keyof typeof platformIcons] || platform.charAt(0)}</span>
                            </div>
                            <h4 className={`font-semibold ${platformTextColors[platform as keyof typeof platformTextColors] || 'text-gray-900'}`}>{platform}</h4>
                          </div>
                          <p className={`text-sm leading-relaxed ${platformMessageColors[platform as keyof typeof platformMessageColors] || 'text-gray-700'}`}>
                            {message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Funnel Strategies */}
          {strategy.strategies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  Estrategias por Etapa del Funnel
                </CardTitle>
                <p className="text-muted-foreground">Plan de acción para cada fase del customer journey</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {Object.entries(strategy.strategies).map(([phase, details]: [string, any], index) => {
                    const phaseColors = {
                      awareness: 'from-yellow-400 to-orange-500',
                      consideration: 'from-blue-400 to-cyan-500', 
                      conversion: 'from-green-400 to-emerald-500',
                      loyalty: 'from-purple-400 to-pink-500'
                    };
                    const phaseNames = {
                      awareness: 'Reconocimiento',
                      consideration: 'Consideración',
                      conversion: 'Conversión',
                      loyalty: 'Fidelización'
                    };
                    
                    return (
                      <div key={phase} className="relative">
                        <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 bg-gradient-to-r ${phaseColors[phase as keyof typeof phaseColors] || 'from-gray-400 to-gray-500'} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-xl font-bold capitalize">
                                  {phaseNames[phase as keyof typeof phaseNames] || phase}
                                </h4>
                                <Badge variant="secondary" className="mt-1">
                                  {details.timeline}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <p className="text-gray-700 font-medium">{details.objective}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="font-semibold text-sm text-primary mb-2">Canal Principal</h5>
                              <p className="text-sm bg-primary/10 px-3 py-2 rounded-lg">{details.main_channel}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold text-sm text-green-600 mb-2">KPI Objetivo</h5>
                              <p className="text-sm bg-green-50 px-3 py-2 rounded-lg">{details.main_kpi}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold text-sm mb-3">Tácticas Específicas:</h5>
                            <div className="grid gap-2">
                              {details.tactics?.map((tactic: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                  <p className="text-sm text-gray-700">{tactic}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Plan */}
          {strategy.content_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  Plan de Contenido por Plataforma
                </CardTitle>
                <p className="text-muted-foreground">Estrategia específica para cada red social</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(strategy.content_plan).map(([platform, config]: [string, any]) => {
                    const platformColors = {
                      LinkedIn: 'border-blue-200 bg-blue-50',
                      Instagram: 'border-pink-200 bg-pink-50', 
                      TikTok: 'border-purple-200 bg-purple-50',
                      Email: 'border-green-200 bg-green-50',
                      Web: 'border-orange-200 bg-orange-50'
                    };
                    
                    const platformIcons = {
                      LinkedIn: '💼',
                      Instagram: '📸',
                      TikTok: '🎵',
                      Email: '📧',
                      Web: '🌐'
                    };
                    
                    return (
                      <div key={platform} className={`rounded-xl border-2 p-6 ${platformColors[platform as keyof typeof platformColors] || 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{platformIcons[platform as keyof typeof platformIcons] || '📱'}</span>
                          <h4 className="text-xl font-bold capitalize">{platform}</h4>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Frecuencia</h5>
                            <p className="font-semibold">{config.frequency}</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Tono de Comunicación</h5>
                            <p className="font-semibold">{config.tone}</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Call to Action</h5>
                            <p className="font-semibold text-primary">"{config.cta}"</p>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-2">Formatos de Contenido</h5>
                            <div className="flex flex-wrap gap-2">
                              {config.formats?.map((format: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="bg-white/70 p-3 rounded-lg">
                            <h5 className="font-medium text-sm text-gray-600 mb-1">Justificación</h5>
                            <p className="text-xs text-gray-600 leading-relaxed">{config.justification}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {strategy.kpis_goals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  KPIs y Objetivos Medibles
                </CardTitle>
                <p className="text-muted-foreground">Métricas clave para medir el éxito de tu campaña</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {strategy.kpis_goals.map((goal: any, idx: number) => {
                    const kpiIcons = {
                      'Alcance': '🎯',
                      'Impresiones': '👀', 
                      'CTR': '🖱️',
                      'Leads': '🚀',
                      'Conversion Rate': '💰',
                      'CAC estimado': '💵'
                    };
                    
                    return (
                      <div key={idx} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 p-6 rounded-xl hover:shadow-lg transition-all">
                        <div className="text-center">
                          <div className="text-3xl mb-3">
                            {kpiIcons[goal.kpi as keyof typeof kpiIcons] || '📊'}
                          </div>
                          <h4 className="font-bold text-lg mb-2 text-gray-800">{goal.kpi}</h4>
                          <div className="bg-primary/10 px-4 py-3 rounded-lg">
                            <p className="text-lg font-bold text-primary">{goal.goal}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors Analysis */}
          {strategy.competitors && strategy.competitors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  Análisis de Competencia
                </CardTitle>
                <p className="text-muted-foreground">Conoce a tu competencia y sus estrategias digitales</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {strategy.competitors.map((competitor: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">{competitor.name}</h4>
                            <a href={competitor.url} target="_blank" rel="noopener noreferrer" 
                               className="text-primary text-sm hover:underline flex items-center gap-1">
                              <span>🌐</span>
                              {competitor.url}
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h5 className="font-semibold text-sm text-gray-600 mb-2">Tácticas Digitales</h5>
                        <p className="text-sm text-gray-700">{competitor.digital_tactics_summary}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">✅</span>
                            <h5 className="font-semibold text-green-800">Fortalezas</h5>
                          </div>
                          <p className="text-sm text-green-700">{competitor.strengths}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-600">⚠️</span>
                            <h5 className="font-semibold text-red-800">Debilidades</h5>
                          </div>
                          <p className="text-sm text-red-700">{competitor.weaknesses}</p>
                        </div>
                      </div>
                      
                      {competitor.benchmarks && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <h5 className="font-semibold text-blue-800 mb-3">📊 Benchmarks de Redes Sociales</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(competitor.benchmarks)
                              .filter(([platform]) => platform !== 'sources')
                              .map(([platform, data]: [string, any]) => (
                                <div key={`${competitor.name}-${platform}`} className="bg-white p-3 rounded-lg border">
                                  <h6 className="font-medium text-sm text-gray-700 capitalize">{platform}</h6>
                                  <p className="text-xs text-gray-600">
                                    {typeof data === 'string' ? data : data?.frequency || 'No disponible'}
                                  </p>
                                  {data?.engagement_rate && (
                                    <p className="text-xs text-blue-600 font-medium">
                                      Engagement: {data.engagement_rate}
                                    </p>
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
          {loading ? 'Guardando...' : 'Continuar con Calendario de Contenido'}
        </Button>
      </div>
    </div>
  );
};