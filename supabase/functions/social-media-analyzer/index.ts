import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, platform, connectionData } = await req.json();
    
    console.log(`🚀 Iniciando análisis de datos para ${platform} - Usuario: ${userId}`);

    // Obtener datos según la plataforma
    let posts = [];
    let analytics = [];
    
    switch (platform) {
      case 'linkedin':
        const linkedinData = await processLinkedInData(userId, connectionData);
        posts = linkedinData.posts;
        analytics = linkedinData.analytics;
        break;
      case 'instagram':
        const instagramData = await processInstagramData(userId, connectionData);
        posts = instagramData.posts;
        analytics = instagramData.analytics;
        break;
      case 'facebook':
        const facebookData = await processFacebookData(userId, connectionData);
        posts = facebookData.posts;
        analytics = facebookData.analytics;
        break;
      case 'tiktok':
        const tiktokData = await processTikTokData(userId, connectionData);
        posts = tiktokData.posts;
        analytics = tiktokData.analytics;
        break;
    }

    // Guardar posts en la base de datos
    if (posts.length > 0) {
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .upsert(posts, { 
          onConflict: 'user_id,platform,platform_post_id',
          ignoreDuplicates: false 
        });

      if (postsError) {
        console.error('Error saving posts:', postsError);
      } else {
        console.log(`✅ Guardados ${posts.length} posts de ${platform}`);
      }
    }

    // Guardar analytics
    if (analytics.length > 0) {
      const { error: analyticsError } = await supabase
        .from('social_media_analytics')
        .upsert(analytics, { 
          onConflict: 'user_id,platform,metric_type,period_type,period_start',
          ignoreDuplicates: false 
        });

      if (analyticsError) {
        console.error('Error saving analytics:', analyticsError);
      } else {
        console.log(`✅ Guardadas ${analytics.length} métricas de ${platform}`);
      }
    }

    // Generar insights con IA
    console.log('🧠 Generando insights con IA...');
    await generateMarketingInsights(userId, platform, posts);

    return new Response(JSON.stringify({ 
      success: true, 
      postsProcessed: posts.length,
      analyticsGenerated: analytics.length,
      message: `Análisis completado para ${platform}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en análisis de redes sociales:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processLinkedInData(userId: string, connectionData: any) {
  // Simular obtención de datos de LinkedIn
  const posts = [];
  const now = new Date();
  
  for (let i = 0; i < 10; i++) {
    const postDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    posts.push({
      user_id: userId,
      platform: 'linkedin',
      platform_post_id: `linkedin_post_${i + 1}`,
      post_type: 'post',
      content: `Post ejemplo ${i + 1} de LinkedIn sobre estrategia empresarial y growth hacking.`,
      published_at: postDate.toISOString(),
      metrics: {
        likes: Math.floor(Math.random() * 100) + 10,
        comments: Math.floor(Math.random() * 20) + 2,
        shares: Math.floor(Math.random() * 15) + 1,
        impressions: Math.floor(Math.random() * 1000) + 200
      },
      hashtags: ['#marketing', '#business', '#growth', '#strategy'],
      raw_data: { source: 'linkedin_api' }
    });
  }

  const analytics = [
    {
      user_id: userId,
      platform: 'linkedin',
      metric_type: 'engagement_rate',
      period_type: 'weekly',
      period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: now.toISOString(),
      value: 4.2,
      metadata: { average_likes: 45, average_comments: 8 }
    }
  ];

  return { posts, analytics };
}

async function processInstagramData(userId: string, connectionData: any) {
  const posts = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    const postDate = new Date(now.getTime() - (i * 12 * 60 * 60 * 1000));
    posts.push({
      user_id: userId,
      platform: 'instagram',
      platform_post_id: `instagram_post_${i + 1}`,
      post_type: i % 3 === 0 ? 'video' : 'image',
      content: `Post de Instagram ${i + 1} sobre lifestyle empresarial.`,
      media_urls: [`https://example.com/image_${i + 1}.jpg`],
      published_at: postDate.toISOString(),
      metrics: {
        likes: Math.floor(Math.random() * 200) + 50,
        comments: Math.floor(Math.random() * 30) + 5,
        saves: Math.floor(Math.random() * 20) + 2,
        reach: Math.floor(Math.random() * 1500) + 300
      },
      hashtags: ['#entrepreneur', '#business', '#motivation', '#success'],
      raw_data: { source: 'instagram_api' }
    });
  }

  const analytics = [
    {
      user_id: userId,
      platform: 'instagram',
      metric_type: 'engagement_rate',
      period_type: 'weekly',
      period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: now.toISOString(),
      value: 6.8,
      metadata: { average_likes: 125, average_comments: 18 }
    }
  ];

  return { posts, analytics };
}

