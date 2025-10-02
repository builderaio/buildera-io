import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeployAgentRequest {
  agent_instance_id: string;
  company_id: string;
  deployment_name: string;
  channels: string[];
  branding_config?: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    welcome_message?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader.split(' ')[1]);
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { 
      agent_instance_id, 
      company_id, 
      deployment_name, 
      channels,
      branding_config 
    } = await req.json() as DeployAgentRequest;

    console.log(`Deploying agent ${agent_instance_id} for company ${company_id}`);

    // Verificar que el agente existe y pertenece al usuario
    const { data: agentInstance, error: agentError } = await supabaseClient
      .from('agent_instances')
      .select('*')
      .eq('id', agent_instance_id)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agentInstance) {
      throw new Error('Agent instance not found or unauthorized');
    }

    // Generar URLs únicas y credenciales
    const baseUrl = `https://${req.headers.get('host')}`;
    const uniqueId = crypto.randomUUID().split('-')[0];
    const interfaceUrls = generateUniqueInterfaceUrls(agent_instance_id, company_id, uniqueId, baseUrl);

    // Crear deployment principal
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('agent_deployment_instances')
      .insert({
        agent_instance_id,
        company_id,
        deployment_name,
        deployment_config: { channels },
        branding_config: branding_config || {},
        status: 'active',
        ...interfaceUrls,
      })
      .select()
      .single();

    if (deploymentError) {
      console.error('Deployment error:', deploymentError);
      throw deploymentError;
    }

    console.log('Deployment created:', deployment.id);

    // Crear OpenAI Assistant si no existe
    let openaiAgentId = agentInstance.openai_agent_id;
    if (!openaiAgentId && agentInstance.input_parameters?.response_config) {
      openaiAgentId = await createOpenAIAssistant(agentInstance);
      
      // Actualizar agent_instance con el ID de OpenAI
      await supabaseClient
        .from('agent_instances')
        .update({ openai_agent_id: openaiAgentId })
        .eq('id', agent_instance_id);
    }

    // Crear canales solicitados
    const channelPromises = channels.map(channelType => 
      supabaseClient
        .from('agent_channels')
        .insert({
          agent_instance_id,
          channel_type: channelType,
          channel_config: getChannelConfig(channelType, interfaceUrls),
          is_active: true,
          endpoint_url: interfaceUrls[`${channelType}_url`] || interfaceUrls.api_url,
          access_token: generateAccessToken(),
        })
    );

    await Promise.all(channelPromises);
    console.log(`Created ${channels.length} channels`);

    // Configurar integraciones específicas
    await configureIntegrations(supabaseClient, agent_instance_id, channels, interfaceUrls);

    return new Response(
      JSON.stringify({
        success: true,
        deployment,
        urls: interfaceUrls,
        openai_agent_id: openaiAgentId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error deploying agent:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateUniqueInterfaceUrls(
  agentId: string, 
  companyId: string, 
  uniqueId: string,
  baseUrl: string
) {
  const chatUrl = `${baseUrl}/agent/${uniqueId}/chat`;
  const apiUrl = `${baseUrl}/api/agent/${uniqueId}`;
  const widgetUrl = `${baseUrl}/widget/${uniqueId}`;
  const dashboardUrl = `${baseUrl}/dashboard/agent/${uniqueId}`;
  const emailAddress = `agent-${uniqueId}@buildera.ai`;

  const widgetEmbedCode = `<!-- Buildera AI Agent Widget -->
<div id="buildera-agent-${uniqueId}"></div>
<script>
(function() {
  const script = document.createElement('script');
  script.src = '${baseUrl}/widget.js';
  script.async = true;
  script.onload = function() {
    BuilderaAgent.init({
      agentId: '${uniqueId}',
      container: '#buildera-agent-${uniqueId}',
      theme: 'auto'
    });
  };
  document.head.appendChild(script);
})();
</script>`;

  const apiDocumentation = `# API Documentation for Agent ${uniqueId}

## Endpoints

### Chat Endpoint
POST ${apiUrl}/chat
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json

Body:
{
  "message": "Your message here",
  "conversation_id": "optional-conversation-id"
}

### Status Endpoint
GET ${apiUrl}/status
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN

Response:
{
  "status": "active",
  "agent_id": "${agentId}",
  "uptime": "99.9%"
}`;

  return {
    chat_url: chatUrl,
    api_url: apiUrl,
    widget_url: widgetUrl,
    dashboard_url: dashboardUrl,
    email_address: emailAddress,
    widget_embed_code: widgetEmbedCode,
    api_documentation: apiDocumentation,
    access_credentials: {
      api_key: generateAccessToken(),
      webhook_secret: generateAccessToken(),
    }
  };
}

function getChannelConfig(channelType: string, urls: any) {
  const configs: Record<string, any> = {
    web_chat: {
      url: urls.chat_url,
      theme: 'auto',
      position: 'bottom-right',
    },
    api: {
      endpoint: urls.api_url,
      documentation: urls.api_documentation,
    },
    email: {
      address: urls.email_address,
      auto_reply: true,
    },
    dashboard: {
      url: urls.dashboard_url,
    },
    whatsapp: {
      enabled: false,
      requires_configuration: true,
    },
    slack: {
      enabled: false,
      requires_configuration: true,
    }
  };

  return configs[channelType] || {};
}

function generateAccessToken(): string {
  return `buildera_${crypto.randomUUID().replace(/-/g, '')}`;
}

async function createOpenAIAssistant(agentInstance: any): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const responseConfig = agentInstance.input_parameters?.response_config;
  if (!responseConfig) {
    throw new Error('Agent does not have response configuration');
  }

  // Para OpenAI Responses API, no necesitamos crear un Assistant
  // Simplemente retornamos un ID único para tracking
  return `response_${crypto.randomUUID()}`;
}

async function configureIntegrations(
  supabaseClient: any,
  agentInstanceId: string,
  channels: string[],
  urls: any
) {
  // Configurar integraciones específicas según los canales
  const integrations = [];

  if (channels.includes('email')) {
    integrations.push({
      agent_instance_id: agentInstanceId,
      integration_type: 'email',
      config_data: {
        email_address: urls.email_address,
        auto_reply: true,
        signature: 'Powered by Buildera AI',
      },
      is_active: true,
    });
  }

  if (channels.includes('web_chat') || channels.includes('dashboard')) {
    integrations.push({
      agent_instance_id: agentInstanceId,
      integration_type: 'widget',
      config_data: {
        widget_url: urls.widget_url,
        embed_code: urls.widget_embed_code,
      },
      is_active: true,
    });
  }

  if (integrations.length > 0) {
    await supabaseClient
      .from('integration_configurations')
      .insert(integrations);
  }
}
