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

    // Crear el prompt especializado según el tipo de campo
    let systemPrompt = `Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.

Instrucciones generales:
- Mantén el mensaje central del texto original
- Mejora la claridad y profesionalismo
- Usa un tono corporativo pero accesible
- Optimiza para impacto y memorabilidad
- Evita jerga excesiva
- Mantén la longitud apropiada para el tipo de campo`;

    let specificInstructions = '';

    switch (fieldType.toLowerCase()) {
      case 'misión':
      case 'misión empresarial':
        specificInstructions = `
Optimiza esta MISIÓN EMPRESARIAL:
- Debe ser clara y inspiradora
- Enfocada en el propósito de la empresa
- Incluye el valor que aporta a clientes/sociedad
- Máximo 150 palabras
- Usa verbos en presente`;
        break;

      case 'visión':
      case 'visión empresarial':
        specificInstructions = `
Optimiza esta VISIÓN EMPRESARIAL:
- Debe ser aspiracional y motivadora
- Enfocada en el futuro deseado
- Inspire a empleados y stakeholders
- Máximo 100 palabras
- Usa un lenguaje futuro y positivo`;
        break;

      case 'valores':
      case 'valores empresariales':
        specificInstructions = `
Optimiza estos VALORES EMPRESARIALES:
- Deben ser principios claros y accionables
- Reflejen la cultura de la empresa
- Sean memorables y aplicables
- Formato de lista o párrafo breve
- Máximo 120 palabras`;
        break;

      case 'descripción de producto':
      case 'producto':
        specificInstructions = `
Optimiza esta DESCRIPCIÓN DE PRODUCTO:
- Enfócate en beneficios, no solo características
- Incluye propuesta de valor única
- Dirígete al público objetivo
- Usa lenguaje persuasivo pero factual
- Máximo 200 palabras`;
        break;

      case 'objetivo empresarial':
      case 'objetivo':
        specificInstructions = `
Optimiza este OBJETIVO EMPRESARIAL:
- Debe ser específico y medible
- Orientado a resultados
- Temporalmente definido
- Realista pero ambicioso
- Máximo 100 palabras`;
        break;

      case 'descripción de empresa':
      case 'sobre nosotros':
        specificInstructions = `
Optimiza esta DESCRIPCIÓN DE EMPRESA:
- Historia y propósito claros
- Diferenciadores competitivos
- Enfoque en valor al cliente
- Tono profesional y confiable
- Máximo 250 palabras`;
        break;

      default:
        specificInstructions = `
Optimiza este CONTENIDO EMPRESARIAL:
- Mejora claridad y profesionalismo
- Mantén el mensaje principal
- Optimiza para impacto
- Usa lenguaje empresarial apropiado`;
    }

    const fullPrompt = `${systemPrompt}

${specificInstructions}

Contexto adicional de la empresa:
${context.companyName ? `Empresa: ${context.companyName}` : ''}
${context.industry ? `Industria: ${context.industry}` : ''}
${context.size ? `Tamaño: ${context.size}` : ''}

TEXTO ORIGINAL:
"${text}"

TEXTO OPTIMIZADO:`;

    console.log('Enviando prompt a OpenAI:', fullPrompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        temperature: 0.7,
        max_tokens: 500,
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
        fieldType
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