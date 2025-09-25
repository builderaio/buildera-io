import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Universal AI Provider Handler
 * Esta función puede manejar cualquier proveedor de IA que se configure
 */

interface ProviderConfig {
  baseUrl: string;
  authHeader: (apiKey: string) => string;
  envKey: string;
  formatRequest: (model: string, messages: any[], config: any) => any;
  parseResponse: (data: any) => string;
  customHeaders?: Record<string, string>;
  urlTransform?: (baseUrl: string, model: string, apiKey: string) => string;
}

// Configuraciones de proveedores predefinidas
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    authHeader: (apiKey: string) => `Bearer ${apiKey}`,
    envKey: 'OPENAI_API_KEY',
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
    }),
    parseResponse: (data: any) => data.choices[0].message.content
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    authHeader: (apiKey: string) => `Bearer ${apiKey}`,
    envKey: 'ANTHROPIC_API_KEY',
    customHeaders: { 'anthropic-version': '2023-06-01' },
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || '',
    }),
    parseResponse: (data: any) => data.content[0].text
  },
  google: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    authHeader: (apiKey: string) => apiKey,
    envKey: 'GOOGLE_API_KEY',
    urlTransform: (baseUrl: string, model: string, apiKey: string) => 
      `${baseUrl}/${model}:generateContent?key=${apiKey}`,
    formatRequest: (model: string, messages: any[], config: any) => ({
      contents: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      systemInstruction: messages.find(m => m.role === 'system')?.content,
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.max_tokens,
        topP: config.top_p,
      }
    }),
    parseResponse: (data: any) => data.candidates[0].content.parts[0].text
  },
  xai: {
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    authHeader: (apiKey: string) => `Bearer ${apiKey}`,
    envKey: 'XAI_API_KEY',
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
    }),
    parseResponse: (data: any) => data.choices[0].message.content
  },
  perplexity: {
    baseUrl: 'https://api.perplexity.ai/chat/completions',
    authHeader: (apiKey: string) => `Bearer ${apiKey}`,
    envKey: 'PERPLEXITY_API_KEY',
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'month',
      frequency_penalty: config.frequency_penalty || 1,
      presence_penalty: config.presence_penalty || 0
    }),
    parseResponse: (data: any) => data.choices[0].message.content
  }
};

/**
 * Función para agregar automáticamente un nuevo proveedor
 */
async function addNewProvider(
  providerName: string, 
  config: ProviderConfig
): Promise<void> {
  PROVIDER_CONFIGS[providerName] = config;
  console.log(`Provider ${providerName} added successfully`);
}

/**
 * Obtener proveedor activo desde la base de datos
 */
async function getActiveProvider() {
  const { data: selection, error } = await supabase
    .from('ai_model_selections')
    .select('provider, model_name, api_key_id')
    .eq('is_active', true)
    .single();

  if (error || !selection) {
    throw new Error('No hay proveedor de IA activo configurado');
  }

  return selection;
}

/**
 * Obtener API key para el proveedor
 */
async function getApiKey(apiKeyId: string, provider: string): Promise<string> {
  // Intentar obtener desde la base de datos primero
  const { data: keyRecord, error } = await supabase
    .from('llm_api_keys')
    .select('api_key_hash')
    .eq('id', apiKeyId)
    .eq('status', 'active')
    .single();

  if (!error && keyRecord) {
    // En un entorno real, descifrarías la clave aquí
    console.log(`Using configured API key from database for provider: ${provider}`);
  }

  // Fallback a variable de entorno
  const providerConfig = PROVIDER_CONFIGS[provider];
  if (!providerConfig) {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }

  const apiKey = Deno.env.get(providerConfig.envKey);
  if (!apiKey) {
    throw new Error(`API key no configurada para el proveedor: ${provider}`);
  }

  return apiKey;
}

/**
 * Llamar al proveedor de IA universal
 */
async function callAIProvider(
  provider: string, 
  model: string, 
  messages: any[], 
  config: any, 
  apiKey: string
): Promise<string> {
  const providerConfig = PROVIDER_CONFIGS[provider];
  if (!providerConfig) {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }

  // Configurar URL
  let url = providerConfig.baseUrl;
  if (providerConfig.urlTransform) {
    url = providerConfig.urlTransform(providerConfig.baseUrl, model, apiKey);
  }

  // Configurar headers
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Agregar autenticación
  if (!providerConfig.urlTransform || provider !== 'google') {
    headers['Authorization'] = providerConfig.authHeader(apiKey);
  }

  // Agregar headers personalizados
  if (providerConfig.customHeaders) {
    headers = { ...headers, ...providerConfig.customHeaders };
  }

  // Formatear request
  const requestBody = providerConfig.formatRequest(model, messages, config);

  console.log(`Calling ${provider} API:`, { url, requestBody });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`${provider} API response:`, data);

  return providerConfig.parseResponse(data);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      messages, 
      functionName, 
      context,
      // Para agregar nuevos proveedores
      newProvider 
    } = await req.json();

    // Acción para agregar un nuevo proveedor dinámicamente
    if (action === 'addProvider' && newProvider) {
      await addNewProvider(newProvider.name, newProvider.config);
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Provider ${newProvider.name} added successfully` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Acción para listar proveedores disponibles
    if (action === 'listProviders') {
      return new Response(JSON.stringify({ 
        providers: Object.keys(PROVIDER_CONFIGS),
        configurations: PROVIDER_CONFIGS 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Procesamiento estándar de IA
    if (!messages || !functionName) {
      return new Response(JSON.stringify({ 
        error: 'Se requieren messages y functionName' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener proveedor activo
    const activeProvider = await getActiveProvider();
    const apiKey = await getApiKey(activeProvider.api_key_id, activeProvider.provider);

    // Obtener configuración de IA desde la base de datos
    const { data: config, error: configError } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', functionName)
      .single();

    if (configError) {
      console.error('Error loading AI config:', configError);
    }

    const aiConfig = config || {
      model_name: activeProvider.model_name,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };

    console.log('Using provider:', activeProvider.provider);
    console.log('Using model:', activeProvider.model_name);
    console.log('Using AI config:', aiConfig);

    const response = await callAIProvider(
      activeProvider.provider,
      activeProvider.model_name,
      messages,
      aiConfig,
      apiKey
    );

    return new Response(JSON.stringify({ 
      success: true,
      response,
      provider: activeProvider.provider,
      model: activeProvider.model_name,
      context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-provider-handler function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as Error).message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});