import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    console.log('Era response:', reply);

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in era-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Lo siento, no puedo procesar tu mensaje en este momento. Inténtalo de nuevo.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});