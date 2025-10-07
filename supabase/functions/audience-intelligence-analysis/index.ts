import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, companyId, socialStats } = await req.json();

    if (!userId || !companyId || !socialStats) {
      throw new Error('Missing required parameters: userId, companyId, or socialStats');
    }

    console.log('🎯 Starting audience intelligence analysis for user:', userId);

    // 1. Obtener datos de la empresa
    const { data: company } = await supabase
      .from('companies')
      .select('name, description, industry_sector, country, values, target_market')
      .eq('id', companyId)
      .single();

    // 2. Obtener audiencias definidas
    const { data: audiences } = await supabase
      .from('company_audiences')
      .select('*')
      .eq('company_id', companyId);

    // 3. Obtener estrategia de la empresa
    const { data: strategy } = await supabase
      .from('company_strategy')
      .select('value_proposition, key_messages, competitive_advantages')
      .eq('company_id', companyId)
      .single();

    // 4. Preparar datos para el análisis con IA
    const analysisInput = {
      empresa: {
        nombre: company?.name,
        descripcion: company?.description,
        industria: company?.industry_sector,
        pais: company?.country,
        valores: company?.values,
        mercado_objetivo: company?.target_market,
      },
      audiencias_definidas: audiences?.map(a => ({
        nombre: a.name,
        descripcion: a.description,
        demografia: {
          genero: a.gender_split,
          edades: a.age_ranges,
          ubicaciones: a.geographic_locations,
        },
        psicografia: {
          intereses: a.interests,
          motivaciones: a.motivations,
          desafios: a.challenges,
          objetivos: a.goals,
        },
        comportamiento: {
          canales_preferidos: a.preferred_channels,
          titulos_trabajo: a.job_titles,
        },
      })) || [],
      estrategia: strategy ? {
        propuesta_valor: strategy.value_proposition,
        mensajes_clave: strategy.key_messages,
        ventajas_competitivas: strategy.competitive_advantages,
      } : null,
      datos_sociales: socialStats,
    };

    console.log('📊 Calling AI for audience intelligence analysis...');

    // 5. Invocar función universal de IA
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'audience_intelligence_analysis',
        messages: [{
          role: 'user',
          content: `Analiza esta audiencia de redes sociales y genera insights profundos:

DATOS DE ENTRADA:
${JSON.stringify(analysisInput, null, 2)}

INSTRUCCIONES:
Genera un análisis completo de audiencia que incluya:

1. SEGMENTOS DE AUDIENCIA (3-5 segmentos bien definidos):
   - Nombre del segmento
   - Tamaño estimado (%)
   - Características demográficas
   - Características psicográficas
   - Comportamiento en redes sociales
   - Potencial de conversión (1-10)
   - Canales preferidos

2. INSIGHTS CLAVE (5-7 insights accionables):
   - Patrones de comportamiento únicos
   - Preferencias de contenido
   - Momentos de mayor engagement
   - Barreras de conversión
   - Oportunidades sin explotar

3. RECOMENDACIONES ESTRATÉGICAS (6-8 recomendaciones):
   - Tipo: "contenido", "targeting", "timing", "canal", "mensaje"
   - Prioridad: "alta", "media", "baja"
   - Impacto esperado
   - Acción específica
   - Segmento objetivo

4. ANÁLISIS DETALLADO:
   - Fortalezas de la audiencia actual
   - Debilidades o gaps
   - Oportunidades de crecimiento
   - Amenazas o riesgos
   - Tendencias emergentes

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura:
{
  "audience_segments": [
    {
      "nombre": "string",
      "porcentaje": number,
      "descripcion": "string",
      "demografia": { "edad_promedio": "string", "genero_predominante": "string", "ubicacion_principal": "string" },
      "psicografia": { "intereses_clave": ["string"], "valores": ["string"], "estilo_vida": "string" },
      "comportamiento_social": { "plataformas_activas": ["string"], "horarios_pico": ["string"], "tipo_contenido_preferido": ["string"] },
      "potencial_conversion": number,
      "canales_preferidos": ["string"]
    }
  ],
  "key_insights": [
    {
      "categoria": "string",
      "insight": "string",
      "evidencia": "string",
      "implicacion": "string"
    }
  ],
  "recommendations": [
    {
      "tipo": "string",
      "prioridad": "string",
      "titulo": "string",
      "descripcion": "string",
      "accion_especifica": "string",
      "segmento_objetivo": "string",
      "impacto_esperado": "string",
      "metricas_seguimiento": ["string"]
    }
  ],
  "detailed_analysis": {
    "fortalezas": ["string"],
    "debilidades": ["string"],
    "oportunidades": ["string"],
    "amenazas": ["string"],
    "tendencias_emergentes": ["string"]
  }
}`
        }]
      }
    });

    if (aiError) {
      console.error('❌ AI analysis error:', aiError);
      throw aiError;
    }

    console.log('✅ AI analysis completed');

    let parsedInsights;
    try {
      const content = aiResponse.choices[0].message.content;
      // Limpiar markdown si existe
      const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedInsights = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response');
    }

    // 6. Guardar insights en la base de datos
    const { data: savedInsight, error: saveError } = await supabase
      .from('audience_insights')
      .upsert({
        user_id: userId,
        platform: 'multi-platform',
        insight_type: 'ai_generated',
        ai_generated_insights: parsedInsights.detailed_analysis,
        ai_recommendations: parsedInsights.recommendations,
        audience_segments: parsedInsights.audience_segments,
        raw_insights: {
          key_insights: parsedInsights.key_insights,
          analysis_timestamp: new Date().toISOString(),
        },
        last_ai_analysis_at: new Date().toISOString(),
        confidence_level: 85,
        sample_size: Object.values(socialStats).reduce((sum: number, stat: any) => 
          sum + (stat.followers || 0), 0
        ),
      }, {
        onConflict: 'user_id,platform,insight_type'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving insights:', saveError);
      throw saveError;
    }

    console.log('💾 Insights saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        insights: parsedInsights,
        saved_insight_id: savedInsight.id,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in audience-intelligence-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
