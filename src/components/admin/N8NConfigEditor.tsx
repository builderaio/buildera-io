import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Shield, Clock, Code } from "lucide-react";

export interface N8NConfig {
  webhook_url: string;
  http_method: 'GET' | 'POST';
  requires_auth: boolean;
  timeout_ms: number;
  input_schema?: Record<string, any>;
  output_mappings?: Array<{
    source_path: string;
    target_key: string;
    category: string;
  }>;
}

interface N8NConfigEditorProps {
  config: N8NConfig;
  onChange: (config: N8NConfig) => void;
}

export const N8NConfigEditor = ({ config, onChange }: N8NConfigEditorProps) => {
  const updateConfig = (updates: Partial<N8NConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Configuración del Webhook
          </CardTitle>
          <CardDescription>
            Define la URL y método HTTP del webhook de n8n.io
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">URL del Webhook *</Label>
            <Input
              id="webhook_url"
              placeholder="https://buildera.app.n8n.cloud/webhook/mi-agente"
              value={config.webhook_url}
              onChange={(e) => updateConfig({ webhook_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              La URL completa del webhook de n8n.io que procesará las solicitudes
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="http_method">Método HTTP</Label>
              <Select
                value={config.http_method}
                onValueChange={(value: 'GET' | 'POST') => updateConfig({ http_method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST (recomendado)</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout_ms" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeout (ms)
              </Label>
              <Input
                id="timeout_ms"
                type="number"
                min={5000}
                max={600000}
                value={config.timeout_ms}
                onChange={(e) => updateConfig({ timeout_ms: parseInt(e.target.value) || 300000 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticación
          </CardTitle>
          <CardDescription>
            Configura la autenticación para llamadas al webhook
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Requiere Autenticación</Label>
              <p className="text-xs text-muted-foreground">
                Usa las credenciales N8N_AUTH_USER y N8N_AUTH_PASS para Basic Auth
              </p>
            </div>
            <Switch
              checked={config.requires_auth}
              onCheckedChange={(checked) => updateConfig({ requires_auth: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Payload Automático
          </CardTitle>
          <CardDescription>
            Estos campos se envían automáticamente con cada solicitud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <pre className="text-muted-foreground">
{`{
  "company_id": "uuid",      // ID de la empresa
  "user_id": "uuid",         // ID del usuario
  "language": "es|en|pt",    // Idioma del usuario
  "agent_id": "uuid",        // ID del agente
  "timestamp": "ISO8601",    // Momento de ejecución
  ...input_data              // Datos del payload template
}`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Configura campos adicionales en la pestaña "Payload" usando el editor de templates
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
