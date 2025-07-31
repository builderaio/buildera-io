import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid user token');
    }

    console.log(`🔍 Starting Facebook intelligent analysis for user: ${user.id}`);

    // Fetch Facebook posts for the user
    const { data: facebookPosts, error: postsError } = await supabaseClient
      .from('facebook_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching Facebook posts:', postsError);
      throw new Error('Failed to fetch Facebook posts');
    }

    if (!facebookPosts || facebookPosts.length === 0) {
      console.log('No Facebook posts found for analysis');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No hay publicaciones de Facebook para analizar' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${facebookPosts.length} Facebook posts for analysis`);

    // Calculate general metrics
    const totalPosts = facebookPosts.length;
    const totalReactions = facebookPosts.reduce((sum, post) => sum + (post.reactions_count || 0), 0);
    const totalComments = facebookPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    const totalShares = facebookPosts.reduce((sum, post) => sum + (post.reshare_count || 0), 0);
    
    const avgReactions = totalReactions / totalPosts;
    const avgComments = totalComments / totalPosts;
    const avgShares = totalShares / totalPosts;
    const engagementRate = ((totalReactions + totalComments + totalShares) / totalPosts) / 1000; // Normalized

    // Analyze reaction types
    const reactionTypes = facebookPosts.reduce((acc, post) => {
      if (post.reactions) {
        const reactions = typeof post.reactions === 'string' ? JSON.parse(post.reactions) : post.reactions;
        Object.entries(reactions).forEach(([type, count]) => {
          acc[type] = (acc[type] || 0) + count;
        });
      }
      return acc;
    }, {});

    // Get recent posts for detailed analysis
    const recentPosts = facebookPosts.slice(0, 10).map(post => ({
      message: post.message || '',
      reactions_count: post.reactions_count || 0,
      comments_count: post.comments_count || 0,
      shares: post.reshare_count || 0,
      created_at: post.created_at,
      reactions: post.reactions
    }));

    console.log('📈 Calculated metrics:', {
      totalPosts,
      avgReactions: avgReactions.toFixed(2),
      avgComments: avgComments.toFixed(2),
      avgShares: avgShares.toFixed(2),
      engagementRate: (engagementRate * 100).toFixed(2) + '%'
    });

    // Prepare prompt for AI analysis
    const analysisPrompt = `
Analiza los siguientes datos de Facebook para proporcionar insights estratégicos de marketing:

MÉTRICAS GENERALES:
- Total de publicaciones: ${totalPosts}
- Promedio de reacciones: ${avgReactions.toFixed(2)}
- Promedio de comentarios: ${avgComments.toFixed(2)}
- Promedio de compartidos: ${avgShares.toFixed(2)}
- Tasa de engagement: ${(engagementRate * 100).toFixed(2)}%

DISTRIBUCIÓN DE REACCIONES:
${Object.entries(reactionTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

PUBLICACIONES RECIENTES (últimas 10):
${recentPosts.map((post, index) => `
${index + 1}. Mensaje: "${post.message.substring(0, 100)}${post.message.length > 100 ? '...' : ''}"
   - Reacciones: ${post.reactions_count}
   - Comentarios: ${post.comments_count}
   - Compartidos: ${post.shares}
   - Fecha: ${post.created_at}
`).join('\n')}

Por favor proporciona un análisis en formato JSON con la siguiente estructura:
{
  "strategic_analysis": "Análisis estratégico detallado del rendimiento",
  "content_performance": "Análisis del rendimiento del contenido",
  "audience_engagement": "Análisis del engagement de la audiencia",
  "key_findings": "Hallazgos clave y patrones identificados",
  "recommendations": [
    "Recomendación específica 1",
    "Recomendación específica 2",
    "Recomendación específica 3"
  ],
  "optimization_opportunities": [
    "Oportunidad de optimización 1",
    "Oportunidad de optimización 2",
    "Oportunidad de optimización 3"
  ]
}

Enfócate en insights accionables para mejorar la estrategia de marketing en Facebook.
    `;

    // Call the universal AI handler
    console.log('🤖 Calling AI for strategic analysis...');
    const { data: aiResponse, error: aiError } = await supabaseClient.functions.invoke(
      'universal-ai-handler',
      {
        body: {
          prompt: analysisPrompt,
          max_tokens: 2000,
          temperature: 0.3
        }
      }
    );

    if (aiError) {
      console.error('Error calling AI:', aiError);
      throw new Error('Failed to generate AI analysis');
    }

    let analysisData;
    try {
      const aiContent = aiResponse.choices?.[0]?.message?.content || aiResponse.content || '';
      console.log('🎯 AI Response received, parsing...');
      
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback analysis
      analysisData = {
        strategic_analysis: `Análisis basado en ${totalPosts} publicaciones con una tasa de engagement del ${(engagementRate * 100).toFixed(2)}%. El rendimiento muestra ${avgReactions.toFixed(0)} reacciones promedio por publicación.`,
        content_performance: "El contenido muestra variabilidad en el engagement. Se recomienda analizar los posts con mejor rendimiento para identificar patrones exitosos.",
        audience_engagement: `La audiencia muestra mayor preferencia por reacciones (${avgReactions.toFixed(0)} promedio) comparado con comentarios (${avgComments.toFixed(0)} promedio).`,
        key_findings: "Se identifican oportunidades de mejora en la consistencia del engagement y la optimización del timing de publicaciones.",
        recommendations: [
          "Analizar horarios óptimos de publicación",
          "Incrementar contenido interactivo",
          "Optimizar el uso de hashtags relevantes"
        ],
        optimization_opportunities: [
          "Mejorar la frecuencia de publicación",
          "Desarrollar contenido más visual",
          "Implementar estrategias de community management"
        ]
      };
    }

    // Structure the marketing insights
    const marketingInsights = {
      type: 'facebook_intelligent_analysis',
      platform: 'Facebook',
      metrics: {
        total_posts: totalPosts,
        avg_reactions: parseFloat(avgReactions.toFixed(2)),
        avg_comments: parseFloat(avgComments.toFixed(2)),
        avg_shares: parseFloat(avgShares.toFixed(2)),
        engagement_rate: parseFloat((engagementRate * 100).toFixed(2))
      },
      strategic_analysis: analysisData.strategic_analysis,
      content_performance: analysisData.content_performance,
      audience_engagement: analysisData.audience_engagement,
      key_findings: analysisData.key_findings,
      created_at: new Date().toISOString(),
      user_id: user.id
    };

    // Delete old Facebook insights
    await supabaseClient
      .from('marketing_insights')
      .delete()
      .eq('user_id', user.id)
      .eq('type', 'facebook_intelligent_analysis');

    // Insert new insights
    const { error: insertError } = await supabaseClient
      .from('marketing_insights')
      .insert([marketingInsights]);

    if (insertError) {
      console.error('Error inserting insights:', insertError);
      throw new Error('Failed to save insights');
    }

    // Create actionables
    const actionables = [
      ...analysisData.recommendations.map((rec: string, index: number) => ({
        user_id: user.id,
        platform: 'Facebook',
        type: 'content_optimization',
        title: `Recomendación ${index + 1}`,
        description: rec,
        priority: index < 2 ? 'high' : 'medium',
        status: 'pending',
        created_at: new Date().toISOString()
      })),
      ...analysisData.optimization_opportunities.map((opp: string, index: number) => ({
        user_id: user.id,
        platform: 'Facebook',
        type: 'optimization_opportunity',
        title: `Oportunidad ${index + 1}`,
        description: opp,
        priority: 'medium',
        status: 'pending',
        created_at: new Date().toISOString()
      }))
    ];

    // Delete old Facebook actionables
    await supabaseClient
      .from('marketing_actionables')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', 'Facebook');

    // Insert new actionables
    if (actionables.length > 0) {
      const { error: actionablesError } = await supabaseClient
        .from('marketing_actionables')
        .insert(actionables);

      if (actionablesError) {
        console.error('Error inserting actionables:', actionablesError);
      }
    }

    console.log(`✅ Facebook intelligent analysis completed. Created ${actionables.length} actionables.`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisData,
        metrics: marketingInsights.metrics,
        actionables_created: actionables.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Facebook intelligent analysis:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});