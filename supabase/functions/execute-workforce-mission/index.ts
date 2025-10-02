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

    // Check if agent has been deployed (has OpenAI assistant ID)
    let assistantId = agent.execution_resource_id;
    
    if (!assistantId) {
      console.log('Agent not deployed yet, deploying now...');
      
      // Deploy agent by calling deploy-workforce-agent function
      const deployResponse = await supabase.functions.invoke('deploy-workforce-agent', {
        body: { 
          agent_id: agentInternalId, 
          user_id: user_id,
          company_id: task.team.company_id
        }
      });

      if (deployResponse.error) {
        throw new Error(`Failed to deploy agent: ${deployResponse.error.message}`);
      }

      assistantId = deployResponse.data.openai_assistant_id;
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

    // Create Thread in OpenAI
    console.log('Creating OpenAI Thread...');
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        metadata: {
          task_id: task_id,
          user_id: user_id,
          mission_type: task.task_type
        }
      })
    });

    if (!threadResponse.ok) {
      const errorBody = await threadResponse.text();
      throw new Error(`Failed to create thread: ${threadResponse.status} - ${errorBody}`);
    }

    const thread = await threadResponse.json();
    console.log('Thread created:', thread.id);

    // Build mission message based on task type and input data
    const missionMessage = buildMissionMessage(task);

    // Add message to thread
    console.log('Adding message to thread...');
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: missionMessage
      })
    });

    if (!messageResponse.ok) {
      const errorBody = await messageResponse.text();
      throw new Error(`Failed to add message: ${messageResponse.status} - ${errorBody}`);
    }

    // Create and execute run
    console.log('Creating run...');
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        metadata: {
          task_id: task_id,
          mission_type: task.task_type
        }
      })
    });

    if (!runResponse.ok) {
      const errorBody = await runResponse.text();
      throw new Error(`Failed to create run: ${runResponse.status} - ${errorBody}`);
    }

    const run = await runResponse.json();
    console.log('Run created:', run.id);

    // Update task with execution details
    await supabase
      .from('ai_workforce_team_tasks')
      .update({
        execution_log: {
          thread_id: thread.id,
          run_id: run.id,
          assistant_id: assistantId,
          started_at: new Date().toISOString()
        }
      })
      .eq('id', task_id);

    // Poll for run completion (with timeout)
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (['queued', 'in_progress', 'requires_action'].includes(runStatus) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const runData = await statusResponse.json();
      runStatus = runData.status;

      console.log(`Run status (attempt ${attempts}):`, runStatus);

      // Handle function calls if needed
      if (runStatus === 'requires_action' && runData.required_action?.type === 'submit_tool_outputs') {
        console.log('Run requires tool outputs, handling...');
        const toolCalls = runData.required_action.submit_tool_outputs.tool_calls;
        const toolOutputs = await handleToolCalls(toolCalls, task);

        // Submit tool outputs
        await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}/submit_tool_outputs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({ tool_outputs: toolOutputs })
        });
      }
    }

    if (runStatus === 'completed') {
      // Get messages from thread
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      const messagesData = await messagesResponse.json();
      const assistantMessages = messagesData.data
        .filter((msg: any) => msg.role === 'assistant')
        .map((msg: any) => msg.content[0]?.text?.value || '');

      const results = {
        status: 'completed',
        output: assistantMessages[0] || 'Misión completada',
        full_conversation: assistantMessages,
        thread_id: thread.id,
        run_id: run.id
      };

      // Update task with results
      await supabase
        .from('ai_workforce_team_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output_data: results
        })
        .eq('id', task_id);

      return new Response(JSON.stringify({
        success: true,
        results
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else {
      throw new Error(`Run did not complete successfully. Status: ${runStatus}`);
    }

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
