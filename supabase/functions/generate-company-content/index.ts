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
    console.log('🤖 Iniciando generación de contenido con IA...');
    
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY no está configurada');
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const { field, companyInfo } = await req.json();
    console.log('📝 Generando contenido para:', field);
    console.log('🏢 Información de la empresa:', companyInfo);

    let systemPrompt = '';
    let userPrompt = '';

    // Configurar prompts específicos según el campo
    switch (field) {
      case 'misión':
        systemPrompt = `Eres un experto consultor en estrategia empresarial especializado en crear declaraciones de misión poderosas y auténticas.

INSTRUCCIONES:
- Crea una declaración de misión clara, inspiradora y específica
- Debe reflejar el propósito fundamental de la empresa
- Máximo 2-3 oraciones
- Evita clichés y frases genéricas
- Enfócate en el impacto que la empresa quiere generar`;

        userPrompt = `Crea una declaración de misión para la empresa "${companyInfo.company_name}" que opera en el sector "${companyInfo.industry_sector}" con ${companyInfo.company_size}.

${companyInfo.website_url ? `Sitio web: ${companyInfo.website_url}` : ''}

La misión debe ser específica, inspiradora y reflejar el propósito único de esta empresa en su industria.`;
        break;

      case 'visión':
        systemPrompt = `Eres un experto consultor en estrategia empresarial especializado en crear declaraciones de visión ambiciosas y motivadoras.

INSTRUCCIONES:
- Crea una declaración de visión que inspire y motive
- Debe describir el futuro deseado a largo plazo (5-10 años)
- Máximo 2-3 oraciones
- Debe ser ambiciosa pero alcanzable
- Enfócate en el impacto transformacional`;

        userPrompt = `Crea una declaración de visión para la empresa "${companyInfo.company_name}" que opera en el sector "${companyInfo.industry_sector}" con ${companyInfo.company_size}.

${companyInfo.website_url ? `Sitio web: ${companyInfo.website_url}` : ''}

La visión debe ser ambiciosa, inspiradora y describir dónde quiere estar la empresa en el futuro.`;
        break;

      case 'propuesta de valor':
        systemPrompt = `Eres un experto en marketing estratégico especializado en crear propuestas de valor diferenciadas y convincentes.

INSTRUCCIONES:
- Crea una propuesta de valor clara y diferenciada
- Debe explicar qué hace única a la empresa
- Enfócate en los beneficios específicos para los clientes
- Máximo 3-4 oraciones
- Debe ser fácil de entender y memorable`;

        userPrompt = `Crea una propuesta de valor para la empresa "${companyInfo.company_name}" que opera en el sector "${companyInfo.industry_sector}" con ${companyInfo.company_size}.

${companyInfo.website_url ? `Sitio web: ${companyInfo.website_url}` : ''}

La propuesta de valor debe explicar claramente qué hace única a esta empresa y por qué los clientes deberían elegirla.`;
        break;

      default:
        throw new Error('Campo no soportado');
    }

    // Obtener configuración de IA desde la base de datos
    const { data: config, error: configError } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', 'generate-company-content')
      .single();

    if (configError) {
      console.error('Error loading AI config:', configError);
    }

    const aiConfig = config || {
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    console.log('Using AI config:', aiConfig);
    console.log('📤 Enviando request a OpenAI...');
    
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
    console.log('✅ Respuesta recibida de OpenAI');

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Respuesta inválida de OpenAI:', data);
      throw new Error('Respuesta inválida de OpenAI');
    }

    const generatedContent = data.choices[0].message.content.trim();
    console.log('📄 Contenido generado:', generatedContent);

    return new Response(JSON.stringify({ 
      success: true,
      content: generatedContent,
      field: field 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error en generate-company-content:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});