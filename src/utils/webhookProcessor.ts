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

// Función para ejecutar webhooks de empresa según el contexto
export const executeCompanyWebhooks = async (
  userId: string, 
  companyName: string, 
  websiteUrl?: string, 
  country?: string, 
  triggerType: 'registration' | 'update' | 'first_save_social' | 'first_visit' = 'update'
) => {
  console.log('🚀 Ejecutando webhook INFO para empresa:', {
    companyName,
    triggerType,
    context: triggerType === 'registration' ? 'Registro de usuario' : 
             triggerType === 'first_save_social' ? 'Primera configuración social' : 
             triggerType === 'first_visit' ? 'Primera visita al ADN' : 'Actualización'
  });

  try {
    // Solo ejecutar webhook INFO - los webhooks STRATEGY y BRAND se ejecutan en sus contextos específicos
    const companyInfo = `Empresa: ${companyName}${websiteUrl ? `, sitio web: ${websiteUrl}` : ''}${country ? `, país: ${country}` : ''}`;
    const additionalInfo = triggerType === 'registration' ? 'Nuevo registro' : 
                          triggerType === 'first_save_social' ? 'Primer guardado social' : 
                          triggerType === 'first_visit' ? 'Primera visita ADN' : 'Actualización';

    const response = await supabase.functions.invoke('call-n8n-mybusiness-webhook', {
      body: {
        KEY: "INFO",
        COMPANY_INFO: companyInfo,
        ADDITIONAL_INFO: additionalInfo
      }
    });

    const webhookResult = {
      name: 'call-n8n-mybusiness-webhook-INFO',
      success: !response.error,
      error: response.error,
      data: response.data
    };

    // Procesar respuesta del webhook INFO si fue exitoso
    if (webhookResult.success && webhookResult.data?.data) {
      console.log('📊 Procesando respuesta del webhook INFO...');
      const webhookData = Array.isArray(webhookResult.data.data) ? webhookResult.data.data : [webhookResult.data.data];
      
      if (webhookData.length > 0) {
        const processed = await processWebhookResponse(userId, webhookData);
        if (processed) {
          console.log('✅ Datos del webhook INFO procesados correctamente');
        }
      }
    }

    console.log('🏁 Webhook INFO completado');
    return {
      success: webhookResult.success,
      results: [webhookResult]
    };

  } catch (error) {
    console.error('💥 Error ejecutando webhooks de empresa:', error);
    return {
      success: false,
      error: error
    };
  }
};