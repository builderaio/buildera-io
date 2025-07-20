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
      .select('api_key_hash, provider, api_key_name')
      .eq('id', apiKeyId)
      .eq('status', 'active')
      .single();

    if (keyError || !apiKeyData) {
      console.error('API Key error:', keyError);
      throw new Error('API Key no encontrada o inactiva');
    }

    console.log(`Using API key: ${apiKeyData.api_key_name} for provider: ${apiKeyData.provider}`);
    
    // Usar la API key completa almacenada en api_key_hash 
    // (En producción esto estaría encriptado y se desencriptaría aquí)
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
    console.log(`Attempting to fetch OpenAI models with API key: ${apiKey.substring(0, 8)}...`);
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error details: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const models = data.data
      .filter((model: any) => {
        // Filtrar solo modelos GPT actuales y relevantes
        return model.id.includes('gpt-4') || 
               model.id.includes('gpt-3.5') ||
               model.id.includes('o1') ||
               model.id === 'gpt-4o' ||
               model.id === 'gpt-4o-mini';
      })
      .map((model: any) => model.id)
      .sort();

    console.log(`Successfully fetched ${models.length} OpenAI models:`, models);
    return models;
  } catch (error) {
    console.error('Error fetching OpenAI models:', error);
    // Fallback a modelos conocidos si falla la API
    console.log('Using fallback OpenAI models');
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  }
}

async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  // Anthropic no tiene endpoint público para listar modelos
  // Retornamos modelos conocidos actualizados según la documentación
  console.log('Using known Anthropic models (no public API available)');
  return [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
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
    console.log(`Attempting to fetch Groq models with API key: ${apiKey.substring(0, 8)}...`);
    
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Groq API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error details: ${errorText}`);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const models = data.data
      .map((model: any) => model.id)
      .sort();

    console.log(`Successfully fetched ${models.length} Groq models:`, models);
    return models;
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    console.log('Using fallback Groq models');
    return ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma-7b-it'];
  }
}

async function fetchXAIModels(apiKey: string): Promise<string[]> {
  // xAI no tiene endpoint público para listar modelos aún
  // Retornamos modelos conocidos actualizados
  console.log('Using known xAI models (no public API available)');
  return ['grok-beta', 'grok-vision-beta'];
}