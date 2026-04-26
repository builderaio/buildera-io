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
      JSON.stringify({ error: 'Internal server error', details: (error as Error).message }),
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

// Call the NEW company-digital-presence API with retry logic
// NOTE: n8n webhook expects GET request with query parameters
async function callDigitalPresenceAPI(name: string, url: string, socialLinks: string[], retryAttempt = 0): Promise<any> {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 300000; // 5 min timeout (increased from 3 min)
  const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s backoff
  
  console.log(`📡 Calling company-digital-presence API (attempt ${retryAttempt + 1}/${MAX_RETRIES + 1})...`);
  
  // Build URL with query parameters (n8n expects GET request)
  const baseUrl = 'https://buildera.app.n8n.cloud/webhook/company-digital-presence';
  const params = new URLSearchParams({
    Name: name,
    URL: url,
    social_links: JSON.stringify(socialLinks || [])
  });
  const apiUrl = `${baseUrl}?${params.toString()}`;
  console.log('🔗 API URL:', apiUrl);
  console.log('📦 Query params:', { Name: name, URL: url, social_links: socialLinks });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: getN8NAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const error = new Error(`API ${response.status}: ${errText.slice(0, 300)}`);
      
      // Retry on 5xx errors or specific 4xx that might be transient
      if (response.status >= 500 || response.status === 429 || response.status === 408) {
        throw error; // Will be caught and retried
      }
      
      console.error('❌ Non-retryable error:', error.message);
      return null;
    }

    const rawBody = await response.text();
    console.log('📨 company-digital-presence response meta:', {
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      bodyChars: rawBody?.length ?? 0,
    });
    console.log('🧪 company-digital-presence raw response (truncated):', (rawBody ?? '').slice(0, 1000));

    if (!rawBody || rawBody.trim().length === 0) {
      console.warn('⚠️ Empty response from digital-presence API');
      // Empty response might be transient - retry
      if (retryAttempt < MAX_RETRIES) {
        throw new Error('Empty response - will retry');
      }
      return null;
    }

    // Parse the response
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.warn('⚠️ Failed to parse digital-presence JSON');
      return null;
    }

    // Extract from array if needed
    if (Array.isArray(parsed) && parsed.length > 0) {
      const firstItem = parsed[0];
      if (firstItem?.output) {
        console.log('✅ Extracted digital presence from array[0].output');
        return firstItem.output;
      }
      console.log('✅ Extracted digital presence from array[0]');
      return firstItem;
    }

    if (parsed?.output) {
      console.log('✅ Extracted digital presence from output');
      return parsed.output;
    }

    return parsed;
  } catch (err: any) {
    clearTimeout(timeout);
    
    const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
    const errorType = isTimeout ? 'Timeout' : 'Error';
    console.error(`❌ Digital presence API ${errorType} (attempt ${retryAttempt + 1}):`, err.message || err);
    
    // Retry logic
    if (retryAttempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryAttempt] || 30000;
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return callDigitalPresenceAPI(name, url, socialLinks, retryAttempt + 1);
    }
    
    console.error(`❌ All ${MAX_RETRIES + 1} attempts failed for digital-presence API`);
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

      // CRITICAL: Ensure primary_company_id is synced for existing companies too
      console.log('🔄 Checking primary_company_id sync for existing company...');
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('primary_company_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileCheck?.primary_company_id) {
        console.log('📝 Syncing primary_company_id for existing company');
        
        // Ensure company_member exists
        const { data: memberCheck } = await supabase
          .from('company_members')
          .select('id')
          .eq('company_id', companyId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!memberCheck) {
          console.log('👤 Creating missing company membership');
          await supabase.from('company_members').insert({
            company_id: companyId,
            user_id: userId,
            role: 'owner',
            is_primary: true
          });
        }

        // Sync primary_company_id
        const { error: syncError } = await supabase
          .from('profiles')
          .update({ primary_company_id: companyId })
          .eq('user_id', userId);

        if (syncError) {
          console.error('⚠️ Error syncing primary_company_id (non-fatal):', syncError);
        } else {
          console.log('✅ Synced primary_company_id for existing company');
        }
      } else {
        console.log('✅ primary_company_id already set:', profileCheck.primary_company_id);
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

      // CRITICAL: Create company_members relationship
      console.log('👤 Creating company membership for user:', userId);
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyId,
          user_id: userId,
          role: 'owner',
          is_primary: true
        });

      if (memberError) {
        console.error('⚠️ Error creating company member (non-fatal):', memberError);
      } else {
        console.log('✅ Created company membership');
      }

      // CRITICAL: Update profiles.primary_company_id
      console.log('📝 Updating profile primary_company_id');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ primary_company_id: companyId })
        .eq('user_id', userId);

      if (profileError) {
        console.error('⚠️ Error updating profile primary_company_id (non-fatal):', profileError);
      } else {
        console.log('✅ Updated profile primary_company_id');
      }
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

    // STEP 7: Save products/services to company_products table
    await saveCompanyProducts(companyId!, products);

    // STEP 8: Save contact emails to company_email_config table
    await saveCompanyEmails(companyId!, contact);

    // STEP 9: Save audience data to company_audiences table
    await saveCompanyAudiences(companyId!, audience, userId);

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
        digital_footprint_summary: sanitizeDiagnosticText(digitalPresence.digital_footprint_summary),
        what_is_working: sanitizeDiagnosticArray(digitalPresence.what_is_working),
        what_is_missing: sanitizeDiagnosticArray(digitalPresence.what_is_missing),
        key_risks: sanitizeDiagnosticArray(digitalPresence.key_risks),
        competitive_positioning: sanitizeDiagnosticText(digitalPresence.competitive_positioning),
        action_plan: digitalPresence.action_plan || {},
        executive_diagnosis: sanitizeExecutiveDiagnosis(digitalPresence.executive_diagnosis || {})
      } : null,
      message: 'Información de empresa procesada exitosamente'
    };

  } catch (error) {
    console.error('💥 Error in extraction:', error);
    throw error;
  }
}

