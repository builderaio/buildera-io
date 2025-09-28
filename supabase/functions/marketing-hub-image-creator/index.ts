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

    // Handle both old format (prompt) and new format (input.calendario_item)
    let prompt, user_id, content_id, platform;
    
    if (body.input) {
      // New format from ContentEnhancementDialog
      const { input } = body;
      const calendarioItem = input.calendario_item;
      const identidadVisual = input.identidad_visual;
      
      // Generate prompt from calendar item
      prompt = `${calendarioItem.tema_concepto} - ${calendarioItem.descripcion_creativo || calendarioItem.copy_mensaje}`;
      platform = calendarioItem.red_social;
      user_id = body.user_id;
      content_id = body.content_id;
      
      console.log('📝 Generated prompt from calendar item:', prompt);
    } else {
      // Old format for backward compatibility
      prompt = body.prompt;
      user_id = body.user_id;
      content_id = body.content_id;
      platform = body.platform;
    }

    // Use authenticated user ID if not provided in body
    const authenticatedUserId = user_id || user.id;

    if (!prompt) {
      throw new Error('Prompt es requerido');
    }

    // Get company information for brand identity
    console.log('🏢 Obteniendo información de la empresa...');
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('created_by', authenticatedUserId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (companyError) {
      console.warn('⚠️ Error obteniendo datos de empresa:', companyError);
    }

    console.log('🏢 Datos de empresa obtenidos:', companyData ? 'Sí' : 'No');

    // Get company branding details
    let brandingData: any = null;
    if (companyData?.id) {
      console.log('🎨 Obteniendo branding de la empresa...');
      const { data: branding, error: brandingError } = await supabase
        .from('company_branding')
        .select('*')
        .eq('company_id', companyData.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (brandingError) {
        console.warn('⚠️ Error obteniendo branding:', brandingError);
      }
      brandingData = branding;
      console.log('🎨 Branding obtenido:', brandingData ? 'Sí' : 'No');
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

    // Add company brand identity if available
    if (companyData) {
      console.log('🎨 Agregando identidad de marca al query...');
      
      // Add essential company information for brand consistency
      if (companyData.name) queryParams.set('company_name', companyData.name);
      if (companyData.industry_sector) queryParams.set('company_industry', companyData.industry_sector);
      if (companyData.logo_url) queryParams.set('logo_url', companyData.logo_url);
      if (companyData.description) queryParams.set('company_description', companyData.description);
      if (companyData.website_url) queryParams.set('company_website', companyData.website_url);
      if (companyData.country) queryParams.set('company_country', companyData.country);
    }

    // Include detailed branding if available
    if (brandingData) {
      if (brandingData.primary_color) queryParams.set('brand_primary_color', brandingData.primary_color);
      if (brandingData.secondary_color) queryParams.set('brand_secondary_color', brandingData.secondary_color);
      if (brandingData.complementary_color_1) queryParams.set('brand_complementary_color_1', brandingData.complementary_color_1);
      if (brandingData.complementary_color_2) queryParams.set('brand_complementary_color_2', brandingData.complementary_color_2);
      if (brandingData.visual_identity) queryParams.set('brand_visual_identity', brandingData.visual_identity);
      if (brandingData.brand_manual_url) queryParams.set('brand_manual_url', brandingData.brand_manual_url);
      if (brandingData.brand_voice) queryParams.set('brand_voice', JSON.stringify(brandingData.brand_voice).slice(0, 1000));
      if (brandingData.visual_synthesis) queryParams.set('brand_visual_synthesis', JSON.stringify(brandingData.visual_synthesis).slice(0, 1000));
    }

    const requestUrl = `${N8N_WEBHOOK_URL}?${queryParams.toString()}`;
    console.log('🔗 Complete Request URL:', requestUrl);
    console.log('🔗 N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL);
    console.log('🔗 Query Parameters:', queryParams.toString());

    console.log('⏳ Making request to n8n...');
    
    // Basic auth EXACTLY like company-info-extractor / company-strategy
    const authUser = Deno.env.get('N8N_AUTH_USER') || '';
    const authPass = Deno.env.get('N8N_AUTH_PASS') || '';

    console.log('🔑 N8N basic auth present?', Boolean(authUser && authPass));
    if (!authUser || !authPass) {
      throw new Error('N8N authentication credentials not configured (N8N_AUTH_USER / N8N_AUTH_PASS)');
    }

    const credentials = btoa(`${authUser}:${authPass}`);
    const finalUrl = requestUrl;

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
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

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length') || '';
    const rawBody = await response.text();

    let data: any = null;
    if (rawBody && rawBody.trim().length > 0) {
      try {
        data = JSON.parse(rawBody);
      } catch (parseErr) {
        console.warn('⚠️ n8n respondió con texto no-JSON. Intentando continuar.', { parseErr, preview: rawBody.slice(0, 500) });
      }
    } else {
      console.warn('⚠️ n8n devolvió 200 OK sin cuerpo.', { contentType, contentLength });
    }

    console.log('✅ Respuesta de n8n recibida:', {
      success: data?.success,
      hasImageUrl: !!(data?.image_url || data?.imageUrl || data?.url),
      responseKeys: data ? Object.keys(data) : [],
      contentType,
      contentLength,
    });

    if (data && data.success === false) {
      console.error('❌ Error en la respuesta de n8n:', data.error);
      throw new Error(data.error || 'Error en el webhook de n8n');
    }

    // Extraer URL de imagen
    let imageUrl: string | null =
      (data && (data.image_url || data.imageUrl || data.url)) || null;

    if (!imageUrl && rawBody) {
      const match = rawBody.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|webp)/i);
      if (match) imageUrl = match[0];
    }

    if (!imageUrl) {
      console.error('❌ No se recibió URL de imagen de n8n.', {
        status: response.status,
        contentType,
        contentLength,
        bodyPreview: rawBody?.slice(0, 500) || '',
      });
      throw new Error('n8n devolvió una respuesta vacía o sin URL de imagen');
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