import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: "companyId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load company data
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name, description, industry_sector, website_url, country")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load existing strategy if available
    const { data: strategy } = await supabase
      .from("company_strategy")
      .select("mision, vision, propuesta_valor")
      .eq("company_id", companyId)
      .maybeSingle();

    const prompt = `Eres un experto en branding y diseño de identidad visual para empresas. Genera una identidad de marca completa para la siguiente empresa.

EMPRESA:
- Nombre: ${company.name}
- Descripción: ${company.description || "No disponible"}
- Industria: ${company.industry_sector || "No especificada"}
- País: ${company.country || "No especificado"}
- Sitio web: ${company.website_url || "No disponible"}
${strategy ? `- Misión: ${strategy.mision || "N/A"}
- Visión: ${strategy.vision || "N/A"}
- Propuesta de valor: ${strategy.propuesta_valor || "N/A"}` : ""}

Genera la identidad de marca usando la función proporcionada.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Eres un experto en branding corporativo. Responde siempre en español." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_brand",
              description: "Generate complete brand identity for a company",
              parameters: {
                type: "object",
                properties: {
                  primary_color: { type: "string", description: "Primary brand color in hex (e.g., #3c46b2)" },
                  secondary_color: { type: "string", description: "Secondary accent color in hex" },
                  complementary_color_1: { type: "string", description: "First complementary color in hex" },
                  complementary_color_2: { type: "string", description: "Second complementary color in hex" },
                  visual_identity: { type: "string", description: "Visual identity description in Spanish (2-3 sentences)" },
                  brand_voice: {
                    type: "object",
                    properties: {
                      personalidad: { type: "string", description: "Brand personality in one word (e.g., Profesional, Innovador, Cercano)" },
                      descripcion: { type: "string", description: "Brand voice description in Spanish (1-2 sentences)" },
                      palabras_clave: { type: "array", items: { type: "string" }, description: "5-7 brand keywords in Spanish" },
                    },
                    required: ["personalidad", "descripcion", "palabras_clave"],
                  },
                  color_justifications: {
                    type: "object",
                    properties: {
                      primary: { type: "string", description: "Justification for primary color choice in Spanish" },
                      secondary: { type: "string", description: "Justification for secondary color choice in Spanish" },
                    },
                    required: ["primary", "secondary"],
                  },
                },
                required: ["primary_color", "secondary_color", "complementary_color_1", "complementary_color_2", "visual_identity", "brand_voice", "color_justifications"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_brand" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in AI response:", JSON.stringify(aiResult));
      return new Response(JSON.stringify({ error: "AI did not generate brand data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brandData = JSON.parse(toolCall.function.arguments);
    console.log("Generated brand data:", JSON.stringify(brandData));

    // Update company_branding
    const { error: updateError } = await supabase
      .from("company_branding")
      .update({
        primary_color: brandData.primary_color,
        secondary_color: brandData.secondary_color,
        complementary_color_1: brandData.complementary_color_1,
        complementary_color_2: brandData.complementary_color_2,
        visual_identity: brandData.visual_identity,
        brand_voice: brandData.brand_voice,
        color_justifications: brandData.color_justifications,
        full_brand_data: brandData,
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", companyId);

    if (updateError) {
      // Try upsert if no row exists
      const { error: insertError } = await supabase
        .from("company_branding")
        .upsert({
          company_id: companyId,
          primary_color: brandData.primary_color,
          secondary_color: brandData.secondary_color,
          complementary_color_1: brandData.complementary_color_1,
          complementary_color_2: brandData.complementary_color_2,
          visual_identity: brandData.visual_identity,
          brand_voice: brandData.brand_voice,
          color_justifications: brandData.color_justifications,
          full_brand_data: brandData,
          updated_at: new Date().toISOString(),
        }, { onConflict: "company_id" });

      if (insertError) {
        console.error("Error saving brand data:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save brand data" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, brand: brandData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-brand-identity error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
