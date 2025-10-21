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

  if (!campaignData.audiences || campaignData.audiences.length === 0) {
    throw new Error('Debes definir al menos una audiencia objetivo');
  }

  // Preparar payload mínimo
  const payload = {
    retrieve_existing: retrieveExisting,
    input: {
      nombre_empresa: campaignData.company.nombre_empresa || campaignData.company.name,
      objetivo_de_negocio: campaignData.company.value_proposition || 
                           campaignData.company.description || 
                           campaignData.description,
      nombre_campana: campaignData.name,
      objetivo_campana: campaignData.objective,
      descripcion_campana: campaignData.description,
      audiencias: campaignData.audiences
    }
  };

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

  // Normalizar y retornar
  return normalizeStrategy(data);
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
