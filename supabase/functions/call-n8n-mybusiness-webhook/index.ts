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

    // Parse COMPANY_INFO and ADDITIONAL_INFO if they are JSON strings
    let companyInfo;
    let additionalInfo;
    
    try {
      companyInfo = JSON.parse(body.COMPANY_INFO);
      console.log('📋 COMPANY_INFO parseado:', companyInfo);
    } catch (e) {
      companyInfo = body.COMPANY_INFO;
      console.log('📋 COMPANY_INFO como string:', companyInfo);
    }
    
    try {
      additionalInfo = body.ADDITIONAL_INFO ? JSON.parse(body.ADDITIONAL_INFO) : null;
      console.log('📋 ADDITIONAL_INFO parseado:', additionalInfo);
    } catch (e) {
      additionalInfo = body.ADDITIONAL_INFO;
      console.log('📋 ADDITIONAL_INFO como string:', additionalInfo);
    }

    console.log('🔐 Preparando autenticación básica');
    
    // Get N8N credentials from environment
    const authUser = Deno.env.get('N8N_AUTH_USER');
    const authPass = Deno.env.get('N8N_AUTH_PASS');

    if (!authUser || !authPass) {
      console.error('❌ N8N authentication credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'N8N authentication credentials not configured',
          details: 'Missing N8N_AUTH_USER or N8N_AUTH_PASS environment variables'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Create basic auth header
    const credentials = btoa(`${authUser}:${authPass}`);
    const authHeader = `Basic ${credentials}`;

    console.log('📤 Enviando request al webhook externo...');
    
    // Prepare URL with query parameters for GET request
    const url = new URL('https://buildera.app.n8n.cloud/webhook/my-business');
    url.searchParams.append('KEY', body.KEY);
    
    // Format COMPANY_INFO correctly based on parsed data
    if (typeof companyInfo === 'object' && companyInfo !== null) {
      // Format as expected by n8n - include description for STRATEGY
      const companyInfoStr = `Empresa: ${companyInfo.company_name || 'Sin nombre'}, sitio web: ${companyInfo.website_url || 'Sin sitio web'}, país: ${companyInfo.country || 'No especificado'}, descripción: ${companyInfo.description || 'Sin descripción'}`;
      url.searchParams.append('COMPANY_INFO', companyInfoStr);
      console.log('📋 COMPANY_INFO formateado:', companyInfoStr);
    } else {
      url.searchParams.append('COMPANY_INFO', String(companyInfo));
    }
    
    // Format ADDITIONAL_INFO correctly
    if (additionalInfo) {
      if (typeof additionalInfo === 'object' && additionalInfo !== null) {
        const additionalInfoStr = `Industria: ${additionalInfo.industry || 'No especificada'}, descripción: ${additionalInfo.description || 'Sin descripción'}`;
        url.searchParams.append('ADDITIONAL_INFO', additionalInfoStr);
        console.log('📋 ADDITIONAL_INFO formateado:', additionalInfoStr);
      } else {
        url.searchParams.append('ADDITIONAL_INFO', String(additionalInfo));
      }
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
    
    // Check if response is JSON by looking at content-type or trying to parse
    const contentType = webhookResponse.headers.get('content-type') || '';
    const isJsonResponse = contentType.includes('application/json') || responseText.trim().startsWith('[') || responseText.trim().startsWith('{');
    
    if (isJsonResponse) {
      try {
        responseData = JSON.parse(responseText);
        console.log('📋 Datos parseados de JSON:', JSON.stringify(responseData, null, 2));
      } catch (e) {
        console.log('❌ Error parseando JSON, usando texto crudo:', e);
        responseData = { error: 'Invalid JSON response', raw: responseText };
      }
    } else {
      console.log('📄 Respuesta no es JSON, probablemente error HTML');
      responseData = { error: 'Non-JSON response received', raw: responseText };
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