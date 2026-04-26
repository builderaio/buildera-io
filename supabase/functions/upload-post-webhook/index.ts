import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

// Public webhook receiver: must accept POSTs from Upload-Post without JWT.
// IMPORTANT: This function is configured with verify_jwt = false in supabase/config.toml.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-upload-post-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Optional shared secret for signature verification (set later if Upload-Post supports HMAC)
const WEBHOOK_SECRET = Deno.env.get("UPLOAD_POST_WEBHOOK_SECRET") || "";

interface UploadPostEvent {
  event: string;
  job_id?: string;
  user_email?: string;
  profile_username?: string;
  platform?: string;
  media_type?: string;
  title?: string;
  caption?: string;
  result?: {
    success?: boolean;
    url?: string;
    publish_id?: string;
    error?: string;
  };
  account_name?: string;
  status?: string;
  reason?: string;
  created_at?: string;
}

async function resolveOwnerByUsername(profileUsername?: string) {
  if (!profileUsername) return { user_id: null, company_id: null };

  // social_accounts.company_username is the Upload-Post profile username
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("user_id")
    .eq("company_username", profileUsername)
    .limit(1);

  const userId = accounts?.[0]?.user_id ?? null;
  if (!userId) return { user_id: null, company_id: null };

  const { data: members } = await supabase
    .from("company_members")
    .select("company_id, is_primary")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .limit(1);

  return { user_id: userId, company_id: members?.[0]?.company_id ?? null };
}

async function handleUploadCompleted(ev: UploadPostEvent) {
  if (!ev.job_id) return;
  const newStatus = ev.result?.success ? "published" : "failed";
  const { error } = await supabase
    .from("scheduled_social_posts")
    .update({
      status: newStatus,
      upload_post_response: ev as any,
      updated_at: new Date().toISOString(),
    })
    .eq("job_id", ev.job_id);

  if (error) console.error("scheduled_social_posts update failed:", error);
}

async function handleAccountStatusChange(ev: UploadPostEvent, ownerUserId: string | null) {
  if (!ownerUserId || !ev.platform) return;

  const isConnected = ev.event === "social_account_connected";
  const requiresReauth = ev.event === "social_account_reauth_required";

  // Update social_accounts row(s) for this user/platform
  const update: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (ev.event === "social_account_disconnected") update.is_connected = false;
  if (isConnected) update.is_connected = true;
  if (requiresReauth) {
    update.is_connected = false;
    update.reauth_required = true;
  }

  const { error } = await supabase
    .from("social_accounts")
    .update(update)
    .eq("user_id", ownerUserId)
    .eq("platform", ev.platform);

  if (error) console.warn("social_accounts update warn:", error);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();

    // Optional HMAC signature verification (when Upload-Post starts signing)
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get("x-upload-post-signature") || "";
      if (!signature) {
        console.warn("Webhook signature missing while WEBHOOK_SECRET is configured");
      }
      // Lightweight check: prefix or shared token in header
      if (signature && signature !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let payload: UploadPostEvent;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📥 Upload-Post webhook received:", payload.event, payload.profile_username);

    // Resolve owner from profile_username for tenant attribution
    const { user_id, company_id } = await resolveOwnerByUsername(payload.profile_username);

    // Persist raw event for traceability
    const { error: insertErr } = await supabase
      .from("upload_post_webhook_events")
      .insert({
        event_type: payload.event,
        job_id: payload.job_id || null,
        profile_username: payload.profile_username || null,
        user_email: payload.user_email || null,
        platform: payload.platform || null,
        account_name: payload.account_name || null,
        status: payload.status || null,
        reason: payload.reason || null,
        payload: payload as any,
        company_id,
        user_id,
        processed: false,
      });
    if (insertErr) console.error("webhook event insert failed:", insertErr);

    // Side effects per event type
    try {
      switch (payload.event) {
        case "upload_completed":
          await handleUploadCompleted(payload);
          break;
        case "social_account_connected":
        case "social_account_disconnected":
        case "social_account_reauth_required":
          await handleAccountStatusChange(payload, user_id);
          break;
        default:
          console.log("ℹ️ Unhandled webhook event type:", payload.event);
      }

      // Mark processed
      if (payload.job_id) {
        await supabase
          .from("upload_post_webhook_events")
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq("job_id", payload.job_id)
          .eq("event_type", payload.event);
      }
    } catch (sideEffectErr) {
      console.error("Webhook side effect failed:", sideEffectErr);
    }

    // Always 200 to prevent Upload-Post retries on internal handler errors
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ upload-post-webhook fatal:", error);
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
