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
    const { url: inputUrl, companyId } = await req.json();
    
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

    // Determine URL: from input or from companyId
    let url = inputUrl;
    
    if (companyId && !url) {
      console.log('🔍 Fetching website_url from company:', companyId);
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('website_url')
        .eq('id', companyId)
        .single();
      
      if (companyError || !company?.website_url) {
        return new Response(
          JSON.stringify({ error: 'Company has no website URL configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      url = company.website_url;
      console.log('✅ Found website_url:', url);
    }
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL or companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Extracting company info from URL:', url);

    // Execute synchronously now
    const result = await extractCompanyData(url, user.id, token, companyId);
    
    return new Response(
      JSON.stringify(result ?? { success: false, message: 'No data generated' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in company-info-extractor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractCompanyData(url: string, userId: string, token: string, existingCompanyId?: string) {
  console.log('🔄 Starting extraction for URL:', url);
  try {
    // Normalize URL (ensure scheme) and get domain for matching
    const normalizedUrl = /^(https?:)\/\//i.test(url) ? url : `https://${url}`;
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    // Call external API to extract company info
    console.log('📡 Calling N8N API for company data extraction...');
    let apiData = null;
    
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 250000);
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

      const contentType = apiResponse.headers.get('content-type') || '';
      console.log(`📊 API Response status: ${apiResponse.status} ${apiResponse.statusText}, content-type: ${contentType}`);

      if (!apiResponse.ok) {
        const errText = await apiResponse.text().catch(() => '');
        throw new Error(`API ${apiResponse.status} ${apiResponse.statusText}: ${errText.slice(0,300)}`);
      }

      const rawBody = await apiResponse.text().catch(() => '');
      console.log('🧪 N8N raw body sample (truncated 2KB):', rawBody.slice(0, 2000));

      const safeParse = (txt: string) => {
        try { return JSON.parse(txt); } catch { return null; }
      };
      
      // Helper function to clean streaming JSON data
      const cleanStreamingJson = (text: string): string => {
        const lines = text.split('\n').filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.type === 'begin' || parsed.type === 'item' || parsed.type === 'end') {
              return false;
            }
            return true;
          } catch {
            return true;
          }
        });
        return lines.join('\n');
      };

      const cleanedBody = cleanStreamingJson(rawBody);
      let apiResult = safeParse(cleanedBody);

      if (!apiResult) {
        apiResult = safeParse(rawBody);
      }

      // Extract balanced array/object
      const extractBalanced = (text: string, startIndex: number, openChar: string, closeChar: string) => {
        let depth = 0;
        let start = -1;
        for (let i = startIndex; i < text.length; i++) {
          const ch = text[i];
          if (ch === openChar) { if (start === -1) start = i; depth++; }
          else if (ch === closeChar) { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
        }
        return null;
      };

      if (!apiResult) {
        const firstArr = cleanedBody.indexOf('[');
        if (firstArr !== -1) {
          const arrStr = extractBalanced(cleanedBody, firstArr, '[', ']');
          apiResult = arrStr ? safeParse(arrStr) : null;
        }
      }

      console.log('🧩 Parsed shape:', Array.isArray(apiResult) ? `array(len=${apiResult.length})` : typeof apiResult);

      // Handle NEW n8n response structure: [{ business_profile, social_presence, diagnosis }]
      let extracted: any = null;
      
      if (Array.isArray(apiResult) && apiResult.length > 0) {
        const firstItem = apiResult[0];
        console.log('🔎 First array item keys:', firstItem && typeof firstItem === 'object' ? Object.keys(firstItem) : typeof firstItem);
        
        // NEW STRUCTURE: Check for business_profile, social_presence, diagnosis
        if (firstItem?.business_profile || firstItem?.social_presence || firstItem?.diagnosis) {
          console.log('✅ Detected NEW n8n structure with business_profile, social_presence, diagnosis');
          extracted = firstItem;
        }
        // OLD STRUCTURE: item has { url, fetch_date, data }
        else if (firstItem?.data) {
          extracted = firstItem.data;
          console.log('✅ Extracted company data from array[0].data (OLD structure)');
        }
        else {
          extracted = firstItem;
          console.log('⚠️ Using array[0] as fallback');
        }
      } else if (apiResult && typeof apiResult === 'object') {
        extracted = apiResult;
        console.log('✅ Extracted from single object response');
      }

      if (!extracted) {
        console.warn('⚠️ N8N response had no structured data');
        extracted = null;
      }
      
      apiData = extracted || null;
      console.log('🎯 Final extracted data keys:', apiData && typeof apiData === 'object' ? Object.keys(apiData) : typeof apiData);

    } catch (error) {
      console.error('💥 Error calling external API:', error);
      throw error;
    }

    // Determine if we have the NEW structure or OLD structure
    const isNewStructure = apiData?.business_profile || apiData?.social_presence || apiData?.diagnosis;
    console.log('📦 Response structure type:', isNewStructure ? 'NEW (business_profile/social_presence/diagnosis)' : 'OLD (flat structure)');

    // Extract data based on structure type
    let companyData: any;
    let fullApiResponse: any;

    if (isNewStructure) {
      // NEW STRUCTURE: business_profile, social_presence, diagnosis
      const bp = apiData.business_profile || {};
      const sp = apiData.social_presence || {};
      const diag = apiData.diagnosis?.diagnosis || apiData.diagnosis || {};
      
      // Extract social links
      const socialLinks = bp.contact?.social_links || [];
      const findSocialUrl = (platform: string) => {
        return socialLinks.find((url: string) => url?.toLowerCase().includes(platform)) || null;
      };

      companyData = {
        name: bp.identity?.company_name || bp.identity?.legal_name || domain.split('.')[0],
        description: diag.executive_summary || bp.seo?.description?.[0] || `Empresa basada en ${domain}`,
        website_url: bp.identity?.url || normalizedUrl,
        industry_sector: bp.products?.services?.[0] || 'General',
        country: bp.market?.country?.[0] || bp.market?.area_served?.[0] || null,
        logo_url: bp.identity?.logo || null,
        linkedin_url: findSocialUrl('linkedin'),
        facebook_url: findSocialUrl('facebook'),
        twitter_url: findSocialUrl('twitter'),
        instagram_url: findSocialUrl('instagram'),
        youtube_url: findSocialUrl('youtube'),
        tiktok_url: findSocialUrl('tiktok'),
        webhook_data: {
          raw_api_response: apiData,
          processed_at: new Date().toISOString(),
          structure_type: 'new',
          // Structured data for easy access
          business_profile: bp,
          social_presence: sp,
          diagnosis: diag,
          // Quick access fields
          identity: bp.identity || {},
          contact: bp.contact || {},
          market: bp.market || {},
          seo: bp.seo || {},
          products: bp.products || {},
          pricing: bp.pricing || {},
          trust: bp.trust || {},
          faqs: bp.faqs || []
        },
        webhook_processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      fullApiResponse = apiData;

    } else {
      // OLD STRUCTURE: flat company data
      const fallbackName = domain.split('.')[0];
      
      function extractCountryFromAddress(address: string): string | null {
        if (!address) return null;
        const parts = address.split(',');
        return parts[parts.length - 1]?.trim() || null;
      }

      companyData = {
        name: apiData?.company_name || apiData?.legal_name || fallbackName,
        description: apiData?.business_description || `Empresa líder en el sector de ${fallbackName}`,
        website_url: apiData?.website || normalizedUrl,
        industry_sector: Array.isArray(apiData?.industries) && apiData.industries.length > 0 
          ? apiData.industries.join(', ') 
          : 'General',
        company_size: apiData?.num_employees ? 
          (parseInt(String(apiData.num_employees).replace(/[^0-9]/g, '')) > 250 ? 'large' : 
           parseInt(String(apiData.num_employees).replace(/[^0-9]/g, '')) > 50 ? 'medium' : 'small') : null,
        country: apiData?.address ? extractCountryFromAddress(apiData.address) : null,
        logo_url: apiData?.logo_url || null,
        linkedin_url: apiData?.social_links?.linkedin || null,
        facebook_url: apiData?.social_links?.facebook || null,
        twitter_url: apiData?.social_links?.twitter || null,
        instagram_url: apiData?.social_links?.instagram || null,
        youtube_url: apiData?.social_links?.youtube || null,
        tiktok_url: apiData?.social_links?.tiktok || null,
        webhook_data: apiData ? {
          raw_api_response: apiData,
          processed_at: new Date().toISOString(),
          structure_type: 'old',
          tax_id: apiData.tax_id || null,
          phone: apiData.phone || null,
          email: apiData.email || null,
          founded_date: apiData.founded_date || null,
          annual_revenue: apiData.annual_revenue || null,
          revenue_currency: apiData.revenue_currency || null,
          value_proposition: apiData.value_proposition || null,
          address: apiData.address || null,
          products_services: apiData.products_services || null,
          key_people: apiData.key_people || null,
          corporate_values: apiData.corporate_values || null,
          legal_name: apiData.legal_name || null
        } : null,
        webhook_processed_at: apiData ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      fullApiResponse = apiData;
    }

    console.log('📋 Mapped company data:', {
      name: companyData.name,
      description: companyData.description?.substring(0, 100) + '...',
      website_url: companyData.website_url,
      industry_sector: companyData.industry_sector,
      logo_url: companyData.logo_url,
      hasWebhookData: !!companyData.webhook_data,
      structureType: isNewStructure ? 'NEW' : 'OLD'
    });

    // Check for existing company or use provided companyId
    let companyId = existingCompanyId;
    
    if (!companyId) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('created_by', userId)
        .ilike('website_url', `%${domain}%`)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      companyId = existingCompany?.id;
    }
    
    if (companyId) {
      console.log('✅ Updating existing company:', companyId);
      
      const updateFields = Object.fromEntries(
        Object.entries(companyData).filter(([key, value]) => {
          if (['updated_at', 'webhook_processed_at', 'webhook_data'].includes(key)) {
            return true;
          }
          return value !== null && value !== undefined && value !== '';
        })
      );
      
      console.log('📝 Updating company with fields:', Object.keys(updateFields));
      
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateFields)
        .eq('id', companyId);

      if (updateError) {
        console.error('❌ Error updating company:', updateError);
        throw updateError;
      }

      console.log('✅ Company updated successfully with API data');
    } else {
      console.log('🆕 Creating new company');
      
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          created_by: userId
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        throw companyError;
      }

      companyId = newCompany.id;
      console.log('✅ Created new company:', companyId);
    }

    // NEW: Save detailed parameters to company_parameters table
    if (isNewStructure && companyId) {
      await saveCompanyParameters(companyId, apiData, userId);
    }

    // NEW: Update or create company_strategy
    if (isNewStructure && companyId) {
      await saveCompanyStrategy(companyId, apiData);
    }

    console.log('🎉 Extraction completed successfully for:', url);
    
    // Return data in format expected by onboarding
    return {
      success: true,
      companyId,
      data: fullApiResponse,
      // NEW: Include structured data for immediate display
      business_profile: isNewStructure ? apiData.business_profile : null,
      social_presence: isNewStructure ? apiData.social_presence : null,
      diagnosis: isNewStructure ? (apiData.diagnosis?.diagnosis || apiData.diagnosis) : null,
      message: 'Información de empresa procesada exitosamente'
    };

  } catch (error) {
    console.error('💥 Error in extraction:', error);
    throw error;
  }
}

// Helper function to save detailed parameters
async function saveCompanyParameters(companyId: string, apiData: any, userId: string) {
  console.log('💾 Saving company parameters...');
  
  const bp = apiData.business_profile || {};
  const sp = apiData.social_presence || {};
  const diag = apiData.diagnosis?.diagnosis || apiData.diagnosis || {};
  
  const parameters = [
    // Identity
    { category: 'identity', key: 'company_name', value: bp.identity?.company_name },
    { category: 'identity', key: 'slogan', value: bp.identity?.slogan },
    { category: 'identity', key: 'email', value: bp.identity?.email },
    { category: 'identity', key: 'logo', value: bp.identity?.logo },
    { category: 'identity', key: 'founding_date', value: bp.identity?.founding_date },
    
    // Contact
    { category: 'contact', key: 'emails', value: bp.contact?.email },
    { category: 'contact', key: 'phones', value: bp.contact?.phone },
    { category: 'contact', key: 'addresses', value: bp.contact?.address },
    { category: 'contact', key: 'social_links', value: bp.contact?.social_links },
    
    // Market
    { category: 'market', key: 'area_served', value: bp.market?.area_served },
    { category: 'market', key: 'city', value: bp.market?.city },
    { category: 'market', key: 'country', value: bp.market?.country },
    
    // SEO
    { category: 'seo', key: 'title', value: bp.seo?.title },
    { category: 'seo', key: 'description', value: bp.seo?.description },
    { category: 'seo', key: 'keywords', value: bp.seo?.keywords },
    
    // Products
    { category: 'products', key: 'services', value: bp.products?.services },
    { category: 'products', key: 'offers', value: bp.products?.offers },
    
    // Pricing
    { category: 'pricing', key: 'price_range', value: bp.pricing?.price_range },
    { category: 'pricing', key: 'currency', value: bp.pricing?.currency },
    { category: 'pricing', key: 'payment_methods', value: bp.pricing?.payment_methods },
    
    // Trust
    { category: 'trust', key: 'rating', value: bp.trust?.rating },
    { category: 'trust', key: 'reviews', value: bp.trust?.reviews },
    
    // FAQs
    { category: 'content', key: 'faqs', value: bp.faqs },
    
    // Social Presence
    { category: 'social', key: 'active_platforms', value: sp.activity?.active_platforms },
    { category: 'social', key: 'inactive_platforms', value: sp.activity?.inactive_platforms },
    { category: 'social', key: 'activity_level', value: sp.activity?.overall_activity_level },
    { category: 'social', key: 'consistency', value: sp.activity?.consistency },
    { category: 'social', key: 'tone', value: sp.tone },
    { category: 'social', key: 'content_themes', value: sp.content?.themes },
    { category: 'social', key: 'confidence_score', value: sp.confidence_score },
    { category: 'social', key: 'evidence', value: sp.evidence },
    { category: 'social', key: 'objectives', value: sp.objectives },
    
    // Diagnosis
    { category: 'diagnosis', key: 'executive_summary', value: diag.executive_summary },
    { category: 'diagnosis', key: 'brand_strengths', value: diag.brand_identity_and_offering?.strengths },
    { category: 'diagnosis', key: 'brand_gaps', value: diag.brand_identity_and_offering?.gaps },
    { category: 'diagnosis', key: 'trust_strengths', value: diag.trust_and_reputation?.strengths },
    { category: 'diagnosis', key: 'trust_gaps', value: diag.trust_and_reputation?.gaps },
    { category: 'diagnosis', key: 'seo_strengths', value: diag.seo_and_digital_presence?.strengths },
    { category: 'diagnosis', key: 'seo_gaps', value: diag.seo_and_digital_presence?.gaps },
    { category: 'diagnosis', key: 'social_summary', value: diag.social_presence_and_activity },
    { category: 'diagnosis', key: 'pricing_info', value: diag.pricing_and_value_prop },
    { category: 'diagnosis', key: 'offers_services', value: diag.offers_and_services },
    { category: 'diagnosis', key: 'risks', value: diag.summary_of_risks?.principal_risks },
    { category: 'diagnosis', key: 'prioritized_actions', value: diag.prioritized_actions },
    { category: 'diagnosis', key: 'metrics_kpis', value: diag.metrics_and_kpis },
  ];

  // Filter out null/undefined values and insert
  const validParams = parameters.filter(p => p.value !== null && p.value !== undefined);
  
  for (const param of validParams) {
    try {
      // Check if parameter exists
      const { data: existing } = await supabase
        .from('company_parameters')
        .select('id, version')
        .eq('company_id', companyId)
        .eq('category', param.category)
        .eq('parameter_key', param.key)
        .eq('is_current', true)
        .maybeSingle();

      if (existing) {
        // Mark old as not current
        await supabase
          .from('company_parameters')
          .update({ is_current: false })
          .eq('id', existing.id);
      }

      // Insert new parameter
      await supabase
        .from('company_parameters')
        .insert({
          company_id: companyId,
          category: param.category,
          parameter_key: param.key,
          parameter_value: typeof param.value === 'object' ? param.value : { value: param.value },
          is_current: true,
          version: (existing?.version || 0) + 1,
          source_agent_code: 'company-info-extractor',
          created_by: userId
        });
    } catch (err) {
      console.warn(`⚠️ Failed to save parameter ${param.category}.${param.key}:`, err);
    }
  }
  
  console.log(`✅ Saved ${validParams.length} company parameters`);
}

// Helper function to save/update company strategy
async function saveCompanyStrategy(companyId: string, apiData: any) {
  console.log('💾 Saving company strategy...');
  
  const bp = apiData.business_profile || {};
  const diag = apiData.diagnosis?.diagnosis || apiData.diagnosis || {};
  
  // Extract strategy information
  const propuestaValor = bp.identity?.slogan || 
    diag.brand_identity_and_offering?.strengths?.[0] ||
    diag.executive_summary?.substring(0, 500);
  
  const mision = diag.executive_summary?.substring(0, 1000) || 
    `Democratizar el acceso a ${bp.products?.services?.[0] || 'servicios'} de alta calidad`;
  
  const vision = diag.prioritized_actions?.[0]?.action ||
    'Ser líder en innovación y excelencia en nuestro sector';

  try {
    // Check if strategy exists
    const { data: existing } = await supabase
      .from('company_strategy')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('company_strategy')
        .update({
          propuesta_valor: propuestaValor,
          mision: mision,
          vision: vision,
          generated_with_ai: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      console.log('✅ Updated company strategy');
    } else {
      await supabase
        .from('company_strategy')
        .insert({
          company_id: companyId,
          propuesta_valor: propuestaValor,
          mision: mision,
          vision: vision,
          generated_with_ai: true
        });
      console.log('✅ Created company strategy');
    }
  } catch (err) {
    console.warn('⚠️ Failed to save company strategy:', err);
  }
}
