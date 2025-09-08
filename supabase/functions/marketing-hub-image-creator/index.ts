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
    
    const body = await req.json();
    console.log('📝 Datos recibidos:', body);

    const { prompt, user_id, content_id, platform } = body;

    if (!prompt) {
      throw new Error('Prompt es requerido');
    }

    // Enhanced prompt for social media images
    const enhancedPrompt = `Create a professional, engaging social media image for: ${prompt}. 
    Style: Modern, clean, eye-catching design suitable for social media platforms. 
    High quality, vibrant colors, professional composition, visually appealing for marketing content.
    Platform: ${platform || 'general social media'}`;

    console.log('📤 Enviando request a n8n webhook...');
    
    // Prepare payload for n8n
    const n8nPayload = {
      prompt: enhancedPrompt,
      user_id: user_id,
      content_id: content_id,
      platform: platform || 'general',
      size: '1024x1024',
      quality: 'high',
      output_format: 'png',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error de n8n webhook:', response.status, errorData);
      throw new Error(`Error de n8n webhook: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Respuesta de n8n recibida:', data);

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
    if (user_id && content_id) {
      try {
        const { error: logError } = await supabase
          .from('generated_content')
          .update({ 
            media_url: imageUrl,
            content_type: 'image',
            updated_at: new Date().toISOString()
          })
          .eq('id', content_id)
          .eq('user_id', user_id);

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
          user_id: user_id,
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
      await supabase
        .from('api_usage_logs')
        .insert({
          user_id: body.user_id,
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