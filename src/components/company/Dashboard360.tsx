import React from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  Zap, 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Target,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Bell,
  X,
  ExternalLink,
  Calendar,
  FileText,
  Share2,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Dashboard360Props {
  profile: any;
  onNavigate?: (view: string) => void;
}

const Dashboard360: React.FC<Dashboard360Props> = ({ profile, onNavigate }) => {
  const { metrics, alerts, loading, calculating, calculateMetrics, markAlertAsRead, dismissAlert } = 
    useDashboardMetrics(profile?.user_id);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  const getTrendIcon = (value: number) => {
    if (value > 5) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (value < -5) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 5) return "text-green-500";
    if (value < -5) return "text-red-500";
    return "text-gray-500";
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'recommendation': return <Target className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const mainKpis = [
    {
      title: "Eficiencia Operativa",
      value: `${Math.round(metrics?.efficiency_score || 0)}%`,
      change: metrics?.efficiency_score || 0,
      icon: Zap,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      description: "Score general de optimización"
    },
    {
      title: "Horas Ahorradas",
      value: Math.round(metrics?.agent_hours_saved || 0),
      suffix: "h/mes",
      change: metrics?.agent_hours_saved || 0,
      icon: Clock,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      description: "Tiempo automatizado por IA"
    },
    {
      title: "Ahorro Estimado",
      value: formatCurrency(metrics?.estimated_cost_savings || 0),
      change: metrics?.roi_percentage || 0,
      icon: DollarSign,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      description: "Reducción de costos mensual"
    },
    {
      title: "Engagement Total",
      value: formatNumber(metrics?.total_engagement || 0),
      change: metrics?.reach_growth_percent || 0,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
      description: "Interacciones en redes sociales"
    }
  ];

  const secondaryMetrics = [
    {
      title: "Agentes Activos",
      value: metrics?.active_agents || 0,
      total: metrics?.total_agents || 0,
      icon: Bot,
      color: "text-blue-600",
      onClick: () => onNavigate?.('mis-agentes')
    },
    {
      title: "Redes Conectadas",
      value: metrics?.total_social_connections || 0,
      total: 3,
      icon: Share2,
      color: "text-green-600",
      onClick: () => onNavigate?.('marketing-hub')
    },
    {
      title: "Posts Publicados",
      value: metrics?.total_posts || 0,
      icon: FileText,
      color: "text-purple-600",
      onClick: () => onNavigate?.('marketing-hub')
    },
    {
      title: "Tareas Automatizadas",
      value: metrics?.tasks_automated || 0,
      icon: Activity,
      color: "text-orange-600",
      onClick: () => onNavigate?.('mando-central')
    }
  ];

  const unreadAlerts = alerts.filter(alert => !alert.is_read);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard 360°
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Vista completa de {profile?.company_name || "tu negocio"} • 
            {metrics && (
              <span className="ml-2 text-sm">
                Actualizado {formatDistanceToNow(new Date(metrics.last_calculated_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={calculateMetrics}
            disabled={calculating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculando...' : 'Actualizar'}
          </Button>
          {unreadAlerts.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {unreadAlerts.length} nueva{unreadAlerts.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificaciones Inteligentes
          </h2>
          <div className="grid gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <Alert 
                key={alert.id} 
                className={`relative ${!alert.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTitle className="text-sm font-medium">
                        {alert.title}
                      </AlertTitle>
                      <Badge variant={getAlertBadgeColor(alert.priority)} className="text-xs">
                        {alert.priority}
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm text-muted-foreground">
                      {alert.description}
                    </AlertDescription>
                    {alert.action_url && alert.action_text && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2 text-blue-600"
                        onClick={() => {
                          onNavigate?.(alert.action_url!);
                          markAlertAsRead(alert.id);
                        }}
                      >
                        {alert.action_text}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 h-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Principales */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Métricas Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainKpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className={`absolute inset-0 ${kpi.color} opacity-10 group-hover:opacity-15 transition-opacity`}></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-full ${kpi.color} bg-opacity-10`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(kpi.change)}
                      <span className={`text-sm font-medium ${getTrendColor(kpi.change)}`}>
                        {Math.abs(kpi.change) > 0 ? `${kpi.change > 0 ? '+' : ''}${Math.round(kpi.change)}%` : ''}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold">
                      {kpi.value}
                      {kpi.suffix && <span className="text-lg text-muted-foreground ml-1">{kpi.suffix}</span>}
                    </p>
                    <div>
                      <p className="font-medium text-foreground">{kpi.title}</p>
                      <p className="text-sm text-muted-foreground">{kpi.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Métricas Secundarias */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Resumen de Actividades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card 
                key={index} 
                className={`cursor-pointer hover:shadow-md transition-all duration-200 ${metric.onClick ? 'hover:bg-muted/50' : ''}`}
                onClick={metric.onClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${metric.color}`} />
                    {metric.total && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">{metric.value}</div>
                        <div className="text-sm text-muted-foreground">de {metric.total}</div>
                      </div>
                    )}
                    {!metric.total && (
                      <div className="text-2xl font-bold">{metric.value}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{metric.title}</p>
                    {metric.total && (
                      <Progress 
                        value={(metric.value / metric.total) * 100} 
                        className="mt-2 h-2"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Insights Rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Rendimiento General
            </CardTitle>
            <CardDescription>
              Análisis de tu progreso empresarial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Automatización</span>
                <span className="text-sm text-muted-foreground">{Math.round((metrics?.active_agents || 0) * 25)}%</span>
              </div>
              <Progress value={(metrics?.active_agents || 0) * 25} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Presencia Digital</span>
                <span className="text-sm text-muted-foreground">{Math.round((metrics?.total_social_connections || 0) * 33.33)}%</span>
              </div>
              <Progress value={(metrics?.total_social_connections || 0) * 33.33} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Base de Conocimiento</span>
                <span className="text-sm text-muted-foreground">{Math.min(Math.round((metrics?.total_files || 0) * 10), 100)}%</span>
              </div>
              <Progress value={Math.min((metrics?.total_files || 0) * 10, 100)} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Próximos Pasos
            </CardTitle>
            <CardDescription>
              Recomendaciones para crecer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics?.total_agents === 0 && (
              <div 
                className="p-3 rounded-lg bg-blue-50 border cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onNavigate?.('marketplace')}
              >
                <p className="font-medium text-blue-900">Crear primer agente</p>
                <p className="text-sm text-blue-700">Automatiza tu primera tarea</p>
              </div>
            )}
            {metrics?.total_social_connections === 0 && (
              <div 
                className="p-3 rounded-lg bg-green-50 border cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => onNavigate?.('marketing-hub')}
              >
                <p className="font-medium text-green-900">Conectar redes sociales</p>
                <p className="text-sm text-green-700">Amplifica tu alcance</p>
              </div>
            )}
            {metrics?.total_files === 0 && (
              <div 
                className="p-3 rounded-lg bg-purple-50 border cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => onNavigate?.('base-conocimiento')}
              >
                <p className="font-medium text-purple-900">Subir documentos</p>
                <p className="text-sm text-purple-700">Construye tu base de conocimiento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos Rápidos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Marketing Hub",
              description: "Gestiona tus redes sociales",
              icon: Share2,
              color: "bg-gradient-to-br from-pink-500 to-rose-500",
              action: () => onNavigate?.('marketing-hub')
            },
            {
              title: "Mis Agentes",
              description: "Ve todos tus asistentes IA",
              icon: Bot,
              color: "bg-gradient-to-br from-blue-500 to-indigo-500",
              action: () => onNavigate?.('mis-agentes')
            },
            {
              title: "Configuración Empresarial",
              description: "Define tu negocio",
              icon: Target,
              color: "bg-gradient-to-br from-green-500 to-emerald-500",
              action: () => onNavigate?.('adn-empresa')
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
                onClick={item.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${item.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard360;