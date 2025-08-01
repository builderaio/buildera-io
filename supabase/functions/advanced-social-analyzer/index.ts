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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json().catch(() => ({}));
    const { platform = 'instagram', action = 'process_calendar_data' } = body;
    console.log(`🔍 Advanced Social Analyzer - Platform: ${platform}, Action: ${action}`);

    let result: any = {};

    switch (action) {
      case 'process_calendar_data':
        result = await processCalendarData(user.id, platform, supabase);
        break;
      case 'analyze_followers_location':
        result = await analyzeFollowersLocation(user.id, platform, supabase);
        break;
      case 'generate_audience_insights':
        result = await generateAudienceInsights(user.id, platform, supabase);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Advanced Social Analyzer Error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred',
      details: {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 3).join('\n') // First 3 lines of stack
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processCalendarData(userId: string, platform: string, supabase: any) {
  console.log(`📅 Processing calendar data for ${platform}`);

  let posts: any[] = [];

  if (platform === 'instagram') {
    const { data: instagramPosts, error } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('❌ Error fetching Instagram posts:', error);
      throw new Error(`Error fetching Instagram posts: ${error.message}`);
    }
    
    posts = instagramPosts || [];
    console.log(`📊 Found ${posts.length} Instagram posts`);
  }

  if (posts.length === 0) {
    throw new Error('No hay posts disponibles para analizar. Primero importa posts de tus redes sociales.');
  }

  // Procesar calendario
  const calendarEntries = posts.map(post => {
    const publishedAt = new Date(post.posted_at || post.created_at);
    const engagement = (post.like_count || 0) + (post.comment_count || 0);
    const engagementRate = post.like_count > 0 ? (engagement / post.like_count) * 100 : 0;

    return {
      user_id: userId,
      platform: platform,
      post_id: post.id,
      post_type: post.is_video ? 'video' : 'image',
      post_title: post.caption?.substring(0, 100) || '',
      post_caption: post.caption || '',
      published_at: publishedAt.toISOString(),
      likes_count: post.like_count || 0,
      comments_count: post.comment_count || 0,
      day_of_week: publishedAt.getDay() + 1,
      hour_of_day: publishedAt.getHours(),
      hashtags: post.hashtags || [],
      engagement_rate: engagementRate,
      platform_specific_data: { raw_data: post }
    };
  });

  if (calendarEntries.length > 0) {
    const { error: upsertError } = await supabase
      .from('social_media_calendar')
      .upsert(calendarEntries, { onConflict: 'user_id,platform,post_id' });
    
    if (upsertError) {
      console.error('❌ Error upserting calendar entries:', upsertError);
      throw new Error(`Error saving calendar data: ${upsertError.message}`);
    }
    
    console.log(`✅ Successfully saved ${calendarEntries.length} calendar entries`);
  }

  // Generar insights de marketing con IA
  console.log('🤖 Generating marketing insights with AI...');
  const insightsGenerated = await generateMarketingInsights(userId, platform, posts, supabase);

  return {
    calendar_entries: calendarEntries.length,
    insights_generated: insightsGenerated,
    posts_analyzed: posts.length,
    message: `Procesados ${calendarEntries.length} posts y generados ${insightsGenerated} insights`
  };
}

