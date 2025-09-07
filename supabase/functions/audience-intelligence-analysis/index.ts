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

    const { action, audienceData, platforms, companyData, icpProfile, existingAudiences } = await req.json();

    switch (action) {
      case 'analyze_audience':
        return await analyzeAudience(supabaseClient, user.id, audienceData, platforms);
      case 'generate_insights':
        return await generateAudienceInsights(supabaseClient, user.id, audienceData);
      case 'platform_optimization':
        return await optimizeForPlatforms(supabaseClient, user.id, audienceData, platforms, companyData);
      case 'generate_icp':
        return await generateICPProfile(supabaseClient, user.id, companyData, existingAudiences);
      case 'create_audience_from_icp':
        return await createAudienceFromICP(supabaseClient, user.id, icpProfile, companyData, platforms);
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

async function optimizeForPlatforms(supabase: any, userId: string, audienceData: any, platforms: string[], companyData: any) {
  console.log('🎨 Optimizing audience for platforms:', platforms);

  const optimizationPrompt = `
Optimiza esta audiencia para las plataformas específicas considerando el contexto empresarial:

EMPRESA: ${JSON.stringify(companyData, null, 2)}
AUDIENCIA: ${JSON.stringify(audienceData, null, 2)}
PLATAFORMAS: ${platforms.join(', ')}

Proporciona optimización específica por plataforma en formato JSON:
{
  "platform_strategies": {
    "facebook": {
      "targeting_parameters": {
        "interests": [],
        "behaviors": [],
        "demographics": {},
        "custom_audiences": []
      },
      "creative_recommendations": [
        "Usa videos educativos de 1-2 minutos",
        "Incluye testimonios de clientes",
        "Crea carruseles informativos"
      ],
      "budget_strategy": {
        "recommended_daily_budget": "50-100 USD",
        "bid_strategy": "cost_per_click",
        "optimization_goal": "conversions"
      },
      "measurement_kpis": ["CTR", "Conversion Rate", "Cost per Lead"],
      "posting_schedule": {
        "optimal_times": ["9:00-11:00", "13:00-15:00", "19:00-21:00"],
        "best_days": ["Tuesday", "Wednesday", "Thursday"],
        "frequency": "1-2 posts per day"
      }
    },
    "instagram": {
      "targeting_parameters": {
        "interests": [],
        "behaviors": [],
        "demographics": {},
        "lookalike_audiences": []
      },
      "creative_recommendations": [
        "Usa Stories interactivas con polls",
        "Crea Reels con tendencias actuales",
        "Posts visuales con carousels"
      ],
      "hashtag_strategy": {
        "primary_hashtags": [],
        "niche_hashtags": [],
        "branded_hashtags": []
      },
      "story_strategy": [
        "Behind the scenes content",
        "User generated content",
        "Quick tips and tutorials"
      ],
      "content_pillars": [
        "Educational content (40%)",
        "Behind the scenes (30%)",
        "User generated content (20%)",
        "Promotional content (10%)"
      ]
    },
    "linkedin": {
      "targeting_parameters": {
        "job_titles": [],
        "company_sizes": [],
        "industries": [],
        "skills": []
      },
      "content_approach": [
        "Thought leadership articles",
        "Industry insights and trends",
        "Case studies and success stories"
      ],
      "professional_messaging": {
        "tone": "Professional yet approachable",
        "value_propositions": [],
        "call_to_actions": []
      },
      "networking_strategy": [
        "Engage with industry leaders",
        "Share valuable insights",
        "Participate in relevant groups"
      ]
    },
    "tiktok": {
      "targeting_parameters": {
        "interests": [],
        "behaviors": [],
        "age_range": "18-34",
        "hashtag_targeting": []
      },
      "content_trends": [
        "Educational quick tips",
        "Behind the scenes content",
        "Trending audio adaptation"
      ],
      "viral_strategies": [
        "Jump on trending sounds",
        "Create relatable content",
        "Use popular effects"
      ],
      "music_trends": [
        "Current trending sounds",
        "Industry-specific audio",
        "Original branded sounds"
      ]
    },
    "twitter": {
      "targeting_parameters": {
        "keywords": [],
        "interests": [],
        "followers_of_accounts": [],
        "conversation_targeting": []
      },
      "content_strategy": [
        "Real-time engagement",
        "Industry news commentary",
        "Thread-style educational content"
      ],
      "engagement_tactics": [
        "Participate in Twitter chats",
        "Share quick insights",
        "Engage with industry conversations"
      ]
    },
    "youtube": {
      "targeting_parameters": {
        "keywords": [],
        "topics": [],
        "demographics": {},
        "interests": []
      },
      "content_strategy": [
        "Educational long-form videos",
        "Tutorial and how-to content",
        "Product demonstrations"
      ],
      "seo_optimization": {
        "keywords": [],
        "thumbnail_strategy": [],
        "title_optimization": []
      }
    }
  },
  "cross_platform_strategy": {
    "content_pillars": [
      "Educational content",
      "Behind the scenes",
      "User generated content",
      "Industry insights"
    ],
    "messaging_consistency": {
      "brand_voice": "Professional yet approachable",
      "key_messages": [],
      "value_propositions": []
    },
    "timing_coordination": {
      "content_calendar_alignment": true,
      "cross_promotion_strategy": [],
      "platform_specific_timing": {}
    },
    "budget_allocation": {
      "facebook": "30%",
      "instagram": "25%",
      "linkedin": "20%",
      "tiktok": "15%",
      "twitter": "5%",
      "youtube": "5%"
    }
  },
  "success_metrics": {
    "awareness_metrics": ["Reach", "Impressions", "Brand Mentions"],
    "engagement_metrics": ["CTR", "Engagement Rate", "Shares"],
    "conversion_metrics": ["Lead Generation", "Cost per Lead", "ROI"],
    "platform_specific_kpis": {}
  }
}
`;

  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'platform-optimization',
      messages: [
        { role: 'system', content: 'Eres un experto en marketing multicanal y optimización de plataformas digitales especializado en estrategias específicas por red social.' },
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

async function generateICPProfile(supabase: any, userId: string, companyData: any, existingAudiences: any[]) {
  console.log('🎯 Generating ICP profile for company:', companyData.name);

  const icpPrompt = `
Como experto en definición de perfiles ICP (Ideal Customer Profile), genera un perfil detallado basado en esta empresa:

DATOS DE LA EMPRESA:
${JSON.stringify(companyData, null, 2)}

AUDIENCIAS EXISTENTES (para referencia):
${JSON.stringify(existingAudiences, null, 2)}

Genera un perfil ICP completo en formato JSON:
{
  "demographic": {
    "age_range": "25-45 años",
    "gender": "Mixto con ligera tendencia femenina",
    "income_level": "$50,000 - $100,000 anuales",
    "education": "Universitario o superior",
    "location": "Áreas urbanas y suburbanas"
  },
  "professional": {
    "job_title": "Director de Marketing / CMO",
    "industry": "Tecnología y servicios B2B",
    "company_size": "50-500 empleados",
    "experience_level": "5-10 años en el sector"
  },
  "behavioral": {
    "pain_points": [
      "Dificultad para medir ROI de marketing",
      "Falta de tiempo para crear contenido",
      "Necesidad de automatizar procesos"
    ],
    "motivations": [
      "Mejorar eficiencia del equipo",
      "Aumentar generación de leads",
      "Demostrar valor del marketing"
    ],
    "goals": [
      "Incrementar conversiones en 30%",
      "Reducir tiempo de gestión en 50%",
      "Mejorar calidad de leads"
    ],
    "preferred_channels": ["LinkedIn", "Email", "Webinars", "Content Marketing"]
  },
  "psychographic": {
    "values": [
      "Innovación y tecnología",
      "Eficiencia y productividad",
      "Resultados medibles"
    ],
    "interests": [
      "Marketing automation",
      "Data analytics",
      "Growth hacking",
      "Digital transformation"
    ],
    "lifestyle": [
      "Orientado a resultados",
      "Siempre aprendiendo",
      "Networking activo",
      "Early adopter de tecnología"
    ]
  },
  "decision_making": {
    "decision_factors": [
      "ROI demostrable",
      "Facilidad de implementación",
      "Soporte técnico",
      "Escalabilidad"
    ],
    "buying_process": [
      "Investigación online",
      "Consulta con equipo",
      "Prueba piloto",
      "Implementación gradual"
    ],
    "budget_range": "$1,000 - $10,000 mensuales",
    "decision_timeframe": "2-6 meses"
  }
}
`;

  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'icp-generation',
      messages: [
        { role: 'system', content: 'Eres un consultor estratégico especializado en la definición de perfiles ICP para empresas B2B y B2C.' },
        { role: 'user', content: icpPrompt }
      ]
    }
  });

  const icpProfile = typeof aiResult.output === 'string' ? JSON.parse(aiResult.output) : aiResult.output;

  return new Response(JSON.stringify({
    success: true,
    icp_profile: icpProfile,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function createAudienceFromICP(supabase: any, userId: string, icpProfile: any, companyData: any, platforms: string[]) {
  console.log('👥 Creating audience from ICP profile');

  const audiencePrompt = `
Basándote en este perfil ICP, crea una audiencia específica y actionable:

PERFIL ICP:
${JSON.stringify(icpProfile, null, 2)}

EMPRESA:
${JSON.stringify(companyData, null, 2)}

PLATAFORMAS TARGET: ${platforms.join(', ')}

Genera una audiencia detallada en formato JSON:
{
  "name": "Directores de Marketing Tech B2B",
  "description": "Profesionales de marketing en empresas tecnológicas que buscan automatización y mejores resultados",
  "demographics": {
    "age_ranges": { "25-34": 40, "35-44": 45, "45-54": 15 },
    "gender_split": { "male": 45, "female": 50, "other": 5 },
    "income_levels": { "50k-75k": 30, "75k-100k": 40, "100k+": 30 },
    "education": { "university": 70, "postgraduate": 25, "other": 5 },
    "locations": ["Urban areas", "Tech hubs", "Major cities"]
  },
  "professional": {
    "job_titles": ["Marketing Director", "CMO", "Marketing Manager"],
    "industries": ["Technology", "SaaS", "B2B Services"],
    "company_sizes": ["50-200", "200-500", "500+"],
    "experience": "5-15 years"
  },
  "interests": [
    "Marketing automation",
    "Data analytics",
    "Growth marketing",
    "Digital transformation"
  ],
  "pain_points": [
    "Measuring marketing ROI",
    "Lead quality issues",
    "Content creation bottlenecks"
  ],
  "motivations": [
    "Improve team efficiency",
    "Increase lead generation",
    "Demonstrate marketing value"
  ],
  "goals": [
    "30% increase in conversions",
    "50% time savings",
    "Better lead quality"
  ],
  "preferred_platforms": ["linkedin", "facebook", "instagram"],
  "platform_targeting": {
    "facebook": {
      "targeting_parameters": {
        "interests": ["Marketing", "Business Intelligence", "CRM"],
        "behaviors": ["Small business owners", "Technology early adopters"],
        "demographics": { "age": "25-54", "languages": ["English", "Spanish"] }
      },
      "creative_recommendations": [
        "Case study videos",
        "ROI calculator tools",
        "Webinar promotions"
      ]
    },
    "instagram": {
      "targeting_parameters": {
        "interests": ["Business", "Entrepreneurship", "Marketing"],
        "hashtags": ["#MarketingTips", "#B2BMarketing", "#GrowthHacking"]
      },
      "creative_recommendations": [
        "Behind-the-scenes content",
        "Quick tip carousels",
        "Success story highlights"
      ]
    },
    "linkedin": {
      "targeting_parameters": {
        "job_titles": ["Marketing Director", "CMO", "VP Marketing"],
        "company_sizes": ["51-200", "201-500", "501-1000"],
        "industries": ["Computer Software", "Information Technology"]
      },
      "creative_recommendations": [
        "Thought leadership articles",
        "Industry trend analysis",
        "Professional case studies"
      ]
    },
    "tiktok": {
      "targeting_parameters": {
        "interests": ["Business", "Technology", "Productivity"],
        "age_range": "25-44"
      },
      "creative_recommendations": [
        "Quick marketing tips",
        "Day-in-the-life content",
        "Tool demonstrations"
      ]
    },
    "twitter": {
      "targeting_parameters": {
        "keywords": ["marketing", "B2B", "growth", "automation"],
        "interests": ["Business", "Marketing", "Technology"]
      },
      "creative_recommendations": [
        "Industry insights",
        "Thread-style tips",
        "Engagement with industry leaders"
      ]
    },
    "youtube": {
      "targeting_parameters": {
        "keywords": ["marketing automation", "B2B marketing", "lead generation"],
        "topics": ["Business", "Marketing", "Technology"]
      },
      "creative_recommendations": [
        "Tutorial videos",
        "Webinar recordings",
        "Product demonstrations"
      ]
    }
  },
  "estimated_size": 50000,
  "confidence_score": 0.92,
  "insights": {
    "key_characteristics": [
      "Data-driven decision makers",
      "Always seeking efficiency",
      "Budget-conscious but willing to invest in ROI"
    ],
    "content_preferences": [
      "Case studies with metrics",
      "How-to guides and tutorials",
      "Industry benchmarks and trends"
    ],
    "optimal_messaging": [
      "Focus on measurable results",
      "Emphasize time-saving benefits",
      "Highlight ease of implementation"
    ]
  }
}
`;

  const { data: aiResult } = await supabase.functions.invoke('universal-ai-handler', {
    body: {
      functionName: 'audience-creation',
      messages: [
        { role: 'system', content: 'Eres un experto en creación de audiencias digitales que convierte perfiles ICP en audiencias específicas y actionables para campañas de marketing.' },
        { role: 'user', content: audiencePrompt }
      ]
    }
  });

  const audience = typeof aiResult.output === 'string' ? JSON.parse(aiResult.output) : aiResult.output;

  return new Response(JSON.stringify({
    success: true,
    audience: audience,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}