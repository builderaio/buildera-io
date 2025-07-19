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
  Database
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
      title: "Configuración Sistema",
      description: "Ajustes generales y configuraciones",
      icon: Settings,
      action: () => navigate('/admin/settings')
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Actividad Reciente del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-500 p-2 rounded-full mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nuevos registros</p>
                  <p className="text-sm text-gray-600">3 empresas se registraron hoy</p>
                </div>
                <span className="ml-auto text-xs text-gray-500">2 min ago</span>
              </div>
              
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="bg-green-500 p-2 rounded-full mr-3">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Conexiones activas</p>
                  <p className="text-sm text-gray-600">5 nuevas conexiones LinkedIn establecidas</p>
                </div>
                <span className="ml-auto text-xs text-gray-500">1 hr ago</span>
              </div>
              
              <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-500 p-2 rounded-full mr-3">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Uso de IA</p>
                  <p className="text-sm text-gray-600">150 solicitudes de generación de contenido procesadas</p>
                </div>
                <span className="ml-auto text-xs text-gray-500">3 hr ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;