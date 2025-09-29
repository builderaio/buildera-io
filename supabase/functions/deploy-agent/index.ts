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
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.split(' ')[1])
    
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { template_id, company_id, deployment_name, custom_configuration } = await req.json()

    // Verificar que el usuario es miembro de la empresa
    const { data: membership } = await supabaseClient
      .from('company_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (!membership) {
      throw new Error('User not authorized for this company')
    }

    // Generar API key única
    const apiKey = `ak_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`
    const baseUrl = `https://${req.headers.get('host')}`

    // Crear deployment
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('agent_deployments')
      .insert({
        template_id,
        company_id,
        deployment_name,
        custom_configuration,
        api_endpoint_url: `${baseUrl}/api/agent/${template_id}`,
        widget_embed_code: generateWidgetCode(template_id, apiKey),
        status: 'active'
      })
      .select()
      .single()

    if (deploymentError) throw deploymentError

    // Crear endpoints de API
    const endpoints = [
      {
        deployment_id: deployment.id,
        endpoint_type: 'chat',
        endpoint_url: `${baseUrl}/api/agent/${template_id}/chat`,
        api_key: apiKey
      },
      {
        deployment_id: deployment.id,
        endpoint_type: 'webhook',
        endpoint_url: `${baseUrl}/api/agent/${template_id}/webhook`,
        api_key: apiKey
      },
      {
        deployment_id: deployment.id,
        endpoint_type: 'widget',
        endpoint_url: `${baseUrl}/api/agent/${template_id}/widget`,
        api_key: apiKey
      }
    ]

    const { error: endpointsError } = await supabaseClient
      .from('agent_api_endpoints')
      .insert(endpoints)

    if (endpointsError) throw endpointsError

    return new Response(
      JSON.stringify({
        success: true,
        deployment,
        endpoints: {
          chat: `${baseUrl}/api/agent/${template_id}/chat`,
          webhook: `${baseUrl}/api/agent/${template_id}/webhook`,
          widget: `${baseUrl}/api/agent/${template_id}/widget`
        },
        api_key: apiKey,
        widget_code: generateWidgetCode(template_id, apiKey)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deploying agent:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateWidgetCode(templateId: string, apiKey: string) {
  return `<!-- Buildera AI Agent Widget -->
<div id="buildera-agent-widget"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = 'https://cdn.buildera.ai/widget.js';
  script.async = true;
  script.onload = function() {
    BuilderaWidget.init({
      templateId: '${templateId}',
      apiKey: '${apiKey}',
      container: '#buildera-agent-widget',
      theme: 'auto',
      position: 'bottom-right'
    });
  };
  document.head.appendChild(script);
})();
</script>`
}