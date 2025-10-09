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
    const systemPrompt = `Eres ERA, un asistente de marketing especializado en optimizar descripciones de campañas.
Tu objetivo es mejorar descripciones de campañas de marketing haciéndolas más claras, persuasivas y orientadas a resultados.

IMPORTANTE:
- Mantén el tono profesional pero accesible
- Enfócate en los beneficios y resultados medibles
- Usa un lenguaje claro y directo
- Incluye elementos que generen urgencia o interés
- Alinea la descripción con el tipo de objetivo de la campaña
- La descripción debe ser concisa (2-4 oraciones máximo)`;

    const userPrompt = `Optimiza esta descripción de campaña de marketing:

CONTEXTO:
- Empresa: ${companyName || 'No especificada'}
- Industria: ${industry || 'No especificada'}
- Nombre de campaña: ${campaignName}
- Tipo de objetivo: ${objectiveType}
- Descripción actual: ${description || 'Sin descripción'}

TAREA:
Genera una descripción optimizada que sea:
1. Clara y persuasiva
2. Alineada con el objetivo de ${objectiveType}
3. Enfocada en resultados medibles
4. Profesional pero accesible
5. Concisa (2-4 oraciones)

Devuelve SOLO la descripción optimizada, sin explicaciones adicionales.`;

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