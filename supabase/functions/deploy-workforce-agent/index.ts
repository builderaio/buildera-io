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

// SFIA Skills configuration mapping for each role
const ROLE_SKILLS_MAP: Record<string, any> = {
  'FPA-001': { // Analista de Planificación y Análisis Financiero
    skills: ['FMIT', 'VISL'],
    tools: [
      {
        type: "function",
        function: {
          name: "analyze_financial_data",
          description: "Analiza datos financieros para identificar tendencias, rentabilidad y áreas de optimización",
          parameters: {
            type: "object",
            properties: {
              data_type: { type: "string", enum: ["profitability", "cashflow", "expenses", "revenue"] },
              period: { type: "string", description: "Período a analizar (ej: Q1-2024)" },
              metrics: { type: "array", items: { type: "string" } }
            },
            required: ["data_type"]
          }
        }
      },
      {
        type: "code_interpreter"
      },
      {
        type: "file_search"
      }
    ]
  },
  'ACT-001': { // Especialista en Contabilidad y Tesorería
    skills: ['FMIT', 'GOVN'],
    tools: [
      {
        type: "function",
        function: {
          name: "optimize_cashflow",
          description: "Optimiza el flujo de caja identificando ciclos de pago y cobro",
          parameters: {
            type: "object",
            properties: {
              current_balance: { type: "number" },
              upcoming_payments: { type: "array", items: { type: "object" } },
              upcoming_receipts: { type: "array", items: { type: "object" } }
            }
          }
        }
      },
      {
        type: "file_search"
      }
    ]
  },
  'CONL-001': { // Analista de Contratos y Cumplimiento Normativo
    skills: ['GOVN', 'IRMG'],
    tools: [
      {
        type: "function",
        function: {
          name: "review_contract",
          description: "Revisa contratos identificando cláusulas de riesgo y recomendaciones",
          parameters: {
            type: "object",
            properties: {
              contract_type: { type: "string", enum: ["supplier", "client", "employee", "rental"] },
              focus_areas: { type: "array", items: { type: "string" } }
            },
            required: ["contract_type"]
          }
        }
      },
      {
        type: "file_search"
      }
    ]
  },
  'TAL-001': { // Especialista en Adquisición de Talento
    skills: ['RCRC', 'RSCH'],
    tools: [
      {
        type: "function",
        function: {
          name: "create_job_profile",
          description: "Crea perfiles de cargo profesionales y atractivos",
          parameters: {
            type: "object",
            properties: {
              position_title: { type: "string" },
              department: { type: "string" },
              responsibilities: { type: "array", items: { type: "string" } },
              requirements: { type: "array", items: { type: "string" } }
            },
            required: ["position_title", "department"]
          }
        }
      }
    ]
  },
  'HRBP-001': { // Generalista de Desarrollo y Cultura Organizacional
    skills: ['ORDI', 'PEMT'],
    tools: [
      {
        type: "function",
        function: {
          name: "design_survey",
          description: "Diseña encuestas de clima laboral y cultura organizacional",
          parameters: {
            type: "object",
            properties: {
              survey_type: { type: "string", enum: ["climate", "engagement", "satisfaction"] },
              focus_areas: { type: "array", items: { type: "string" } }
            },
            required: ["survey_type"]
          }
        }
      }
    ]
  },
  'ADM-001': { // Coordinador de Operaciones Administrativas
    skills: ['BURM', 'SALE'],
    tools: [
      {
        type: "function",
        function: {
          name: "optimize_operations",
          description: "Optimiza procesos administrativos y operacionales",
          parameters: {
            type: "object",
            properties: {
              process_type: { type: "string" },
              current_issues: { type: "array", items: { type: "string" } }
            }
          }
        }
      }
    ]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agent_id, user_id, company_id } = await req.json();

    if (!agent_id || !user_id) {
      throw new Error('agent_id y user_id son requeridos');
    }

    console.log('Deploying workforce agent:', { agent_id, user_id, company_id });

    // Get agent data from database
    const { data: agent, error: agentError } = await supabase
      .from('ai_workforce_agents')
      .select('*')
      .eq('internal_id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agent_id}`);
    }

    // Get role configuration
    const roleConfig = ROLE_SKILLS_MAP[agent_id] || {
      skills: [],
      tools: [{ type: "file_search" }]
    };

    // Build system instructions
    const instructions = `Eres un agente especializado de AI Workforce con el rol de ${agent.role_name}.

DESCRIPCIÓN DEL ROL:
${agent.description || 'Agente especializado en tareas empresariales'}

FUNCIÓN PRINCIPAL:
${agent.primary_function || 'Resolver tareas específicas del área de negocio'}

HABILIDADES SFIA:
${JSON.stringify(agent.sfia_skills, null, 2)}

DIRECTRICES:
1. Ejecuta tus tareas con precisión y profesionalismo
2. Proporciona resultados estructurados y accionables
3. Identifica riesgos y oportunidades relevantes
4. Genera recomendaciones basadas en mejores prácticas
5. Adapta tu comunicación al contexto empresarial

Siempre responde en español de manera clara y profesional.`;

    // Create OpenAI Assistant with v2 API
    const assistantPayload = {
      name: agent.role_name,
      instructions: instructions,
      model: "gpt-4o-mini",
      tools: roleConfig.tools,
      metadata: {
        agent_id: agent.id,
        internal_id: agent.internal_id,
        role_name: agent.role_name,
        user_id: user_id,
        company_id: company_id || 'global',
        sfia_level: agent.average_sfia_level?.toString() || '3',
        version: 'v2'
      }
    };

    console.log('Creating OpenAI Assistant with payload:', JSON.stringify(assistantPayload, null, 2));

    const response = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify(assistantPayload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI error:', response.status, errorBody);
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    const openAIAssistant = await response.json();
    console.log('OpenAI Assistant created:', openAIAssistant.id);

    // Update agent record with OpenAI assistant ID
    const { data: updatedAgent, error: updateError } = await supabase
      .from('ai_workforce_agents')
      .update({
        execution_type: 'openai_assistant',
        execution_resource_id: openAIAssistant.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', agent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({
      success: true,
      agent: updatedAgent,
      openai_assistant_id: openAIAssistant.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deploying workforce agent:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
