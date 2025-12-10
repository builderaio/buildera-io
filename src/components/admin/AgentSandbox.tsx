import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Play, RotateCcw, AlertTriangle, FlaskConical, Building2, Target, Users, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SandboxResultsViewer } from "./SandboxResultsViewer";
import { 
  DUMMY_COMPANY, 
  DUMMY_STRATEGY, 
  DUMMY_AUDIENCES, 
  DUMMY_BRANDING,
  getAllDummyData 
} from "./SandboxDummyData";

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
  
  // Editable dummy data
  const [companyData, setCompanyData] = useState(JSON.stringify(DUMMY_COMPANY, null, 2));
  const [strategyData, setStrategyData] = useState(JSON.stringify(DUMMY_STRATEGY, null, 2));
  const [audiencesData, setAudiencesData] = useState(JSON.stringify(DUMMY_AUDIENCES, null, 2));
  const [brandingData, setBrandingData] = useState(JSON.stringify(DUMMY_BRANDING, null, 2));

  const resetToDefaults = () => {
    setCompanyData(JSON.stringify(DUMMY_COMPANY, null, 2));
    setStrategyData(JSON.stringify(DUMMY_STRATEGY, null, 2));
    setAudiencesData(JSON.stringify(DUMMY_AUDIENCES, null, 2));
    setBrandingData(JSON.stringify(DUMMY_BRANDING, null, 2));
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
      errors.push("Payload Template no definido");
    }
    
    return errors;
  };

  const parseJsonSafely = (jsonString: string, fieldName: string): any => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      throw new Error(`Error parseando ${fieldName}: ${e}`);
    }
  };

  const interpolateTemplate = (template: string, context: Record<string, any>): Record<string, any> => {
    let result = template;
    
    // Replace {{variable.path}} with actual values
    const regex = /\{\{([^}]+)\}\}/g;
    result = result.replace(regex, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = context;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match; // Keep original if path not found
        }
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    });
    
    try {
      return JSON.parse(result);
    } catch {
      return { raw: result };
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
      
      // Parse dummy data
      const company = parseJsonSafely(companyData, 'Company');
      const strategy = parseJsonSafely(strategyData, 'Strategy');
      const audiences = parseJsonSafely(audiencesData, 'Audiences');
      const branding = parseJsonSafely(brandingData, 'Branding');
      
      addLog('info', 'Datos dummy parseados correctamente');

      // Build context
      const context = {
        company,
        strategy,
        audiences,
        branding,
        user: { id: 'sandbox-user-001', email: 'sandbox@test.com' },
        language: 'es'
      };

      // Interpolate payload template
      let payload: Record<string, any>;
      if (agentConfig.payload_template) {
        payload = interpolateTemplate(agentConfig.payload_template, context);
        addLog('info', 'Payload template interpolado');
      } else {
        payload = context;
        addLog('warn', 'No hay payload template, usando contexto completo');
      }

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
          context
        }
      });
      const webhookTime = Date.now() - webhookStart;

      if (error) {
        throw error;
      }

      addLog('info', `Webhook ejecutado en ${webhookTime}ms`);

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
        success: true,
        input: payload,
        output: data?.output || data || {},
        mappings,
        logs,
        timing: {
          total_ms: totalTime,
          webhook_ms: webhookTime
        }
      });

      toast({ title: "Prueba ejecutada exitosamente" });

    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      addLog('error', `Error: ${error.message}`);
      
      setResult({
        success: false,
        input: {},
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
                Prueba tu agente con datos dummy antes de publicarlo. Sin consumir créditos ni afectar datos reales.
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
        {/* Dummy Data Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Datos de Prueba</CardTitle>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="company" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  Empresa
                </TabsTrigger>
                <TabsTrigger value="strategy" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Estrategia
                </TabsTrigger>
                <TabsTrigger value="audiences" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Audiencias
                </TabsTrigger>
                <TabsTrigger value="branding" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" />
                  Branding
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Datos de la empresa (JSON)
                </Label>
                <Textarea
                  value={companyData}
                  onChange={(e) => setCompanyData(e.target.value)}
                  className="font-mono text-xs h-[300px]"
                  placeholder="JSON de datos de empresa..."
                />
              </TabsContent>

              <TabsContent value="strategy" className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Datos de estrategia (JSON)
                </Label>
                <Textarea
                  value={strategyData}
                  onChange={(e) => setStrategyData(e.target.value)}
                  className="font-mono text-xs h-[300px]"
                  placeholder="JSON de estrategia..."
                />
              </TabsContent>

              <TabsContent value="audiences" className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Datos de audiencias (JSON)
                </Label>
                <Textarea
                  value={audiencesData}
                  onChange={(e) => setAudiencesData(e.target.value)}
                  className="font-mono text-xs h-[300px]"
                  placeholder="JSON de audiencias..."
                />
              </TabsContent>

              <TabsContent value="branding" className="mt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Datos de branding (JSON)
                </Label>
                <Textarea
                  value={brandingData}
                  onChange={(e) => setBrandingData(e.target.value)}
                  className="font-mono text-xs h-[300px]"
                  placeholder="JSON de branding..."
                />
              </TabsContent>
            </Tabs>

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
                    Ejecutar Prueba
                  </>
                )}
              </Button>
              {!canRun && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Completa la configuración del agente primero
                </p>
              )}
            </div>
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
