import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  BarChart3, 
  Activity,
  DollarSign,
  Eye,
  UserCheck,
  Database,
  Trophy,
  Brain,
  Shield,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Bot,
  ArrowRight,
  RefreshCw,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AutopilotSection from '@/components/admin/AutopilotSection';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  activeSubscriptions: number;
  mrr: number;
  totalAgentExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  creditsConsumed: number;
  usersByPlan: Record<string, number>;
  topAgents: Array<{ name: string; executions: number; successRate: number }>;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: { label: string; path: string };
}

const AdminDashboard = () => {
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    activeSubscriptions: 0,
    mrr: 0,
    totalAgentExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    creditsConsumed: 0,
    usersByPlan: {},
    topAgents: []
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    loadDashboardStats();
  }, [isAuthenticated, navigate]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load all stats in parallel
      const [
        profilesResult,
        companiesResult,
        subscriptionsResult,
        plansResult,
        agentUsageResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id, user_type, created_at'),
        supabase.from('companies').select('id, is_active, created_at'),
        supabase.from('user_subscriptions').select('*, subscription_plans(name, price_monthly)'),
        supabase.from('subscription_plans').select('*'),
        supabase.from('agent_usage_log').select('*, platform_agents(name)')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      // Load recent activity separately to avoid blocking dashboard if RPC doesn't exist
      let recentActivityResult = { data: null, error: null } as any;
      try {
        recentActivityResult = await supabase.rpc('get_admin_recent_activity');
      } catch (e) {
        console.warn('get_admin_recent_activity not available:', e);
      }

      // Process profiles
      const profiles = profilesResult.data || [];
      const companies = companiesResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const plans = plansResult.data || [];
      const agentUsage = agentUsageResult.data || [];

      // Calculate MRR from active subscriptions
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      const mrr = activeSubscriptions.reduce((sum, sub) => {
        const plan = sub.subscription_plans as any;
        return sum + (plan?.price_monthly || 0);
      }, 0);

      // Users by plan
      const usersByPlan: Record<string, number> = {};
      plans.forEach(plan => {
        usersByPlan[plan.name] = 0;
      });
      subscriptions.forEach(sub => {
        const planName = (sub.subscription_plans as any)?.name;
        if (planName) {
          usersByPlan[planName] = (usersByPlan[planName] || 0) + 1;
        }
      });

      // Agent usage stats
      const successfulExecutions = agentUsage.filter(u => u.status === 'completed' || u.status === 'success').length;
      const failedExecutions = agentUsage.filter(u => u.status === 'failed' || u.status === 'error').length;
      const creditsConsumed = agentUsage.reduce((sum, u) => sum + (u.credits_consumed || 0), 0);

      // Top agents
      const agentStats = new Map<string, { name: string; executions: number; successes: number }>();
      agentUsage.forEach(usage => {
        const agentName = (usage.platform_agents as any)?.name || 'Unknown';
        const current = agentStats.get(agentName) || { name: agentName, executions: 0, successes: 0 };
        current.executions++;
        if (usage.status === 'completed' || usage.status === 'success') {
          current.successes++;
        }
        agentStats.set(agentName, current);
      });

      const topAgents = Array.from(agentStats.values())
        .map(a => ({
          name: a.name,
          executions: a.executions,
          successRate: a.executions > 0 ? Math.round((a.successes / a.executions) * 100) : 0
        }))
        .sort((a, b) => b.executions - a.executions)
        .slice(0, 5);

      setStats({
        totalUsers: profiles.length,
        totalCompanies: companies.filter(c => c.is_active !== false).length,
        activeSubscriptions: activeSubscriptions.length,
        mrr,
        totalAgentExecutions: agentUsage.length,
        successfulExecutions,
        failedExecutions,
        creditsConsumed,
        usersByPlan,
        topAgents
      });

      // Process recent activity
      if (recentActivityResult.data?.[0]) {
        const activities: any[] = [];
        const data = recentActivityResult.data[0];
        
        if (data.recent_profiles && Array.isArray(data.recent_profiles)) {
          data.recent_profiles.forEach((profile: any) => {
            activities.push({
              type: 'user_registration',
              timestamp: profile.created_at,
              icon: Users,
              color: 'bg-blue-500',
              title: 'Nuevo usuario',
              description: `${profile.full_name || profile.email || 'Usuario'} registrado`
            });
          });
        }
        
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivity(activities.slice(0, 5));
      }

      // Generate alerts
      const newAlerts: Alert[] = [];
      
      // Check for high error rate
      const errorRate = stats.totalAgentExecutions > 0 
        ? (failedExecutions / agentUsage.length) * 100 
        : 0;
      if (errorRate > 20) {
        newAlerts.push({
          id: 'high_error_rate',
          type: 'critical',
          title: 'Alta tasa de errores',
          description: `${errorRate.toFixed(1)}% de las ejecuciones de agentes fallaron en los últimos 7 días`,
          action: { label: 'Ver detalles', path: '/admin/agent-performance' }
        });
      }

      // Check for inactive users
      const recentUsers = profiles.filter(p => {
        const createdAt = new Date(p.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt > weekAgo;
      });
      if (recentUsers.length === 0) {
        newAlerts.push({
          id: 'no_new_users',
          type: 'warning',
          title: 'Sin nuevos usuarios',
          description: 'No se han registrado nuevos usuarios en los últimos 7 días',
          action: { label: 'Ver clientes', path: '/admin/customers' }
        });
      }

      // Check for no subscriptions
      if (activeSubscriptions.length === 0) {
        newAlerts.push({
          id: 'no_subscriptions',
          type: 'warning',
          title: 'Sin suscripciones activas',
          description: 'No hay usuarios con suscripciones activas',
          action: { label: 'Ver clientes', path: '/admin/customers' }
        });
      }

      setAlerts(newAlerts);

    } catch (error: any) {
      console.error('Error cargando estadísticas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) return `Hace ${diffDays}d`;
    if (diffHours > 0) return `Hace ${diffHours}h`;
    return `Hace ${diffMins}min`;
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

  const successRate = stats.totalAgentExecutions > 0 
    ? Math.round((stats.successfulExecutions / stats.totalAgentExecutions) * 100) 
    : 0;

  const quickActions = [
    { title: "Clientes", icon: Users, path: '/admin/customers', count: stats.totalUsers },
    { title: "Constructor Agentes", icon: Bot, path: '/admin/agent-builder' },
    { title: "Rendimiento", icon: Activity, path: '/admin/agent-performance', count: stats.totalAgentExecutions },
    { title: "Configuración IA", icon: Brain, path: '/admin/ai-config' },
    { title: "Sistema", icon: Settings, path: '/admin/system' },
  ];

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Dashboard Principal"
        subtitle="Centro de control ejecutivo de Buildera"
        icon={Shield}
        onRefresh={loadDashboardStats}
        refreshing={loading}
      />
      
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.type === 'critical' 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-blue-500/10 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.type === 'critical' ? 'text-destructive' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                {alert.action && (
                  <Button variant="outline" size="sm" onClick={() => navigate(alert.action!.path)}>
                    {alert.action.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                  <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Empresas Activas</p>
                  <p className="text-3xl font-bold">{stats.totalCompanies.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Building2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <p className="text-3xl font-bold">${stats.mrr.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suscriptores</p>
                  <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-full">
                  <CreditCard className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Health Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Salud de Agentes (últimos 7 días)
              </CardTitle>
              <CardDescription>Rendimiento y uso de agentes de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ejecuciones</p>
                  <p className="text-2xl font-bold">{stats.totalAgentExecutions}</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Exitosas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successfulExecutions}</p>
                </div>
                <div className="p-4 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Fallidas</p>
                  <p className="text-2xl font-bold text-destructive">{stats.failedExecutions}</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Tasa Éxito</p>
                  <p className="text-2xl font-bold text-primary">{successRate}%</p>
                </div>
              </div>

              {/* Top Agents */}
              <div>
                <h4 className="font-medium mb-3">Top Agentes</h4>
                {stats.topAgents.length > 0 ? (
                  <div className="space-y-2">
                    {stats.topAgents.map((agent, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">{idx + 1}</Badge>
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {agent.executions} ejecuciones
                          </span>
                          <Badge className={agent.successRate >= 80 ? 'bg-green-500' : 'bg-amber-500'}>
                            {agent.successRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay datos de uso de agentes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users by Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Usuarios por Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(stats.usersByPlan).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{plan}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sin suscripciones activas</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créditos consumidos</span>
                  <span className="font-bold">{stats.creditsConsumed.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise Autopilot Section */}
        <div className="mb-6">
          <AutopilotSection />
        </div>

        {/* Quick Actions Grid */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Acceso Rápido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-all group text-center"
                  >
                    <div className="bg-muted p-3 rounded-full w-fit mx-auto mb-2 group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="font-medium text-sm">{action.title}</p>
                    {action.count !== undefined && (
                      <Badge variant="secondary" className="mt-1">{action.count}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => {
                  const Icon = activity.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={`${activity.color} p-2 rounded-full`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminDashboard;
