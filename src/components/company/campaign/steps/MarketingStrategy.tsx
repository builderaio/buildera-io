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

  const generateStrategy = async () => {
    if (!campaignData.company || !campaignData.audience) {
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

      const { data, error } = await supabase.functions.invoke('marketing-hub-marketing-strategy', {
        body: { input: strategyInput }
      });

      if (error) throw error;

      console.log('Strategy data received:', data);
      
      // Procesar la respuesta de N8N correctamente
      let processedStrategy = data;
      if (Array.isArray(data) && data.length > 0 && data[0].output) {
        processedStrategy = data[0].output;
      }

      setStrategy(processedStrategy);
      
      // Crear un resumen editable de la estrategia
      const strategyText = processedStrategy.competitors?.[3]?.message_differentiator ? 
        `DIFERENCIADOR PRINCIPAL: ${processedStrategy.competitors[3].message_differentiator.core}

ESTRATEGIAS POR FUNNEL:
${Object.entries(processedStrategy.competitors[3].strategies || {}).map(([key, value]: [string, any]) => 
  `• ${key.toUpperCase()}: ${value.objective}`).join('\n')}

CANALES PRINCIPALES:
${Object.entries(processedStrategy.competitors[3].content_plan || {}).map(([platform, config]: [string, any]) => 
  `• ${platform}: ${config.frequency} - ${config.tone}`).join('\n')}` 
        : JSON.stringify(processedStrategy, null, 2);

      setEditedStrategy(strategyText);
      
      toast({
        title: "¡Estrategia generada!",
        description: "Tu estrategia de marketing personalizada está lista",
      });
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error al generar estrategia",
        description: error.message || "No se pudo generar la estrategia",
        variant: "destructive"
      });
    } finally {
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
      content_plan: strategy.competitors?.[3]?.content_plan || {},
      editorial_calendar: strategy.competitors?.[3]?.editorial_calendar || [],
      kpis: strategy.competitors?.[3]?.kpis || {},
      execution_plan: strategy.competitors?.[3]?.execution_plan || {},
      message_differentiator: strategy.competitors?.[3]?.message_differentiator || {},
      funnel_strategies: strategy.competitors?.[3]?.strategies || {},
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

      {/* Generate Strategy */}
      {!strategy && (
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
                disabled={generating || loading}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generando Estrategia...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Generar Estrategia con IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Strategy */}
      {strategy && (
        <div className="space-y-6">
          {/* Strategy Overview Card */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <CheckCircle className="h-5 w-5" />
                  Estrategia de Marketing Completa
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {isEditing ? 'Vista Previa' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div>
                  <Label htmlFor="strategy-edit">Personaliza tu Estrategia</Label>
                  <Textarea
                    id="strategy-edit"
                    value={editedStrategy}
                    onChange={(e) => setEditedStrategy(e.target.value)}
                    className="mt-2 min-h-[400px] font-mono text-sm"
                    placeholder="Edita tu estrategia aquí..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Personaliza la estrategia según tus necesidades específicas
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {editedStrategy}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Differentiator */}
          {strategy.competitors?.[3]?.message_differentiator && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Diferenciador Principal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">
                    {strategy.competitors[3].message_differentiator.core}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                      <p className="text-sm">{strategy.competitors[3].message_differentiator.linkedin_variation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Instagram</p>
                      <p className="text-sm">{strategy.competitors[3].message_differentiator.instagram_variation}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">TikTok</p>
                      <p className="text-sm">{strategy.competitors[3].message_differentiator.tiktok_variation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funnel Strategies */}
          {strategy.competitors?.[3]?.strategies && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Estrategias por Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(strategy.competitors[3].strategies).map(([phase, details]: [string, any]) => (
                    <div key={phase} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold capitalize text-lg">{phase}</h4>
                        <Badge variant="outline">{details.timeline}</Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{details.objective}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Canal Principal: {details.main_channel}</p>
                        <p className="text-sm font-medium">KPI: {details.kpi}</p>
                        <div>
                          <p className="text-sm font-medium mb-1">Tácticas:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            {details.tactics?.map((tactic: string, idx: number) => (
                              <li key={idx}>{tactic}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Plan */}
          {strategy.competitors?.[3]?.content_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Plan de Contenido por Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(strategy.competitors[3].content_plan).map(([platform, config]: [string, any]) => (
                    <div key={platform} className="border rounded-lg p-4">
                      <h4 className="font-semibold capitalize mb-3">{platform}</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Frecuencia:</span> {config.frequency}</p>
                        <p><span className="font-medium">Tono:</span> {config.tone}</p>
                        <p><span className="font-medium">CTA:</span> {config.cta}</p>
                        <div>
                          <p className="font-medium mb-1">Formatos:</p>
                          <div className="flex flex-wrap gap-1">
                            {config.formats?.map((format: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {format}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs">{config.justification}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          {strategy.competitors?.[3]?.kpis?.goals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  KPIs y Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strategy.competitors[3].kpis.goals.map((goal: any, idx: number) => (
                    <div key={idx} className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold">{goal.kpi}</h4>
                      <p className="text-lg font-bold text-primary">{goal.target}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitors Analysis */}
          {strategy.competitors && strategy.competitors.length > 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Análisis de Competencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {strategy.competitors.slice(0, 3).map((competitor: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{competitor.name}</h4>
                          <a href={competitor.url} target="_blank" rel="noopener noreferrer" 
                             className="text-primary text-sm hover:underline">
                            {competitor.url}
                          </a>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{competitor.digital_tactics}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-600">Fortalezas:</p>
                          <p className="text-sm">{competitor.strengths}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-600">Debilidades:</p>
                          <p className="text-sm">{competitor.weaknesses}</p>
                        </div>
                      </div>
                      {competitor.benchmarks && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Benchmarks:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(competitor.benchmarks).map(([platform, data]: [string, any]) => (
                              platform !== 'source' && (
                                <Badge key={platform} variant="outline" className="text-xs">
                                  {platform}: {data.frequency} - {data.engagement}
                                </Badge>
                              )
                            ))}
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