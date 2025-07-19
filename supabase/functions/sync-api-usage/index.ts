import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APIKey {
  id: string;
  provider: string;
  model_name: string;
  api_key_hash: string;
  key_last_four: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get all active API keys
    const { data: apiKeys, error: keysError } = await supabaseClient
      .from('llm_api_keys')
      .select('*')
      .eq('status', 'active');

    if (keysError) {
      throw keysError;
    }

    console.log(`Found ${apiKeys?.length || 0} API keys to sync`);

    const syncResults = [];

    for (const apiKey of apiKeys || []) {
      try {
        let usageData = null;

        // Sync based on provider
        switch (apiKey.provider) {
          case 'openai':
            usageData = await syncOpenAIUsage(apiKey);
            break;
          case 'anthropic':
            usageData = await syncAnthropicUsage(apiKey);
            break;
          case 'google':
            usageData = await syncGoogleUsage(apiKey);
            break;
          case 'groq':
            usageData = await syncGroqUsage(apiKey);
            break;
          case 'xai':
            usageData = await syncXAIUsage(apiKey);
            break;
          default:
            console.log(`Provider ${apiKey.provider} not supported for sync`);
            continue;
        }

        if (usageData) {
          // Update or insert usage data
          const { error: upsertError } = await supabaseClient
            .from('llm_api_usage')
            .upsert({
              api_key_id: apiKey.id,
              provider: apiKey.provider,
              model_name: apiKey.model_name,
              usage_date: new Date().toISOString().split('T')[0],
              total_tokens: usageData.total_tokens,
              prompt_tokens: usageData.prompt_tokens,
              completion_tokens: usageData.completion_tokens,
              total_requests: usageData.total_requests,
              total_cost: usageData.total_cost,
            }, {
              onConflict: 'api_key_id,usage_date'
            });

          if (upsertError) {
            console.error(`Error upserting usage data for ${apiKey.id}:`, upsertError);
          } else {
            console.log(`Successfully synced usage for ${apiKey.api_key_name}`);
          }
        }

        syncResults.push({
          api_key_id: apiKey.id,
          api_key_name: apiKey.api_key_name,
          provider: apiKey.provider,
          success: !!usageData,
          data: usageData
        });

      } catch (error) {
        console.error(`Error syncing ${apiKey.api_key_name}:`, error);
        syncResults.push({
          api_key_id: apiKey.id,
          api_key_name: apiKey.api_key_name,
          provider: apiKey.provider,
          success: false,
          error: error.message
        });
      }
    }

    // Update last_usage_check for all keys
    await supabaseClient
      .from('llm_api_keys')
      .update({ last_usage_check: new Date().toISOString() })
      .in('id', (apiKeys || []).map(k => k.id));

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${syncResults.length} API keys`,
      results: syncResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-api-usage function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// OpenAI API usage sync
async function syncOpenAIUsage(apiKey: APIKey) {
  try {
    // Note: For demo purposes, returning mock data
    // In production, you would call OpenAI's usage API
    // const response = await fetch('https://api.openai.com/v1/usage', {
    //   headers: {
    //     'Authorization': `Bearer ${actualApiKey}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // Mock usage data for demo
    return {
      total_tokens: Math.floor(Math.random() * 10000) + 1000,
      prompt_tokens: Math.floor(Math.random() * 5000) + 500,
      completion_tokens: Math.floor(Math.random() * 5000) + 500,
      total_requests: Math.floor(Math.random() * 100) + 10,
      total_cost: parseFloat((Math.random() * 50 + 5).toFixed(2))
    };
  } catch (error) {
    console.error('Error syncing OpenAI usage:', error);
    return null;
  }
}

// Anthropic API usage sync
async function syncAnthropicUsage(apiKey: APIKey) {
  try {
    // Mock usage data for demo
    return {
      total_tokens: Math.floor(Math.random() * 8000) + 800,
      prompt_tokens: Math.floor(Math.random() * 4000) + 400,
      completion_tokens: Math.floor(Math.random() * 4000) + 400,
      total_requests: Math.floor(Math.random() * 80) + 8,
      total_cost: parseFloat((Math.random() * 40 + 4).toFixed(2))
    };
  } catch (error) {
    console.error('Error syncing Anthropic usage:', error);
    return null;
  }
}

// Google API usage sync
async function syncGoogleUsage(apiKey: APIKey) {
  try {
    // Mock usage data for demo
    return {
      total_tokens: Math.floor(Math.random() * 6000) + 600,
      prompt_tokens: Math.floor(Math.random() * 3000) + 300,
      completion_tokens: Math.floor(Math.random() * 3000) + 300,
      total_requests: Math.floor(Math.random() * 60) + 6,
      total_cost: parseFloat((Math.random() * 30 + 3).toFixed(2))
    };
  } catch (error) {
    console.error('Error syncing Google usage:', error);
    return null;
  }
}

// Groq API usage sync
async function syncGroqUsage(apiKey: APIKey) {
  try {
    // Mock usage data for demo
    return {
      total_tokens: Math.floor(Math.random() * 12000) + 1200,
      prompt_tokens: Math.floor(Math.random() * 6000) + 600,
      completion_tokens: Math.floor(Math.random() * 6000) + 600,
      total_requests: Math.floor(Math.random() * 120) + 12,
      total_cost: parseFloat((Math.random() * 20 + 2).toFixed(2)) // Groq is usually cheaper
    };
  } catch (error) {
    console.error('Error syncing Groq usage:', error);
    return null;
  }
}

// xAI (Grok) API usage sync
async function syncXAIUsage(apiKey: APIKey) {
  try {
    // Note: For demo purposes, returning mock data
    // In production, you would call xAI's usage API
    // const response = await fetch('https://api.x.ai/v1/usage', {
    //   headers: {
    //     'Authorization': `Bearer ${actualApiKey}`,
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    // Mock usage data for demo - xAI is competitive pricing
    return {
      total_tokens: Math.floor(Math.random() * 9000) + 900,
      prompt_tokens: Math.floor(Math.random() * 4500) + 450,
      completion_tokens: Math.floor(Math.random() * 4500) + 450,
      total_requests: Math.floor(Math.random() * 90) + 9,
      total_cost: parseFloat((Math.random() * 35 + 3.5).toFixed(2)) // Competitive pricing
    };
  } catch (error) {
    console.error('Error syncing xAI usage:', error);
    return null;
  }
}