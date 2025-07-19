import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Settings, 
  LogOut, 
  Shield,
  Activity,
  DollarSign,
  TrendingUp,
  Eye,
  UserCheck,
  Database,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated } = useAdminAuth();
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
      // Obtener estadísticas de usuarios
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Obtener conexiones activas
      const { data: linkedinConnections } = await supabase
        .from('linkedin_connections')
        .select('*');

      const { data: facebookConnections } = await supabase
        .from('facebook_instagram_connections')
        .select('*');

      const { data: tiktokConnections } = await supabase
        .from('tiktok_connections')
        .select('*');

      const companies = profiles?.filter(p => p.user_type === 'company') || [];
      const totalConnections = (linkedinConnections?.length || 0) + 
                              (facebookConnections?.length || 0) + 
                              (tiktokConnections?.length || 0);

      setStats({
        totalUsers: profiles?.length || 0,
        totalCompanies: companies.length,
        activeConnections: totalConnections,
        revenueMetrics: companies.length * 49 // Estimado por empresa
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Ha salido del portal admin exitosamente",
    });
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
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
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-slate-800 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal Admin</h1>
                <p className="text-sm text-gray-500">Buildera</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role}
              </Badge>
              <span className="text-sm text-gray-700">{user?.username}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido al Dashboard Admin
          </h2>
          <p className="text-gray-600">
            Monitoreo y gestión del ecosistema Buildera
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <div
                    key={index}
                    onClick={action.action}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center mb-3">
                      <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="ml-3 font-semibold text-gray-900">{action.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity />
      </main>
    </div>
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
      // Obtener registros recientes (últimas 24 horas)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Obtener conexiones recientes
      const { data: recentLinkedIn } = await supabase
        .from('linkedin_connections')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentFacebook } = await supabase
        .from('facebook_instagram_connections')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentTikTok } = await supabase
        .from('tiktok_connections')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      // Combinar y ordenar actividades
      const activities = [];
      
      if (recentProfiles) {
        recentProfiles.forEach(profile => {
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

      if (recentLinkedIn) {
        recentLinkedIn.forEach(conn => {
          activities.push({
            type: 'linkedin_connection',
            data: conn,
            timestamp: conn.created_at,
            icon: Activity,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
            title: 'Conexión LinkedIn',
            description: `Nueva conexión LinkedIn establecida`
          });
        });
      }

      if (recentFacebook) {
        recentFacebook.forEach(conn => {
          activities.push({
            type: 'facebook_connection',
            data: conn,
            timestamp: conn.created_at,
            icon: Activity,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
            title: 'Conexión Facebook',
            description: `Nueva conexión Facebook/Instagram establecida`
          });
        });
      }

      if (recentTikTok) {
        recentTikTok.forEach(conn => {
          activities.push({
            type: 'tiktok_connection',
            data: conn,
            timestamp: conn.created_at,
            icon: Activity,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
            title: 'Conexión TikTok',
            description: `Nueva conexión TikTok establecida`
          });
        });
      }

      // Ordenar por timestamp más reciente
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5)); // Solo mostrar las 5 más recientes

    } catch (error) {
      console.error('Error cargando actividad reciente:', error);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Actividad Reciente del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className={`flex items-center p-3 ${activity.bgColor} rounded-lg`}>
                  <div className={`${activity.color} p-2 rounded-full mr-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-500">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay actividad reciente en las últimas 24 horas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;