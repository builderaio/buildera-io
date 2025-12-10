import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Users, 
  TrendingUp, 
  DollarSign,
  Search,
  RefreshCw,
  Crown,
  Rocket,
  Sparkles,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SubscriptionStats {
  plan: string;
  count: number;
  revenue: number;
}

interface UserSubscription {
  id: string;
  user_id: string;
  user_email: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  credits_used: number;
  credits_limit: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  credits_monthly: number;
  features: string[];
}

const PLAN_COLORS: Record<string, string> = {
  'starter': 'hsl(var(--muted))',
  'growth': 'hsl(var(--primary))',
  'scale': 'hsl(var(--secondary))',
  'enterprise': 'hsl(142, 76%, 36%)'
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  'starter': <Sparkles className="w-4 h-4" />,
  'growth': <Rocket className="w-4 h-4" />,
  'scale': <TrendingUp className="w-4 h-4" />,
  'enterprise': <Crown className="w-4 h-4" />
};

const AdminSubscriptions: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<SubscriptionStats[]>([]);
  const [totals, setTotals] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    mrr: 0,
    arr: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadSubscriptionData();
  }, [isAuthenticated]);

  const loadSubscriptionData = async () => {
    setLoading(true);
    try {
      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (plansError) throw plansError;
      
      const mappedPlans: SubscriptionPlan[] = (plansData || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        price_monthly: plan.price_monthly || 0,
        credits_monthly: (plan.limits as any)?.credits_monthly || 1000,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
      setPlans(mappedPlans);

      // Fetch user subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            price_monthly
          )
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Map subscriptions with user info
      const mappedSubs: UserSubscription[] = (subsData || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_email: 'Usuario ' + sub.user_id?.substring(0, 8),
        plan_id: sub.plan_id,
        plan_name: (sub.subscription_plans as any)?.name || 'Unknown',
        status: sub.status,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        credits_used: 0, // Not available in user_subscriptions table
        credits_limit: (sub.subscription_plans as any)?.limits?.credits_monthly || 1000
      }));
      setSubscriptions(mappedSubs);

      // Calculate stats by plan
      const planStats = new Map<string, SubscriptionStats>();
      mappedPlans.forEach(plan => {
        planStats.set(plan.name.toLowerCase(), {
          plan: plan.name,
          count: 0,
          revenue: 0
        });
      });

      mappedSubs.forEach(sub => {
        const planKey = sub.plan_name.toLowerCase();
        const plan = mappedPlans.find(p => p.name.toLowerCase() === planKey);
        if (planStats.has(planKey)) {
          const stat = planStats.get(planKey)!;
          stat.count++;
          if (sub.status === 'active' && plan) {
            stat.revenue += plan.price_monthly;
          }
        }
      });

      setStats(Array.from(planStats.values()));

      // Calculate totals
      const activeCount = mappedSubs.filter(s => s.status === 'active').length;
      const mrr = Array.from(planStats.values()).reduce((sum, s) => sum + s.revenue, 0);
      
      setTotals({
        totalSubscribers: mappedSubs.length,
        activeSubscribers: activeCount,
        mrr: mrr,
        arr: mrr * 12
      });

      // If no real subscriptions, count profiles as "free" users
      if (mappedSubs.length === 0) {
        const { count: profileCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        setTotals(prev => ({
          ...prev,
          totalSubscribers: profileCount || 0
        }));

        setStats([{
          plan: 'Free',
          count: profileCount || 0,
          revenue: 0
        }]);
      }

    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'canceled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      case 'past_due':
        return <Badge className="bg-amber-500/20 text-amber-600"><Clock className="w-3 h-3 mr-1" />Vencido</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-600"><Sparkles className="w-3 h-3 mr-1" />Trial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (planName: string) => {
    const key = planName.toLowerCase();
    const icon = PLAN_ICONS[key] || <Sparkles className="w-4 h-4" />;
    const colors: Record<string, string> = {
      'starter': 'bg-muted text-muted-foreground',
      'growth': 'bg-primary/20 text-primary',
      'scale': 'bg-secondary/20 text-secondary-foreground',
      'enterprise': 'bg-green-500/20 text-green-600'
    };
    return (
      <Badge className={colors[key] || 'bg-muted'}>
        {icon}
        <span className="ml-1">{planName}</span>
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sub.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || sub.plan_name.toLowerCase() === planFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const pieData = stats.map(s => ({
    name: s.plan,
    value: s.count
  }));

  const revenueData = stats.map(s => ({
    name: s.plan,
    revenue: s.revenue
  }));

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <AdminPageHeader 
        title={t('admin:subscriptions.title', 'Suscripciones')}
        subtitle={t('admin:subscriptions.description', 'Gestiona las suscripciones y planes de la plataforma')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-3xl font-bold">{totals.totalSubscribers.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Suscriptores Activos</p>
                <p className="text-3xl font-bold">{totals.activeSubscribers}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-3xl font-bold">${totals.mrr.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <DollarSign className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ARR Estimado</p>
                <p className="text-3xl font-bold">${totals.arr.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="plans">Planes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Plan</CardTitle>
                <CardDescription>Usuarios por tipo de suscripción</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {pieData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PLAN_COLORS[entry.name.toLowerCase()] || `hsl(${index * 90}, 70%, 50%)`} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No hay datos de suscripciones</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Plan</CardTitle>
                <CardDescription>MRR desglosado por tipo de plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {revenueData.some(d => d.revenue > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Ingresos']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }} 
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-muted-foreground">No hay ingresos registrados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Plan Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Resumen de Planes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div key={stat.plan} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 mb-2">
                        {PLAN_ICONS[stat.plan.toLowerCase()] || <Sparkles className="w-4 h-4" />}
                        <span className="font-medium">{stat.plan}</span>
                      </div>
                      <p className="text-2xl font-bold">{stat.count}</p>
                      <p className="text-sm text-muted-foreground">usuarios</p>
                      {stat.revenue > 0 && (
                        <p className="text-sm text-green-500 mt-1">
                          ${stat.revenue}/mes
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Suscripciones</CardTitle>
                  <CardDescription>Todas las suscripciones activas e inactivas</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {plans.map(plan => (
                        <SelectItem key={plan.id} value={plan.name.toLowerCase()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="canceled">Cancelados</SelectItem>
                      <SelectItem value="past_due">Vencidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={loadSubscriptionData}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Renovación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{sub.user_id.substring(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan_name)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{sub.credits_used}</span>
                          <span className="text-muted-foreground">/</span>
                          <span>{sub.credits_limit}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(sub.current_period_start)}</TableCell>
                      <TableCell>{formatDate(sub.current_period_end)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay suscripciones que mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {getPlanBadge(plan.name)}
                  </div>
                  <CardTitle className="text-2xl mt-2">
                    ${plan.price_monthly}
                    <span className="text-sm font-normal text-muted-foreground">/mes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>{plan.credits_monthly.toLocaleString()} créditos/mes</span>
                    </div>
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {stats.find(s => s.plan.toLowerCase() === plan.name.toLowerCase())?.count || 0} usuarios
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay planes configurados
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
