import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  Users,
  Clock,
  Target,
  RefreshCw
} from "lucide-react";

interface MarketingMetricsProps {
  profile: any;
  socialConnections: {
    linkedin: boolean;
    instagram: boolean;
    facebook: boolean;
    tiktok: boolean;
    twitter: boolean;
    youtube: boolean;
  };
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

interface PlatformMetric {
  platform: string;
  icon: any;
  color: string;
  metrics: {
    followers: string;
    engagement: string;
    reach: string;
    posts: number;
  };
}

const MarketingMetrics = ({ profile, socialConnections }: MarketingMetricsProps) => {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(false);

  // Métricas generales
  const generalMetrics: MetricCard[] = [
    {
      title: "Alcance Total",
      value: "24.8K",
      change: "+12.5%",
      trend: "up",
      icon: Eye,
      color: "text-blue-600"
    },
    {
      title: "Engagement Rate",
      value: "4.2%",
      change: "+0.8%",
      trend: "up",
      icon: Heart,
      color: "text-pink-600"
    },
    {
      title: "Nuevos Seguidores",
      value: "342",
      change: "+15.2%",
      trend: "up",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Clicks",
      value: "1.2K",
      change: "-2.1%",
      trend: "down",
      icon: Target,
      color: "text-purple-600"
    }
  ];

  // Métricas por plataforma (mock data)
  const platformMetrics: PlatformMetric[] = [
    {
      platform: "LinkedIn",
      icon: () => <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">in</div>,
      color: "bg-blue-700",
      metrics: {
        followers: "2.1K",
        engagement: "6.8%",
        reach: "12.3K",
        posts: 8
      }
    },
    {
      platform: "Instagram",
      icon: () => <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs">📷</div>,
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
      metrics: {
        followers: "1.8K",
        engagement: "3.2%",
        reach: "8.7K",
        posts: 12
      }
    },
    {
      platform: "TikTok",
      icon: () => <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">🎵</div>,
      color: "bg-black",
      metrics: {
        followers: "890",
        engagement: "8.1%",
        reach: "5.2K",
        posts: 6
      }
    }
  ];

  const connectedPlatformsCount = Object.values(socialConnections).filter(Boolean).length;

  const refreshMetrics = async () => {
    setLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  if (connectedPlatformsCount === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Datos de Analytics</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Conecta tus redes sociales para comenzar a ver métricas detalladas de rendimiento y engagement.
            </p>
            <Button>Conectar Redes Sociales</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics de Marketing</h2>
          <p className="text-muted-foreground">
            Insights y métricas de rendimiento de tus redes sociales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {["7d", "30d", "90d"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="h-8 px-3"
              >
                {range === "7d" ? "7 días" : range === "30d" ? "30 días" : "90 días"}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas generales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {generalMetrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="transition-all duration-200 hover:shadow-md hover-scale">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-5 w-5 ${metric.color}`} />
                  <Badge 
                    variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {metric.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {metric.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {metric.change}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas por plataforma */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {platformMetrics
          .filter(platform => {
            const platformKey = platform.platform.toLowerCase();
            return socialConnections[platformKey as keyof typeof socialConnections];
          })
          .map((platform, index) => {
            const IconComponent = platform.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className={`${platform.color} text-white pb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent />
                      <div>
                        <CardTitle className="text-lg">{platform.platform}</CardTitle>
                        <p className="text-sm opacity-90">Últimos {timeRange}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {platform.metrics.posts} posts
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Seguidores
                      </div>
                      <p className="text-xl font-bold">{platform.metrics.followers}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4" />
                        Engagement
                      </div>
                      <p className="text-xl font-bold">{platform.metrics.engagement}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Alcance
                      </div>
                      <p className="text-xl font-bold">{platform.metrics.reach}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Posts
                      </div>
                      <p className="text-xl font-bold">{platform.metrics.posts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Gráfico de rendimiento semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rendimiento Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Gráfico de rendimiento semanal</p>
              <p className="text-sm text-muted-foreground">Próximamente: Integración con Chart.js</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts con Mejor Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                platform: "LinkedIn",
                content: "Nuevas tendencias en marketing digital para 2024...",
                metrics: { likes: 45, comments: 12, shares: 8 },
                time: "Hace 2 días"
              },
              {
                platform: "Instagram",
                content: "Behind the scenes de nuestro equipo trabajando...",
                metrics: { likes: 123, comments: 18, shares: 5 },
                time: "Hace 3 días"
              },
              {
                platform: "TikTok",
                content: "Tutorial rápido sobre productividad...",
                metrics: { likes: 89, comments: 15, shares: 12 },
                time: "Hace 1 semana"
              }
            ].map((post, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {post.platform}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{post.time}</span>
                  </div>
                  <p className="text-sm mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.metrics.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.metrics.comments}
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {post.metrics.shares}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingMetrics;