import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  id: string;
  name: string;
  description?: string;
  industry_sector?: string;
  website_url?: string;
  strategy?: {
    mision?: string;
    vision?: string;
    propuesta_valor?: string;
  };
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    visual_identity?: string;
  };
  objectives?: Array<{
    title: string;
    description: string;
    category: string;
  }>;
  socialData?: {
    linkedin_posts?: number;
    instagram_posts?: number;
    tiktok_posts?: number;
    sentiment_analysis?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, company_id } = await req.json();

    if (!user_id || !company_id) {
      return new Response(JSON.stringify({ 
        error: 'user_id y company_id son requeridos' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating company agent for:', { user_id, company_id });

    // Obtener datos completos de la empresa
    const companyData = await getCompanyData(company_id);
    
    // Crear o actualizar el agente de OpenAI
    const agent = await createOrUpdateOpenAIAgent(companyData);
    
    // Guardar la información del agente en la base de datos
    const { data: savedAgent, error: saveError } = await supabase
      .from('company_agents')
      .upsert({
        user_id,
        company_id,
        agent_id: agent.id,
        agent_name: `Copiloto de ${companyData.name}`,
        instructions: agent.instructions,
        tools: agent.tools,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Error saving agent: ${saveError.message}`);
    }

    console.log('Company agent created successfully:', savedAgent);

    return new Response(JSON.stringify({ 
      success: true,
      agent: savedAgent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating company agent:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al crear el agente empresarial',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getCompanyData(company_id: string): Promise<CompanyData> {
  // Obtener información básica de la empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  if (companyError) {
    throw new Error(`Error fetching company: ${companyError.message}`);
  }

  // Obtener estrategia empresarial
  const { data: strategy } = await supabase
    .from('company_strategy')
    .select('*')
    .eq('user_id', company.created_by)
    .single();

  // Obtener branding
  const { data: branding } = await supabase
    .from('company_branding')
    .select('*')
    .eq('user_id', company.created_by)
    .single();

  // Obtener objetivos
  const { data: objectives } = await supabase
    .from('company_objectives')
    .select('*')
    .eq('user_id', company.created_by);

  // Obtener datos de redes sociales
  const { data: socialStats } = await supabase
    .from('social_media_calendar')
    .select('platform, count(*) as posts_count, avg(engagement_rate) as avg_engagement')
    .eq('user_id', company.created_by)
    .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 días
    .group('platform');

  return {
    id: company.id,
    name: company.name,
    description: company.description || company.descripcion_empresa,
    industry_sector: company.industry_sector || company.industria_principal,
    website_url: company.website_url,
    strategy: strategy ? {
      mision: strategy.mision,
      vision: strategy.vision,
      propuesta_valor: strategy.propuesta_valor
    } : undefined,
    branding: branding ? {
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      visual_identity: branding.visual_identity
    } : undefined,
    objectives: objectives || [],
    socialData: {
      linkedin_posts: socialStats?.find(s => s.platform === 'linkedin')?.posts_count || 0,
      instagram_posts: socialStats?.find(s => s.platform === 'instagram')?.posts_count || 0,
      tiktok_posts: socialStats?.find(s => s.platform === 'tiktok')?.posts_count || 0,
      sentiment_analysis: 'Análisis en progreso'
    }
  };
}

async function createOrUpdateOpenAIAgent(companyData: CompanyData) {
  const instructions = generateAgentInstructions(companyData);
  
  const agentPayload = {
    name: `Copiloto de ${companyData.name}`,
    instructions,
    tools: [
      {
        type: "function",
        function: {
          name: "search_web",
          description: "Buscar información actualizada en internet sobre competidores, tendencias del mercado o noticias del sector",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Consulta de búsqueda"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_company_performance",
          description: "Analizar el rendimiento de la empresa basado en métricas y objetivos",
          parameters: {
            type: "object",
            properties: {
              metric_type: {
                type: "string",
                description: "Tipo de métrica a analizar: engagement, objectives, content_performance"
              }
            },
            required: ["metric_type"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_strategic_recommendations",
          description: "Generar recomendaciones estratégicas personalizadas para la empresa",
          parameters: {
            type: "object",
            properties: {
              area: {
                type: "string",
                description: "Área de enfoque: marketing, strategy, competitive_analysis, content"
              }
            },
            required: ["area"]
          }
        }
      }
    ],
    model: "gpt-4o"
  };

  // Buscar si ya existe un agente para esta empresa
  const { data: existingAgent } = await supabase
    .from('company_agents')
    .select('agent_id')
    .eq('company_id', companyData.id)
    .single();

  if (existingAgent?.agent_id) {
    // Actualizar agente existente
    const response = await fetch(`https://api.openai.com/v1/assistants/${existingAgent.agent_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify(agentPayload)
    });

    if (!response.ok) {
      throw new Error(`Error updating OpenAI agent: ${response.statusText}`);
    }

    return await response.json();
  } else {
    // Crear nuevo agente
    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify(agentPayload)
    });

    if (!response.ok) {
      throw new Error(`Error creating OpenAI agent: ${response.statusText}`);
    }

    return await response.json();
  }
}

