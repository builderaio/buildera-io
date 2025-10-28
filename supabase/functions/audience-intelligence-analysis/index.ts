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

    // 5. Invocar función universal de IA con estructura compatible con content-insights-generator
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'audience_intelligence_analysis',
        messages: [{
          role: 'system',
          content: `Eres un experto en marketing digital y análisis de audiencias. Analiza los datos de redes sociales y genera insights ESPECÍFICOS para esta empresa.

INSTRUCCIONES CRÍTICAS:
1. **OBLIGATORIO**: Usa el nombre de la empresa, su industria y estrategia en tus análisis
2. **OBLIGATORIO**: Si hay datos de redes sociales, identifica patrones específicos y oportunidades
3. Genera insights de audiencia basados en datos reales (seguidores, engagement, demografía)
4. Crea ideas de contenido ÚNICAMENTE relevantes para esta empresa e industria específica
5. NO generes ideas genéricas - personaliza TODO al contexto dado
6. Incluye formatos variados (posts, videos, carruseles, stories, reels)
7. Proporciona hashtags específicos de la industria

Debes generar EXACTAMENTE:
- 2-3 audience_insights (insights sobre la audiencia actual)
- 3-4 content_ideas (ideas de contenido personalizadas)`
        }, {
          role: 'user',
          content: `Analiza los datos y genera insights y contenido ESPECÍFICO para esta empresa.\n\nDATOS:\n${JSON.stringify(analysisInput, null, 2)}\n\nUsa la herramienta emit_insights.`
        }],
        tools: [
          {
            type: 'function',
            function: {
              name: 'emit_insights',
              description: 'Devuelve insights de audiencia e ideas de contenido estructuradas',
              parameters: {
                type: 'object',
                properties: {
                  audience_insights: {
                    type: 'array',
                    minItems: 2,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Título del insight sobre la audiencia' },
                        strategy: { type: 'string', description: 'Descripción del insight y su implicación estratégica' }
                      },
                      required: ['title', 'strategy']
                    }
                  },
                  content_ideas: {
                    type: 'array',
                    minItems: 3,
                    maxItems: 4,
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Título específico del contenido' },
                        format: { type: 'string', description: 'Formato: post/video/carrusel/story/reel' },
                        platform: { type: 'string', enum: ['instagram', 'linkedin', 'tiktok', 'facebook', 'twitter'], description: 'Plataforma recomendada' },
                        hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags específicos de la industria' },
                        timing: { type: 'string', description: 'Hora/día sugerido (ej: Lunes 10:00 AM)' },
                        strategy: { type: 'string', description: 'Por qué esta idea es relevante para esta empresa' }
                      },
                      required: ['title', 'format', 'platform', 'strategy']
                    }
                  }
                },
                required: ['audience_insights', 'content_ideas']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'emit_insights' } },
        max_completion_tokens: 3000
      }
    });

    if (aiError) {
      console.error('❌ AI analysis error:', aiError);
      throw aiError;
    }

    console.log('✅ AI analysis completed');

    // Parse structured output from tool_calls (misma lógica que content-insights-generator)
    let structuredInsights: any = null;
    
    try {
      const toolCall = (
        aiResponse?.choices?.[0]?.message?.tool_calls?.[0] ??
        aiResponse?.response?.choices?.[0]?.message?.tool_calls?.[0] ??
        aiResponse?.data?.choices?.[0]?.message?.tool_calls?.[0]
      );

      if (toolCall?.function?.name === 'emit_insights') {
        const args = toolCall.function.arguments;
        structuredInsights = typeof args === 'string' ? JSON.parse(args) : args;
        console.log('✅ Generated structured insights:', JSON.stringify(structuredInsights, null, 2));
      } else {
        console.warn('⚠️ No tool_calls found in AI response');
        throw new Error('AI did not use emit_insights tool');
      }

      // Validar estructura
      if (!structuredInsights?.audience_insights || !Array.isArray(structuredInsights.audience_insights)) {
        throw new Error('Missing audience_insights array');
      }
      if (!structuredInsights?.content_ideas || !Array.isArray(structuredInsights.content_ideas)) {
        throw new Error('Missing content_ideas array');
      }

    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      console.error('Full response:', JSON.stringify(aiResponse, null, 2).slice(0, 2000));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response', 
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    // 6. Guardar insights en content_insights (misma tabla que content-insights-generator)
    const insightsToSave = [];
    
    // Preparar audience insights
    if (structuredInsights?.audience_insights && Array.isArray(structuredInsights.audience_insights)) {
      for (const insight of structuredInsights.audience_insights) {
        insightsToSave.push({
          user_id: userId,
          insight_type: 'audience',
          title: insight.title,
          content: insight.strategy,
          status: 'active',
          source: 'ai_generated',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          metadata: {
            strategy: insight.strategy,
            context: {
              company_name: company?.name,
              company_id: companyId,
              platform: 'multi-platform',
              analysis_type: 'audience_intelligence'
            }
          }
        });
      }
    }
    
    // Preparar content ideas
    if (structuredInsights?.content_ideas && Array.isArray(structuredInsights.content_ideas)) {
      for (const idea of structuredInsights.content_ideas) {
        insightsToSave.push({
          user_id: userId,
          insight_type: 'content_idea',
          title: idea.title,
          content: idea.strategy,
          format: idea.format,
          platform: idea.platform,
          hashtags: idea.hashtags || [],
          timing: idea.timing,
          status: 'active',
          source: 'ai_generated',
          created_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          metadata: {
            strategy: idea.strategy,
            context: {
              company_name: company?.name,
              company_id: companyId,
              analysis_type: 'audience_intelligence'
            }
          }
        });
      }
    }

    // Bulk insert insights
    let savedInsightsIds: string[] = [];
    if (insightsToSave.length > 0) {
      try {
        console.log(`🔍 Attempting to insert ${insightsToSave.length} insights...`);
        console.log('📋 Sample insight:', JSON.stringify(insightsToSave[0], null, 2));
        
        const { data: savedInsights, error: saveError } = await supabase
          .from('content_insights')
          .insert(insightsToSave)
          .select('id');

        if (saveError) {
          console.error('❌ Error saving insights:', JSON.stringify(saveError, null, 2));
          throw new Error(`Failed to save insights: ${saveError.message}`);
        } else {
          savedInsightsIds = (savedInsights || []).map((insight: any) => insight.id);
          console.log(`✅ Successfully saved ${savedInsightsIds.length} insights with IDs:`, savedInsightsIds);
        }
      } catch (saveError) {
        console.error('❌ Exception in bulk insert:', saveError);
        throw saveError;
      }
    } else {
      console.log('⚠️ No insights to save - insightsToSave array is empty');
    }

    console.log('💾 Insights saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        audience_insights: structuredInsights?.audience_insights || [],
        content_ideas: structuredInsights?.content_ideas || [],
        saved_insights_ids: savedInsightsIds,
        context_analyzed: {
          company_name: company?.name,
          social_accounts: socialAnalysis?.length || 0,
          total_followers: socialAnalysis?.reduce((sum: number, sa: any) => 
            sum + (sa.users_count || sa.followers_count || 0), 0) || 0,
        }
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
