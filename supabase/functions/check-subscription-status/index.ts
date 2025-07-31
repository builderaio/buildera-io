import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get user subscription using the database function
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .rpc('get_user_subscription', { user_id_param: user.id });

    if (subscriptionError) {
      logStep("Error getting subscription", { error: subscriptionError });
      throw subscriptionError;
    }

    const subscription = subscriptionData?.[0];
    if (!subscription) {
      // Return default (Starter) plan
      return new Response(JSON.stringify({
        plan_name: 'Starter',
        plan_slug: 'starter',
        limits: {
          specialists: 1,
          data_analysis: 500,
          content_generation: 10,
          social_integrations: 0
        },
        status: 'active',
        current_period_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get current usage
    const { data: usageData, error: usageError } = await supabaseClient
      .from('subscription_usage')
      .select('usage_type, usage_count')
      .eq('user_id', user.id)
      .eq('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const usage = usageData?.reduce((acc, item) => {
      acc[item.usage_type] = item.usage_count;
      return acc;
    }, {} as Record<string, number>) || {};

    logStep("Subscription and usage retrieved", { 
      plan: subscription.plan_slug, 
      status: subscription.status,
      usage 
    });

    return new Response(JSON.stringify({
      ...subscription,
      usage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});