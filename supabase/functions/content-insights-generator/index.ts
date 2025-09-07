import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getOpenAIApiKey(supabase: any) {
  console.log('Fetching OpenAI API key from DB...');
  const { data, error } = await supabase
    .from('llm_api_keys')
    .select('api_key_hash')
    .eq('provider', 'openai')
    .eq('status', 'active')
    .single();

  if (error || !data?.api_key_hash) {
    console.log('Falling back to OPENAI_API_KEY env');
    const envKey = Deno.env.get('OPENAI_API_KEY');
    if (!envKey) throw new Error('OpenAI API key not configured');
    return envKey;
  }

  return data.api_key_hash;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Load OpenAI API key (DB first, then env)
    const openAIApiKey = await getOpenAIApiKey(supabase);

    // Get user's primary company (optional)
    let companyId: string | null = null;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('primary_company_id')
      .eq('user_id', user_id)
      .maybeSingle();

    if (profileError) {
      console.log('Profile lookup error:', profileError.message);
    }
    companyId = profile?.primary_company_id ?? null;

    // Get company information if exists
    let company: any = null;
    if (companyId) {
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();
      if (companyError) {
        console.log('Company fetch error:', companyError.message);
      } else {
        company = companyData;
      }
    }

    // Get audience data (only if company exists)
    let audiences: any[] = [];
    if (companyId) {
      const { data: audiencesData, error: audErr } = await supabase
        .from('company_audiences')
        .select('*')
        .eq('company_id', companyId)
        .limit(3);
      if (audErr) {
        console.log('Audience fetch error:', audErr.message);
      }
      audiences = audiencesData || [];
    }

    // Get audience insights for user
    const { data: audienceInsights, error: audienceInsightsErr } = await supabase
      .from('audience_insights')
      .select('*')
      .eq('user_id', user_id)
      .limit(5);
    if (audienceInsightsErr) {
      console.log('Audience insights fetch error:', audienceInsightsErr.message);
    }

    // Get recent social posts from platform-specific tables and combine
    const [ig, li, tt] = await Promise.all([
      supabase.from('instagram_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
      supabase.from('linkedin_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
      supabase.from('tiktok_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
    ]);

    const socialPosts = [
      ...((ig.data || []).map((p: any) => ({ ...p, platform: 'instagram' }))),
      ...((li.data || []).map((p: any) => ({ ...p, platform: 'linkedin' }))),
      ...((tt.data || []).map((p: any) => ({ ...p, platform: 'tiktok' }))),
    ]
      .sort((a: any, b: any) => new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime())
      .slice(0, 15);

    // Prepare context for AI
    const context = {
      company: company ? {
        name: company?.name,
        industry: company?.industry_sector,
        description: company?.description,
        size: company?.company_size,
        website: company?.website_url,
      } : null,
      audiences: audiences.map((audience: any) => ({
        name: audience.name,
        description: audience.description,
        interests: audience.interests,
        age_ranges: audience.age_ranges,
        pain_points: audience.pain_points,
        goals: audience.goals,
        platform_preferences: audience.platform_preferences,
      })),
      audience_insights: (audienceInsights || []).map((insight: any) => ({
        platform: insight.platform,
        insight_type: insight.insight_type,
        interests: insight.interests,
        engagement_patterns: insight.engagement_patterns,
        content_preferences: insight.content_preferences,
      })),
      recent_posts: (socialPosts || []).map((post: any) => ({
        text: post.caption || post.content || post.text || post.title || '',
        platform: post.platform,
        hashtags: post.hashtags || post.hash_tags || post.hashTags || [],
        likes: post.like_count || post.likes_count || post.digg_count || post.likes || 0,
        comments: post.comment_count || post.comments_count || post.comments || 0,
        created_at: post.posted_at || post.created_at,
      })),
    };

    console.log('Generated context for insights:', JSON.stringify(context, null, 2));

    const systemPrompt = `Eres un experto en marketing digital y generación de contenido. Tu trabajo es analizar la información de la empresa, audiencia y contenido histórico para generar insights y ideas de contenido específicas y accionables.

INSTRUCCIONES:
1. Analiza la industria, audiencia y contenido previo para identificar patrones y oportunidades
2. Genera ideas de contenido específicas que resuenen con la audiencia identificada
3. Incluye formatos variados (posts, videos, carruseles, stories, etc.)
4. Proporciona hashtags relevantes y timing sugerido
5. Enfócate en tendencias actuales de la industria
6. Considera los dolor points y objetivos de la audiencia

FORMATO DE RESPUESTA:
Genera exactamente 6 insights/ideas organizados en las siguientes categorías:

**📊 INSIGHTS DE AUDIENCIA**
- 2 insights sobre comportamiento y preferencias de tu audiencia basados en los datos

**💡 IDEAS DE CONTENIDO**  
- 4 ideas específicas de contenido con formato, tema y estrategia

Para cada idea de contenido incluye:
- Título/tema
- Formato sugerido (post, video, carrusel, etc.)
- Plataforma recomendada
- 3-5 hashtags específicos
- Hora/día sugerido para publicar

Sé específico, creativo y enfócate en generar valor real para la audiencia.`;

    const userPrompt = `Analiza esta información y genera insights y ideas de contenido:

EMPRESA:
${JSON.stringify(context.company, null, 2)}

AUDIENCIAS DEFINIDAS:
${JSON.stringify(context.audiences, null, 2)}

INSIGHTS DE AUDIENCIA:
${JSON.stringify(context.audience_insights, null, 2)}

CONTENIDO RECIENTE:
${JSON.stringify(context.recent_posts, null, 2)}
`;


    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    console.log('Generated insights:', insights);

    return new Response(JSON.stringify({ 
      insights,
      context_analyzed: {
        company_name: company?.name,
        audiences_count: audiences?.length || 0,
        insights_count: audienceInsights?.length || 0,
        posts_analyzed: socialPosts?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content-insights-generator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate content insights'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});