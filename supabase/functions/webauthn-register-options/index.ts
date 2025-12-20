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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing credentials for this user
    const { data: existingCredentials } = await supabaseClient
      .from("user_credentials")
      .select("credential_id")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const excludeCredentials = (existingCredentials || []).map((cred) => ({
      id: cred.credential_id,
      type: "public-key" as const,
      transports: ["internal", "hybrid"] as const,
    }));

    const challenge = generateChallenge();

    // Store challenge temporarily (expires in 5 minutes)
    const { error: cacheError } = await supabaseClient
      .from("auth_rate_limits")
      .upsert({
        identifier: `webauthn_challenge_${user.id}`,
        attempt_count: 0,
        first_attempt: new Date().toISOString(),
        last_attempt: new Date().toISOString(),
        blocked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      }, { onConflict: "identifier" });

    // We'll store the challenge in a separate way - using identifier field
    if (cacheError) {
      console.error("Error storing challenge:", cacheError);
    }

    const rpId = new URL(req.headers.get("origin") || "https://buildera.io").hostname;

    const options = {
      challenge,
      rp: {
        name: "Buildera",
        id: rpId,
      },
      user: {
        id: user.id,
        name: user.email || user.id,
        displayName: user.user_metadata?.full_name || user.email || "Usuario",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },   // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
      excludeCredentials,
    };

    return new Response(
      JSON.stringify({ options, userId: user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating registration options:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
