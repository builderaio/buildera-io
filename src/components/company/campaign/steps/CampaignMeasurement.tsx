import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Target
} from 'lucide-react';

interface CampaignMeasurementProps {
  campaignData: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

const mockMetrics = {
  reach: { value: 12500, target: 15000, growth: 15.2 },
  impressions: { value: 45600, target: 50000, growth: 22.1 },
  engagement_rate: { value: 4.8, target: 5.0, growth: 8.3 },
  clicks: { value: 856, target: 1000, growth: 12.7 },
  conversions: { value: 23, target: 30, growth: 18.5 },
  cost_per_click: { value: 0.85, target: 1.00, growth: -12.3 }
};

const platformMetrics = {
  linkedin: { posts: 8, engagement: 5.2, reach: 4800, clicks: 342 },
  instagram: { posts: 12, engagement: 4.1, reach: 6200, clicks: 298 },
  facebook: { posts: 6, engagement: 3.8, reach: 2800, clicks: 156 },
  tiktok: { posts: 4, engagement: 7.9, reach: 3200, clicks: 89 }
};

export const CampaignMeasurement = ({ campaignData, onComplete, loading }: CampaignMeasurementProps) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  
  const handleComplete = () => {
    const measurementData = {
      metrics: mockMetrics,
      platform_metrics: platformMetrics,
      timeframe: selectedTimeframe,
      campaign_status: 'active',
      recommendations: [
        "Incrementar frecuencia de publicación en LinkedIn",
        "Optimizar horarios de publicación para mayor alcance",
        "Crear más contenido visual para Instagram",
        "Realizar A/B testing en copy de Facebook"
      ]
    };

    onComplete(measurementData);
  };

  const getMetricProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalScheduled = campaignData.schedule?.total_scheduled || 0;
  const campaignDuration = campaignData.schedule?.campaign_duration || 7;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-teal-800">
            <BarChart3 className="h-6 w-6" />
            Medición y Análisis de Campaña
          </CardTitle>
          <p className="text-teal-600">
            Monitorea el rendimiento en tiempo real y optimiza tu estrategia
          </p>
        </CardHeader>
      </Card>

      {/* Campaign Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Resumen de la Campaña
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
              <p className="text-2xl font-bold text-green-600">{totalScheduled}</p>
              <p className="text-sm text-green-600">Posts programados</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{campaignData.calendar?.selected_platforms?.length || 0}</p>
              <p className="text-sm text-purple-600">Plataformas activas</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">Activa</p>
              <p className="text-sm text-orange-600">Estado campaña</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Métricas Clave vs Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(mockMetrics).map(([key, metric]) => {
              const progress = getMetricProgress(metric.value, metric.target);
              const isPositiveGrowth = metric.growth > 0;
              
              const metricLabels = {
                reach: { label: 'Alcance', icon: Eye, format: (v) => v.toLocaleString() },
                impressions: { label: 'Impresiones', icon: Eye, format: (v) => v.toLocaleString() },
                engagement_rate: { label: 'Tasa de Engagement', icon: Heart, format: (v) => `${v}%` },
                clicks: { label: 'Clicks', icon: MessageSquare, format: (v) => v.toLocaleString() },
                conversions: { label: 'Conversiones', icon: Target, format: (v) => v.toString() },
                cost_per_click: { label: 'CPC', icon: DollarSign, format: (v) => `$${v}` }
              };
              
              const config = metricLabels[key];
              if (!config) return null;
              
              const IconComponent = config.icon;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <span className="font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {config.format(metric.value)} / {config.format(metric.target)}
                      </span>
                      <Badge 
                        variant={isPositiveGrowth ? "default" : "secondary"}
                        className={isPositiveGrowth ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {isPositiveGrowth ? '+' : ''}{metric.growth.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="flex-1 h-2" />
                    <span className={`text-sm font-medium ${getProgressColor(progress)}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Rendimiento por Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(platformMetrics).map(([platform, metrics]) => {
              const platformLabels = {
                linkedin: { name: 'LinkedIn', color: 'bg-blue-700' },
                instagram: { name: 'Instagram', color: 'bg-pink-600' },
                facebook: { name: 'Facebook', color: 'bg-blue-600' },
                tiktok: { name: 'TikTok', color: 'bg-black' }
              };
              
              const config = platformLabels[platform];
              if (!config) return null;
              
              return (
                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${config.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {config.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium">{config.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {metrics.posts} posts publicados
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium">{metrics.engagement}%</p>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{metrics.reach.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Alcance</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{metrics.clicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Recomendaciones de Optimización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Incrementar frecuencia de publicación en LinkedIn para aprovechar el alto engagement",
              "Optimizar horarios de publicación basándose en cuando tu audiencia está más activa",
              "Crear más contenido visual para Instagram, ya que genera mejor rendimiento",
              "Realizar A/B testing en el copy de Facebook para mejorar tasa de clicks",
              "Considerar aumentar presupuesto en TikTok debido a su alta tasa de engagement"
            ].map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white border border-orange-200 rounded-lg">
                <div className="bg-orange-100 p-1 rounded-full mt-0.5">
                  <CheckCircle2 className="h-4 w-4 text-orange-600" />
                </div>
                <p className="text-sm text-orange-800">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Complete Campaign */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="py-8 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-800">
              ¡Campaña Configurada Exitosamente!
            </h3>
            <p className="text-green-700">
              Tu campaña inteligente está activa y funcionando. Podrás monitorear 
              el rendimiento en tiempo real desde tu dashboard.
            </p>
            <Button 
              onClick={handleComplete}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {loading ? 'Finalizando...' : 'Finalizar Campaña'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};