import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get user from authorization header
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

    // Call company-info-extractor API
    const apiUrl = `https://buildera.app.n8n.cloud/webhook/company-info-extractor?URL=${encodeURIComponent(normalizedUrl)}`;
    console.log('📡 Calling n8n API:', apiUrl);

    // Get N8N auth headers
    const authUser = Deno.env.get('N8N_AUTH_USER');
    const authPass = Deno.env.get('N8N_AUTH_PASS');
    
    if (!authUser || !authPass) {
      return new Response(
        JSON.stringify({ error: 'N8N authentication credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const credentials = btoa(`${authUser}:${authPass}`);
    const n8nHeaders = {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: n8nHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('❌ N8N API error:', response.status, errText);
        return new Response(
          JSON.stringify({ error: `API error: ${response.status}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const rawBody = await response.text();
      console.log('📨 Response received, length:', rawBody?.length ?? 0);

      if (!rawBody || rawBody.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Empty response from API' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse response
      let parsed: any;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON response from API' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract the output from various formats
      let output = parsed;
      if (Array.isArray(parsed) && parsed.length > 0) {
        output = parsed[0]?.output || parsed[0];
      } else if (parsed?.output) {
        output = parsed.output;
      }

      // Structure the competitor data
      const identity = output.identity || {};
      const seo = output.seo || {};
      const products = output.products || {};
      const contact = output.contact || {};
      const market = output.market || {};
      const audience = output.audience || {};

      // Extract social links
      const socialLinks = contact.social_links || [];
      const findSocialUrl = (platform: string) => {
        return socialLinks.find((u: string) => u?.toLowerCase().includes(platform)) || null;
      };

      const competitorInfo = {
        // Basic info
        name: identity.company_name || identity.legal_name || 'Competidor',
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
        
        // Raw data for reference
        raw: output,
      };

      console.log('✅ Competitor analysis complete:', competitorInfo.name);

      return new Response(
        JSON.stringify({ 
          success: true, 
          competitor: competitorInfo 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      clearTimeout(timeout);
      const isTimeout = fetchError.name === 'AbortError';
      console.error('❌ Fetch error:', isTimeout ? 'Timeout' : fetchError.message);
      
      return new Response(
        JSON.stringify({ error: isTimeout ? 'Request timeout' : 'Failed to fetch competitor data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in analyze-single-competitor:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
