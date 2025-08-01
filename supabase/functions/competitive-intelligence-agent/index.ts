import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, userId, action = 'chat' } = await req.json();

    if (action === 'start_analysis') {
      return await startAnalysis(sessionId, userId);
    }

    // Get or create OpenAI Assistant with web search tool
    const assistantId = await getOrCreateAssistant();
    
    // Get or create thread for this session
    const threadId = await getOrCreateThread(sessionId);
    
    // Add message to thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      })
    });

    // Create and run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: assistantId,
        tools: [{ type: 'web_search' }]
      })
    });

    const run = await runResponse.json();
    
    // Poll for completion
    let runStatus = await pollRunCompletion(threadId, run.id);
    
    // Get the latest messages
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    const messages = await messagesResponse.json();
    const latestMessage = messages.data[0];
    
    // Store the conversation in database
    await storeConversation(sessionId, userId, message, latestMessage.content[0].text.value);
    
    return new Response(JSON.stringify({
      response: latestMessage.content[0].text.value,
      threadId: threadId,
      runId: run.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in competitive intelligence agent:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getOrCreateAssistant() {
  // Check if assistant already exists
  const assistantsResponse = await fetch('https://api.openai.com/v1/assistants', {
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'OpenAI-Beta': 'assistants=v2'
    }
  });
  
  const assistants = await assistantsResponse.json();
  const existingAssistant = assistants.data.find((a: any) => a.name === 'Competitive Intelligence Agent');
  
  if (existingAssistant) {
    return existingAssistant.id;
  }

  // Create new assistant with web search capability
  const createResponse = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      name: 'Competitive Intelligence Agent',
      instructions: `Eres un experto analista de inteligencia competitiva especializado en el mercado empresarial. Tu función es:

1. RECOPILACIÓN DE INFORMACIÓN BÁSICA:
   - Pregunta sobre el sector/industria de la empresa
   - Identifica el tamaño del mercado objetivo (local, nacional, global)
   - Comprende los productos/servicios principales
   - Conoce la propuesta de valor única

2. IDENTIFICACIÓN DE COMPETIDORES:
   - Pregunta sobre competidores directos conocidos
   - Identifica competidores indirectos
   - Busca nuevos entrantes al mercado
   - Analiza sustitutos potenciales

3. ANÁLISIS PROFUNDO CON WEB SEARCH:
   - Usa la herramienta web_search para investigar cada competidor
   - Busca información sobre financiamiento, productos, estrategias
   - Analiza presencia en línea y marketing digital
   - Investiga noticias recientes y movimientos estratégicos

4. ENTREGABLES:
   - Mapa competitivo detallado
   - Análisis FODA comparativo
   - Identificación de gaps en el mercado
   - Recomendaciones estratégicas

Haz preguntas específicas y usa web search extensivamente para obtener datos actualizados del mercado.`,
      model: 'gpt-4o',
      tools: [{ type: 'web_search' }]
    })
  });

  const assistant = await createResponse.json();
  return assistant.id;
}

async function getOrCreateThread(sessionId: string) {
  // Check if thread exists in database
  const { data: session } = await supabase
    .from('competitive_analysis_sessions')
    .select('openai_thread_id')
    .eq('id', sessionId)
    .single();

  if (session?.openai_thread_id) {
    return session.openai_thread_id;
  }

  // Create new thread
  const threadResponse = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    }
  });

  const thread = await threadResponse.json();
  
  // Update session with thread ID
  await supabase
    .from('competitive_analysis_sessions')
    .update({ openai_thread_id: thread.id })
    .eq('id', sessionId);

  return thread.id;
}

async function pollRunCompletion(threadId: string, runId: string, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    
    const run = await runResponse.json();
    
    if (run.status === 'completed') {
      return run;
    } else if (run.status === 'failed') {
      throw new Error(`Run failed: ${run.last_error?.message}`);
    }
    
    // Wait 2 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Run timed out');
}

async function storeConversation(sessionId: string, userId: string, userMessage: string, assistantResponse: string) {
  // Get current conversation
  const { data: session } = await supabase
    .from('competitive_analysis_sessions')
    .select('conversation')
    .eq('id', sessionId)
    .single();

  const conversation = session?.conversation || [];
  conversation.push(
    { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }
  );

  // Update conversation
  await supabase
    .from('competitive_analysis_sessions')
    .update({ 
      conversation,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

async function startAnalysis(sessionId: string, userId: string) {
  // Get session data
  const { data: session } = await supabase
    .from('competitive_analysis_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    throw new Error('Session not found');
  }

  // Extract competitor information from conversation
  const conversation = session.conversation || [];
  const conversationText = conversation.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');

  // Use OpenAI to analyze and structure the competitive intelligence
  const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un analista de inteligencia competitiva experto. Analiza la conversación y extrae:
          1. Información de la empresa del usuario
          2. Lista de competidores identificados
          3. Análisis competitivo estructurado
          4. Recomendaciones estratégicas
          
          Responde en formato JSON con esta estructura:
          {
            "company_info": {
              "sector": "",
              "target_market": "",
              "main_products": [],
              "value_proposition": ""
            },
            "competitors": [
              {
                "name": "",
                "type": "direct|indirect|substitute",
                "market_share_estimation": "",
                "strengths": [],
                "weaknesses": [],
                "threat_level": "high|medium|low"
              }
            ],
            "market_analysis": {
              "market_size": "",
              "growth_trends": [],
              "key_opportunities": [],
              "main_threats": []
            },
            "strategic_recommendations": []
          }`
        },
        {
          role: 'user',
          content: conversationText
        }
      ]
    })
  });

  const analysisResult = await analysisResponse.json();
  const analysis = JSON.parse(analysisResult.choices[0].message.content);

  // Create competitive intelligence record
  const { data: intelligence } = await supabase
    .from('competitive_intelligence')
    .insert({
      user_id: userId,
      company_sector: analysis.company_info.sector,
      target_market: analysis.company_info.target_market,
      analysis_data: analysis,
      ai_generated: true
    })
    .select()
    .single();

  // Create competitor profiles
  for (const competitor of analysis.competitors) {
    await supabase
      .from('competitor_profiles')
      .insert({
        analysis_id: intelligence.id,
        competitor_name: competitor.name,
        competitor_type: competitor.type,
        market_share_percentage: parseFloat(competitor.market_share_estimation) || 0,
        competitive_threat_score: competitor.threat_level === 'high' ? 8 : competitor.threat_level === 'medium' ? 5 : 2,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        analysis_data: competitor
      });
  }

  // Update session status
  await supabase
    .from('competitive_analysis_sessions')
    .update({
      status: 'completed',
      analysis_id: intelligence.id
    })
    .eq('id', sessionId);

  return new Response(JSON.stringify({
    success: true,
    analysisId: intelligence.id,
    analysis: analysis
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}