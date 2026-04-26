import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Iniciando generación de contenido con IA...');

    // Health-check endpoint: GET ?health=1 or body { health_check: true }
    const url = new URL(req.url);
    const isHealthCheckGet = req.method === 'GET' && url.searchParams.get('health') === '1';

    let body: any = {};
    if (req.method !== 'GET') {
      try {
        body = await req.json();
      } catch (_) {
        body = {};
      }
    }

    if (isHealthCheckGet || body?.health_check === true) {
      const available = !!openAIApiKey;
      return new Response(JSON.stringify({
        success: true,
        service: 'generate-company-content',
        available,
        provider: 'openai',
        error_code: available ? null : 'service_unavailable',
        message: available
          ? 'AI content generation service is operational.'
          : 'OPENAI_API_KEY is not configured. Service unavailable.',
      }), {
        status: available ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY no está configurada');
      return new Response(JSON.stringify({
        success: false,
        error_code: 'service_unavailable',
        error: 'AI content generation service is not configured (missing OPENAI_API_KEY).',
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Datos recibidos:', body);


    // Nueva ruta: generación libre de contenido con prompt + contexto
    if (body.prompt) {
      const { prompt, context } = body;
      const topPosts = context?.top_posts || [];
      const platform = context?.platform || 'general';

      const systemPrompt = `Eres un estratega y copywriter de redes sociales. Genera contenido listo para publicar.
- Adapta el tono a la plataforma objetivo (${platform}).
- Apóyate en los patrones de los top posts cuando estén disponibles.
- Devuelve texto claro, con emojis moderados y una llamada a la acción.
- NO uses formato markdown (**texto**) ni negritas, el texto debe ser plano y natural
- Escribe texto directo para redes sociales, sin formateo especial
- Usa emojis para dar énfasis en lugar de negritas`;

      const userPrompt = `Instrucciones del usuario:\n${prompt}\n\nContexto (si hay):\nTop posts (máx 5):\n${JSON.stringify(topPosts.slice(0,5), null, 2)}\nPlataforma: ${platform}\n`;

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
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('❌ Error de OpenAI (prompt libre):', response.status, err);
        throw new Error(`Error de OpenAI: ${response.status} - ${err}`);
      }

      const ai = await response.json();
      let content = ai.choices?.[0]?.message?.content?.trim() || '';
      
      // Remove markdown formatting like **text** and replace with plain text
      content = content.replace(/\*\*(.*?)\*\*/g, '$1');
      content = content.replace(/\*(.*?)\*/g, '$1');
      content = content.replace(/__(.*?)__/g, '$1');
      content = content.replace(/_(.*?)_/g, '$1');

      return new Response(JSON.stringify({ success: true, content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar si es una llamada para generar estrategia completa
    if (body.companyName) {
      // Nuevo formato para generar estrategia completa
      const { companyName, industryType, companySize, websiteUrl, description } = body;
      
      console.log('🏢 Generando estrategia completa para:', companyName);

      const systemPrompt = `Eres un experto consultor en estrategia empresarial especializado en crear estrategias empresariales completas y coherentes.

INSTRUCCIONES:
- Crea una estrategia empresarial completa con misión, visión y propuesta de valor
- Todos los elementos deben estar alineados y ser coherentes entre sí
- Usa un lenguaje claro, inspirador y específico
- Evita clichés y frases genéricas
- Enfócate en lo que hace única a esta empresa

FORMATO DE RESPUESTA (JSON):
{
  "mission": "Declaración de misión (2-3 oraciones máximo)",
  "vision": "Declaración de visión (2-3 oraciones máximo)", 
  "value_proposition": "Propuesta de valor (3-4 oraciones máximo)"
}`;

      const userPrompt = `Crea una estrategia empresarial completa para la empresa "${companyName}" que opera en el sector "${industryType}" con ${companySize}.

${websiteUrl ? `Sitio web: ${websiteUrl}` : ''}
${description ? `Descripción de la empresa: ${description}` : ''}

ELEMENTOS A GENERAR:
1. MISIÓN: El propósito fundamental de la empresa, qué hace y por qué existe
2. VISIÓN: Dónde quiere estar la empresa en el futuro (5-10 años)
3. PROPUESTA DE VALOR: Qué hace única a la empresa y por qué los clientes deben elegirla

Responde únicamente con el JSON solicitado.`;

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
        max_tokens: 800,
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

      try {
        const strategy = JSON.parse(generatedContent);
        console.log('✅ Estrategia parseada:', strategy);
        
        return new Response(JSON.stringify({ 
          success: true,
          strategy: strategy
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('❌ Error parsing JSON:', parseError);
        console.log('Raw content:', generatedContent);
        throw new Error('Error procesando la respuesta de IA');
      }
    }

    // Nuevo: Generar branding visual
    if (body.generateBranding) {
      console.log('🎨 Generando branding visual...');
      
      const { companyName, industryType, description, mission, vision, valueProposition } = body;
      
      const systemPrompt = `Eres un experto en branding y diseño de identidad corporativa especializado en crear identidades visuales coherentes y memorables.

INSTRUCCIONES:
- Genera una identidad visual completa basada en la estrategia empresarial
- Los colores deben estar alineados con la industria y valores de la empresa
- Proporciona códigos hexadecimales válidos
- La identidad visual debe ser profesional y distintiva
- Considera la psicología del color para la industria específica

FORMATO DE RESPUESTA (JSON):
{
  "branding": {
    "primary_color": "#XXXXXX",
    "secondary_color": "#XXXXXX", 
    "complementary_color_1": "#XXXXXX",
    "complementary_color_2": "#XXXXXX",
    "visual_identity": "Descripción de la identidad visual (2-3 oraciones)"
  }
}`;

      const userPrompt = `Crea una identidad visual completa para la empresa "${companyName}" que opera en el sector "${industryType}".

INFORMACIÓN ESTRATÉGICA:
- Misión: ${mission || 'No definida'}
- Visión: ${vision || 'No definida'}
- Propuesta de valor: ${valueProposition || 'No definida'}
- Descripción: ${description || 'No disponible'}

COLORES A GENERAR:
1. Color primario: El color principal de la marca, debe reflejar los valores core
2. Color secundario: Color complementario para balance visual
3. Color complementario 1: Para acentos y elementos destacados
4. Color complementario 2: Para backgrounds y elementos sutiles

IDENTIDAD VISUAL:
Descripción de cómo estos elementos trabajjan juntos para crear una identidad cohesiva y memorable.

Los colores deben ser apropiados para la industria ${industryType} y transmitir profesionalismo, confianza y los valores únicos de la empresa.

Responde únicamente con el JSON solicitado.`;

      // Obtener configuración de IA
      const { data: config, error: configError } = await supabase
        .from('ai_model_configurations')
        .select('*')
        .eq('function_name', 'generate-company-content')
        .single();

      const aiConfig = config || {
        model_name: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0
      };

      console.log('📤 Enviando request a OpenAI para branding...');
      
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
      console.log('✅ Respuesta recibida de OpenAI para branding');

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ Respuesta inválida de OpenAI:', data);
        throw new Error('Respuesta inválida de OpenAI');
      }

      const generatedContent = data.choices[0].message.content.trim();
      console.log('📄 Branding generado:', generatedContent);

      try {
        const brandingData = JSON.parse(generatedContent);
        console.log('✅ Branding parseado:', brandingData);
        
        return new Response(JSON.stringify({ 
          success: true,
          branding: brandingData.branding
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('❌ Error parsing branding JSON:', parseError);
        console.log('Raw content:', generatedContent);
        throw new Error('Error procesando la respuesta de branding de IA');
      }
    }

    // Mantener compatibilidad con el formato anterior
    const { field, companyInfo } = body;
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