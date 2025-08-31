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
  country?: string;
  company_size?: string;
  strategy?: {
    mision?: string;
    vision?: string;
    propuesta_valor?: string;
    analisis_competitivo?: any;
    publico_objetivo?: any;
  };
  branding?: {
    primary_color?: string;
    secondary_color?: string;
    complementary_color_1?: string;
    complementary_color_2?: string;
    visual_identity?: string;
    brand_voice?: any;
    visual_synthesis?: any;
    color_justifications?: any;
  };
  objectives?: Array<{
    title: string;
    description: string;
    objective_type: string;
    priority: number;
    status: string;
    target_date?: string;
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
    console.log('Step 1: Getting company data for company_id:', company_id);
    const companyData = await getCompanyData(company_id);
    console.log('Step 1 completed: Company data retrieved');
    
    // Crear o actualizar el agente de OpenAI
    console.log('Step 2: Creating or updating OpenAI agent');
    const agent = await createOrUpdateOpenAIAgent(companyData);
    console.log('Step 2 completed: Agent created/updated');
    
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
  console.log('Getting company data for ID:', company_id);
  
  // Obtener información básica de la empresa
  console.log('Step 1a: Fetching company basic info...');
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', company_id)
    .single();

  if (companyError) {
    console.error('Error fetching company:', companyError);
    throw new Error(`Error fetching company: ${companyError.message}`);
  }
  console.log('Step 1a completed: Company basic info retrieved');

  // Obtener estrategia empresarial
  console.log('Step 1b: Fetching company strategy...');
  const { data: strategy } = await supabase
    .from('company_strategy')
    .select('*')
    .eq('company_id', company_id)
    .single();
  console.log('Step 1b completed: Strategy data:', strategy ? 'found' : 'not found');

  // Obtener branding completo
  console.log('Step 1c: Fetching company branding...');
  const { data: branding } = await supabase
    .from('company_branding')
    .select('*')
    .eq('company_id', company_id)
    .single();
  console.log('Step 1c completed: Branding data:', branding ? 'found' : 'not found');

  // Obtener objetivos
  console.log('Step 1d: Fetching company objectives...');
  const { data: objectives } = await supabase
    .from('company_objectives')
    .select('*')
    .eq('company_id', company_id);
  console.log('Step 1d completed: Objectives found:', objectives?.length || 0);

  // Obtener datos de redes sociales (sin agregaciones complejas por limitaciones de Supabase client)
  const { data: socialPosts } = await supabase
    .from('social_media_calendar')
    .select('platform, engagement_rate')
    .eq('user_id', company.created_by)
    .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 días
  
  // Procesar estadísticas manualmente
  const socialStats = socialPosts ? socialPosts.reduce((acc, post) => {
    const platform = post.platform;
    if (!acc[platform]) {
      acc[platform] = { posts_count: 0, total_engagement: 0 };
    }
    acc[platform].posts_count++;
    acc[platform].total_engagement += post.engagement_rate || 0;
    return acc;
  }, {} as Record<string, { posts_count: number; total_engagement: number }>) : {};

  return {
    id: company.id,
    name: company.name,
    description: company.description,
    industry_sector: company.industry_sector,
    website_url: company.website_url,
    country: company.country,
    company_size: company.company_size,
    strategy: strategy ? {
      mision: strategy.mision,
      vision: strategy.vision,
      propuesta_valor: strategy.propuesta_valor,
      analisis_competitivo: strategy.analisis_competitivo,
      publico_objetivo: strategy.publico_objetivo
    } : undefined,
    branding: branding ? {
      primary_color: branding.primary_color,
      secondary_color: branding.secondary_color,
      complementary_color_1: branding.complementary_color_1,
      complementary_color_2: branding.complementary_color_2,
      visual_identity: branding.visual_identity,
      brand_voice: branding.brand_voice,
      visual_synthesis: branding.visual_synthesis,
      color_justifications: branding.color_justifications
    } : undefined,
    objectives: objectives || [],
    socialData: {
      linkedin_posts: socialStats?.linkedin?.posts_count || 0,
      instagram_posts: socialStats?.instagram?.posts_count || 0,
      tiktok_posts: socialStats?.tiktok?.posts_count || 0,
      sentiment_analysis: 'Análisis en progreso'
    }
  };
}

