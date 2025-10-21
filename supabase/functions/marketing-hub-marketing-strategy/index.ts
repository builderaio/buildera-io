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
    const body = await req.json();
    const { input, retrieve_existing } = body;
    
    if (!input?.nombre_empresa || !input?.objetivo_de_negocio) {
      return new Response(JSON.stringify({ 
        error: 'Campos requeridos: nombre_empresa, objetivo_de_negocio' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Autenticación requerida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's primary company
    const { data: companyMember } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (!companyMember) {
      return new Response(JSON.stringify({ error: 'Empresa no encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const companyId = companyMember.company_id;

    // Check for existing strategy (early return)
    if (retrieve_existing === true) {
      const { data: existing } = await supabase
        .from('marketing_strategies')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.full_strategy_data) {
        console.log('✅ Returning cached strategy');
        return new Response(JSON.stringify({
          strategy: existing.full_strategy_data,
          strategy_id: existing.id,
          cached: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Build minimal payload for N8N
    const payload = {
      nombre_empresa: input.nombre_empresa,
      objetivo_de_negocio: input.objetivo_de_negocio,
      nombre_campana: input.nombre_campana || 'Nueva Campaña',
      objetivo_campana: input.objetivo_campana || 'General',
      descripcion_campana: input.descripcion_campana || '',
      audiencias: input.audiencias || []
    };

    console.log('🔄 Calling N8N webhook...');
    
    // Call N8N webhook
    const n8nUrl = 'https://buildera.app.n8n.cloud/webhook/marketing-strategy';
    const n8nUser = Deno.env.get('N8N_AUTH_USER');
    const n8nPass = Deno.env.get('N8N_AUTH_PASS');

    const n8nResponse = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(n8nUser && n8nPass ? {
          'Authorization': `Basic ${btoa(`${n8nUser}:${n8nPass}`)}`
        } : {})
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(300000) // 5 minutes
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ N8N error:', errorText);
      throw new Error(`N8N returned ${n8nResponse.status}`);
    }

    const strategyData = await n8nResponse.json();
    console.log('✅ Strategy generated');

    // Store strategy (simple)
    const { data: existingStrategy } = await supabase
      .from('marketing_strategies')
      .select('id')
      .eq('company_id', companyId)
      .single();

    const strategyPayload = {
      company_id: companyId,
      core_message: strategyData.mensaje_diferenciador || strategyData.core_message || '',
      full_strategy_data: strategyData,
      message_variants: strategyData.variantes_mensaje || strategyData.differentiated_message || {},
      updated_at: new Date().toISOString()
    };

    let strategyId: string;

    if (existingStrategy) {
      const { data: updated } = await supabase
        .from('marketing_strategies')
        .update(strategyPayload)
        .eq('id', existingStrategy.id)
        .select()
        .single();
      strategyId = updated!.id;
    } else {
      const { data: created } = await supabase
        .from('marketing_strategies')
        .insert(strategyPayload)
        .select()
        .single();
      strategyId = created!.id;
    }

    console.log('✅ Strategy saved:', strategyId);

    // Return response
    return new Response(JSON.stringify({
      strategy: strategyData,
      strategy_id: strategyId,
      cached: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Error generando estrategia'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
