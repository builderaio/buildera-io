import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_URL = 'https://buildera.app.n8n.cloud/webhook/image-creator';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎨 Iniciando generación de imagen con n8n...');
    
    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Authorization header required' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid user token' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log('📝 Datos recibidos:', body);

    const { prompt, user_id, content_id, platform } = body;

    // Use authenticated user ID if not provided in body
    const authenticatedUserId = user_id || user.id;

    if (!prompt) {
      throw new Error('Prompt es requerido');
    }

    // Enhanced prompt for social media images
    const enhancedPrompt = `Create a professional, engaging social media image for: ${prompt}. 
    Style: Modern, clean, eye-catching design suitable for social media platforms. 
    High quality, vibrant colors, professional composition, visually appealing for marketing content.
    Platform: ${platform || 'general social media'}`;

    console.log('📤 Enviando request a n8n webhook...');
    
    // Prepare query parameters for GET request to n8n
    const queryParams = new URLSearchParams({
      prompt: enhancedPrompt,
      user_id: authenticatedUserId || '',
      content_id: content_id || '',
      platform: platform || 'general',
      size: '1024x1024',
      quality: 'high',
      output_format: 'png',
      timestamp: new Date().toISOString()
    });

    const requestUrl = `${N8N_WEBHOOK_URL}?${queryParams.toString()}`;
    console.log('🔗 Complete Request URL:', requestUrl);
    console.log('🔗 N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL);
    console.log('🔗 Query Parameters:', queryParams.toString());

    console.log('⏳ Making request to n8n...');
    
    // Build authentication for n8n
    const authType = Deno.env.get('N8N_IMAGE_WEBHOOK_AUTH_TYPE') || 'none'; // 'basic' | 'bearer' | 'apikey' | 'none'
    const n8nHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Supabase-Edge-Function/1.0',
    };
    let finalUrl = requestUrl;

    if (authType === 'basic') {
      const userName = Deno.env.get('N8N_IMAGE_WEBHOOK_USER') || '';
      const password = Deno.env.get('N8N_IMAGE_WEBHOOK_PASSWORD') || '';
      if (userName && password) {
        const basic = btoa(`${userName}:${password}`);
        n8nHeaders['Authorization'] = `Basic ${basic}`;
      } else {
        console.warn('⚠️ N8N basic auth missing user/password');
      }
    } else if (authType === 'bearer') {
      const bearer = Deno.env.get('N8N_IMAGE_WEBHOOK_BEARER') || '';
      if (bearer) {
        n8nHeaders['Authorization'] = `Bearer ${bearer}`;
      } else {
        console.warn('⚠️ N8N bearer token not set');
      }
    } else if (authType === 'apikey') {
      const keyName = Deno.env.get('N8N_IMAGE_WEBHOOK_API_KEY_NAME') || 'x-api-key';
      const keyValue = Deno.env.get('N8N_IMAGE_WEBHOOK_API_KEY_VALUE') || '';
      if (keyValue) {
        n8nHeaders[keyName] = keyValue;
        // Also pass via query to maximize compatibility
        try {
          const u = new URL(finalUrl);
          u.searchParams.set(keyName, keyValue);
          finalUrl = u.toString();
        } catch (_) {}
      } else {
        console.warn('⚠️ N8N API key value not set');
      }
    }

    console.log('🔐 n8n auth type:', authType, 'headers sent:', Object.keys(n8nHeaders));

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: n8nHeaders,
    });

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error de n8n webhook:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestUrl
      });
      
      // Try to test connectivity to n8n
      console.log('🔍 Testing connectivity to n8n...');
      try {
        const testResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Connectivity-Test' }
        });
        console.log('🔍 Connectivity test result:', testResponse.status, testResponse.statusText);
      } catch (testError) {
        console.error('🔍 Connectivity test failed:', testError);
      }
      
      throw new Error(`Error de n8n webhook: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de n8n recibida:', {
      success: data.success,
      hasImageUrl: !!data.image_url,
      responseKeys: Object.keys(data),
      fullResponse: data
    });

    if (!data.success) {
      console.error('❌ Error en la respuesta de n8n:', data.error);
      throw new Error(data.error || 'Error en el webhook de n8n');
    }

    // Extract image URL from n8n response
    const imageUrl = data.image_url || data.imageUrl || data.url;
    
    if (!imageUrl) {
      console.error('❌ No se recibió URL de imagen de n8n:', data);
      throw new Error('No se recibió URL de imagen del webhook');
    }

    console.log('🖼️ Imagen generada exitosamente, URL:', imageUrl);

    // Optional: Store image info in database for tracking
    if (authenticatedUserId && content_id) {
      try {
        const { error: logError } = await supabase
          .from('generated_content')
          .update({ 
            media_url: imageUrl,
            content_type: 'image',
            updated_at: new Date().toISOString()
          })
          .eq('id', content_id)
          .eq('user_id', authenticatedUserId);

        if (logError) {
          console.error('❌ Error updating content record:', logError);
        } else {
          console.log('✅ Content record updated with image URL');
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        // Don't fail the request if database update fails
      }
    }

    // Log successful image generation
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: authenticatedUserId,
          function_name: 'marketing-hub-image-creator',
          request_data: { prompt: enhancedPrompt, platform },
          response_data: { success: true, image_url: imageUrl },
          status: 'success',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Error logging API usage:', logError);
    }

    return new Response(JSON.stringify({ 
      success: true,
      image_url: imageUrl,
      prompt: enhancedPrompt,
      provider: 'n8n'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error en marketing-hub-image-creator:', error);
    
    // Log failed image generation
    try {
      const body = await req.json().catch(() => ({}));
      const userId = body.user_id || 'unknown';
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: userId,
          function_name: 'marketing-hub-image-creator',
          request_data: body,
          response_data: { error: error.message },
          status: 'error',
          created_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('❌ Error logging failed API usage:', logError);
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Error interno del servidor',
      provider: 'n8n'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});