async function createOrUpdateOpenAIAgent(companyData: CompanyData) {
  console.log('Step 2a: Generating agent instructions...');
  const instructions = generateAgentInstructions(companyData);
  console.log('Step 2a completed: Instructions generated');
  
  console.log('Step 2b: Checking OpenAI API key...');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found in environment variables');
  }
  console.log('Step 2b completed: OpenAI API key available');
  
  // Configuración del agente usando la nueva API de Agents
  const agentPayload = {
    name: `Copiloto ERA de ${companyData.name}`,
    instructions,
    // Usar el modelo más reciente compatible
    model: "gpt-4o-mini",
    // Configurar herramientas según la nueva API de Agents
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
                description: "Consulta de búsqueda específica relacionada con el negocio"
              },
              focus: {
                type: "string",
                enum: ["competitors", "trends", "news", "market"],
                description: "Área de enfoque para la búsqueda"
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
          description: "Analizar el rendimiento de la empresa basado en métricas y objetivos específicos",
          parameters: {
            type: "object",
            properties: {
              metric_type: {
                type: "string",
                enum: ["engagement", "objectives", "content_performance", "growth_metrics"],
                description: "Tipo de métrica a analizar"
              },
              time_period: {
                type: "string",
                enum: ["week", "month", "quarter", "year"],
                description: "Período de tiempo para el análisis"
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
          description: "Generar recomendaciones estratégicas personalizadas para la empresa basadas en su ADN",
          parameters: {
            type: "object", 
            properties: {
              area: {
                type: "string",
                enum: ["marketing", "strategy", "competitive_analysis", "content", "branding", "growth"],
                description: "Área específica para las recomendaciones"
              },
              priority_level: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Nivel de prioridad de las recomendaciones"
              }
            },
            required: ["area"]
          }
        }
      }
    ],
    // Configuración específica para la empresa
    metadata: {
      company_id: companyData.id,
      industry: companyData.industry_sector,
      creation_date: new Date().toISOString(),
      version: "2.0"
    }
  };

  console.log('Step 2c: Checking for existing agent...');
  // Buscar si ya existe un agente para esta empresa
  const { data: existingAgent, error: existingAgentError } = await supabase
    .from('company_agents')
    .select('agent_id')
    .eq('company_id', companyData.id)
    .maybeSingle();

  if (existingAgentError) {
    console.warn('Warning fetching existing agent (continuing with create):', existingAgentError);
  }
  console.log('Existing agent check:', existingAgent?.agent_id ? 'found' : 'not found');

  if (existingAgent?.agent_id) {
    console.log('Step 2d: Updating existing OpenAI agent...');
    // Actualizar agente existente usando la API de Assistants v2
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
      const errorBody = await response.text().catch(() => '');
      console.error('OpenAI update error:', response.status, response.statusText, errorBody);
      throw new Error(`Error updating OpenAI agent: ${response.status} ${response.statusText} ${errorBody}`);
    }

    const updatedAgent = await response.json();
    console.log('Step 2d completed: Agent updated successfully');
    return updatedAgent;
  } else {
    console.log('Step 2d: Creating new OpenAI agent...');
    // Crear nuevo agente usando la API de Assistants v2
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
      const errorBody = await response.text().catch(() => '');
      console.error('OpenAI create error:', response.status, response.statusText, errorBody);
      throw new Error(`Error creating OpenAI agent: ${response.status} ${response.statusText} ${errorBody}`);
    }

    const newAgent = await response.json();
    console.log('Step 2d completed: New agent created successfully');
    return newAgent;
  }
}

