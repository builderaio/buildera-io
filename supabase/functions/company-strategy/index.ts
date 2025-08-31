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
    const { companyId, input } = await req.json();
    
    if (!companyId || !input?.data) {
      return new Response(
        JSON.stringify({ error: 'CompanyId and input data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎯 Generating company strategy for:', companyId);

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

    const companyData = input.data;

    // Generate strategy based on company data
    const strategy = {
      mision: `Proporcionar soluciones innovadoras y de calidad en el sector de ${companyData.industry_sector || 'servicios'}, creando valor excepcional para nuestros clientes y contribuyendo al crecimiento sostenible de la comunidad.`,
      vision: `Ser la empresa líder reconocida por la excelencia en ${companyData.industry_sector || 'servicios'}, transformando la industria a través de la innovación y el compromiso con la satisfacción del cliente.`,
      propuesta_valor: `Ofrecemos soluciones personalizadas y tecnológicamente avanzadas que optimizan los procesos de nuestros clientes, reduciendo costos y maximizando resultados a través de nuestro enfoque centrado en la calidad y la innovación.`,
      valores: ['Innovación', 'Calidad', 'Transparencia', 'Compromiso', 'Sostenibilidad'],
      ventajas_competitivas: [
        'Tecnología de vanguardia',
        'Equipo altamente especializado',
        'Enfoque personalizado',
        'Procesos optimizados'
      ]
    };

    // Store strategy in database
    const { data: existingStrategy } = await supabase
      .from('company_strategy')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    let strategyId;

    if (existingStrategy) {
      const { error: updateError } = await supabase
        .from('company_strategy')
        .update(strategy)
        .eq('id', existingStrategy.id);

      if (updateError) {
        console.error('Error updating strategy:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update strategy' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      strategyId = existingStrategy.id;
    } else {
      const { data: newStrategy, error: strategyError } = await supabase
        .from('company_strategy')
        .insert({
          company_id: companyId,
          user_id: user.id,
          ...strategy
        })
        .select('id')
        .single();

      if (strategyError) {
        console.error('Error creating strategy:', strategyError);
        return new Response(
          JSON.stringify({ error: 'Failed to create strategy' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      strategyId = newStrategy.id;
    }

    console.log('✅ Company strategy created/updated:', strategyId);

    return new Response(
      JSON.stringify({ 
        strategyId,
        data_stored: strategy
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in company-strategy:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});