// Sanitize technical jargon from AI-generated diagnostic text
// Replaces implementation-level terms with business-friendly language
function sanitizeDiagnosticText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  const replacements: [RegExp, string][] = [
    // HTML/Web technical terms
    [/\ben el HTML estático\b/gi, 'en el sitio web'],
    [/\bdel HTML estático\b/gi, 'del sitio web'],
    [/\bHTML estático\b/gi, 'sitio web'],
    [/\bHTML dinámico\b/gi, 'sitio web'],
    [/\ben el DOM\b/gi, 'en la página'],
    [/\bmeta tags?\b/gi, 'configuración SEO'],
    [/\bmeta descriptions?\b/gi, 'descripción para buscadores'],
    [/\balt attributes?\b/gi, 'descripciones de imágenes'],
    [/\balt tags?\b/gi, 'descripciones de imágenes'],
    [/\bschema markup\b/gi, 'datos estructurados para buscadores'],
    [/\bschema\.org\b/gi, 'datos estructurados'],
    [/\bJSON-LD\b/gi, 'datos estructurados'],
    [/\bcanonical URL\b/gi, 'URL principal'],
    [/\bcanonical tag\b/gi, 'etiqueta de URL principal'],
    [/\breadability score\b/gi, 'índice de legibilidad'],
    [/\bheader tags?\b/gi, 'títulos y subtítulos'],
    [/\bH[1-6] tags?\b/gi, 'títulos de la página'],
    [/\bCSS\b/g, 'estilos visuales'],
    [/\bJavaScript\b/gi, 'funcionalidad interactiva'],
    [/\bbacklinks?\b/gi, 'enlaces externos'],
    [/\bopen graph\b/gi, 'vista previa en redes sociales'],
    [/\bog:image\b/gi, 'imagen para redes sociales'],
    [/\brobots\.txt\b/gi, 'configuración de indexación'],
    [/\bsitemap\.xml\b/gi, 'mapa del sitio'],
    [/\bSSL\b/g, 'certificado de seguridad'],
    [/\bHTTPS\b/g, 'conexión segura'],
    [/\bCTA\b/g, 'llamada a la acción'],
    [/\bCTAs\b/g, 'llamadas a la acción'],
    [/\bUI\/UX\b/gi, 'experiencia de usuario'],
    [/\bresponsive design\b/gi, 'diseño adaptable a móviles'],
    [/\bviewport\b/gi, 'vista en dispositivos'],
    [/\brender(?:izado|iza|ing)\b/gi, 'visualización'],
    [/\bfavicon\b/gi, 'icono del sitio'],
    // Common negative phrasings about static HTML
    [/No se encontr[óo] evidencia/gi, 'No se detectó presencia'],
    [/Ausencia de pruebas sociales visibles/gi, 'No se encontraron testimonios o reseñas visibles'],
  ];

  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Apply sanitization to arrays of diagnostic strings
function sanitizeDiagnosticArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item: any) => typeof item === 'string' ? sanitizeDiagnosticText(item) : item);
}

// Sanitize executive diagnosis object
function sanitizeExecutiveDiagnosis(diag: any): any {
  if (!diag || typeof diag !== 'object') return diag;
  const sanitized = { ...diag };
  for (const key of ['current_state', 'primary_constraint', 'highest_leverage_focus']) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeDiagnosticText(sanitized[key]);
    }
  }
  return sanitized;
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
      digital_footprint_summary: sanitizeDiagnosticText(data.digital_footprint_summary) || null,
      what_is_working: sanitizeDiagnosticArray(data.what_is_working),
      what_is_missing: sanitizeDiagnosticArray(data.what_is_missing),
      key_risks: sanitizeDiagnosticArray(data.key_risks),
      competitive_positioning: sanitizeDiagnosticText(data.competitive_positioning) || null,
      action_plan: data.action_plan || {},
      executive_diagnosis: sanitizeExecutiveDiagnosis(data.executive_diagnosis || {}),
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

// Save products/services to company_products table
async function saveCompanyProducts(companyId: string, products: any) {
  console.log('💾 Saving company products/services...');
  
  if (!products) {
    console.log('⚠️ No products data to save');
    return;
  }

  try {
    // Helper to normalize array input
    const toArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(v => v && typeof v === 'string');
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const services = toArray(products.service);
    const offers = toArray(products.offer);
    
    console.log('📦 Products to save:', { services: services.length, offers: offers.length });

    // Get existing products for this company
    const { data: existingProducts } = await supabase
      .from('company_products')
      .select('id, name, category')
      .eq('company_id', companyId);

    const existingNames = new Set((existingProducts || []).map(p => p.name.toLowerCase()));

    const productsToInsert: any[] = [];

    // Add services
    for (const service of services) {
      if (!existingNames.has(service.toLowerCase())) {
        productsToInsert.push({
          company_id: companyId,
          name: service,
          category: 'service',
          is_active: true,
          is_featured: false
        });
        existingNames.add(service.toLowerCase());
      }
    }

    // Add offers/products
    for (const offer of offers) {
      if (!existingNames.has(offer.toLowerCase())) {
        productsToInsert.push({
          company_id: companyId,
          name: offer,
          category: 'product',
          is_active: true,
          is_featured: false
        });
        existingNames.add(offer.toLowerCase());
      }
    }

    if (productsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('company_products')
        .insert(productsToInsert);

      if (insertError) {
        console.error('❌ Error inserting products:', insertError);
      } else {
        console.log(`✅ Inserted ${productsToInsert.length} products/services`);
      }
    } else {
      console.log('ℹ️ No new products to insert (all already exist)');
    }
  } catch (err) {
    console.warn('⚠️ Failed to save company products:', err);
  }
}

