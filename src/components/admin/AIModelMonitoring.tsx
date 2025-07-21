import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ModelStatus {
  provider: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorRate: number;
}

interface HistoricalData {
  timestamp: string;
  provider: string;
  responseTime: number;
  uptime: number;
  status: string;
}


const AIModelMonitoring = () => {
  const [latestStatus, setLatestStatus] = useState<Record<string, ModelStatus>>({});
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadModelStatuses = async () => {
    setLoading(true);
    try {
      // Cargar el último registro por proveedor
      const { data: latestData, error: latestError } = await supabase
        .from('ai_model_status_logs')
        .select('*')
        .order('last_checked', { ascending: false });

      if (latestError) throw latestError;

      // Obtener el último registro por proveedor
      const latestByProvider: Record<string, ModelStatus> = {};
      latestData?.forEach(log => {
        if (!latestByProvider[log.provider]) {
          latestByProvider[log.provider] = {
            provider: log.provider,
            name: log.name,
            status: log.status as ModelStatus['status'],
            responseTime: log.response_time,
            lastChecked: log.last_checked,
            uptime: log.uptime,
            errorRate: log.error_rate
          };
        }
      });

      setLatestStatus(latestByProvider);

      // Cargar datos históricos (últimos 24 registros para la gráfica)
      const { data: historicalData, error: historicalError } = await supabase
        .from('ai_model_status_logs')
        .select('provider, response_time, uptime, status, last_checked')
        .order('last_checked', { ascending: false })
        .limit(100);

      if (historicalError) throw historicalError;

      const formattedHistorical: HistoricalData[] = historicalData?.map(log => ({
        timestamp: new Date(log.last_checked).toLocaleTimeString(),
        provider: log.provider,
        responseTime: log.response_time,
        uptime: log.uptime,
        status: log.status
      })) || [];

      setHistoricalData(formattedHistorical);
      setLastRefresh(new Date());
      
      const providerCount = Object.keys(latestByProvider).length;
      if (providerCount > 0) {
        toast.success(`Estado de ${providerCount} proveedores cargado`);
      } else {
        toast.info('No hay datos de monitoreo disponibles');
      }
    } catch (error) {
      console.error('Error loading model statuses:', error);
      toast.error('Error al cargar el estado de los modelos');
    } finally {
      setLoading(false);
    }
  };

  const triggerModelMonitoring = async () => {
    setLoading(true);
    try {
      // Llamar al edge function que ejecuta el monitoreo y actualiza la base de datos
      const { error } = await supabase.functions.invoke('ai-model-monitoring');
      
      if (error) throw error;
      
      // Recargar datos de la base de datos después del monitoreo
      setTimeout(() => {
        loadModelStatuses();
      }, 2000); // Esperar 2 segundos para que se procesen los datos
      
      toast.success('Monitoreo ejecutado correctamente');
    } catch (error) {
      console.error('Error triggering model monitoring:', error);
      toast.error('Error al ejecutar el monitoreo');
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ModelStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ModelStatus['status']) => {
    const variants = {
      online: 'default',
      degraded: 'secondary', 
      offline: 'destructive',
      maintenance: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status === 'online' ? 'En línea' : 
         status === 'degraded' ? 'Degradado' :
         status === 'offline' ? 'Fuera de línea' : 'Mantenimiento'}
      </Badge>
    );
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 500) return 'text-green-600';
    if (time < 1000) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    loadModelStatuses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoreo de Modelos IA</h2>
          <p className="text-muted-foreground">
            Estado de los modelos configurados en funciones de negocio (actualizado por job programado)
          </p>
          {Object.keys(latestStatus).length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Mostrando el último estado registrado por proveedor
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Última actualización: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            onClick={loadModelStatuses} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar Datos
          </Button>
          <Button 
            onClick={triggerModelMonitoring} 
            disabled={loading}
            variant="default"
            size="sm"
          >
            <Activity className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Ejecutar Monitoreo
          </Button>
        </div>
      </div>

      {Object.keys(latestStatus).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos de monitoreo</h3>
            <p className="text-muted-foreground mb-4">
              No se han encontrado datos de monitoreo de modelos IA
            </p>
            <Button onClick={loadModelStatuses} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recargar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Estado actual por proveedor */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(latestStatus).map(([provider, status]) => (
              <Card key={provider}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    {provider}
                  </CardTitle>
                  <CardDescription>
                    Último estado registrado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    {getStatusBadge(status.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Modelo</span>
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tiempo de respuesta</span>
                    <span className={`text-sm font-medium ${getResponseTimeColor(status.responseTime)}`}>
                      {status.responseTime}ms
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Disponibilidad</span>
                    <span className="text-sm font-medium">{status.uptime.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tasa de error</span>
                    <span className="text-sm font-medium">{status.errorRate.toFixed(2)}%</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Última verificación: {new Date(status.lastChecked).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfica histórica */}
          {historicalData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Histórico de Tiempo de Respuesta
                </CardTitle>
                <CardDescription>
                  Evolución del tiempo de respuesta por proveedor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        fontSize={12}
                        label={{ value: 'Tiempo (ms)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        labelFormatter={(value) => `Hora: ${value}`}
                        formatter={(value, name) => [`${value}ms`, `${name}`]}
                      />
                      {Object.keys(latestStatus).map((provider, index) => (
                        <Line
                          key={provider}
                          type="monotone"
                          dataKey="responseTime"
                          data={historicalData.filter(d => d.provider === provider)}
                          stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                          strokeWidth={2}
                          name={provider}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AIModelMonitoring;