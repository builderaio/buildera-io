import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Activity, 
  FileText, 
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AgentInstance {
  id: string;
  name: string;
  status: string;
  last_used_at: string;
  created_at: string;
  template: {
    name: string;
    icon: string;
    category: string;
  };
  _count?: {
    missions: number;
    knowledge_files: number;
  };
}

interface Mission {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  progress: number;
  created_at: string;
  started_at: string;
  completed_at: string;
  agent_instance: {
    name: string;
  };
}

const CompanyAgents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<AgentInstance[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('agents');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Cargar agentes del usuario con información de la plantilla
      const { data: agentsData, error: agentsError } = await supabase
        .from('agent_instances')
        .select(`
          *,
          template:agent_templates(name, icon, category)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (agentsError) throw agentsError;

      // Cargar misiones recientes
      const { data: missionsData, error: missionsError } = await supabase
        .from('agent_missions')
        .select(`
          *,
          agent_instance:agent_instances(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (missionsError) throw missionsError;

      setAgents(agentsData || []);
      setMissions(missionsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('agent_instances')
        .update({ status: newStatus })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `Agente ${newStatus === 'active' ? 'activado' : 'pausado'}`,
      });

      loadData();
    } catch (error) {
      console.error('Error updating agent status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del agente",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'terminated':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMissionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Agentes IA</h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tu equipo de agentes autónomos y sus misiones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/marketplace/agents')}>
            <Plus className="w-4 h-4 mr-2" />
            Contratar Agente
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="missions">Misiones</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-lg">{agent.template?.icon || '🤖'}</span>
                            </div>
                            <div>
                              <CardTitle className="text-lg">{agent.name}</CardTitle>
                              <Badge variant="outline" className="text-xs mt-1">
                                {agent.template?.category || 'General'}
                              </Badge>
                            </div>
                          </div>
                          {getStatusIcon(agent.status)}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Estado:</span>
                          <span className="capitalize">{agent.status}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Último uso:</span>
                          <span>{agent.last_used_at ? formatDate(agent.last_used_at) : 'Nunca'}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Creado:</span>
                          <span>{formatDate(agent.created_at)}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/company/agents/${agent.id}`)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Gestionar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAgentStatus(agent.id, agent.status)}
                          >
                            {agent.status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No tienes agentes contratados</h3>
                <p className="text-muted-foreground mb-4">
                  Visita el marketplace para contratar tu primer agente
                </p>
                <Button onClick={() => navigate('/marketplace/agents')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ir al Marketplace
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="missions" className="space-y-6">
            {missions.length > 0 ? (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <Card key={mission.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{mission.title}</h3>
                              {getMissionStatusIcon(mission.status)}
                              <Badge variant="outline" className={getPriorityColor(mission.priority)}>
                                Prioridad {mission.priority}
                              </Badge>
                            </div>
                            
                            <p className="text-muted-foreground text-sm line-clamp-2">
                              {mission.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Agente: {mission.agent_instance?.name}</span>
                              <span>Creado: {formatDate(mission.created_at)}</span>
                              {mission.status === 'running' && (
                                <span>Progreso: {mission.progress}%</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/company/missions/${mission.id}`)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay misiones asignadas</h3>
                  <p className="text-muted-foreground mb-4">
                    Asigna misiones a tus agentes para que empiecen a trabajar
                  </p>
                  {agents.length > 0 && (
                    <Button onClick={() => navigate(`/company/agents/${agents[0].id}`)}>
                      <Target className="w-4 h-4 mr-2" />
                      Asignar Primera Misión
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Bot className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{agents.length}</p>
                        <p className="text-sm text-muted-foreground">Agentes Activos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Target className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{missions.length}</p>
                        <p className="text-sm text-muted-foreground">Misiones Totales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {missions.filter(m => m.status === 'completed').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Completadas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2">
                      <Activity className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {missions.filter(m => m.status === 'running').length}
                        </p>
                        <p className="text-sm text-muted-foreground">En Progreso</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
  );
};

export default CompanyAgents;