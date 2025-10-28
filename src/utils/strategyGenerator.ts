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

  // Limpiar audiencias - solo enviar campos relevantes (sin id, company_id, user_id)
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

  console.log('📊 [strategyGenerator] Campaign data validation:', {
    hasCompany: !!campaignData.company,
    companyKeys: campaignData.company ? Object.keys(campaignData.company) : [],
    audiencesCount: cleanedAudiences.length,
    criticalFieldsPreview: {
      nombre_empresa: campaignData.company?.name || campaignData.company?.nombre_empresa || 'MISSING',
      objetivo_negocio: campaignData.company?.description ? 'OK' : 'MISSING',
      propuesta_valor: campaignData.company?.propuesta_valor ? 'OK' : 'MISSING',
      sitio_web: campaignData.company?.website_url ? 'OK' : 'MISSING',
      sector_industria: campaignData.company?.industry_sector ? 'OK' : 'MISSING'
    }
  });

  // Construir payload con todos los campos críticos
  const payload = {
    retrieve_existing: retrieveExisting,
    input: {
      // Datos de empresa (múltiples variantes para compatibilidad)
      nombre_empresa: campaignData.company?.name || campaignData.company?.nombre_empresa || 'Mi Empresa',
      objetivo_de_negocio: campaignData.company?.description || campaignData.company?.objetivo_de_negocio || '',
      propuesta_valor: campaignData.company?.propuesta_valor || campaignData.company?.propuesta_de_valor || campaignData.company?.value_proposition || '',
      sitio_web: campaignData.company?.website_url || campaignData.company?.url_sitio_web || campaignData.company?.website || '',
      sector_industria: campaignData.company?.industry_sector || campaignData.company?.sector_industria || '',
      mision: campaignData.company?.mision || '',
      vision: campaignData.company?.vision || '',
      
      // Datos de campaña
      nombre_campana: campaignData.name || 'Nueva Campaña',
      objetivo_campana: objectiveText,
      descripcion_campana: campaignData.description || '',
      
      // Audiencias limpias
      audiencias: cleanedAudiences
    }
  };

  console.log('📤 [strategyGenerator] Payload being sent to backend:', {
    retrieve_existing: payload.retrieve_existing,
    nombre_empresa: payload.input.nombre_empresa,
    objetivo_de_negocio: payload.input.objetivo_de_negocio || 'EMPTY',
    propuesta_valor: payload.input.propuesta_valor || 'EMPTY',
    sitio_web: payload.input.sitio_web || 'EMPTY',
    sector_industria: payload.input.sector_industria || 'EMPTY',
    audiencias_count: payload.input.audiencias.length,
    full_payload: JSON.stringify(payload, null, 2)
  });

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
    dataKeys: Object.keys(data),
    strategyKeys: data.strategy ? Object.keys(data.strategy) : []
  });
  
  // Validar campos críticos en la respuesta
  const strategyData = data.strategy || data;
  const criticalFieldsCheck = {
    core_message: !!(strategyData.core_message || strategyData.mensaje_diferenciador),
    competitors: !!(strategyData.competitors || strategyData.competidores),
    ai_insights: !!(strategyData.ai_insights || strategyData.insights)
  };
  
  console.log('🔍 Critical fields validation:', criticalFieldsCheck);
  
  // Advertir sobre campos faltantes
  const missingCritical = Object.entries(criticalFieldsCheck)
    .filter(([_, present]) => !present)
    .map(([field]) => field);
  
  if (missingCritical.length > 0) {
    console.warn('⚠️ Missing critical fields from backend:', missingCritical);
  }
  
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
