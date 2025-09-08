import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    console.log('🎨 Iniciando generación de imagen...');
    
    if (!openAIApiKey) {
      console.error('❌ OPENAI_API_KEY no está configurada');
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const body = await req.json();
    console.log('📝 Datos recibidos:', body);

    const { prompt, user_id, content_id } = body;

    if (!prompt) {
      throw new Error('Prompt es requerido');
    }

    // Enhanced prompt for social media images
    const enhancedPrompt = `Create a professional, engaging social media image for: ${prompt}. 
    Style: Modern, clean, eye-catching design suitable for social media platforms. 
    High quality, vibrant colors, professional composition, visually appealing for marketing content.`;

    console.log('📤 Enviando request a OpenAI para generar imagen...');
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'png'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error de OpenAI Images:', response.status, errorData);
      throw new Error(`Error de OpenAI Images: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('✅ Imagen generada exitosamente');

    if (!data.data || !data.data[0]) {
      console.error('❌ Respuesta inválida de OpenAI Images:', data);
      throw new Error('Respuesta inválida de OpenAI Images');
    }

    // Since gpt-image-1 returns base64, we get the image data directly
    const imageData = data.data[0];
    let imageUrl = '';

    if (imageData.b64_json) {
      // Convert base64 to data URL
      imageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else if (imageData.url) {
      // Fallback to URL if available
      imageUrl = imageData.url;
    } else {
      throw new Error('No image data received from OpenAI');
    }

    console.log('🖼️ Imagen procesada, tamaño de datos:', imageUrl.length);

    // Optional: Store image info in database for tracking
    if (user_id && content_id) {
      try {
        const { error: logError } = await supabase
          .from('generated_content')
          .update({ 
            media_url: imageUrl,
            content_type: 'image'
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

    return new Response(JSON.stringify({ 
      success: true,
      image_url: imageUrl,
      prompt: enhancedPrompt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Error en marketing-hub-image-creator:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});