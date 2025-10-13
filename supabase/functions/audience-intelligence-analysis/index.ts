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
      .select('id, name, description, industry_sector, country, website_url, company_size')
      .eq('id', companyId)
      .maybeSingle();

    // 2. Obtener audiencias definidas
    const { data: audiences } = await supabase
      .from('company_audiences')
      .select('*')
      .eq('company_id', companyId);

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

    // 5. Invocar función universal de IA (con tool calling para JSON estructurado)
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'audience_intelligence_analysis',
        messages: [{
          role: 'user',
          content: `Analiza esta audiencia de redes sociales y genera insights profundos.\n\nDATOS DE ENTRADA:\n${JSON.stringify(analysisInput, null, 2)}\n\nDevuelve la respuesta usando la herramienta audience_insights.`
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
                  audience_segments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        nombre: { type: 'string' },
                        porcentaje: { type: 'number' },
                        descripcion: { type: 'string' },
                        demografia: {
                          type: 'object',
                          properties: {
                            edad_promedio: { type: 'string' },
                            genero_predominante: { type: 'string' },
                            ubicacion_principal: { type: 'string' }
                          }
                        },
                        psicografia: {
                          type: 'object',
                          properties: {
                            intereses_clave: { type: 'array', items: { type: 'string' } },
                            valores: { type: 'array', items: { type: 'string' } },
                            estilo_vida: { type: 'string' }
                          }
                        },
                        comportamiento_social: {
                          type: 'object',
                          properties: {
                            plataformas_activas: { type: 'array', items: { type: 'string' } },
                            horarios_pico: { type: 'array', items: { type: 'string' } },
                            tipo_contenido_preferido: { type: 'array', items: { type: 'string' } }
                          }
                        },
                        potencial_conversion: { type: 'number' },
                        canales_preferidos: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['nombre', 'porcentaje']
                    }
                  },
                  key_insights: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        categoria: { type: 'string' },
                        insight: { type: 'string' },
                        evidencia: { type: 'string' },
                        implicacion: { type: 'string' }
                      },
                      required: ['insight']
                    }
                  },
                  recommendations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        tipo: { type: 'string' },
                        prioridad: { type: 'string' },
                        titulo: { type: 'string' },
                        descripcion: { type: 'string' },
                        accion_especifica: { type: 'string' },
                        segmento_objetivo: { type: 'string' },
                        impacto_esperado: { type: 'string' },
                        metricas_seguimiento: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  detailed_analysis: {
                    type: 'object',
                    properties: {
                      fortalezas: { type: 'array', items: { type: 'string' } },
                      debilidades: { type: 'array', items: { type: 'string' } },
                      oportunidades: { type: 'array', items: { type: 'string' } },
                      amenazas: { type: 'array', items: { type: 'string' } },
                      tendencias_emergentes: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                required: ['audience_segments', 'key_insights', 'recommendations', 'detailed_analysis']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'audience_insights' } },
        max_completion_tokens: 1200
      }
    });

    if (aiError) {
      console.error('❌ AI analysis error:', aiError);
      throw aiError;
    }

    console.log('✅ AI analysis completed');

    let parsedInsights;
    try {
      const contentCandidate = (
        aiResponse?.choices?.[0]?.message?.content ??
        aiResponse?.response?.choices?.[0]?.message?.content ??
        aiResponse?.data?.choices?.[0]?.message?.content
      );

      const toolArgs = (
        aiResponse?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
        aiResponse?.response?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
        aiResponse?.data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments
      );

      if (toolArgs) {
        parsedInsights = JSON.parse(toolArgs);
      } else if (contentCandidate) {
        const cleaned = String(contentCandidate).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
          parsedInsights = JSON.parse(cleaned);
        } catch {
          const first = cleaned.indexOf('{');
          const last = cleaned.lastIndexOf('}');
          if (first !== -1 && last !== -1 && last > first) {
            parsedInsights = JSON.parse(cleaned.slice(first, last + 1));
          } else {
            throw new Error('No JSON content found in model response');
          }
        }
      } else {
        console.error('AI response structure unexpected:', JSON.stringify(aiResponse)?.slice(0, 1000));
        throw new Error('Empty AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', details: parseError instanceof Error ? parseError.message : String(parseError) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
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
          sample_size: Array.isArray(socialStats)
            ? socialStats.reduce((sum: number, stat: any) => sum + (stat.followers || stat.users_count || 0), 0)
            : Object.values(socialStats).reduce((sum: number, stat: any) => sum + (stat.followers || stat.users_count || 0), 0),
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
