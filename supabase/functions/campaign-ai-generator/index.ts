import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { companyId } = await req.json();
    console.log('🎯 Generating AI campaigns for company:', companyId);

    // Fetch company data
    const [companyRes, objectivesRes, audiencesRes, analysisRes, strategyRes] = await Promise.all([
      supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single(),
      
      supabase
        .from('company_objectives')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('priority', { ascending: true }),
      
      supabase
        .from('company_audiences')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true),
      
      supabase
        .from('audience_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      
      supabase
        .from('company_strategy')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle()
    ]);

    if (companyRes.error) {
      throw new Error('Company not found');
    }

    const company = companyRes.data;
    const objectives = objectivesRes.data || [];
    const audiences = audiencesRes.data || [];
    const analysis = analysisRes.data || [];
    const strategy = strategyRes.data;

    // Prepare context for AI
    const context = {
      empresa: {
        nombre: company.name,
        industria: company.industry_sector,
        descripcion: company.description,
        sitio_web: company.website_url,
        pais: company.country,
        tamaño: company.company_size
      },
      objetivos_negocio: objectives.map(obj => ({
        titulo: obj.title,
        descripcion: obj.description,
        tipo: obj.objective_type,
        prioridad: obj.priority,
        fecha_objetivo: obj.target_date
      })),
      audiencias_creadas: audiences.map(aud => ({
        nombre: aud.name,
        descripcion: aud.description,
        rangos_edad: aud.age_ranges,
        ubicaciones: aud.geographic_locations,
        intereses: aud.interests,
        plataformas_preferidas: aud.platform_preferences,
        patrones_engagement: aud.engagement_patterns
      })),
      analisis_audiencia: analysis.map(a => ({
        plataforma: a.platform,
        insights: a.insights,
        fecha: a.created_at
      })),
      estrategia_empresa: strategy ? {
        propuesta_valor: strategy.propuesta_valor,
        vision: strategy.vision,
        mision: strategy.mision
      } : null
    };

    // Determine company maturity
    const socialConnections = await Promise.all([
      supabase.from('linkedin_connections').select('id').eq('user_id', user.id).limit(1),
      supabase.from('facebook_instagram_connections').select('id').eq('user_id', user.id).limit(1),
      supabase.from('tiktok_connections').select('id').eq('user_id', user.id).limit(1)
    ]);

    const hasConnections = socialConnections.some(conn => conn.data && conn.data.length > 0);
    const companyMaturity = hasConnections ? 'madura' : 'nueva_en_redes';

    console.log('📊 Company context prepared:', {
      objectives: objectives.length,
      audiences: audiences.length,
      analysis: analysis.length,
      maturity: companyMaturity
    });

    // Generate campaigns with GPT-4.1
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        max_completion_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `Eres un experto estratega de marketing digital. Genera campañas de marketing personalizadas basadas en la información de la empresa, sus objetivos, audiencias y nivel de madurez en redes sociales.

CONTEXTO DE LA EMPRESA:
- Madurez en redes sociales: ${companyMaturity}
- Empresa: ${context.empresa.nombre}
- Industria: ${context.empresa.industria}
- País: ${context.empresa.pais}

INSTRUCCIONES:
1. Analiza los objetivos de negocio y priorízalos por importancia
2. Considera las audiencias existentes para segmentación
3. Adapta las campañas al nivel de madurez (nueva vs. madura)
4. Genera 3-5 campañas específicas y accionables
5. Prioriza las campañas según los objetivos más importantes

Para empresas NUEVAS EN REDES: enfócate en awareness, construcción de comunidad, contenido educativo
Para empresas MADURAS: optimización de conversión, retargeting, campañas avanzadas de performance

FORMATO DE RESPUESTA (JSON estricto):
{
  "campañas_recomendadas": [
    {
      "nombre": "Nombre descriptivo de la campaña",
      "tipo_objetivo": "awareness|engagement|leads|sales|traffic",
      "prioridad": 1-5,
      "duracion_recomendada": "1-month|3-months|6-months",
      "presupuesto_sugerido": 1000,
      "audiencia_objetivo": "nombre de audiencia existente o nueva",
      "descripcion": "Descripción detallada de la campaña",
      "tacticas_clave": ["táctica1", "táctica2", "táctica3"],
      "kpis_principales": ["kpi1", "kpi2", "kpi3"],
      "justificacion": "Por qué esta campaña es importante para esta empresa"
    }
  ],
  "estrategia_general": "Resumen de la estrategia recomendada",
  "recomendaciones_especiales": ["recomendación1", "recomendación2"],
  "siguiente_paso": "Acción específica a tomar primero"
}`
          },
          {
            role: 'user',
            content: `Genera campañas de marketing para esta empresa:

DATOS DE LA EMPRESA:
${JSON.stringify(context, null, 2)}

MADUREZ EN REDES SOCIALES: ${companyMaturity}

Por favor genera campañas específicas, priorizadas y adaptadas a su contexto.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;
    
    console.log('🤖 AI Response received:', generatedContent.substring(0, 500));

    let campaignSuggestions;
    try {
      campaignSuggestions = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Log the analysis
    await supabase
      .from('ai_model_status_logs')
      .insert({
        name: 'campaign-generator',
        provider: 'openai',
        status: 'success',
        response_time: Date.now(),
        uptime: 100,
        error_rate: 0
      });

    return new Response(JSON.stringify({
      success: true,
      ...campaignSuggestions,
      contexto_analizado: {
        objetivos_encontrados: objectives.length,
        audiencias_encontradas: audiences.length,
        madurez_empresa: companyMaturity,
        tiene_estrategia: !!strategy
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in campaign-ai-generator:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});