import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🚀 Calculate Dashboard Metrics request received')
  
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

    console.log(`📊 Calculating dashboard metrics for user: ${user.id}`)

    // Definir periodo (último mes)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)

    // 1. Métricas de Agentes (nueva arquitectura: platform_agents + company_enabled_agents)
    console.log('📈 Calculating agent metrics...')
    
    // Obtener compañías del usuario
    const { data: companyMemberships } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
    
    const companyIds = companyMemberships?.map(m => m.company_id) || []
    
    // Contar agentes habilitados
    let totalAgents = 0
    let activeAgents = 0
    if (companyIds.length > 0) {
      const { data: enabledAgents } = await supabase
        .from('company_enabled_agents')
        .select('id, is_active')
        .in('company_id', companyIds)
      
      totalAgents = enabledAgents?.length || 0
      activeAgents = enabledAgents?.filter(a => a.is_active).length || 0
    }

    // Obtener uso de agentes desde agent_usage_log
    const { data: agentUsage } = await supabase
      .from('agent_usage_log')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    const agentMissionsCompleted = agentUsage?.filter(u => u.status === 'completed').length || 0
    const agentHoursSaved = agentMissionsCompleted * 2.5 // Estimación: 2.5 horas por misión

    // 2. Métricas de Marketing
    console.log('📱 Calculating marketing metrics...')
    const { data: socialConnections } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)

    const { data: instagramConnections } = await supabase
      .from('facebook_instagram_connections')
      .select('*')
      .eq('user_id', user.id)

    const { data: tiktokConnections } = await supabase
      .from('tiktok_connections')
      .select('*')
      .eq('user_id', user.id)

    const totalSocialConnections = (socialConnections?.length || 0) + 
                                  (instagramConnections?.length || 0) + 
                                  (tiktokConnections?.length || 0)

    const { data: posts, error: postsError } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', user.id)
      .gte('posted_at', startDate.toISOString())

    const totalPosts = posts?.length || 0
    const totalEngagement = posts?.reduce((sum, post) => 
      sum + (post.like_count || 0) + (post.comment_count || 0), 0) || 0

    // Calcular crecimiento de alcance (comparar con mes anterior)
    const prevStartDate = new Date(startDate)
    prevStartDate.setMonth(prevStartDate.getMonth() - 1)
    
    const { data: prevPosts } = await supabase
      .from('instagram_posts')
      .select('*')
      .eq('user_id', user.id)
      .gte('posted_at', prevStartDate.toISOString())
      .lt('posted_at', startDate.toISOString())

    const prevEngagement = prevPosts?.reduce((sum, post) => 
      sum + (post.like_count || 0) + (post.comment_count || 0), 0) || 0
    
    const reachGrowthPercent = prevEngagement > 0 ? 
      ((totalEngagement - prevEngagement) / prevEngagement) * 100 : 0

    // 3. Métricas de Archivos/Conocimiento
    console.log('📁 Calculating file metrics...')
    const { data: files, error: filesError } = await supabase
      .from('company_files')
      .select('*')
      .eq('user_id', user.id)

    const totalFiles = files?.length || 0
    const knowledgeBaseSizeMb = files?.reduce((sum, file) => 
      sum + (file.file_size || 0), 0) / (1024 * 1024) || 0

    // 4. Métricas de Marketing Insights
    console.log('🧠 Calculating insights metrics...')
    const { data: insights } = await supabase
      .from('marketing_insights')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())

    const totalInsights = insights?.length || 0

    // 5. Calcular métricas financieras estimadas
    const estimatedCostSavings = (agentHoursSaved * 25) + (totalPosts * 5) // $25/hora + $5/post
    const roiPercentage = estimatedCostSavings > 0 ? Math.min(estimatedCostSavings / 100, 300) : 0

    // 6. Métricas de productividad
    const tasksAutomated = agentMissionsCompleted + totalPosts + totalInsights
    const efficiencyScore = Math.min(
      ((totalAgents * 20) + (totalSocialConnections * 15) + (totalFiles * 5)) / 100,
      100
    )

    // Preparar datos de métricas
    const metricsData = {
      user_id: user.id,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
      
      // Agentes
      total_agents: totalAgents,
      active_agents: activeAgents,
      agent_missions_completed: agentMissionsCompleted,
      agent_hours_saved: agentHoursSaved,
      
      // Marketing
      total_social_connections: totalSocialConnections,
      total_posts: totalPosts,
      total_engagement: totalEngagement,
      reach_growth_percent: reachGrowthPercent,
      
      // Archivos
      total_files: totalFiles,
      knowledge_base_size_mb: knowledgeBaseSizeMb,
      
      // Financieras
      estimated_cost_savings: estimatedCostSavings,
      roi_percentage: roiPercentage,
      
      // Productividad
      tasks_automated: tasksAutomated,
      efficiency_score: efficiencyScore,
      
      metadata: {
        insights_count: totalInsights,
        calculation_timestamp: new Date().toISOString(),
        period_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    // Eliminar métricas anteriores del mismo periodo
    await supabase
      .from('company_dashboard_metrics')
      .delete()
      .eq('user_id', user.id)
      .eq('period_start', startDate.toISOString())

    // Insertar nuevas métricas
    const { data: insertedMetrics, error: insertError } = await supabase
      .from('company_dashboard_metrics')
      .insert([metricsData])
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting metrics:', insertError)
      throw new Error(`Error inserting metrics: ${insertError.message}`)
    }

    // Generar alertas inteligentes basadas en las métricas
    console.log('🔔 Generating intelligent alerts...')
    const alerts = []

    // Alerta de oportunidad si no hay conexiones sociales
    if (totalSocialConnections === 0) {
      alerts.push({
        user_id: user.id,
        alert_type: 'opportunity',
        title: '🚀 Conecta tus Redes Sociales',
        description: 'Conecta LinkedIn, Instagram o TikTok para automatizar tu marketing y aumentar tu alcance hasta un 300%',
        priority: 'high',
        action_url: 'marketing-hub',
        action_text: 'Conectar Ahora'
      })
    }

    // Alerta de logro si hay buen engagement
    if (totalEngagement > 100) {
      alerts.push({
        user_id: user.id,
        alert_type: 'achievement',
        title: '🎉 ¡Excelente Engagement!',
        description: `Has generado ${totalEngagement} interacciones este mes. Tu audiencia está muy activa.`,
        priority: 'medium'
      })
    }

    // Alerta de recomendación si no hay agentes
    if (totalAgents === 0) {
      alerts.push({
        user_id: user.id,
        alert_type: 'recommendation',
        title: '🤖 Automatiza tu Negocio',
        description: 'Habilita tu primer agente IA para automatizar tareas repetitivas y ahorrar hasta 20 horas semanales',
        priority: 'high',
        action_url: 'marketplace',
        action_text: 'Explorar Agentes'
      })
    }

    // Alerta de advertencia si la eficiencia es baja
    if (efficiencyScore < 30) {
      alerts.push({
        user_id: user.id,
        alert_type: 'warning',
        title: '⚡ Mejora tu Eficiencia',
        description: 'Tu score de eficiencia es bajo. Te ayudamos a optimizar tus procesos y aumentar la productividad.',
        priority: 'medium',
        action_url: 'adn-empresa',
        action_text: 'Optimizar Ahora'
      })
    }

    // Insertar alertas (eliminar las existentes primero)
    if (alerts.length > 0) {
      await supabase
        .from('dashboard_alerts')
        .delete()
        .eq('user_id', user.id)
        .eq('expires_at', null)

      await supabase
        .from('dashboard_alerts')
        .insert(alerts)
    }

    console.log(`✅ Dashboard metrics calculated successfully. Alerts generated: ${alerts.length}`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Dashboard metrics calculated successfully',
      data: insertedMetrics,
      alerts_generated: alerts.length,
      summary: {
        total_agents: totalAgents,
        total_social_connections: totalSocialConnections,
        total_engagement: totalEngagement,
        efficiency_score: efficiencyScore,
        estimated_savings: estimatedCostSavings
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('❌ Dashboard metrics calculation error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
