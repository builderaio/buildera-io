import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AgentDeploymentManager } from "@/components/ai-workforce/AgentDeploymentManager";
import { ArrowLeft, Bot, Settings, Activity, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AgentInstance {
  id: string;
  name: string;
  status: string;
  contextualized_instructions: string;
  openai_agent_id: string | null;
  tools_permissions: any;
  tenant_config: any;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

interface AgentConversation {
  id: string;
  title: string;
  status: string;
  created_at: string;
  messages: any; // JSON array from Supabase
}

export default function AgentInstanceView() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agentInstance, setAgentInstance] = useState<AgentInstance | null>(null);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (agentId) {
      loadAgentInstance();
      loadConversations();
    }
  }, [agentId]);

  const loadAgentInstance = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_instances')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;

      setAgentInstance(data);
    } catch (error) {
      console.error('Error loading agent instance:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el agente",
        variant: "destructive",
      });
      navigate('/ai-workforce');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setConversations((data || []).map(conv => ({
        ...conv,
        messages: Array.isArray(conv.messages) ? conv.messages : []
      })));
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agentInstance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/ai-workforce')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a AI Workforce
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{agentInstance.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {agentInstance.contextualized_instructions.substring(0, 150)}...
                </p>
              </div>
            </div>
            <Badge variant={agentInstance.status === 'active' ? 'default' : 'secondary'}>
              {agentInstance.status}
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="deployments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deployments" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversaciones
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deployments">
            <AgentDeploymentManager agentInstance={agentInstance} />
          </TabsContent>

          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Conversaciones</CardTitle>
                <CardDescription>
                  Últimas conversaciones con este agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay conversaciones aún
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation) => (
                      <Card key={conversation.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {conversation.title}
                            </CardTitle>
                            <Badge variant="outline">
                              {conversation.messages.length} mensajes
                            </Badge>
                          </div>
                          <CardDescription>
                            {new Date(conversation.created_at).toLocaleString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {conversation.messages[0]?.content.substring(0, 200)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Métricas de uso y rendimiento del agente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Próximamente: Analytics detallados
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Agente</CardTitle>
                <CardDescription>
                  Ajusta los parámetros del agente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Estado</h4>
                  <Badge>{agentInstance.status}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">OpenAI Agent ID</h4>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {agentInstance.openai_agent_id || 'No configurado'}
                  </code>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Última Actividad</h4>
                  <p className="text-sm text-muted-foreground">
                    {agentInstance.last_used_at 
                      ? new Date(agentInstance.last_used_at).toLocaleString()
                      : 'Nunca usado'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Instrucciones</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {agentInstance.contextualized_instructions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
