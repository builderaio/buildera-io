import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    )

    // Procesar las métricas de uso mensual y calcular revenue share
    console.log('Starting monthly revenue calculation...')

    // Obtener todos los deployments activos del mes pasado
    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1)
    lastMonthStart.setHours(0, 0, 0, 0)

    const lastMonthEnd = new Date()
    lastMonthEnd.setDate(0)
    lastMonthEnd.setHours(23, 59, 59, 999)

    const { data: deployments, error: deploymentsError } = await supabaseClient
      .from('agent_deployments')
      .select(`
        *,
        template:whitelabel_agent_templates!inner(
          developer_id,
          base_price,
          revenue_share_percentage,
          pricing_model
        )
      `)
      .gte('created_at', lastMonthStart.toISOString())
      .lte('last_used_at', lastMonthEnd.toISOString())

    if (deploymentsError) throw deploymentsError

    const revenueEntries = []

    for (const deployment of deployments) {
      const template = deployment.template
      let revenueAmount = 0

      // Calcular revenue según el modelo de precio
      if (template.pricing_model === 'subscription') {
        revenueAmount = template.base_price
      } else if (template.pricing_model === 'usage_based') {
        revenueAmount = deployment.monthly_usage_count * template.base_price
      }

      if (revenueAmount > 0) {
        const developerShare = (revenueAmount * template.revenue_share_percentage) / 100
        const platformShare = revenueAmount - developerShare

        revenueEntries.push({
          template_id: deployment.template_id,
          deployment_id: deployment.id,
          developer_id: template.developer_id,
          company_id: deployment.company_id,
          usage_period_start: lastMonthStart.toISOString(),
          usage_period_end: lastMonthEnd.toISOString(),
          total_usage_count: deployment.monthly_usage_count,
          revenue_amount: revenueAmount,
          developer_share: developerShare,
          platform_share: platformShare,
          payment_status: 'pending'
        })
      }
    }

    // Insertar entradas de revenue tracking
    if (revenueEntries.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('revenue_tracking')
        .insert(revenueEntries)

      if (insertError) throw insertError
    }

    // Resetear contadores mensuales
    const { error: resetError } = await supabaseClient
      .from('agent_deployments')
      .update({ monthly_usage_count: 0 })
      .in('id', deployments.map(d => d.id))

    if (resetError) throw resetError

    console.log(`Processed ${revenueEntries.length} revenue entries`)

    return new Response(
      JSON.stringify({
        success: true,
        processed_deployments: deployments.length,
        revenue_entries: revenueEntries.length,
        total_revenue: revenueEntries.reduce((sum, entry) => sum + entry.revenue_amount, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error calculating revenue:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})