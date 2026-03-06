import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Resolve company data to send to N8N from database sources
 */
async function getCompanyData(companyId: string, userId: string) {
  if (!companyId) throw new Error('CompanyId is required');

  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      id, name, website_url, description, industry_sector,
      linkedin_url, instagram_url, facebook_url, twitter_url, youtube_url, tiktok_url,
      webhook_data
    `)
    .eq('id', companyId)
    .maybeSingle();

  if (error || !company) throw new Error('Company not found');

  // Get audiences for richer context
  const { data: audiences } = await supabase
    .from('company_audiences')
    .select('name, description')
    .eq('company_id', companyId)
    .limit(5);

  // Get products for richer context
  const { data: products } = await supabase
    .from('company_products')
    .select('name, description, category')
    .eq('company_id', companyId)
    .limit(10);

  // Get digital presence data if available
  const { data: presence } = await supabase
    .from('company_digital_presence')
    .select('executive_diagnosis, visibility_score, trust_score, positioning_score')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle();

  // Build webhook data context
  const webhook = company.webhook_data || {};
  let webhookContext = (webhook?.data && typeof webhook.data === 'object')
    ? webhook.data
    : (webhook?.input?.data && typeof webhook.input.data === 'object')
      ? webhook.input.data
      : {};

  return {
    company_name: company.name,
    website: company.website_url,
    business_description: company.description,
    industry_sector: company.industry_sector,
    audiences: audiences?.map(a => a.name).join(', ') || '',
    products: products?.map(p => p.name).join(', ') || '',
    digital_diagnosis: presence?.executive_diagnosis || '',
    social_links: {
      linkedin: company.linkedin_url,
      instagram: company.instagram_url,
      facebook: company.facebook_url,
    },
    webhook_context: webhookContext,
  };
}

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) throw new Error('Authorization header required');
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid user token');
  return user;
}

/**
 * Quality validation: detect if content looks like a diagnostic finding
 * instead of a real strategic statement
 */
function isLowQualityStrategy(strategy: { mision?: string; vision?: string; propuesta_valor?: string }): string[] {
  const issues: string[] = [];
  const diagnosticPatterns = [
    /escasas evidencias/i,
    /no se encontr/i,
    /no se detect/i,
    /sin evidencia/i,
    /no hay datos/i,
    /empresa con posicionamiento/i,
    /priorizar la visibilidad/i,
    /faltan|falta de/i,
    /se recomienda/i,
    /debe implementar/i,
    /HTML estático/i,
    /rastreado|crawl/i,
  ];

  const fieldChecks = [
    { field: 'mision', value: strategy.mision, label: 'Misión' },
    { field: 'vision', value: strategy.vision, label: 'Visión' },
    { field: 'propuesta_valor', value: strategy.propuesta_valor, label: 'Propuesta de valor' },
  ];

  for (const check of fieldChecks) {
    if (!check.value || check.value.length < 15) {
      issues.push(`${check.label} es demasiado corta o vacía`);
      continue;
    }
    for (const pattern of diagnosticPatterns) {
      if (pattern.test(check.value)) {
        issues.push(`${check.label} parece un diagnóstico, no una declaración estratégica`);
        break;
      }
    }
  }

  return issues;
}

/**
 * Generate strategy using OpenAI directly (high-quality fallback)
 */
async function generateWithOpenAI(companyData: any): Promise<{ mision: string; vision: string; propuesta_valor: string }> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) throw new Error('OpenAI API key not configured');

  const systemPrompt = `Eres un consultor estratégico senior especializado en definir la identidad estratégica de empresas.

REGLAS CRÍTICAS:
1. Genera declaraciones ASPIRACIONALES e INSPIRADORAS, NO diagnósticos ni recomendaciones tácticas.
2. La MISIÓN debe responder: "¿Por qué existimos? ¿Qué hacemos por nuestros clientes HOY?"
3. La VISIÓN debe responder: "¿Qué futuro queremos crear? ¿Cómo se ve el éxito a 5-10 años?"
4. La PROPUESTA DE VALOR debe responder: "¿Qué nos hace únicos? ¿Por qué elegirnos sobre la competencia?"

NUNCA incluyas:
- Observaciones sobre su sitio web o presencia digital
- Recomendaciones de mejora
- Análisis de falencias
- Lenguaje diagnóstico ("se detectó", "falta de", "se recomienda")

SIEMPRE:
- Usa lenguaje declarativo y en primera persona plural ("Somos...", "Creemos...", "Transformamos...")
- Sé específico al sector y audiencia de la empresa
- Máximo 2 oraciones por campo
- Inspira confianza y diferenciación

Responde en JSON: {"mision": "...", "vision": "...", "propuesta_valor": "..."}`;

  const userPrompt = `Empresa: ${companyData.company_name || 'Sin nombre'}
Sector: ${companyData.industry_sector || 'No especificado'}
Descripción: ${companyData.business_description || 'No disponible'}
Sitio web: ${companyData.website || 'No disponible'}
Audiencias: ${companyData.audiences || 'No definidas'}
Productos/Servicios: ${companyData.products || 'No definidos'}

Contexto adicional del diagnóstico digital (USAR SOLO COMO CONTEXTO, no repetirlo):
${typeof companyData.digital_diagnosis === 'string' ? companyData.digital_diagnosis : JSON.stringify(companyData.digital_diagnosis || '').slice(0, 500)}

Genera la misión, visión y propuesta de valor para esta empresa.`;

  console.log('🤖 Generating strategy with OpenAI...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ OpenAI error:', errText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  
  if (!content) throw new Error('Empty OpenAI response');

  const parsed = JSON.parse(content);
  console.log('✅ OpenAI strategy generated:', parsed);
  
  return {
    mision: parsed.mision || '',
    vision: parsed.vision || '',
    propuesta_valor: parsed.propuesta_valor || '',
  };
}

/**
 * Call N8N API for strategy generation (with explicit instructions)
 */
async function callN8NStrategy(companyData: any) {
  const n8nEndpoint = 'https://buildera.app.n8n.cloud/webhook/company-strategy';
  const authUser = Deno.env.get('N8N_AUTH_USER');
  const authPass = Deno.env.get('N8N_AUTH_PASS');

  if (!authUser || !authPass) {
    console.warn('⚠️ N8N credentials not found, skipping N8N');
    return null;
  }

  const credentials = btoa(`${authUser}:${authPass}`);
  const requestPayload = {
    input: {
      data: companyData,
      instructions: {
        type: 'strategic_identity',
        output_format: {
          mision: 'Declaración aspiracional de por qué existe la empresa (1-2 oraciones, primera persona plural)',
          vision: 'Futuro que la empresa quiere crear a 5-10 años (1-2 oraciones, aspiracional)',
          propuesta_valor: 'Diferenciador único que hace a la empresa la mejor opción (1-2 oraciones)',
        },
        constraints: [
          'NO incluir diagnósticos, recomendaciones ni análisis de falencias',
          'Usar lenguaje declarativo: "Somos...", "Creemos...", "Transformamos..."',
          'Ser específico al sector y audiencia de la empresa',
          'NO mencionar el sitio web, HTML, SEO ni presencia digital',
        ],
      },
    },
  };

  console.log('🚀 Calling N8N with explicit instructions...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const apiResponse = await fetch(n8nEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      console.warn('⚠️ N8N returned error status:', apiResponse.status);
      return null;
    }

    const rawBody = await apiResponse.text();
    let strategyResponse;
    try {
      strategyResponse = JSON.parse(rawBody);
    } catch {
      console.warn('⚠️ N8N returned non-JSON response');
      return null;
    }

    return strategyResponse;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('⚠️ N8N call failed:', error.message);
    return null;
  }
}

/**
 * Store strategy in database
 */
async function storeStrategy(companyId: string, strategy: any) {
  const { data: existing } = await supabase
    .from('company_strategy')
    .select('id')
    .eq('company_id', companyId)
    .maybeSingle();

  const payload = {
    mision: strategy.mision,
    vision: strategy.vision,
    propuesta_valor: strategy.propuesta_valor,
    generated_with_ai: true,
  };

  if (existing) {
    await supabase.from('company_strategy').update(payload).eq('id', existing.id);
    return existing.id;
  } else {
    const { data, error } = await supabase
      .from('company_strategy')
      .insert({ company_id: companyId, ...payload })
      .select('id')
      .single();
    if (error) throw new Error('Failed to create strategy');
    return data.id;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Starting company strategy generation...');

    const body = await req.json();
    const { companyId } = body;
    if (!companyId) throw new Error('CompanyId is required');

    const user = await authenticateUser(req);
    console.log('👤 User authenticated:', user.id);

    const companyData = await getCompanyData(companyId, user.id);
    console.log('📋 Company data resolved:', companyData.company_name);

    // Strategy 1: Try N8N first
    let strategy: { mision: string; vision: string; propuesta_valor: string } | null = null;
    
    const n8nResponse = await callN8NStrategy(companyData);
    
    if (n8nResponse) {
      // Extract from N8N response structure
      let strategyData;
      if (Array.isArray(n8nResponse) && n8nResponse.length > 0) {
        const firstItem = n8nResponse[0];
        strategyData = firstItem[""] || firstItem;
      } else {
        strategyData = n8nResponse;
      }

      const candidate = {
        mision: strategyData?.mision || '',
        vision: strategyData?.vision || '',
        propuesta_valor: strategyData?.propuesta_valor || '',
      };

      // Quality validation
      const qualityIssues = isLowQualityStrategy(candidate);
      
      if (qualityIssues.length === 0) {
        console.log('✅ N8N strategy passed quality check');
        strategy = candidate;
      } else {
        console.warn('⚠️ N8N strategy failed quality check:', qualityIssues);
        console.log('🔄 Falling back to OpenAI direct generation...');
      }
    }

    // Strategy 2: OpenAI fallback if N8N failed or produced low quality
    if (!strategy) {
      strategy = await generateWithOpenAI(companyData);
      
      // Validate OpenAI output too
      const openaiIssues = isLowQualityStrategy(strategy);
      if (openaiIssues.length > 0) {
        console.warn('⚠️ Even OpenAI had quality issues:', openaiIssues);
        // Still use it — it's better than nothing
      }
    }

    // Store in database
    const strategyId = await storeStrategy(companyId, strategy);
    console.log('✅ Strategy stored successfully:', strategyId);

    return new Response(
      JSON.stringify({
        strategyId,
        data_stored: strategy,
        generation_method: n8nResponse ? 'n8n' : 'openai_direct',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error in company-strategy:', error);
    const status = error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
