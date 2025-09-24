import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  Loader2
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

const timeframes = [
  { value: '1-month', label: '1 Mes' },
  { value: '3-months', label: '3 Meses' },
  { value: '6-months', label: '6 Meses' },
  { value: '1-year', label: '1 Año' }
];

export const CampaignObjective = ({ campaignData, onComplete, loading, companyData }: CampaignObjectiveProps) => {
  const [selectedObjective, setSelectedObjective] = useState(campaignData.objective?.type || '');
  const [campaignName, setCampaignName] = useState(campaignData.objective?.name || '');
  const [description, setDescription] = useState(campaignData.objective?.description || '');
  const [timeline, setTimeline] = useState(campaignData.objective?.timeline || '');
  const [budget, setBudget] = useState(campaignData.objective?.budget || '');
  const [targetMetrics, setTargetMetrics] = useState(campaignData.objective?.target_metrics || {});
  const [companyObjectives, setCompanyObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(true);
  const { toast } = useToast();

  const selectedObjectiveData = objectiveTypes.find(obj => obj.id === selectedObjective);

  // Load company objectives
  useEffect(() => {
    const loadCompanyObjectives = async () => {
      if (!companyData?.id) return;

      try {
        const { data, error } = await supabase
          .from('company_objectives')
          .select('*')
          .eq('company_id', companyData.id)
          .eq('status', 'active')
          .order('priority', { ascending: true });

        if (error) throw error;
        
        setCompanyObjectives(data || []);
      } catch (error) {
        console.error('Error loading company objectives:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los objetivos de la empresa",
          variant: "destructive"
        });
      } finally {
        setLoadingObjectives(false);
      }
    };

    loadCompanyObjectives();
  }, [companyData?.id]);

  const handleMetricChange = (metric: string, value: string) => {
    setTargetMetrics(prev => ({
      ...prev,
      [metric]: parseInt(value) || 0
    }));
  };

  const handleSubmit = () => {
    if (!selectedObjective || !campaignName || !timeline) return;

    const objectiveData = {
      type: selectedObjective,
      name: campaignName,
      description,
      timeline,
      budget: budget ? parseFloat(budget) : undefined,
      target_metrics: targetMetrics,
      goal: `${selectedObjectiveData?.title}: ${campaignName}`
    };

    onComplete(objectiveData);
  };

  const canProceed = selectedObjective && campaignName.trim() && timeline;

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
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el propósito de esta campaña..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeline">Duración *</Label>
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Presupuesto (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="1000"
                className="mt-1"
              />
            </div>
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

      {/* Metrics Configuration */}
      {selectedObjectiveData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Metas Específicas
            </CardTitle>
            <p className="text-muted-foreground">
              Define objetivos numéricos para medir el éxito
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedObjectiveData.metrics.map((metric) => {
                const metricLabels = {
                  reach: 'Alcance',
                  impressions: 'Impresiones',
                  brand_mentions: 'Menciones de Marca',
                  likes: 'Me Gusta',
                  comments: 'Comentarios',
                  shares: 'Compartidos',
                  saves: 'Guardados',
                  form_submissions: 'Formularios Completados',
                  email_signups: 'Suscripciones Email',
                  downloads: 'Descargas',
                  conversions: 'Conversiones',
                  revenue: 'Ingresos ($)',
                  roi: 'ROI (%)',
                  website_clicks: 'Clicks al Sitio Web',
                  page_views: 'Vistas de Página',
                  session_duration: 'Duración Sesión (min)'
                };

                return (
                  <div key={metric}>
                    <Label htmlFor={metric}>
                      {metricLabels[metric] || metric}
                    </Label>
                    <Input
                      id={metric}
                      type="number"
                      value={targetMetrics[metric] || ''}
                      onChange={(e) => handleMetricChange(metric, e.target.value)}
                      placeholder="Meta numérica"
                      className="mt-1"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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