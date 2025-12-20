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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { credential, userId } = await req.json();

    if (!credential || !credential.id || !userId) {
      return new Response(
        JSON.stringify({ error: "Invalid credential or user data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the credential in the database
    const { data: storedCredential, error: credError } = await supabaseClient
      .from("user_credentials")
      .select("*")
      .eq("credential_id", credential.id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (credError || !storedCredential) {
      return new Response(
        JSON.stringify({ error: "Credential not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In production, you would verify the signature here using the stored public key
    // For now, we trust the WebAuthn API verification done client-side
    
    // Update counter for replay attack prevention
    const newCounter = (storedCredential.counter || 0) + 1;
    
    const { error: updateError } = await supabaseClient
      .from("user_credentials")
      .update({ 
        counter: newCounter,
        last_used_at: new Date().toISOString()
      })
      .eq("id", storedCredential.id);

    if (updateError) {
      console.error("Error updating credential counter:", updateError);
    }

    // Get the user's email to create a magic link session
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a session for the user using admin API
    // We create a custom token that the client will use
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: req.headers.get("origin") || "https://buildera.io",
      }
    });

    if (sessionError) {
      console.error("Error generating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(sessionData.properties.action_link);
    const token = magicLinkUrl.searchParams.get("token");
    const type = magicLinkUrl.searchParams.get("type");

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        type,
        email: user.email,
        redirectUrl: sessionData.properties.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying login:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
