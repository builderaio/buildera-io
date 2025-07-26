import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeployAgentRequest {
  template_id: string;
  name: string;
  contextualized_instructions: string;
  tenant_config: {
    company_name: string;
    industry: string;
    interface_configs: Array<{
      id: string;
      enabled: boolean;
      config: Record<string, any>;
    }>;
    knowledge_base: {
      sourceType: string;
      sourceContent: string;
      sourceFile?: any;
    };
  };
  tools_permissions: any;
}

const generateUniqueInterfaceUrls = (agentId: string, companyId: string, interfaces: any[]) => {
  const baseUrl = 'https://api.buildera.ai';
  const uniqueHash = btoa(`${agentId}-${companyId}-${Date.now()}`).slice(0, 12);
  
  const urls: Record<string, any> = {};
  
  interfaces.forEach(iface => {
    switch (iface.id) {
      case 'chat':
        urls.chat = {
          url: `${baseUrl}/chat/${uniqueHash}`,
          embed_code: `<script src="${baseUrl}/widgets/chat/${uniqueHash}.js"></script>`,
          access_token: generateAccessToken(agentId, companyId, 'chat')
        };
        break;
      case 'api_webhook':
        urls.api = {
          url: `${baseUrl}/agents/${uniqueHash}/webhook`,
          api_key: generateApiKey(agentId, companyId),
          documentation: `${baseUrl}/docs/agents/${uniqueHash}`
        };
        break;
      case 'web_widget':
        urls.widget = {
          url: `${baseUrl}/widgets/${uniqueHash}`,
          embed_code: `<div id="buildera-widget-${uniqueHash}"></div><script src="${baseUrl}/widgets/${uniqueHash}/embed.js"></script>`,
          configuration_url: `${baseUrl}/admin/widgets/${uniqueHash}/config`
        };
        break;
      case 'email_monitor':
        urls.email = {
          webhook_url: `${baseUrl}/email/${uniqueHash}/webhook`,
          monitoring_status: 'pending_configuration',
          setup_instructions: 'Configure email forwarding to the webhook URL'
        };
        break;
      case 'dashboard':
        urls.dashboard = {
          url: `${baseUrl}/dashboard/${uniqueHash}`,
          analytics_api: `${baseUrl}/analytics/${uniqueHash}`,
          access_token: generateAccessToken(agentId, companyId, 'dashboard')
        };
        break;
    }
  });
  
  return urls;
};

const generateAccessToken = (agentId: string, companyId: string, scope: string) => {
  return btoa(`${agentId}:${companyId}:${scope}:${Date.now()}`);
};

const generateApiKey = (agentId: string, companyId: string) => {
  return `bld_${btoa(`${agentId}:${companyId}`).slice(0, 32)}`;
};

const createOpenAIAssistant = async (agentData: any) => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const tools = [];
  
  // Configurar herramientas basadas en tools_permissions
  if (agentData.tools_permissions) {
    agentData.tools_permissions.forEach((tool: any) => {
      if (tool.enabled) {
        switch (tool.type) {
          case 'web_browser':
            tools.push({ type: 'web_search' });
            break;
          case 'code_interpreter':
            tools.push({ type: 'code_interpreter' });
            break;
          case 'file_search':
            tools.push({ type: 'file_search' });
            break;
        }
      }
    });
  }

  const response = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      name: agentData.name,
      instructions: agentData.contextualized_instructions,
      model: 'gpt-4o-mini',
      tools: tools,
      metadata: {
        buildera_agent_id: agentData.id,
        company_name: agentData.tenant_config.company_name,
        created_at: new Date().toISOString()
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create OpenAI assistant: ${error}`);
  }

  const assistant = await response.json();
  return assistant.id;
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

    const { 
      template_id, 
      name, 
      contextualized_instructions, 
      tenant_config, 
      tools_permissions 
    }: DeployAgentRequest = await req.json();

    // Obtener información del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Authentication failed');

    // Crear la instancia del agente
    const { data: agentInstance, error: insertError } = await supabase
      .from('agent_instances')
      .insert({
        template_id,
        user_id: user.id,
        name,
        contextualized_instructions,
        tenant_config,
        tools_permissions,
        status: 'deploying'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log('Agent instance created:', agentInstance.id);

    // Generar URLs únicas para las interfaces
    const interfaceUrls = generateUniqueInterfaceUrls(
      agentInstance.id,
      user.id,
      tenant_config.interface_configs.filter(c => c.enabled)
    );

    console.log('Interface URLs generated:', interfaceUrls);

    // Crear asistente en OpenAI
    let openaiAgentId = null;
    try {
      openaiAgentId = await createOpenAIAssistant({
        ...agentInstance,
        id: agentInstance.id
      });
      console.log('OpenAI assistant created:', openaiAgentId);
    } catch (error) {
      console.error('Failed to create OpenAI assistant:', error);
      // Continuar sin OpenAI por ahora
    }

    // Actualizar la instancia con las URLs y el ID de OpenAI
    const { error: updateError } = await supabase
      .from('agent_instances')
      .update({
        tenant_config: {
          ...tenant_config,
          interface_urls: interfaceUrls
        },
        openai_agent_id: openaiAgentId,
        status: 'active'
      })
      .eq('id', agentInstance.id);

    if (updateError) throw updateError;

    // Configurar integraciones específicas
    await configureIntegrations(supabase, agentInstance.id, tenant_config.interface_configs, interfaceUrls);

    return new Response(JSON.stringify({
      success: true,
      agent_id: agentInstance.id,
      interface_urls: interfaceUrls,
      openai_agent_id: openaiAgentId,
      status: 'active'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deploying agent:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function configureIntegrations(
  supabase: any, 
  agentId: string, 
  interfaceConfigs: any[], 
  interfaceUrls: Record<string, any>
) {
  for (const config of interfaceConfigs) {
    if (!config.enabled) continue;

    switch (config.id) {
      case 'email_monitor':
        // Configurar monitoreo de email
        if (config.config.company_email) {
          await supabase.from('email_integrations').insert({
            agent_id: agentId,
            email_address: config.config.company_email,
            imap_server: config.config.imap_server,
            smtp_server: config.config.smtp_server,
            webhook_url: interfaceUrls.email?.webhook_url,
            status: 'pending_validation'
          });
        }
        break;
      
      case 'web_widget':
        // Configurar widget web con branding
        await supabase.from('widget_configurations').insert({
          agent_id: agentId,
          widget_id: interfaceUrls.widget?.url.split('/').pop(),
          primary_color: config.config.primary_color,
          company_logo: config.config.company_logo,
          company_name: config.config.company_name,
          widget_type: 'embedded_chat'
        });
        break;

      case 'dashboard':
        // Configurar dashboard analytics
        await supabase.from('dashboard_configurations').insert({
          agent_id: agentId,
          dashboard_id: interfaceUrls.dashboard?.url.split('/').pop(),
          access_level: 'company_admin',
          analytics_enabled: true,
          real_time_updates: true
        });
        break;
    }
  }
}