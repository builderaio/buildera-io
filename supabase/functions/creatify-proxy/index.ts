import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREATIFY_BASE = "https://api.creatify.ai/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CREATIFY_API_ID = Deno.env.get("CREATIFY_API_ID");
    const CREATIFY_API_KEY = Deno.env.get("CREATIFY_API_KEY");
    if (!CREATIFY_API_ID || !CREATIFY_API_KEY) {
      throw new Error("Creatify credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action, params } = await req.json();
    const creatifyHeaders = {
      "X-API-ID": CREATIFY_API_ID,
      "X-API-KEY": CREATIFY_API_KEY,
      "Content-Type": "application/json",
    };

    let response: Response;
    let endpoint: string;
    let method = "POST";

    switch (action) {
      // === LINKS ===
      case "create-link":
        endpoint = "/links/";
        break;

      // === URL TO VIDEO (correct endpoint: /link_to_videos/) ===
      case "url-to-video":
        endpoint = "/link_to_videos/";
        break;
      case "check-video-status":
        endpoint = `/link_to_videos/${params.id}/`;
        method = "GET";
        break;

      // === AI AVATAR (Lipsync) ===
      case "avatar-video":
        endpoint = "/lipsyncs/";
        break;
      case "check-avatar-status":
        endpoint = `/lipsyncs/${params.id}/`;
        method = "GET";
        break;

      // === AD CLONE ===
      case "ad-clone":
        endpoint = "/ad_clones/";
        break;
      case "check-clone-status":
        endpoint = `/ad_clones/${params.id}/`;
        method = "GET";
        break;

      // === IAB IMAGES ===
      case "iab-images":
        endpoint = "/iab_images/";
        break;
      case "check-iab-status":
        endpoint = `/iab_images/${params.id}/`;
        method = "GET";
        break;

      // === ASSET GENERATOR ===
      case "asset-generator":
        endpoint = "/asset_generation/";
        break;
      case "check-asset-status":
        endpoint = `/asset_generation/${params.id}/`;
        method = "GET";
        break;

      // === AI SCRIPTS ===
      case "ai-scripts":
        endpoint = "/ai_scripts/";
        break;

      // === TEXT TO SPEECH ===
      case "text-to-speech":
        endpoint = "/text_to_speech/";
        break;
      case "check-tts-status":
        endpoint = `/text_to_speech/${params.id}/`;
        method = "GET";
        break;

      // === LIST RESOURCES ===
      case "get-avatars":
        endpoint = "/personas/";
        method = "GET";
        break;
      case "get-voices":
        endpoint = "/voices/";
        method = "GET";
        break;
      case "get-visual-styles":
        endpoint = "/rendering_styles/";
        method = "GET";
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const fetchOptions: RequestInit = {
      method,
      headers: creatifyHeaders,
    };

    if (method === "POST" && params) {
      // Remove internal fields not needed by Creatify API
      const { id, company_id, campaign_id, calendar_item_id, ...creatifyParams } = params;

      // Rename link_id -> link for url-to-video (API expects "link" field)
      if (action === "url-to-video" && creatifyParams.link_id) {
        creatifyParams.link = creatifyParams.link_id;
        delete creatifyParams.link_id;
      }

      fetchOptions.body = JSON.stringify(creatifyParams);
    }

    response = await fetch(`${CREATIFY_BASE}${endpoint}`, fetchOptions);

    const data = await response.json();

    if (!response.ok) {
      console.error("Creatify API error:", response.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Creatify API error", details: data, status: response.status }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If it's a creation action, save job to DB
    if (method === "POST" && data.id && params?.company_id) {
      const jobType = action === "url-to-video" ? "url_to_video" :
                      action === "avatar-video" ? "avatar" :
                      action === "ad-clone" ? "ad_clone" :
                      action === "iab-images" ? "iab_images" :
                      action === "asset-generator" ? "asset_generator" :
                      action === "ai-scripts" ? "ai_script" :
                      action === "text-to-speech" ? "text_to_speech" : null;

      if (jobType) {
        await supabase.from("creatify_jobs").insert({
          company_id: params.company_id,
          user_id: user.id,
          job_type: jobType,
          creatify_job_id: data.id,
          status: data.status || "pending",
          input_params: params,
          campaign_id: params.campaign_id || null,
          calendar_item_id: params.calendar_item_id || null,
        });
      }
    }

    // If it's a status check, update the job in DB
    if (method === "GET" && params?.id && data.status) {
      const updateData: any = { status: data.status, updated_at: new Date().toISOString() };
      if (data.status === "done") {
        updateData.output_data = data;
        // Persist credits_used if returned by API
        if (data.credits_used !== undefined) {
          updateData.credits_used = data.credits_used;
        }
      }
      await supabase.from("creatify_jobs")
        .update(updateData)
        .eq("creatify_job_id", params.id);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("creatify-proxy error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