// Save contact emails to company_email_config table
async function saveCompanyEmails(companyId: string, contact: any) {
  console.log('💾 Saving company emails...');
  
  if (!contact) {
    console.log('⚠️ No contact data to save');
    return;
  }

  try {
    // Helper to normalize array input and get first/primary value
    const toArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(v => v && typeof v === 'string');
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const emails = toArray(contact.email);
    
    if (emails.length === 0) {
      console.log('ℹ️ No emails found in contact data');
      return;
    }

    console.log('📧 Emails to save:', emails);

    // Check if config exists
    const { data: existing } = await supabase
      .from('company_email_config')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    // Categorize emails based on common patterns
    const categorizeEmail = (email: string): string => {
      const lower = email.toLowerCase();
      if (lower.includes('soporte') || lower.includes('support') || lower.includes('ayuda') || lower.includes('help')) return 'support';
      if (lower.includes('ventas') || lower.includes('sales') || lower.includes('comercial')) return 'marketing';
      if (lower.includes('billing') || lower.includes('factura') || lower.includes('pago') || lower.includes('cobranza')) return 'billing';
      if (lower.includes('info') || lower.includes('contacto') || lower.includes('contact')) return 'general';
      if (lower.includes('notif') || lower.includes('alert') || lower.includes('aviso')) return 'notifications';
      return 'general';
    };

    const emailConfig: Record<string, string | null> = {
      general_email: null,
      support_email: null,
      billing_email: null,
      marketing_email: null,
      notifications_email: null
    };

    // Assign emails to categories
    for (const email of emails) {
      const category = categorizeEmail(email);
      const key = `${category}_email`;
      if (!emailConfig[key]) {
        emailConfig[key] = email;
      }
    }

    // If we have emails but none categorized as general, use the first one
    if (!emailConfig.general_email && emails.length > 0) {
      emailConfig.general_email = emails[0];
    }

    const updateData = {
      company_id: companyId,
      ...emailConfig,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      // Only update non-null values to avoid overwriting existing data
      const filteredUpdate = Object.fromEntries(
        Object.entries(updateData).filter(([key, val]) => val !== null || key === 'updated_at')
      );
      
      await supabase
        .from('company_email_config')
        .update(filteredUpdate)
        .eq('id', existing.id);
      console.log('✅ Updated company email config');
    } else {
      await supabase
        .from('company_email_config')
        .insert(updateData);
      console.log('✅ Created company email config');
    }
  } catch (err) {
    console.warn('⚠️ Failed to save company emails:', err);
  }
}

