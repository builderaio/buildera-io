import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

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
    const { message, context, userInfo } = await req.json();

    console.log('Era chat request:', { message, context, userInfo });

    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Se requiere un mensaje' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `Eres Era, el asistente de inteligencia artificial de Buildera. Buildera es una plataforma integral para empresas que incluye:

PRINCIPALES FUNCIONES DE LA PLATAFORMA:
1. **ADN Empresa**: Definir misión, visión, propuesta de valor e identidad visual
2. **Marketplace**: Conectar con expertos especializados para proyectos
3. **Expertos**: Gestionar colaboradores y especialistas
4. **Marketing Hub**: Generar contenido optimizado para redes sociales y marketing
5. **Inteligencia Competitiva**: Analizar competencia y tendencias del mercado
6. **Academia Buildera**: Acceder a cursos y recursos educativos
7. **Base de Conocimiento**: Centralizar información y documentos empresariales
8. **Configuración**: Personalizar la experiencia de la plataforma

CARACTERÍSTICAS ESPECIALES DE ERA:
- Optimizas automáticamente contenido empresarial (misión, visión, propuestas de valor, etc.)
- Generas contenido de marketing contextualizado
- Ayudas con análisis competitivo
- Proporcionas insights estratégicos
- Asistes en la toma de decisiones empresariales

Tu personalidad es:
- Profesional pero cercana
- Proactiva en sugerir mejoras
- Enfocada en resultados empresariales
- Inteligente y estratégica
- Siempre orientada a ayudar al crecimiento del negocio

Contexto actual: ${context || 'Dashboard principal'}
Usuario: ${userInfo?.display_name || 'Usuario'}

Responde de manera conversacional, útil y siempre relacionando tus respuestas con las capacidades de Buildera que pueden ayudar al usuario.`;

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
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});