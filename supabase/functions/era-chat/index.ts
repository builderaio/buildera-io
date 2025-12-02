import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { getSystemPrompt, validateLanguage } from '../_shared/prompts.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, userInfo, language } = await req.json();
    const userLanguage = validateLanguage(language);

    console.log('Era chat request:', { message, context, userInfo, language: userLanguage });

    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Se requiere un mensaje' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const basePrompt = getSystemPrompt('era-chat', userLanguage);
    const contextLabel = userLanguage === 'en' ? 'Current context:' : userLanguage === 'pt' ? 'Contexto atual:' : 'Contexto actual:';
    const userLabel = userLanguage === 'en' ? 'User:' : userLanguage === 'pt' ? 'Usuário:' : 'Usuario:';
    const instructionLabel = userLanguage === 'en' 
      ? 'Respond conversationally, helpfully, and always relate your responses to Buildera\'s capabilities that can help the user.'
      : userLanguage === 'pt'
      ? 'Responda de forma conversacional, útil e sempre relacionando suas respostas com as capacidades do Buildera que podem ajudar o usuário.'
      : 'Responde de manera conversacional, útil y siempre relacionando tus respuestas con las capacidades de Buildera que pueden ayudar al usuario.';

    const systemPrompt = `${basePrompt}

${contextLabel} ${context || (userLanguage === 'en' ? 'Main dashboard' : userLanguage === 'pt' ? 'Painel principal' : 'Dashboard principal')}
${userLabel} ${userInfo?.display_name || (userLanguage === 'en' ? 'User' : userLanguage === 'pt' ? 'Usuário' : 'Usuario')}

${instructionLabel}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    console.log('ERA Chat - Calling universal AI handler');

    // Call the universal AI handler
    const { data: response, error } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'chat_assistant',
        messages,
        context: { userInfo, chatContext: context }
      }
    });

    if (error) {
      throw new Error(`Universal AI Handler error: ${error.message}`);
    }

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido del handler universal');
    }

    console.log('ERA Chat - Response received:', response);

    return new Response(JSON.stringify({ 
      reply: response.response,
      provider: response.provider,
      model: response.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in era-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Lo siento, no puedo procesar tu mensaje en este momento. Inténtalo de nuevo.',
      details: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});