import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Target, 
  MapPin, 
  Briefcase, 
  Heart, 
  DollarSign,
  Loader2,
  CheckCircle,
  TrendingUp,
  Brain
} from 'lucide-react';

interface TargetAudienceProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

export const TargetAudience = ({ campaignData, onComplete, loading }: TargetAudienceProps) => {
  const [companyData, setCompanyData] = useState({
    nombre_empresa: campaignData.company?.nombre_empresa || '',
    pais: campaignData.company?.pais || '',
    objetivo_de_negocio: campaignData.company?.objetivo_de_negocio || '',
    propuesta_de_valor: campaignData.company?.propuesta_de_valor || '',
    url_sitio_web: campaignData.company?.url_sitio_web || '',
  });

  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const analyzeTargetAudience = async () => {
    if (!companyData.nombre_empresa || !companyData.objetivo_de_negocio || !companyData.propuesta_de_valor) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa al menos el nombre, objetivo y propuesta de valor",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-hub-target-audience', {
        body: { 
          input: {
            ...companyData,
            redes_socciales_activas: []
          }
        }
      });

      if (error) throw error;

      setAiAnalysisResult(data);
      
      toast({
        title: "¡Análisis completado!",
        description: "Hemos identificado tu audiencia objetivo ideal",
      });
    } catch (error: any) {
      toast({
        title: "Error en el análisis",
        description: error.message || "No se pudo completar el análisis de audiencia",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleComplete = () => {
    if (!aiAnalysisResult) {
      toast({
        title: "Análisis requerido",
        description: "Primero debes ejecutar el análisis de audiencia objetivo",
        variant: "destructive"
      });
      return;
    }

    const audienceData = {
      company: companyData,
      analysis: aiAnalysisResult,
      buyer_personas: aiAnalysisResult?.buyer_personas || []
    };

    onComplete(audienceData);
  };

  const canAnalyze = companyData.nombre_empresa && companyData.objetivo_de_negocio && companyData.propuesta_de_valor;
  const canProceed = aiAnalysisResult && !analyzing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-800">
            <Users className="h-6 w-6" />
            Identifica tu Audiencia Objetivo
          </CardTitle>
          <p className="text-green-600">
            Nuestra IA analizará tu negocio para identificar el público perfecto
          </p>
        </CardHeader>
      </Card>

      {/* Company Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Información de tu Empresa
          </CardTitle>
          <p className="text-muted-foreground">
            Proporciona detalles sobre tu empresa para un análisis preciso
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa">Nombre de la Empresa *</Label>
              <Input
                id="empresa"
                value={companyData.nombre_empresa}
                onChange={(e) => handleInputChange('nombre_empresa', e.target.value)}
                placeholder="Ej: TechCorp Solutions"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input
                id="pais"
                value={companyData.pais}
                onChange={(e) => handleInputChange('pais', e.target.value)}
                placeholder="Ej: México"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="objetivo">Objetivo de Negocio *</Label>
            <Textarea
              id="objetivo"
              value={companyData.objetivo_de_negocio}
              onChange={(e) => handleInputChange('objetivo_de_negocio', e.target.value)}
              placeholder="Ej: Aumentar ventas de nuestro software SaaS en un 300% en 6 meses"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="propuesta">Propuesta de Valor *</Label>
            <Textarea
              id="propuesta"
              value={companyData.propuesta_de_valor}
              onChange={(e) => handleInputChange('propuesta_de_valor', e.target.value)}
              placeholder="Ej: Automatizamos procesos empresariales con IA, reduciendo costos en 40%"
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="website">URL del Sitio Web</Label>
            <Input
              id="website"
              value={companyData.url_sitio_web}
              onChange={(e) => handleInputChange('url_sitio_web', e.target.value)}
              placeholder="https://tuempresa.com"
              className="mt-1"
            />
          </div>

          <div className="pt-4">
            <Button 
              onClick={analyzeTargetAudience}
              disabled={!canAnalyze || analyzing || loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Analizar Audiencia con IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysisResult && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Análisis de Audiencia Completado
            </CardTitle>
            <p className="text-green-600">
              Hemos identificado tu audiencia objetivo ideal
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buyer Personas */}
            {aiAnalysisResult?.buyer_personas && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Buyer Personas Identificados
                </h3>
                <div className="grid gap-4">
                  {aiAnalysisResult.buyer_personas.slice(0, 3).map((persona: any, index: number) => (
                    <Card key={index} className="bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-primary">
                              {persona.nombre_ficticio}
                            </h4>
                            {persona.profesion && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {persona.profesion}
                              </p>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              {persona.puntos_de_dolor && persona.puntos_de_dolor.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    Puntos de Dolor
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {persona.puntos_de_dolor.slice(0, 3).map((dolor: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {dolor}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {persona.plataformas_prioritarias && persona.plataformas_prioritarias.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    Plataformas Prioritarias
                                  </h5>
                                  <div className="flex flex-wrap gap-1">
                                    {persona.plataformas_prioritarias.map((plataforma: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {plataforma}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Key insights */}
            {aiAnalysisResult?.insights && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Insights Clave</h3>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {typeof aiAnalysisResult.insights === 'string' 
                      ? aiAnalysisResult.insights 
                      : JSON.stringify(aiAnalysisResult.insights)}
                  </p>
                </div>
              </div>
            )}
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
          {loading ? 'Guardando...' : 'Continuar con Estrategia de Marketing'}
        </Button>
      </div>
    </div>
  );
};