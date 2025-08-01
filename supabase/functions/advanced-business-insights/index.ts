import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🧠 Advanced Business Insights request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
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
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Generating advanced business insights for user:', userId);

    // Gather comprehensive data from all social media platforms
    const [
      instagramPosts,
      linkedinPosts, 
      facebookPosts,
      tiktokPosts,
      followersLocation,
      competitorAnalysis,
      existingInsights
    ] = await Promise.all([
      supabase.from('instagram_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(100),
      supabase.from('linkedin_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(100),
      supabase.from('facebook_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(100),
      supabase.from('tiktok_posts').select('*').eq('user_id', userId).order('posted_at', { ascending: false }).limit(100),
      supabase.from('followers_location_analysis').select('*').eq('user_id', userId).order('analysis_date', { ascending: false }).limit(50),
      supabase.from('competitor_analysis').select('*').eq('user_id', userId).order('last_analyzed', { ascending: false }).limit(20),
      supabase.from('marketing_insights').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
    ]);

    // Calculate comprehensive metrics across all platforms
    const allPosts = [
      ...(instagramPosts.data || []).map(p => ({ ...p, platform: 'instagram' })),
      ...(linkedinPosts.data || []).map(p => ({ ...p, platform: 'linkedin' })),
      ...(facebookPosts.data || []).map(p => ({ ...p, platform: 'facebook' })),
      ...(tiktokPosts.data || []).map(p => ({ ...p, platform: 'tiktok' }))
    ];

    console.log(`📊 Analyzing ${allPosts.length} posts across all platforms`);

    if (allPosts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No posts found for advanced analysis',
          insights_generated: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare comprehensive data for AI analysis
    const comprehensiveData = {
      totalPosts: allPosts.length,
      platformDistribution: {
        instagram: instagramPosts.data?.length || 0,
        linkedin: linkedinPosts.data?.length || 0,
        facebook: facebookPosts.data?.length || 0,
        tiktok: tiktokPosts.data?.length || 0
      },
      engagementMetrics: calculateEngagementMetrics(allPosts),
      contentPatterns: analyzeContentPatterns(allPosts),
      temporalPatterns: analyzeTemporalPatterns(allPosts),
      audienceInsights: followersLocation.data || [],
      competitorInsights: competitorAnalysis.data || [],
      previousInsights: existingInsights.data || []
    };

    console.log('🤖 Calling AI for advanced business insights generation');

    // Call Universal AI Handler for advanced analysis
    const aiResponse = await supabase.functions.invoke('universal-ai-handler', {
      body: {
        functionName: 'advanced_business_insights',
        messages: [
          {
            role: 'system',
            content: `Eres un consultor experto en marketing digital y análisis de negocios. Tu tarea es generar insights profundos y accionables que revelen tanto oportunidades evidentes como no evidentes para el crecimiento del negocio.

            ENFÓCATE EN GENERAR INSIGHTS DE ALTO VALOR:

            1. ANÁLISIS DE RENDIMIENTO CROSS-PLATFORM:
            - Identifica qué plataformas generan mejor ROI
            - Detecta sinergias entre plataformas
            - Encuentra gaps de oportunidad

            2. INSIGHTS NO EVIDENTES:
            - Patrones ocultos en comportamiento de audiencia
            - Correlaciones inesperadas entre contenido y engagement
            - Oportunidades de mercado no exploradas
            - Tendencias emergentes en tu nicho

            3. OPTIMIZACIÓN ESTRATÉGICA:
            - Recomendaciones específicas para aumentar conversiones
            - Estrategias de contenido basadas en datos
            - Identificación de mejores momentos y formatos
            - Optimización de recursos y presupuesto

            4. INSIGHTS COMPETITIVOS:
            - Ventajas competitivas únicas
            - Gaps en el mercado que puede explotar
            - Estrategias de diferenciación

            5. PREDICCIONES Y OPORTUNIDADES:
            - Tendencias futuras basadas en datos actuales
            - Nuevas audiencias potenciales
            - Productos/servicios complementarios
            - Expansion geográfica

            Cada insight debe incluir:
            - Impacto potencial en ingresos/crecimiento
            - Nivel de dificultad de implementación
            - Timeline estimado para ver resultados
            - Métricas específicas para medir éxito`
          },
          {
            role: 'user',
            content: `Analiza estos datos comprehensivos de redes sociales y genera insights avanzados para el negocio:

            DATOS GENERALES:
            ${JSON.stringify(comprehensiveData, null, 2)}
            
            POSTS DETALLADOS (muestra):
            ${JSON.stringify(allPosts.slice(0, 20), null, 2)}

            Genera insights que vayan más allá de lo obvio. Busca patrones, correlaciones y oportunidades que el dueño del negocio podría no ver por sí mismo.

            Responde en formato JSON con esta estructura:
            {
              "strategic_insights": [
                {
                  "category": "cross_platform_optimization|hidden_patterns|market_opportunities|competitive_advantage|audience_expansion",
                  "title": "Título impactante del insight",
                  "description": "Descripción detallada del insight y su relevancia",
                  "evidence": "Datos específicos que respaldan este insight",
                  "business_impact": "high|medium|low",
                  "revenue_potential": "Estimación del impacto en ingresos",
                  "implementation_difficulty": "easy|medium|hard", 
                  "timeline": "Tiempo estimado para ver resultados",
                  "confidence_score": 0.85,
                  "platforms": ["instagram", "linkedin", "etc"],
                  "is_evident": false
                }
              ],
              "growth_actionables": [
                {
                  "category": "content_strategy|audience_targeting|platform_optimization|competitive_response|new_opportunities",
                  "title": "Acción estratégica específica",
                  "description": "Qué hacer exactamente y por qué",
                  "expected_outcome": "Resultado esperado específico",
                  "priority": "urgent|high|medium|low",
                  "effort_required": "low|medium|high",
                  "success_metrics": ["métrica1", "métrica2"],
                  "estimated_impact": "Impacto cuantificado esperado"
                }
              ],
              "market_intelligence": {
                "untapped_audiences": ["descripción de audiencias no exploradas"],
                "content_gaps": ["tipos de contenido faltantes"],
                "seasonal_opportunities": ["oportunidades estacionales identificadas"],
                "cross_selling_potential": ["productos/servicios complementarios"],
                "geographic_expansion": ["mercados geográficos prometedores"]
              }
            }`
          }
        ]
      }
    });

    if (aiResponse.error) {
      console.error('AI analysis error:', aiResponse.error);
      throw new Error(`AI Analysis error: ${aiResponse.error.message}`);
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse.data.response);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Error parsing AI analysis result');
    }

    let insightsCreated = 0;
    let actionablesCreated = 0;

    // Save strategic insights
    if (analysisResult.strategic_insights && analysisResult.strategic_insights.length > 0) {
      for (const insight of analysisResult.strategic_insights) {
        const { error: insightError } = await supabase
          .from('marketing_insights')
          .insert({
            user_id: userId,
            insight_type: insight.category || 'strategic_analysis',
            title: insight.title,
            description: insight.description,
            data: {
              evidence: insight.evidence,
              revenue_potential: insight.revenue_potential,
              implementation_difficulty: insight.implementation_difficulty,
              timeline: insight.timeline,
              is_evident: insight.is_evident || false
            },
            confidence_score: insight.confidence_score || 0.8,
            impact_level: insight.business_impact || 'medium',
            platforms: insight.platforms || ['cross_platform']
          });

        if (!insightError) insightsCreated++;
      }
    }

    // Save growth actionables
    if (analysisResult.growth_actionables && analysisResult.growth_actionables.length > 0) {
      for (const actionable of analysisResult.growth_actionables) {
        const { error: actionableError } = await supabase
          .from('marketing_actionables')
          .insert({
            user_id: userId,
            title: actionable.title,
            description: actionable.description,
            action_type: actionable.category || 'growth_strategy',
            priority: actionable.priority || 'medium',
            status: 'pending',
            estimated_impact: actionable.estimated_impact
          });

        if (!actionableError) actionablesCreated++;
      }
    }

    // Save market intelligence
    if (analysisResult.market_intelligence) {
      await supabase
        .from('marketing_insights')
        .insert({
          user_id: userId,
          insight_type: 'market_intelligence',
          title: 'Inteligencia de Mercado Avanzada',
          description: 'Análisis comprehensivo de oportunidades de mercado y crecimiento',
          data: analysisResult.market_intelligence,
          confidence_score: 0.9,
          impact_level: 'high',
          platforms: ['cross_platform']
        });
      
      insightsCreated++;
    }

    console.log(`✅ Advanced insights generated: ${insightsCreated} insights, ${actionablesCreated} actionables`);

    return new Response(
      JSON.stringify({
        success: true,
        insights_generated: insightsCreated,
        actionables_generated: actionablesCreated,
        analysis_scope: {
          total_posts: allPosts.length,
          platforms_analyzed: Object.keys(comprehensiveData.platformDistribution).filter(p => comprehensiveData.platformDistribution[p] > 0),
          data_points: Object.keys(comprehensiveData).length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Advanced business insights error:', error);
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

function calculateEngagementMetrics(posts: any[]) {
  const metrics = {
    total_engagement: 0,
    avg_engagement_rate: 0,
    best_performing_platform: '',
    worst_performing_platform: '',
    engagement_trend: 'stable'
  };

  const platformMetrics = {};
  
  posts.forEach(post => {
    const engagement = (post.like_count || 0) + (post.comment_count || 0) + (post.shares_count || 0);
    metrics.total_engagement += engagement;
    
    if (!platformMetrics[post.platform]) {
      platformMetrics[post.platform] = { total: 0, count: 0 };
    }
    platformMetrics[post.platform].total += engagement;
    platformMetrics[post.platform].count += 1;
  });

  // Calculate averages and find best/worst platforms
  let bestAvg = 0, worstAvg = Infinity;
  Object.keys(platformMetrics).forEach(platform => {
    const avg = platformMetrics[platform].total / platformMetrics[platform].count;
    if (avg > bestAvg) {
      bestAvg = avg;
      metrics.best_performing_platform = platform;
    }
    if (avg < worstAvg) {
      worstAvg = avg;
      metrics.worst_performing_platform = platform;
    }
  });

  metrics.avg_engagement_rate = metrics.total_engagement / posts.length;
  return metrics;
}

function analyzeContentPatterns(posts: any[]) {
  const patterns = {
    most_engaging_content_types: [],
    optimal_content_length: 0,
    hashtag_effectiveness: {},
    visual_content_performance: 0,
    text_content_performance: 0
  };

  // Analyze content types and their performance
  const contentTypes = {};
  posts.forEach(post => {
    const hasImage = post.display_url || post.cover_url;
    const hasVideo = post.is_video || post.video_id || post.duration;
    const type = hasVideo ? 'video' : hasImage ? 'image' : 'text';
    
    const engagement = (post.like_count || 0) + (post.comment_count || 0);
    
    if (!contentTypes[type]) {
      contentTypes[type] = { total_engagement: 0, count: 0 };
    }
    contentTypes[type].total_engagement += engagement;
    contentTypes[type].count += 1;
  });

  // Sort by average engagement
  patterns.most_engaging_content_types = Object.keys(contentTypes)
    .map(type => ({
      type,
      avg_engagement: contentTypes[type].total_engagement / contentTypes[type].count
    }))
    .sort((a, b) => b.avg_engagement - a.avg_engagement);

  return patterns;
}

function analyzeTemporalPatterns(posts: any[]) {
  const patterns = {
    best_posting_hours: [],
    best_posting_days: [],
    posting_frequency_optimal: 0,
    seasonal_trends: {}
  };

  const hourlyPerformance = {};
  const dailyPerformance = {};

  posts.forEach(post => {
    if (post.posted_at) {
      const date = new Date(post.posted_at);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const engagement = (post.like_count || 0) + (post.comment_count || 0);
      
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { total: 0, count: 0 };
      }
      hourlyPerformance[hour].total += engagement;
      hourlyPerformance[hour].count += 1;
      
      if (!dailyPerformance[day]) {
        dailyPerformance[day] = { total: 0, count: 0 };
      }
      dailyPerformance[day].total += engagement;
      dailyPerformance[day].count += 1;
    }
  });

  // Find best hours and days
  patterns.best_posting_hours = Object.keys(hourlyPerformance)
    .map(hour => ({
      hour: parseInt(hour),
      avg_engagement: hourlyPerformance[hour].total / hourlyPerformance[hour].count
    }))
    .sort((a, b) => b.avg_engagement - a.avg_engagement)
    .slice(0, 3);

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  patterns.best_posting_days = Object.keys(dailyPerformance)
    .map(day => ({
      day: dayNames[parseInt(day)],
      avg_engagement: dailyPerformance[day].total / dailyPerformance[day].count
    }))
    .sort((a, b) => b.avg_engagement - a.avg_engagement)
    .slice(0, 3);

  return patterns;
}