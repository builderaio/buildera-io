import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos momentos." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, recarga tu cuenta." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("Error del gateway de IA:", response.status, errorText);
      throw new Error(`Error del gateway de IA: ${response.status}`);
    }

    const data = await response.json();
    const optimizedDescription = data.choices?.[0]?.message?.content?.trim();

    if (!optimizedDescription) {
      throw new Error("No se pudo generar una descripción optimizada");
    }

    return new Response(
      JSON.stringify({ optimizedDescription }), 
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