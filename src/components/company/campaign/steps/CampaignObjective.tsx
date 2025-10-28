import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  MessageSquare,
  Share2,
  ShoppingCart,
  Calendar,
  Sparkles,
  CheckCircle,
  Loader2,
  Wand2
} from 'lucide-react';

interface CampaignObjectiveProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
  companyData?: any;
}

const objectiveTypes = [
  {
    id: 'awareness',
    title: 'Conciencia de Marca',
    description: 'Aumentar el reconocimiento y visibilidad',
    icon: Eye,
    color: 'bg-blue-500',
    metrics: ['reach', 'impressions', 'brand_mentions']
  },
  {
    id: 'engagement',
    title: 'Engagement',
    description: 'Incrementar interacción y participación',
    icon: MessageSquare,
    color: 'bg-green-500',
    metrics: ['likes', 'comments', 'shares', 'saves']
  },
  {
    id: 'leads',
    title: 'Generación de Leads',
    description: 'Capturar contactos potenciales',
    icon: Users,
    color: 'bg-purple-500',
    metrics: ['form_submissions', 'email_signups', 'downloads']
  },
  {
    id: 'sales',
    title: 'Ventas',
    description: 'Convertir en clientes pagos',
    icon: ShoppingCart,
    color: 'bg-red-500',
    metrics: ['conversions', 'revenue', 'roi']
  },
  {
    id: 'traffic',
    title: 'Tráfico Web',
    description: 'Dirigir visitantes al sitio web',
    icon: TrendingUp,
    color: 'bg-orange-500',
    metrics: ['website_clicks', 'page_views', 'session_duration']
  }
];


