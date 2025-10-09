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
    const systemPrompt = `Eres ERA, el asistente de inteligencia artificial de Buildera especializado en marketing digital.
Tu tarea es optimizar descripciones de campañas de marketing para que sean claras, estratégicas y atractivas.

DIRECTRICES:
- Usa un lenguaje profesional pero cercano y accesible
- Describe el propósito principal de la campaña de forma concreta
- Explica qué se busca lograr con esta campaña específicamente
- La descripción debe servir como guía interna para el equipo de marketing
- NO uses lenguaje publicitario directo ni llamados a la acción
- NO inventes información que no esté en el contexto
- Sé específico sobre el tipo de objetivo (${objectiveType})
- Mantén la descripción entre 2-3 oraciones`;

    const userPrompt = `Optimiza la siguiente descripción de campaña:

CONTEXTO DE LA CAMPAÑA:
- Empresa: ${companyName || 'No especificada'}
- Sector: ${industry || 'No especificado'}
- Nombre de la campaña: ${campaignName}
- Objetivo de marketing: ${objectiveType}
- Descripción actual: ${description || 'No hay descripción previa'}

TAREA:
Genera una descripción optimizada que:
1. Explique claramente el propósito de la campaña "${campaignName}"
2. Esté alineada específicamente con el objetivo de ${objectiveType}
3. Sea útil como referencia interna para planificar y ejecutar la campaña
4. Use lenguaje descriptivo, NO lenguaje publicitario
5. Sea concisa (2-3 oraciones máximo)

Responde ÚNICAMENTE con la descripción optimizada, sin introducciones ni explicaciones.`;

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