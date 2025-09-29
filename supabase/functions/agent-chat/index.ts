import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const templateId = url.pathname.split('/')[3]
    const apiKey = req.headers.get('x-api-key') || url.searchParams.get('api_key')

    if (!apiKey) {
      throw new Error('API key required')
    }

    // Verificar API key y obtener deployment
    const { data: endpoint } = await supabaseClient
      .from('agent_api_endpoints')
      .select(`
        *,
        deployment:agent_deployments!inner(
          *,
          template:whitelabel_agent_templates!inner(*)
        )
      `)
      .eq('api_key', apiKey)
      .eq('endpoint_type', 'chat')
      .single()

    if (!endpoint) {
      throw new Error('Invalid API key')
    }

    const { message, context = {} } = await req.json()
    const template = endpoint.deployment.template

    // Construir prompt con configuración del template
    const systemPrompt = buildSystemPrompt(template, endpoint.deployment.custom_configuration)
    
    // Llamar a OpenAI o provider configurado
    const response = await callAIProvider(systemPrompt, message, template.ai_capabilities)

    // Incrementar contador de uso
    await supabaseClient
      .from('agent_deployments')
      .update({ 
        monthly_usage_count: endpoint.deployment.monthly_usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', endpoint.deployment_id)

    return new Response(
      JSON.stringify({
        response: response.content,
        usage: {
          tokens: response.usage?.total_tokens || 0,
          cost: calculateCost(response.usage?.total_tokens || 0, template.base_price)
        },
        agent_info: {
          name: template.template_name,
          category: template.category
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing chat:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildSystemPrompt(template: any, customConfig: any = {}) {
  const basePrompt = `Eres ${template.template_name}, un agente especializado en ${template.category}.

Propósito: ${template.flow_definition.purpose}

Personalidad:
- Tono: ${template.flow_definition.personality.tone}
- Estilo: ${template.flow_definition.personality.style}
- Nivel de expertise: ${template.flow_definition.personality.expertise_level}

Capacidades disponibles:
${template.ai_capabilities.map((cap: string) => `- ${cap}`).join('\n')}

Integraciones disponibles:
${template.integration_config.map((int: string) => `- ${int}`).join('\n')}

${customConfig.additional_instructions ? `Instrucciones adicionales: ${customConfig.additional_instructions}` : ''}

Responde siempre manteniendo tu personalidad y propósito.`

  return basePrompt
}

async function callAIProvider(systemPrompt: string, userMessage: string, capabilities: string[]) {
  const openAIKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openAIKey) {
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'AI provider error')
  }

  return {
    content: data.choices[0].message.content,
    usage: data.usage
  }
}

function calculateCost(tokens: number, basePrice: number): number {
  // Costo básico por token más precio base del template
  const tokenCost = tokens * 0.0001 // $0.0001 por token
  return tokenCost + (basePrice || 0)
}