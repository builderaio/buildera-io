import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AgentInstance {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  contextualized_instructions: string;
  status: string;
  tenant_config: any;
  tools_permissions: any;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

const CompanyAgentView = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [agent, setAgent] = useState<AgentInstance | null>(null);
  const [template, setTemplate] = useState<AgentTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      loadAgentData();
    }
  }, [agentId]);

  const loadAgentData = async () => {
    try {
      // Cargar datos del agente
      const { data: agentData, error: agentError } = await supabase
        .from('agent_instances')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError) throw agentError;

      setAgent(agentData);

      // Cargar datos de la plantilla
      const { data: templateData, error: templateError } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('id', agentData.template_id)
        .single();

      if (templateError) throw templateError;

      setTemplate(templateData);
    } catch (error) {
      console.error('Error loading agent data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async () => {
    if (!agent) return;

    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('agent_instances')
        .update({ status: newStatus })
        .eq('id', agent.id);

      if (error) throw error;

      setAgent({ ...agent, status: newStatus });
      
      toast({
        title: "Estado actualizado",
        description: `El agente está ahora ${newStatus === 'active' ? 'activo' : 'inactivo'}`,
      });
    } catch (error) {
      console.error('Error toggling agent status:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del agente",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive':
        return <Pause className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información del agente...</p>
        </div>
      </div>
    );
  }

  if (!agent || !template) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Agente no encontrado</h1>
          <p className="text-muted-foreground mb-4">
            El agente que buscas no existe o no tienes permisos para verlo.
          </p>
          <Button onClick={() => navigate('/company/agents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Agentes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/company/agents')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Mis Agentes
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                {template.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{agent.name}</h1>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline">{template.category}</Badge>
                  <Badge className={getStatusColor(agent.status)}>
                    {getStatusIcon(agent.status)}
                    <span className="ml-1 capitalize">{agent.status}</span>
                  </Badge>
                </div>
                <p className="text-muted-foreground">{template.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleAgentStatus}
                className="flex items-center gap-2"
              >
                {agent.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activar
                  </>
                )}
              </Button>
              
              <Button className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurar
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="configuration">Configuración</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="logs">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Información básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Información del Agente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Creado:</span>
                    <p className="font-medium">{formatDate(agent.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Última actualización:</span>
                    <p className="font-medium">{formatDate(agent.updated_at)}</p>
                  </div>
                  {agent.last_used_at && (
                    <div>
                      <span className="text-sm text-muted-foreground">Último uso:</span>
                      <p className="font-medium">{formatDate(agent.last_used_at)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configuración del tenant */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuración Empresarial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.tenant_config?.company_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Empresa:</span>
                      <p className="font-medium">{agent.tenant_config.company_name}</p>
                    </div>
                  )}
                  {agent.tenant_config?.industry && (
                    <div>
                      <span className="text-sm text-muted-foreground">Industria:</span>
                      <p className="font-medium">{agent.tenant_config.industry}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Interfaces activas:</span>
                    <p className="font-medium">
                      {agent.tenant_config?.interface_configs?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas de rendimiento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Misiones completadas:</span>
                    <p className="font-medium text-2xl text-green-600">0</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tiempo activo:</span>
                    <p className="font-medium">
                      {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Eficiencia:</span>
                    <p className="font-medium">N/A</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Instrucciones Contextualizadas</CardTitle>
                <CardDescription>
                  Instrucciones personalizadas para tu empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {agent.contextualized_instructions}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Herramientas y Permisos</CardTitle>
                <CardDescription>
                  Capacidades disponibles para este agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(agent.tools_permissions) && agent.tools_permissions.map((tool: any) => (
                    <div key={tool.name} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{tool.name.replace('_', ' ')}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {tool.description}
                      </p>
                      <Badge variant={tool.enabled ? "default" : "secondary"}>
                        {tool.enabled ? "Habilitado" : "Deshabilitado"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>
                  Análisis del desempeño del agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Métricas en desarrollo</h3>
                  <p className="text-muted-foreground">
                    Las métricas de rendimiento estarán disponibles próximamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Actividad</CardTitle>
                <CardDescription>
                  Historial de acciones y eventos del agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay actividad registrada</h3>
                  <p className="text-muted-foreground">
                    Los registros de actividad aparecerán aquí cuando el agente comience a trabajar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyAgentView;