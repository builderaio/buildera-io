import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ModelStatus {
  provider: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorRate: number;
}


const AIModelMonitoring = () => {
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const loadModelStatuses = async () => {
    setLoading(true);
    try {
      // Cargar datos de la base de datos desde la tabla ai_model_status_logs
      const { data, error } = await supabase
        .from('ai_model_status_logs')
        .select('*')
        .order('last_checked', { ascending: false });

      if (error) throw error;

      const formattedStatuses: ModelStatus[] = data?.map(log => ({
        provider: log.provider,
        name: log.name,
        status: log.status as ModelStatus['status'],
        responseTime: log.response_time,
        lastChecked: log.last_checked,
        uptime: log.uptime,
        errorRate: log.error_rate
      })) || [];

      setModelStatuses(formattedStatuses);
      setLastRefresh(new Date());
      toast.success('Estado de modelos cargado desde base de datos');
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
    // Solo cargar datos al montar el componente, sin intervalos automáticos
    loadModelStatuses();
  }, []);

  const groupedStatuses = modelStatuses.reduce((acc, status) => {
    if (!acc[status.provider]) {
      acc[status.provider] = [];
    }
    acc[status.provider].push(status);
    return acc;
  }, {} as Record<string, ModelStatus[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Monitoreo de Modelos IA</h2>
          <p className="text-muted-foreground">
            Estado de los proveedores de IA (actualizado por job programado)
          </p>
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

      {Object.entries(groupedStatuses).map(([provider, statuses]) => (
        <Card key={provider}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {provider}
              <Badge variant="outline" className="ml-auto">
                {statuses.filter(s => s.status === 'online').length}/{statuses.length} activos
              </Badge>
            </CardTitle>
            <CardDescription>
              Estado de los modelos de {provider}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {statuses.map((status, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.status)}
                    <div>
                      <div className="font-medium">{status.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Última verificación: {new Date(status.lastChecked).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getResponseTimeColor(status.responseTime)}`}>
                        {status.responseTime}ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tiempo de respuesta
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {status.uptime.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Disponibilidad
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {status.errorRate.toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tasa de error
                      </div>
                    </div>
                    
                    {getStatusBadge(status.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AIModelMonitoring;