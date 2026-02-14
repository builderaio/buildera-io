import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  Building2, 
  CreditCard,
  Search, 
  Calendar,
  Mail,
  Globe,
  Activity,
  Power,
  PowerOff,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Crown,
  Rocket,
  Sparkles,
  TrendingUp,
  DollarSign,
  User,
  RefreshCw,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import CreditsPanel from '@/components/admin/CreditsPanel';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Types
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  user_type: 'company' | 'developer' | 'expert';
  created_at: string;
  linked_providers: string[];
  avatar_url?: string;
  country?: string;
  company_name?: string;
  company_role?: string;
  is_active?: boolean;
}

interface CompanyProfile {
  id: string;
  name: string;
  website_url?: string;
  industry_sector?: string;
  created_at: string;
  is_active: boolean;
  member_count?: number;
  owner_email?: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  user_email: string;
  plan_name: string;
  status: string;
  current_period_end: string;
}

const PLAN_COLORS: Record<string, string> = {
  'starter': 'hsl(var(--muted))',
  'growth': 'hsl(var(--primary))',
  'scale': 'hsl(var(--secondary))',
  'enterprise': 'hsl(142, 76%, 36%)'
};

const AdminCustomers = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Shared state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  
  // Companies state
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [totals, setTotals] = useState({ totalUsers: 0, activeSubscribers: 0, mrr: 0, arr: 0 });
  const [planStats, setPlanStats] = useState<{plan: string; count: number; revenue: number}[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, [isAuthenticated, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadCompanies(), loadSubscriptions()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_profiles_admin');
      if (error) throw error;
      setUsers((data as UserProfile[]) || []);
    } catch (error: any) {
      console.error('Error loading users:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: membersData } = await supabase
        .from('company_members')
        .select('company_id, user_id, role');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, email');

      const mapped = companiesData?.map(c => {
        const members = membersData?.filter(m => m.company_id === c.id) || [];
        const owner = members.find(m => m.role === 'owner');
        const ownerProfile = profilesData?.find(p => p.user_id === owner?.user_id);
        return { ...c, member_count: members.length, owner_email: ownerProfile?.email || '' };
      }) || [];

      setCompanies(mapped);
    } catch (error: any) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      const { data: subsData } = await supabase
        .from('user_subscriptions')
        .select(`*, subscription_plans (name, price_monthly)`)
        .order('created_at', { ascending: false });

      const mapped: UserSubscription[] = (subsData || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        user_email: 'Usuario ' + sub.user_id?.substring(0, 8),
        plan_name: (sub.subscription_plans as any)?.name || 'Unknown',
        status: sub.status,
        current_period_end: sub.current_period_end
      }));
      setSubscriptions(mapped);

      // Calculate stats
      const stats = new Map<string, {plan: string; count: number; revenue: number}>();
      (plansData || []).forEach(p => stats.set(p.name.toLowerCase(), { plan: p.name, count: 0, revenue: 0 }));
      
      let mrr = 0;
      mapped.forEach(sub => {
        const key = sub.plan_name.toLowerCase();
        const plan = plansData?.find(p => p.name.toLowerCase() === key);
        if (stats.has(key)) {
          const stat = stats.get(key)!;
          stat.count++;
          if (sub.status === 'active' && plan) {
            stat.revenue += plan.price_monthly || 0;
            mrr += plan.price_monthly || 0;
          }
        }
      });

      setPlanStats(Array.from(stats.values()));
      const activeCount = mapped.filter(s => s.status === 'active').length;
      
      // If no subs, count profiles
      if (mapped.length === 0) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        setTotals({ totalUsers: count || 0, activeSubscribers: 0, mrr: 0, arr: 0 });
        setPlanStats([{ plan: 'Free', count: count || 0, revenue: 0 }]);
      } else {
        setTotals({ totalUsers: mapped.length, activeSubscribers: activeCount, mrr, arr: mrr * 12 });
      }
    } catch (error: any) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const action = isActive ? 'deactivate_user' : 'reactivate_user';
      const { error } = await supabase.rpc(action, { target_user_id: userId });
      if (error) throw error;
      toast({ title: t('toast.success'), description: t('toast.admin.userToggled', { action: isActive ? t('toast.admin.deactivated') : t('toast.admin.reactivated') }) });
      loadUsers();
    } catch (error: any) {
      toast({ title: t('toast.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleToggleCompanyStatus = async (companyId: string, isActive: boolean) => {
    try {
      const action = isActive ? 'deactivate_company' : 'reactivate_company';
      const { error } = await supabase.rpc(action, { target_company_id: companyId });
      if (error) throw error;
      toast({ title: t('toast.success'), description: t('toast.admin.companyToggled', { action: isActive ? t('toast.admin.deactivatedF') : t('toast.admin.reactivatedF') }) });
      loadCompanies();
    } catch (error: any) {
      toast({ title: t('toast.error'), description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase.rpc('delete_user_cascade', { target_user_id: userId });
      if (error) throw error;
      toast({ title: t('toast.deleted'), description: t('toast.admin.userDeleted', { name: userName }) });
      await Promise.all([loadUsers(), loadCompanies()]);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ title: t('toast.admin.errorDeleteUser'), description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    try {
      const { error } = await supabase.rpc('delete_company_cascade', { target_company_id: companyId });
      if (error) throw error;
      toast({ title: t('toast.deleted'), description: t('toast.admin.companyDeleted', { name: companyName }) });
      await Promise.all([loadCompanies(), loadUsers()]);
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({ title: t('toast.admin.errorDeleteCompany'), description: error.message, variant: "destructive" });
    }
  };

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'company': return Building2;
      default: return User;
    }
  };

  // Filtered data
  const filteredUsers = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.full_name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchFilter = userFilter === 'all' || 
                        (userFilter === 'active' && u.is_active !== false) ||
                        (userFilter === 'inactive' && u.is_active === false) ||
                        u.user_type === userFilter;
    return matchSearch && matchFilter;
  });

  const filteredCompanies = companies.filter(c => {
    const matchSearch = c.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
                        c.owner_email?.toLowerCase().includes(companySearch.toLowerCase());
    const matchFilter = companyFilter === 'all' ||
                        (companyFilter === 'active' && c.is_active) ||
                        (companyFilter === 'inactive' && !c.is_active);
    return matchSearch && matchFilter;
  });

  const filteredSubs = subscriptions.filter(s => {
    const matchSearch = s.user_email.toLowerCase().includes(subSearch.toLowerCase());
    const matchPlan = subPlanFilter === 'all' || s.plan_name.toLowerCase() === subPlanFilter;
    return matchSearch && matchPlan;
  });

  const pieData = planStats.map(s => ({ name: s.plan, value: s.count }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Gestión de Clientes"
        subtitle="Usuarios, empresas y suscripciones en un solo lugar"
        icon={Users}
        showBackButton={true}
        onRefresh={loadAllData}
        refreshing={loading}
      />
      
      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Usuarios</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Empresas</p>
                  <p className="text-2xl font-bold">{companies.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MRR</p>
                  <p className="text-2xl font-bold">${totals.mrr.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Suscriptores</p>
                  <p className="text-2xl font-bold">{totals.activeSubscribers}</p>
                </div>
                <CreditCard className="w-8 h-8 text-secondary/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Suscripciones</span>
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Créditos</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['all', 'active', 'inactive', 'company'].map(f => (
                      <Button
                        key={f}
                        size="sm"
                        variant={userFilter === f ? 'default' : 'outline'}
                        onClick={() => setUserFilter(f)}
                        className="text-xs"
                      >
                        {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : f === 'inactive' ? 'Inactivos' : 'Empresa'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-auto">
                  {filteredUsers.map(user => {
                    const Icon = getUserTypeIcon(user.user_type);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.full_name || 'Sin nombre'}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.is_active === false ? 'destructive' : 'default'} className="text-xs">
                            {user.is_active === false ? 'Inactivo' : 'Activo'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleUserStatus(user.user_id, user.is_active !== false)}
                          >
                            {user.is_active === false ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar usuario permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará a <strong>{user.full_name || user.email}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.user_id, user.full_name || user.email)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No se encontraron usuarios</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar empresas..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'active', 'inactive'].map(f => (
                      <Button
                        key={f}
                        size="sm"
                        variant={companyFilter === f ? 'default' : 'outline'}
                        onClick={() => setCompanyFilter(f)}
                      >
                        {f === 'all' ? 'Todas' : f === 'active' ? 'Activas' : 'Inactivas'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[500px] overflow-auto">
                  {filteredCompanies.map(company => (
                    <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-muted rounded-lg">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{company.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{company.owner_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {company.member_count}
                        </Badge>
                        <Badge variant={company.is_active ? 'default' : 'destructive'} className="text-xs">
                          {company.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleCompanyStatus(company.id, company.is_active)}
                        >
                          {company.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar empresa permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará <strong>{company.name}</strong> y todos sus datos asociados (agentes, créditos, configuraciones, etc.). Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCompany(company.id, company.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No se encontraron empresas</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribución por Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    {pieData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={index} fill={PLAN_COLORS[entry.name.toLowerCase()] || `hsl(${index * 90}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Sin datos
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen de Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {planStats.map(stat => (
                      <div key={stat.plan} className="p-3 border rounded-lg">
                        <p className="text-sm font-medium">{stat.plan}</p>
                        <p className="text-xl font-bold">{stat.count}</p>
                        {stat.revenue > 0 && (
                          <p className="text-sm text-green-600">${stat.revenue}/mes</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscriptions List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar suscripciones..."
                      value={subSearch}
                      onChange={(e) => setSubSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={subPlanFilter} onValueChange={setSubPlanFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {planStats.map(p => (
                        <SelectItem key={p.plan} value={p.plan.toLowerCase()}>{p.plan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredSubs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Vence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubs.map(sub => (
                        <TableRow key={sub.id}>
                          <TableCell className="font-medium">{sub.user_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sub.plan_name}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={sub.status === 'active' ? 'default' : 'destructive'}>
                              {sub.status === 'active' ? 'Activo' : sub.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('es-ES') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay suscripciones</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-4">
            <CreditsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </AdminLayout>
  );
};

export default AdminCustomers;
