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

    // Execute synchronously now
    const result = await extractCompanyData(url, user.id, token);
    
    return new Response(
      JSON.stringify(result),
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

async function extractCompanyData(url: string, userId: string, token: string) {
  console.log('🔄 Starting extraction for URL:', url);
  try {
    // Normalize URL (ensure scheme) and get domain for matching
    const normalizedUrl = /^(https?:)\/\//i.test(url) ? url : `https://${url}`;
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
/*
    // Idempotency: avoid duplicate work if already processed recently
    const { data: existingProcessed, error: processedErr } = await supabase
      .from('companies')
      .select('id, webhook_processed_at, webhook_data')
      .eq('created_by', userId)
      .ilike('website_url', `%${domain}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (processedErr) {
      console.warn('⚠️ Error checking existing processed company:', processedErr);
    }

    if (existingProcessed?.webhook_processed_at) {
      console.log('🟢 Company already processed recently, returning existing data for:', url);
      return {
        success: true,
        companyId: existingProcessed.id,
        data: existingProcessed.webhook_data?.raw_api_response,
        message: 'Datos de empresa ya procesados'
      };
    }
*/
    // Call external API to extract company info
    console.log('📡 Calling N8N API for company data extraction...');
    let apiData = null;
    let apiError = null;
    
    try {
      const apiUrl = `https://buildera.app.n8n.cloud/webhook/company-info-extractor?URL=${encodeURIComponent(normalizedUrl)}`;
      console.log('🔗 API URL:', apiUrl);
      
      // Get authentication credentials from environment
      const authUser = Deno.env.get('N8N_AUTH_USER');
      const authPass = Deno.env.get('N8N_AUTH_PASS');
      
      if (!authUser || !authPass) {
        console.error('❌ N8N authentication credentials not found');
        throw new Error('N8N authentication credentials not configured');
      }
      
      // Create basic auth header
      const credentials = btoa(`${authUser}:${authPass}`);

      // Single attempt (no retries). User can retry from UI if needed
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 250000); // 110s timeout
      const apiResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).catch((err) => {
        throw new Error(`Network error calling N8N: ${(err as Error).message}`);
      });
      clearTimeout(timeout);

      if (!apiResponse.ok) {
        const errText = await apiResponse.text().catch(() => '');
        throw new Error(`API ${apiResponse.status} ${apiResponse.statusText}: ${errText.slice(0,300)}`);
      }

      let apiResult: any;
      const contentType = apiResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        apiResult = await apiResponse.json();
      } else {
        const rawText = await apiResponse.text();
        let parsed: any = null;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          // Try to extract a JSON object/array from noisy text
          const arrStart = rawText.indexOf('[');
          const arrEnd = rawText.lastIndexOf(']');
          const objStart = rawText.indexOf('{');
          const objEnd = rawText.lastIndexOf('}');
          const candidate = arrStart !== -1 && arrEnd > arrStart
            ? rawText.slice(arrStart, arrEnd + 1)
            : (objStart !== -1 && objEnd > objStart ? rawText.slice(objStart, objEnd + 1) : null);
          if (candidate) {
            try { parsed = JSON.parse(candidate); } catch {}
          }
        }
        apiResult = parsed ?? rawText;
      }

      // Normalize different possible response shapes from N8N
      let extracted: any = null;
      if (Array.isArray(apiResult) && apiResult.length > 0) {
        const item = apiResult[0];
        extracted = item?.output?.data ?? item?.data ?? item?.output ?? null;
      } else if (apiResult && typeof apiResult === 'object') {
        extracted = (apiResult as any).data ?? apiResult;
      }

      if (!extracted) {
        throw new Error('Estructura de respuesta inválida del API (sin datos).');
      }

      apiData = extracted;

      // Validate minimal content
      if (!apiData.company_name && !apiData.legal_name && !apiData.business_description) {
        throw new Error('La API retornó datos insuficientes de la empresa.');
      }
    } catch (error) {
      console.error('💥 Error calling external API:', error);
      return;
    }

    // Extract basic info from URL as fallback (reuse computed domain)
    const fallbackName = domain.split('.')[0];

    // Helper function to extract country from address
    function extractCountryFromAddress(address: string): string | null {
      if (!address) return null;
      const parts = address.split(',');
      return parts[parts.length - 1]?.trim() || null;
    }

    // Use API data if available, otherwise use fallback
    const companyData = {
      name: apiData?.company_name || apiData?.legal_name || fallbackName,
      description: apiData?.business_description || `Empresa líder en el sector de ${fallbackName}`,
      website_url: apiData?.website || url,
      industry_sector: apiData?.industries?.[0] || 'General',
      company_size: apiData?.num_employees ? 
        (parseInt(apiData.num_employees.replace(/,/g, '')) > 250 ? 'large' : 
         parseInt(apiData.num_employees.replace(/,/g, '')) > 50 ? 'medium' : 'small') : 'small',
      country: apiData?.address ? extractCountryFromAddress(apiData.address) : null,
      logo_url: apiData?.logo_url,
      linkedin_url: apiData?.social_links?.linkedin,
      facebook_url: apiData?.social_links?.facebook,
      twitter_url: apiData?.social_links?.twitter,
      instagram_url: apiData?.social_links?.instagram,
      youtube_url: apiData?.social_links?.youtube,
      tiktok_url: apiData?.social_links?.tiktok,
      webhook_data: apiData ? {
        raw_api_response: apiData,
        processed_at: new Date().toISOString(),
        tax_id: apiData.tax_id,
        phone: apiData.phone,
        email: apiData.email,
        founded_date: apiData.founded_date,
        annual_revenue: apiData.annual_revenue,
        revenue_currency: apiData.revenue_currency,
        value_proposition: apiData.value_proposition,
        address: apiData.address,
        products_services: apiData.products_services,
        key_people: apiData.key_people,
        corporate_values: apiData.corporate_values
      } : null,
      webhook_processed_at: apiData ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    // Check for existing company (match by domain to avoid scheme/WWW mismatches)
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', userId)
      .ilike('website_url', `%${domain}%`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let companyId;
    
    if (existingCompany) {
      companyId = existingCompany.id;
      console.log('✅ Updating existing company:', companyId);
      
      // Update existing company with new data
      const { error: updateError } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', companyId);

      if (updateError) {
        console.error('Error updating company:', updateError);
        return;
      }

      console.log('✅ Company updated successfully with API data');
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_by: userId
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        return;
      }

      companyId = newCompany.id;
      console.log('✅ Created new company:', companyId);
    }

    console.log('🎉 Extraction completed successfully for:', url);
    
    return {
      success: true,
      companyId,
      data: apiData,
      message: 'Información de empresa procesada exitosamente'
    };

  } catch (error) {
    console.error('💥 Error in extraction:', error);
    throw error;
  }
}