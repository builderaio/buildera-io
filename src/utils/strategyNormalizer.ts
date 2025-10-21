import type { MarketingStrategy } from '@/types/strategy';

/**
 * Normaliza la respuesta de la estrategia de marketing a un formato consistente
 * Solo soporta el formato actual de N8N
 */
export function normalizeStrategy(rawData: any): MarketingStrategy {
  if (!rawData) {
    throw new Error('No se recibieron datos de estrategia');
  }

  // Extraer estrategia desde diferentes ubicaciones posibles
  const strategyData = rawData.strategy || rawData.full_strategy_data || rawData;

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
