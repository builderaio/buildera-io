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
    console.log('📊 Company data received:', JSON.stringify(companyData, null, 2));

    // Call N8N API for strategy generation with robust handling
    const n8nEndpoint = 'https://buildera.app.n8n.cloud/webhook/company-strategy';
    const requestPayload = {
      input: {
        data: companyData
      }
    };

    console.log('🚀 Calling N8N API:', n8nEndpoint);
    console.log('📤 Request payload:', JSON.stringify(requestPayload, null, 2));

    let strategyResponse: any = null;
    
    try {
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
        strategyResponse = {
          mision: 'Misión generada pendiente',
          vision: 'Visión generada pendiente',
          propuesta_valor: 'Propuesta de valor generada pendiente'
        };
      } else {
        strategyResponse = apiResult;
        console.log('✅ N8N API response parsed:', JSON.stringify(strategyResponse, null, 2));
      }

    } catch (error: any) {
      console.error('❌ Error calling N8N API:', error);
      
      // Fallback strategy if N8N fails
      console.log('🔄 Using fallback strategy generation');
      strategyResponse = {
        mision: `Proporcionar soluciones innovadoras y de calidad en el sector de ${companyData.industries?.[0] || 'servicios'}, creando valor excepcional para nuestros clientes.`,
        vision: `Ser la empresa líder reconocida por la excelencia en ${companyData.industries?.[0] || 'servicios'}, transformando la industria a través de la innovación.`,
        propuesta_valor: `Ofrecemos soluciones personalizadas que optimizan los procesos de nuestros clientes, reduciendo costos y maximizando resultados.`
      };
    }

    // Use the strategy data from N8N response
    const strategy = {
      mision: strategyResponse.mision || 'Misión no definida',
      vision: strategyResponse.vision || 'Visión no definida', 
      propuesta_valor: strategyResponse.propuesta_valor || 'Propuesta de valor no definida',
      valores: strategyResponse.valores || ['Innovación', 'Calidad', 'Transparencia'],
      ventajas_competitivas: strategyResponse.ventajas_competitivas || ['Tecnología avanzada', 'Equipo especializado']
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