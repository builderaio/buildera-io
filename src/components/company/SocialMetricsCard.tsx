import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

interface SocialMetric {
  platform: string;
  metric_type: string;
  value: number;
  period_start: string;
  period_end: string;
  metadata?: any;
}

interface SocialMetricsCardProps {
  metrics: SocialMetric[];
  platform?: string;
}

export default function SocialMetricsCard({ metrics, platform }: SocialMetricsCardProps) {
  const getPlatformMetrics = (platform: string) => {
    return metrics.filter(m => m.platform === platform);
  };

  const getMetricDisplay = (metricType: string) => {
    switch (metricType) {
      case 'total_posts':
        return { label: 'Posts Totales', icon: BarChart3 };
      case 'total_likes':
        return { label: 'Likes Totales', icon: TrendingUp };
      case 'total_comments':
        return { label: 'Comentarios', icon: Activity };
      case 'total_shares':
        return { label: 'Compartidos', icon: TrendingUp };
      case 'total_views':
        return { label: 'Visualizaciones', icon: Activity };
      case 'avg_engagement_rate':
        return { label: 'Engagement Rate', icon: TrendingUp, isPercentage: true };
      default:
        return { label: metricType.replace('_', ' '), icon: Activity };
    }
  };

  const formatValue = (value: number, isPercentage?: boolean) => {
    if (isPercentage) {
      return `${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  const platformMetrics = platform ? getPlatformMetrics(platform) : metrics;
  const groupedMetrics = platformMetrics.reduce((acc, metric) => {
    if (!acc[metric.platform]) {
      acc[metric.platform] = [];
    }
    acc[metric.platform].push(metric);
    return acc;
  }, {} as Record<string, SocialMetric[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedMetrics).map(([platformName, platformMetrics]) => (
        <Card key={platformName}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="capitalize">{platformName}</span>
              <Badge variant="secondary">{platformMetrics.length} métricas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {platformMetrics.map((metric, index) => {
                const display = getMetricDisplay(metric.metric_type);
                const Icon = display.icon;
                
                return (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{display.label}</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatValue(metric.value, display.isPercentage)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Últimos 30 días
                    </p>
                  </div>
                );
              })}
            </div>
            
            {platformMetrics[0]?.metadata && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                <p className="text-sm text-blue-700">
                  Datos del {new Date(platformMetrics[0].period_start).toLocaleDateString()} 
                  al {new Date(platformMetrics[0].period_end).toLocaleDateString()}
                </p>
                {platformMetrics[0].metadata.total_followers && (
                  <p className="text-xs text-blue-600 mt-1">
                    Seguidores: {platformMetrics[0].metadata.total_followers.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {Object.keys(groupedMetrics).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Métricas Disponibles</h3>
            <p className="text-muted-foreground">
              Ejecuta un análisis para generar métricas de rendimiento de tus redes sociales.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}