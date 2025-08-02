import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get OpenAI API key from database or environment variable
 */
async function getOpenAIApiKey(): Promise<string> {
  console.log('🔑 Getting OpenAI API key...');
  
  // Try to get API key from database first
  try {
    const { data, error } = await supabase
      .from('llm_api_keys')
      .select('api_key_hash')
      .eq('provider', 'openai')
      .eq('status', 'active')
      .single();
    
    if (!error && data?.api_key_hash) {
      console.log('✅ Found OpenAI API key in database');
      return data.api_key_hash;
    }
  } catch (dbError) {
    console.log('⚠️ Could not get API key from database:', dbError);
  }
  
  // Fallback to environment variable
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Configure it in llm_api_keys table or set OPENAI_API_KEY environment variable.');
  }

  console.log('✅ Using environment variable API key');
  return apiKey;
}

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
    console.log('🎯 Iniciando generación de objetivos estratégicos...');
    
    // Obtener API key de OpenAI
    const openAIApiKey = await getOpenAIApiKey();

    const body = await req.json();
    console.log('📝 Datos recibidos:', body);
    
    const { companyInfo, strategyData } = body;
    
    const systemPrompt = `Eres un experto consultor en estrategia empresarial especializado en definir objetivos estratégicos SMART (Específicos, Medibles, Alcanzables, Relevantes, Temporales).

INSTRUCCIONES:
- Genera exactamente 3 objetivos estratégicos de crecimiento
- Cada objetivo debe ser específico para el tipo de empresa y su estrategia
- Usa la metodología SMART
- Incluye métricas específicas y plazos realistas
- Los objetivos deben estar alineados con la misión, visión y propuesta de valor
- Mezcla objetivos de corto, mediano y largo plazo

FORMATO DE RESPUESTA (JSON):
{
  "objectives": [
    {
      "title": "Título del objetivo (máximo 10 palabras)",
      "description": "Descripción detallada del objetivo, incluyendo métricas específicas y plazo (2-3 oraciones)",
      "type": "short_term|medium_term|long_term",
      "priority": "alta|media",
      "metric": "Métrica específica a medir",
      "target": "Meta numérica o porcentual",
      "timeframe": "Plazo específico (ej: 6 meses, 1 año, 3 años)"
    }
  ]
}`;

    const userPrompt = `Genera 3 objetivos estratégicos de crecimiento para la empresa "${companyInfo.name}" que opera en el sector "${companyInfo.industry_sector}" con ${companyInfo.company_size}.

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${companyInfo.name}
- Industria: ${companyInfo.industry_sector || 'No especificada'}
- Tamaño: ${companyInfo.company_size || 'No especificado'}
- Sitio web: ${companyInfo.website_url || 'No disponible'}
- Descripción: ${companyInfo.description || 'No disponible'}

ESTRATEGIA DEFINIDA:
- Misión: ${strategyData.mission || strategyData.mision || 'No definida'}
- Visión: ${strategyData.vision || strategyData.vision || 'No definida'}  
- Propuesta de valor: ${strategyData.value_proposition || strategyData.propuesta_valor || 'No definida'}

Los objetivos deben:
1. Estar alineados con la estrategia definida
2. Ser específicos para esta industria y tamaño de empresa
3. Incluir métricas cuantificables
4. Tener plazos realistas
5. Ser alcanzables pero ambiciosos

Responde únicamente con el JSON solicitado.`;

    // Obtener configuración de IA
    const { data: config, error: configError } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', 'get-company-objetivos')
      .single();

    if (configError) {
      console.log('⚠️ No se encontró configuración específica, usando defaults:', configError.message);
    }

    const aiConfig = config || {
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    console.log('🤖 Usando configuración de IA:', aiConfig.model_name);
    console.log('📤 Enviando request a OpenAI para objetivos...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model_name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: aiConfig.max_tokens,
        temperature: aiConfig.temperature,
        top_p: aiConfig.top_p,
        frequency_penalty: aiConfig.frequency_penalty,
        presence_penalty: aiConfig.presence_penalty,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error de OpenAI:', response.status, errorData);
      throw new Error(`Error de OpenAI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta recibida de OpenAI para objetivos');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Respuesta inválida de OpenAI:', data);
      throw new Error('Respuesta inválida de OpenAI');
    }

    const generatedContent = data.choices[0].message.content.trim();
    console.log('📄 Objetivos generados:', generatedContent);

    try {
      const objectivesData = JSON.parse(generatedContent);
      console.log('✅ Objetivos parseados:', objectivesData);
      
      return new Response(JSON.stringify({ 
        success: true,
        objectives: objectivesData.objectives
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('❌ Error parsing objetivos JSON:', parseError);
      console.log('Raw content:', generatedContent);
      throw new Error('Error procesando la respuesta de objetivos de IA');
    }

  } catch (error: any) {
    console.error('❌ Error en get-company-objetivos:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});