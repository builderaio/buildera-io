import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  console.log('🧠 Instagram Intelligent Analysis request received')
  
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

    console.log(`🔍 Starting intelligent analysis for user: ${user.id}`)

    // Obtener todos los posts de Instagram del usuario
    const { data: posts, error: postsError } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('posted_at', { ascending: false })

    if (postsError) {
      throw new Error(`Error fetching posts: ${postsError.message}`)
    }

    if (!posts || posts.length === 0) {
      console.log('⚠️ No posts found for analysis')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No posts available for analysis' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`📊 Analyzing ${posts.length} posts`)

    // Preparar datos para el análisis
    const postsData = posts.map(post => ({
      caption: post.caption || '',
      likes: post.likes_count || 0,
      comments: post.comments_count || 0,
      hashtags: post.hashtags || [],
      mentions: post.mentions || [],
      postedAt: post.posted_at,
      mediaType: post.media_type,
      engagementRate: post.engagement_rate || 0
    }))

    // Calcular métricas generales
    const totalPosts = posts.length
    const avgLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0) / totalPosts
    const avgComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0) / totalPosts
    const avgEngagement = posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / totalPosts

    // Obtener hashtags más usados
    const hashtagFreq: Record<string, number> = {}
    posts.forEach(post => {
      (post.hashtags || []).forEach((tag: string) => {
        hashtagFreq[tag] = (hashtagFreq[tag] || 0) + 1
      })
    })
    const topHashtags = Object.entries(hashtagFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Análisis de buenas prácticas con IA
    const analysisPrompt = `
Analiza los siguientes datos de Instagram y genera hallazgos estratégicos basados en buenas prácticas de la red social:

MÉTRICAS GENERALES:
- Total de posts: ${totalPosts}
- Promedio de likes: ${avgLikes.toFixed(0)}
- Promedio de comentarios: ${avgComments.toFixed(0)}
- Tasa de engagement promedio: ${avgEngagement.toFixed(2)}%

HASHTAGS MÁS USADOS:
${topHashtags.map(h => `${h.tag}: ${h.count} veces`).join('\n')}

DATOS DE POSTS (últimos 10):
${postsData.slice(0, 10).map(post => `
- Likes: ${post.likes}, Comentarios: ${post.comments}, Engagement: ${post.engagementRate}%
- Caption: "${post.caption.substring(0, 100)}${post.caption.length > 100 ? '...' : ''}"
- Hashtags: ${post.hashtags.slice(0, 5).join(', ')}
`).join('\n')}

GENERA UN ANÁLISIS ESTRATÉGICO QUE INCLUYA:

1. FORTALEZAS IDENTIFICADAS: Qué está funcionando bien según las buenas prácticas de Instagram
2. OPORTUNIDADES DE MEJORA: Áreas específicas donde se puede optimizar el contenido
3. RECOMENDACIONES ESTRATÉGICAS: Sugerencias concretas basadas en buenas prácticas:
   - Horarios de publicación óptimos
   - Tipos de contenido que mejor funcionan
   - Estrategias de hashtags
   - Engagement y interacción con la audiencia
4. HALLAZGOS CLAVE: Insights únicos basados en los datos analizados
5. MÉTRICAS A SEGUIR: KPIs específicos para mejorar el rendimiento

Responde en formato JSON con esta estructura:
{
  "fortalezas": ["fortaleza1", "fortaleza2"],
  "oportunidades": ["oportunidad1", "oportunidad2"],
  "recomendaciones": {
    "contenido": ["recomendación1", "recomendación2"],
    "hashtags": ["recomendación1", "recomendación2"],
    "engagement": ["recomendación1", "recomendación2"]
  },
  "hallazgos": ["hallazgo1", "hallazgo2"],
  "metricas_seguir": ["métrica1", "métrica2"]
}
`

    console.log('🤖 Calling OpenAI for intelligent analysis')

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'Eres un experto en marketing digital y análisis de Instagram. Genera insights estratégicos basados en datos y mejores prácticas de la plataforma. Responde siempre en formato JSON válido.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const aiResult = await openAIResponse.json()
    const analysisResult = JSON.parse(aiResult.choices[0].message.content)

    console.log('✅ AI analysis completed')

    // Guardar insights en la base de datos
    const insightsToSave = [
      {
        user_id: user.id,
        insight_type: 'content_strategy',
        title: 'Análisis de Estrategia de Contenido',
        description: 'Fortalezas identificadas en la estrategia actual',
        platforms: ['instagram'],
        impact_level: 'high',
        data: {
          type: 'fortalezas',
          items: analysisResult.fortalezas,
          metrics: { avgLikes, avgComments, avgEngagement, totalPosts }
        },
        confidence_score: 0.85
      },
      {
        user_id: user.id,
        insight_type: 'optimization_opportunities',
        title: 'Oportunidades de Optimización',
        description: 'Áreas identificadas para mejorar el rendimiento',
        platforms: ['instagram'],
        impact_level: 'high',
        data: {
          type: 'oportunidades',
          items: analysisResult.oportunidades,
          recommendations: analysisResult.recomendaciones
        },
        confidence_score: 0.90
      },
      {
        user_id: user.id,
        insight_type: 'hashtag_strategy',
        title: 'Análisis de Estrategia de Hashtags',
        description: 'Optimización del uso de hashtags',
        platforms: ['instagram'],
        impact_level: 'medium',
        data: {
          type: 'hashtags',
          topHashtags: topHashtags,
          recommendations: analysisResult.recomendaciones.hashtags
        },
        confidence_score: 0.80
      },
      {
        user_id: user.id,
        insight_type: 'key_findings',
        title: 'Hallazgos Clave',
        description: 'Insights únicos identificados en el análisis',
        platforms: ['instagram'],
        impact_level: 'high',
        data: {
          type: 'hallazgos',
          items: analysisResult.hallazgos,
          metricas_seguir: analysisResult.metricas_seguir
        },
        confidence_score: 0.88
      }
    ]

    // Insertar todos los insights
    const { error: insightsError } = await supabase
      .from('marketing_insights')
      .insert(insightsToSave)

    if (insightsError) {
      console.error('Error saving insights:', insightsError)
      throw new Error(`Error saving insights: ${insightsError.message}`)
    }

    // Crear actionables basados en las recomendaciones
    const actionables = [
      ...analysisResult.recomendaciones.contenido.slice(0, 2).map((rec: string, index: number) => ({
        user_id: user.id,
        title: `Mejora de Contenido ${index + 1}`,
        description: rec,
        action_type: 'content_optimization',
        priority: 'high',
        status: 'pending',
        estimated_impact: 'medium'
      })),
      ...analysisResult.recomendaciones.hashtags.slice(0, 1).map((rec: string) => ({
        user_id: user.id,
        title: 'Optimización de Hashtags',
        description: rec,
        action_type: 'hashtag_strategy',
        priority: 'medium',
        status: 'pending',
        estimated_impact: 'medium'
      })),
      ...analysisResult.recomendaciones.engagement.slice(0, 1).map((rec: string) => ({
        user_id: user.id,
        title: 'Mejora de Engagement',
        description: rec,
        action_type: 'engagement_optimization',
        priority: 'high',
        status: 'pending',
        estimated_impact: 'high'
      }))
    ]

    if (actionables.length > 0) {
      const { error: actionablesError } = await supabase
        .from('marketing_actionables')
        .insert(actionables)

      if (actionablesError) {
        console.error('Error saving actionables:', actionablesError)
      }
    }

    console.log(`💡 Analysis completed: ${insightsToSave.length} insights and ${actionables.length} actionables created`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Análisis inteligente completado',
      insights_created: insightsToSave.length,
      actionables_created: actionables.length,
      analysis_summary: {
        total_posts: totalPosts,
        avg_engagement: avgEngagement,
        top_hashtags: topHashtags.slice(0, 5)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('❌ Instagram intelligent analysis error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})