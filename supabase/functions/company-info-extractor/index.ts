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

    // Call external API to extract company info
    console.log('📡 Calling N8N API for company data extraction...');
    let apiData = null;
    
    try {
      const apiResponse = await fetch('https://buildera.app.n8n.cloud/webhook/company-info-extractor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
      });

      if (!apiResponse.ok) {
        console.error('API response not ok:', apiResponse.status, apiResponse.statusText);
      } else {
        const apiResult = await apiResponse.json();
        console.log('📊 API Response received:', JSON.stringify(apiResult, null, 2));
        
        if (Array.isArray(apiResult) && apiResult.length > 0 && apiResult[0].output?.data) {
          apiData = apiResult[0].output.data;
        }
      }
    } catch (error) {
      console.error('Error calling external API:', error);
      // Continue with fallback data if API fails
    }

    // Extract basic info from URL as fallback
    const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const fallbackName = domain.split('.')[0];

    // Use API data if available, otherwise use fallback
    const companyData = {
      name: apiData?.company_name || apiData?.legal_name || fallbackName,
      website_url: apiData?.website || url,
      industry_sector: apiData?.industries?.[0] || 'General',
      company_size: apiData?.num_employees ? 
        (parseInt(apiData.num_employees.replace(/,/g, '')) > 250 ? 'large' : 
         parseInt(apiData.num_employees.replace(/,/g, '')) > 50 ? 'medium' : 'small') : 'small',
      description: apiData?.business_description || `Empresa líder en el sector de ${fallbackName}`,
      tax_id: apiData?.tax_id,
      phone: apiData?.phone,
      email: apiData?.email,
      founded_date: apiData?.founded_date,
      annual_revenue: apiData?.annual_revenue,
      revenue_currency: apiData?.revenue_currency,
      value_proposition: apiData?.value_proposition,
      address: apiData?.address,
      logo_url: apiData?.logo_url,
      linkedin_url: apiData?.social_links?.linkedin,
      facebook_url: apiData?.social_links?.facebook,
      twitter_url: apiData?.social_links?.twitter,
      instagram_url: apiData?.social_links?.instagram,
      youtube_url: apiData?.social_links?.youtube,
      tiktok_url: apiData?.social_links?.tiktok,
      products_services: apiData?.products_services,
      key_people: apiData?.key_people,
      corporate_values: apiData?.corporate_values
    };

    // Check for existing company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', user.id)
      .eq('website_url', url)
      .maybeSingle();

    let companyId;
    
    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('✅ Updating existing company:', companyId);
      
      // Update existing company with new data
      await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId);
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_by: user.id
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

    return new Response(
      JSON.stringify({ 
        companyId,
        data: companyData
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