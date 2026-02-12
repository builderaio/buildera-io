import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MARKETING AUTOPILOT ENGINE - Thin Wrapper
 * 
 * This function maintains backward compatibility by delegating to the
 * enterprise-autopilot-engine with department='marketing'.
 * 
 * All SENSE-THINK-GUARD-ACT-LEARN logic now lives in the enterprise engine.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Delegate to enterprise engine with department=marketing
    const enterpriseResponse = await fetch(`${supabaseUrl}/functions/v1/enterprise-autopilot-engine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: body.company_id,
        department: 'marketing',
      }),
    });

    const result = await enterpriseResponse.json();

    return new Response(JSON.stringify(result), {
      status: enterpriseResponse.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Marketing autopilot wrapper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
