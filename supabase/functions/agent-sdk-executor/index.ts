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

interface AgentExecutionRequest {
  agent_id: string;
  user_id: string;
  company_id: string;
  input_data: Record<string, any>;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { agent_id, user_id, company_id, input_data, context }: AgentExecutionRequest = await req.json();

    if (!agent_id || !user_id) {
      return new Response(JSON.stringify({ 
        error: 'Se requiere agent_id y user_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Agent SDK Executor request:', { agent_id, user_id, company_id });

    // 1. Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('platform_agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    if (!agent.is_active) {
      throw new Error('Agent is not active');
    }

    // 2. Check if company has this agent enabled
    if (company_id) {
      const { data: enabledAgent } = await supabase
        .from('company_enabled_agents')
        .select('id')
        .eq('company_id', company_id)
        .eq('agent_id', agent_id)
        .single();

      if (!enabledAgent) {
        throw new Error('Agent not enabled for this company');
      }
    }

    // 3. Check credits
    if (company_id) {
      const { data: credits } = await supabase
        .from('company_credits')
        .select('available_credits')
        .eq('company_id', company_id)
        .single();

      if (!credits || credits.available_credits < agent.credits_per_use) {
        throw new Error('Insufficient credits');
      }
    }

    // 4. Create usage log entry (pending)
    const { data: usageLog, error: logError } = await supabase
      .from('agent_usage_log')
      .insert({
        agent_id: agent_id,
        user_id: user_id,
        company_id: company_id,
        input_data: input_data,
        status: 'pending',
        credits_consumed: agent.credits_per_use
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating usage log:', logError);
    }

    // 5. Execute based on agent type
    let result: any;
    let outputSummary: string = '';

    try {
      if (agent.agent_type === 'static' && agent.edge_function_name) {
        // Execute edge function
        const { data, error } = await supabase.functions.invoke(agent.edge_function_name, {
          body: { ...input_data, user_id, company_id, context }
        });

        if (error) throw error;
        result = data;
        outputSummary = 'Edge function executed successfully';

      } else if (agent.agent_type === 'dynamic' || agent.agent_type === 'hybrid') {
        // Execute via OpenAI API
        result = await executeOpenAIAgent(agent, input_data, context);
        outputSummary = result.summary || 'Dynamic agent executed';

      } else {
        throw new Error(`Unknown agent type: ${agent.agent_type}`);
      }

      // 6. Update usage log with success
      if (usageLog) {
        await supabase
          .from('agent_usage_log')
          .update({
            status: 'completed',
            output_data: result,
            output_summary: outputSummary,
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', usageLog.id);
      }

      // 7. Deduct credits
      if (company_id) {
        await supabase.rpc('deduct_company_credits', {
          p_company_id: company_id,
          p_amount: agent.credits_per_use
        });
      }

      return new Response(JSON.stringify({
        success: true,
        agent_name: agent.name,
        result: result,
        credits_used: agent.credits_per_use,
        execution_time_ms: Date.now() - startTime
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (execError) {
      // Update usage log with error
      if (usageLog) {
        await supabase
          .from('agent_usage_log')
          .update({
            status: 'failed',
            error_message: (execError as Error).message,
            execution_time_ms: Date.now() - startTime
          })
          .eq('id', usageLog.id);
      }
      throw execError;
    }

  } catch (error) {
    console.error('Error in agent-sdk-executor:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Error executing agent',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeOpenAIAgent(agent: any, inputData: Record<string, any>, context?: string) {
  const openaiConfig = agent.openai_agent_config || {};
  const model = agent.model_name || 'gpt-5-mini-2025-08-07';
  const instructions = agent.instructions || '';

  // Build tools array
  const tools: any[] = [];
  
  if (openaiConfig.use_web_search) {
    tools.push({ type: 'web_search_preview' });
  }
  
  if (openaiConfig.use_file_search) {
    tools.push({ type: 'file_search' });
  }
  
  if (openaiConfig.use_code_interpreter) {
    tools.push({ type: 'code_interpreter' });
  }

  // Add custom tools from agent config
  if (agent.tools_config && Array.isArray(agent.tools_config)) {
    tools.push(...agent.tools_config);
  }

  // Build the user message
  const userMessage = context 
    ? `[Contexto: ${context}]\n\n${JSON.stringify(inputData)}`
    : JSON.stringify(inputData);

  // Determine API parameters based on model
  const isNewerModel = model.includes('gpt-5') || model.startsWith('o3') || model.startsWith('o4');
  
  const requestBody: any = {
    model: model,
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: userMessage }
    ],
  };

  // Add tools if any
  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  // Add token limit based on model
  if (isNewerModel) {
    requestBody.max_completion_tokens = 4000;
  } else {
    requestBody.max_tokens = 4000;
    requestBody.temperature = 0.7;
  }

  console.log('Calling OpenAI with model:', model);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const assistantMessage = data.choices[0]?.message?.content || '';

  // Try to parse as JSON if possible
  let parsedResult: any;
  try {
    parsedResult = JSON.parse(assistantMessage);
  } catch {
    parsedResult = { content: assistantMessage };
  }

  return {
    ...parsedResult,
    summary: assistantMessage.substring(0, 200),
    model_used: model,
    tokens_used: data.usage?.total_tokens || 0
  };
}