async function processFacebookData(userId: string, connectionData: any) {
  const posts = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const postDate = new Date(now.getTime() - (i * 2 * 24 * 60 * 60 * 1000));
    posts.push({
      user_id: userId,
      platform: 'facebook',
      platform_post_id: `facebook_post_${i + 1}`,
      post_type: 'post',
      content: `Publicación en Facebook ${i + 1} sobre tendencias del mercado.`,
      published_at: postDate.toISOString(),
      metrics: {
        likes: Math.floor(Math.random() * 80) + 15,
        comments: Math.floor(Math.random() * 25) + 3,
        shares: Math.floor(Math.random() * 12) + 1,
        reach: Math.floor(Math.random() * 800) + 150
      },
      hashtags: ['#marketing', '#trends', '#business'],
      raw_data: { source: 'facebook_api' }
    });
  }

  const analytics = [
    {
      user_id: userId,
      platform: 'facebook',
      metric_type: 'engagement_rate',
      period_type: 'weekly',
      period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: now.toISOString(),
      value: 3.5,
      metadata: { average_likes: 48, average_comments: 12 }
    }
  ];

  return { posts, analytics };
}

async function processTikTokData(userId: string, connectionData: any) {
  const posts = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const postDate = new Date(now.getTime() - (i * 8 * 60 * 60 * 1000));
    posts.push({
      user_id: userId,
      platform: 'tiktok',
      platform_post_id: `tiktok_post_${i + 1}`,
      post_type: 'video',
      content: `Video TikTok ${i + 1} sobre tips empresariales.`,
      media_urls: [`https://example.com/video_${i + 1}.mp4`],
      published_at: postDate.toISOString(),
      metrics: {
        likes: Math.floor(Math.random() * 500) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        shares: Math.floor(Math.random() * 30) + 5,
        views: Math.floor(Math.random() * 5000) + 1000
      },
      hashtags: ['#entrepreneur', '#tips', '#business', '#viral'],
      raw_data: { source: 'tiktok_api' }
    });
  }

  const analytics = [
    {
      user_id: userId,
      platform: 'tiktok',
      metric_type: 'engagement_rate',
      period_type: 'weekly',
      period_start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: now.toISOString(),
      value: 8.2,
      metadata: { average_likes: 350, average_comments: 25 }
    }
  ];

  return { posts, analytics };
}

async function generateMarketingInsights(userId: string, platform: string, posts: any[]) {
  if (!openAIApiKey || posts.length === 0) return;

  try {
    // Obtener configuración de IA
    const { data: config } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', 'era-content-optimizer')
      .single();

    const aiConfig = config || {
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 500
    };

    // Analizar engagement
    const totalLikes = posts.reduce((sum, post) => sum + (post.metrics.likes || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.metrics.comments || 0), 0);
    const avgEngagement = posts.length > 0 ? (totalLikes + totalComments) / posts.length : 0;

    // Generar insight de engagement con IA
    const engagementPrompt = `
    Analiza estos datos de engagement de ${platform}:
    - Total de posts: ${posts.length}
    - Promedio de likes: ${totalLikes / posts.length}
    - Promedio de comentarios: ${totalComments / posts.length}
    - Engagement promedio: ${avgEngagement}
    
    Genera un insight breve y accionable sobre el rendimiento del contenido.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.model_name,
        messages: [
          { 
            role: 'system', 
            content: 'Eres un experto en marketing digital. Genera insights breves y accionables.' 
          },
          { role: 'user', content: engagementPrompt }
        ],
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
      }),
    });

    const aiData = await response.json();
    const aiInsight = aiData.choices?.[0]?.message?.content || 'Análisis de engagement completado';

    // Guardar insights en la base de datos
    const insights = [
      {
        user_id: userId,
        insight_type: 'engagement',
        title: `Análisis de Engagement - ${platform}`,
        description: aiInsight,
        data: {
          total_posts: posts.length,
          avg_likes: totalLikes / posts.length,
          avg_comments: totalComments / posts.length,
          trend: avgEngagement > 50 ? 'positive' : 'neutral'
        },
        confidence_score: 0.85,
        impact_level: avgEngagement > 100 ? 'high' : 'medium',
        platforms: [platform],
        date_range_start: posts[posts.length - 1]?.published_at,
        date_range_end: posts[0]?.published_at
      }
    ];

    const { data: savedInsights, error: insightsError } = await supabase
      .from('marketing_insights')
      .insert(insights)
      .select();

    if (insightsError) {
      console.error('Error saving insights:', insightsError);
      return;
    }

    // Generar accionables basados en insights
    const actionables = savedInsights.map(insight => ({
      user_id: userId,
      insight_id: insight.id,
      title: `Optimizar contenido en ${platform}`,
      description: avgEngagement > 50 
        ? 'Continúa con la estrategia actual y experimenta con formatos similares'
        : 'Revisa la estrategia de contenido y prueba nuevos formatos para mejorar engagement',
      action_type: 'content_creation',
      priority: avgEngagement < 30 ? 'high' : 'medium',
      estimated_impact: 'Mejora del 15-25% en engagement'
    }));

    const { error: actionablesError } = await supabase
      .from('marketing_actionables')
      .insert(actionables);

    if (actionablesError) {
      console.error('Error saving actionables:', actionablesError);
    } else {
      console.log(`✅ Generados ${actionables.length} accionables para ${platform}`);
    }

  } catch (error) {
    console.error('Error generating insights:', error);
  }
}