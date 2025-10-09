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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      description, 
      campaignName, 
      objectiveType,
      companyName,
      industry 
    } = await req.json();

    console.log('ERA Campaign Optimizer - Processing request:', { 
      campaignName, 
      objectiveType, 
      companyName 
    });

    // Construir contexto para ERA
    const systemPrompt = `Eres ERA, el asistente de IA de Buildera especializado en estrategia de marketing.
Tu misión es REESCRIBIR descripciones de campaña en tono interno (brief), claro, específico y alineado a objetivos.

REGLAS DE ESTILO:
- Español neutro, tercera persona, profesional y accesible
- Sin llamados a la acción ni tono publicitario
- PROHIBIDO usar verbos/expresiones comerciales: "descubre", "únete", "impulsa", "revoluciona", "sé de los primeros", "transforma", "maximiza", "potencia"
- No inventes datos: no agregues públicos, canales, cifras ni fechas que no estén en el contexto
- Mantén nombres y términos clave existentes (empresa, campaña, producto)
- Enfócate en propósito, enfoque táctico y resultado esperado medible si existe
- Extensión: 2–3 oraciones en un solo párrafo`;

    const userPrompt = `Reescribe la siguiente descripción de campaña para uso interno.

Contexto de la campaña:
- Empresa: ${companyName || 'No especificada'}
- Sector: ${industry || 'No especificado'}
- Nombre de la campaña: ${campaignName}
- Objetivo de marketing: ${objectiveType}
- Descripción actual: ${description || 'No hay descripción previa'}

Instrucciones de redacción:
- Explica el propósito principal alineado a "${objectiveType}"
- Describe el enfoque/qué hará la campaña de forma neutra (sin CTA)
- Incluye el resultado esperado o criterio de éxito solo si está presente en el contexto; si no, omítelo
- Mantén 2–3 oraciones, un único párrafo

Responde ÚNICAMENTE con la nueva descripción, sin títulos ni explicaciones.`;

    // Llamar al universal AI handler
    const { data: response, error } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'campaign_description_optimization',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        context: {
          campaignName,
          objectiveType,
          companyName,
          industry,
          maxTokens: 300
        }
      }
    });

    if (error) {
      throw new Error(`Universal AI Handler error: ${error.message}`);
    }

    if (!response.success) {
      throw new Error(response.error || 'Error desconocido del handler universal');
    }

    const optimizedDescription = response.optimizedText || response.response;

    if (!optimizedDescription) {
      throw new Error("No se pudo generar una descripción optimizada");
    }

    console.log('ERA Campaign Optimizer - Response generated successfully');

    return new Response(
      JSON.stringify({ 
        optimizedDescription,
        provider: response.provider,
        model: response.model 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error en era-campaign-optimizer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});