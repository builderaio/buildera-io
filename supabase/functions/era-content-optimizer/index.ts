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

// Provider configurations
const PROVIDERS = {
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
    parseResponse: (data: any) => data.choices[0].message.content.trim()
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    authHeader: (apiKey: string) => `Bearer ${apiKey}`,
    envKey: 'ANTHROPIC_API_KEY',
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
    parseResponse: (data: any) => data.choices[0].message.content.trim()
  }
};

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

async function getApiKey(apiKeyId: string, provider: string) {
  // Try to get from database first
  const { data: keyRecord, error } = await supabase
    .from('llm_api_keys')
    .select('api_key_hash')
    .eq('id', apiKeyId)
    .eq('status', 'active')
    .single();

  if (!error && keyRecord) {
    // In a real environment, you would decrypt the key here
    console.log('Using configured API key from database for provider:', provider);
  }

  // Fallback to environment variable
  const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];
  if (!providerConfig) {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }

  const apiKey = Deno.env.get(providerConfig.envKey);
  if (!apiKey) {
    throw new Error(`API key no configurada para el proveedor: ${provider}`);
  }

  return apiKey;
}

async function callAIProvider(provider: string, model: string, messages: any[], config: any, apiKey: string) {
  const providerConfig = PROVIDERS[provider as keyof typeof PROVIDERS];
  if (!providerConfig) {
    throw new Error(`Proveedor no soportado: ${provider}`);
  }

  let url = providerConfig.baseUrl;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Handle different auth methods
  if (provider === 'google') {
    url = `${url}/${model}:generateContent?key=${apiKey}`;
  } else {
    headers['Authorization'] = providerConfig.authHeader(apiKey);
  }

  // Add provider-specific headers
  if (provider === 'anthropic') {
    headers['anthropic-version'] = '2023-06-01';
  }

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
    const { text, fieldType, context } = await req.json();

    if (!text || !fieldType) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Se requiere texto y tipo de campo' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get active provider and model
    const activeProvider = await getActiveProvider();
    const apiKey = await getApiKey(activeProvider.api_key_id, activeProvider.provider);

    // Obtener el template de prompt desde la base de datos
    let promptTemplate;
    
    // Buscar template específico para el tipo de campo
    const { data: specificTemplate, error: specificError } = await supabase
      .from('era_prompt_templates')
      .select('*')
      .eq('field_type', fieldType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (specificError && specificError.code !== 'PGRST116') {
      console.error('Error loading specific prompt template:', specificError);
    }

    if (!specificTemplate) {
      // Si no encuentra template específico, usar el default
      const { data: defaultTemplate, error: defaultError } = await supabase
        .from('era_prompt_templates')
        .select('*')
        .eq('field_type', 'default')
        .eq('is_active', true)
        .single();

      if (defaultError) {
        console.error('Error loading default prompt template:', defaultError);
        // Fallback a prompt hardcodeado
        promptTemplate = {
          system_prompt: 'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
          specific_instructions: 'Optimiza este CONTENIDO EMPRESARIAL:\n- Mejora claridad y profesionalismo\n- Mantén el mensaje principal\n- Optimiza para impacto\n- Usa lenguaje empresarial apropiado',
          max_words: 200,
          tone: 'professional'
        };
      } else {
        promptTemplate = defaultTemplate;
      }
    } else {
      promptTemplate = specificTemplate;
    }

    // Obtener configuración de IA desde la base de datos
    const { data: config, error: configError } = await supabase
      .from('ai_model_configurations')
      .select('*')
      .eq('function_name', 'era-content-optimizer')
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

    const systemPrompt = promptTemplate.system_prompt;
    const specificInstructions = promptTemplate.specific_instructions;

    // Crear el prompt completo con contexto
    const contextInfo = [
      context.companyName ? `Empresa: ${context.companyName}` : '',
      context.industry ? `Industria: ${context.industry}` : '',
      context.size ? `Tamaño: ${context.size}` : '',
      `Tono deseado: ${promptTemplate.tone}`,
      `Máximo de palabras: ${promptTemplate.max_words}`
    ].filter(Boolean).join('\n');

    const messages = [
      { 
        role: 'system', 
        content: systemPrompt 
      },
      { 
        role: 'user', 
        content: `${specificInstructions}\n\nContexto adicional:\n${contextInfo}\n\nTexto a optimizar: "${text}"` 
      }
    ];

    console.log('Using provider:', activeProvider.provider);
    console.log('Using model:', activeProvider.model_name);
    console.log('Using AI config:', aiConfig);
    console.log('Using prompt template:', promptTemplate.field_type || 'default');

    const optimizedText = await callAIProvider(
      activeProvider.provider,
      activeProvider.model_name,
      messages,
      aiConfig,
      apiKey
    );

    console.log('Texto optimizado generado:', optimizedText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        optimizedText,
        originalLength: text.length,
        optimizedLength: optimizedText.length,
        fieldType,
        templateUsed: promptTemplate.field_type || 'default',
        tone: promptTemplate.tone,
        maxWords: promptTemplate.max_words,
        provider: activeProvider.provider,
        model: activeProvider.model_name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in era-content-optimizer function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});