import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Bot, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  RefreshCw,
  Zap,
  BarChart3
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  total_executions: number;
  success_count: number;
  error_count: number;
  avg_time_ms: number;
  total_credits: number;
}

interface RecentExecution {
  id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  execution_time_ms: number;
  credits_consumed: number;
  created_at: string;
  error_message?: string;
}

const AdminAgentPerformance = () => {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [totals, setTotals] = useState({
    totalExecutions: 0,
    successRate: 0,
    avgTime: 0,
    totalCredits: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated, timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const daysMap: Record<string, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };
      const startDate = new Date(now.getTime() - (daysMap[timeRange] || 7) * 24 * 60 * 60 * 1000);

      // Fetch usage logs
      const { data: logs, error } = await supabase
        .from('agent_usage_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch agent names
      const { data: agents } = await supabase
        .from('platform_agents')
        .select('id, name, internal_code');

      const agentMap = new Map(agents?.map(a => [a.id, a.name || a.internal_code]) || []);

      // Process stats by agent
      const statsMap = new Map<string, AgentStats>();
      
      (logs || []).forEach(log => {
        const agentId = log.agent_id || 'unknown';
        const agentName = agentMap.get(agentId) || 'Agente Desconocido';
        
        if (!statsMap.has(agentId)) {
          statsMap.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            total_executions: 0,
            success_count: 0,
            error_count: 0,
            avg_time_ms: 0,
            total_credits: 0
          });
        }
        
        const stat = statsMap.get(agentId)!;
        stat.total_executions++;
        if (log.status === 'completed' || log.status === 'success') {
          stat.success_count++;
        } else if (log.status === 'error' || log.status === 'failed') {
          stat.error_count++;
        }
        stat.avg_time_ms += log.execution_time_ms || 0;
        stat.total_credits += log.credits_consumed || 0;
      });

      // Calculate averages
      statsMap.forEach(stat => {
        if (stat.total_executions > 0) {
          stat.avg_time_ms = Math.round(stat.avg_time_ms / stat.total_executions);
        }
      });

      const statsArray = Array.from(statsMap.values())
        .sort((a, b) => b.total_executions - a.total_executions);

      setAgentStats(statsArray);

      // Process recent executions
      const recent: RecentExecution[] = (logs || []).slice(0, 100).map(log => ({
        id: log.id,
        agent_id: log.agent_id || 'unknown',
        agent_name: agentMap.get(log.agent_id) || 'Agente Desconocido',
        status: log.status || 'unknown',
        execution_time_ms: log.execution_time_ms || 0,
        credits_consumed: log.credits_consumed || 0,
        created_at: log.created_at,
        error_message: log.error_message
      }));

      setRecentExecutions(recent);

      // Calculate totals
      const totalExec = logs?.length || 0;
      const successCount = logs?.filter(l => l.status === 'completed' || l.status === 'success').length || 0;
      const avgTimeTotal = totalExec > 0 
        ? Math.round((logs?.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) || 0) / totalExec)
        : 0;
      const totalCreds = logs?.reduce((sum, l) => sum + (l.credits_consumed || 0), 0) || 0;

      setTotals({
        totalExecutions: totalExec,
        successRate: totalExec > 0 ? Math.round((successCount / totalExec) * 100) : 0,
        avgTime: avgTimeTotal,
        totalCredits: totalCreds
      });

    } catch (error) {
      console.error('Error loading agent performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Éxito</Badge>;
      case 'error':
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Ejecutando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const filteredExecutions = recentExecutions.filter(exec => {
    const matchSearch = exec.agent_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && (exec.status === 'completed' || exec.status === 'success')) ||
      (statusFilter === 'error' && (exec.status === 'error' || exec.status === 'failed'));
    return matchSearch && matchStatus;
  });

  const chartData = agentStats.slice(0, 8).map(s => ({
    name: s.agent_name.length > 15 ? s.agent_name.substring(0, 15) + '...' : s.agent_name,
    executions: s.total_executions,
    success: s.success_count,
    errors: s.error_count
  }));

  const pieData = [
    { name: 'Éxito', value: totals.successRate },
    { name: 'Error', value: 100 - totals.successRate }
  ];

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
        title="Rendimiento de Agentes"
        subtitle="Estadísticas de uso, éxito y créditos consumidos"
        icon={Activity}
        showBackButton={true}
        onRefresh={loadData}
        refreshing={loading}
      />
      
      <main className="flex-1 p-4 sm:p-6 overflow-auto space-y-6">
        {/* Time Range Filter */}
        <div className="flex justify-end">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ejecuciones</p>
                  <p className="text-2xl font-bold">{totals.totalExecutions.toLocaleString()}</p>
                </div>
                <Bot className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tasa de Éxito</p>
                  <p className="text-2xl font-bold">{totals.successRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tiempo Prom.</p>
                  <p className="text-2xl font-bold">{(totals.avgTime / 1000).toFixed(1)}s</p>
                </div>
                <Clock className="w-8 h-8 text-secondary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Créditos</p>
                  <p className="text-2xl font-bold">{totals.totalCredits.toLocaleString()}</p>
                </div>
                <Zap className="w-8 h-8 text-amber-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="agents">Por Agente</TabsTrigger>
            <TabsTrigger value="logs">Ejecuciones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Uso por Agente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="success" fill="hsl(142, 76%, 36%)" stackId="a" name="Éxito" />
                          <Bar dataKey="errors" fill="hsl(var(--destructive))" stackId="a" name="Errores" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Sin datos
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Success Rate Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tasa de Éxito Global</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          <Cell fill="hsl(142, 76%, 36%)" />
                          <Cell fill="hsl(var(--destructive))" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadísticas por Agente</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agente</TableHead>
                      <TableHead className="text-right">Ejecuciones</TableHead>
                      <TableHead className="text-right">Éxito</TableHead>
                      <TableHead className="text-right">Errores</TableHead>
                      <TableHead className="text-right">Tiempo Prom.</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentStats.map(stat => (
                      <TableRow key={stat.agent_id}>
                        <TableCell className="font-medium">{stat.agent_name}</TableCell>
                        <TableCell className="text-right">{stat.total_executions}</TableCell>
                        <TableCell className="text-right text-green-600">{stat.success_count}</TableCell>
                        <TableCell className="text-right text-destructive">{stat.error_count}</TableCell>
                        <TableCell className="text-right">{(stat.avg_time_ms / 1000).toFixed(1)}s</TableCell>
                        <TableCell className="text-right">{stat.total_credits}</TableCell>
                      </TableRow>
                    ))}
                    {agentStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No hay datos de ejecución
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar agente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-auto">
                  {filteredExecutions.map(exec => (
                    <div key={exec.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Bot className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{exec.agent_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(exec.execution_time_ms / 1000).toFixed(1)}s • {exec.credits_consumed} créditos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(exec.status)}
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(exec.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {filteredExecutions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No hay ejecuciones</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AdminLayout>
  );
};

export default AdminAgentPerformance;
