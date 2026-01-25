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

// Helper to build diagnostic context from all available data
function buildDiagnosticContext(webhookData: any, digitalPresence: any, audiences: any[], products: any[]): string {
  const sections: string[] = [];

  // Extract webhook diagnostic data
  if (webhookData) {
    // Identity/SEO data
    if (webhookData.seo) {
      const seo = webhookData.seo;
      if (seo.keyword && Array.isArray(seo.keyword) && seo.keyword.length > 0) {
        sections.push(`Keywords principales: ${seo.keyword.slice(0, 5).join(', ')}`);
      }
      if (seo.strength && Array.isArray(seo.strength) && seo.strength.length > 0) {
        sections.push(`Fortalezas SEO: ${seo.strength.slice(0, 3).join(', ')}`);
      }
      if (seo.weakness && Array.isArray(seo.weakness) && seo.weakness.length > 0) {
        sections.push(`Debilidades SEO: ${seo.weakness.slice(0, 3).join(', ')}`);
      }
    }

    // Market data
    if (webhookData.market) {
      const market = webhookData.market;
      if (market.competitor && Array.isArray(market.competitor) && market.competitor.length > 0) {
        sections.push(`Competidores identificados: ${market.competitor.slice(0, 5).join(', ')}`);
      }
      if (market.trend && Array.isArray(market.trend) && market.trend.length > 0) {
        sections.push(`Tendencias del mercado: ${market.trend.slice(0, 3).join(', ')}`);
      }
      if (market.opportunity && Array.isArray(market.opportunity) && market.opportunity.length > 0) {
        sections.push(`Oportunidades detectadas: ${market.opportunity.slice(0, 3).join(', ')}`);
      }
    }
  }

  // Digital presence diagnostic
  if (digitalPresence) {
    if (digitalPresence.digital_footprint_summary) {
      sections.push(`Resumen presencia digital: ${digitalPresence.digital_footprint_summary}`);
    }
    if (digitalPresence.what_is_working && Array.isArray(digitalPresence.what_is_working)) {
      sections.push(`Lo que funciona: ${digitalPresence.what_is_working.slice(0, 3).join(', ')}`);
    }
    if (digitalPresence.what_is_missing && Array.isArray(digitalPresence.what_is_missing)) {
      sections.push(`Áreas de mejora: ${digitalPresence.what_is_missing.slice(0, 3).join(', ')}`);
    }
    if (digitalPresence.key_risks && Array.isArray(digitalPresence.key_risks)) {
      sections.push(`Riesgos clave: ${digitalPresence.key_risks.slice(0, 3).join(', ')}`);
    }
    if (digitalPresence.competitive_positioning) {
      sections.push(`Posicionamiento competitivo: ${digitalPresence.competitive_positioning}`);
    }
  }

  // Audiences
  if (audiences && audiences.length > 0) {
    const audienceNames = audiences.map(a => a.name).join(', ');
    sections.push(`Audiencias objetivo: ${audienceNames}`);
    
    const allPainPoints = audiences.flatMap(a => a.pain_points || []).slice(0, 5);
    if (allPainPoints.length > 0) {
      sections.push(`Puntos de dolor de audiencia: ${allPainPoints.join(', ')}`);
    }
    
    const allGoals = audiences.flatMap(a => a.goals || []).slice(0, 5);
    if (allGoals.length > 0) {
      sections.push(`Metas de audiencia: ${allGoals.join(', ')}`);
    }
  }

  // Products/Services
  if (products && products.length > 0) {
    const productList = products.map(p => `${p.name} (${p.category})`).join(', ');
    sections.push(`Productos/Servicios: ${productList}`);
  }

  if (sections.length === 0) {
    return '';
  }

  return `--- DATOS DEL DIAGNÓSTICO ---
${sections.join('\n')}
--- FIN DIAGNÓSTICO ---`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 Starting business objectives generation...');
    
    const body = await req.json();
    const { companyId, language = 'es' } = body;
    
    if (!companyId) {
      throw new Error('CompanyId is required');
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('👤 User authenticated:', user.id);

    // Get company data including webhook diagnostic data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, description, industry_sector, website_url, company_size, country, webhook_data')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error('Company not found');
    }

    // Get existing strategy
    const { data: strategy } = await supabase
      .from('company_strategy')
      .select('mision, vision, propuesta_valor')
      .eq('company_id', companyId)
      .maybeSingle();

    // Get digital presence diagnostic
    const { data: digitalPresence } = await supabase
      .from('company_digital_presence')
      .select('digital_footprint_summary, what_is_working, what_is_missing, key_risks, competitive_positioning, action_plan')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get company audiences
    const { data: audiences } = await supabase
      .from('company_audiences')
      .select('name, description, pain_points, goals, challenges')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(5);

    // Get company products/services
    const { data: products } = await supabase
      .from('company_products')
      .select('name, description, category')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .limit(10);

    console.log('📋 Company data loaded:', company.name);
    console.log('📊 Diagnostic data:', digitalPresence ? 'available' : 'not available');
    console.log('👥 Audiences:', audiences?.length || 0);
    console.log('📦 Products:', products?.length || 0);

    // Generate objectives using OpenAI
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = language === 'es' 
      ? `Eres un consultor de estrategia empresarial experto. Genera 3-4 objetivos de negocio SMART (Específicos, Medibles, Alcanzables, Relevantes, con Tiempo definido) basados en la información de la empresa.

Para cada objetivo incluye:
- Título claro y conciso (máximo 10 palabras)
- Descripción detallada (2-3 oraciones)
- Tipo: short_term (3-6 meses), medium_term (6-12 meses), long_term (1-3 años)
- Prioridad: 1 (alta), 2 (media), 3 (baja)
- Fecha objetivo estimada

Responde SOLO con un JSON válido en este formato exacto:
{
  "objectives": [
    {
      "title": "Título del objetivo",
      "description": "Descripción detallada del objetivo",
      "objective_type": "short_term",
      "priority": 1,
      "target_date": "2025-06-30"
    }
  ]
}`
      : `You are an expert business strategy consultant. Generate 3-4 SMART business objectives (Specific, Measurable, Achievable, Relevant, Time-bound) based on the company information.

For each objective include:
- Clear and concise title (maximum 10 words)
- Detailed description (2-3 sentences)
- Type: short_term (3-6 months), medium_term (6-12 months), long_term (1-3 years)
- Priority: 1 (high), 2 (medium), 3 (low)
- Estimated target date

Respond ONLY with valid JSON in this exact format:
{
  "objectives": [
    {
      "title": "Objective title",
      "description": "Detailed objective description",
      "objective_type": "short_term",
      "priority": 1,
      "target_date": "2025-06-30"
    }
  ]
}`;

    // Build context from diagnostic data
    const webhookData = company.webhook_data || {};
    const diagnosticContext = buildDiagnosticContext(webhookData, digitalPresence, audiences, products);

    const userPrompt = `Empresa: ${company.name}
Industria: ${company.industry_sector || 'No especificada'}
Descripción: ${company.description || 'No disponible'}
Sitio web: ${company.website_url || 'No disponible'}
Tamaño: ${company.company_size || 'No especificado'}
País: ${company.country || 'No especificado'}
${strategy?.mision ? `Misión: ${strategy.mision}` : ''}
${strategy?.vision ? `Visión: ${strategy.vision}` : ''}
${strategy?.propuesta_valor ? `Propuesta de valor: ${strategy.propuesta_valor}` : ''}

${diagnosticContext}

Genera objetivos empresariales estratégicos basados en esta información completa del diagnóstico.`;

    console.log('🤖 Calling OpenAI API...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error('Failed to generate objectives from AI');
    }

    const aiResult = await openaiResponse.json();
    const content = aiResult.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('📝 AI response received');

    let parsedObjectives;
    try {
      parsedObjectives = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    const objectives = parsedObjectives.objectives || [];

    if (objectives.length === 0) {
      throw new Error('No objectives generated');
    }

    console.log(`✅ Generated ${objectives.length} objectives`);

    // Store objectives in database
    const objectivesToInsert = objectives.map((obj: any) => ({
      company_id: companyId,
      title: obj.title,
      description: obj.description,
      objective_type: obj.objective_type || 'short_term',
      priority: obj.priority || 2,
      target_date: obj.target_date || null,
      status: 'active'
    }));

    const { data: insertedObjectives, error: insertError } = await supabase
      .from('company_objectives')
      .insert(objectivesToInsert)
      .select();

    if (insertError) {
      console.error('❌ Error inserting objectives:', insertError);
      throw new Error('Failed to save objectives');
    }

    console.log('💾 Objectives saved to database');

    return new Response(
      JSON.stringify({
        success: true,
        objectives: insertedObjectives,
        count: insertedObjectives?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in generate-business-objectives:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: error.message.includes('required') || error.message.includes('Invalid') ? 400 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
