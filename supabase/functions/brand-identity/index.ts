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

    // Generate brand identity based on company strategy
    const brandIdentity = {
      visual_identity: `La identidad visual de ${nombre_empresa} refleja profesionalismo, innovación y confianza. Utiliza elementos modernos y limpios que comunican claridad y eficiencia en la prestación de servicios.`,
      primary_color: '#2563eb', // Professional blue
      secondary_color: '#f8fafc', // Clean white/gray
      complementary_color_1: '#10b981', // Success green
      complementary_color_2: '#f59e0b', // Accent orange
    };

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