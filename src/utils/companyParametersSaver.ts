import { supabase } from '@/integrations/supabase/client';

export type ParameterCategory = 'strategy' | 'content' | 'audience' | 'branding' | 'analytics' | 'competitive';

export interface ParameterMapping {
  category: ParameterCategory;
  key: string;
}

// Standard parameter mappings: maps output keys from agents to standardized parameter keys
export const PARAMETER_MAPPINGS: Record<string, ParameterMapping> = {
  // Strategy parameters
  posicionamiento: { category: 'strategy', key: 'posicionamiento' },
  positioning: { category: 'strategy', key: 'posicionamiento' },
  audiencia_principal: { category: 'strategy', key: 'audiencia_principal' },
  target_audience: { category: 'strategy', key: 'audiencia_principal' },
  pilares_contenido: { category: 'strategy', key: 'pilares_contenido' },
  content_pillars: { category: 'strategy', key: 'pilares_contenido' },
  tono_comunicacion: { category: 'strategy', key: 'tono_comunicacion' },
  communication_tone: { category: 'strategy', key: 'tono_comunicacion' },
  canales_prioritarios: { category: 'strategy', key: 'canales_prioritarios' },
  priority_channels: { category: 'strategy', key: 'canales_prioritarios' },
  mision: { category: 'strategy', key: 'mision' },
  mission: { category: 'strategy', key: 'mision' },
  vision: { category: 'strategy', key: 'vision' },
  propuesta_valor: { category: 'strategy', key: 'propuesta_valor' },
  value_proposition: { category: 'strategy', key: 'propuesta_valor' },
  objetivos_negocio: { category: 'strategy', key: 'objetivos_negocio' },
  business_objectives: { category: 'strategy', key: 'objetivos_negocio' },

  // Content parameters
  top_performing_posts: { category: 'content', key: 'top_performing_posts' },
  content_themes: { category: 'content', key: 'content_themes' },
  optimal_posting_times: { category: 'content', key: 'optimal_posting_times' },
  calendario_contenido: { category: 'content', key: 'calendario_contenido' },
  content_calendar: { category: 'content', key: 'calendario_contenido' },
  posts_generados: { category: 'content', key: 'posts_generados' },
  generated_posts: { category: 'content', key: 'posts_generados' },

  // Audience parameters
  segments: { category: 'audience', key: 'segments' },
  segmentos: { category: 'audience', key: 'segments' },
  engagement_patterns: { category: 'audience', key: 'engagement_patterns' },
  patrones_engagement: { category: 'audience', key: 'engagement_patterns' },
  demographics: { category: 'audience', key: 'demographics' },
  demograficos: { category: 'audience', key: 'demographics' },

  // Branding parameters
  brand_voice: { category: 'branding', key: 'brand_voice' },
  voz_marca: { category: 'branding', key: 'brand_voice' },
  visual_identity: { category: 'branding', key: 'visual_identity' },
  identidad_visual: { category: 'branding', key: 'visual_identity' },
  color_palette: { category: 'branding', key: 'color_palette' },
  paleta_colores: { category: 'branding', key: 'color_palette' },

  // Analytics parameters
  industry_trends: { category: 'analytics', key: 'industry_trends' },
  tendencias_industria: { category: 'analytics', key: 'industry_trends' },
  growth_opportunities: { category: 'analytics', key: 'growth_opportunities' },
  oportunidades_crecimiento: { category: 'analytics', key: 'growth_opportunities' },
  performance_metrics: { category: 'analytics', key: 'performance_metrics' },
  metricas_rendimiento: { category: 'analytics', key: 'performance_metrics' },
  insights: { category: 'analytics', key: 'insights' },

  // Competitive parameters
  competitor_analysis: { category: 'competitive', key: 'competitor_analysis' },
  analisis_competencia: { category: 'competitive', key: 'competitor_analysis' },
  market_position: { category: 'competitive', key: 'market_position' },
  posicion_mercado: { category: 'competitive', key: 'market_position' },
};

/**
 * Saves agent outputs as company parameters for reuse by other agents
 */
export async function saveAgentParameters(
  companyId: string,
  agentCode: string,
  executionId: string | null,
  outputs: Record<string, any>,
  userId?: string
): Promise<{ success: boolean; saved: string[]; errors: string[] }> {
  const saved: string[] = [];
  const errors: string[] = [];

  for (const [outputKey, value] of Object.entries(outputs)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    const mapping = PARAMETER_MAPPINGS[outputKey];
    if (!mapping) continue;

    try {
      // Mark previous parameters as not current
      await supabase
        .from('company_parameters')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('parameter_key', mapping.key)
        .eq('is_current', true);

      // Get current max version
      const { data: versionData } = await supabase
        .from('company_parameters')
        .select('version')
        .eq('company_id', companyId)
        .eq('parameter_key', mapping.key)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = (versionData?.[0]?.version || 0) + 1;

      // Insert new parameter
      const { error: insertError } = await supabase
        .from('company_parameters')
        .insert({
          company_id: companyId,
          category: mapping.category,
          parameter_key: mapping.key,
          parameter_value: value,
          source_agent_code: agentCode,
          source_execution_id: executionId,
          version: nextVersion,
          is_current: true,
          created_by: userId || null,
        });

      if (insertError) {
        console.error(`Error saving parameter ${mapping.key}:`, insertError);
        errors.push(`${mapping.key}: ${insertError.message}`);
      } else {
        saved.push(mapping.key);
        console.log(`✅ Saved parameter: ${mapping.key} from agent ${agentCode}`);
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error(`Error processing parameter ${outputKey}:`, err);
      errors.push(`${outputKey}: ${errorMsg}`);
    }
  }

  return { success: errors.length === 0, saved, errors };
}

/**
 * Get all current parameters for a company as a flat object for agent payloads
 */
export async function getCompanyParametersForPayload(
  companyId: string
): Promise<Record<string, Record<string, any>>> {
  const { data, error } = await supabase
    .from('company_parameters')
    .select('category, parameter_key, parameter_value')
    .eq('company_id', companyId)
    .eq('is_current', true);

  if (error) {
    console.error('Error fetching company parameters:', error);
    return {};
  }

  const params: Record<string, Record<string, any>> = {
    strategy: {},
    content: {},
    audience: {},
    branding: {},
    analytics: {},
    competitive: {},
  };

  (data || []).forEach((p: any) => {
    if (params[p.category]) {
      params[p.category][p.parameter_key] = p.parameter_value;
    }
  });

  return params;
}
