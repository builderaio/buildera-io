import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ModelStatus {
  provider: string;
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorRate: number;
}

const AI_PROVIDERS = [
  {
    provider: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo'],
    statusUrl: 'https://status.openai.com/api/v2/status.json'
  },
  {
    provider: 'Anthropic', 
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    statusUrl: 'https://status.anthropic.com/api/v2/status.json'
  },
  {
    provider: 'Google',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
    statusUrl: 'https://status.cloud.google.com/incidents.json'
  },
  {
    provider: 'xAI',
    models: ['grok-beta', 'grok-1'],
    statusUrl: null // No public status API
  }
];

const AIModelMonitoring = () => {
  const [modelStatuses, setModelStatuses] = useState<ModelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const checkModelStatuses = async () => {
    setLoading(true);
    try {
      const statuses: ModelStatus[] = [];
      
      for (const provider of AI_PROVIDERS) {
        for (const model of provider.models) {
          // Simular check de status (en producción, estos serían llamadas reales a APIs de status)
          const mockStatus = await simulateStatusCheck(provider.provider, model);
          statuses.push(mockStatus);
        }
      }
      
      setModelStatuses(statuses);
      setLastRefresh(new Date());
      toast.success('Estado de modelos actualizado');
    } catch (error) {
      console.error('Error checking model statuses:', error);
      toast.error('Error al verificar el estado de los modelos');
    } finally {
      setLoading(false);
    }
  };

  const simulateStatusCheck = async (provider: string, model: string): Promise<ModelStatus> => {
    // Simular latencia de red
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simular diferentes estados
    const statuses: ModelStatus['status'][] = ['online', 'online', 'online', 'degraded', 'offline'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      provider,
      name: model,
      status: randomStatus,
      responseTime: Math.floor(Math.random() * 2000 + 100),
      lastChecked: new Date().toISOString(),
      uptime: Math.random() * 100,
      errorRate: Math.random() * 5
    };
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
    checkModelStatuses();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(checkModelStatuses, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
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
            Estado en tiempo real de los proveedores de IA
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Última actualización: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button 
            onClick={checkModelStatuses} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
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