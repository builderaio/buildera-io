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

    // Get company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, description, industry_sector, website_url')
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

    console.log('📋 Company data loaded:', company.name);

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

    const userPrompt = `Empresa: ${company.name}
Industria: ${company.industry_sector || 'No especificada'}
Descripción: ${company.description || 'No disponible'}
Sitio web: ${company.website_url || 'No disponible'}
${strategy?.mision ? `Misión: ${strategy.mision}` : ''}
${strategy?.vision ? `Visión: ${strategy.vision}` : ''}
${strategy?.propuesta_valor ? `Propuesta de valor: ${strategy.propuesta_valor}` : ''}

Genera objetivos empresariales estratégicos basados en esta información.`;

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
