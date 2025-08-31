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

    console.log('📝 Strategy data to store:', JSON.stringify(strategy, null, 2));
    console.log('🔍 Company ID:', companyId);
    console.log('👤 User ID:', user.id);

    // Store strategy in database
    const { data: existingStrategy, error: selectError } = await supabase
      .from('company_strategy')
      .select('id')
      .eq('company_id', companyId)
      .maybeSingle();

    if (selectError) {
      console.error('❌ Error checking existing strategy:', selectError);
      return new Response(
        JSON.stringify({ error: 'Database access error', details: selectError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let strategyId;

    if (existingStrategy) {
      console.log('♻️ Updating existing strategy:', existingStrategy.id);
      const { error: updateError } = await supabase
        .from('company_strategy')
        .update(strategy)
        .eq('id', existingStrategy.id);

      if (updateError) {
        console.error('❌ Error updating strategy:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update strategy', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      strategyId = existingStrategy.id;
      console.log('✅ Strategy updated successfully');
    } else {
      console.log('🆕 Creating new strategy...');
      const insertData = {
        company_id: companyId,
        user_id: user.id,
        ...strategy
      };
      console.log('📤 Insert data:', JSON.stringify(insertData, null, 2));
      
      const { data: newStrategy, error: strategyError } = await supabase
        .from('company_strategy')
        .insert(insertData)
        .select('id')
        .single();

      if (strategyError) {
        console.error('❌ Error creating strategy:', strategyError);
        console.error('❌ Strategy error details:', JSON.stringify(strategyError, null, 2));
        return new Response(
          JSON.stringify({ error: 'Failed to create strategy', details: strategyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      strategyId = newStrategy.id;
      console.log('✅ Strategy created successfully:', strategyId);
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