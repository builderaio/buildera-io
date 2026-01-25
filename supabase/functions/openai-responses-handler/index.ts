import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResponsesRequest {
  functionName: string;
  input: string | any[];
  context?: Record<string, any>;
  overrides?: {
    model?: string;
    temperature?: number;
    tools?: string[];
    systemPrompt?: string;
  };
}

interface FunctionConfig {
  function_name: string;
  display_name: string;
  provider: string;
  model_name: string;
  api_version: string;
  system_prompt: string | null;
  instructions: string | null;
  temperature: number;
  max_output_tokens: number;
  top_p: number;
  tools_enabled: string[];
  tools_config: Record<string, any>;
  custom_functions: any[];
  tool_choice: string;
  parallel_tool_calls: boolean;
  reasoning_enabled: boolean;
  reasoning_effort: string;
  requires_web_search: boolean;
}

interface ModelCompatibility {
  model_name: string;
  supports_web_search: boolean;
  supports_file_search: boolean;
  supports_code_interpreter: boolean;
  supports_reasoning: boolean;
  supports_responses_api: boolean;
}

async function loadFunctionConfig(supabase: any, functionName: string): Promise<FunctionConfig | null> {
  const { data, error } = await supabase
    .from('ai_function_configurations')
    .select('*')
    .eq('function_name', functionName)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error loading function config:', error);
    return null;
  }

  return data;
}

async function getModelCompatibility(supabase: any, modelName: string): Promise<ModelCompatibility | null> {
  const { data, error } = await supabase
    .from('ai_model_tool_compatibility')
    .select('*')
    .eq('model_name', modelName)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error loading model compatibility:', error);
    return null;
  }

  return data;
}

async function getOpenAIApiKey(supabase: any): Promise<string> {
  // Try to get from llm_api_keys table first
  const { data } = await supabase
    .from('llm_api_keys')
    .select('api_key')
    .eq('provider', 'openai')
    .eq('is_active', true)
    .maybeSingle();

  if (data?.api_key) {
    return data.api_key;
  }

  // Fallback to environment variable
  return Deno.env.get('OPENAI_API_KEY') || '';
}

function buildTools(
  enabledTools: string[],
  toolsConfig: Record<string, any>,
  customFunctions: any[],
  modelCompatibility: ModelCompatibility | null
): any[] {
  const tools: any[] = [];

  // Native OpenAI tools
  if (enabledTools.includes('web_search_preview') && modelCompatibility?.supports_web_search !== false) {
    const webSearchConfig: any = { type: 'web_search_preview' };
    
    if (toolsConfig.web_search) {
      if (toolsConfig.web_search.search_context_size) {
        webSearchConfig.search_context_size = toolsConfig.web_search.search_context_size;
      }
      if (toolsConfig.web_search.user_location) {
        webSearchConfig.user_location = toolsConfig.web_search.user_location;
      }
    }
    
    tools.push(webSearchConfig);
  }

  if (enabledTools.includes('file_search') && modelCompatibility?.supports_file_search !== false) {
    tools.push({ type: 'file_search' });
  }

  if (enabledTools.includes('code_interpreter') && modelCompatibility?.supports_code_interpreter !== false) {
    tools.push({ type: 'code_interpreter' });
  }

  // Custom function calling
  customFunctions.forEach((fn: any) => {
    tools.push({
      type: 'function',
      ...fn
    });
  });

  return tools;
}

function formatInput(input: string | any[], instructions: string | null): any {
  // If input is already an array of messages, use it directly
  if (Array.isArray(input)) {
    return input;
  }

  // If input is a string, combine with instructions
  let userContent = input;
  if (instructions) {
    userContent = `${instructions}\n\n${input}`;
  }

  return userContent;
}

