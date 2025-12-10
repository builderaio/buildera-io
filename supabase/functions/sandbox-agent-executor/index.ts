import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      // Execute N8N webhook - REAL EXECUTION
      if (!request.n8n_config?.webhook_url) {
        throw new Error('N8N webhook URL no configurado');
      }

      log(`Llamando webhook REAL: ${request.n8n_config.webhook_url}`);
      
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
      // Execute edge function - REAL EXECUTION
      if (!request.edge_function_name) {
        throw new Error('Edge function name no configurado');
      }

      log(`Ejecutando edge function REAL: ${request.edge_function_name}`);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const edgeStart = Date.now();
      
      const { data, error } = await supabase.functions.invoke(request.edge_function_name, {
        body: request.payload
      });

      webhookTime = Date.now() - edgeStart;

      if (error) {
        log(`Error en edge function: ${error.message}`);
        throw new Error(`Edge function error: ${error.message}`);
      }

      output = data || {};
      log(`Edge function completada en ${webhookTime}ms`);

    } else if (request.agent_type === 'dynamic' || request.agent_type === 'hybrid') {
      // Dynamic/Hybrid agents require OpenAI configuration
      log(`Agente ${request.agent_type} - requiere configuración OpenAI`);
      
      output = {
        success: false,
        message: `Los agentes ${request.agent_type} requieren configuración de OpenAI para ejecución`,
        note: 'Configura openai_agent_config para habilitar ejecución real',
        received_payload: request.payload,
        timestamp: new Date().toISOString()
      };
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
        output: {},
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
