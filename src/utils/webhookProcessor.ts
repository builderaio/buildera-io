import { supabase } from '@/integrations/supabase/client';

// Función para procesar respuesta del webhook y actualizar la empresa
export const processWebhookResponse = async (userId: string, webhookData: any[], companyId?: string) => {
  try {
    console.log('🔍 Procesando respuesta del webhook directamente:', webhookData);
    
    let targetCompanyId = companyId;
    
    // Si no se proporciona companyId, buscar la empresa del usuario
    if (!targetCompanyId) {
      const { data: companyMember, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (memberError || !companyMember) {
        console.error('❌ Error encontrando empresa del usuario:', memberError);
        return false;
      }
      
      targetCompanyId = companyMember.company_id;
    }

    // Procesar la respuesta del webhook
    const webhookResponse = webhookData[0]?.response || [];
    const updateData: any = {
      webhook_data: webhookData,
      webhook_processed_at: new Date().toISOString()
    };

    // Mapear los campos de la respuesta a la estructura de la base de datos
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
        case 'youtube':
          updateData.youtube_url = item.value !== 'No tiene' ? item.value : null;
          break;
        case 'tiktok':
          updateData.tiktok_url = item.value !== 'No tiene' ? item.value : null;
          break;
      }
    });

    // Actualizar la empresa con los datos del webhook
    const { error: updateError } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', targetCompanyId);

    if (updateError) {
      console.error('❌ Error actualizando empresa con datos del webhook:', updateError);
      return false;
    } else {
      console.log('✅ Empresa actualizada con datos del webhook');
      console.log('📊 Datos guardados:', updateData);
      return true;
    }

  } catch (error) {
    console.error('💥 Error procesando respuesta del webhook:', error);
    return false;
  }
};

// Función para ejecutar múltiples webhooks de empresa
export const executeCompanyWebhooks = async (
  userId: string, 
  companyName: string, 
  websiteUrl?: string, 
  country?: string, 
  triggerType: 'registration' | 'update' | 'first_save_social' = 'update'
) => {
  console.log('🚀 Ejecutando webhooks de empresa directamente:', {
    userId,
    companyName,
    websiteUrl: websiteUrl ? 'present' : 'missing',
    country,
    triggerType
  });

  try {
    const promises = [];

    // Si hay website_url, ejecutar todos los webhooks
    if (websiteUrl && websiteUrl.trim() !== '') {
      console.log('🌐 Ejecutando webhooks con URL:', websiteUrl);
      
      // get-data-by-url
      promises.push(
        supabase.functions.invoke('get-data-by-url', {
          body: { 
            url: websiteUrl,
            user_id: userId 
          }
        }).then(response => ({
          name: 'get-data-by-url',
          success: !response.error,
          error: response.error,
          data: response.data
        }))
      );
      
      // get-brand-by-url
      promises.push(
        supabase.functions.invoke('get-brand-by-url', {
          body: { 
            url: websiteUrl,
            user_id: userId 
          }
        }).then(response => ({
          name: 'get-brand-by-url',
          success: !response.error,
          error: response.error,
          data: response.data
        }))
      );
    }

    // call-n8n-mybusiness-webhook (siempre se ejecuta)
    const companyInfo = `Empresa: ${companyName}${websiteUrl ? `, sitio web: ${websiteUrl}` : ''}${country ? `, país: ${country}` : ''}`;
    const additionalInfo = triggerType === 'registration' ? 'Nuevo registro' : 
                          triggerType === 'first_save_social' ? 'Primer guardado social' : 'Actualización';

    promises.push(
      supabase.functions.invoke('call-n8n-mybusiness-webhook', {
        body: {
          KEY: "INFO",
          COMPANY_INFO: companyInfo,
          ADDITIONAL_INFO: additionalInfo
        }
      }).then(response => ({
        name: 'call-n8n-mybusiness-webhook',
        success: !response.error,
        error: response.error,
        data: response.data
      }))
    );

    // Ejecutar todos los webhooks en paralelo
    const results = await Promise.allSettled(promises);
    
    // Procesar resultados
    const webhookResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${result.value.name} completado exitosamente`);
        return result.value;
      } else {
        console.error(`❌ Error en webhook ${index}:`, result.reason);
        return { name: `webhook-${index}`, success: false, error: result.reason };
      }
    });

    // Buscar y procesar respuesta del webhook n8n
    const n8nResult = webhookResults.find(r => r.name === 'call-n8n-mybusiness-webhook');
    if (n8nResult?.success && n8nResult.data?.data) {
      console.log('📊 Procesando respuesta del webhook n8n...');
      const webhookData = Array.isArray(n8nResult.data.data) ? n8nResult.data.data : [n8nResult.data.data];
      
      if (webhookData.length > 0) {
        const processed = await processWebhookResponse(userId, webhookData);
        if (processed) {
          console.log('✅ Datos del webhook procesados correctamente');
        }
      }
    }

    console.log('🏁 Webhooks de empresa completados');
    return {
      success: true,
      results: webhookResults
    };

  } catch (error) {
    console.error('💥 Error ejecutando webhooks de empresa:', error);
    return {
      success: false,
      error: error
    };
  }
};