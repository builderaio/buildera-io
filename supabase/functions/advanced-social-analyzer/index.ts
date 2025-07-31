import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  console.log('🚀 Advanced Social Media Analyzer request received')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log(`🔍 Starting advanced analysis for user: ${user.id}`)

    // Obtener todos los posts para análisis
    const { data: posts, error: postsError } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false })

    if (postsError) {
      throw new Error(`Error fetching posts: ${postsError.message}`)
    }

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No posts available for analysis',
        analysis: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📊 Analyzing ${posts.length} posts for advanced insights`)

    // ANÁLISIS 1: Horarios óptimos de publicación
    console.log('📊 Analyzing optimal timing...')
    const timeAnalysis = analyzeOptimalTimes(posts)
    
    // ANÁLISIS 2: Análisis de engagement por contenido
    console.log('📈 Analyzing content performance...')
    const contentPerformance = analyzeContentPerformance(posts)
    
    // ANÁLISIS 3: Análisis de hashtags y tendencias
    console.log('🏷️ Analyzing hashtag performance...')
    const hashtagAnalysis = analyzeHashtagPerformance(posts)
    
    // ANÁLISIS 4: Análisis de sentimientos con IA
    console.log('🧠 Running AI sentiment analysis...')
    const sentimentAnalysis = await analyzeSentimentWithAI(posts)
    
    // ANÁLISIS 5: Predicciones de rendimiento
    console.log('🔮 Generating performance predictions...')
    const performancePredictions = analyzePerformanceTrends(posts)
    
    // ANÁLISIS 6: Análisis competitivo
    console.log('🥊 Running competitive analysis...')
    const competitiveAnalysis = generateCompetitiveInsights(posts)

    const advancedAnalysis = {
      optimalTiming: timeAnalysis,
      contentPerformance: contentPerformance,
      hashtagInsights: hashtagAnalysis,
      sentimentAnalysis: sentimentAnalysis,
      performancePredictions: performancePredictions,
      competitiveAnalysis: competitiveAnalysis,
      summary: {
        totalPosts: posts.length,
        avgLikes: posts.reduce((sum, p) => sum + (p.like_count || 0), 0) / posts.length,
        avgComments: posts.reduce((sum, p) => sum + (p.comment_count || 0), 0) / posts.length,
        timeRange: {
          from: posts[posts.length - 1]?.posted_at,
          to: posts[0]?.posted_at
        }
      }
    }

    // Guardar el análisis avanzado como insights
    const insights = [
      {
        user_id: user.id,
        insight_type: 'optimal_timing',
        title: 'Horarios Óptimos de Publicación',
        description: 'Análisis de los mejores momentos para publicar basado en engagement histórico',
        platforms: ['instagram'],
        impact_level: 'high',
        data: timeAnalysis,
        confidence_score: 0.85
      },
      {
        user_id: user.id,
        insight_type: 'content_performance',
        title: 'Rendimiento por Tipo de Contenido',
        description: 'Análisis del engagement según el tipo y características del contenido',
        platforms: ['instagram'],
        impact_level: 'high',
        data: contentPerformance,
        confidence_score: 0.90
      },
      {
        user_id: user.id,
        insight_type: 'sentiment_analysis',
        title: 'Análisis de Sentimientos y Percepción',
        description: 'Análisis emocional del contenido y reacciones de la audiencia',
        platforms: ['instagram'],
        impact_level: 'medium',
        data: sentimentAnalysis,
        confidence_score: 0.80
      },
      {
        user_id: user.id,
        insight_type: 'hashtag_optimization',
        title: 'Optimización de Hashtags',
        description: 'Análisis de rendimiento de hashtags y oportunidades de mejora',
        platforms: ['instagram'],
        impact_level: 'medium',
        data: hashtagAnalysis,
        confidence_score: 0.75
      }
    ]

    // Eliminar insights existentes para actualizar con nuevos datos
    const { error: deleteError } = await supabase
      .from('marketing_insights')
      .delete()
      .eq('user_id', user.id)
      .in('insight_type', ['optimal_timing', 'content_performance', 'sentiment_analysis', 'hashtag_optimization'])

    if (deleteError) {
      console.warn('Warning deleting old insights:', deleteError)
    }

    // Insertar nuevos insights
    const { error: insightsError } = await supabase
      .from('marketing_insights')
      .insert(insights)

    if (insightsError) {
      console.error('Error saving insights:', insightsError)
      throw new Error('Failed to save insights')
    }

    console.log(`✅ Advanced analysis completed with ${insights.length} insights`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Análisis avanzado completado y almacenado en base de datos',
      analysis: advancedAnalysis,
      insights_generated: insights.length,
      posts_analyzed: posts.length,
      analysis_timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('❌ Advanced analysis error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

// Análisis de horarios óptimos
function analyzeOptimalTimes(posts: any[]) {
  const hourlyPerformance: Record<number, { posts: number, avgLikes: number, avgComments: number, avgEngagement: number }> = {}
  const dailyPerformance: Record<number, { posts: number, avgLikes: number, avgComments: number, avgEngagement: number }> = {}

  posts.forEach(post => {
    const date = new Date(post.posted_at)
    const hour = date.getHours()
    const dayOfWeek = date.getDay()
    
    const likes = post.like_count || 0
    const comments = post.comment_count || 0
    const engagement = likes + comments * 2 // Peso mayor a comentarios

    // Análisis por hora
    if (!hourlyPerformance[hour]) {
      hourlyPerformance[hour] = { posts: 0, avgLikes: 0, avgComments: 0, avgEngagement: 0 }
    }
    hourlyPerformance[hour].posts++
    hourlyPerformance[hour].avgLikes += likes
    hourlyPerformance[hour].avgComments += comments
    hourlyPerformance[hour].avgEngagement += engagement

    // Análisis por día
    if (!dailyPerformance[dayOfWeek]) {
      dailyPerformance[dayOfWeek] = { posts: 0, avgLikes: 0, avgComments: 0, avgEngagement: 0 }
    }
    dailyPerformance[dayOfWeek].posts++
    dailyPerformance[dayOfWeek].avgLikes += likes
    dailyPerformance[dayOfWeek].avgComments += comments
    dailyPerformance[dayOfWeek].avgEngagement += engagement
  })

  // Calcular promedios
  Object.keys(hourlyPerformance).forEach(hour => {
    const data = hourlyPerformance[parseInt(hour)]
    data.avgLikes = data.avgLikes / data.posts
    data.avgComments = data.avgComments / data.posts
    data.avgEngagement = data.avgEngagement / data.posts
  })

  Object.keys(dailyPerformance).forEach(day => {
    const data = dailyPerformance[parseInt(day)]
    data.avgLikes = data.avgLikes / data.posts
    data.avgComments = data.avgComments / data.posts
    data.avgEngagement = data.avgEngagement / data.posts
  })

  // Encontrar mejores horarios
  const bestHours = Object.entries(hourlyPerformance)
    .sort(([,a], [,b]) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      timeLabel: `${hour}:00`,
      avgEngagement: Math.round(data.avgEngagement),
      posts: data.posts
    }))

  const bestDays = Object.entries(dailyPerformance)
    .sort(([,a], [,b]) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3)
    .map(([day, data]) => ({
      day: parseInt(day),
      dayLabel: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][parseInt(day)],
      avgEngagement: Math.round(data.avgEngagement),
      posts: data.posts
    }))

  return {
    bestHours,
    bestDays,
    recommendations: [
      `Tu mejor hora para publicar es ${bestHours[0]?.timeLabel} con ${bestHours[0]?.avgEngagement} interacciones promedio`,
      `${bestDays[0]?.dayLabel} es tu día más efectivo para generar engagement`,
      `Evita publicar en horas con bajo rendimiento para maximizar alcance`
    ]
  }
}

// Análisis de rendimiento de contenido
function analyzeContentPerformance(posts: any[]) {
  const contentTypes = {
    withHashtags: posts.filter(p => p.hashtags && p.hashtags.length > 0),
    withoutHashtags: posts.filter(p => !p.hashtags || p.hashtags.length === 0),
    withMentions: posts.filter(p => p.mentions && p.mentions.length > 0),
    questions: posts.filter(p => p.caption && p.caption.includes('?')),
    emojis: posts.filter(p => p.caption && /[\u{1F600}-\u{1F6FF}]/u.test(p.caption))
  }

  const analysis = Object.entries(contentTypes).map(([type, typePosts]) => {
    if (typePosts.length === 0) return { type, avgEngagement: 0, count: 0, performance: 'No data' }
    
    const avgLikes = typePosts.reduce((sum, p) => sum + (p.like_count || 0), 0) / typePosts.length
    const avgComments = typePosts.reduce((sum, p) => sum + (p.comment_count || 0), 0) / typePosts.length
    const avgEngagement = avgLikes + (avgComments * 2)
    
    return {
      type,
      avgEngagement: Math.round(avgEngagement),
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments),
      count: typePosts.length,
      performance: avgEngagement > 50 ? 'Alto' : avgEngagement > 20 ? 'Medio' : 'Bajo'
    }
  })

  return {
    byContentType: analysis,
    topPerformers: posts
      .sort((a, b) => ((b.like_count || 0) + (b.comment_count || 0)) - ((a.like_count || 0) + (a.comment_count || 0)))
      .slice(0, 3)
      .map(p => ({
        caption: p.caption?.substring(0, 100) + '...',
        likes: p.like_count || 0,
        comments: p.comment_count || 0,
        posted_at: p.posted_at
      })),
    recommendations: [
      analysis.find(a => a.type === 'withHashtags')?.avgEngagement > analysis.find(a => a.type === 'withoutHashtags')?.avgEngagement 
        ? 'Los posts con hashtags tienen mejor rendimiento'
        : 'Los posts sin hashtags funcionan mejor para tu audiencia',
      analysis.find(a => a.type === 'questions')?.avgEngagement > 30 
        ? 'Las preguntas generan gran engagement, úsalas más'
        : 'Considera hacer más preguntas para generar interacción'
    ]
  }
}

// Análisis de hashtags
function analyzeHashtagPerformance(posts: any[]) {
  const hashtagStats: Record<string, { uses: number, totalLikes: number, totalComments: number, avgEngagement: number }> = {}

  posts.forEach(post => {
    if (post.hashtags && post.hashtags.length > 0) {
      const engagement = (post.like_count || 0) + (post.comment_count || 0) * 2
      
      post.hashtags.forEach((hashtag: string) => {
        if (!hashtagStats[hashtag]) {
          hashtagStats[hashtag] = { uses: 0, totalLikes: 0, totalComments: 0, avgEngagement: 0 }
        }
        
        hashtagStats[hashtag].uses++
        hashtagStats[hashtag].totalLikes += post.like_count || 0
        hashtagStats[hashtag].totalComments += post.comment_count || 0
        hashtagStats[hashtag].avgEngagement += engagement
      })
    }
  })

  // Calcular promedios
  Object.keys(hashtagStats).forEach(hashtag => {
    const stats = hashtagStats[hashtag]
    stats.avgEngagement = stats.avgEngagement / stats.uses
  })

  const topHashtags = Object.entries(hashtagStats)
    .sort(([,a], [,b]) => b.avgEngagement - a.avgEngagement)
    .slice(0, 10)
    .map(([hashtag, stats]) => ({
      hashtag,
      uses: stats.uses,
      avgEngagement: Math.round(stats.avgEngagement),
      performance: stats.avgEngagement > 50 ? 'Excelente' : stats.avgEngagement > 20 ? 'Bueno' : 'Regular'
    }))

  return {
    topPerforming: topHashtags,
    totalUniqueHashtags: Object.keys(hashtagStats).length,
    recommendations: [
      `#${topHashtags[0]?.hashtag} es tu hashtag más efectivo con ${topHashtags[0]?.avgEngagement} engagement promedio`,
      `Usa una mezcla de hashtags populares y nicho para maximizar alcance`,
      `Considera rotar hashtags para evitar shadowbanning`
    ]
  }
}

