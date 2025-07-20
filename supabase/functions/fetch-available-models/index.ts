import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { provider, apiKeyId } = await req.json();

    console.log(`Fetching models for provider: ${provider}, API Key: ${apiKeyId}`);

    // Obtener la API key desde la base de datos
    const { data: apiKeyData, error: keyError } = await supabaseClient
      .from('llm_api_keys')
      .select('api_key_hash, provider')
      .eq('id', apiKeyId)
      .single();

    if (keyError || !apiKeyData) {
      throw new Error('API Key no encontrada');
    }

    // Decodificar la API key (en producción estaría encriptada)
    const apiKey = apiKeyData.api_key_hash;
    let availableModels: string[] = [];

    switch (provider.toLowerCase()) {
      case 'openai':
        availableModels = await fetchOpenAIModels(apiKey);
        break;
      case 'anthropic':
        availableModels = await fetchAnthropicModels(apiKey);
        break;
      case 'google':
        availableModels = await fetchGoogleModels(apiKey);
        break;
      case 'groq':
        availableModels = await fetchGroqModels(apiKey);
        break;
      case 'xai':
        availableModels = await fetchXAIModels(apiKey);
        break;
      default:
        throw new Error(`Proveedor no soportado: ${provider}`);
    }

    // Actualizar la base de datos con los modelos disponibles
    const { error: updateError } = await supabaseClient
      .from('llm_api_keys')
      .update({
        available_models: availableModels,
        last_usage_check: new Date().toISOString()
      })
      .eq('id', apiKeyId);

    if (updateError) {
      console.error('Error updating available models:', updateError);
    }

    console.log(`Successfully fetched ${availableModels.length} models for ${provider}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        models: availableModels,
        provider,
        updatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-available-models:', error);
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

async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data
      .filter((model: any) => model.id.includes('gpt') || model.id.includes('davinci'))
      .map((model: any) => model.id)
      .sort();
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    // Fallback a modelos conocidos si falla la API
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }
}

async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  // Anthropic no tiene endpoint público para listar modelos
  // Retornamos modelos conocidos
  return [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229', 
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229'
  ];
}

async function fetchGoogleModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    return data.models
      .filter((model: any) => model.name.includes('gemini'))
      .map((model: any) => model.name.replace('models/', ''))
      .sort();
  } catch (error) {
    console.error('Error fetching Google models:', error);
    return ['gemini-pro', 'gemini-pro-vision', 'gemini-ultra'];
  }
}

async function fetchGroqModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data
      .map((model: any) => model.id)
      .sort();
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    return ['llama2-70b-4096', 'mixtral-8x7b-32768', 'gemma-7b-it'];
  }
}

async function fetchXAIModels(apiKey: string): Promise<string[]> {
  // xAI no tiene endpoint público para listar modelos aún
  // Retornamos modelos conocidos
  return ['grok-beta', 'grok-vision-beta'];
}