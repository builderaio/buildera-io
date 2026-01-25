import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Call company-info-extractor API
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
    console.log('📨 company-info-extractor response length:', rawBody?.length ?? 0);

    if (!rawBody || rawBody.trim().length === 0) {
      throw new Error('Empty response from company-info-extractor');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }

    // Extract output from array format
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]?.output || parsed[0];
    }
    return parsed?.output || parsed;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Call company-digital-presence API with retry logic
async function callDigitalPresenceAPI(name: string, url: string, socialLinks: string[], retryAttempt = 0): Promise<any> {
  const MAX_RETRIES = 2;
  const TIMEOUT_MS = 180000; // 3 min timeout
  const RETRY_DELAYS = [5000, 15000]; // 5s, 15s backoff
  
  console.log(`📡 Calling company-digital-presence API (attempt ${retryAttempt + 1}/${MAX_RETRIES + 1})...`);
  
  const baseUrl = 'https://buildera.app.n8n.cloud/webhook/company-digital-presence';
  const params = new URLSearchParams({
    Name: name,
    URL: url,
    social_links: JSON.stringify(socialLinks || [])
  });
  const apiUrl = `${baseUrl}?${params.toString()}`;
  console.log('🔗 Digital Presence API URL:', apiUrl);

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
      
      if (response.status >= 500 || response.status === 429) {
        throw error; // Will be retried
      }
      console.error('❌ Non-retryable error:', error.message);
      return null;
    }

    const rawBody = await response.text();
    console.log('📨 digital-presence response length:', rawBody?.length ?? 0);

    if (!rawBody || rawBody.trim().length === 0) {
      if (retryAttempt < MAX_RETRIES) {
        throw new Error('Empty response - will retry');
      }
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.warn('⚠️ Failed to parse digital-presence JSON');
      return null;
    }

    // Extract from array format
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]?.output || parsed[0];
    }
    return parsed?.output || parsed;
  } catch (err: any) {
    clearTimeout(timeout);
    const isTimeout = err.name === 'AbortError';
    
    if (retryAttempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryAttempt] || 5000;
      console.log(`⏳ Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callDigitalPresenceAPI(name, url, socialLinks, retryAttempt + 1);
    }
    
    console.error('❌ Digital presence API failed after retries:', isTimeout ? 'Timeout' : err.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl } = await req.json();
    
    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: 'websiteUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Analyzing competitor website:', websiteUrl);

    // Normalize URL
    const normalizedUrl = /^(https?:)\/\//i.test(websiteUrl) ? websiteUrl : `https://${websiteUrl}`;

    // Step 1: Call company-info-extractor
    let extractorData: any;
    try {
      extractorData = await callCompanyInfoExtractorAPI(normalizedUrl);
    } catch (err: any) {
      console.error('❌ Company info extractor failed:', err.message);
      return new Response(
        JSON.stringify({ error: 'Failed to extract company info', details: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Structure basic competitor data
    const identity = extractorData.identity || {};
    const seo = extractorData.seo || {};
    const products = extractorData.products || {};
    const contact = extractorData.contact || {};
    const market = extractorData.market || {};
    const audience = extractorData.audience || {};

    const socialLinks = contact.social_links || [];
    const findSocialUrl = (platform: string) => {
      return socialLinks.find((u: string) => u?.toLowerCase().includes(platform)) || null;
    };

    const companyName = identity.company_name || identity.legal_name || 'Competidor';

    // Step 2: Call digital-presence API
    console.log('🔄 Now calling digital presence API...');
    const digitalPresenceData = await callDigitalPresenceAPI(companyName, normalizedUrl, socialLinks);

    // Build comprehensive competitor info
    const competitorInfo = {
      // Basic info
      name: companyName,
      description: seo.description || identity.tagline || '',
      website: identity.url || normalizedUrl,
      logo: identity.logo || null,
      
      // Social networks
      social_networks: {
        linkedin: findSocialUrl('linkedin'),
        facebook: findSocialUrl('facebook'),
        twitter: findSocialUrl('twitter'),
        instagram: findSocialUrl('instagram'),
        youtube: findSocialUrl('youtube'),
        tiktok: findSocialUrl('tiktok'),
      },
      
      // Products and services
      products: {
        services: products.service || [],
        offers: products.offer || [],
      },
      
      // SEO info
      seo: {
        title: seo.title || '',
        description: seo.description || '',
        keywords: seo.keywords || [],
      },
      
      // Market info
      market: {
        country: market.country || [],
        competitors: market.competitors || [],
        differentiators: market.differentiators || [],
      },
      
      // Audience
      audience: {
        segments: audience.audience_segments || [],
        pain_points: audience.pain_points || [],
      },
      
      // Contact
      contact: {
        email: contact.email || [],
        phone: contact.phone || [],
        address: contact.address || [],
      },
      
      // Digital Presence Analysis (from second API)
      digital_presence: digitalPresenceData ? {
        executive_diagnosis: digitalPresenceData.executive_diagnosis || digitalPresenceData.diagnostico_ejecutivo || null,
        what_is_working: digitalPresenceData.what_is_working || digitalPresenceData.lo_que_funciona || null,
        what_is_missing: digitalPresenceData.what_is_missing || digitalPresenceData.lo_que_falta || null,
        key_risks: digitalPresenceData.key_risks || digitalPresenceData.riesgos_clave || null,
        action_plan: digitalPresenceData.action_plan || digitalPresenceData.plan_de_accion || null,
        competitive_positioning: digitalPresenceData.competitive_positioning || digitalPresenceData.posicionamiento_competitivo || null,
        digital_footprint_summary: digitalPresenceData.digital_footprint_summary || digitalPresenceData.resumen_huella_digital || null,
      } : null,
      
      // Raw data for reference
      raw: {
        extractor: extractorData,
        digital_presence: digitalPresenceData,
      },
    };

    console.log('✅ Competitor analysis complete:', competitorInfo.name, 
      digitalPresenceData ? '(with digital presence)' : '(without digital presence)');

    return new Response(
      JSON.stringify({ 
        success: true, 
        competitor: competitorInfo 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-single-competitor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
