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
    const { companyId } = await req.json();
    
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'CompanyId is required' }),
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get company data from database (including webhook_data from diagnostic)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, website_url, logo_url, description, industry_sector, country, webhook_data')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get company strategy (mission, vision, value proposition) - get the latest one
    const { data: strategy } = await supabase
      .from('company_strategies')
      .select('mision, vision, propuesta_valor')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get digital presence data (executive diagnosis, what works, risks)
    const { data: digitalPresence } = await supabase
      .from('company_digital_presence')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get audiences data
    const { data: audiences } = await supabase
      .from('company_audiences')
      .select('name, description, age_ranges, interests, pain_points, goals')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(5);

    // Get products/services data
    const { data: products } = await supabase
      .from('company_products')
      .select('name, description, category, key_benefits, target_audience')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(10);

    console.log('📋 Company data:', company.name);
    console.log('📋 Strategy data:', strategy ? 'Found' : 'None');
    console.log('📋 Digital presence:', digitalPresence ? 'Found' : 'None');
    console.log('📋 Audiences:', audiences?.length || 0);
    console.log('📋 Products:', products?.length || 0);

    // Extract diagnostic data from webhook_data
    const webhookData = company.webhook_data || {};
    const diagnosticIdentity = webhookData.identity || {};
    const diagnosticSeo = webhookData.seo || {};
    const diagnosticMarket = webhookData.market || {};
    const diagnosticAudience = webhookData.audience || {};
    const diagnosticProducts = webhookData.products || {};

    // Build comprehensive payload for brand identity generation
    const companyData = {
      // Basic company info
      nombre_empresa: company.name,
      descripcion_empresa: company.description || diagnosticSeo.description || '',
      sitio_web: company.website_url || '',
      logo: company.logo_url || diagnosticIdentity.logo || '',
      sector_industria: company.industry_sector || '',
      pais: company.country || diagnosticMarket.country?.[0] || '',
      
      // Strategy
      mision: strategy?.mision || '',
      vision: strategy?.vision || '',
      propuesta_valor: strategy?.propuesta_valor || '',
      
      // From diagnostic - SEO & Keywords
      keywords: diagnosticSeo.keywords || [],
      meta_description: diagnosticSeo.description || '',
      
      // From diagnostic - Market positioning
      posicionamiento_competitivo: digitalPresence?.competitive_positioning || '',
      fortalezas: digitalPresence?.what_is_working || [],
      debilidades: digitalPresence?.what_is_missing || [],
      riesgos: digitalPresence?.key_risks || [],
      diagnostico_ejecutivo: digitalPresence?.executive_diagnosis || {},
      
      // From diagnostic - Target audience
      audiencia_objetivo: diagnosticAudience.target_audience || [],
      segmentos_audiencia: audiences?.map(a => ({
        nombre: a.name,
        descripcion: a.description,
        edades: a.age_ranges,
        intereses: a.interests,
        puntos_dolor: a.pain_points,
        objetivos: a.goals
      })) || [],
      
      // From diagnostic - Products/Services
      productos_servicios: products?.map(p => ({
        nombre: p.name,
        descripcion: p.description,
        categoria: p.category,
        beneficios: p.key_benefits,
        audiencia_objetivo: p.target_audience
      })) || diagnosticProducts.offer || [],
      
      // Company personality hints from diagnostic
      personalidad_marca: {
        slogan: diagnosticIdentity.slogan || '',
        valores: diagnosticIdentity.values || [],
        tono_comunicacion: diagnosticSeo.tone || ''
      }
    };

    console.log('🎨 Generating brand identity for:', company.name);

    // Get N8N authentication credentials
    const authUser = Deno.env.get('N8N_AUTH_USER');
    const authPass = Deno.env.get('N8N_AUTH_PASS');

    if (!authUser || !authPass) {
      return new Response(
        JSON.stringify({ error: 'N8N authentication credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data for N8N API call
    const requestPayload = {
      input: {
        data: companyData
      }
    };

    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

    // Call N8N API for brand identity generation
    const n8nEndpoint = 'https://buildera.app.n8n.cloud/webhook/brand-identity';
    
    console.log('🚀 Calling N8N API:', n8nEndpoint);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    // Create basic auth header
    const credentials = btoa(`${authUser}:${authPass}`);

    const apiResponse = await fetch(n8nEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = apiResponse.headers.get('content-type') || '';
    console.log(`📊 N8N API Response status: ${apiResponse.status} ${apiResponse.statusText}, content-type: ${contentType}`);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => '');
      console.error('❌ N8N API error:', apiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `N8N API error: ${apiResponse.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiResult = await apiResponse.json();
    console.log('✅ N8N API response received:', JSON.stringify(apiResult, null, 2));

    // Process response structure: [{"": {...}}]
    let brandData;
    if (Array.isArray(apiResult) && apiResult.length > 0) {
      const firstItem = apiResult[0];
      // Handle structure with empty string key
      brandData = firstItem[""] || firstItem;
    } else {
      brandData = apiResult;
    }

    console.log('📋 Extracted brand data:', brandData);

    if (!brandData || (!brandData.paleta_de_colores && !brandData.identidad_verbal_y_visual)) {
      return new Response(
        JSON.stringify({ error: 'Invalid response from N8N API - no brand data received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map the comprehensive response structure to database fields
    const brandIdentity = {
      primary_color: brandData.paleta_de_colores?.principal?.hex || null,
      secondary_color: brandData.paleta_de_colores?.secundario?.hex || null,
      complementary_color_1: brandData.paleta_de_colores?.complementario1?.hex || null,
      complementary_color_2: brandData.paleta_de_colores?.complementario2?.hex || null,
      visual_identity: brandData.identidad_verbal_y_visual?.sintesis_visual?.concepto_general || null,
      
      // Store detailed color justifications
      color_justifications: {
        principal: brandData.paleta_de_colores?.principal?.justificacion || null,
        secundario: brandData.paleta_de_colores?.secundario?.justificacion || null,
        complementario1: brandData.paleta_de_colores?.complementario1?.justificacion || null,
        complementario2: brandData.paleta_de_colores?.complementario2?.justificacion || null,
      },
      
      // Store brand voice information
      brand_voice: {
        personalidad: brandData.identidad_verbal_y_visual?.brand_voice?.personalidad || null,
        descripcion: brandData.identidad_verbal_y_visual?.brand_voice?.descripcion || null,
        palabras_clave: brandData.identidad_verbal_y_visual?.brand_voice?.palabras_clave || [],
      },
      
      // Store visual synthesis information
      visual_synthesis: {
        concepto_general: brandData.identidad_verbal_y_visual?.sintesis_visual?.concepto_general || null,
        tipografia: brandData.identidad_verbal_y_visual?.sintesis_visual?.tipografia || null,
        estilo_fotografico: brandData.identidad_verbal_y_visual?.sintesis_visual?.estilo_fotografico || null,
      },
      
      // Store complete response for future reference
      full_brand_data: brandData,
    };

    console.log('🎨 Mapped brand identity:', JSON.stringify(brandIdentity, null, 2));

    // Store brand identity in database
    const { data: existingBranding } = await supabase
      .from('company_branding')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    let brandId;

    if (existingBranding) {
      const { error: updateError } = await supabase
        .from('company_branding')
        .update(brandIdentity)
        .eq('id', existingBranding.id);

      if (updateError) {
        console.error('Error updating branding:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update brand identity' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      brandId = existingBranding.id;
    } else {
      const { data: newBranding, error: brandingError } = await supabase
        .from('company_branding')
        .insert({
          company_id: companyId,
          ...brandIdentity
        })
        .select('id')
        .single();

      if (brandingError) {
        console.error('Error creating branding:', brandingError);
        return new Response(
          JSON.stringify({ error: 'Failed to create brand identity' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      brandId = newBranding.id;
    }

    console.log('✅ Brand identity created/updated:', brandId);

    return new Response(
      JSON.stringify({ 
        brandId,
        associatedCompanyId: companyId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in brand-identity:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});