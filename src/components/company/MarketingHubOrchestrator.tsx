import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMarketingDataPersistence } from '@/hooks/useMarketingDataPersistence';
import { supabase } from '@/integrations/supabase/client';
import { Target, TrendingUp, Calendar, PenTool, Image, Video, Play, CheckCircle } from 'lucide-react';

interface CompanyData {
  nombre_empresa: string;
  pais: string;
  objetivo_de_negocio: string;
  propuesta_de_valor: string;
  redes_socciales_activas: Array<{
    red: string;
    url: string;
    diagnostico: string;
  }>;
  url_sitio_web: string;
}

interface WorkflowState {
  targetAudience: boolean;
  marketingStrategy: boolean;
  contentCalendar: boolean;
  campaignId?: string;
  strategyId?: string;
}

export default function MarketingHubOrchestrator() {
  const [companyData, setCompanyData] = useState<CompanyData>({
    nombre_empresa: '',
    pais: '',
    objetivo_de_negocio: '',
    propuesta_de_valor: '',
    redes_socciales_activas: [{ red: '', url: '', diagnostico: '' }],
    url_sitio_web: ''
  });

  const [workflow, setWorkflow] = useState<WorkflowState>({
    targetAudience: false,
    marketingStrategy: false,
    contentCalendar: false,
    campaignId: undefined,
    strategyId: undefined
  });

  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('setup');
  const { toast } = useToast();
  const { 
    storeTargetAudienceData, 
    storeMarketingStrategyData, 
    storeContentCalendarData,
    isProcessing 
  } = useMarketingDataPersistence();

  const callMarketingFunction = async (functionName: string, input: any) => {
    const credentials = btoa(`${process.env.N8N_AUTH_USER || ''}:${process.env.N8N_AUTH_PASS || ''}`);
    
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { input },
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (error) throw error;
    return data;
  };

  const handleTargetAudience = async () => {
    if (!companyData.nombre_empresa || !companyData.pais || !companyData.objetivo_de_negocio || !companyData.propuesta_de_valor) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive"
      });
      return;
    }

    setLoading('target-audience');
    try {
      const response = await callMarketingFunction('marketing-hub-target-audience', companyData);
      
      toast({
        title: "Análisis iniciado",
        description: response.message,
      });

      // Store the audience data in database
      const campaignId = await storeTargetAudienceData(response, {
        nombre_empresa: companyData.nombre_empresa,
        objetivo_de_negocio: companyData.objetivo_de_negocio
      });

      setWorkflow(prev => ({ 
        ...prev, 
        targetAudience: true,
        campaignId 
      }));
      setActiveTab('strategy');
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al procesar audiencia objetivo: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleMarketingStrategy = async () => {
    if (!workflow.targetAudience || !workflow.campaignId) {
      toast({
        title: "Flujo incorrecto",
        description: "Primero debes definir la audiencia objetivo.",
        variant: "destructive"
      });
      return;
    }

    setLoading('marketing-strategy');
    try {
      const strategyInput = {
        ...companyData,
        audiencia_objetivo: {
          buyer_personas: [
            { nombre_ficticio: "Persona definida por análisis previo", plataformas_prioritarias: ["LinkedIn"] }
          ]
        }
      };

      const response = await callMarketingFunction('marketing-hub-marketing-strategy', strategyInput);
      
      toast({
        title: "Estrategia en proceso",
        description: response.message,
      });

      // Store the strategy data in database
      const strategyId = await storeMarketingStrategyData(response, workflow.campaignId);

      setWorkflow(prev => ({ 
        ...prev, 
        marketingStrategy: true,
        strategyId 
      }));
      setActiveTab('calendar');
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al generar estrategia: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleContentCalendar = async () => {
    if (!workflow.marketingStrategy || !workflow.strategyId) {
      toast({
        title: "Flujo incorrecto",
        description: "Primero debes generar la estrategia de marketing.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date().toISOString().split('T')[0];
    const days = 7;

    setLoading('content-calendar');
    try {
      const calendarInput = {
        ...companyData,
        fecha_inicio_calendario: startDate,
        numero_dias_generar: days,
        audiencia_objetivo: { buyer_personas: [] },
        estrategia_de_marketing: { funnel_tactics: [] }
      };

      const response = await callMarketingFunction('marketing-hub-content-calendar', calendarInput);
      
      toast({
        title: "Calendario generándose",
        description: response.message,
      });

      // Store the calendar data in database
      await storeContentCalendarData(response, workflow.strategyId);

      setWorkflow(prev => ({ ...prev, contentCalendar: true }));
      setActiveTab('creative');
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al generar calendario: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCreativeFunction = async (functionName: string, title: string) => {
    if (!workflow.contentCalendar) {
      toast({
        title: "Flujo incorrecto",
        description: "Primero debes generar el calendario de contenido.",
        variant: "destructive"
      });
      return;
    }

    setLoading(functionName);
    try {
      const creativeInput = functionName === 'marketing-hub-post-creator' ? {
        tono_de_la_marca: "Experto, innovador y eficiente",
        buyer_persona_objetivo: {
          nombre_ficticio: "Usuario objetivo",
          puntos_de_dolor: ["Ejemplo de dolor"]
        },
        calendario_item: {
          fecha: new Date().toISOString().split('T')[0],
          red_social: "LinkedIn",
          tipo_contenido: "Post",
          tema_concepto: "Contenido de ejemplo"
        }
      } : {
        identidad_visual: {
          paleta_de_colores: { primario: "#0D0D2B", acento: "#3D52D5" },
          estilo_imagenes: "Diseño moderno y profesional"
        },
        calendario_item: {
          red_social: "LinkedIn",
          tema_concepto: "Contenido visual",
          descripcion_creativo: "Diseño atractivo"
        }
      };

      const response = await callMarketingFunction(functionName, creativeInput);
      
      toast({
        title: `${title} iniciado`,
        description: response.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ejecutar ${title.toLowerCase()}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Marketing Hub Orchestrator</h2>
          <p className="text-muted-foreground">Sistema inteligente de orquestación de campañas de marketing</p>
        </div>
        <div className="flex gap-2">
          {workflow.targetAudience && <Badge variant="secondary"><CheckCircle className="w-4 h-4 mr-1" />Audiencia</Badge>}
          {workflow.marketingStrategy && <Badge variant="secondary"><CheckCircle className="w-4 h-4 mr-1" />Estrategia</Badge>}
          {workflow.contentCalendar && <Badge variant="secondary"><CheckCircle className="w-4 h-4 mr-1" />Calendario</Badge>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Configuración</TabsTrigger>
          <TabsTrigger value="strategy" disabled={!workflow.targetAudience}>Estrategia</TabsTrigger>
          <TabsTrigger value="calendar" disabled={!workflow.marketingStrategy}>Calendario</TabsTrigger>
          <TabsTrigger value="creative" disabled={!workflow.contentCalendar}>Creativos</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Datos de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="empresa">Nombre de la Empresa</Label>
                  <Input
                    id="empresa"
                    value={companyData.nombre_empresa}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, nombre_empresa: e.target.value }))}
                    placeholder="Ej: Nébula Tech"
                  />
                </div>
                <div>
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={companyData.pais}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, pais: e.target.value }))}
                    placeholder="Ej: México"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="objetivo">Objetivo de Negocio</Label>
                <Textarea
                  id="objetivo"
                  value={companyData.objetivo_de_negocio}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, objetivo_de_negocio: e.target.value }))}
                  placeholder="Ej: Lograr 200 clientes de pago para nuestro nuevo software SaaS"
                />
              </div>

              <div>
                <Label htmlFor="propuesta">Propuesta de Valor</Label>
                <Textarea
                  id="propuesta"
                  value={companyData.propuesta_de_valor}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, propuesta_de_valor: e.target.value }))}
                  placeholder="Ej: Plataforma de gestión de proyectos con IA que predice cuellos de botella"
                />
              </div>

              <div>
                <Label htmlFor="website">URL del Sitio Web</Label>
                <Input
                  id="website"
                  value={companyData.url_sitio_web}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, url_sitio_web: e.target.value }))}
                  placeholder="https://ejemplo.com"
                />
              </div>

              <Button 
                onClick={handleTargetAudience}
                disabled={loading === 'target-audience' || isProcessing}
                className="w-full"
              >
                {loading === 'target-audience' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analizando Audiencia...
                  </div>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Definir Audiencia Objetivo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Estrategia de Marketing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Genera una estrategia completa de marketing basada en el análisis de audiencia objetivo.
              </p>
              <Button 
                onClick={handleMarketingStrategy}
                disabled={loading === 'marketing-strategy' || isProcessing}
                className="w-full"
              >
                {loading === 'marketing-strategy' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando Estrategia...
                  </div>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Generar Estrategia de Marketing
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendario de Contenido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Crea un calendario detallado de contenido basado en tu estrategia de marketing.
              </p>
              <Button 
                onClick={handleContentCalendar}
                disabled={loading === 'content-calendar' || isProcessing}
                className="w-full"
              >
                {loading === 'content-calendar' ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando Calendario...
                  </div>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Generar Calendario de Contenido
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creative" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Crear Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Genera copy optimizado para un post específico del calendario.
                </p>
                <Button 
                  onClick={() => handleCreativeFunction('marketing-hub-post-creator', 'Creación de Post')}
                  disabled={loading === 'marketing-hub-post-creator'}
                  className="w-full"
                >
                  {loading === 'marketing-hub-post-creator' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </div>
                  ) : (
                    <>
                      <PenTool className="w-4 h-4 mr-2" />
                      Crear Post
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Crear Imagen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Genera assets visuales optimizados para el contenido.
                </p>
                <Button 
                  onClick={() => handleCreativeFunction('marketing-hub-image-creator', 'Creación de Imagen')}
                  disabled={loading === 'marketing-hub-image-creator'}
                  className="w-full"
                >
                  {loading === 'marketing-hub-image-creator' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </div>
                  ) : (
                    <>
                      <Image className="w-4 h-4 mr-2" />
                      Crear Imagen
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Crear Reel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Produce videos cortos optimizados para redes sociales.
                </p>
                <Button 
                  onClick={() => handleCreativeFunction('marketing-hub-reel-creator', 'Creación de Reel')}
                  disabled={loading === 'marketing-hub-reel-creator'}
                  className="w-full"
                >
                  {loading === 'marketing-hub-reel-creator' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </div>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Crear Reel
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}