import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Copy,
  ExternalLink,
  Settings,
  BarChart,
  Code,
  Webhook,
  Monitor
} from 'lucide-react';

interface AgentDeploymentManagerProps {
  templateId: string;
  companyId: string;
}

export function AgentDeploymentManager({ templateId, companyId }: AgentDeploymentManagerProps) {
  const { toast } = useToast();
  const [deployment, setDeployment] = useState<any>(null);
  const [deploymentName, setDeploymentName] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  const handleDeploy = async () => {
    if (!deploymentName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para el deployment",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);

    try {
      const { data, error } = await supabase.functions.invoke('deploy-agent', {
        body: {
          template_id: templateId,
          company_id: companyId,
          deployment_name: deploymentName,
          custom_configuration: {
            additional_instructions: customInstructions
          }
        }
      });

      if (error) throw error;

      setDeployment(data.deployment);
      toast({
        title: "🚀 Agente Desplegado",
        description: "Tu agente está listo y funcionando con APIs y widget disponibles."
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`
    });
  };

  if (deployment) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Agente Desplegado: {deployment.deployment_name}</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success">
                Activo
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Code className="w-4 h-4" />
                  <span>API Chat Endpoint</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={`${window.location.origin}/api/agent/${templateId}/chat`}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/agent/${templateId}/chat`, 'API Endpoint')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center space-x-2">
                  <Webhook className="w-4 h-4" />
                  <span>Webhook URL</span>
                </Label>
                <div className="flex space-x-2">
                  <Input
                    value={`${window.location.origin}/api/agent/${templateId}/webhook`}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/api/agent/${templateId}/webhook`, 'Webhook URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="flex space-x-2">
                <Input
                  value={deployment.api_key || 'ak_***************'}
                  readOnly
                  type="password"
                  className="font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(deployment.api_key, 'API Key')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={() => setShowEmbedCode(!showEmbedCode)}
                className="flex-1"
              >
                <Monitor className="w-4 h-4 mr-2" />
                {showEmbedCode ? 'Ocultar' : 'Mostrar'} Código Widget
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open(`${window.location.origin}/api/agent/${templateId}/widget?api_key=${deployment.api_key}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Probar Widget
              </Button>
            </div>

            {showEmbedCode && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Código de Embebido</Label>
                <Textarea
                  value={deployment.widget_code}
                  readOnly
                  rows={8}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(deployment.widget_code, 'Código Widget')}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código de Embebido
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="w-5 h-5" />
              <span>Métricas de Uso</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{deployment.monthly_usage_count || 0}</div>
                <div className="text-sm text-muted-foreground">Interacciones este mes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">Activo</div>
                <div className="text-sm text-muted-foreground">Estado del agente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">24/7</div>
                <div className="text-sm text-muted-foreground">Disponibilidad</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Configurar Deployment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deployment-name">Nombre del Deployment</Label>
          <Input
            id="deployment-name"
            placeholder="ej. Asistente Principal, Bot de Soporte..."
            value={deploymentName}
            onChange={(e) => setDeploymentName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom-instructions">Instrucciones Personalizadas (Opcional)</Label>
          <Textarea
            id="custom-instructions"
            placeholder="Agrega instrucciones específicas para tu empresa..."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying}
          className="w-full bg-gradient-primary"
        >
          <Bot className="w-4 h-4 mr-2" />
          {isDeploying ? 'Desplegando...' : 'Desplegar Agente'}
        </Button>
      </CardContent>
    </Card>
  );
}