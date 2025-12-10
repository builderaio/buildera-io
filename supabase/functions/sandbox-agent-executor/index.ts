import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SandboxRequest {
  agent_type: 'static' | 'n8n' | 'dynamic' | 'hybrid';
  agent_name: string;
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
  payload: Record<string, any>;
  context: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const logs: string[] = [];
  
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    logs.push(`[${timestamp}] ${message}`);
    console.log(`[SANDBOX] ${message}`);
  };

  try {
    const request: SandboxRequest = await req.json();
    log(`Iniciando sandbox para agente: ${request.agent_name} (${request.agent_type})`);

    let output: Record<string, any> = {};
    let webhookTime = 0;

    if (request.agent_type === 'n8n') {
      // Execute N8N webhook
      if (!request.n8n_config?.webhook_url) {
        throw new Error('N8N webhook URL no configurado');
      }

      log(`Llamando webhook: ${request.n8n_config.webhook_url}`);
      
      const method = request.n8n_config.http_method?.toUpperCase() || 'POST';
      const timeout = request.n8n_config.timeout_ms || 30000;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add basic auth if required
      if (request.n8n_config.requires_auth) {
        const authUser = Deno.env.get('N8N_AUTH_USER');
        const authPass = Deno.env.get('N8N_AUTH_PASS');
        if (authUser && authPass) {
          const credentials = btoa(`${authUser}:${authPass}`);
          headers['Authorization'] = `Basic ${credentials}`;
          log('Autenticación básica añadida');
        } else {
          log('ADVERTENCIA: requires_auth=true pero credenciales no configuradas');
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const webhookStart = Date.now();
      try {
        const response = await fetch(request.n8n_config.webhook_url, {
          method,
          headers,
          body: method !== 'GET' ? JSON.stringify(request.payload) : undefined,
          signal: controller.signal,
        });

        webhookTime = Date.now() - webhookStart;
        clearTimeout(timeoutId);

        log(`Webhook respondió con status: ${response.status} en ${webhookTime}ms`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Webhook error: ${response.status} - ${errorText}`);
        }

        const responseText = await response.text();
        try {
          output = JSON.parse(responseText);
        } catch {
          output = { raw_response: responseText };
        }

        log(`Respuesta parseada correctamente`);

      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error(`Timeout después de ${timeout}ms`);
        }
        throw fetchError;
      }

    } else if (request.agent_type === 'static') {
      // Simulate edge function call
      log(`Simulando edge function: ${request.edge_function_name}`);
      
      // For sandbox, we return simulated output based on the function name
      output = {
        success: true,
        message: `[SANDBOX] Edge function '${request.edge_function_name}' ejecutada correctamente`,
        simulated: true,
        received_payload: request.payload,
        timestamp: new Date().toISOString()
      };
      
      log('Edge function simulada (no ejecutada realmente en sandbox)');

    } else if (request.agent_type === 'dynamic' || request.agent_type === 'hybrid') {
      // Simulate OpenAI agent
      log(`Simulando agente ${request.agent_type}`);
      
      output = {
        success: true,
        message: `[SANDBOX] Agente ${request.agent_type} simulado`,
        simulated: true,
        note: 'Los agentes dinámicos/híbridos requieren configuración de OpenAI para ejecución real',
        received_payload: request.payload,
        timestamp: new Date().toISOString()
      };
      
      log('Agente dinámico/híbrido simulado');
    }

    const totalTime = Date.now() - startTime;
    log(`Sandbox completado en ${totalTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        output,
        metadata: {
          agent_type: request.agent_type,
          agent_name: request.agent_name,
          execution_time_ms: totalTime,
          webhook_time_ms: webhookTime,
          is_sandbox: true,
          logs
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    log(`ERROR: ${error.message}`);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          execution_time_ms: totalTime,
          is_sandbox: true,
          logs
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200  // Return 200 even on error so frontend can display results
      }
    );
  }
});