// Análisis de sentimientos con IA
async function analyzeSentimentWithAI(posts: any[]) {
  if (!OPENAI_API_KEY) {
    return {
      analysis: 'AI analysis not available',
      sentiment: 'neutral',
      confidence: 0
    }
  }

  const recentPosts = posts.slice(0, 5).map(p => p.caption).join('\n\n')
  
  const prompt = `
Analiza el sentimiento y tono de estos posts de Instagram de una marca de skincare:

${recentPosts}

Responde en formato JSON con:
{
  "overall_sentiment": "positive/negative/neutral",
  "brand_tone": "descripción del tono de marca",
  "emotional_triggers": ["lista de emociones que genera"],
  "audience_connection": "análisis de conexión con audiencia",
  "recommendations": ["recomendaciones para mejorar"],
  "confidence_score": 0.85
}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en análisis de sentimientos y marketing de marca. Analiza el contenido y responde en JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    return JSON.parse(result.choices[0].message.content)
  } catch (error) {
    console.error('Error in sentiment analysis:', error)
    return {
      analysis: 'Error in AI analysis',
      sentiment: 'neutral',
      confidence: 0
    }
  }
}

// Análisis de tendencias de rendimiento
function analyzePerformanceTrends(posts: any[]) {
  const sortedPosts = posts.sort((a, b) => new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime())
  
  const periods = []
  const periodSize = Math.max(1, Math.floor(sortedPosts.length / 4)) // Dividir en 4 períodos
  
  for (let i = 0; i < sortedPosts.length; i += periodSize) {
    const periodPosts = sortedPosts.slice(i, i + periodSize)
    const avgEngagement = periodPosts.reduce((sum, p) => sum + ((p.like_count || 0) + (p.comment_count || 0)), 0) / periodPosts.length
    
    periods.push({
      period: Math.floor(i / periodSize) + 1,
      posts: periodPosts.length,
      avgEngagement: Math.round(avgEngagement),
      dateRange: {
        from: periodPosts[0]?.posted_at,
        to: periodPosts[periodPosts.length - 1]?.posted_at
      }
    })
  }

  const trend = periods.length > 1 ? 
    (periods[periods.length - 1].avgEngagement > periods[0].avgEngagement ? 'ascending' : 'descending') : 'stable'

  return {
    periods,
    trend,
    predictions: [
      trend === 'ascending' ? 'Tu engagement está mejorando constantemente' : 'Necesitas optimizar tu estrategia de contenido',
      `Basado en tendencias, tu próximo post podría generar ~${Math.round(periods[periods.length - 1]?.avgEngagement * 1.1)} interacciones`,
      'Mantén la consistencia en publicación para mejorar algoritmo'
    ]
  }
}

// Análisis competitivo
function generateCompetitiveInsights(posts: any[]) {
  const avgEngagement = posts.reduce((sum, p) => sum + ((p.like_count || 0) + (p.comment_count || 0)), 0) / posts.length
  
  // Benchmarks de la industria (estos podrían venir de una base de datos de competidores)
  const industryBenchmarks = {
    beauty: { avgLikes: 45, avgComments: 8, posts_per_week: 4 },
    skincare: { avgLikes: 38, avgComments: 6, posts_per_week: 3 }
  }

  const postsPerWeek = posts.length / 4 // Asumiendo 4 semanas de data

  return {
    performance_vs_industry: {
      your_engagement: Math.round(avgEngagement),
      industry_average: industryBenchmarks.skincare.avgLikes,
      performance: avgEngagement > industryBenchmarks.skincare.avgLikes ? 'Por encima' : 'Por debajo'
    },
    posting_frequency: {
      your_frequency: Math.round(postsPerWeek),
      recommended: industryBenchmarks.skincare.posts_per_week,
      status: postsPerWeek >= industryBenchmarks.skincare.posts_per_week ? 'Óptima' : 'Incrementar'
    },
    opportunities: [
      'Analiza qué contenido genera más engagement en competidores',
      'Considera colaboraciones con micro-influencers del sector',
      'Optimiza horarios de publicación basado en tu audiencia específica'
    ]
  }
}