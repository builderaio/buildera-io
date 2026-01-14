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

// Get N8N authentication headers
function getN8NAuthHeaders() {
  const authUser = Deno.env.get('N8N_AUTH_USER');
  const authPass = Deno.env.get('N8N_AUTH_PASS');
  
  if (!authUser || !authPass) {
    throw new Error('N8N authentication credentials not configured');
  }
  
  const credentials = btoa(`${authUser}:${authPass}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
}

// Call the NEW company-info-extractor API (returns identity, seo, products, contact, market, audience)
async function callCompanyInfoExtractorAPI(normalizedUrl: string): Promise<any> {
  console.log('📡 Calling company-info-extractor API...');
  
  const apiUrl = `https://buildera.app.n8n.cloud/webhook/company-info-extractor?URL=${encodeURIComponent(normalizedUrl)}`;
  console.log('🔗 API URL:', apiUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getN8NAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API ${response.status}: ${errText.slice(0, 300)}`);
    }

    const rawBody = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    const contentLength = response.headers.get('content-length') ?? 'unknown';

    console.log('📨 company-info-extractor response meta:', {
      status: response.status,
      contentType,
      contentLength,
      bodyChars: rawBody?.length ?? 0,
    });
    console.log('🧪 company-info-extractor raw response (truncated):', (rawBody ?? '').slice(0, 1000));

    if (!rawBody || rawBody.trim().length === 0) {
      throw new Error(
        'Empty response body from n8n company-info-extractor webhook. ' +
          'In n8n, ensure the Webhook response is configured to return the JSON payload (e.g., Response Mode: "Last Node" or a "Respond to Webhook" node).'
      );
    }

    // Parse the response - NEW structure is [{ output: { identity, seo, products, contact, market, audience } }]
    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch (e) {
      throw new Error(
        `Invalid JSON from n8n company-info-extractor webhook: ${(e as Error).message}. Body (truncated): ${rawBody.slice(0, 300)}`
      );
    }

    // Extract the output from array
    if (Array.isArray(parsed) && parsed.length > 0) {
      const firstItem = parsed[0];
      if (firstItem?.output) {
        console.log('✅ Extracted output from array[0].output');
        return firstItem.output;
      }
      return firstItem;
    }

    if (parsed?.output) {
      return parsed.output;
    }

    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`company-info-extractor API error: ${(err as Error).message}`);
  }
}

// Call the NEW company-digital-presence API (returns digital_footprint_summary, action_plan, executive_diagnosis, etc.)
async function callDigitalPresenceAPI(name: string, url: string, socialLinks: string[]): Promise<any> {
  console.log('📡 Calling company-digital-presence API...');
  
  const apiUrl = 'https://buildera.app.n8n.cloud/webhook/company-digital-presence';
  console.log('🔗 API URL:', apiUrl);

  const payload = {
    Name: name,
    URL: url,
    social_links: socialLinks || []
  };
  console.log('📦 Payload:', JSON.stringify(payload));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: getN8NAuthHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`API ${response.status}: ${errText.slice(0, 300)}`);
    }

    const rawBody = await response.text();
    console.log('🧪 company-digital-presence raw response (truncated):', rawBody.slice(0, 1000));

    // Parse the response - structure is [{ digital_footprint_summary, what_is_working, ... }]
    let parsed = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.warn('⚠️ Failed to parse digital-presence JSON');
      return null;
    }

    // Extract from array
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log('✅ Extracted digital presence from array[0]');
      return parsed[0];
    }

    return parsed;
  } catch (err) {
    clearTimeout(timeout);
    console.error('❌ Digital presence API error:', err);
    // Don't throw - this is optional, we can continue without it
    return null;
  }
}

async function extractCompanyData(url: string, userId: string, token: string, existingCompanyId?: string) {
  console.log('🔄 Starting extraction for URL:', url);
  try {
    // Normalize URL (ensure scheme) and get domain for matching
    const normalizedUrl = /^(https?:)\/\//i.test(url) ? url : `https://${url}`;
    const domain = normalizedUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

    // STEP 1: Call company-info-extractor API (basic company data)
    console.log('📋 STEP 1: Extracting basic company info...');
    const basicInfo = await callCompanyInfoExtractorAPI(normalizedUrl);
    
    if (!basicInfo) {
      throw new Error('Failed to extract basic company info');
    }
    
    console.log('✅ Basic info extracted:', Object.keys(basicInfo));

    // Extract company data from NEW structure
    const identity = basicInfo.identity || {};
    const seo = basicInfo.seo || {};
    const products = basicInfo.products || {};
    const contact = basicInfo.contact || {};
    const market = basicInfo.market || {};
    const audience = basicInfo.audience || {};

    // Helper to find social URL from array
    const socialLinks = contact.social_links || [];
    const findSocialUrl = (platform: string) => {
      return socialLinks.find((u: string) => u?.toLowerCase().includes(platform)) || null;
    };

    // Map to company table structure
    const companyData = {
      name: identity.company_name || identity.legal_name || domain.split('.')[0],
      description: seo.description || `Empresa basada en ${domain}`,
      website_url: identity.url || normalizedUrl,
      industry_sector: products.service?.[0] || products.offer?.[0] || 'General',
      country: market.country?.[0] || null,
      logo_url: identity.logo || null,
      linkedin_url: findSocialUrl('linkedin'),
      facebook_url: findSocialUrl('facebook'),
      twitter_url: findSocialUrl('twitter'),
      instagram_url: findSocialUrl('instagram'),
      youtube_url: findSocialUrl('youtube'),
      tiktok_url: findSocialUrl('tiktok'),
      webhook_data: {
        raw_api_response: basicInfo,
        processed_at: new Date().toISOString(),
        structure_type: 'new_v2',
        identity,
        seo,
        products,
        contact,
        market,
        audience
      },
      webhook_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Mapped company data:', {
      name: companyData.name,
      website_url: companyData.website_url,
      industry_sector: companyData.industry_sector,
      logo_url: companyData.logo_url
    });

    // STEP 2: Create or update company in database
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
      
      const { error: updateError } = await supabase
        .from('companies')
        .update(updateFields)
        .eq('id', companyId);

      if (updateError) {
        console.error('❌ Error updating company:', updateError);
        throw updateError;
      }
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

    // STEP 3: Call company-digital-presence API (optional, runs in parallel conceptually)
    console.log('📋 STEP 2: Analyzing digital presence...');
    const digitalPresence = await callDigitalPresenceAPI(
      companyData.name,
      normalizedUrl,
      socialLinks
    );

    // STEP 4: Save digital presence to new table
    if (digitalPresence && companyId) {
      console.log('💾 Saving digital presence data...');
      await saveDigitalPresence(companyId, digitalPresence, normalizedUrl, socialLinks);
    }

    // STEP 5: Save parameters to company_parameters table
    await saveCompanyParameters(companyId!, basicInfo, digitalPresence, userId);

    // STEP 6: Update company_strategy
    await saveCompanyStrategy(companyId!, basicInfo, digitalPresence);

    console.log('🎉 Extraction completed successfully for:', url);
    
    // Return data in format expected by onboarding - NEW STRUCTURE
    return {
      success: true,
      companyId,
      // Basic info from first API (identity, seo, products, contact, market, audience)
      basic_info: {
        identity,
        seo,
        products,
        contact,
        market,
        audience
      },
      // Digital presence from second API
      digital_presence: digitalPresence ? {
        digital_footprint_summary: digitalPresence.digital_footprint_summary,
        what_is_working: digitalPresence.what_is_working || [],
        what_is_missing: digitalPresence.what_is_missing || [],
        key_risks: digitalPresence.key_risks || [],
        competitive_positioning: digitalPresence.competitive_positioning,
        action_plan: digitalPresence.action_plan || {},
        executive_diagnosis: digitalPresence.executive_diagnosis || {}
      } : null,
      message: 'Información de empresa procesada exitosamente'
    };

  } catch (error) {
    console.error('💥 Error in extraction:', error);
    throw error;
  }
}

