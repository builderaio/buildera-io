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
    const { task_id, user_id } = await req.json();

    if (!task_id || !user_id) {
      throw new Error('task_id y user_id son requeridos');
    }

    console.log('Executing mission:', { task_id, user_id });

    // Get task data
    const { data: task, error: taskError } = await supabase
      .from('ai_workforce_team_tasks')
      .select(`
        *,
        team:ai_workforce_teams(*)
      `)
      .eq('id', task_id)
      .single();

    if (taskError || !task) {
      throw new Error(`Task not found: ${task_id}`);
    }

    // Determine agent based on mission type
    const agentMapping: Record<string, string> = {
      'financial-profitability': 'FPA-001',
      'financial-cashflow': 'ACT-001',
      'legal-contract-review': 'CONL-001',
      'legal-data-compliance': 'CONL-001',
      'hr-job-profile': 'TAL-001',
      'hr-climate-survey': 'HRBP-001'
    };

    const agentInternalId = agentMapping[task.task_type] || 'FPA-001';

    // Get agent from database
    const { data: agent, error: agentError } = await supabase
      .from('ai_workforce_agents')
      .select('*')
      .eq('internal_id', agentInternalId)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentInternalId}`);
    }

    // Check if agent has been configured for Response API
    const inputParams = agent.input_parameters || {};
    const responseConfig = inputParams.response_config;
    
    if (!responseConfig) {
      console.log('Agent not configured yet, configuring now...');
      
      // Configure agent by calling create-response-agent function
      const configResponse = await supabase.functions.invoke('create-response-agent', {
        body: { 
          agent_id: agentInternalId, 
          user_id: user_id,
          company_id: task.team.company_id
        }
      });

      if (configResponse.error) {
        throw new Error(`Failed to configure agent: ${configResponse.error.message}`);
      }

      // Reload agent data
      const { data: reloadedAgent } = await supabase
        .from('ai_workforce_agents')
        .select('*')
        .eq('internal_id', agentInternalId)
        .single();
      
      if (reloadedAgent) {
        Object.assign(agent, reloadedAgent);
      }
    }

    // Update task with agent assignment
    await supabase
      .from('ai_workforce_team_tasks')
      .update({
        agent_id: agent.id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', task_id);

    // Build mission message based on task type and input data
    const missionMessage = buildMissionMessage(task);

    // Use OpenAI Response API instead of Assistants
    const agentConfig = agent.input_parameters?.response_config || {};
    console.log('Executing with Response API...');

    const responsePayload: any = {
      model: agentConfig.model || 'gpt-5-mini-2025-08-07',
      messages: [
        {
          role: 'system',
          content: agentConfig.instructions || `Eres ${agent.role_name}. ${agent.description}`
        },
        {
          role: 'user',
          content: missionMessage
        }
      ],
      metadata: {
        task_id: task_id,
        user_id: user_id,
        mission_type: task.task_type
      }
    };

    // Add modalities if configured
    if (agentConfig.modalities && agentConfig.modalities.length > 0) {
      responsePayload.modalities = agentConfig.modalities;
    }

    // Add tools if configured
    if (agentConfig.tools && agentConfig.tools.length > 0) {
      responsePayload.tools = agentConfig.tools;
    }

    // Add reasoning if configured
    if (agentConfig.reasoning) {
      responsePayload.reasoning = true;
    }

    console.log('Response payload:', JSON.stringify(responsePayload, null, 2));

    const responseApiCall = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responsePayload)
    });

    if (!responseApiCall.ok) {
      const errorBody = await responseApiCall.text();
      throw new Error(`Failed to get response: ${responseApiCall.status} - ${errorBody}`);
    }

    const responseData = await responseApiCall.json();
    console.log('Response received');

    const assistantReply = responseData.choices[0]?.message?.content || 'Misión completada';

    const results = {
      status: 'completed',
      output: assistantReply,
      full_conversation: [assistantReply],
      response_id: responseData.id,
      model_used: responseData.model
    };

    // Update task with results
    await supabase
      .from('ai_workforce_team_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_data: results,
        execution_log: {
          response_id: responseData.id,
          model: responseData.model,
          usage: responseData.usage,
          started_at: new Date().toISOString()
        }
      })
      .eq('id', task_id);

    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error executing mission:', error);
    
    // Update task status to failed
    if (req.json) {
      const { task_id } = await req.json().catch(() => ({}));
      if (task_id) {
        await supabase
          .from('ai_workforce_team_tasks')
          .update({
            status: 'failed',
            output_data: { error: (error as Error).message }
          })
          .eq('id', task_id);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildMissionMessage(task: any): string {
  const inputData = task.input_data || {};
  
  let message = `MISIÓN: ${task.task_name}\n\n`;
  message += `DESCRIPCIÓN: ${task.task_description}\n\n`;
  message += `TIPO DE MISIÓN: ${task.task_type}\n\n`;
  message += `PARÁMETROS DE ENTRADA:\n`;
  message += JSON.stringify(inputData, null, 2);
  message += `\n\nPor favor, ejecuta esta misión y proporciona un análisis detallado con recomendaciones accionables.`;

  return message;
}

async function handleToolCalls(toolCalls: any[], task: any): Promise<any[]> {
  const outputs = [];

  for (const toolCall of toolCalls) {
    console.log('Handling tool call:', toolCall.function.name);
    
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);

    let result = { success: true, data: {} };

    // Handle different function calls
    switch (functionName) {
      case 'analyze_financial_data':
        result.data = {
          analysis: 'Análisis financiero completado',
          trends: ['Crecimiento positivo', 'Rentabilidad estable'],
          recommendations: ['Optimizar costos operativos', 'Diversificar ingresos']
        };
        break;
      
      case 'review_contract':
        result.data = {
          risk_level: 'medium',
          issues_found: ['Cláusula de terminación unilateral', 'Penalidad excesiva por mora'],
          recommendations: ['Negociar términos más equilibrados', 'Agregar cláusula de protección']
        };
        break;

      case 'create_job_profile':
        result.data = {
          profile: 'Perfil de cargo creado exitosamente',
          sections: ['Responsabilidades', 'Requisitos', 'Competencias']
        };
        break;

      default:
        result.data = { message: 'Función ejecutada' };
    }

    outputs.push({
      tool_call_id: toolCall.id,
      output: JSON.stringify(result)
    });
  }

  return outputs;
}
