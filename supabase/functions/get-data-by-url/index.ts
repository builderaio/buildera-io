import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetDataRequest {
  url: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando getDataByURL');
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Only POST method is allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const body: GetDataRequest = await req.json();
    console.log('📋 URL recibida:', body.url);

    if (!body.url || !body.user_id) {
      return new Response(
        JSON.stringify({ error: 'URL and user_id are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create basic auth header
    const credentials = btoa('buildera:Buildera2025*');
    const authHeader = `Basic ${credentials}`;

    console.log('📤 Llamando a getDataByURL webhook...');
    
    // Call the external webhook
    const webhookResponse = await fetch('https://buildera.app.n8n.cloud/webhook/getDataByURL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ url: body.url }),
    });

    console.log('📥 Respuesta webhook status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log('✅ Datos obtenidos del webhook');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store data in database
    const { data, error } = await supabase
      .from('company_external_data')
      .upsert({
        user_id: body.user_id,
        company_url: body.url,
        url_data: webhookData,
      })
      .select();

    if (error) {
      console.error('❌ Error guardando en BD:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ Datos guardados en BD');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Data retrieved and stored successfully',
        data: webhookData
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('💥 Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);