// Save digital presence to dedicated table
async function saveDigitalPresence(companyId: string, data: any, sourceUrl: string, socialLinks: string[]) {
  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('company_digital_presence')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    const presenceData = {
      company_id: companyId,
      digital_footprint_summary: data.digital_footprint_summary || null,
      what_is_working: data.what_is_working || [],
      what_is_missing: data.what_is_missing || [],
      key_risks: data.key_risks || [],
      competitive_positioning: data.competitive_positioning || null,
      action_plan: data.action_plan || {},
      executive_diagnosis: data.executive_diagnosis || {},
      source_url: sourceUrl,
      analyzed_social_links: socialLinks || [],
      updated_at: new Date().toISOString()
    };

    if (existing) {
      await supabase
        .from('company_digital_presence')
        .update(presenceData)
        .eq('id', existing.id);
      console.log('✅ Updated digital presence record');
    } else {
      await supabase
        .from('company_digital_presence')
        .insert(presenceData);
      console.log('✅ Created digital presence record');
    }
  } catch (err) {
    console.warn('⚠️ Failed to save digital presence:', err);
  }
}

// Helper function to save detailed parameters
async function saveCompanyParameters(companyId: string, basicInfo: any, digitalPresence: any, userId: string) {
  console.log('💾 Saving company parameters...');
  
  const identity = basicInfo?.identity || {};
  const seo = basicInfo?.seo || {};
  const products = basicInfo?.products || {};
  const contact = basicInfo?.contact || {};
  const market = basicInfo?.market || {};
  const audience = basicInfo?.audience || {};
  const dp = digitalPresence || {};
  
  const parameters = [
    // Identity
    { category: 'identity', key: 'company_name', value: identity.company_name },
    { category: 'identity', key: 'legal_name', value: identity.legal_name },
    { category: 'identity', key: 'slogan', value: identity.slogan },
    { category: 'identity', key: 'founding_date', value: identity.founding_date },
    { category: 'identity', key: 'logo', value: identity.logo },
    { category: 'identity', key: 'url', value: identity.url },
    
    // SEO
    { category: 'seo', key: 'title', value: seo.title },
    { category: 'seo', key: 'description', value: seo.description },
    { category: 'seo', key: 'keywords', value: seo.keyword },
    
    // Products
    { category: 'products', key: 'services', value: products.service },
    { category: 'products', key: 'offers', value: products.offer },
    
    // Contact
    { category: 'contact', key: 'emails', value: contact.email },
    { category: 'contact', key: 'phones', value: contact.phone },
    { category: 'contact', key: 'addresses', value: contact.address },
    { category: 'contact', key: 'social_links', value: contact.social_links },
    
    // Market
    { category: 'market', key: 'country', value: market.country },
    { category: 'market', key: 'city', value: market.city },
    
    // Audience
    { category: 'audience', key: 'segments', value: audience.segment },
    { category: 'audience', key: 'professions', value: audience.profession },
    { category: 'audience', key: 'target_users', value: audience.target_user },
    
    // Digital Presence Analysis
    { category: 'digital_presence', key: 'footprint_summary', value: dp.digital_footprint_summary },
    { category: 'digital_presence', key: 'what_is_working', value: dp.what_is_working },
    { category: 'digital_presence', key: 'what_is_missing', value: dp.what_is_missing },
    { category: 'digital_presence', key: 'key_risks', value: dp.key_risks },
    { category: 'digital_presence', key: 'competitive_positioning', value: dp.competitive_positioning },
    { category: 'digital_presence', key: 'action_plan', value: dp.action_plan },
    { category: 'digital_presence', key: 'executive_diagnosis', value: dp.executive_diagnosis },
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
          source_agent_code: 'company-info-extractor-v2',
          created_by: userId
        });
    } catch (err) {
      console.warn(`⚠️ Failed to save parameter ${param.category}.${param.key}:`, err);
    }
  }
  
  console.log(`✅ Saved ${validParams.length} company parameters`);
}

// Helper function to save/update company strategy
async function saveCompanyStrategy(companyId: string, basicInfo: any, digitalPresence: any) {
  console.log('💾 Saving company strategy...');
  
  const identity = basicInfo?.identity || {};
  const seo = basicInfo?.seo || {};
  const dp = digitalPresence || {};
  const execDiag = dp.executive_diagnosis || {};
  
  // Extract strategy information from new structure
  const propuestaValor = identity.slogan || seo.description || 'Innovación y excelencia en nuestro sector';
  const mision = execDiag.current_state || seo.description || 'Democratizar el acceso a servicios de alta calidad';
  const vision = execDiag.highest_leverage_focus || 'Ser líder en innovación y excelencia en nuestro sector';

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
