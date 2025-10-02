import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id, user_id, company_id } = await req.json();

    if (!agent_id || !user_id) {
      throw new Error('agent_id y user_id son requeridos');
    }

    console.log('Creating Response Agent:', { agent_id, user_id, company_id });

    // Get agent data from database
    const { data: agent, error: agentError } = await supabase
      .from('ai_workforce_agents')
      .select('*')
      .eq('internal_id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agent_id}`);
    }

    const inputParams = agent.input_parameters || {};
    
    // Build modalities array based on configuration
    const modalities: string[] = ['text'];
    if (inputParams.use_file_search) {
      modalities.push('file_search');
    }
    if (inputParams.use_web_search) {
      modalities.push('web_search');
    }

    // Build tools array
    const tools: any[] = [];
    if (inputParams.tools && Array.isArray(inputParams.tools)) {
      tools.push(...inputParams.tools);
    }

    // Build response configuration
    const responseConfig: any = {
      model: inputParams.model || 'gpt-5-mini-2025-08-07',
      instructions: inputParams.instructions || `Eres ${agent.role_name}. ${agent.description}`,
      modalities: modalities,
      metadata: {
        agent_id: agent.id,
        internal_id: agent.internal_id,
        role_name: agent.role_name,
        user_id: user_id,
        company_id: company_id || 'global',
        sfia_level: agent.average_sfia_level?.toString() || '3',
      }
    };

    // Add tools if any
    if (tools.length > 0) {
      responseConfig.tools = tools;
    }

    // Add reasoning if enabled (only for O3/O4 models)
    if (inputParams.use_reasoning && inputParams.model?.startsWith('o')) {
      responseConfig.reasoning = true;
    }

    console.log('Creating OpenAI Response with config:', JSON.stringify(responseConfig, null, 2));

    // Create a persistent configuration in database instead of API call
    // OpenAI Responses are created per-request, not pre-configured like Assistants
    
    // Update agent record with response configuration
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_workforce_agents')
      .update({
        execution_type: 'openai_response',
        execution_resource_id: `response_${agent.internal_id}`,
        input_parameters: {
          ...inputParams,
          response_config: responseConfig
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      agent: updatedAgent,
      response_config: responseConfig,
      message: 'Agent configurado para usar OpenAI Response API'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating response agent:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
