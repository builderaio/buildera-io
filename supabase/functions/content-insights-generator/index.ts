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
    const { user_id, platform, top_posts } = await req.json();

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

    // Build recent posts context: use provided top_posts if available, else fetch from DB
    let socialPosts: any[] = [];
    if (Array.isArray(top_posts) && top_posts.length > 0) {
      socialPosts = top_posts.map((p: any) => ({
        text: (p.text || '').substring(0, 300),
        platform: p.platform || platform || 'general',
        hashtags: p.hashtags || p.hashTags || p.hash_tags || [],
        likes: p.likes || p.like_count || 0,
        comments: p.comments || p.comment_count || 0,
        created_at: p.created_at || new Date().toISOString(),
      }));
    } else {
      const [ig, li, tt] = await Promise.all([
        supabase.from('instagram_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
        supabase.from('linkedin_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
        supabase.from('tiktok_posts').select('*').eq('user_id', user_id).order('posted_at', { ascending: false }).limit(10),
      ]);

      socialPosts = [
        ...((ig.data || []).map((p: any) => ({ ...p, platform: 'instagram' }))),
        ...((li.data || []).map((p: any) => ({ ...p, platform: 'linkedin' }))),
        ...((tt.data || []).map((p: any) => ({ ...p, platform: 'tiktok' }))),
      ]
        .sort((a: any, b: any) => new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime())
        .slice(0, 15);
    }

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

    // Build detailed context description
    let contextDescription = '';
    
    if (context.company) {
      contextDescription += `\n📊 CONTEXTO DE LA EMPRESA:
Nombre: ${context.company.name || 'No especificado'}
Industria: ${context.company.industry || 'No especificada'}
Descripción: ${context.company.description || 'No disponible'}
Tamaño: ${context.company.size || 'No especificado'}
Sitio web: ${context.company.website || 'No disponible'}\n`;
    }
    
    if (context.audiences && context.audiences.length > 0) {
      contextDescription += `\n👥 AUDIENCIAS DEFINIDAS (${context.audiences.length}):`;
      context.audiences.forEach((aud: any, idx: number) => {
        contextDescription += `\n${idx + 1}. ${aud.name || 'Sin nombre'}`;
        if (aud.description) contextDescription += `\n   - ${aud.description}`;
        if (aud.pain_points && aud.pain_points.length > 0) {
          contextDescription += `\n   - Pain points: ${JSON.stringify(aud.pain_points)}`;
        }
        if (aud.goals && aud.goals.length > 0) {
          contextDescription += `\n   - Objetivos: ${JSON.stringify(aud.goals)}`;
        }
      });
      contextDescription += '\n';
    }
    
    if (context.recent_posts && context.recent_posts.length > 0) {
      contextDescription += `\n📱 POSTS RECIENTES ANALIZADOS (${context.recent_posts.length}):\n`;
      context.recent_posts.slice(0, 5).forEach((post: any, idx: number) => {
        contextDescription += `${idx + 1}. [${post.platform}] ${post.text?.substring(0, 100) || 'Sin texto'}... (${post.likes} likes, ${post.comments} comments)\n`;
      });
    }

    console.log('Context description prepared:', contextDescription);

    const systemPrompt = `Eres un experto en marketing digital y generación de contenido. DEBES analizar profundamente el contexto de la empresa proporcionado y generar insights ESPECÍFICOS para esa empresa, su industria y su audiencia.

INSTRUCCIONES CRÍTICAS:
1. **OBLIGATORIO**: Usa el nombre de la empresa, su industria y descripción en tus recomendaciones
2. **OBLIGATORIO**: Si hay audiencias definidas, genera contenido específico para sus pain points y objetivos
3. Si hay posts recientes, identifica qué funcionó mejor y por qué
4. Genera ideas de contenido que sean ÚNICAMENTE relevantes para esta empresa e industria específica
5. NO generes ideas genéricas - cada idea debe ser personalizada al contexto dado
6. Incluye formatos variados (posts, videos, carruseles, stories, reels)
7. Proporciona hashtags específicos de la industria

FORMATO DE RESPUESTA:
Genera exactamente 6 elementos organizados así:

**📊 INSIGHTS DE AUDIENCIA**
**Título**: [Nombre del insight sobre comportamiento]
**Estrategia**: [Descripción del insight basado en los datos de la empresa y audiencia]

**Título**: [Segundo insight]
**Estrategia**: [Descripción del segundo insight]

**💡 IDEAS DE CONTENIDO**

**Título**: [Título específico relacionado con la empresa/industria]
**Formato sugerido**: [post/video/carrusel/story/reel]
**Plataforma recomendada**: [instagram/linkedin/tiktok/facebook]
**Hashtags**: #hashtag1 #hashtag2 #hashtag3
**Hora/día sugerido para publicar**: [Ej: Lunes 10:00 AM]
**Estrategia**: [Por qué esta idea es relevante para esta empresa específica]

[Repite el formato anterior para 3 ideas más de contenido]

RECUERDA: Cada idea DEBE mencionar o relacionarse directamente con la empresa, su industria o su audiencia específica.`;

    const userPrompt = `${contextDescription}

Por favor, genera insights y contenido ESPECÍFICAMENTE diseñado para esta empresa y su contexto. NO generes contenido genérico.`;



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
        max_tokens: 2000,
        tools: [
          {
            type: "function",
            function: {
              name: "emit_insights",
              description: "Devuelve insights de audiencia e ideas de contenido 100% estructuradas para render sin parsing.",
              parameters: {
                type: "object",
                properties: {
                  audience_insights: {
                    type: "array",
                    minItems: 2,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        strategy: { type: "string" }
                      },
                      required: ["title", "strategy"],
                      additionalProperties: false
                    }
                  },
                  content_ideas: {
                    type: "array",
                    minItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        format: { type: "string" },
                        platform: { type: "string", enum: ["instagram", "linkedin", "tiktok", "facebook", "twitter"] },
                        hashtags: { type: "array", items: { type: "string" } },
                        timing: { type: "string" },
                        strategy: { type: "string" }
                      },
                      required: ["title", "format", "platform", "strategy"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["audience_insights", "content_ideas"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "emit_insights" } }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse structured output from tool_calls
    let structuredInsights: any = null;
    let insights = '';
    
    if (data.choices[0].message.tool_calls && data.choices[0].message.tool_calls.length > 0) {
      const toolCall = data.choices[0].message.tool_calls[0];
      if (toolCall.function.name === 'emit_insights') {
        structuredInsights = JSON.parse(toolCall.function.arguments);
        console.log('✅ Generated structured insights:', JSON.stringify(structuredInsights, null, 2));
      }
    }
    
    // Fallback to text content if available
    if (data.choices[0].message.content) {
      insights = data.choices[0].message.content;
    }

    // Guardar insights en la base de datos - NUEVO ESQUEMA
    const insightsToSave = [];
    
    // Preparar audience insights
    if (structuredInsights?.audience_insights && Array.isArray(structuredInsights.audience_insights)) {
      for (const insight of structuredInsights.audience_insights) {
        insightsToSave.push({
          user_id: user_id,
          insight_type: 'audience',
          title: insight.title,
          strategy: insight.strategy,
          content: insight.strategy,
          status: 'active',
          generated_at: new Date().toISOString(),
          metadata: {
            context: {
              company_name: company?.name,
              platform: platform || 'all',
              posts_analyzed: socialPosts?.length || 0
            }
          }
        });
      }
    }
    
    // Preparar content ideas
    if (structuredInsights?.content_ideas && Array.isArray(structuredInsights.content_ideas)) {
      for (const idea of structuredInsights.content_ideas) {
        insightsToSave.push({
          user_id: user_id,
          insight_type: 'content_idea',
          title: idea.title,
          strategy: idea.strategy,
          content: idea.strategy,
          format: idea.format,
          platform: idea.platform,
          hashtags: idea.hashtags || [],
          timing: idea.timing,
          status: 'active',
          generated_at: new Date().toISOString(),
          metadata: {
            context: {
              company_name: company?.name,
              original_platform_filter: platform || 'all',
              posts_analyzed: socialPosts?.length || 0
            }
          }
        });
      }
    }

    // Bulk insert insights
    let savedInsightsIds: string[] = [];
    if (insightsToSave.length > 0) {
      try {
        const { data: savedInsights, error: saveError } = await supabase
          .from('content_insights')
          .insert(insightsToSave)
          .select('id');

        if (saveError) {
          console.error('Error saving insights:', saveError);
        } else {
          savedInsightsIds = (savedInsights || []).map((insight: any) => insight.id);
          console.log(`✅ Successfully saved ${savedInsightsIds.length} insights to database`);
        }
      } catch (saveError) {
        console.error('Error in bulk insert:', saveError);
      }
    }

    return new Response(JSON.stringify({ 
      insights_text: insights,
      audience_insights: structuredInsights?.audience_insights || [],
      content_ideas: structuredInsights?.content_ideas || [],
      saved_insights_ids: savedInsightsIds,
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
      error: (error as Error).message,
      details: 'Failed to generate content insights'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});