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

    console.log('ERA Content Optimizer - Processing request:', { fieldType, context });

    // Get prompt template for the field type
    const { data: template } = await supabase
      .from('era_prompt_templates')
      .select('*')
      .eq('field_type', fieldType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (!template) {
      throw new Error(`No se encontró plantilla de prompt para el tipo de campo: ${fieldType}`);
    }

    const systemPrompt = template.system_prompt;
    const instructions = template.specific_instructions;
    const maxWords = template.max_words || 200;
    const tone = template.tone || 'professional';

    // Build the user message with context
    let userMessage = `${instructions}\n\nTexto a optimizar: "${text}"`;
    
    if (context && Object.keys(context).length > 0) {
      userMessage += `\n\nContexto adicional: ${JSON.stringify(context, null, 2)}`;
    }

    userMessage += `\n\nTono deseado: ${tone}\nMáximo de palabras: ${maxWords}`;

    // Call the universal AI handler with proper function name
    const { data: response, error } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'content_optimization',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        context: {
          fieldType,
          maxWords,
          tone,
          ...context
        }
      }
    });

    if (error) {
      throw new Error(`Universal AI Handler error: ${error.message}`);
    }

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido del handler universal');
    }

    console.log('ERA Content Optimizer - Response received:', response);

    return new Response(
      JSON.stringify({ 
        success: true, 
        optimizedText: response.optimizedText || response.response,
        originalLength: text.length,
        optimizedLength: (response.optimizedText || response.response).length,
        fieldType,
        provider: response.provider,
        model: response.model,
        context
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
        error: (error as Error).message || 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});