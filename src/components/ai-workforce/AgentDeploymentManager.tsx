import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  Rocket, 
  MessageSquare, 
  Code, 
  Mail, 
  BarChart3, 
  Copy, 
  Eye, 
  Settings,
  ExternalLink,
  Check
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AgentInstance {
  id: string;
  name: string;
  status: string;
  contextualized_instructions: string;
  openai_agent_id: string | null;
}

interface Deployment {
  id: string;
  deployment_name: string;
  status: string;
  chat_url: string;
  api_url: string;
  widget_url: string;
  dashboard_url: string;
  widget_embed_code: string;
  api_documentation: string;
  branding_config: any;
  created_at: string;
}

export function AgentDeploymentManager({ agentInstance }: { agentInstance: AgentInstance }) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [deploymentName, setDeploymentName] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['web_chat', 'api']);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const availableChannels = [
    { id: 'web_chat', label: 'Chat Web', icon: MessageSquare },
    { id: 'api', label: 'API/Webhook', icon: Code },
    { id: 'email', label: 'Email Monitor', icon: Mail },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  useEffect(() => {
    loadDeployments();
  }, [agentInstance.id]);

  const loadDeployments = async () => {
    const { data, error } = await supabase
      .from('agent_deployment_instances')
      .select('*')
      .eq('agent_instance_id', agentInstance.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading deployments:', error);
      return;
    }

    setDeployments(data || []);
  };

  const handleDeploy = async () => {
    if (!deploymentName.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un nombre para el deployment",
        variant: "destructive",
      });
      return;
    }

    if (selectedChannels.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un canal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('Deploying agent:', agentInstance.id);

    try {
      // Obtener la empresa principal del usuario
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated');

      const { data: companyMember } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single();

      if (!companyMember) {
        throw new Error('No primary company found');
      }

      const { data, error } = await supabase.functions.invoke('deploy-agent-instance', {
        body: {
          agent_instance_id: agentInstance.id,
          company_id: companyMember.company_id,
          deployment_name: deploymentName,
          channels: selectedChannels,
          branding_config: {
            welcome_message: `¡Hola! Soy ${agentInstance.name}, ¿en qué puedo ayudarte?`,
          }
        }
      });

      if (error) throw error;

      console.log('Deployment successful:', data);

      toast({
        title: "¡Deployment exitoso!",
        description: `${agentInstance.name} ha sido desplegado correctamente`,
      });

      setShowDeployDialog(false);
      setDeploymentName("");
      setSelectedChannels(['web_chat', 'api']);
      loadDeployments();

    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: "Error en deployment",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(label);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deployments</h3>
          <p className="text-sm text-muted-foreground">
            Despliega tu agente en múltiples canales
          </p>
        </div>
        <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
          <DialogTrigger asChild>
            <Button>
              <Rocket className="mr-2 h-4 w-4" />
              Nuevo Deployment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Desplegar Agente</DialogTitle>
              <DialogDescription>
                Configura los canales donde estará disponible tu agente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="deployment-name">Nombre del Deployment</Label>
                <Input
                  id="deployment-name"
                  placeholder="Ej: Producción, Testing, Cliente XYZ"
                  value={deploymentName}
                  onChange={(e) => setDeploymentName(e.target.value)}
                />
              </div>

              <div>
                <Label>Canales de Comunicación</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {availableChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel.id}
                        checked={selectedChannels.includes(channel.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedChannels([...selectedChannels, channel.id]);
                          } else {
                            setSelectedChannels(selectedChannels.filter(c => c !== channel.id));
                          }
                        }}
                      />
                      <Label htmlFor={channel.id} className="flex items-center cursor-pointer">
                        <channel.icon className="mr-2 h-4 w-4" />
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleDeploy} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Desplegando..." : "Desplegar Agente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {deployments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay deployments activos.<br />
              Crea tu primer deployment para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <Card key={deployment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{deployment.deployment_name}</CardTitle>
                    <CardDescription>
                      Creado {new Date(deployment.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={deployment.status === 'active' ? 'default' : 'secondary'}>
                    {deployment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="urls">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="urls">URLs</TabsTrigger>
                    <TabsTrigger value="embed">Código Embed</TabsTrigger>
                    <TabsTrigger value="api">API Docs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="urls" className="space-y-3">
                    {deployment.chat_url && (
                      <div className="flex items-center gap-2">
                        <Input value={deployment.chat_url} readOnly />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(deployment.chat_url, 'Chat URL')}
                        >
                          {copiedUrl === 'Chat URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(deployment.chat_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {deployment.api_url && (
                      <div className="flex items-center gap-2">
                        <Input value={deployment.api_url} readOnly />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(deployment.api_url, 'API URL')}
                        >
                          {copiedUrl === 'API URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                    {deployment.dashboard_url && (
                      <div className="flex items-center gap-2">
                        <Input value={deployment.dashboard_url} readOnly />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(deployment.dashboard_url, 'Dashboard URL')}
                        >
                          {copiedUrl === 'Dashboard URL' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(deployment.dashboard_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="embed">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{deployment.widget_embed_code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(deployment.widget_embed_code, 'Código Embed')}
                      >
                        {copiedUrl === 'Código Embed' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="api">
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                        <code>{deployment.api_documentation}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(deployment.api_documentation, 'API Docs')}
                      >
                        {copiedUrl === 'API Docs' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
