import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  url?: string;
  actions?: Array<{ action: string; title: string }>;
}

interface SendNotificationRequest {
  userIds?: string[];
  companyId?: string;
  payload: PushPayload;
}

// Web Push requires VAPID authentication
async function sendWebPush(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: PushPayload,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<boolean> {
  try {
    // Create JWT for VAPID
    const header = { alg: "ES256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      aud: new URL(subscription.endpoint).origin,
      exp: now + 12 * 60 * 60, // 12 hours
      sub: "mailto:admin@buildera.io",
    };

    // For production, you'd use a proper JWT library
    // This is a simplified version that may need adjustment
    const encodedPayload = JSON.stringify(payload);
    
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Encoding": "aes128gcm",
        "Authorization": `vapid t=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9, k=${vapidPublicKey}`,
        "TTL": "86400",
      },
      body: encodedPayload,
    });

    if (!response.ok) {
      console.error(`Push failed: ${response.status} ${await response.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userIds, companyId, payload }: SendNotificationRequest = await req.json();

    if (!payload || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "Title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query for subscriptions
    let query = supabaseClient
      .from("push_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds);
    }

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const success = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys_p256dh: sub.keys_p256dh,
            keys_auth: sub.keys_auth,
          },
          payload,
          vapidPrivateKey,
          vapidPublicKey
        );

        // Update last_used_at
        if (success) {
          await supabaseClient
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", sub.id);
        }

        return { subscriptionId: sub.id, success };
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: subscriptions.length,
        failed: subscriptions.length - successCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
