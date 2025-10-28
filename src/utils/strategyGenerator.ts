import { supabase } from '@/integrations/supabase/client';
import { normalizeStrategy } from './strategyNormalizer';
import type { MarketingStrategy } from '@/types/strategy';

interface GenerateStrategyParams {
  campaignData: any;
  retrieveExisting?: boolean;
}

/**
 * Genera o recupera una estrategia de marketing
 */
export async function generateStrategy({ 
  campaignData, 
  retrieveExisting = false 
}: GenerateStrategyParams): Promise<MarketingStrategy> {
  
  // Validar datos requeridos
  if (!campaignData.company) {
    throw new Error('Datos de empresa requeridos');
  }

  // Compatibilidad: aceptar audiencia única o arreglo y diferentes estructuras
  const selectedAudience = campaignData.audience?.selected_audience || campaignData.audience;
  const rawAudiences = campaignData.audiences ?? selectedAudience;

  // Normalizar audiencias a arreglo (acepta objeto único)
  const audiencesArray = Array.isArray(rawAudiences)
    ? rawAudiences
    : rawAudiences
      ? [rawAudiences]
      : [];

  if (audiencesArray.length === 0) {
    throw new Error('Debes definir al menos una audiencia objetivo');
  }

  // Preparar payload con datos completos y limpios
  const objectiveText = typeof campaignData.objective === 'string'
    ? campaignData.objective
    : campaignData.objective?.description || campaignData.objective?.label || campaignData.objective?.name || '';

  // Limpiar audiencias - solo enviar campos relevantes
  const cleanedAudiences = audiencesArray.map(audience => ({
    name: audience.name || 'Audiencia',
    description: audience.description || '',
    demographics: audience.demographics || {},
    psychographics: audience.psychographics || {},
    pain_points: audience.pain_points || [],
    goals: audience.goals || [],
    preferred_channels: audience.preferred_channels || [],
    content_preferences: audience.content_preferences || {}
  }));

  console.log('📊 [strategyGenerator] Campaign data:', {
    hasCompany: !!campaignData.company,
    companyKeys: campaignData.company ? Object.keys(campaignData.company) : [],
    audiencesCount: cleanedAudiences.length
  });

  const payload = {
    retrieve_existing: retrieveExisting,
    input: {
      nombre_empresa: campaignData.company?.nombre_empresa || campaignData.company?.name || 'Mi Empresa',
      objetivo_de_negocio: campaignData.company?.description || '',
      propuesta_valor: campaignData.company?.value_proposition || campaignData.company?.propuesta_valor || '',
      sitio_web: campaignData.company?.website || campaignData.company?.sitio_web || campaignData.company?.website_url || '',
      nombre_campana: campaignData.name || 'Nueva Campaña',
      objetivo_campana: objectiveText,
      descripcion_campana: campaignData.description || '',
      audiencias: cleanedAudiences
    }
  };

  console.log('📤 [strategyGenerator] Payload to send:', JSON.stringify(payload, null, 2));

  // Llamar a la edge function
  const { data, error } = await supabase.functions.invoke('marketing-hub-marketing-strategy', {
    body: payload
  });

  if (error) {
    console.error('Error generando estrategia:', error);
    throw new Error(error.message || 'Error al generar la estrategia');
  }

  if (!data) {
    throw new Error('No se recibió respuesta del servidor');
  }

  const requestId = (data as any).request_id || (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  console.groupCollapsed(`[Strategy][${requestId}] Backend response`);
  console.log('📥 Received data from backend:', {
    hasStrategy: !!data.strategy,
    hasStrategyId: !!data.strategy_id,
    cached: data.cached,
    dataKeys: Object.keys(data)
  });
  console.groupEnd();

  // Normalizar y retornar
  const normalized = normalizeStrategy(data);
  const enriched: MarketingStrategy = {
    ...normalized,
    full_strategy_data: {
      ...normalized.full_strategy_data,
      request_id: requestId,
    },
  } as MarketingStrategy;

  console.groupCollapsed(`[Strategy][${requestId}] Normalized`);
  console.log('✅ Strategy normalized:', {
    hasCoreMessage: !!enriched.core_message,
    hasCompetitors: !!enriched.competitors?.length,
    hasStrategies: !!Object.keys(enriched.strategies || {}).length
  });
  console.groupEnd();
  
  return enriched;
}

/**
 * Carga una estrategia existente desde la base de datos
 */
export async function loadExistingStrategy(
  campaignData: any
): Promise<MarketingStrategy | null> {
  try {
    const result = await generateStrategy({ 
      campaignData, 
      retrieveExisting: true 
    });
    return result;
  } catch (error) {
    console.error('Error cargando estrategia existente:', error);
    return null;
  }
}