function generateAgentInstructions(companyData: CompanyData): string {
  return `Eres el copiloto empresarial personalizado de ${companyData.name}, una empresa ${companyData.industry_sector ? `del sector ${companyData.industry_sector}` : 'en crecimiento'}.

INFORMACIÓN DE LA EMPRESA:
Nombre: ${companyData.name}
${companyData.description ? `Descripción: ${companyData.description}` : ''}
${companyData.website_url ? `Sitio web: ${companyData.website_url}` : ''}

ESTRATEGIA EMPRESARIAL:
${companyData.strategy?.mision ? `Misión: ${companyData.strategy.mision}` : ''}
${companyData.strategy?.vision ? `Visión: ${companyData.strategy.vision}` : ''}
${companyData.strategy?.propuesta_valor ? `Propuesta de Valor: ${companyData.strategy.propuesta_valor}` : ''}

OBJETIVOS EMPRESARIALES:
${companyData.objectives?.map((obj, i) => `${i + 1}. ${obj.title}: ${obj.description} (Categoría: ${obj.category})`).join('\n') || 'No hay objetivos definidos aún'}

IDENTIDAD VISUAL:
${companyData.branding?.visual_identity ? `Identidad Visual: ${companyData.branding.visual_identity}` : ''}
${companyData.branding?.primary_color ? `Color Principal: ${companyData.branding.primary_color}` : ''}

ACTIVIDAD EN REDES SOCIALES (últimos 30 días):
- LinkedIn: ${companyData.socialData?.linkedin_posts || 0} publicaciones
- Instagram: ${companyData.socialData?.instagram_posts || 0} publicaciones  
- TikTok: ${companyData.socialData?.tiktok_posts || 0} publicaciones

TU PAPEL COMO COPILOTO:
1. Asesoras estratégicamente basándote en la información específica de ${companyData.name}
2. Ayudas a cumplir los objetivos empresariales establecidos
3. Proporcionas insights basados en los datos de rendimiento
4. Sugieres mejoras en marketing, contenido y estrategia
5. Mantienes coherencia con la misión, visión y propuesta de valor
6. Utilizas herramientas de búsqueda para obtener información actualizada del mercado
7. Generas recomendaciones personalizadas para el sector ${companyData.industry_sector || 'de la empresa'}

PERSONALIDAD:
- Estratégico y orientado a resultados
- Conocedor profundo del negocio de ${companyData.name}
- Proactivo en identificar oportunidades
- Enfocado en el crecimiento y cumplimiento de objetivos
- Comunicación profesional pero cercana

Siempre contextualiza tus respuestas con la información específica de ${companyData.name} y sus objetivos estratégicos.`;
}