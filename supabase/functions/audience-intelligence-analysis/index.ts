import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { action, audienceData, platforms } = await req.json();

    switch (action) {
      case 'analyze_audience':
        return await analyzeAudience(supabaseClient, user.id, audienceData, platforms);
      case 'generate_insights':
        return await generateAudienceInsights(supabaseClient, user.id, audienceData);
      case 'platform_optimization':
        return await optimizeForPlatforms(supabaseClient, user.id, audienceData, platforms);
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in audience-intelligence-analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeAudience(supabase: any, userId: string, audienceData: any, platforms: string[]) {
  console.log('🎯 Analyzing audience for platforms:', platforms);

  const analysisPrompt = `
Como experto en análisis de audiencias digitales, analiza la siguiente audiencia y proporciona insights detallados:

DATOS DE AUDIENCIA:
${JSON.stringify(audienceData, null, 2)}

PLATAFORMAS TARGET: ${platforms.join(', ')}

Proporciona un análisis completo en este formato JSON:
{
  "demographic_insights": {
    "age_distribution": {},
    "gender_split": {},
    "income_levels": {},
    "education": {},
    "geographic_concentration": {}
  },
  "behavioral_patterns": {
    "online_habits": [],
    "content_preferences": [],
    "engagement_patterns": {},
    "peak_activity_times": [],
    "device_usage": {}
  },
  "platform_optimization": {
    "facebook": {
      "targeting_suggestions": {},
      "content_strategy": [],
      "optimal_posting_times": [],
      "ad_formats": []
    },
    "instagram": {
      "targeting_suggestions": {},
      "content_strategy": [],
      "optimal_posting_times": [],
      "hashtag_strategy": []
    },
    "linkedin": {
      "targeting_suggestions": {},
      "content_strategy": [],
      "optimal_posting_times": [],
      "professional_focus": []
    },
    "tiktok": {
      "targeting_suggestions": {},
      "content_strategy": [],
      "optimal_posting_times": [],
      "trending_formats": []
    }
  },
  "pain_points": [],
  "motivations": [],
  "conversion_opportunities": [],
  "budget_recommendations": {
    "estimated_cpm": 0,
    "budget_allocation": {},
    "roi_projections": {}
  },
  "confidence_score": 0.85
}
`;

  // Call universal AI handler
  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'audience-analysis',
      messages: [
        { role: 'system', content: 'Eres un experto en análisis de audiencias digitales y marketing estratégico.' },
        { role: 'user', content: analysisPrompt }
      ]
    }
  });

  const analysis = typeof aiResult.output === 'string' ? JSON.parse(aiResult.output) : aiResult.output;

  return new Response(JSON.stringify({
    success: true,
    analysis: analysis,
    platforms: platforms,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function generateAudienceInsights(supabase: any, userId: string, audienceData: any) {
  console.log('💡 Generating audience insights');

  const insightsPrompt = `
Analiza esta audiencia y genera insights accionables:

AUDIENCIA: ${JSON.stringify(audienceData, null, 2)}

Genera insights en formato JSON:
{
  "key_insights": [
    {
      "title": "string",
      "description": "string",
      "impact": "high|medium|low",
      "actionable_steps": []
    }
  ],
  "opportunities": [
    {
      "type": "content|targeting|timing|platform",
      "description": "string",
      "potential_impact": "string",
      "implementation_steps": []
    }
  ],
  "warnings": [
    {
      "risk": "string",
      "mitigation": "string"
    }
  ],
  "next_steps": []
}
`;

  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'audience-insights',
      messages: [
        { role: 'system', content: 'Eres un consultor estratégico especializado en audiencias digitales.' },
        { role: 'user', content: insightsPrompt }
      ]
    }
  });

  const insights = typeof aiResult.output === 'string' ? JSON.parse(aiResult.output) : aiResult.output;

  return new Response(JSON.stringify({
    success: true,
    insights: insights,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function optimizeForPlatforms(supabase: any, userId: string, audienceData: any, platforms: string[]) {
  console.log('🎨 Optimizing audience for platforms:', platforms);

  const optimizationPrompt = `
Optimiza esta audiencia para las plataformas específicas:

AUDIENCIA: ${JSON.stringify(audienceData, null, 2)}
PLATAFORMAS: ${platforms.join(', ')}

Proporciona optimización específica por plataforma en formato JSON:
{
  "platform_strategies": {
    "facebook": {
      "targeting_parameters": {},
      "creative_recommendations": [],
      "budget_strategy": {},
      "measurement_kpis": []
    },
    "instagram": {
      "targeting_parameters": {},
      "creative_recommendations": [],
      "hashtag_strategy": [],
      "story_strategy": []
    },
    "linkedin": {
      "targeting_parameters": {},
      "content_approach": [],
      "professional_messaging": [],
      "networking_strategy": []
    },
    "tiktok": {
      "targeting_parameters": {},
      "content_trends": [],
      "viral_strategies": [],
      "music_trends": []
    }
  },
  "cross_platform_strategy": {
    "content_pillars": [],
    "messaging_consistency": {},
    "timing_coordination": {},
    "budget_allocation": {}
  },
  "success_metrics": {}
}
`;

  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'platform-optimization',
      messages: [
        { role: 'system', content: 'Eres un experto en marketing multicanal y optimización de plataformas digitales.' },
        { role: 'user', content: optimizationPrompt }
      ]
    }
  });

  const optimization = typeof aiResult.output === 'string' ? JSON.parse(aiResult.output) : aiResult.output;

  return new Response(JSON.stringify({
    success: true,
    optimization: optimization,
    platforms: platforms,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}