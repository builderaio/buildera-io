import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield, BarChart3, Users, TrendingUp, Activity, Calendar, Download, RefreshCw } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ThemeSelector from '@/components/ThemeSelector';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface AnalyticsData {
  userRegistrations: any[];
  platformConnections: any[];
  contentGeneration: any[];
  aiUsage: any[];
  systemMetrics: any[];
}

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    userRegistrations: [],
    platformConnections: [],
    contentGeneration: [],
    aiUsage: [],
    systemMetrics: []
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calcular fechas basadas en el rango seleccionado
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Registros de usuarios por día
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at, user_type')
        .gte('created_at', startDate.toISOString())
        .order('created_at');

      // Conexiones de plataformas
      const { data: linkedinConnections } = await supabase
        .from('linkedin_connections')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: facebookConnections } = await supabase
        .from('facebook_instagram_connections')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const { data: tiktokConnections } = await supabase
        .from('tiktok_connections')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Posts de redes sociales
      const { data: socialPosts } = await supabase
        .from('social_media_posts')
        .select('created_at, platform')
        .gte('created_at', startDate.toISOString());

      // Uso de IA
      const { data: aiLogs } = await supabase
        .from('ai_model_status_logs')
        .select('created_at, provider, name')
        .gte('created_at', startDate.toISOString());

      // Obtener analytics de la nueva tabla
      const { data: systemAnalytics } = await supabase
        .from('system_analytics')
        .select('*')
        .gte('period_start', startDate.toISOString())
        .order('period_start');

      // Si no hay datos, generar algunos usando el edge function
      if (!systemAnalytics || systemAnalytics.length === 0) {
        console.log('No analytics data found, generating...');
        try {
          await supabase.functions.invoke('generate-analytics-data');
          
          // Recargar datos después de generar
          const { data: newAnalytics } = await supabase
            .from('system_analytics')
            .select('*')
            .gte('period_start', startDate.toISOString())
            .order('period_start');
            
          if (newAnalytics) {
            const processedData = processSystemAnalytics(newAnalytics, startDate, endDate);
            setData(processedData);
            toast.success('Analytics generados y cargados correctamente');
            return;
          }
        } catch (error) {
          console.error('Error generating analytics:', error);
          toast.warning('No se pudieron generar analytics, usando datos simulados');
        }
      }

      // Procesar datos reales de analytics
      if (systemAnalytics && systemAnalytics.length > 0) {
        const processedData = processSystemAnalytics(systemAnalytics, startDate, endDate);
        setData(processedData);
        toast.success('Analytics cargados desde base de datos');
      } else {
        // Fallback: usar datos existentes como respaldo
        const processedData = processAnalyticsData({
          profiles: profiles || [],
          linkedinConnections: linkedinConnections || [],
          facebookConnections: facebookConnections || [],
          tiktokConnections: tiktokConnections || [],
          socialPosts: socialPosts || [],
          aiLogs: aiLogs || []
        }, startDate, endDate);
        setData(processedData);
        toast.success('Analytics cargados (datos simulados)');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar los analytics');
    } finally {
      setLoading(false);
    }
  };

  const processSystemAnalytics = (analyticsData: any[], startDate: Date, endDate: Date): AnalyticsData => {
    // Crear array de días en el rango
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Procesar registros de usuarios por día
    const userRegistrations = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      const dayData = analyticsData.find(a => 
        a.metric_name === 'daily_user_registrations' && 
        a.period_start.startsWith(dayStr)
      );
      
      return {
        date: dayStr,
        total: dayData?.metric_value || 0,
        companies: dayData?.metadata?.companies || 0,
        developers: dayData?.metadata?.developers || 0,
        experts: dayData?.metadata?.experts || 0
      };
    });

    // Procesar conexiones de plataformas (totales)
    const linkedinTotal = analyticsData
      .filter(a => a.metric_name === 'daily_linkedin_connections')
      .reduce((sum, a) => sum + a.metric_value, 0);
    
    const facebookTotal = analyticsData
      .filter(a => a.metric_name === 'daily_facebook_connections')
      .reduce((sum, a) => sum + a.metric_value, 0);
    
    const tiktokTotal = analyticsData
      .filter(a => a.metric_name === 'daily_tiktok_connections')
      .reduce((sum, a) => sum + a.metric_value, 0);

    const platformConnections = [
      {
        platform: 'LinkedIn',
        connections: linkedinTotal,
        color: '#0077B5'
      },
      {
        platform: 'Facebook/Instagram',
        connections: facebookTotal,
        color: '#1877F2'
      },
      {
        platform: 'TikTok',
        connections: tiktokTotal,
        color: '#FF0050'
      }
    ];

    // Procesar generación de contenido
    const contentGeneration = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      const dayData = analyticsData.find(a => 
        a.metric_name === 'daily_content_generation' && 
        a.period_start.startsWith(dayStr)
      );
      
      return {
        date: dayStr,
        posts: dayData?.metric_value || 0,
        linkedin: dayData?.metadata?.linkedin || 0,
        facebook: dayData?.metadata?.facebook || 0,
        instagram: dayData?.metadata?.instagram || 0,
        tiktok: dayData?.metadata?.tiktok || 0
      };
    });

    // Procesar uso de IA
    const aiRequests = analyticsData
      .filter(a => a.metric_name === 'daily_ai_requests')
      .reduce((acc, a) => {
        if (a.metadata?.openai) acc.push({ provider: 'OpenAI', requests: a.metadata.openai });
        if (a.metadata?.anthropic) acc.push({ provider: 'Anthropic', requests: a.metadata.anthropic });
        if (a.metadata?.google) acc.push({ provider: 'Google', requests: a.metadata.google });
        return acc;
      }, []);

    // Consolidar requests por proveedor
    const aiUsage = aiRequests.reduce((acc: any, req: any) => {
      const existing = acc.find((item: any) => item.provider === req.provider);
      if (existing) {
        existing.requests += req.requests;
      } else {
        acc.push({ provider: req.provider, requests: req.requests });
      }
      return acc;
    }, []);

    // Métricas del sistema (calculadas)
    const totalUsers = userRegistrations.reduce((sum, day) => sum + day.total, 0);
    const totalConnections = linkedinTotal + facebookTotal + tiktokTotal;
    const totalContent = contentGeneration.reduce((sum, day) => sum + day.posts, 0);
    const totalAIRequests = aiUsage.reduce((sum: number, ai: any) => sum + ai.requests, 0);

    const systemMetrics = [
      { metric: 'Usuarios Totales', value: totalUsers.toString(), status: 'info' },
      { metric: 'Conexiones', value: totalConnections.toString(), status: 'success' },
      { metric: 'Contenido Generado', value: totalContent.toString(), status: 'success' },
      { metric: 'Requests IA', value: totalAIRequests.toString(), status: 'info' }
    ];

    return {
      userRegistrations,
      platformConnections,
      contentGeneration,
      aiUsage,
      systemMetrics
    };
  };

  const processAnalyticsData = (rawData: any, startDate: Date, endDate: Date): AnalyticsData => {
    // Crear array de días en el rango
    const days = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    // Procesar registros de usuarios por día
    const userRegistrations = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      const dayProfiles = rawData.profiles.filter((p: any) => 
        p.created_at.startsWith(dayStr)
      );
      
      return {
        date: dayStr,
        total: dayProfiles.length,
        companies: dayProfiles.filter((p: any) => p.user_type === 'company').length,
        developers: dayProfiles.filter((p: any) => p.user_type === 'developer').length,
        experts: dayProfiles.filter((p: any) => p.user_type === 'expert').length
      };
    });

    // Procesar conexiones de plataformas
    const platformConnections = [
      {
        platform: 'LinkedIn',
        connections: rawData.linkedinConnections.length,
        color: '#0077B5'
      },
      {
        platform: 'Facebook/Instagram',
        connections: rawData.facebookConnections.length,
        color: '#1877F2'
      },
      {
        platform: 'TikTok',
        connections: rawData.tiktokConnections.length,
        color: '#FF0050'
      }
    ];

    // Procesar generación de contenido
    const contentGeneration = days.map(day => {
      const dayStr = day.toISOString().split('T')[0];
      const dayPosts = rawData.socialPosts.filter((p: any) => 
        p.created_at.startsWith(dayStr)
      );
      
      return {
        date: dayStr,
        posts: dayPosts.length,
        linkedin: dayPosts.filter((p: any) => p.platform === 'linkedin').length,
        facebook: dayPosts.filter((p: any) => p.platform === 'facebook').length,
        instagram: dayPosts.filter((p: any) => p.platform === 'instagram').length,
        tiktok: dayPosts.filter((p: any) => p.platform === 'tiktok').length
      };
    });

    // Procesar uso de IA
    const aiUsage = rawData.aiLogs.reduce((acc: any, log: any) => {
      const existing = acc.find((item: any) => item.provider === log.provider);
      if (existing) {
        existing.requests += 1;
      } else {
        acc.push({
          provider: log.provider,
          requests: 1,
          models: [log.name]
        });
      }
      return acc;
    }, []);

    // Métricas del sistema
    const systemMetrics = [
      { metric: 'Uptime', value: '99.8%', status: 'success' },
      { metric: 'Response Time', value: '245ms', status: 'success' },
      { metric: 'Error Rate', value: '0.1%', status: 'success' },
      { metric: 'Active Users', value: rawData.profiles.length.toString(), status: 'info' }
    ];

    return {
      userRegistrations,
      platformConnections,
      contentGeneration,
      aiUsage,
      systemMetrics
    };
  };

  const exportData = () => {
    const exportData = {
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      data: data
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buildera-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Datos exportados correctamente');
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="flex items-center p-2 sm:px-3 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Volver al Dashboard</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center min-w-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Analytics Avanzados</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Portal Admin - Buildera</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <ThemeSelector />
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:block">{user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Reportes y Métricas</h2>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
                <SelectItem value="1y">Último año</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={loadAnalytics} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            
            <Button 
              onClick={async () => {
                setLoading(true);
                try {
                  await supabase.functions.invoke('generate-analytics-data');
                  toast.success('Datos generados correctamente');
                  await loadAnalytics();
                } catch (error) {
                  toast.error('Error al generar datos');
                  setLoading(false);
                }
              }} 
              variant="default" 
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              Generar Datos
            </Button>
            
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Métricas del Sistema */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {data.systemMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.metric}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <Badge variant={metric.status as any} className="text-xs">
                    {metric.status === 'success' ? '✓' : 'ℹ'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Registros de Usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registros de Usuarios
              </CardTitle>
              <CardDescription>Nuevos usuarios registrados por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.userRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="companies" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="developers" stackId="2" stroke="#ffc658" fill="#ffc658" />
                  <Area type="monotone" dataKey="experts" stackId="2" stroke="#ff7300" fill="#ff7300" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Conexiones de Plataformas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Conexiones de Plataformas
              </CardTitle>
              <CardDescription>Distribución de conexiones por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.platformConnections}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ platform, connections }) => `${platform}: ${connections}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="connections"
                  >
                    {data.platformConnections.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generación de Contenido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Generación de Contenido
              </CardTitle>
              <CardDescription>Posts generados por plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.contentGeneration}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <Line type="monotone" dataKey="posts" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="linkedin" stroke="#0077B5" />
                  <Line type="monotone" dataKey="facebook" stroke="#1877F2" />
                  <Line type="monotone" dataKey="instagram" stroke="#E4405F" />
                  <Line type="monotone" dataKey="tiktok" stroke="#FF0050" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Uso de IA */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Uso de Modelos IA
              </CardTitle>
              <CardDescription>Requests por proveedor de IA</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.aiUsage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;