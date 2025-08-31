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

/**
 * Validate input data
 */
function validateInput(companyId: string, input: any) {
  if (!companyId || !input?.data) {
    throw new Error('CompanyId and input data are required');
  }
  return input.data;
}

/**
 * Authenticate user from request
 */
async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Authorization header required');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !user) {
    throw new Error('Invalid user token');
  }
  
  return user;
}

/**
 * Call N8N API for strategy generation
 */
async function callN8NStrategy(companyData: any) {
  const n8nEndpoint = 'https://buildera.app.n8n.cloud/webhook/company-strategy';
  
  // Get N8N authentication credentials
  const authUser = Deno.env.get('N8N_AUTH_USER');
  const authPass = Deno.env.get('N8N_AUTH_PASS');
  
  if (!authUser || !authPass) {
    console.error('❌ N8N authentication credentials not found');
    throw new Error('N8N authentication credentials not configured');
  }

  const credentials = btoa(`${authUser}:${authPass}`);
  const requestPayload = {
    input: {
      data: companyData
    }
  };

  console.log('🚀 Calling N8N API:', n8nEndpoint);
  console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
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

    console.log(`📊 N8N API Response status: ${apiResponse.status} ${apiResponse.statusText}`);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => '');
      throw new Error(`N8N API error: ${apiResponse.status} - ${errorText}`);
    }

    const rawBody = await apiResponse.text();
    console.log('🧪 N8N raw response sample:', rawBody.slice(0, 500));

    // Parse JSON response
    let strategyResponse;
    try {
      strategyResponse = JSON.parse(rawBody);
      console.log('✅ N8N API response parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse N8N response as JSON');
      throw new Error('Invalid JSON response from N8N API');
    }

    return strategyResponse;

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('N8N API request timed out');
    }
    
    console.error('❌ Error calling N8N API:', error);
    
    // Return fallback strategy
    return {
      mision: `Proporcionar soluciones innovadoras y de calidad en el sector de ${companyData.industries?.[0] || 'servicios'}, creando valor excepcional para nuestros clientes.`,
      vision: `Ser la empresa líder reconocida por la excelencia en ${companyData.industries?.[0] || 'servicios'}, transformando la industria a través de la innovación.`,
      propuesta_valor: `Ofrecemos soluciones personalizadas que optimizan los procesos de nuestros clientes, reduciendo costos y maximizando resultados.`
    };
  }
}

/**
 * Store strategy in database
 */
async function storeStrategy(companyId: string, strategy: any) {
  console.log('💾 Storing strategy in database...');
  
  // Check for existing strategy
  const { data: existingStrategy, error: selectError } = await supabase
    .from('company_strategy')
    .select('id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (selectError) {
    console.error('❌ Error checking existing strategy:', selectError);
    throw new Error('Database access error');
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
      throw new Error('Failed to update strategy');
    }

    strategyId = existingStrategy.id;
    console.log('✅ Strategy updated successfully');
  } else {
    console.log('🆕 Creating new strategy...');
    
    const { data: newStrategy, error: strategyError } = await supabase
      .from('company_strategy')
      .insert({
        company_id: companyId,
        ...strategy
      })
      .select('id')
      .single();

    if (strategyError) {
      console.error('❌ Error creating strategy:', strategyError);
      throw new Error('Failed to create strategy');
    }

    strategyId = newStrategy.id;
    console.log('✅ Strategy created successfully:', strategyId);
  }

  return strategyId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Starting company strategy generation...');
    
    const body = await req.json();
    console.log('📝 Request received:', body);
    
    // 1. Validate input
    const { companyId, input } = body;
    const companyData = validateInput(companyId, input);
    
    // 2. Authenticate user
    const user = await authenticateUser(req);
    console.log('👤 User authenticated:', user.id);
    
    // 3. Call N8N API
    const strategyResponse = await callN8NStrategy(companyData);
    
    // 4. Store in database
    const strategy = {
      mision: strategyResponse.mision || 'Misión no definida',
      vision: strategyResponse.vision || 'Visión no definida',
      propuesta_valor: strategyResponse.propuesta_valor || 'Propuesta de valor no definida',
      valores: strategyResponse.valores || ['Innovación', 'Calidad', 'Transparencia'],
      ventajas_competitivas: strategyResponse.ventajas_competitivas || ['Tecnología avanzada', 'Equipo especializado']
    };
    
    const strategyId = await storeStrategy(companyId, strategy);

    console.log('✅ Company strategy process completed successfully');

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

  } catch (error: any) {
    console.error('❌ Error in company-strategy:', error);
    
    const status = error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack || 'No additional details available'
      }),
      { 
        status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});