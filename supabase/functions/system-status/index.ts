// Edge function: system-status
// Returns lightweight health information about the AI services and content
// generation availability for a company. It does NOT expose any secret values
// — only booleans that the dashboard panel uses to render status badges.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AIProviderStatus {
  configured: boolean;
  reachable: boolean | null; // null = not tested
  last_error?: string;
}

interface SystemStatusResponse {
  ai: {
    lovable_gateway: AIProviderStatus;
    openai: AIProviderStatus;
    content_generation_available: boolean; // true if at least one provider is up
  };
  enterprise_brain: {
    configured: boolean;
    status: "active" | "no_ai" | "error";
    last_error?: string;
  };
  generated_at: string;
}

async function pingLovableGateway(apiKey: string): Promise<AIProviderStatus> {
  try {
    // We hit a tiny non-streaming completion to confirm the key is valid &
    // the gateway is reachable. Use the cheapest/fastest model.
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });

    if (r.ok) return { configured: true, reachable: true };

    // 401/403 → key invalid; 402 → out of credits; 429 → rate limited (still configured)
    const body = await r.text().catch(() => "");
    return {
      configured: true,
      reachable: r.status === 429 ? true : false,
      last_error: `HTTP ${r.status}${body ? `: ${body.slice(0, 120)}` : ""}`,
    };
  } catch (e) {
    return {
      configured: true,
      reachable: false,
      last_error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function pingOpenAI(apiKey: string): Promise<AIProviderStatus> {
  try {
    // Call /models — extremely cheap and only validates the key.
    const r = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (r.ok) return { configured: true, reachable: true };
    return {
      configured: true,
      reachable: false,
      last_error: `HTTP ${r.status}`,
    };
  } catch (e) {
    return {
      configured: true,
      reachable: false,
      last_error: e instanceof Error ? e.message : String(e),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    const [lovable, openai] = await Promise.all([
      lovableKey
        ? pingLovableGateway(lovableKey)
        : Promise.resolve<AIProviderStatus>({ configured: false, reachable: null }),
      openaiKey
        ? pingOpenAI(openaiKey)
        : Promise.resolve<AIProviderStatus>({ configured: false, reachable: null }),
    ]);

    const contentGenAvailable =
      (lovable.configured && lovable.reachable === true) ||
      (openai.configured && openai.reachable === true);

    // Optional: probe Enterprise Brain config for the requesting company
    // We try to read company_autopilot_config for the company_id passed in body.
    let enterpriseBrain: SystemStatusResponse["enterprise_brain"] = {
      configured: contentGenAvailable,
      status: contentGenAvailable ? "active" : "no_ai",
    };

    try {
      const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
      const companyId: string | undefined = body?.company_id;
      if (companyId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        // Look at most recent autopilot error in last 24h
        const since = new Date(Date.now() - 86_400_000).toISOString();
        const { data: errs } = await supabase
          .from("autopilot_decisions")
          .select("reasoning, created_at")
          .eq("company_id", companyId)
          .eq("decision_type", "cycle_error")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = errs?.[0]?.reasoning as string | undefined;
        if (last && /quota|api[_ ]?key|unauthorized|401|403|missing/i.test(last)) {
          enterpriseBrain = {
            configured: false,
            status: "error",
            last_error: last.slice(0, 200),
          };
        } else if (!contentGenAvailable) {
          enterpriseBrain = { configured: false, status: "no_ai" };
        }
      }
    } catch (e) {
      console.warn("enterprise brain probe failed:", e);
    }

    const payload: SystemStatusResponse = {
      ai: {
        lovable_gateway: lovable,
        openai,
        content_generation_available: contentGenAvailable,
      },
      enterprise_brain: enterpriseBrain,
      generated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("system-status error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
