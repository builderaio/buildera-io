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
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  internal_code: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  total_credits: number;
  avg_execution_time: number;
  success_rate: number;
}

interface RecentExecution {
  id: string;
  agent_name: string;
  company_name: string;
  status: string;
  credits_consumed: number;
  execution_time_ms: number;
  created_at: string;
  error_message: string | null;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const AdminAgentUsage: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalExecutions: 0,
    totalCredits: 0,
    avgSuccessRate: 0,
    totalErrors: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadAgentUsageData();
  }, [isAuthenticated, timeRange]);

  const loadAgentUsageData = async () => {
    setLoading(true);
    try {
      // Get date range
      const now = new Date();
      let startDate = new Date();
      switch (timeRange) {
        case '24h': startDate.setHours(now.getHours() - 24); break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
      }

      // Fetch agent usage stats grouped by agent
      const { data: usageData, error: usageError } = await supabase
        .from('agent_usage_log')
        .select(`
          agent_id,
          status,
          credits_consumed,
          execution_time_ms,
          error_message,
          created_at,
          platform_agents!agent_usage_log_agent_id_fkey (
            name,
            internal_code
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      // Process stats by agent
      const statsMap = new Map<string, AgentStats>();
      
      usageData?.forEach((log: any) => {
        const agentId = log.agent_id || 'unknown';
        const agentName = log.platform_agents?.name || 'Unknown Agent';
        const internalCode = log.platform_agents?.internal_code || 'N/A';
        
        if (!statsMap.has(agentId)) {
          statsMap.set(agentId, {
            agent_id: agentId,
            agent_name: agentName,
            internal_code: internalCode,
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            total_credits: 0,
            avg_execution_time: 0,
            success_rate: 0
          });
        }
        
        const stats = statsMap.get(agentId)!;
        stats.total_executions++;
        stats.total_credits += log.credits_consumed || 0;
        stats.avg_execution_time += log.execution_time_ms || 0;
        
        if (log.status === 'completed' || log.status === 'success') {
          stats.successful_executions++;
        } else if (log.status === 'failed' || log.status === 'error') {
          stats.failed_executions++;
        }
      });

      // Calculate averages and success rates
      const agentStatsArray = Array.from(statsMap.values()).map(stats => ({
        ...stats,
        avg_execution_time: stats.total_executions > 0 
          ? Math.round(stats.avg_execution_time / stats.total_executions) 
          : 0,
        success_rate: stats.total_executions > 0 
          ? Math.round((stats.successful_executions / stats.total_executions) * 100) 
          : 0
      })).sort((a, b) => b.total_executions - a.total_executions);

      setAgentStats(agentStatsArray);

      // Calculate totals
      const totals = agentStatsArray.reduce((acc, stats) => ({
        totalExecutions: acc.totalExecutions + stats.total_executions,
        totalCredits: acc.totalCredits + stats.total_credits,
        avgSuccessRate: acc.avgSuccessRate + stats.success_rate,
        totalErrors: acc.totalErrors + stats.failed_executions
      }), { totalExecutions: 0, totalCredits: 0, avgSuccessRate: 0, totalErrors: 0 });

      totals.avgSuccessRate = agentStatsArray.length > 0 
        ? Math.round(totals.avgSuccessRate / agentStatsArray.length) 
        : 0;

      setTotalStats(totals);

      // Get recent executions for table
      const recentData = usageData?.slice(0, 50).map((log: any) => ({
        id: log.id || Math.random().toString(),
        agent_name: log.platform_agents?.name || 'Unknown',
        company_name: 'N/A',
        status: log.status || 'unknown',
        credits_consumed: log.credits_consumed || 0,
        execution_time_ms: log.execution_time_ms || 0,
        created_at: log.created_at,
        error_message: log.error_message
      })) || [];

      setRecentExecutions(recentData);

    } catch (error) {
      console.error('Error loading agent usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <Badge className="bg-green-500/20 text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-600"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Ejecutando</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  const filteredExecutions = recentExecutions.filter(exec => {
    const matchesSearch = exec.agent_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = agentStats.slice(0, 8).map(agent => ({
    name: agent.agent_name.length > 15 ? agent.agent_name.substring(0, 15) + '...' : agent.agent_name,
    executions: agent.total_executions,
    credits: agent.total_credits
  }));

  const pieData = [
    { name: 'Exitosos', value: totalStats.totalExecutions - totalStats.totalErrors },
    { name: 'Fallidos', value: totalStats.totalErrors }
  ];

  if (!isAuthenticated) return null;

  return (
    <AdminLayout>
      <AdminPageHeader 
        title={t('admin:agentUsage.title', 'Uso de Agentes')}
        subtitle={t('admin:agentUsage.description', 'Monitorea el rendimiento y uso de todos los agentes de la plataforma')}
      />

      {/* Time Range Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadAgentUsageData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ejecuciones</p>
                <p className="text-3xl font-bold">{totalStats.totalExecutions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Créditos Consumidos</p>
                <p className="text-3xl font-bold">{totalStats.totalCredits.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-3xl font-bold">{totalStats.avgSuccessRate}%</p>
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
                <p className="text-sm text-muted-foreground">Errores</p>
                <p className="text-3xl font-bold text-destructive">{totalStats.totalErrors}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Uso por Agente</CardTitle>
            <CardDescription>Top agentes por número de ejecuciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar dataKey="executions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasa de Éxito</CardTitle>
            <CardDescription>Distribución de resultados</CardDescription>
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
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Exitosos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm">Fallidos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Stats Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Estadísticas por Agente</CardTitle>
          <CardDescription>Métricas detalladas de cada agente</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Ejecuciones</TableHead>
                <TableHead className="text-right">Créditos</TableHead>
                <TableHead className="text-right">Tiempo Prom.</TableHead>
                <TableHead className="text-right">Tasa Éxito</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentStats.map((agent) => (
                <TableRow key={agent.agent_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      {agent.agent_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {agent.internal_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{agent.total_executions}</TableCell>
                  <TableCell className="text-right">{agent.total_credits}</TableCell>
                  <TableCell className="text-right">{agent.avg_execution_time}ms</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {agent.success_rate >= 80 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                      <span className={agent.success_rate >= 80 ? 'text-green-500' : 'text-destructive'}>
                        {agent.success_rate}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {agentStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay datos de uso de agentes en este período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ejecuciones Recientes</CardTitle>
              <CardDescription>Últimas 50 ejecuciones de agentes</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar agente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                  <SelectItem value="failed">Fallidos</SelectItem>
                  <SelectItem value="running">Ejecutando</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Créditos</TableHead>
                <TableHead className="text-right">Duración</TableHead>
                <TableHead className="text-right">Tiempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExecutions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">{execution.agent_name}</TableCell>
                  <TableCell>{getStatusBadge(execution.status)}</TableCell>
                  <TableCell className="text-right">{execution.credits_consumed}</TableCell>
                  <TableCell className="text-right">{execution.execution_time_ms}ms</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatTimeAgo(execution.created_at)}
                  </TableCell>
                </TableRow>
              ))}
              {filteredExecutions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se encontraron ejecuciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminAgentUsage;
