import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for RLS bypass
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Get company_id from request
    const { company_id } = await req.json();
    
    if (!company_id) {
      return new Response(
        JSON.stringify({ error: 'company_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Fetching data for company:', company_id);

    // Verify user is member of this company
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('company_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single();

    if (memberError || !membership) {
      console.error('❌ Not a member:', memberError);
      return new Response(
        JSON.stringify({ error: 'Not a member of this company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User is member with role:', membership.role);

    // Fetch objectives and audiences using service role (bypasses RLS)
    const [objectivesResult, audiencesResult] = await Promise.all([
      supabaseAdmin
        .from('company_objectives')
        .select('*')
        .eq('company_id', company_id)
        .eq('status', 'active')
        .order('priority', { ascending: true }),
      supabaseAdmin
        .from('company_audiences')
        .select('*')
        .eq('company_id', company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ]);

    if (objectivesResult.error) {
      console.error('❌ Error fetching objectives:', objectivesResult.error);
    }
    if (audiencesResult.error) {
      console.error('❌ Error fetching audiences:', audiencesResult.error);
    }

    const objectives = objectivesResult.data || [];
    const audiences = audiencesResult.data || [];

    console.log('📈 Fetched:', {
      objectives: objectives.length,
      audiences: audiences.length,
      company_id
    });

    return new Response(
      JSON.stringify({
        objectives,
        audiences,
        company_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Error in get-company-data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