// Save audience data to company_audiences table
async function saveCompanyAudiences(companyId: string, audience: any, userId: string) {
  console.log('💾 Saving company audiences...');
  
  if (!audience) {
    console.log('⚠️ No audience data to save');
    return;
  }

  try {
    const toArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(v => v && typeof v === 'string');
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return [];
    };

    const segments = toArray(audience.segment);
    const professions = toArray(audience.profession);
    const targetUsers = toArray(audience.target_user);
    
    if (segments.length === 0 && professions.length === 0 && targetUsers.length === 0) {
      console.log('ℹ️ No audience segments found');
      return;
    }

    const { data: existingAudiences } = await supabase
      .from('company_audiences')
      .select('id, name')
      .eq('company_id', companyId);

    const existingNames = new Set((existingAudiences || []).map(a => a.name.toLowerCase()));

    // Get company info for enrichment context
    const { data: company } = await supabase
      .from('companies')
      .select('name, description, industry_sector, website_url')
      .eq('id', companyId)
      .maybeSingle();

    // Collect all audience names for batch enrichment
    const allSegmentNames: { name: string; type: string }[] = [];
    
    for (const segment of segments) {
      if (!existingNames.has(segment.toLowerCase())) {
        allSegmentNames.push({ name: segment, type: 'segment' });
        existingNames.add(segment.toLowerCase());
      }
    }
    for (const profession of professions) {
      if (!existingNames.has(profession.toLowerCase())) {
        allSegmentNames.push({ name: profession, type: 'profession' });
        existingNames.add(profession.toLowerCase());
      }
    }
    for (const targetUser of targetUsers) {
      if (!existingNames.has(targetUser.toLowerCase())) {
        allSegmentNames.push({ name: targetUser, type: 'target_user' });
        existingNames.add(targetUser.toLowerCase());
      }
    }

    if (allSegmentNames.length === 0) {
      console.log('ℹ️ No new audiences to insert');
      return;
    }

    // Enrich audiences with OpenAI
    let enrichedAudiences: any[] = [];
    try {
      enrichedAudiences = await enrichAudiencesWithAI(allSegmentNames, company);
      console.log(`✅ Enriched ${enrichedAudiences.length} audiences with AI`);
    } catch (enrichErr) {
      console.warn('⚠️ AI enrichment failed, using basic data:', enrichErr);
    }

    const audiencesToInsert: any[] = [];

    for (const seg of allSegmentNames) {
      const enriched = enrichedAudiences.find(e => e.name?.toLowerCase() === seg.name.toLowerCase()) || {};
      
      audiencesToInsert.push({
        company_id: companyId,
        user_id: userId,
        name: seg.name,
        description: enriched.description || `${seg.type === 'profession' ? 'Perfil profesional' : seg.type === 'target_user' ? 'Usuario objetivo' : 'Segmento de audiencia'}: ${seg.name}`,
        pain_points: enriched.pain_points || [],
        goals: enriched.goals || [],
        challenges: enriched.challenges || [],
        motivations: enriched.motivations || [],
        interests: enriched.interests || {},
        age_ranges: enriched.age_ranges || {},
        content_preferences: enriched.content_preferences || {},
        platform_preferences: enriched.platform_preferences || {},
        tags: ['auto-detected', seg.type],
        is_active: true,
        estimated_size: enriched.estimated_size || 5000,
        conversion_potential: enriched.conversion_potential || 0.5,
        confidence_score: enriched.confidence_score || 0.6,
        ai_insights: { 
          source: 'diagnostic', 
          type: seg.type,
          enriched: enrichedAudiences.length > 0,
          enriched_at: new Date().toISOString(),
        },
      });
    }

    if (audiencesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('company_audiences')
        .insert(audiencesToInsert);

      if (insertError) {
        console.error('❌ Error inserting audiences:', insertError);
      } else {
        console.log(`✅ Inserted ${audiencesToInsert.length} enriched audience segments`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Failed to save company audiences:', err);
  }
}

/**
 * Enrich audience segments with AI-generated pain points, goals, and descriptions
 */
async function enrichAudiencesWithAI(
  segments: { name: string; type: string }[],
  company: any
): Promise<any[]> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    console.warn('⚠️ No OpenAI key for audience enrichment');
    return [];
  }

  const segmentList = segments.map(s => `- ${s.name} (${s.type})`).join('\n');

  const prompt = `Para la empresa "${company?.name || 'Sin nombre'}" del sector "${company?.industry_sector || 'general'}" 
(${company?.description || 'Sin descripción'}), enriquece estos segmentos de audiencia con datos accionables:

${segmentList}

Para CADA segmento genera un JSON con esta estructura:
{
  "audiences": [
    {
      "name": "nombre exacto del segmento",
      "description": "Descripción detallada de 2-3 oraciones sobre quiénes son y qué buscan",
      "pain_points": ["3-5 dolores específicos y concretos de este segmento en el contexto de la empresa"],
      "goals": ["3-5 objetivos principales que buscan lograr"],
      "challenges": ["3-4 obstáculos principales que enfrentan"],
      "motivations": ["3-4 motivaciones clave para buscar soluciones"],
      "interests": {"primary": ["3-4 temas de interés"], "secondary": ["2-3 intereses secundarios"]},
      "age_ranges": {"primary": "rango de edad principal", "secondary": "rango secundario"},
      "content_preferences": {"formats": ["tipos de contenido que consumen"], "tone": "tono preferido"},
      "platform_preferences": {"primary": ["plataformas principales"], "secondary": ["secundarias"]},
      "estimated_size": número estimado de personas en el mercado hispano,
      "conversion_potential": número entre 0 y 1,
      "confidence_score": número entre 0 y 1
    }
  ]
}

REGLAS:
- Sé ESPECÍFICO al sector de la empresa, no genérico
- Los pain_points deben ser dolores reales y concretos, no abstractos
- Los goals deben ser medibles o al menos accionables
- Responde SOLO en JSON válido`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un estratega de marketing y audiencias B2B/B2C. Generas perfiles de audiencia detallados y accionables. Responde siempre en JSON válido.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return parsed.audiences || [];
}
