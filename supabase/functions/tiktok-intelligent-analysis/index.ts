import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🧠 TikTok Intelligent Analysis request received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener el usuario autenticado
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      
      if (!userError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      console.error('❌ No authenticated user found');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Starting intelligent analysis for user:', userId);

    // Obtener posts de TikTok de la base de datos
    const { data: tiktokPosts, error: postsError } = await supabase
      .from('tiktok_posts')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(50);

    if (postsError) {
      console.error('Error fetching TikTok posts:', postsError);
      throw new Error(`Error fetching TikTok posts: ${postsError.message}`);
    }

    if (!tiktokPosts || tiktokPosts.length === 0) {
      console.log('⚠️ No TikTok posts found for analysis');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No TikTok posts found for analysis',
          insights_generated: 0
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('📊 Analyzing', tiktokPosts.length, 'posts');

    // Preparar datos para análisis con OpenAI
    const postsForAnalysis = tiktokPosts.map(post => ({
      title: post.title || '',
      digg_count: post.digg_count || 0,
      comment_count: post.comment_count || 0,
      share_count: post.share_count || 0,
      play_count: post.play_count || 0,
      duration: post.duration || 0,
      posted_at: post.posted_at,
      is_ad: post.is_ad || false
    }));

    console.log('🤖 Calling Universal AI Handler for intelligent analysis');

    // Call Universal AI Handler for intelligent analysis
    const aiResponse = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'tiktok_intelligent_analysis',
        messages: [
          {
            role: 'system',
            content: `Eres un experto analista de marketing de TikTok. Analiza los siguientes videos de TikTok y genera insights accionables en español. 
            
            Para cada insight que generes, incluye:
            1. Un título claro y específico
            2. Una descripción detallada del insight
            3. El tipo de insight (engagement, content_performance, timing, audience, viral_potential, etc.)
            4. El nivel de impacto (high, medium, low)
            5. Una puntuación de confianza (0.0-1.0)
            6. Datos específicos que respalden el insight
            7. Recomendaciones accionables específicas

            Enfócate en:
            - Análisis de viralidad y engagement
            - Duración óptima de videos
            - Patrones de contenido que funcionan
            - Análisis de audiencia joven
            - Tendencias y hashtags efectivos
            - Optimización para algoritmo de TikTok
            - Estrategias de contenido creativo`
          },
          {
            role: 'user',
            content: `Analiza estos videos de TikTok y genera insights accionables:
            
            Videos: ${JSON.stringify(postsForAnalysis, null, 2)}
            
            Responde en formato JSON con esta estructura:
            {
              "insights": [
                {
                  "title": "Título del insight",
                  "description": "Descripción detallada",
                  "insight_type": "tipo",
                  "impact_level": "high|medium|low",
                  "confidence_score": 0.85,
                  "data": { "datos_especificos": "valores" },
                  "platforms": ["tiktok"]
                }
              ],
              "actionables": [
                {
                  "title": "Acción recomendada",
                  "description": "Descripción de la acción",
                  "action_type": "content_optimization|timing|strategy",
                  "priority": "urgent|high|medium|low",
                  "estimated_impact": "Impacto estimado"
                }
              ]
            }`
          }
        ]
      }
    });

    if (aiResponse.error) {
      console.error('Universal AI Handler error:', aiResponse.error);
      throw new Error(`AI Analysis error: ${aiResponse.error.message}`);
    }

    console.log('✅ AI analysis completed');

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Error parsing AI analysis result');
    }

    let insightsCreated = 0;
    let actionablesCreated = 0;

    // Guardar insights en la base de datos
    if (analysisResult.insights && analysisResult.insights.length > 0) {
      for (const insight of analysisResult.insights) {
        const { error: insightError } = await supabase
          .from('marketing_insights')
          .insert({
            user_id: userId,
            insight_type: insight.insight_type || 'tiktok_analysis',
            title: insight.title,
            description: insight.description,
            data: insight.data || {},
            confidence_score: insight.confidence_score || 0.8,
            impact_level: insight.impact_level || 'medium',
            platforms: insight.platforms || ['tiktok']
          });

        if (insightError) {
          console.error('Error saving insight:', insightError);
        } else {
          insightsCreated++;
        }
      }
    }

    // Guardar actionables en la base de datos
    if (analysisResult.actionables && analysisResult.actionables.length > 0) {
      for (const actionable of analysisResult.actionables) {
        const { error: actionableError } = await supabase
          .from('marketing_actionables')
          .insert({
            user_id: userId,
            title: actionable.title,
            description: actionable.description,
            action_type: actionable.action_type || 'optimization',
            priority: actionable.priority || 'medium',
            status: 'pending',
            estimated_impact: actionable.estimated_impact
          });

        if (actionableError) {
          console.error('Error saving actionable:', actionableError);
        } else {
          actionablesCreated++;
        }
      }
    }

    console.log(`✅ TikTok analysis completed: ${insightsCreated} insights, ${actionablesCreated} actionables created`);

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'tiktok',
        insights_generated: insightsCreated,
        actionables_generated: actionablesCreated,
        posts_analyzed: tiktokPosts.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ TikTok intelligent analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        details: 'TikTok intelligent analysis failed'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});