async function analyzeFollowersLocation(userId: string, platform: string, supabase: any) {
  console.log(`🌍 Analyzing followers location for ${platform}`);

  const mockLocationData = [
    { country: 'México', country_code: 'MX', followers_count: 150, percentage: 35 },
    { country: 'España', country_code: 'ES', followers_count: 100, percentage: 25 },
    { country: 'Argentina', country_code: 'AR', followers_count: 80, percentage: 20 },
    { country: 'Colombia', country_code: 'CO', followers_count: 50, percentage: 12 },
    { country: 'Chile', country_code: 'CL', followers_count: 32, percentage: 8 }
  ];

  const locationAnalysis = mockLocationData.map(location => ({
    user_id: userId,
    platform: platform,
    ...location,
    market_potential_score: Math.floor(Math.random() * 30) + 70,
    confidence_score: Math.floor(Math.random() * 20) + 80,
    data_source: 'inferred'
  }));

  const { error: locationError } = await supabase
    .from('followers_location_analysis')
    .upsert(locationAnalysis, { onConflict: 'user_id,platform,country' });
  
  if (locationError) {
    console.error('❌ Error saving location analysis:', locationError);
    throw new Error(`Error saving location analysis: ${locationError.message}`);
  }
  
  console.log(`✅ Successfully saved ${locationAnalysis.length} location analyses`);

  return {
    total_followers_analyzed: 412,
    countries_identified: locationAnalysis.length,
    top_countries: locationAnalysis.slice(0, 3)
  };
}

async function generateAudienceInsights(userId: string, platform: string, supabase: any) {
  console.log(`👥 Generating audience insights for ${platform}`);

  const insights = [
    {
      user_id: userId,
      platform: platform,
      insight_type: 'demographic',
      audience_segment: 'primary',
      age_ranges: { '18-24': 25, '25-34': 40, '35-44': 20, '45+': 15 },
      gender_split: { 'male': 45, 'female': 53, 'other': 2 },
      interests: { 'technology': 30, 'lifestyle': 25, 'business': 20 }
    },
    {
      user_id: userId,
      platform: platform,
      insight_type: 'behavioral',
      audience_segment: 'primary',
      online_activity_patterns: { peak_hours: [18, 19, 20, 21] },
      content_preferences: { video: 60, image: 30, carousel: 10 }
    }
  ];

  const { error: insightsError } = await supabase
    .from('audience_insights')
    .upsert(insights);
  
  if (insightsError) {
    console.error('❌ Error saving audience insights:', insightsError);
    throw new Error(`Error saving audience insights: ${insightsError.message}`);
  }
  
  console.log(`✅ Successfully saved ${insights.length} audience insights`);

  return {
    insights_generated: insights.length,
    message: 'Insights de audiencia generados exitosamente'
  };
}

