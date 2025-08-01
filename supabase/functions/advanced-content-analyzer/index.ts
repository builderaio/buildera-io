import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key no configurada');
    }

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { platform } = await req.json();
    const userId = user.id;
    
    console.log(`Analizando contenido avanzado para usuario ${userId}, plataforma: ${platform || 'todas'}`);

    // Obtener posts para análisis
    const [instagramPosts, linkedinPosts, tiktokPosts] = await Promise.all([
      platform === 'instagram' || !platform 
        ? supabaseClient.from('instagram_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(50)
        : { data: [], error: null },
      platform === 'linkedin' || !platform
        ? supabaseClient.from('linkedin_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(50)
        : { data: [], error: null },
      platform === 'tiktok' || !platform
        ? supabaseClient.from('tiktok_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(50)
        : { data: [], error: null }
    ]);

    const allPosts = [
      ...(instagramPosts.data || []).map(p => ({ ...p, platform: 'instagram' })),
      ...(linkedinPosts.data || []).map(p => ({ ...p, platform: 'linkedin' })),
      ...(tiktokPosts.data || []).map(p => ({ ...p, platform: 'tiktok' }))
    ];

    if (allPosts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No hay posts para analizar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar datos para análisis IA
    const postsForAnalysis = allPosts.map(post => ({
      platform: post.platform,
      content: post.caption || post.content || post.title || '',
      hashtags: post.hashtags || [],
      likes: post.like_count || post.likes_count || post.digg_count || 0,
      comments: post.comment_count || post.comments_count || 0,
      engagement_rate: post.engagement_rate || 0,
      posted_at: post.posted_at
    }));

    // Análisis con IA
    const systemPrompt = `Eres un experto en análisis de contenido de redes sociales. Analiza los posts proporcionados y genera insights avanzados y recomendaciones accionables.

Tu análisis debe incluir:
1. Patrones de contenido exitoso
2. Optimización de hashtags
3. Mejores horarios para publicar
4. Análisis de sentiment
5. Recomendaciones específicas para cada plataforma
6. Oportunidades de crecimiento

Responde en formato JSON con esta estructura:
{
  "insights": [
    {
      "type": "content_performance",
      "title": "Título del insight",
      "description": "Descripción detallada",
      "platform": "plataforma específica o 'all'",
      "confidence": 0.95,
      "data": {}
    }
  ],
  "actionables": [
    {
      "type": "optimization",
      "title": "Acción recomendada",
      "description": "Descripción de la acción",
      "priority": "high|medium|low",
      "estimated_impact": "Impacto estimado",
      "platform": "plataforma específica"
    }
  ],
  "recommendations": [
    {
      "type": "hashtag|timing|content",
      "title": "Recomendación",
      "description": "Descripción detallada",
      "suggested_content": {},
      "confidence_score": 0.85
    }
  ]
}`;

    const userContent = `Analiza estos ${postsForAnalysis.length} posts de redes sociales:\n\n${JSON.stringify(postsForAnalysis, null, 2)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

    // Guardar insights
    if (analysisResult.insights && analysisResult.insights.length > 0) {
      const insightsToInsert = analysisResult.insights.map(insight => ({
        user_id: userId,
        title: insight.title,
        description: insight.description,
        insight_type: insight.type,
        platform: insight.platform === 'all' ? null : insight.platform,
        confidence_score: insight.confidence || 0.5,
        data: insight.data || {},
        generated_by: 'advanced_content_analyzer'
      }));

      await supabaseClient
        .from('marketing_insights')
        .insert(insightsToInsert);
    }

    // Guardar actionables
    if (analysisResult.actionables && analysisResult.actionables.length > 0) {
      const actionablesToInsert = analysisResult.actionables.map(actionable => ({
        user_id: userId,
        title: actionable.title,
        description: actionable.description,
        action_type: actionable.type,
        priority: actionable.priority,
        estimated_impact: actionable.estimated_impact
      }));

      await supabaseClient
        .from('marketing_actionables')
        .insert(actionablesToInsert);
    }

    // Guardar recomendaciones
    if (analysisResult.recommendations && analysisResult.recommendations.length > 0) {
      const recommendationsToInsert = analysisResult.recommendations.map(rec => ({
        user_id: userId,
        platform: rec.platform || 'all',
        recommendation_type: rec.type,
        title: rec.title,
        description: rec.description,
        confidence_score: rec.confidence_score || 0.5,
        suggested_content: rec.suggested_content || {}
      }));

      await supabaseClient
        .from('content_recommendations')
        .insert(recommendationsToInsert);
    }

    console.log(`Análisis completado: ${analysisResult.insights?.length || 0} insights, ${analysisResult.actionables?.length || 0} actionables, ${analysisResult.recommendations?.length || 0} recomendaciones`);

    return new Response(
      JSON.stringify({ 
        success: true,
        insights: analysisResult.insights?.length || 0,
        actionables: analysisResult.actionables?.length || 0,
        recommendations: analysisResult.recommendations?.length || 0,
        message: 'Análisis avanzado completado'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en análisis avanzado:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});