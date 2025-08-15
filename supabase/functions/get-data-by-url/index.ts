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
    
    let url: string;
    let user_id: string;

    if (req.method === 'GET') {
      // Handle GET request with query parameters
      const urlObj = new URL(req.url);
      url = urlObj.searchParams.get('url') || '';
      user_id = urlObj.searchParams.get('user_id') || '';
      console.log('📋 GET - URL recibida:', url);
    } else if (req.method === 'POST') {
      // Handle POST request with JSON body
      const body: GetDataRequest = await req.json();
      url = body.url;
      user_id = body.user_id;
      console.log('📋 POST - URL recibida:', url);
    } else {
      return new Response(
        JSON.stringify({ error: 'Only GET and POST methods are allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (!url || !user_id) {
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

    // Asegurar que la URL tenga protocolo
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('📤 Llamando a getDataByURL webhook con URL:', formattedUrl);
    
    // Call the external webhook using GET method with URL as query parameter
    const webhookUrl = `https://buildera.app.n8n.cloud/webhook/getDataByURL?url=${encodeURIComponent(formattedUrl)}`;
    const webhookResponse = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('📥 Respuesta webhook status:', webhookResponse.status);

    const responseText = await webhookResponse.text();
    console.log('📄 Respuesta webhook body:', responseText);

    if (!webhookResponse.ok) {
      console.error('❌ Error en webhook. Status:', webhookResponse.status, 'Body:', responseText);
      throw new Error(`Webhook failed with status: ${webhookResponse.status} - ${responseText}`);
    }

    let webhookData;
    try {
      webhookData = JSON.parse(responseText);
    } catch (e) {
      console.log('📄 Respuesta no es JSON válido, usando como texto');
      webhookData = { raw_response: responseText };
    }
    console.log('✅ Datos obtenidos del webhook');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store data in database
    const { data, error } = await supabase
      .from('company_external_data')
      .upsert({
        user_id: user_id,
        company_url: formattedUrl,
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