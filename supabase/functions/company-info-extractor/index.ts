import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Extracting company info from URL:', url);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract domain from URL for company name
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const companyName = domain.split('.')[0];

    // Create basic company record
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', user.id)
      .eq('website_url', url)
      .maybeSingle();

    let companyId;
    
    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('✅ Using existing company:', companyId);
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          website_url: url,
          created_by: user.id,
          industry_sector: 'General',
          company_size: 'small'
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        return new Response(
          JSON.stringify({ error: 'Failed to create company record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      companyId = newCompany.id;

      // Create company membership
      await supabase
        .from('company_members')
        .insert({
          user_id: user.id,
          company_id: companyId,
          role: 'owner',
          is_primary: true
        });

      // Update user profile with primary company
      await supabase
        .from('profiles')
        .update({ primary_company_id: companyId })
        .eq('user_id', user.id);

      console.log('✅ Created new company:', companyId);
    }

    const extractedData = {
      name: companyName,
      website_url: url,
      industry_sector: 'General',
      company_size: 'small',
      description: `Empresa líder en el sector de ${companyName}`
    };

    return new Response(
      JSON.stringify({ 
        companyId,
        data: extractedData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in company-info-extractor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});