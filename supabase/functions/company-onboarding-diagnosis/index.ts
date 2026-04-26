import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

interface DiagnosisInput {
  company_id: string;
  website_url?: string;
  sector?: string;
}

interface DiagnosisOutput {
  propuesta_valor: string;
  mision: string;
  vision: string;
  audiencia: string;
  fortalezas: string[];
  insights: string[];
}

/** Lightweight HTML → text */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000);
}

async function fetchWebsiteContent(url: string): Promise<string> {
  if (!url) return "";
  const normalized = url.startsWith("http") ? url : `https://${url}`;

  // Try Firecrawl first if key is available
  if (FIRECRAWL_API_KEY) {
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: normalized,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const md = data?.data?.markdown ?? data?.markdown ?? "";
        if (md && md.length > 100) return String(md).slice(0, 8000);
      }
    } catch (e) {
      console.warn("Firecrawl failed, falling back to fetch", e);
    }
  }

  // Fallback: basic fetch + strip
  try {
    const res = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 BuilderaBot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return stripHtml(html);
  } catch (e) {
    console.warn("Basic fetch failed", e);
    return "";
  }
}

async function analyzeWithAI(
  websiteContent: string,
  sector: string | undefined,
  companyName: string,
): Promise<DiagnosisOutput> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY no configurada");
  }

  const systemPrompt = `Eres un consultor estratégico experto en diagnóstico empresarial. Analiza el contenido del sitio web de una empresa y extrae su ADN estratégico de forma concisa, profesional y accionable. Responde SIEMPRE en español y devuelve JSON válido siguiendo exactamente el esquema solicitado.`;

  const userPrompt = `Empresa: ${companyName}
Sector: ${sector || "No especificado"}

Contenido del sitio web:
"""
${websiteContent || "(Sin contenido disponible — infiere desde el nombre y sector)"}
"""

Devuelve un JSON con esta estructura exacta:
{
  "propuesta_valor": "1-2 frases que resuman qué hace única a la empresa",
  "mision": "1 frase sobre el propósito de la empresa",
  "vision": "1 frase sobre la aspiración a futuro",
  "audiencia": "Descripción del público objetivo principal en 1-2 frases",
  "fortalezas": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "insights": ["insight estratégico 1", "insight 2", "insight 3"]
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) throw new Error("Rate limit del AI Gateway. Reintentar en unos segundos.");
    if (res.status === 402) throw new Error("Créditos AI agotados. Añade créditos en Lovable.");
    throw new Error(`AI Gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  let parsed: DiagnosisOutput;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Respuesta IA no es JSON válido");
  }

  return {
    propuesta_valor: parsed.propuesta_valor ?? "",
    mision: parsed.mision ?? "",
    vision: parsed.vision ?? "",
    audiencia: parsed.audiencia ?? "",
    fortalezas: Array.isArray(parsed.fortalezas) ? parsed.fortalezas : [],
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const cycleId = crypto.randomUUID();

  try {
    const body = (await req.json()) as DiagnosisInput;
    const { company_id, website_url, sector } = body || {};

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id es requerido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Load company basics (name + url fallback)
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .select("id, name, website_url, industry_sector")
      .eq("id", company_id)
      .maybeSingle();

    if (companyErr || !company) {
      return new Response(
        JSON.stringify({ error: "Empresa no encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const finalUrl = website_url || company.website_url || "";
    const finalSector = sector || company.industry_sector || "";

    console.log(`[onboarding-diagnosis] company=${company.name} url=${finalUrl}`);

    // 1. Fetch website
    const content = await fetchWebsiteContent(finalUrl);
    console.log(`[onboarding-diagnosis] content length=${content.length}`);

    // 2. AI analysis
    const diagnosis = await analyzeWithAI(content, finalSector, company.name);

    // 3. Persist to company_strategy (only fill empty fields, don't overwrite)
    const { data: existing } = await supabase
      .from("company_strategy")
      .select("id, mision, vision, propuesta_valor")
      .eq("company_id", company_id)
      .maybeSingle();

    const populated_fields: string[] = [];
    const upsertPayload: Record<string, unknown> = {
      company_id,
      generated_with_ai: true,
      updated_at: new Date().toISOString(),
    };

    if (!existing?.mision && diagnosis.mision) {
      upsertPayload.mision = diagnosis.mision;
      populated_fields.push("mision");
    }
    if (!existing?.vision && diagnosis.vision) {
      upsertPayload.vision = diagnosis.vision;
      populated_fields.push("vision");
    }
    if (!existing?.propuesta_valor && diagnosis.propuesta_valor) {
      upsertPayload.propuesta_valor = diagnosis.propuesta_valor;
      populated_fields.push("propuesta_valor");
    }

    if (existing) {
      if (populated_fields.length > 0) {
        await supabase
          .from("company_strategy")
          .update(upsertPayload)
          .eq("company_id", company_id);
      }
    } else {
      // Always insert when missing — fills whatever is available
      if (diagnosis.mision) upsertPayload.mision = diagnosis.mision;
      if (diagnosis.vision) upsertPayload.vision = diagnosis.vision;
      if (diagnosis.propuesta_valor) upsertPayload.propuesta_valor = diagnosis.propuesta_valor;
      ["mision", "vision", "propuesta_valor"].forEach((f) => {
        if (upsertPayload[f] && !populated_fields.includes(f)) populated_fields.push(f);
      });
      await supabase.from("company_strategy").insert(upsertPayload);
    }

    // 4. Log to autopilot_execution_log (phase=SENSE)
    await supabase.from("autopilot_execution_log").insert({
      company_id,
      cycle_id: cycleId,
      phase: "SENSE",
      status: "completed",
      decisions_made: [],
      actions_taken: [
        {
          type: "onboarding_diagnosis",
          populated_fields,
          insights_count: diagnosis.insights.length,
        },
      ],
      content_generated: 0,
      content_approved: 0,
      content_rejected: 0,
      content_pending_review: 0,
      credits_consumed: 0,
      execution_time_ms: Date.now() - startedAt,
      context_snapshot: {
        cycle: "onboarding",
        website_url: finalUrl,
        sector: finalSector,
        content_length: content.length,
        diagnosis,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        insights: diagnosis.insights,
        populated_fields,
        diagnosis,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[onboarding-diagnosis] error", message);

    // Best-effort error log
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.company_id) {
        await supabase.from("autopilot_execution_log").insert({
          company_id: body.company_id,
          cycle_id: cycleId,
          phase: "SENSE",
          status: "failed",
          decisions_made: [],
          actions_taken: [],
          content_generated: 0,
          content_approved: 0,
          content_rejected: 0,
          content_pending_review: 0,
          credits_consumed: 0,
          execution_time_ms: Date.now() - startedAt,
          error_message: message,
          context_snapshot: { cycle: "onboarding" },
        });
      }
    } catch (_) { /* ignore */ }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