function generateAgentInstructions(companyData: CompanyData): string {
  const brandVoiceData = companyData.branding?.brand_voice || {};
  const visualSynthesis = companyData.branding?.visual_synthesis || {};
  const colorJustifications = companyData.branding?.color_justifications || {};
  
  return `Eres ERA, el copiloto empresarial personalizado de ${companyData.name}, una empresa ${companyData.industry_sector ? `del sector ${companyData.industry_sector}` : 'en crecimiento'} ${companyData.country ? `ubicada en ${companyData.country}` : ''}.

🏢 INFORMACIÓN EMPRESARIAL:
• Nombre: ${companyData.name}
${companyData.description ? `• Descripción: ${companyData.description}` : ''}
${companyData.industry_sector ? `• Sector: ${companyData.industry_sector}` : ''}
${companyData.company_size ? `• Tamaño: ${companyData.company_size}` : ''}
${companyData.website_url ? `• Sitio web: ${companyData.website_url}` : ''}
${companyData.country ? `• País: ${companyData.country}` : ''}

🎯 ESTRATEGIA EMPRESARIAL:
${companyData.strategy?.mision ? `• Misión: ${companyData.strategy.mision}` : ''}
${companyData.strategy?.vision ? `• Visión: ${companyData.strategy.vision}` : ''}
${companyData.strategy?.propuesta_valor ? `• Propuesta de Valor: ${companyData.strategy.propuesta_valor}` : ''}
${companyData.strategy?.publico_objetivo ? `• Público Objetivo: ${JSON.stringify(companyData.strategy.publico_objetivo)}` : ''}

📈 OBJETIVOS DE CRECIMIENTO:
${companyData.objectives?.length ? companyData.objectives.map((obj, i) => 
  `${i + 1}. [${obj.objective_type.toUpperCase()}] ${obj.title}
     Descripción: ${obj.description}
     Prioridad: ${obj.priority}/5
     Estado: ${obj.status}
     ${obj.target_date ? `Fecha objetivo: ${obj.target_date}` : ''}`
).join('\n\n') : 'No hay objetivos definidos aún'}

🎨 IDENTIDAD DE MARCA:
${brandVoiceData.personalidad ? `• Personalidad de Marca: ${brandVoiceData.personalidad}` : ''}
${brandVoiceData.descripcion ? `• Voz de Marca: ${brandVoiceData.descripcion}` : ''}
${brandVoiceData.palabras_clave ? `• Palabras Clave: ${brandVoiceData.palabras_clave.join(', ')}` : ''}

🎨 PALETA DE COLORES:
${companyData.branding?.primary_color ? `• Color Principal: ${companyData.branding.primary_color} ${colorJustifications.principal?.justificacion ? `(${colorJustifications.principal.justificacion})` : ''}` : ''}
${companyData.branding?.secondary_color ? `• Color Secundario: ${companyData.branding.secondary_color} ${colorJustifications.secundario?.justificacion ? `(${colorJustifications.secundario.justificacion})` : ''}` : ''}
${companyData.branding?.complementary_color_1 ? `• Color Complementario 1: ${companyData.branding.complementary_color_1} ${colorJustifications.complementario1?.justificacion ? `(${colorJustifications.complementario1.justificacion})` : ''}` : ''}
${companyData.branding?.complementary_color_2 ? `• Color Complementario 2: ${companyData.branding.complementary_color_2} ${colorJustifications.complementario2?.justificacion ? `(${colorJustifications.complementario2.justificacion})` : ''}` : ''}

🎭 ESTILO VISUAL:
${visualSynthesis.concepto_general ? `• Concepto General: ${visualSynthesis.concepto_general}` : ''}
${visualSynthesis.tipografia ? `• Tipografía: ${visualSynthesis.tipografia}` : ''}
${visualSynthesis.estilo_fotografico ? `• Estilo Fotográfico: ${visualSynthesis.estilo_fotografico}` : ''}

📱 ACTIVIDAD EN REDES SOCIALES (últimos 30 días):
• LinkedIn: ${companyData.socialData?.linkedin_posts || 0} publicaciones
• Instagram: ${companyData.socialData?.instagram_posts || 0} publicaciones  
• TikTok: ${companyData.socialData?.tiktok_posts || 0} publicaciones

🚀 TU PAPEL COMO ERA (COPILOTO EMPRESARIAL):
1. Asesoras estratégicamente basándote en TODA la información específica de ${companyData.name}
2. Ayudas a cumplir los objetivos de crecimiento establecidos, priorizando según su importancia
3. Mantienes coherencia absoluta con la identidad de marca, usando su personalidad y palabras clave
4. Proporcionas insights basados en datos de rendimiento y competencia
5. Sugieres mejoras en marketing, contenido y estrategia alineadas con la propuesta de valor
6. Utilizas la información del análisis competitivo y público objetivo para contexto
7. Generas recomendaciones personalizadas para el sector ${companyData.industry_sector || 'de la empresa'}
8. Respetas la paleta de colores y estilo visual en todas las sugerencias de contenido

💡 TU PERSONALIDAD COMO ERA:
${brandVoiceData.personalidad || 'Estratégico y orientado a resultados'}
• Conocedor profundo del ADN empresarial de ${companyData.name}
• Proactivo en identificar oportunidades de crecimiento
• Enfocado en el cumplimiento de objetivos específicos definidos
• Comunicación que refleja la voz de marca establecida
• Siempre alineado con la misión, visión y propuesta de valor

⚡ INSTRUCCIONES ESPECIALES:
• SIEMPRE contextualiza tus respuestas con la información específica de ${companyData.name}
• Prioriza sugerencias que contribuyan directamente a los objetivos de crecimiento
• Usa la personalidad de marca ${brandVoiceData.personalidad || 'definida'} en tu comunicación
• Mantén coherencia con los colores y estilo visual en sugerencias de contenido
• Considera el análisis competitivo al hacer recomendaciones estratégicas
• Adapta las sugerencias al tamaño de empresa (${companyData.company_size || 'tamaño no especificado'})`;
}