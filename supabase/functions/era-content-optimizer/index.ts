import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
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
    const { text, fieldType, context } = await req.json();

    if (!text || !fieldType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Se requiere texto y tipo de campo' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OPENAI_API_KEY no configurada' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener el template de prompt desde la base de datos
    let promptTemplate;
    
    // Buscar template específico para el tipo de campo
    const { data: specificTemplate, error: specificError } = await supabase
      .from('era_prompt_templates')
      .select('*')
      .eq('field_type', fieldType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (specificError && specificError.code !== 'PGRST116') {
      console.error('Error loading specific prompt template:', specificError);
    }

    if (!specificTemplate) {
      // Si no encuentra template específico, usar el default
      const { data: defaultTemplate, error: defaultError } = await supabase
        .from('era_prompt_templates')
        .select('*')
        .eq('field_type', 'default')
        .eq('is_active', true)
        .single();

      if (defaultError) {
        console.error('Error loading default prompt template:', defaultError);
        // Fallback a prompt hardcodeado
        promptTemplate = {
          system_prompt: 'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
          specific_instructions: 'Optimiza este CONTENIDO EMPRESARIAL:\n- Mejora claridad y profesionalismo\n- Mantén el mensaje principal\n- Optimiza para impacto\n- Usa lenguaje empresarial apropiado',
          max_words: 200,
          tone: 'professional'
        };
      } else {
        promptTemplate = defaultTemplate;
      }
    } else {
      promptTemplate = specificTemplate;
    }

    const systemPrompt = promptTemplate.system_prompt;
    const specificInstructions = promptTemplate.specific_instructions;

    // Crear el prompt completo con contexto
    const contextInfo = [
      context.companyName ? `Empresa: ${context.companyName}` : '',
      context.industry ? `Industria: ${context.industry}` : '',
      context.size ? `Tamaño: ${context.size}` : '',
      `Tono deseado: ${promptTemplate.tone}`,
      `Máximo de palabras: ${promptTemplate.max_words}`
    ].filter(Boolean).join('\n');

    const fullPrompt = `${systemPrompt}

${specificInstructions}

Contexto adicional:
${contextInfo}

TEXTO ORIGINAL:
"${text}"

TEXTO OPTIMIZADO:`;

    // Obtener configuración de IA desde la base de datos
    const { data: config, error: configError } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', 'era-content-optimizer')
      .single();

    if (configError) {
      console.error('Error loading AI config:', configError);
    }

    const aiConfig = config || {
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    console.log('Using AI config:', aiConfig);
    console.log('Using prompt template:', promptTemplate.field_type || 'default');
    console.log('Enviando prompt a OpenAI:', fullPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model_name,
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: `${specificInstructions}\n\nTexto a optimizar: "${text}"` 
          }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
        top_p: aiConfig.top_p,
        frequency_penalty: aiConfig.frequency_penalty,
        presence_penalty: aiConfig.presence_penalty,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const optimizedText = data.choices[0].message.content.trim();

    console.log('Texto optimizado generado:', optimizedText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        optimizedText,
        originalLength: text.length,
        optimizedLength: optimizedText.length,
        fieldType,
        templateUsed: promptTemplate.field_type || 'default',
        tone: promptTemplate.tone,
        maxWords: promptTemplate.max_words
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in era-content-optimizer function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});