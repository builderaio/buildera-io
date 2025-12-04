import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentResult {
  agent_code: string;
  success: boolean;
  data: any;
  execution_time_ms: number;
  error?: string;
}

interface CompanyContext {
  id: string;
  name: string;
  description?: string;
  website_url?: string;
  industry_sector?: string;
  propuesta_valor?: string;
  objetivos?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { user_id, company_id, language = 'es' } = await req.json();

    if (!user_id || !company_id) {
      throw new Error('user_id y company_id son requeridos');
    }

    console.log('🚀 Iniciando orquestación de agentes de onboarding WOW', { user_id, company_id });

    // 1. Obtener contexto completo de la empresa
    const companyContext = await getCompanyContext(company_id);
    console.log('📊 Contexto de empresa obtenido:', companyContext.name);

    // 2. Obtener agentes de onboarding
    const { data: onboardingAgents, error: agentsError } = await supabase
      .from('platform_agents')
      .select('*')
      .eq('is_onboarding_agent', true)
      .eq('is_active', true)
      .order('sort_order');

    if (agentsError) throw agentsError;

    console.log(`🤖 ${onboardingAgents?.length || 0} agentes de onboarding encontrados`);

    // 3. Ejecutar los 3 agentes en paralelo
    const agentPromises = (onboardingAgents || []).map(agent => 
      executeAgent(agent, companyContext, user_id, language)
    );

    const agentResults = await Promise.allSettled(agentPromises);
    
