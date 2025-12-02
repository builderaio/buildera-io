import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranslateRequest {
  content: string | string[];
  targetLanguage: 'es' | 'en' | 'pt';
  sourceLanguage?: 'es' | 'en' | 'pt';
  contentType?: 'insight' | 'strategy' | 'post' | 'general';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, targetLanguage, sourceLanguage = 'es', contentType = 'general' }: TranslateRequest = await req.json();

    // Validate inputs
    if (!content || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: content, targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si el idioma de origen es el mismo que el destino, devolver el contenido sin traducir
    if (sourceLanguage === targetLanguage) {
      return new Response(
        JSON.stringify({ translatedContent: content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar el contexto según el tipo de contenido
    const contextMap = {
      insight: 'marketing insight or audience analysis',
      strategy: 'marketing strategy or business plan',
      post: 'social media post or content',
      general: 'business or marketing content'
    };

    const languageNames = {
      es: 'Spanish',
      en: 'English',
      pt: 'Portuguese'
    };

    // Determinar si es un array o string único
    const isArray = Array.isArray(content);
    const contentToTranslate = isArray ? content : [content];

    // Crear el prompt para la traducción
    const systemPrompt = `You are a professional translator specialized in business and marketing content. 
Your task is to translate ${contextMap[contentType]} from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}.

CRITICAL INSTRUCTIONS:
- Maintain the exact same tone, style, and formatting as the original
- Preserve all markdown formatting, line breaks, and special characters
- Keep technical terms and brand names unchanged when appropriate
- Ensure cultural appropriateness for the target language
- Maintain the same level of formality
- Do NOT add explanations or notes - ONLY return the translated text
- If translating multiple items, return them in the same order as provided`;

    const userPrompt = isArray 
      ? `Translate each of the following items separately. Return ONLY the translations, one per line, in the exact same order:\n\n${contentToTranslate.map((item, i) => `${i + 1}. ${item}`).join('\n\n')}`
      : `Translate the following text:\n\n${contentToTranslate[0]}`;

    console.log(`Translating ${isArray ? contentToTranslate.length : 1} item(s) from ${sourceLanguage} to ${targetLanguage}`);

    // Llamar a Lovable AI para traducir
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI translation error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Translation rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Translation service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Translation service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const translatedText = aiData.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return new Response(
        JSON.stringify({ error: 'No translation received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si era un array, dividir la respuesta en líneas
    let translatedContent;
    if (isArray) {
      // Dividir por líneas y limpiar
      const lines = translatedText.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);
      
      // Si no coincide el número de elementos, intentar una estrategia alternativa
      if (lines.length !== contentToTranslate.length) {
        console.warn(`Translation mismatch: expected ${contentToTranslate.length}, got ${lines.length}`);
        // Devolver el contenido original si hay un error de parsing
        translatedContent = content;
      } else {
        translatedContent = lines;
      }
    } else {
      translatedContent = translatedText;
    }

    console.log(`Translation successful: ${isArray ? translatedContent.length : 1} item(s) translated`);

    return new Response(
      JSON.stringify({ 
        translatedContent,
        sourceLanguage,
        targetLanguage,
        contentType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Translation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
