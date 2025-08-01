import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🤖 Universal AI Handler request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { functionName, messages } = await req.json();
    console.log(`🎯 Processing AI request for function: ${functionName}`);

    // Get AI model configuration for this function
    const { data: modelConfig } = await supabase
      .rpc('get_ai_model_config', { function_name_param: functionName });

    const config = modelConfig?.[0] || {
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    console.log(`🔧 Using model configuration:`, config);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model_name,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: config.top_p,
        frequency_penalty: config.frequency_penalty,
        presence_penalty: config.presence_penalty,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error(`❌ OpenAI API error (${openaiResponse.status}):`, errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorData}`);
    }

    const aiResult = await openaiResponse.json();
    console.log('✅ OpenAI response received');

    const response = aiResult.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Log API usage
    const usage = aiResult.usage;
    if (usage) {
      await supabase
        .from('ai_model_status_logs')
        .insert({
          name: config.model_name,
          status: 'active',
          response_time: Date.now(),
          tokens_used: usage.total_tokens,
          cost_estimate: calculateCost(config.model_name, usage.total_tokens),
          metadata: {
            function_name: functionName,
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens
          }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: response,
        tokens_used: usage?.total_tokens || 0,
        model: config.model_name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Universal AI Handler error:', error);
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

function calculateCost(model: string, tokens: number): number {
  // Estimated costs per 1K tokens (as of 2024)
  const costs = {
    'gpt-4o': 0.03,
    'gpt-4o-mini': 0.00015,
    'gpt-4': 0.03,
    'gpt-3.5-turbo': 0.002
  };
  
  const costPer1K = costs[model as keyof typeof costs] || costs['gpt-4o-mini'];
  return (tokens / 1000) * costPer1K;
}