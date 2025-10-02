import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const url = new URL(req.url);
    const agentUniqueId = url.pathname.split('/')[2];
    
    console.log('Chat request for agent:', agentUniqueId);

    const { message, conversation_id } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Buscar el deployment por el unique ID en la URL
    const { data: deployment, error: deployError } = await supabaseClient
      .from('agent_deployment_instances')
      .select(`
        *,
        agent_instances (
          id,
          name,
          contextualized_instructions,
          openai_agent_id,
          input_parameters
        )
      `)
      .or(`chat_url.ilike.%${agentUniqueId}%,api_url.ilike.%${agentUniqueId}%`)
      .eq('status', 'active')
      .single();

    if (deployError || !deployment) {
      throw new Error('Agent deployment not found or inactive');
    }

    const agentInstance = deployment.agent_instances;
    const responseConfig = agentInstance.input_parameters?.response_config;

    if (!responseConfig) {
      throw new Error('Agent not properly configured');
    }

    // Obtener o crear conversación
    let conversationMessages: ChatMessage[] = [];
    
    if (conversation_id) {
      const { data: conversation } = await supabaseClient
        .from('agent_conversations')
        .select('messages')
        .eq('id', conversation_id)
        .single();

      if (conversation) {
        conversationMessages = conversation.messages as ChatMessage[];
      }
    }

    // Agregar el nuevo mensaje del usuario
    conversationMessages.push({
      role: 'user',
      content: message
    });

    // Llamar a OpenAI Chat Completions API
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: responseConfig.instructions || agentInstance.contextualized_instructions
      },
      ...conversationMessages
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: responseConfig.model || 'gpt-4o-mini',
        messages,
        tools: responseConfig.tools || [],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Failed to get response from AI');
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    // Agregar respuesta del asistente
    conversationMessages.push({
      role: 'assistant',
      content: assistantMessage
    });

    // Guardar o actualizar conversación
    const conversationData = {
      agent_id: agentInstance.id,
      user_id: deployment.agent_instances.user_id,
      messages: conversationMessages,
      status: 'active',
      title: conversationMessages[0]?.content.substring(0, 50) || 'Nueva conversación',
    };

    let savedConversationId = conversation_id;

    if (conversation_id) {
      await supabaseClient
        .from('agent_conversations')
        .update(conversationData)
        .eq('id', conversation_id);
    } else {
      const { data: newConversation } = await supabaseClient
        .from('agent_conversations')
        .insert(conversationData)
        .select('id')
        .single();

      savedConversationId = newConversation?.id;
    }

    // Registrar analytics
    await supabaseClient
      .from('agent_analytics')
      .insert({
        agent_instance_id: agentInstance.id,
        channel_type: 'web_chat',
        metric_type: 'message_sent',
        metric_value: 1,
        metadata: {
          conversation_id: savedConversationId,
          message_length: message.length,
        }
      });

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversation_id: savedConversationId,
        agent_name: agentInstance.name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat proxy error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