function extractOutputText(response: any): string {
  // Handle Responses API format
  if (response.output) {
    // response.output is an array of output items
    const textOutputs = response.output
      .filter((item: any) => item.type === 'message')
      .flatMap((item: any) => item.content || [])
      .filter((content: any) => content.type === 'output_text')
      .map((content: any) => content.text);
    
    if (textOutputs.length > 0) {
      return textOutputs.join('\n');
    }

    // Try to get text from other output types
    const allTexts = response.output
      .filter((item: any) => item.type === 'message')
      .flatMap((item: any) => item.content || [])
      .filter((content: any) => content.text)
      .map((content: any) => content.text);
    
    if (allTexts.length > 0) {
      return allTexts.join('\n');
    }
  }

  // Fallback: try to find any text content
  if (response.choices && response.choices[0]?.message?.content) {
    return response.choices[0].message.content;
  }

  return JSON.stringify(response);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { functionName, input, context, overrides } = await req.json() as ResponsesRequest;

    if (!functionName || !input) {
      return new Response(
        JSON.stringify({ error: 'functionName and input are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[openai-responses-handler] Processing function: ${functionName}`);

    // Load function configuration
    let config = await loadFunctionConfig(supabase, functionName);
    
    // If no config found, create a default one
    if (!config) {
      console.log(`[openai-responses-handler] No config found for ${functionName}, using defaults`);
      config = {
        function_name: functionName,
        display_name: functionName,
        provider: 'openai',
        model_name: 'gpt-4.1-mini',
        api_version: 'responses',
        system_prompt: null,
        instructions: null,
        temperature: 0.7,
        max_output_tokens: 2000,
        top_p: 1.0,
        tools_enabled: [],
        tools_config: {},
        custom_functions: [],
        tool_choice: 'auto',
        parallel_tool_calls: true,
        reasoning_enabled: false,
        reasoning_effort: 'medium',
        requires_web_search: false,
      };
    }

    // Apply overrides
    const modelName = overrides?.model || config.model_name;
    const temperature = overrides?.temperature ?? config.temperature;
    const systemPrompt = overrides?.systemPrompt || config.system_prompt;
    const toolsEnabled = overrides?.tools || config.tools_enabled || [];

    // Get model compatibility
    const modelCompatibility = await getModelCompatibility(supabase, modelName);

    // Get API key
    const apiKey = await getOpenAIApiKey(supabase);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build tools array
    const tools = buildTools(
      toolsEnabled,
      config.tools_config || {},
      config.custom_functions || [],
      modelCompatibility
    );

    // Format input
    const formattedInput = formatInput(input, config.instructions);

    // Build payload for Responses API
    const payload: Record<string, any> = {
      model: modelName,
      input: formattedInput,
      temperature: temperature,
      max_output_tokens: config.max_output_tokens,
      top_p: config.top_p,
    };

    // Add system prompt as instructions
    if (systemPrompt) {
      payload.instructions = systemPrompt;
    }

    // Add tools if any
    if (tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = config.tool_choice || 'auto';
      payload.parallel_tool_calls = config.parallel_tool_calls ?? true;
    }

    // Add reasoning for compatible models
    if (config.reasoning_enabled && modelCompatibility?.supports_reasoning) {
      payload.reasoning = {
        effort: config.reasoning_effort || 'medium'
      };
    }

    console.log(`[openai-responses-handler] Calling OpenAI Responses API with model: ${modelName}`);
    console.log(`[openai-responses-handler] Tools enabled: ${tools.map(t => t.type).join(', ') || 'none'}`);

    // Call OpenAI Responses API
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[openai-responses-handler] OpenAI API error: ${response.status} - ${errorText}`);
      
      // If Responses API fails, fallback to Chat Completions API
      console.log('[openai-responses-handler] Falling back to Chat Completions API');
      return await fallbackToChatCompletions(apiKey, modelName, systemPrompt, formattedInput, temperature, config.max_output_tokens);
    }

    const data = await response.json();
    
    // Extract output text
    const outputText = extractOutputText(data);

    // Log usage
    console.log(`[openai-responses-handler] Response received. Output length: ${outputText.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        output: outputText,
        model: modelName,
        functionName: functionName,
        usage: data.usage || null,
        raw: data, // Include raw response for debugging
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[openai-responses-handler] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fallback to Chat Completions API for compatibility
async function fallbackToChatCompletions(
  apiKey: string,
  model: string,
  systemPrompt: string | null,
  input: string | any[],
  temperature: number,
  maxTokens: number
): Promise<Response> {
  const messages: any[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  if (Array.isArray(input)) {
    messages.push(...input);
  } else {
    messages.push({ role: 'user', content: input });
  }

  const payload = {
    model: model,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      JSON.stringify({ error: `OpenAI API error: ${errorText}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const outputText = data.choices?.[0]?.message?.content || '';

  return new Response(
    JSON.stringify({
      success: true,
      output: outputText,
      model: model,
      usage: data.usage || null,
      fallback: true,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
