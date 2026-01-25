import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorAnalysis {
  competidores_locales: CompetitorData[];
  competidores_regionales: CompetitorData[];
  referentes: CompetitorData[];
}

interface CompetitorData {
  nombre: string;
  descripcion: string;
  ubicacion: string;
  sitio_web: string;
  motivo: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Fetch company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .maybeSingle();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract competitor info and products from webhook_data if available
    let diagnosticCompetitors: string[] = [];
    let diagnosticProducts: string[] = [];
    
    if (company.webhook_data) {
      const webhookData = company.webhook_data as Record<string, any>;
      
      // Extract competitors
      if (webhookData.market?.competitors) {
        if (Array.isArray(webhookData.market.competitors)) {
          diagnosticCompetitors = webhookData.market.competitors;
        } else if (typeof webhookData.market.competitors === 'string') {
          diagnosticCompetitors = webhookData.market.competitors.split(',').map((c: string) => c.trim());
        }
      }
      
      // Extract products/services from diagnostic
      if (webhookData.products?.services_offered) {
        if (Array.isArray(webhookData.products.services_offered)) {
          diagnosticProducts = webhookData.products.services_offered;
        } else if (typeof webhookData.products.services_offered === 'string') {
          diagnosticProducts = webhookData.products.services_offered.split(',').map((p: string) => p.trim());
        }
      }
    }

    // Build payload for n8n webhook
    const payload = {
      company_name: company.name || '',
      company_description: company.description || '',
      website_url: company.website_url || '',
      industry_sector: company.industry_sector || '',
      country: company.country || 'Colombia',
      social_networks: {
        instagram: company.instagram_url || '',
        facebook: company.facebook_url || '',
        linkedin: company.linkedin_url || '',
        twitter: company.twitter_url || '',
        tiktok: company.tiktok_url || '',
        youtube: company.youtube_url || '',
      },
      diagnostic_competitors: diagnosticCompetitors,
      diagnostic_products: diagnosticProducts,
    };

    console.log('Sending payload to n8n:', JSON.stringify(payload, null, 2));

    // Get n8n auth credentials
    const n8nUser = Deno.env.get('N8N_AUTH_USER');
    const n8nPass = Deno.env.get('N8N_AUTH_PASS');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (n8nUser && n8nPass) {
      headers['Authorization'] = 'Basic ' + btoa(`${n8nUser}:${n8nPass}`);
    }

    // Call n8n webhook with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

    try {
      const n8nResponse = await fetch('https://buildera.app.n8n.cloud/webhook/company-competitors', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('n8n webhook error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to analyze competitors', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const analysisResult = await n8nResponse.json();
      console.log('n8n response:', JSON.stringify(analysisResult, null, 2));

      // The response is an array, get the first element
      const analysis: CompetitorAnalysis = Array.isArray(analysisResult) 
        ? analysisResult[0] 
        : analysisResult;

      return new Response(
        JSON.stringify({ 
          success: true, 
          analysis,
          company_name: company.name 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'Request timeout - analysis took too long' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in analyze-competitors:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
