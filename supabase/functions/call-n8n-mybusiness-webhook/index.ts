import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookRequest {
  KEY: string;
  COMPANY_INFO: string;
  ADDITIONAL_INFO?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando llamada al webhook de Buildera');
    
    if (req.method !== 'POST') {
      console.log('❌ Método no permitido:', req.method);
      return new Response(
        JSON.stringify({ error: 'Only POST method is allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Parse request body
    const body: WebhookRequest = await req.json();
    console.log('📋 Datos recibidos:', { 
      KEY: body.KEY ? '***' : 'missing',
      COMPANY_INFO: body.COMPANY_INFO ? 'present' : 'missing',
      ADDITIONAL_INFO: body.ADDITIONAL_INFO ? 'present' : 'not provided'
    });

    // Validate required parameters
    if (!body.KEY || !body.COMPANY_INFO) {
      console.log('❌ Faltan parámetros requeridos');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters. KEY and COMPANY_INFO are required.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Prepare the payload for the external API
    const payload: WebhookRequest = {
      KEY: body.KEY,
      COMPANY_INFO: body.COMPANY_INFO,
    };

    // Add optional parameter if provided
    if (body.ADDITIONAL_INFO) {
      payload.ADDITIONAL_INFO = body.ADDITIONAL_INFO;
    }

    console.log('🔐 Preparando autenticación básica');
    
    // Create basic auth header
    const credentials = btoa('innoventum:Innoventum2025*');
    const authHeader = `Basic ${credentials}`;

    console.log('📤 Enviando request al webhook externo...');
    
    // Prepare URL with query parameters for GET request
    const url = new URL('https://buildera.app.n8n.cloud/webhook/my-business');
    url.searchParams.append('KEY', payload.KEY);
    url.searchParams.append('COMPANY_INFO', payload.COMPANY_INFO);
    if (payload.ADDITIONAL_INFO) {
      url.searchParams.append('ADDITIONAL_INFO', payload.ADDITIONAL_INFO);
    }

    // Make the API call to the external webhook
    const webhookResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log('📥 Respuesta del webhook:', {
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      ok: webhookResponse.ok
    });

    // Get response body
    const responseText = await webhookResponse.text();
    console.log('📄 Texto de respuesta crudo:', responseText);
    
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('📋 Datos parseados de JSON:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('❌ Error parseando JSON, usando texto crudo:', e);
      responseData = responseText;
    }

    // Log específico para STRATEGY
    if (body.KEY === 'STRATEGY') {
      console.log('🎯 STRATEGY - Respuesta específica:', {
        type: typeof responseData,
        isArray: Array.isArray(responseData),
        length: Array.isArray(responseData) ? responseData.length : 'N/A',
        keys: typeof responseData === 'object' ? Object.keys(responseData) : 'N/A',
        sample: responseData
      });
    }

    if (!webhookResponse.ok) {
      console.log('❌ Error en la respuesta del webhook:', responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Webhook call failed',
          status: webhookResponse.status,
          message: responseData
        }),
        {
          status: webhookResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('✅ Webhook ejecutado exitosamente');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook called successfully',
        data: responseData
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('💥 Error en la función:', error);
    
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