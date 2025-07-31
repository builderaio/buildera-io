import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🧠 Instagram Intelligent Analysis request received')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Obtain the authenticated user
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

    console.log('🔍 Starting intelligent analysis for user:', userId)

    // Get Instagram posts from database
    const { data: instagramPosts, error: postsError } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(50);

    if (postsError) {
      console.error('Error fetching Instagram posts:', postsError);
      throw new Error(`Error fetching Instagram posts: ${postsError.message}`);
    }

    if (!instagramPosts || instagramPosts.length === 0) {
      console.log('⚠️ No Instagram posts found for analysis')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Instagram posts found for analysis',
          insights_generated: 0,
          actionables_generated: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📊 Analyzing', instagramPosts.length, 'posts')

    // Calculate general metrics
    const totalPosts = instagramPosts.length
    const totalLikes = instagramPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
    const totalComments = instagramPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    const avgLikes = Math.round(totalLikes / totalPosts)
    const avgComments = Math.round(totalComments / totalPosts)
    const avgEngagement = instagramPosts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / totalPosts

    // Prepare posts for analysis
    const postsForAnalysis = instagramPosts.map(post => ({
      caption: post.caption || '',
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      posted_at: post.posted_at,
      engagement_rate: post.engagement_rate || 0,
      hashtags: post.hashtags || []
    }));

    console.log('🤖 Calling OpenAI for intelligent analysis');

    // Call OpenAI for intelligent analysis
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un experto analista de marketing de Instagram. Analiza los siguientes posts de Instagram y genera insights accionables en español. 
            
            Para cada insight que generes, incluye:
            1. Un título claro y específico
            2. Una descripción detallada del insight
            3. El tipo de insight (engagement, content_performance, timing, audience, hashtags, etc.)
            4. El nivel de impacto (high, medium, low)
            5. Una puntuación de confianza (0.0-1.0)
            6. Datos específicos que respalden el insight
            7. Recomendaciones accionables específicas

            Enfócate en:
            - Patrones de engagement
            - Mejores horarios de publicación
            - Tipos de contenido que funcionan mejor
            - Análisis de hashtags efectivos
            - Optimización visual del contenido
            - Estrategias de crecimiento de seguidores`
          },
          {
            role: 'user',
            content: `Analiza estos posts de Instagram y genera insights accionables:
            
            Métricas generales:
            - Total posts: ${totalPosts}
            - Promedio likes: ${avgLikes}
            - Promedio comentarios: ${avgComments}
            - Engagement promedio: ${avgEngagement.toFixed(2)}%
            
            Posts: ${JSON.stringify(postsForAnalysis, null, 2)}
            
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
                  "platforms": ["instagram"]
                }
              ],
              "actionables": [
                {
                  "title": "Acción recomendada",
                  "description": "Descripción de la acción",
                  "action_type": "content_optimization|timing|strategy|hashtags",
                  "priority": "urgent|high|medium|low",
                  "estimated_impact": "Impacto estimado"
                }
              ]
            }`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const aiResult = await openaiResponse.json();
    console.log('✅ OpenAI analysis completed');

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResult.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Error parsing AI analysis result');
    }

    let insightsCreated = 0;
    let actionablesCreated = 0;

    // Save insights to database
    if (analysisResult.insights && analysisResult.insights.length > 0) {
      for (const insight of analysisResult.insights) {
        const { error: insightError } = await supabase
          .from('marketing_insights')
          .insert({
            user_id: userId,
            insight_type: insight.insight_type || 'instagram_analysis',
            title: insight.title,
            description: insight.description,
            data: insight.data || {},
            confidence_score: insight.confidence_score || 0.8,
            impact_level: insight.impact_level || 'medium',
            platforms: insight.platforms || ['instagram']
          });

        if (insightError) {
          console.error('Error saving insight:', insightError);
        } else {
          insightsCreated++;
        }
      }
    }

    // Save actionables to database
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

    console.log(`✅ Instagram analysis completed: ${insightsCreated} insights, ${actionablesCreated} actionables created`);

    return new Response(
      JSON.stringify({
        success: true,
        platform: 'instagram',
        insights_generated: insightsCreated,
        actionables_generated: actionablesCreated,
        posts_analyzed: instagramPosts.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Instagram intelligent analysis error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        insights_generated: 0,
        actionables_generated: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})