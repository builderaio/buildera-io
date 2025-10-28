import type { MarketingStrategy } from '@/types/strategy';

/**
 * Normaliza la respuesta de la estrategia de marketing a un formato consistente
 * Solo soporta el formato actual de N8N
 */
export function normalizeStrategy(rawData: any): MarketingStrategy {
  if (!rawData) {
    throw new Error('No se recibieron datos de estrategia');
  }

  // Log inicial de la estructura recibida
  console.log('🔍 [normalizeStrategy] Raw data structure:', {
    topLevelKeys: Object.keys(rawData),
    hasStrategy: !!rawData.strategy,
    hasFullStrategyData: !!rawData.full_strategy_data,
    strategyKeys: rawData.strategy ? Object.keys(rawData.strategy) : [],
    fullDataKeys: rawData.full_strategy_data ? Object.keys(rawData.full_strategy_data) : []
  });

  // Extraer estrategia desde diferentes ubicaciones posibles
  const strategyData = rawData.strategy || rawData.full_strategy_data || rawData;

  // Extraer ai_insights con soporte para múltiples formatos
  let aiInsights: any = strategyData.ai_insights || strategyData.insights || null;
  
  // Normalizar ai_insights según su tipo
  if (aiInsights) {
    console.log('✅ [normalizeStrategy] AI Insights found:', {
      type: typeof aiInsights,
      isArray: Array.isArray(aiInsights),
      keysOrLength: Array.isArray(aiInsights) ? aiInsights.length : (typeof aiInsights === 'object' ? Object.keys(aiInsights) : 'N/A')
    });
  } else {
    console.warn('⚠️ [normalizeStrategy] AI Insights NOT found in strategy data');
  }

  // Log de campos críticos
  const criticalFields = {
    core_message: !!strategyData.core_message || !!strategyData.mensaje_diferenciador,
    differentiated_message: !!strategyData.differentiated_message || !!strategyData.variantes_mensaje,
    competitors: !!(strategyData.competitors || strategyData.competidores),
    strategies: !!strategyData.strategies,
    ai_insights: !!aiInsights
  };

  console.log('📊 [normalizeStrategy] Critical fields presence:', criticalFields);

  const missingFields = Object.entries(criticalFields)
    .filter(([_, present]) => !present)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    console.warn('⚠️ [normalizeStrategy] Missing important fields:', missingFields);
  }

  return {
    core_message: strategyData.core_message || strategyData.mensaje_diferenciador || '',
    differentiated_message: strategyData.differentiated_message || strategyData.variantes_mensaje || {},
    message_variants: strategyData.message_variants || {},
    competitors: normalizeCompetitors(strategyData.competitors || strategyData.competidores || []),
    strategies: normalizeStrategies(strategyData.strategies || {}),
    funnel_strategies: strategyData.funnel_strategies || strategyData.estrategias_funnel || [],
    content_plan: strategyData.content_plan || strategyData.plan_contenido || {},
    kpis: strategyData.kpis || strategyData.indicadores || [],
    execution_plan: strategyData.execution_plan || strategyData.plan_ejecucion || [],
    risks: strategyData.risks || strategyData.riesgos || [],
    assumptions: strategyData.assumptions || strategyData.supuestos || [],
    sources: strategyData.sources || strategyData.fuentes || [],
    ai_insights: aiInsights,
    full_strategy_data: rawData
  };
}

function normalizeCompetitors(competitors: any[]): any[] {
  if (!Array.isArray(competitors)) return [];
  
  return competitors.map(comp => ({
    name: comp.name || comp.nombre || '',
    strengths: comp.strengths || comp.fortalezas || [],
    weaknesses: comp.weaknesses || comp.debilidades || [],
    digital_tactics: comp.digital_tactics || comp.tacticas_digitales || [],
    benchmarks: comp.benchmarks || comp.metricas || {}
  }));
}

function normalizeStrategies(strategies: any): Record<string, any> {
  if (!strategies || typeof strategies !== 'object') return {};
  
  const normalized: Record<string, any> = {};
  
  Object.entries(strategies).forEach(([phase, details]: [string, any]) => {
    normalized[phase] = {
      objective: details.objective || details.objetivo || '',
      main_channel: details.main_channel || details.canal_principal || '',
      main_kpi: details.main_kpi || details.kpi_principal || '',
      tactics: details.tactics || details.tacticas || [],
      moonshot_tactics: details.moonshot_tactics || details.tacticas_moonshot || []
    };
  });
  
  return normalized;
}
