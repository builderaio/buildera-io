import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { credential, deviceName, deviceType } = await req.json();

    if (!credential || !credential.id || !credential.response) {
      return new Response(
        JSON.stringify({ error: "Invalid credential data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract public key from attestation response
    // In a production environment, you would fully verify the attestation
    // For simplicity, we're storing the raw credential data
    const credentialId = credential.id;
    const publicKey = credential.response.publicKey || credential.response.attestationObject;
    const transports = credential.response.transports || ["internal"];

    // Check if credential already exists
    const { data: existingCred } = await supabaseClient
      .from("user_credentials")
      .select("id")
      .eq("credential_id", credentialId)
      .single();

    if (existingCred) {
      return new Response(
        JSON.stringify({ error: "Credential already registered" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the credential
    const { data: newCredential, error: insertError } = await supabaseClient
      .from("user_credentials")
      .insert({
        user_id: user.id,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: deviceName || "Dispositivo biométrico",
        device_type: deviceType || "unknown",
        transports,
        counter: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing credential:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store credential" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        credential: {
          id: newCredential.id,
          deviceName: newCredential.device_name,
          deviceType: newCredential.device_type,
          createdAt: newCredential.created_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying registration:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
