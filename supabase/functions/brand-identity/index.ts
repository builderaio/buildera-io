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
    const { companyId, nombre_empresa, mision, vision, propuesta_valor } = await req.json();
    
    if (!companyId || !nombre_empresa) {
      return new Response(
        JSON.stringify({ error: 'CompanyId and nombre_empresa are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎨 Generating brand identity for:', nombre_empresa);

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

    // Prepare data for N8N API call
    const requestPayload = {
      input: {
        data: {
          nombre_empresa,
          mision: mision || '',
          vision: vision || '',
          propuesta_valor: propuesta_valor || ''
        }
      }
    };

    console.log('🎨 Generating brand identity for:', nombre_empresa);
    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

    let brandIdentity: any = null;

    try {
      // Call N8N API for brand identity generation with robust handling
      const n8nEndpoint = 'https://buildera.app.n8n.cloud/webhook/brand-identity';
      
      console.log('🚀 Calling N8N API:', n8nEndpoint);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const apiResponse = await fetch(n8nEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        throw new Error(`N8N API error: ${apiResponse.status} - ${errorText}`);
      }

      const rawBody = await apiResponse.text().catch(() => '');
      const bodySample = rawBody.slice(0, 2000);
      console.log('🧪 N8N raw body sample (truncated 2KB):', bodySample);

      // Robust JSON parsing with fallbacks
      const safeParse = (txt: string) => {
        try { return JSON.parse(txt); } catch { return null; }
      };

      let apiResult: any = safeParse(rawBody);
      
      if (!apiResult && rawBody.trim()) {
        // Try to extract JSON object from response
        const firstBrace = rawBody.indexOf('{');
        if (firstBrace !== -1) {
          const extractBalanced = (text: string, startIndex: number) => {
            let depth = 0;
            let start = -1;
            for (let i = startIndex; i < text.length; i++) {
              const ch = text[i];
              if (ch === '{') { if (start === -1) start = i; depth++; }
              else if (ch === '}') { depth--; if (depth === 0 && start !== -1) return text.slice(start, i + 1); }
            }
            return null;
          };
          
          const objStr = extractBalanced(rawBody, firstBrace);
          apiResult = objStr ? safeParse(objStr) : null;
          if (apiResult) console.log('✅ Extracted JSON from response');
        }
      }

      if (!apiResult) {
        console.warn('⚠️ Could not parse N8N response as JSON, using fallback');
        brandIdentity = {
          visual_identity: `La identidad visual de ${nombre_empresa} refleja profesionalismo, innovación y confianza. Utiliza elementos modernos y limpios que comunican claridad y eficiencia.`,
          primary_color: '#2563eb',
          secondary_color: '#f8fafc',
          complementary_color_1: '#10b981',
          complementary_color_2: '#f59e0b',
        };
      } else {
        brandIdentity = {
          visual_identity: apiResult.visual_identity || `La identidad visual de ${nombre_empresa} refleja profesionalismo, innovación y confianza.`,
          primary_color: apiResult.primary_color || '#2563eb',
          secondary_color: apiResult.secondary_color || '#f8fafc',
          complementary_color_1: apiResult.complementary_color_1 || '#10b981',
          complementary_color_2: apiResult.complementary_color_2 || '#f59e0b',
        };
        console.log('✅ N8N API response processed:', JSON.stringify(brandIdentity, null, 2));
      }

    } catch (error: any) {
      console.error('❌ Error calling N8N API:', error);
      
      // Fallback brand identity if N8N fails
      console.log('🔄 Using fallback brand identity generation');
      brandIdentity = {
        visual_identity: `La identidad visual de ${nombre_empresa} refleja profesionalismo, innovación y confianza. Utiliza elementos modernos y limpios que comunican claridad y eficiencia en la prestación de servicios.`,
        primary_color: '#2563eb', // Professional blue
        secondary_color: '#f8fafc', // Clean white/gray
        complementary_color_1: '#10b981', // Success green
        complementary_color_2: '#f59e0b', // Accent orange
      };
    }

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