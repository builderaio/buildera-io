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

// Provider configurations dynamically loaded from database
let providerConfigs: Record<string, any> = {};

// Base provider adapters - these handle the API specifics for each provider
const PROVIDER_ADAPTERS = {
  openai: {
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
    }),
    parseResponse: (data: any) => data.choices[0].message.content,
    getHeaders: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    })
  },
  anthropic: {
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content || '',
    }),
    parseResponse: (data: any) => data.content[0].text,
    getHeaders: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    })
  },
  google: {
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
    parseResponse: (data: any) => data.candidates[0].content.parts[0].text,
    getHeaders: (apiKey: string) => ({
      'Content-Type': 'application/json',
    }),
    getUrl: (baseUrl: string, model: string, apiKey: string) => 
      `${baseUrl}/models/${model}:generateContent?key=${apiKey}`
  },
  xai: {
    formatRequest: (model: string, messages: any[], config: any) => ({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
    }),
    parseResponse: (data: any) => data.choices[0].message.content,
    getHeaders: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    })
  },
  huggingface: {
    formatRequest: (model: string, messages: any[], config: any) => ({
      inputs: messages[messages.length - 1].content,
      parameters: {
        temperature: config.temperature,
        max_new_tokens: config.max_tokens,
        top_p: config.top_p,
      }
    }),
    parseResponse: (data: any) => {
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
      return data.generated_text || JSON.stringify(data);
    },
    getHeaders: (apiKey: string) => ({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }),
    getUrl: (baseUrl: string, model: string) => 
      `${baseUrl}/models/${model}`
  }
};

/**
 * Load provider configurations from database
 */
async function loadProviderConfigs() {
  try {
    const { data: providers, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    providers?.forEach(provider => {
      providerConfigs[provider.name] = provider;
    });

    console.log('Loaded provider configs:', Object.keys(providerConfigs));
  } catch (error) {
    console.error('Error loading provider configs:', error);
  }
}

/**
 * Get active model assignment for a business function
 */
async function getActiveModelAssignment(functionName: string) {
  try {
    console.log(`🔍 Searching for assignment with business_function: ${functionName}`);
    const { data: assignment, error } = await supabase
      .from('ai_model_assignments')
      .select(`
        *,
        provider:ai_providers(*),
        model:ai_models(*)
      `)
      .eq('is_active', true)
      .eq('business_function', functionName)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Database error in getActiveModelAssignment:', error);
      throw error;
    }
    
    console.log(`🎯 Assignment found:`, assignment ? 'YES' : 'NO');
    console.log(`📋 Assignment result:`, assignment ? 'Found ' + JSON.stringify(assignment, null, 2) : 'None');
    return assignment;
  } catch (error) {
    console.error('Error getting model assignment:', error);
    return null;
  }
}

/**
 * Get API key for provider
 */
async function getAPIKey(assignment: any) {
  // For now, use environment variable
  const provider = assignment.provider;
  const envKey = provider.env_key;
  const apiKey = Deno.env.get(envKey);
  
  if (!apiKey) {
    throw new Error(`API key not found for provider ${provider.name}. Check ${envKey} environment variable.`);
  }

  return apiKey;
}

/**
 * Universal AI provider caller
 */
async function callAIProvider(
  assignment: any,
  messages: any[]
): Promise<string> {
  const provider = assignment.provider;
  const model = assignment.model;
  const providerName = provider.name;
  
  console.log(`Calling ${providerName} with model ${model.model_name}`);

  const adapter = PROVIDER_ADAPTERS[providerName as keyof typeof PROVIDER_ADAPTERS];
  if (!adapter) {
    throw new Error(`Provider adapter not found for: ${providerName}`);
  }

  const apiKey = await getAPIKey(assignment);
  const modelParameters = assignment.model_parameters || {};

  // Merge default parameters with assignment-specific parameters
  const config = {
    temperature: 0.7,
    max_tokens: 500,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    ...modelParameters
  };

  // Get URL
  let url = provider.base_url;
  if (adapter.getUrl) {
    url = adapter.getUrl(provider.base_url, model.model_name, apiKey);
  } else {
    // Default URL construction for most providers
    if (providerName === 'openai' || providerName === 'xai') {
      url = `${provider.base_url}/chat/completions`;
    } else if (providerName === 'anthropic') {
      url = `${provider.base_url}/messages`;
    }
  }

  // Get headers
  const headers = adapter.getHeaders(apiKey);

  // Format request - ensure model name is available
  const modelName = model.name || model.model_name || 'gpt-4o-mini';
  const requestBody = adapter.formatRequest(modelName, messages, config);

  console.log(`Calling ${url} with:`, { requestBody });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${providerName} API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`${providerName} response:`, data);

  return adapter.parseResponse(data);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Load provider configs on first request
    if (Object.keys(providerConfigs).length === 0) {
      await loadProviderConfigs();
    }

    const { 
      functionName, 
      messages, 
      context,
      // Legacy support
      text,
      fieldType 
    } = await req.json();

    if (!functionName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'functionName is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active model assignment for this function
    console.log(`🔍 Getting model assignment for function: ${functionName}`);
    const assignment = await getActiveModelAssignment(functionName);
    console.log('📋 Assignment result:', assignment ? 'Found' : 'Not found', assignment);
    
    if (!assignment) {
      console.error(`❌ No assignment found for function: ${functionName}`);
      return new Response(JSON.stringify({ 
        success: false,
        error: `No active model assignment found for function: ${functionName}` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let formattedMessages = messages;

    // Legacy support for old ERA functions
    if (text && fieldType && !messages) {
      // Get prompt template for legacy functions
      const { data: template } = await supabase
        .from('era_prompt_templates')
        .select('*')
        .eq('field_type', fieldType.toLowerCase())
        .eq('is_active', true)
        .single();

      const systemPrompt = template?.system_prompt || 
        'Eres Era, la IA especializada de Buildera. Optimiza el contenido empresarial.';
      const instructions = template?.specific_instructions || 
        'Optimiza este contenido empresarial para que sea más profesional y claro.';

      formattedMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${instructions}\n\nTexto a optimizar: "${text}"` }
      ];
    }

    if (!formattedMessages || formattedMessages.length === 0) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'messages or text/fieldType are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${functionName} request with provider ${assignment.provider.display_name}`);

    const response = await callAIProvider(assignment, formattedMessages);

    return new Response(JSON.stringify({ 
      success: true,
      response,
      optimizedText: response, // Legacy compatibility
      provider: assignment.provider.name,
      model: assignment.model.model_name,
      functionName,
      context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in universal-ai-handler:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});