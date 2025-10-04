import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Activity,
  DollarSign,
  TrendingUp,
  Eye,
  UserCheck,
  Database,
  Trophy,
  Key,
  Brain,
  Zap,
  Shield,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

const AdminDashboard = () => {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeConnections: 0,
    revenueMetrics: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    loadDashboardStats();
  }, [isAuthenticated, navigate]);

  const loadDashboardStats = async () => {
    try {
      // Usar funciones administrativas para obtener estadísticas sin restricciones RLS
      const { data: userAnalytics, error: userError } = await supabase
        .rpc('get_admin_user_analytics');

      if (userError) {
        console.error('Error con función de analytics, intentando consulta directa:', userError);
        // Fallback: intentar consulta directa
        const { data: profiles } = await supabase.from('profiles').select('*');
        setStats({
          totalUsers: profiles?.length || 0,
          totalCompanies: profiles?.filter(p => p.user_type === 'company').length || 0,
          activeConnections: 0,
          revenueMetrics: (profiles?.filter(p => p.user_type === 'company').length || 0) * 49
        });
      } else {
        const analytics = userAnalytics?.[0];
        if (analytics) {
          setStats({
            totalUsers: Number(analytics.total_users) || 0,
            totalCompanies: Number(analytics.companies) || 0,
            activeConnections: Number(analytics.users_with_linkedin) + 
                             Number(analytics.users_with_facebook) + 
                             Number(analytics.users_with_tiktok) || 0,
            revenueMetrics: Number(analytics.companies) * 49 // Estimado por empresa
          });
        }
      }

    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las estadísticas: ${error?.message || 'Error desconocido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats.totalUsers.toString(),
      icon: Users,
      color: "bg-blue-500",
      change: "+12% este mes"
    },
    {
      title: "Empresas Activas", 
      value: stats.totalCompanies.toString(),
      icon: Building2,
      color: "bg-green-500",
      change: "+8% este mes"
    },
    {
      title: "Conexiones Activas",
      value: stats.activeConnections.toString(),
      icon: Activity,
      color: "bg-purple-500",
      change: "+15% este mes"
    },
    {
      title: "Revenue Estimado",
      value: `$${stats.revenueMetrics.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-orange-500",
      change: "+23% este mes"
    }
  ];

  const quickActions = [
    {
      title: "Gestionar Usuarios",
      description: "Ver y administrar todos los usuarios del sistema",
      icon: UserCheck,
      action: () => navigate('/admin/users')
    },
    {
      title: "Monitoreo IA",
      description: "Estado y rendimiento de modelos de IA",
      icon: Activity,
      action: () => navigate('/admin/ai-monitoring')
    },
    {
      title: "Champion Challenge",
      description: "Evaluación y comparación de modelos IA",
      icon: Trophy,
      action: () => navigate('/admin/champion-challenge')
    },
    {
      title: "Configuración IA",
      description: "Parametrización de modelos por función",
      icon: Settings,
      action: () => navigate('/admin/ai-config')
    },
    {
      title: "Analytics Avanzados", 
      description: "Reportes detallados y métricas de uso",
      icon: BarChart3,
      action: () => navigate('/admin/analytics')
    },
    {
      title: "Base de Datos",
      description: "Monitoreo y administración de datos",
      icon: Database,
      action: () => navigate('/admin/database')
    },
    {
      title: "Configuración de Funciones",
      description: "Configuración de modelos para funciones específicas",
      icon: Settings,
      action: () => navigate('/admin/function-config')
    },
    {
      title: "Plantillas de Agentes",
      description: "Crear y gestionar agentes autónomos para el marketplace",
      icon: Brain,
      action: () => navigate('/admin/agent-templates')
    }
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Dashboard Principal"
        subtitle="Monitoreo y gestión del ecosistema Buildera"
        icon={Shield}
        onRefresh={loadDashboardStats}
        refreshing={loading}
      />
      
      <main className="flex-1 p-3 sm:p-6 overflow-auto">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow animate-fade-in">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{stat.change}</span>
                      </p>
                    </div>
                    <div className={`${stat.color} p-2 sm:p-3 rounded-full flex-shrink-0 ml-3`}>
                      <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    onClick={action.action}
                    className="p-3 sm:p-4 border rounded-lg hover:bg-accent/50 active:bg-accent cursor-pointer transition-colors group hover-scale"
                  >
                    <div className="flex items-start mb-2 sm:mb-3">
                      <div className="bg-muted p-2 rounded-lg group-hover:bg-muted/80 transition-colors flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </div>
                      <h3 className="ml-2 sm:ml-3 font-semibold text-foreground text-sm sm:text-base leading-tight">{action.title}</h3>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity />
      </main>
    </AdminLayout>
  );
};

// Componente para mostrar actividad reciente real
const RecentActivity = () => {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const loadRecentActivity = async () => {
    try {
      // Usar función administrativa para obtener actividad reciente
      const { data: recentData, error } = await supabase
        .rpc('get_admin_recent_activity');

      if (error) {
        console.error('Error con función de actividad reciente:', error);
        setRecentActivity([]);
        return;
      }

      const activities = [];
      
      // Procesar perfiles recientes
      if (recentData?.[0]?.recent_profiles && Array.isArray(recentData[0].recent_profiles)) {
        recentData[0].recent_profiles.forEach((profile: any) => {
          activities.push({
            type: 'user_registration',
            data: profile,
            timestamp: profile.created_at,
            icon: Users,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
            title: 'Nuevo registro',
            description: `${profile.user_type === 'company' ? 'Empresa' : 'Usuario'} registrado: ${profile.full_name || profile.email}`
          });
        });
      }

      // Procesar conexiones recientes
      if (recentData?.[0]?.recent_connections && Array.isArray(recentData[0].recent_connections)) {
        recentData[0].recent_connections.forEach((conn: any) => {
          activities.push({
            type: 'linkedin_connection',
            data: conn,
            timestamp: conn.created_at,
            icon: Activity,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            title: 'Conexión LinkedIn',
            description: 'Nueva conexión LinkedIn establecida'
          });
        });
      }

      // Ordenar por timestamp más reciente
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5)); // Solo mostrar las 5 más recientes

    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} día${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes || 1} min ago`;
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          Actividad Reciente del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className={`flex items-start p-3 sm:p-4 ${activity.bgColor} rounded-lg hover-scale`}>
                  <div className={`${activity.color} p-2 rounded-full mr-3 flex-shrink-0`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base">{activity.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground flex-shrink-0">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <Activity className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">No hay actividad reciente en las últimas 24 horas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;