    // 4. Procesar resultados
    const results: AgentResult[] = agentResults.map((result, index) => {
      const agent = onboardingAgents![index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          agent_code: agent.internal_code,
          success: false,
          data: null,
          execution_time_ms: 0,
          error: result.reason?.message || 'Error desconocido'
        };
      }
    });

    const successfulResults = results.filter(r => r.success);
    const totalExecutionTime = Date.now() - startTime;

    console.log(`✅ Orquestación completada: ${successfulResults.length}/${results.length} agentes exitosos en ${totalExecutionTime}ms`);

    // 5. Guardar resultados WOW en la base de datos
    const strategyResult = results.find(r => r.agent_code === 'MKTG_STRATEGIST')?.data;
    const contentResult = results.find(r => r.agent_code === 'CONTENT_CREATOR')?.data;
    const insightsResult = results.find(r => r.agent_code === 'INSIGHTS_GENERATOR')?.data;

    await supabase.from('onboarding_wow_results').insert({
      user_id,
      company_id,
      strategy_result: strategyResult,
      content_result: contentResult,
      insights_result: insightsResult,
      total_execution_time_ms: totalExecutionTime,
      agents_executed: results.map(r => r.agent_code)
    });

    // 6. Habilitar automáticamente los agentes base para la empresa
    const starterAgents = onboardingAgents?.filter(a => a.min_plan_required === 'starter') || [];
    for (const agent of starterAgents) {
      await supabase.from('company_enabled_agents').upsert({
        company_id,
        agent_id: agent.id,
        enabled_by: user_id
      }, { onConflict: 'company_id,agent_id' });
    }

    // 7. Registrar uso de agentes
    for (const result of results) {
      const agent = onboardingAgents?.find(a => a.internal_code === result.agent_code);
      if (agent && result.success) {
        await supabase.from('agent_usage_log').insert({
          user_id,
          company_id,
          agent_id: agent.id,
          credits_consumed: agent.credits_per_use,
          output_summary: `Onboarding WOW - ${agent.name}`,
          execution_time_ms: result.execution_time_ms,
          status: 'completed'
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_execution_time_ms: totalExecutionTime,
      agents_executed: results.length,
      agents_successful: successfulResults.length,
      results: {
        strategy: strategyResult,
        content: contentResult,
        insights: insightsResult
      },
      summary: generateWowSummary(strategyResult, contentResult, insightsResult, language)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error en orquestación:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getCompanyContext(companyId: string): Promise<CompanyContext> {
  // Obtener datos de la empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError) throw companyError;

  // Obtener estrategia si existe
  const { data: strategy } = await supabase
    .from('company_strategy')
    .select('propuesta_valor, tono_comunicacion, pilares_contenido')
    .eq('company_id', companyId)
    .single();

  // Obtener objetivos
  const { data: objectives } = await supabase
    .from('company_objectives')
    .select('objective_text')
    .eq('company_id', companyId);

  return {
    id: company.id,
    name: company.name,
    description: company.description,
    website_url: company.website_url,
    industry_sector: company.industry_sector,
    propuesta_valor: strategy?.propuesta_valor,
    objetivos: objectives?.map(o => o.objective_text) || []
  };
}

async function executeAgent(
  agent: any, 
  context: CompanyContext, 
  userId: string,
  language: string
): Promise<AgentResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Ejecutando agente: ${agent.internal_code}`);

    let result: any;

    switch (agent.internal_code) {
      case 'MKTG_STRATEGIST':
        result = await executeStrategyAgent(context, language);
        break;
      case 'CONTENT_CREATOR':
        result = await executeContentAgent(context, language);
        break;
      case 'INSIGHTS_GENERATOR':
        result = await executeInsightsAgent(context, language);
        break;
      default:
        throw new Error(`Agente no soportado: ${agent.internal_code}`);
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ Agente ${agent.internal_code} completado en ${executionTime}ms`);

    return {
      agent_code: agent.internal_code,
      success: true,
      data: result,
      execution_time_ms: executionTime
    };

  } catch (error) {
    console.error(`❌ Error en agente ${agent.internal_code}:`, error);
    return {
      agent_code: agent.internal_code,
      success: false,
      data: null,
      execution_time_ms: Date.now() - startTime,
      error: (error as Error).message
    };
  }
}

async function executeStrategyAgent(context: CompanyContext, language: string) {
  const langPrompts: Record<string, string> = {
    es: 'Responde en español',
    en: 'Respond in English',
    pt: 'Responda em português'
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un estratega de marketing digital experto. ${langPrompts[language] || langPrompts.es}. 
          Genera estrategias concisas y accionables basadas en el contexto de la empresa.`
        },
        {
          role: 'user',
          content: `Genera una estrategia de marketing para esta empresa:
          
Nombre: ${context.name}
Descripción: ${context.description || 'No disponible'}
Sector: ${context.industry_sector || 'No especificado'}
Web: ${context.website_url || 'No disponible'}
Propuesta de valor: ${context.propuesta_valor || 'Por definir'}
Objetivos: ${context.objetivos?.join(', ') || 'No definidos'}

Genera un JSON con:
{
  "posicionamiento": "breve declaración de posicionamiento",
  "audiencia_principal": "descripción del público objetivo ideal",
  "pilares_contenido": ["pilar1", "pilar2", "pilar3"],
  "tono_comunicacion": "descripción del tono recomendado",
  "canales_prioritarios": ["canal1", "canal2"],
  "estrategia_diferenciadora": "qué hace única a esta marca",
  "quick_wins": ["acción rápida 1", "acción rápida 2", "acción rápida 3"]
}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function executeContentAgent(context: CompanyContext, language: string) {
  const langPrompts: Record<string, string> = {
    es: 'Responde en español',
    en: 'Respond in English',
    pt: 'Responda em português'
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un creador de contenido para redes sociales experto. ${langPrompts[language] || langPrompts.es}.
          Genera contenido atractivo y profesional adaptado a cada plataforma.`
        },
        {
          role: 'user',
          content: `Crea 3 posts de ejemplo para esta empresa:
          
Nombre: ${context.name}
Descripción: ${context.description || 'No disponible'}
Sector: ${context.industry_sector || 'No especificado'}
Propuesta de valor: ${context.propuesta_valor || 'Por definir'}

Genera un JSON con:
{
  "posts": [
    {
      "platform": "instagram",
      "type": "carrusel",
      "copy": "texto del post con hashtags",
      "visual_suggestion": "descripción de la imagen/carrusel sugerido",
      "best_time": "mejor momento para publicar"
    },
    {
      "platform": "linkedin",
      "type": "texto",
      "copy": "texto del post profesional",
      "visual_suggestion": "descripción de imagen sugerida",
      "best_time": "mejor momento para publicar"
    },
    {
      "platform": "facebook",
      "type": "imagen",
      "copy": "texto del post con CTA",
      "visual_suggestion": "descripción de imagen sugerida",
      "best_time": "mejor momento para publicar"
    }
  ],
  "content_calendar_suggestion": "resumen de frecuencia recomendada por plataforma"
}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function executeInsightsAgent(context: CompanyContext, language: string) {
  const langPrompts: Record<string, string> = {
    es: 'Responde en español',
    en: 'Respond in English',
    pt: 'Responda em português'
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un analista de marketing digital experto. ${langPrompts[language] || langPrompts.es}.
          Genera insights accionables y recomendaciones basadas en el análisis del negocio.`
        },
        {
          role: 'user',
          content: `Genera insights de marketing para esta empresa:
          
Nombre: ${context.name}
Descripción: ${context.description || 'No disponible'}
Sector: ${context.industry_sector || 'No especificado'}
Web: ${context.website_url || 'No disponible'}
Objetivos: ${context.objetivos?.join(', ') || 'No definidos'}

Genera un JSON con:
{
  "insights": [
    {
      "category": "oportunidad|mejora|tendencia|riesgo",
      "title": "título del insight",
      "description": "descripción detallada",
      "action": "acción recomendada",
      "priority": "alta|media|baja",
      "impact": "descripción del impacto esperado"
    }
  ],
  "industry_trends": ["tendencia1", "tendencia2"],
  "competitor_analysis_suggestion": "qué analizar de la competencia",
  "growth_opportunities": ["oportunidad1", "oportunidad2"]
}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

function generateWowSummary(
  strategy: any, 
  content: any, 
  insights: any,
  language: string
): any {
  const summaries: Record<string, any> = {
    es: {
      title: '🎉 ¡Tu estrategia de marketing está lista!',
      description: 'Hemos analizado tu empresa y generado una estrategia personalizada con 3 agentes de IA trabajando en paralelo.',
      highlights: [
        strategy?.posicionamiento ? `📍 Posicionamiento: ${strategy.posicionamiento}` : null,
        content?.posts?.length ? `📝 ${content.posts.length} posts de ejemplo listos` : null,
        insights?.insights?.length ? `💡 ${insights.insights.length} insights accionables` : null
      ].filter(Boolean)
    },
    en: {
      title: '🎉 Your marketing strategy is ready!',
      description: 'We analyzed your company and generated a personalized strategy with 3 AI agents working in parallel.',
      highlights: [
        strategy?.posicionamiento ? `📍 Positioning: ${strategy.posicionamiento}` : null,
        content?.posts?.length ? `📝 ${content.posts.length} example posts ready` : null,
        insights?.insights?.length ? `💡 ${insights.insights.length} actionable insights` : null
      ].filter(Boolean)
    },
    pt: {
      title: '🎉 Sua estratégia de marketing está pronta!',
      description: 'Analisamos sua empresa e geramos uma estratégia personalizada com 3 agentes de IA trabalhando em paralelo.',
      highlights: [
        strategy?.posicionamiento ? `📍 Posicionamento: ${strategy.posicionamiento}` : null,
        content?.posts?.length ? `📝 ${content.posts.length} posts de exemplo prontos` : null,
        insights?.insights?.length ? `💡 ${insights.insights.length} insights acionáveis` : null
      ].filter(Boolean)
    }
  };

  return summaries[language] || summaries.es;
}
