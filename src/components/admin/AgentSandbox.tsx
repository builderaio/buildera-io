import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, RotateCcw, AlertTriangle, FlaskConical, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SandboxResultsViewer } from "./SandboxResultsViewer";
import { SandboxInputGenerator, extractVariables, getDefaultValue } from "./SandboxInputGenerator";

interface AgentSandboxProps {
  agentConfig: {
    name: string;
    agent_type: string;
    edge_function_name?: string;
    n8n_config?: {
      webhook_url?: string;
      http_method?: string;
      requires_auth?: boolean;
      timeout_ms?: number;
      output_mappings?: Array<{
        source_path: string;
        target_key: string;
        category: string;
      }>;
    };
    payload_template?: string;
    context_requirements?: {
      needs_strategy?: boolean;
      needs_audiences?: boolean;
      needs_branding?: boolean;
    };
  };
}

interface SandboxResult {
  success: boolean;
  input: Record<string, any>;
  output: Record<string, any>;
  mappings: Array<{
    source_path: string;
    target_key: string;
    category: string;
    value: any;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
  timing: {
    total_ms: number;
    webhook_ms?: number;
    mapping_ms?: number;
  };
  error?: string;
}

export const AgentSandbox = ({ agentConfig }: AgentSandboxProps) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);
  
  // Dynamic input values based on payload_template
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Initialize default values when payload_template changes
  useEffect(() => {
    if (agentConfig.payload_template) {
      const variables = extractVariables(agentConfig.payload_template);
      const defaults: Record<string, string> = {};
      variables.forEach(v => {
        defaults[v.path] = getDefaultValue(v.path);
      });
      setInputValues(defaults);
    }
  }, [agentConfig.payload_template]);

  const resetToDefaults = () => {
    if (agentConfig.payload_template) {
      const variables = extractVariables(agentConfig.payload_template);
      const defaults: Record<string, string> = {};
      variables.forEach(v => {
        defaults[v.path] = getDefaultValue(v.path);
      });
      setInputValues(defaults);
    }
    setResult(null);
    toast({ title: "Datos reseteados a valores predeterminados" });
  };

  const validateConfig = (): string[] => {
    const errors: string[] = [];
    
    if (agentConfig.agent_type === 'n8n') {
      if (!agentConfig.n8n_config?.webhook_url) {
        errors.push("Webhook URL no configurado");
      }
    } else if (agentConfig.agent_type === 'static') {
      if (!agentConfig.edge_function_name) {
        errors.push("Edge Function no configurada");
      }
    }
    
    if (!agentConfig.payload_template) {
      errors.push("Payload Template no definido - configúralo en la pestaña 'Payload'");
    }
    
    return errors;
  };

  const interpolatePayload = (): Record<string, any> => {
    if (!agentConfig.payload_template) {
      return {};
    }

    let template = agentConfig.payload_template;
    
    // Replace {{variable.path}} with actual values from inputValues
    const regex = /\{\{([^}]+)\}\}/g;
    template = template.replace(regex, (match, path) => {
      const trimmedPath = path.trim();
      const value = inputValues[trimmedPath];
      
      if (value !== undefined && value !== '') {
        // Check if value looks like JSON (object or array)
        if ((value.startsWith('{') && value.endsWith('}')) || 
            (value.startsWith('[') && value.endsWith(']'))) {
          return value;
        }
        // Escape quotes for string values
        return JSON.stringify(value).slice(1, -1);
      }
      return match; // Keep original if not found
    });
    
    try {
      return JSON.parse(template);
    } catch (e) {
      console.error('Error parsing interpolated payload:', e);
      return { raw: template, error: 'Invalid JSON after interpolation' };
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    return value;
  };

  const runSandboxTest = async () => {
    const startTime = Date.now();
    const logs: SandboxResult['logs'] = [];
    
    const addLog = (level: 'info' | 'warn' | 'error', message: string) => {
      logs.push({
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level,
        message
      });
    };

    setIsRunning(true);
    setResult(null);

    try {
      addLog('info', 'Iniciando prueba de sandbox...');
      
      // Build payload from inputValues
      const payload = interpolatePayload();
      addLog('info', `Payload construido con ${Object.keys(inputValues).length} variables`);

      addLog('info', `Ejecutando agente tipo: ${agentConfig.agent_type}`);

      // Call sandbox executor
      const webhookStart = Date.now();
      const { data, error } = await supabase.functions.invoke('sandbox-agent-executor', {
        body: {
          agent_type: agentConfig.agent_type,
          agent_name: agentConfig.name,
          edge_function_name: agentConfig.edge_function_name,
          n8n_config: agentConfig.n8n_config,
          payload,
          context: {
            inputValues,
            user: { id: 'sandbox-user-001', email: 'sandbox@test.com' },
            language: 'es'
          }
        }
      });
      const webhookTime = Date.now() - webhookStart;

      if (error) {
        throw error;
      }

      addLog('info', `Ejecutado en ${webhookTime}ms`);

      // Process output mappings
      const mappings: SandboxResult['mappings'] = [];
      if (agentConfig.n8n_config?.output_mappings && data?.output) {
        addLog('info', 'Procesando output mappings...');
        for (const mapping of agentConfig.n8n_config.output_mappings) {
          const value = getNestedValue(data.output, mapping.source_path);
          mappings.push({
            ...mapping,
            value: value ?? '[NO ENCONTRADO]'
          });
        }
        addLog('info', `${mappings.length} mappings procesados`);
      }

      const totalTime = Date.now() - startTime;
      addLog('info', `Prueba completada en ${totalTime}ms`);

      setResult({
        success: data?.success !== false,
        input: payload,
        output: data?.output || data || {},
        mappings,
        logs: [...logs, ...(data?.logs || [])],
        timing: {
          total_ms: totalTime,
          webhook_ms: webhookTime
        },
        error: data?.error
      });

      if (data?.success === false) {
        toast({
          title: "Prueba completada con errores",
          description: data?.error || "Ver logs para más detalles",
          variant: "destructive"
        });
      } else {
        toast({ title: "Prueba ejecutada exitosamente" });
      }

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      addLog('error', `Error: ${error.message}`);
      
      setResult({
        success: false,
        input: interpolatePayload(),
        output: {},
        mappings: [],
        logs,
        timing: { total_ms: totalTime },
        error: error.message
      });

      toast({
        title: "Error en la prueba",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const configErrors = validateConfig();
  const canRun = configErrors.length === 0;
  const hasPayloadTemplate = !!agentConfig.payload_template;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <FlaskConical className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle>Sandbox de Pruebas</CardTitle>
              <CardDescription>
                Prueba tu agente con datos de entrada personalizados. Sin consumir créditos ni afectar datos reales.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {configErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Configuración incompleta:</p>
            <ul className="list-disc list-inside">
              {configErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Input Generator */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Datos de Entrada</CardTitle>
              <Button variant="outline" size="sm" onClick={resetToDefaults} disabled={!hasPayloadTemplate}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetear
              </Button>
            </div>
            {hasPayloadTemplate && (
              <CardDescription className="text-xs">
                Campos generados automáticamente desde tu payload_template
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {hasPayloadTemplate ? (
              <>
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  <SandboxInputGenerator
                    payloadTemplate={agentConfig.payload_template || ''}
                    values={inputValues}
                    onChange={setInputValues}
                  />
                </div>

                {/* Run Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={runSandboxTest}
                    disabled={!canRun || isRunning}
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Ejecutando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ejecutar Prueba Real
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-1">Configura el Payload Template primero</p>
                  <p className="text-sm text-muted-foreground">
                    Ve a la pestaña "Payload" y define el template con variables como{' '}
                    <code className="bg-muted px-1 rounded">{'{{company.name}}'}</code>.
                    Los campos de entrada se generarán automáticamente.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Viewer */}
        <SandboxResultsViewer result={result} isLoading={isRunning} />
      </div>

      {/* Agent Info */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Agente: {agentConfig.name || 'Sin nombre'}</Badge>
            <Badge variant="outline">Tipo: {agentConfig.agent_type}</Badge>
            {agentConfig.agent_type === 'n8n' && agentConfig.n8n_config?.webhook_url && (
              <Badge variant="outline" className="truncate max-w-xs">
                Webhook: {agentConfig.n8n_config.webhook_url}
              </Badge>
            )}
            {agentConfig.agent_type === 'static' && agentConfig.edge_function_name && (
              <Badge variant="outline">Function: {agentConfig.edge_function_name}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