export const CampaignObjective = ({ campaignData, onComplete, loading, companyData }: CampaignObjectiveProps) => {
  const [selectedObjective, setSelectedObjective] = useState(campaignData.objective?.type || '');
  const [campaignName, setCampaignName] = useState(campaignData.objective?.name || '');
  const [description, setDescription] = useState(campaignData.objective?.description || '');
  const [targetMetrics, setTargetMetrics] = useState(campaignData.objective?.target_metrics || {});
  const [optimizing, setOptimizing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('campaigns');

  // Use unified hook for company data
  const { data: companyDataResult, isLoading: loadingObjectives, error: dataError, refetch } = useCompanyData(companyData?.id);
  const companyObjectives = companyDataResult?.objectives || [];

  const selectedObjectiveData = objectiveTypes.find(obj => obj.id === selectedObjective);

  // Exponer los datos del paso actual para que el Wizard pueda "Guardar y Avanzar"
  useEffect(() => {
    (window as any).getCurrentCampaignStepData = () => {
      if (!selectedObjective || !campaignName?.trim()) return null;

      return {
        type: selectedObjective,
        name: campaignName,
        description,
        target_metrics: targetMetrics,
        company_objective: targetMetrics.companyObjective || null,
        selected_objective_id: targetMetrics.selectedObjective || null,
        goal: `${selectedObjectiveData?.title}: ${campaignName}`
      };
    };

    return () => {
      delete (window as any).getCurrentCampaignStepData;
    };
  }, [selectedObjective, campaignName, description, targetMetrics, selectedObjectiveData]);

  const handleMetricChange = (metric: string, value: string) => {
    setTargetMetrics(prev => ({
      ...prev,
      [metric]: parseInt(value) || 0
    }));
  };

  const handleSubmit = () => {
    if (!selectedObjective || !campaignName) return;

    const objectiveData = {
      type: selectedObjective,
      name: campaignName,
      description,
      target_metrics: targetMetrics,
      company_objective: targetMetrics.companyObjective || null,
      selected_objective_id: targetMetrics.selectedObjective || null,
      goal: `${selectedObjectiveData?.title}: ${campaignName}`
    };

    onComplete(objectiveData);
  };

  const handleOptimizeDescription = async () => {
    if (!campaignName) {
      toast({
        title: "Información faltante",
        description: "Por favor, ingresa el nombre de la campaña primero",
        variant: "destructive"
      });
      return;
    }

    setOptimizing(true);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('era-campaign-optimizer', {
        body: { 
          description: description || "Sin descripción",
          campaignName,
          objectiveType: selectedObjectiveData?.title || "General",
          companyName: companyData?.name || "",
          industry: companyData?.industry_sector || ""
        }
      });

      if (functionError) {
        console.error('Error optimizando descripción:', functionError);
        throw functionError;
      }

      if (functionData?.optimizedDescription) {
        setDescription(functionData.optimizedDescription);
        toast({
          title: "✨ Descripción optimizada",
          description: "ERA ha mejorado la descripción de tu campaña",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo optimizar la descripción. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setOptimizing(false);
    }
  };

  const canProceed = selectedObjective && campaignName.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <Target className="h-6 w-6" />
            Define el Objetivo de tu Campaña
          </CardTitle>
          <p className="text-blue-600">
            Establece metas claras y medibles para tu campaña de marketing
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Nombre de la Campaña *</Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Ej: Lanzamiento Producto Q1 2024"
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="description">Descripción</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleOptimizeDescription}
                disabled={optimizing || !campaignName}
                className="h-8 text-xs gap-1"
              >
                {optimizing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Optimizando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    Optimizar con ERA
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el propósito de esta campaña..."
              className="mt-1"
              rows={3}
              disabled={optimizing}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa "Optimizar con ERA" para mejorar automáticamente tu descripción
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Objective Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Tipo de Objetivo *
          </CardTitle>
          <p className="text-muted-foreground">
            Selecciona el objetivo principal que quieres lograr
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectiveTypes.map((objective) => {
              const IconComponent = objective.icon;
              const isSelected = selectedObjective === objective.id;
              
              return (
                <div
                  key={objective.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                    isSelected 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedObjective(objective.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${objective.color} text-white`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{objective.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {objective.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge className="mt-2 bg-primary/20 text-primary">
                      Seleccionado
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Company Growth Objectives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Objetivo de Crecimiento de la Empresa
          </CardTitle>
          <p className="text-muted-foreground">
            Selecciona el objetivo estratégico principal que esta campaña ayudará a alcanzar
          </p>
        </CardHeader>
        <CardContent>
          {loadingObjectives ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">{t('wizard.loading.objectives', 'Cargando objetivos...')}</span>
            </div>
          ) : dataError ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-2">
                {t('wizard.errors.loadingObjectives', 'Error al cargar los objetivos')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {dataError.message}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                {t('wizard.actions.retry', 'Reintentar')}
              </Button>
            </div>
          ) : companyObjectives.length > 0 ? (
            <div className="space-y-4">
              {companyObjectives.map((objective: any) => {
                const isSelected = targetMetrics.selectedObjective === objective.id;
                
                return (
                  <div
                    key={objective.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setTargetMetrics(prev => ({
                        ...prev,
                        selectedObjective: isSelected ? null : objective.id,
                        companyObjective: isSelected ? null : objective
                      }));
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base text-foreground mb-2">
                          {objective.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {objective.description}
                        </p>
                        
                        {objective.metrics && objective.metrics.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-foreground">Métricas clave:</h4>
                            <div className="flex flex-wrap gap-2">
                              {objective.metrics.map((metric: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {metric.name}: {metric.target_value} {metric.unit}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {objective.deadline && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Fecha límite: {new Date(objective.deadline).toLocaleDateString('es-ES')}
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 ml-4" />
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <Badge 
                        variant={objective.priority === 1 ? 'destructive' : 
                               objective.priority === 2 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        Prioridad {objective.priority === 1 ? 'Alta' : 
                                  objective.priority === 2 ? 'Media' : 'Baja'}
                      </Badge>
                      
                      <div className="text-xs text-muted-foreground">
                        Progreso: {objective.progress || 0}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                {t('wizard.empty.objectives', 'No hay objetivos de crecimiento definidos para tu empresa')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('wizard.empty.objectivesHint', 'Ve a la sección de estrategia empresarial para definir tus objetivos')}
              </p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                {t('wizard.actions.refresh', 'Actualizar')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!canProceed || loading}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 px-8"
          size="lg"
        >
          {loading ? 'Guardando...' : 'Continuar con Audiencia Objetivo'}
        </Button>
      </div>
    </div>
  );
};