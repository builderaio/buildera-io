import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate cryptographically secure random bytes
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
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

    const { email, userId } = await req.json();

    if (!email && !userId) {
      return new Response(
        JSON.stringify({ error: "Email or userId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUserId = userId;

    // If email provided, look up user
    if (email && !userId) {
      const { data: users, error: lookupError } = await supabaseClient.auth.admin.listUsers();
      
      if (lookupError) {
        console.error("Error looking up user:", lookupError);
        return new Response(
          JSON.stringify({ error: "User lookup failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const foundUser = users.users.find(u => u.email === email);
      if (!foundUser) {
        return new Response(
          JSON.stringify({ error: "No biometric credentials found", hasCredentials: false }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      targetUserId = foundUser.id;
    }

    // Get user's credentials
    const { data: credentials, error: credError } = await supabaseClient
      .from("user_credentials")
      .select("credential_id, transports")
      .eq("user_id", targetUserId)
      .eq("is_active", true);

    if (credError || !credentials || credentials.length === 0) {
      return new Response(
        JSON.stringify({ error: "No biometric credentials found", hasCredentials: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const challenge = generateChallenge();

    // Store challenge for verification
    await supabaseClient
      .from("auth_rate_limits")
      .upsert({
        identifier: `webauthn_login_${targetUserId}`,
        attempt_count: 0,
        first_attempt: new Date().toISOString(),
        last_attempt: new Date().toISOString(),
        blocked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }, { onConflict: "identifier" });

    const rpId = new URL(req.headers.get("origin") || "https://buildera.io").hostname;

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credential_id,
      type: "public-key" as const,
      transports: cred.transports || ["internal"],
    }));

    const options = {
      challenge,
      rpId,
      allowCredentials,
      userVerification: "required",
      timeout: 60000,
    };

    return new Response(
      JSON.stringify({ options, userId: targetUserId, hasCredentials: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating login options:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
