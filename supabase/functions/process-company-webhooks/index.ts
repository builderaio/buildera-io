import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

// Función para procesar la respuesta del webhook n8n
const processWebhookResponse = async (supabase: any, userId: string, webhookData: any[]) => {
  try {
    console.log('🔍 Procesando respuesta del webhook n8n:', webhookData);
    
    // Buscar la empresa del usuario
    const { data: companyMember, error: memberError } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();
    
    if (memberError || !companyMember) {
      console.error('❌ Error encontrando empresa del usuario:', memberError);
      return;
    }

    // Procesar la respuesta del webhook
    const webhookResponse = webhookData[0]?.response || [];
    const updateData: any = {
      webhook_data: webhookData,
      webhook_processed_at: new Date().toISOString()
    };

    // Mapear los campos de la respuesta a la nueva estructura
    webhookResponse.forEach((item: any) => {
      switch (item.key) {
        case 'descripcion_empresa':
          updateData.description = item.value;
          break;
        case 'industria_principal':
          updateData.industry_sector = item.value;
          break;
        case 'facebook':
          updateData.facebook_url = item.value !== 'No tiene' ? item.value : null;
          break;
        case 'twitter':
          updateData.twitter_url = item.value !== 'No tiene' ? item.value : null;
          break;
        case 'linkedin':
          updateData.linkedin_url = item.value !== 'No tiene' ? item.value : null;
          break;
        case 'instagram':
          updateData.instagram_url = item.value !== 'No tiene' ? item.value : null;
          break;
      }
    });

    // Actualizar la empresa con los datos del webhook
    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyMember.company_id);

    if (updateError) {
      console.error('❌ Error actualizando empresa con datos del webhook:', updateError);
    } else {
      console.log('✅ Empresa actualizada con datos del webhook');
      console.log('📊 Datos guardados:', updateData);
    }

  } catch (error) {
    console.error('💥 Error procesando respuesta del webhook:', error);
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookProcessRequest {
  user_id: string;
  company_name: string;
  website_url?: string;
  country?: string;
  trigger_type: 'registration' | 'update';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando procesamiento de webhooks de empresa');
    
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
    const body: WebhookProcessRequest = await req.json();
    console.log('📋 Procesando webhooks para:', { 
      user_id: body.user_id,
      company_name: body.company_name,
      website_url: body.website_url ? 'present' : 'missing',
      country: body.country || 'not provided',
      trigger_type: body.trigger_type
    });

    // Validate required parameters
    if (!body.user_id || !body.company_name) {
      console.log('❌ Faltan parámetros requeridos');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters. user_id and company_name are required.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Define background task for webhook processing
    const processWebhooks = async () => {
      console.log('🔄 Iniciando procesamiento en background...');
      
      try {
        // Si hay website_url, procesar los webhooks
        if (body.website_url && body.website_url.trim() !== '') {
          console.log('🌐 Procesando webhooks para URL:', body.website_url);
          
          // Llamar a get-data-by-url
          console.log('📊 Llamando a get-data-by-url...');
          const dataResponse = await supabase.functions.invoke('get-data-by-url', {
            body: { 
              url: body.website_url,
              user_id: body.user_id 
            }
          });
          
          if (dataResponse.error) {
            console.error('❌ Error en get-data-by-url:', dataResponse.error);
          } else {
            console.log('✅ get-data-by-url completado');
          }
          
          // Llamar a get-brand-by-url
          console.log('🎨 Llamando a get-brand-by-url...');
          const brandResponse = await supabase.functions.invoke('get-brand-by-url', {
            body: { 
              url: body.website_url,
              user_id: body.user_id 
            }
          });
          
          if (brandResponse.error) {
            console.error('❌ Error en get-brand-by-url:', brandResponse.error);
          } else {
            console.log('✅ get-brand-by-url completado');
          }
          
          // Llamar a n8n webhook
          console.log('🔗 Llamando a n8n webhook...');
          const n8nResponse = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
            body: {
              KEY: "INFO",
              COMPANY_INFO: `Empresa: ${body.company_name}, sitio web: ${body.website_url}${body.country ? `, país: ${body.country}` : ''}`,
              ADDITIONAL_INFO: body.trigger_type === 'registration' ? 'Nuevo registro' : 'Actualización'
            }
          });
          
          if (n8nResponse.error) {
            console.error('❌ Error en n8n webhook:', n8nResponse.error);
          } else {
            console.log('✅ n8n webhook completado');
            
            // Procesar y almacenar la respuesta del webhook
            if (n8nResponse.data) {
              console.log('📊 Procesando respuesta del webhook n8n:', n8nResponse.data);
              // La respuesta viene en n8nResponse.data.data según la estructura de call-n8n-mybusiness-webhook
              const webhookData = n8nResponse.data.data || n8nResponse.data;
              if (webhookData && Array.isArray(webhookData) && webhookData.length > 0) {
                await processWebhookResponse(supabase, body.user_id, webhookData);
              } else {
                console.log('⚠️ No hay datos válidos en la respuesta del webhook:', webhookData);
              }
            } else {
              console.log('⚠️ No hay datos en la respuesta del webhook');
            }
          }
        } else {
          console.log('⚠️ No hay website_url, solo llamando a n8n webhook...');
          
          // Solo llamar a n8n webhook sin URL
          const n8nResponse = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
            body: {
              KEY: "INFO",
              COMPANY_INFO: `Empresa: ${body.company_name}${body.country ? `, país: ${body.country}` : ''}`,
              ADDITIONAL_INFO: body.trigger_type === 'registration' ? 'Nuevo registro sin sitio web' : 'Actualización'
            }
          });
          
          if (n8nResponse.error) {
            console.error('❌ Error en n8n webhook:', n8nResponse.error);
          } else {
            console.log('✅ n8n webhook completado');
            
            // Procesar y almacenar la respuesta del webhook incluso sin URL
            if (n8nResponse.data) {
              console.log('📊 Procesando respuesta del webhook n8n (sin URL):', n8nResponse.data);
              // La respuesta viene en n8nResponse.data.data según la estructura de call-n8n-mybusiness-webhook
              const webhookData = n8nResponse.data.data || n8nResponse.data;
              if (webhookData && Array.isArray(webhookData) && webhookData.length > 0) {
                await processWebhookResponse(supabase, body.user_id, webhookData);
              } else {
                console.log('⚠️ No hay datos válidos en la respuesta del webhook (sin URL):', webhookData);
              }
            } else {
              console.log('⚠️ No hay datos en la respuesta del webhook (sin URL)');
            }
          }
        }
        
        console.log('✅ Procesamiento de webhooks completado exitosamente');
      } catch (error) {
        console.error('💥 Error durante el procesamiento de webhooks:', error);
      }
    };

    // Start background task without awaiting
    EdgeRuntime.waitUntil(processWebhooks());
    
    // Return immediate response
    console.log('✅ Webhooks iniciados en background');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Webhook processing started in background',
        user_id: body.user_id,
        company_name: body.company_name
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

// Handle shutdown gracefully
addEventListener('beforeunload', (ev) => {
  console.log('🔌 Function shutdown due to:', ev.detail?.reason);
});

serve(handler);