async function generateMarketingInsights(userId: string, platform: string, posts: any[], supabase: any) {
  console.log(`🤖 Generating advanced marketing insights with AI for ${posts.length} posts on ${platform}`);
  
  try {
    // Preparar datos de los posts para el análisis
    const postsData = posts.slice(0, 30).map(post => ({
      caption: post.caption || '',
      likes: post.like_count || 0,
      comments: post.comment_count || 0,
      posted_at: post.posted_at,
      hashtags: post.hashtags || [],
      is_video: post.is_video || false,
      reach: post.reach || 0,
      impressions: post.impressions || 0,
      engagement_rate: post.engagement_rate || 0
    }));

    console.log('📊 Calling universal-ai-handler for comprehensive insights...');
    
    // Llamar al universal-ai-handler para análisis con IA más avanzado
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'advanced_marketing_analysis',
        messages: [
          {
            role: 'system',
            content: `Eres un experto consultor en marketing digital y análisis de redes sociales con más de 15 años de experiencia. Tu misión es analizar los posts de ${platform} y generar insights profundos y accionables que impulsen el crecimiento del negocio.

ANÁLISIS REQUERIDO:
1. Análisis de timing óptimo (horarios/días con mejor performance)
2. Rendimiento por tipo de contenido (video vs imagen vs carrusel)
3. Análisis de sentimientos y tono de marca
4. Optimización de hashtags y palabras clave
5. Predicciones de rendimiento futuro
6. Análisis competitivo y oportunidades
7. Recomendaciones específicas para crecimiento

ENFOQUE ANALÍTICO:
- Identifica patrones ocultos en los datos
- Proporciona insights únicos y no obvios
- Incluye métricas avanzadas y correlaciones
- Sugiere estrategias específicas para ${platform}
- Calcula ROI potencial de las recomendaciones`
          },
          {
            role: 'user',
            content: `Realiza un análisis profundo de estos ${postsData.length} posts de ${platform}:

${JSON.stringify(postsData, null, 2)}

Responde ÚNICAMENTE con un JSON válido con esta estructura expandida:
{
  "optimal_timing": {
    "bestHours": [{"hour": 18, "posts": 5, "avgEngagement": "8.5%", "reach": 2500, "conversionRate": "3.2%"}],
    "bestDays": [{"dayLabel": "Lunes", "posts": 8, "avgEngagement": "7.2%", "audienceActivity": "alta"}],
    "recommendations": ["Publicar entre 18-20h para máximo alcance", "Evitar domingos - baja actividad"]
  },
  "content_performance": {
    "byContentType": [{"type": "video", "count": 10, "avgLikes": 150, "avgComments": 12, "performance": "Alto", "roi": "245%", "viralityScore": 0.8}],
    "topPerformers": [{"caption": "...", "likes": 200, "comments": 15, "shares": 8, "viralityFactors": ["timing", "hashtags"]}],
    "contentGaps": ["Falta contenido educativo", "Oportunidad en tendencias actuales"],
    "recommendations": ["Incrementar videos en 40%", "Usar más contenido user-generated"]
  },
  "sentiment_analysis": {
    "overall_sentiment": "positive",
    "confidence_score": 0.85,
    "brand_tone": "Profesional y amigable",
    "audience_connection": "Fuerte conexión emocional",
    "emotional_triggers": ["confianza", "inspiración", "aspiración"],
    "sentiment_trends": {"positive": 65, "neutral": 25, "negative": 10},
    "voice_consistency": 0.9,
    "recommendations": ["Mantener tono actual", "Incrementar contenido inspiracional en 25%", "Añadir más historias personales"]
  },
  "hashtag_insights": {
    "topPerforming": [{"hashtag": "skincare", "uses": 15, "avgEngagement": "9.1%", "performance": "Excelente", "trendingScore": 0.95, "competitorUsage": "baja"}],
    "underutilized": [{"hashtag": "beautytech", "potential": "alto", "reason": "trending pero poco usado"}],
    "seasonalOpportunities": ["#verano2024", "#backtoschool"],
    "recommendations": ["Usar #beautytech para diferenciación", "Crear hashtag de marca propio"]
  },
  "performance_predictions": {
    "trend": "ascending",
    "growthRate": "+15% mensual",
    "predictions": ["Engagement crecerá 20% próximos 3 meses", "Videos tendrán 40% más alcance"],
    "risks": ["Saturación de hashtags populares", "Cambios algoritmo"],
    "opportunities": ["Colaboraciones con micro-influencers", "Contenido interactivo"]
  },
  "competitive_analysis": {
    "positioning": "fuerte en educación, débil en entretenimiento",
    "opportunities": ["Aprovechar gap en contenido nocturno", "Liderar en beautytech"],
    "threats": ["Competidores aumentando video content", "Nuevos players en nicho"],
    "recommendations": ["Duplicar presupuesto video", "Crear series educativas exclusivas"]
  },
  "growth_strategies": {
    "short_term": ["Optimizar horarios posting", "Usar hashtags sugeridos", "Incrementar frecuencia"],
    "medium_term": ["Lanzar serie contenido semanal", "Colaborar con 3 influencers", "Crear challenges virales"],
    "long_term": ["Construir comunidad exclusiva", "Desarrollar productos basados en insights", "Expandir a nuevas plataformas"],
    "roi_projections": {"3_meses": "+35% engagement", "6_meses": "+60% followers", "12_meses": "+150% conversiones"}
  }
}`
          }
        ]
      }
    });

    if (aiError) {
      console.error('❌ Error calling universal-ai-handler:', aiError);
      return await generateBasicInsights(userId, platform, posts, supabase);
    }

    console.log('🎯 AI Response received:', aiResponse);
    
    if (!aiResponse?.output) {
      console.error('❌ No output from AI');
      return await generateBasicInsights(userId, platform, posts, supabase);
    }

    // Parsear respuesta de IA
    let aiInsights;
    try {
      aiInsights = JSON.parse(aiResponse.output);
    } catch (parseError) {
      console.error('❌ Error parsing AI response:', parseError);
      return await generateBasicInsights(userId, platform, posts, supabase);
    }

    // Guardar insights expandidos en la base de datos
    const insightsToSave = [
      {
        user_id: userId,
        platform: platform,
        insight_type: 'optimal_timing',
        title: 'Análisis Avanzado de Timing Óptimo',
        description: 'Horarios y días óptimos con predicciones de conversión',
        data: aiInsights.optimal_timing,
        confidence_score: 0.9,
        impact_level: 'high',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'content_performance',
        title: 'Análisis Profundo de Rendimiento de Contenido',
        description: 'Rendimiento por tipo con ROI y factores de viralidad',
        data: aiInsights.content_performance,
        confidence_score: 0.85,
        impact_level: 'high',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'sentiment_analysis',
        title: 'Análisis Avanzado de Sentimientos y Tono',
        description: 'Análisis completo del tono de marca y conexión emocional',
        data: aiInsights.sentiment_analysis,
        confidence_score: 0.88,
        impact_level: 'medium',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'hashtag_optimization',
        title: 'Optimización Estratégica de Hashtags',
        description: 'Hashtags de alto rendimiento y oportunidades ocultas',
        data: aiInsights.hashtag_insights,
        confidence_score: 0.82,
        impact_level: 'medium',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'performance_predictions',
        title: 'Predicciones de Rendimiento Futuro',
        description: 'Proyecciones de crecimiento y identificación de riesgos',
        data: aiInsights.performance_predictions,
        confidence_score: 0.75,
        impact_level: 'high',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'competitive_analysis',
        title: 'Análisis Competitivo y Posicionamiento',
        description: 'Posición competitiva y oportunidades de diferenciación',
        data: aiInsights.competitive_analysis,
        confidence_score: 0.8,
        impact_level: 'high',
        generated_by: 'advanced_ai_analyzer'
      },
      {
        user_id: userId,
        platform: platform,
        insight_type: 'growth_strategies',
        title: 'Estrategias de Crecimiento Personalizadas',
        description: 'Plan de crecimiento a corto, medio y largo plazo con ROI proyectado',
        data: aiInsights.growth_strategies,
        confidence_score: 0.85,
        impact_level: 'high',
        generated_by: 'advanced_ai_analyzer'
      }
    ];

    // Generar actionables específicos basados en los insights
    const actionablesToSave = [];
    
    if (aiInsights.optimal_timing?.recommendations) {
      actionablesToSave.push({
        user_id: userId,
        title: 'Optimizar Horarios de Publicación',
        description: aiInsights.optimal_timing.recommendations[0] || 'Ajustar horarios según análisis',
        action_type: 'timing_optimization',
        priority: 'high',
        estimated_impact: 'Incremento 15-25% en engagement'
      });
    }

    if (aiInsights.content_performance?.recommendations) {
      actionablesToSave.push({
        user_id: userId,
        title: 'Ajustar Mix de Contenido',
        description: aiInsights.content_performance.recommendations[0] || 'Optimizar tipos de contenido',
        action_type: 'content_optimization',
        priority: 'high',
        estimated_impact: 'Mejora 20-30% en alcance'
      });
    }

    if (aiInsights.hashtag_insights?.recommendations) {
      actionablesToSave.push({
        user_id: userId,
        title: 'Implementar Estrategia de Hashtags',
        description: aiInsights.hashtag_insights.recommendations[0] || 'Usar hashtags recomendados',
        action_type: 'hashtag_optimization',
        priority: 'medium',
        estimated_impact: 'Aumento 10-15% en descubrimiento'
      });
    }

    // Eliminar insights existentes para el usuario y plataforma
    await supabase
      .from('marketing_insights')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform)
      .in('insight_type', ['optimal_timing', 'content_performance', 'sentiment_analysis', 'hashtag_optimization', 'performance_predictions', 'competitive_analysis', 'growth_strategies']);

    // Insertar nuevos insights
    const { error: insertError } = await supabase
      .from('marketing_insights')
      .insert(insightsToSave);

    if (insertError) {
      console.error('❌ Error saving insights:', insertError);
      throw new Error(`Error saving insights: ${insertError.message}`);
    }

    // Insertar actionables si existen
    if (actionablesToSave.length > 0) {
      const { error: actionablesError } = await supabase
        .from('marketing_actionables')
        .insert(actionablesToSave);

      if (actionablesError) {
        console.error('❌ Error saving actionables:', actionablesError);
      } else {
        console.log(`✅ Successfully saved ${actionablesToSave.length} actionables`);
      }
    }

    console.log(`✅ Successfully saved ${insightsToSave.length} advanced marketing insights`);
    return insightsToSave.length;

  } catch (error: any) {
    console.error('❌ Error in generateMarketingInsights:', error);
    return await generateBasicInsights(userId, platform, posts, supabase);
  }
}

