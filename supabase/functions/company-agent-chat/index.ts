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
    const { message, user_id, context } = await req.json();

    if (!message || !user_id) {
      return new Response(JSON.stringify({ 
        error: 'Se requiere mensaje y user_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Company agent chat request:', { message, user_id, context });

    // Obtener el agente de la empresa del usuario
    const { data: companyAgent, error: agentError } = await supabase
      .from('company_agents')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (agentError || !companyAgent) {
      // Si no existe agente, crear uno automáticamente
      const { data: userCompany } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user_id)
        .eq('is_primary', true)
        .single();

      if (userCompany) {
        const { data: createResult } = await supabase.functions.invoke('create-company-agent', {
          body: {
            user_id,
            company_id: userCompany.company_id
          }
        });

        if (createResult?.success) {
          return await chatWithAgent(createResult.agent.agent_id, message, context);
        }
      }

      // Fallback al chat general
      return await fallbackChat(message, context);
    }

    // Chat con el agente específico de la empresa
    return await chatWithAgent(companyAgent.agent_id, message, context);

  } catch (error) {
    console.error('Error in company agent chat:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en el chat del copiloto empresarial',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function chatWithAgent(agentId: string, message: string, context?: string) {
  try {
    // Crear un hilo de conversación
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    });

    if (!threadResponse.ok) {
      throw new Error('Error creating thread');
    }

    const thread = await threadResponse.json();

    // Agregar mensaje del usuario al hilo
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: `${context ? `[Contexto: ${context}] ` : ''}${message}`
      })
    });

    if (!messageResponse.ok) {
      throw new Error('Error adding message to thread');
    }

    // Ejecutar el agente
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: agentId
      })
    });

    if (!runResponse.ok) {
      throw new Error('Error running assistant');
    }

    const run = await runResponse.json();

    // Esperar a que termine la ejecución
    const finalRun = await waitForRunCompletion(thread.id, run.id);

    if (finalRun.status === 'requires_action') {
      // Manejar function calls
      const toolOutputs = await handleToolCalls(finalRun.required_action.submit_tool_outputs.tool_calls);
      
      // Enviar resultados de las herramientas
      const submitResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}/submit_tool_outputs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          tool_outputs: toolOutputs
        })
      });

      if (submitResponse.ok) {
        // Esperar la respuesta final
        await waitForRunCompletion(thread.id, run.id);
      }
    }

    // Obtener la respuesta del agente
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    if (!messagesResponse.ok) {
      throw new Error('Error fetching messages');
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');

    return new Response(JSON.stringify({ 
      reply: assistantMessage?.content[0]?.text?.value || 'No pude generar una respuesta',
      agent_used: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in agent chat:', error);
    return await fallbackChat(message, context);
  }
}

async function waitForRunCompletion(threadId: string, runId: string) {
  while (true) {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const run = await response.json();

    if (['completed', 'failed', 'cancelled', 'expired', 'requires_action'].includes(run.status)) {
      return run;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function handleToolCalls(toolCalls: any[]) {
  const toolOutputs = [];

  for (const toolCall of toolCalls) {
    const { function: functionCall } = toolCall;
    const functionName = functionCall.name;
    const functionArgs = JSON.parse(functionCall.arguments);

    let output = '';

    try {
      switch (functionName) {
        case 'search_web':
          output = await searchWeb(functionArgs.query);
          break;
        case 'analyze_company_performance':
          output = await analyzeCompanyPerformance(functionArgs.metric_type);
          break;
        case 'generate_strategic_recommendations':
          output = await generateStrategicRecommendations(functionArgs.area);
          break;
        default:
          output = 'Función no implementada';
      }
    } catch (error) {
      output = `Error ejecutando ${functionName}: ${(error as Error).message}`;
    }

    toolOutputs.push({
      tool_call_id: toolCall.id,
      output
    });
  }

  return toolOutputs;
}

async function searchWeb(query: string): Promise<string> {
  // Implementar búsqueda web (puedes usar Perplexity API o Google Search API)
  return `Información encontrada sobre: "${query}". Esta es una búsqueda simulada que pronto será implementada con datos reales del mercado.`;
}

async function analyzeCompanyPerformance(metricType: string): Promise<string> {
  return `Análisis de rendimiento para métrica "${metricType}": Basado en los datos actuales, se recomienda enfocarse en mejorar la consistencia de contenido y el engagement.`;
}

async function generateStrategicRecommendations(area: string): Promise<string> {
  const recommendations: Record<string, string> = {
    marketing: 'Recomendaciones de marketing: Aumentar frecuencia de publicación, diversificar formatos de contenido, implementar estrategia de hashtags.',
    strategy: 'Recomendaciones estratégicas: Revisar objetivos trimestrales, identificar nuevas oportunidades de mercado.',
    competitive_analysis: 'Análisis competitivo: Monitorear estrategias de precios, analizar propuestas de valor de competidores.',
    content: 'Recomendaciones de contenido: Crear calendario editorial, optimizar para SEO, incluir más contenido visual.'
  };

  return recommendations[area] || 'Área no reconocida para recomendaciones.';
}

async function fallbackChat(message: string, context?: string) {
  // Fallback al chat general de Era
  return new Response(JSON.stringify({ 
    reply: 'Hola, soy tu copiloto empresarial. Estoy configurando tu perfil personalizado. Mientras tanto, ¿en qué puedo ayudarte?',
    agent_used: false
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}