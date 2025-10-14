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

    const { userId, companyId } = await req.json();

    if (!userId || !companyId) {
      throw new Error('Missing required parameters: userId or companyId');
    }

    console.log('🎯 Starting audience intelligence analysis for user:', userId);

    // 1. Obtener datos de la empresa
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, description, industry_sector, country, website_url, company_size')
      .eq('id', companyId)
      .maybeSingle();

    // 2. Obtener análisis de redes sociales
    const { data: socialAnalysis } = await supabase
      .from('social_analysis')
      .select('*')
      .eq('user_id', userId);

    // 3. Obtener estrategia de la empresa
    const { data: strategy } = await supabase
      .from('company_strategy')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    // 4. Preparar datos para el análisis con IA
    const analysisInput = {
      empresa: {
        nombre: company?.name,
        descripcion: company?.description,
        industria: company?.industry_sector,
        pais: company?.country,
        tamaño: company?.company_size,
        sitio_web: company?.website_url,
      },
      estrategia: strategy ? {
        propuesta_valor: strategy.value_proposition,
        mensajes_clave: strategy.key_messages,
        ventajas_competitivas: strategy.competitive_advantages,
        objetivos: strategy.objectives,
        vision: strategy.vision,
        mision: strategy.mission,
      } : null,
      redes_sociales: socialAnalysis?.map(sa => ({
        plataforma: sa.social_type,
        seguidores: sa.users_count || sa.followers_count || 0,
        nombre_cuenta: sa.name,
        verificada: sa.verified,
        datos_demograficos: sa.platform_data,
        datos_brutos: sa.raw_data,
      })) || [],
    };

    console.log('📊 Calling AI for audience intelligence analysis...');

    // 5. Invocar función universal de IA (con tool calling para JSON estructurado)
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'audience_intelligence_analysis',
        messages: [{
          role: 'system',
          content: `Eres un analista experto de audiencias digitales y estrategia de marketing. Analiza los datos de redes sociales de la empresa junto con su información estratégica.

INSTRUCCIONES ESPECÍFICAS:
1. Genera entre 5 y 7 INSIGHTS CLAVE sobre la audiencia actual de la empresa basándote en los datos de sus redes sociales.
2. Proporciona entre 6 y 8 RECOMENDACIONES ESTRATÉGICAS accionables para mejorar el alcance y engagement.
3. Elabora un ANÁLISIS DETALLADO que incluya fortalezas, debilidades, oportunidades, amenazas y tendencias emergentes.

Enfócate en insights prácticos y recomendaciones específicas basadas en los datos reales de las redes sociales analizadas.`
        }, {
          role: 'user',
          content: `Analiza los datos de redes sociales y genera insights estratégicos.\n\nDATOS DE ENTRADA:\n${JSON.stringify(analysisInput, null, 2)}\n\nDevuelve la respuesta usando la herramienta audience_insights.`
        }],
        tools: [
          {
            type: 'function',
            function: {
              name: 'audience_insights',
              description: 'Devuelve insights de audiencia en formato estructurado',
              parameters: {
                type: 'object',
                properties: {
                  key_insights: {
                    type: 'array',
                    description: 'Entre 5 y 7 insights clave sobre la audiencia',
                    minItems: 5,
                    maxItems: 7,
                    items: {
                      type: 'object',
                      properties: {
                        categoria: { type: 'string', description: 'Categoría del insight (ej: Demográfico, Comportamental, etc.)' },
                        insight: { type: 'string', description: 'El insight principal' },
                        evidencia: { type: 'string', description: 'Datos que respaldan este insight' },
                        implicacion: { type: 'string', description: 'Qué significa esto para la estrategia' }
                      },
                      required: ['categoria', 'insight', 'evidencia', 'implicacion']
                    }
                  },
                  recommendations: {
                    type: 'array',
                    description: 'Entre 6 y 8 recomendaciones estratégicas accionables',
                    minItems: 6,
                    maxItems: 8,
                    items: {
                      type: 'object',
                      properties: {
                        tipo: { type: 'string', description: 'Tipo de recomendación (Contenido, Segmentación, Timing, etc.)' },
                        prioridad: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
                        titulo: { type: 'string', description: 'Título de la recomendación' },
                        descripcion: { type: 'string', description: 'Descripción detallada' },
                        accion_especifica: { type: 'string', description: 'Acción concreta a tomar' },
                        impacto_esperado: { type: 'string', description: 'Impacto esperado de implementar esta recomendación' },
                        metricas_seguimiento: { type: 'array', items: { type: 'string' }, description: 'Métricas para medir el éxito' }
                      },
                      required: ['tipo', 'prioridad', 'titulo', 'descripcion', 'accion_especifica']
                    }
                  },
                  detailed_analysis: {
                    type: 'object',
                    description: 'Análisis FODA detallado y tendencias',
                    properties: {
                      fortalezas: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Fortalezas identificadas en la presencia digital'
                      },
                      debilidades: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Áreas de mejora en la presencia digital'
                      },
                      oportunidades: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Oportunidades de crecimiento identificadas'
                      },
                      amenazas: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Amenazas o riesgos potenciales'
                      },
                      tendencias_emergentes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Tendencias emergentes relevantes para la audiencia'
                      }
                    },
                    required: ['fortalezas', 'debilidades', 'oportunidades', 'amenazas']
                  }
                },
                required: ['key_insights', 'recommendations', 'detailed_analysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'audience_insights' } },
        max_completion_tokens: 4000
      }
    });

    if (aiError) {
      console.error('❌ AI analysis error:', aiError);
      throw aiError;
    }

    console.log('✅ AI analysis completed');
    console.log('🔍 Full AI Response:', JSON.stringify(aiResponse, null, 2).slice(0, 2000));

    let parsedInsights;
    try {
      // Intentar extraer tool_calls arguments (preferred)
      const toolArgs = (
        aiResponse?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
        aiResponse?.response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
        aiResponse?.data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
      );

      if (toolArgs) {
        console.log('✅ Found tool_calls arguments');
        parsedInsights = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;
      } else {
        // Fallback: extraer content
        const contentCandidate = (
          aiResponse?.choices?.[0]?.message?.content ??
          aiResponse?.response?.choices?.[0]?.message?.content ??
          aiResponse?.data?.choices?.[0]?.message?.content ??
          aiResponse?.response  // Caso especial donde response es string directo
        );

        console.log('⚠️ No tool_calls found, trying to extract from content');
        console.log('Content preview:', String(contentCandidate).slice(0, 500));

        if (!contentCandidate) {
          console.error('❌ AI response structure:', JSON.stringify(aiResponse, null, 2).slice(0, 2000));
          throw new Error('Empty AI response - no tool_calls or content found');
        }

        const contentStr = String(contentCandidate);
        const cleaned = contentStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Si la respuesta es un string JSON directo
        if (cleaned.startsWith('{') && cleaned.includes('audience_segments')) {
          try {
            parsedInsights = JSON.parse(cleaned);
            console.log('✅ Parsed JSON directly from content');
          } catch {
            const first = cleaned.indexOf('{');
            const last = cleaned.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
              parsedInsights = JSON.parse(cleaned.slice(first, last + 1));
              console.log('✅ Extracted and parsed JSON from content');
            } else {
              throw new Error('Could not extract valid JSON from content');
            }
          }
        } else {
          // Si no es JSON estructurado, construir objeto de fallback con el texto
          console.log('⚠️ Response is plain text, creating fallback structure');
          parsedInsights = {
            key_insights: [{
              categoria: 'General',
              insight: contentStr.slice(0, 500),
              evidencia: 'Análisis basado en datos de redes sociales',
              implicacion: 'Revisar análisis completo'
            }],
            recommendations: [{
              tipo: 'Estrategia General',
              prioridad: 'Media',
              titulo: 'Análisis disponible',
              descripcion: 'El análisis completo está disponible en el texto generado',
              accion_especifica: 'Revisar recomendaciones detalladas'
            }],
            detailed_analysis: {
              fortalezas: ['Análisis generado por IA'],
              debilidades: [],
              oportunidades: [],
              amenazas: [],
              tendencias_emergentes: []
            },
            raw_text: contentStr
          };
        }
      }

      // Validar estructura mínima
      if (!parsedInsights.key_insights || !Array.isArray(parsedInsights.key_insights)) {
        console.warn('⚠️ Missing key_insights, adding default');
        parsedInsights.key_insights = [{
          categoria: 'General',
          insight: 'Análisis generado',
          evidencia: 'Basado en datos disponibles',
          implicacion: 'Requiere análisis más profundo'
        }];
      }

      console.log('✅ Successfully parsed insights with', parsedInsights.key_insights?.length, 'key insights');

    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      console.error('Full response:', JSON.stringify(aiResponse, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          details: parseError instanceof Error ? parseError.message : String(parseError),
          raw_response: JSON.stringify(aiResponse).slice(0, 1000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    // 6. Guardar insights en la base de datos
    const totalFollowers = socialAnalysis?.reduce((sum: number, sa: any) => 
      sum + (sa.users_count || sa.followers_count || 0), 0) || 0;

    const { data: savedInsight, error: saveError } = await supabase
      .from('audience_insights')
      .upsert({
        user_id: userId,
        platform: 'multi-platform',
        insight_type: 'ai_generated',
        ai_generated_insights: parsedInsights.detailed_analysis,
        ai_recommendations: parsedInsights.recommendations,
        raw_insights: {
          key_insights: parsedInsights.key_insights,
          analysis_timestamp: new Date().toISOString(),
          company_info: analysisInput.empresa,
          strategy_info: analysisInput.estrategia,
        },
        last_ai_analysis_at: new Date().toISOString(),
        confidence_level: 85,
        sample_size: totalFollowers,
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