async function generateBasicInsights(userId: string, platform: string, posts: any[], supabase: any) {
  console.log('📊 Generating basic insights without AI...');
  
  // Análisis básico de horarios
  const hourlyData: { [key: number]: { posts: number; totalEngagement: number } } = {};
  const dailyData: { [key: number]: { posts: number; totalEngagement: number } } = {};
  
  posts.forEach(post => {
    const publishedAt = new Date(post.posted_at || post.created_at);
    const hour = publishedAt.getHours();
    const day = publishedAt.getDay();
    const engagement = (post.like_count || 0) + (post.comment_count || 0);
    
    if (!hourlyData[hour]) hourlyData[hour] = { posts: 0, totalEngagement: 0 };
    if (!dailyData[day]) dailyData[day] = { posts: 0, totalEngagement: 0 };
    
    hourlyData[hour].posts++;
    hourlyData[hour].totalEngagement += engagement;
    dailyData[day].posts++;
    dailyData[day].totalEngagement += engagement;
  });

  const basicInsights = [
    {
      user_id: userId,
      platform: platform,
      insight_type: 'optimal_timing',
      title: 'Análisis de Horarios Básico',
      description: 'Análisis básico de horarios óptimos',
      data: {
        bestHours: Object.entries(hourlyData)
          .map(([hour, data]) => ({
            hour: parseInt(hour),
            posts: data.posts,
            avgEngagement: data.posts > 0 ? `${(data.totalEngagement / data.posts).toFixed(1)}` : '0'
          }))
          .sort((a, b) => parseFloat(b.avgEngagement) - parseFloat(a.avgEngagement))
          .slice(0, 5),
        bestDays: Object.entries(dailyData)
          .map(([day, data]) => ({
            dayLabel: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][parseInt(day)],
            posts: data.posts,
            avgEngagement: data.posts > 0 ? `${(data.totalEngagement / data.posts).toFixed(1)}` : '0'
          }))
          .sort((a, b) => parseFloat(b.avgEngagement) - parseFloat(a.avgEngagement))
          .slice(0, 5)
      }
    }
  ];

  // Guardar insights básicos
  await supabase
    .from('marketing_insights')
    .delete()
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('insight_type', 'optimal_timing');

  const { error: insertError } = await supabase
    .from('marketing_insights')
    .insert(basicInsights);

  if (insertError) {
    console.error('❌ Error saving basic insights:', insertError);
    return 0;
  }

  console.log('✅ Successfully saved basic insights');
  return basicInsights.length;
}