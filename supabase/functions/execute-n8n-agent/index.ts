import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface N8NConfig {
  webhook_url: string;
  http_method: 'GET' | 'POST';
  requires_auth: boolean;
  input_schema?: Record<string, any>;
  output_mappings?: Array<{
    source_path: string;
    target_key: string;
    category: string;
  }>;
  timeout_ms?: number;
}

interface ExecutionRequest {
  agent_id: string;
  input_data: Record<string, any>;
  company_id: string;
  user_id: string;
  language?: string;
}

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { agent_id, input_data, company_id, user_id, language = 'es' } = await req.json() as ExecutionRequest;

    console.log(`[execute-n8n-agent] Starting execution for agent: ${agent_id}`);
    console.log(`[execute-n8n-agent] Company: ${company_id}, User: ${user_id}`);

    if (!agent_id || !company_id || !user_id) {
      throw new Error('Missing required parameters: agent_id, company_id, user_id');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('platform_agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      console.error('[execute-n8n-agent] Agent not found:', agentError);
      throw new Error(`Agent not found: ${agent_id}`);
    }

    const n8nConfig = agent.n8n_config as N8NConfig;
    
    if (!n8nConfig || !n8nConfig.webhook_url) {
      throw new Error('Agent does not have n8n configuration');
    }

    console.log(`[execute-n8n-agent] Agent loaded: ${agent.name}`);
    console.log(`[execute-n8n-agent] Webhook URL: ${n8nConfig.webhook_url}`);

    // Prepare request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication if required
    if (n8nConfig.requires_auth) {
      const n8nUser = Deno.env.get('N8N_AUTH_USER');
      const n8nPass = Deno.env.get('N8N_AUTH_PASS');
      
      if (!n8nUser || !n8nPass) {
        console.error('[execute-n8n-agent] N8N auth credentials not configured');
        throw new Error('N8N authentication credentials not configured');
      }
      
      const authString = btoa(`${n8nUser}:${n8nPass}`);
      headers['Authorization'] = `Basic ${authString}`;
    }

    // Prepare payload
    const payload = {
      ...input_data,
      company_id,
      user_id,
      language,
      agent_id,
      timestamp: new Date().toISOString(),
    };

    console.log(`[execute-n8n-agent] Sending payload to n8n:`, JSON.stringify(payload, null, 2));

    // Execute webhook call
    const timeout = n8nConfig.timeout_ms || 300000; // Default 5 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let response: Response;
    try {
      if (n8nConfig.http_method === 'GET') {
        const url = new URL(n8nConfig.webhook_url);
        Object.entries(payload).forEach(([key, value]) => {
          url.searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
        response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
      } else {
        response = await fetch(n8nConfig.webhook_url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[execute-n8n-agent] Webhook error: ${response.status} - ${errorText}`);
      throw new Error(`N8N webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[execute-n8n-agent] Received response from n8n:`, JSON.stringify(result, null, 2));

    // Process output mappings to save to company_parameters
    const savedParameters: string[] = [];
    const mappingErrors: string[] = [];

    if (n8nConfig.output_mappings && n8nConfig.output_mappings.length > 0) {
      console.log(`[execute-n8n-agent] Processing ${n8nConfig.output_mappings.length} output mappings`);

      for (const mapping of n8nConfig.output_mappings) {
        try {
          const value = getNestedValue(result, mapping.source_path);
          
          if (value !== undefined) {
            // Mark previous version as not current
            await supabase
              .from('company_parameters')
              .update({ is_current: false })
              .eq('company_id', company_id)
              .eq('parameter_key', mapping.target_key)
              .eq('is_current', true);

            // Insert new parameter value
            const { error: insertError } = await supabase
              .from('company_parameters')
              .insert({
                company_id,
                category: mapping.category,
                parameter_key: mapping.target_key,
                parameter_value: typeof value === 'object' ? value : { value },
                source_agent_code: agent.internal_code,
                is_current: true,
              });

            if (insertError) {
              console.error(`[execute-n8n-agent] Error saving parameter ${mapping.target_key}:`, insertError);
              mappingErrors.push(`${mapping.target_key}: ${insertError.message}`);
            } else {
              console.log(`[execute-n8n-agent] Saved parameter: ${mapping.target_key}`);
              savedParameters.push(mapping.target_key);
            }
          } else {
            console.warn(`[execute-n8n-agent] No value found at path: ${mapping.source_path}`);
          }
        } catch (err) {
          console.error(`[execute-n8n-agent] Error processing mapping ${mapping.target_key}:`, err);
          mappingErrors.push(`${mapping.target_key}: ${err.message}`);
        }
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[execute-n8n-agent] Execution completed in ${executionTime}ms`);

    // Log usage
    await supabase
      .from('agent_usage_log')
      .insert({
        agent_id,
        company_id,
        user_id,
        status: 'completed',
        execution_time_ms: executionTime,
        input_data: payload,
        output_data: result,
        output_summary: `Executed ${agent.name}. Saved ${savedParameters.length} parameters.`,
        credits_consumed: agent.credits_per_use || 1,
      });

    return new Response(JSON.stringify({
      success: true,
      result,
      saved_parameters: savedParameters,
      mapping_errors: mappingErrors.length > 0 ? mappingErrors : undefined,
      execution_time_ms: executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[execute-n8n-agent] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      execution_time_ms: executionTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
