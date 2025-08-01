import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obtener la API key de OpenAI desde la base de datos
async function getOpenAIApiKey(supabase: any): Promise<string> {
  console.log('🔑 Fetching OpenAI API key from database...');
  const { data, error } = await supabase
    .from('llm_api_keys')
    .select('api_key_hash')
    .eq('provider', 'openai')
    .eq('status', 'active')
    .single();
  
  if (error || !data?.api_key_hash) {
    console.log('⚠️ No API key found in database, using environment variable');
    const envKey = Deno.env.get('OPENAI_API_KEY');
    if (!envKey) {
      throw new Error('OpenAI API key not found in database or environment');
    }
    return envKey;
  }
  
  console.log('✅ OpenAI API key retrieved successfully from database');
  return data.api_key_hash;
}

// Recopilar toda la información de redes sociales
async function gatherSocialMediaData(supabase: any, userId: string, platform?: string) {
  console.log(`📊 Gathering comprehensive social media data for user ${userId}`);
  
  const data: any = {
    posts: [],
    comments: [],
    followers: [],
    profiles: [],
    calendar: [],
    insights: [],
    actionables: [],
    recommendations: [],
    competitors: []
  };

  try {
    // Obtener posts de todas las plataformas o una específica
    const platformFilter = platform ? { platform } : {};
    
    // Posts de Instagram
    if (!platform || platform === 'instagram') {
      const { data: instagramPosts } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false })
        .limit(100);
      
      data.posts.push(...(instagramPosts || []).map((post: any) => ({ ...post, platform: 'instagram' })));
    }

    // Posts de TikTok
    if (!platform || platform === 'tiktok') {
      const { data: tiktokPosts } = await supabase
        .from('tiktok_posts')
        .select('*')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false })
        .limit(100);
      
      data.posts.push(...(tiktokPosts || []).map((post: any) => ({ ...post, platform: 'tiktok' })));
    }

    // Posts de LinkedIn
    if (!platform || platform === 'linkedin') {
      const { data: linkedinPosts } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false })
        .limit(100);
      
      data.posts.push(...(linkedinPosts || []).map((post: any) => ({ ...post, platform: 'linkedin' })));
    }

    // Posts de Facebook (de la tabla instagram_posts con platform facebook)
    if (!platform || platform === 'facebook') {
      const { data: facebookPosts } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'facebook')
        .order('posted_at', { ascending: false })
        .limit(100);
      
      data.posts.push(...(facebookPosts || []));
    }

    // Comentarios
    const { data: comments } = await supabase
      .from('social_media_comments')
      .select('*')
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .limit(200);
    
    data.comments = comments || [];

    // Followers detallados de Instagram
    const { data: instagramFollowers } = await supabase
      .from('instagram_followers_detailed')
      .select('*')
      .eq('user_id', userId)
      .limit(50);
    
    data.followers.push(...(instagramFollowers || []).map((f: any) => ({ ...f, platform: 'instagram' })));

    // TikTok followers
    const { data: tiktokFollowers } = await supabase
      .from('tiktok_followers')
      .select('*')
      .eq('user_id', userId)
      .limit(50);
    
    data.followers.push(...(tiktokFollowers || []).map((f: any) => ({ ...f, platform: 'tiktok' })));

    // Calendario de redes sociales
    const { data: calendar } = await supabase
      .from('social_media_calendar')
      .select('*')
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .limit(100);
    
    data.calendar = calendar || [];

    // Análisis de competidores
    const { data: competitors } = await supabase
      .from('competitor_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('last_analyzed', { ascending: false })
      .limit(10);
    
    data.competitors = competitors || [];

    // Análisis de ubicación de followers
    const { data: locationAnalysis } = await supabase
      .from('followers_location_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })
      .limit(20);
    
    data.locationAnalysis = locationAnalysis || [];

    // Insights existentes
    const { data: insights } = await supabase
      .from('marketing_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    data.insights = insights || [];

    // Actionables existentes
    const { data: actionables } = await supabase
      .from('marketing_actionables')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    data.actionables = actionables || [];

    // Recomendaciones de contenido
    const { data: recommendations } = await supabase
      .from('content_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    data.recommendations = recommendations || [];

    console.log(`📈 Data collected: ${data.posts.length} posts, ${data.comments.length} comments, ${data.followers.length} followers, ${data.calendar.length} calendar entries`);
    
    return data;
  } catch (error) {
    console.error('❌ Error gathering social media data:', error);
    throw error;
  }
}

// Generar análisis profundo con OpenAI
async function generatePremiumInsights(apiKey: string, socialData: any, userContext: any) {
  console.log('🧠 Generating premium AI insights with reasoning model...');

  const systemPrompt = `Eres un consultor estratégico senior especializado en marketing digital y redes sociales con más de 15 años de experiencia trabajando con marcas Fortune 500. Tu trabajo es generar análisis estratégicos profundos y accionables para empresas, proporcionando insights de nivel ejecutivo que impulsen el crecimiento y ROI.

CONTEXTO EMPRESARIAL:
- Empresa: ${userContext.company_name || 'No especificado'}
- Industria: ${userContext.industry_sector || 'No especificado'}
- Tamaño: ${userContext.company_size || 'No especificado'}

TU MISIÓN: 
Analizar exhaustivamente todos los datos de redes sociales proporcionados y generar un informe estratégico completo que incluya insights profundos, oportunidades de crecimiento, análisis competitivo, y recomendaciones accionables con ROI estimado.

ESTRUCTURA DE ANÁLISIS REQUERIDA:

1. RESUMEN EJECUTIVO
- Estado actual del performance digital
- Principales oportunidades identificadas
- ROI potencial estimado

2. ANÁLISIS DE PERFORMANCE
- Métricas clave por plataforma
- Tendencias de engagement
- Análisis de contenido de alto rendimiento
- Benchmarking contra industria

3. ANÁLISIS DE AUDIENCIA
- Demografía y psicografía detallada
- Comportamientos y preferencias
- Segmentación de audiencia
- Oportunidades de expansión

4. ANÁLISIS COMPETITIVO
- Posicionamiento vs competidores
- Gaps de mercado identificados
- Oportunidades de diferenciación

5. ESTRATEGIAS DE CRECIMIENTO
- Recomendaciones por plataforma
- Estrategias de contenido
- Optimización de timing
- Tácticas de engagement

6. ROADMAP EJECUTIVO
- Acciones prioritarias (próximos 30/60/90 días)
- Recursos necesarios
- KPIs a trackear
- ROI proyectado

Responde ÚNICAMENTE con un JSON válido con esta estructura:`;

  const userPrompt = `DATOS PARA ANÁLISIS:

POSTS (${socialData.posts.length} posts):
${JSON.stringify(socialData.posts.slice(0, 50), null, 2)}

COMENTARIOS (${socialData.comments.length} comentarios):
${JSON.stringify(socialData.comments.slice(0, 20), null, 2)}

FOLLOWERS (${socialData.followers.length} followers):
${JSON.stringify(socialData.followers.slice(0, 20), null, 2)}

CALENDARIO (${socialData.calendar.length} entradas):
${JSON.stringify(socialData.calendar.slice(0, 30), null, 2)}

COMPETIDORES (${socialData.competitors.length} análisis):
${JSON.stringify(socialData.competitors, null, 2)}

ANÁLISIS DE UBICACIÓN:
${JSON.stringify(socialData.locationAnalysis, null, 2)}

INSIGHTS EXISTENTES:
${JSON.stringify(socialData.insights, null, 2)}

ACTIONABLES EXISTENTES:
${JSON.stringify(socialData.actionables, null, 2)}

RECOMENDACIONES EXISTENTES:
${JSON.stringify(socialData.recommendations, null, 2)}

Genera un análisis estratégico profundo basado en todos estos datos.`;

  try {
    console.log('🔄 Calling OpenAI with o3-2025-04-16 reasoning model...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16', // Modelo de reasoning más potente
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Menos creatividad, más precisión
        max_tokens: 4000, // Respuesta extensa
        top_p: 0.9,
        reasoning_effort: 'high' // Máximo esfuerzo de reasoning
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ OpenAI reasoning analysis completed');
    
    if (!result.choices?.[0]?.message?.content) {
      throw new Error('No content received from OpenAI');
    }

    // Limpiar y parsear respuesta JSON
    let content = result.choices[0].message.content;
    
    // Remover markdown si existe
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Buscar JSON válido
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }

    try {
      const analysis = JSON.parse(content);
      console.log('📊 Premium analysis generated successfully');
      return analysis;
    } catch (parseError) {
      console.error('❌ Error parsing OpenAI response:', parseError);
      console.log('Raw content:', content);
      throw new Error('Error parsing AI analysis response');
    }

  } catch (error) {
    console.error('❌ Error in OpenAI analysis:', error);
    throw error;
  }
}

// Guardar resultados del análisis premium
async function savePremiumResults(supabase: any, userId: string, analysis: any) {
  console.log('💾 Saving premium analysis results...');

  try {
    // Guardar insight principal
    const { data: insight, error: insightError } = await supabase
      .from('marketing_insights')
      .insert({
        user_id: userId,
        insight_type: 'premium_strategic_analysis',
        title: 'Análisis Estratégico Premium de IA',
        description: analysis.resumen_ejecutivo?.descripcion || 'Análisis completo generado por IA avanzada',
        confidence_score: 0.95,
        data: analysis,
        platform: 'all'
      })
      .select()
      .single();

    if (insightError) {
      console.error('❌ Error saving insight:', insightError);
    } else {
      console.log('✅ Premium insight saved');
    }

    // Guardar actionables de alta prioridad
    if (analysis.roadmap_ejecutivo?.acciones_prioritarias) {
      for (const accion of analysis.roadmap_ejecutivo.acciones_prioritarias.slice(0, 5)) {
        const { error: actionableError } = await supabase
          .from('marketing_actionables')
          .insert({
            user_id: userId,
            title: accion.titulo || 'Acción Estratégica Premium',
            description: accion.descripcion || accion.detalle,
            action_type: 'strategic_premium',
            priority: accion.prioridad || 'high',
            estimated_impact: accion.roi_estimado || 'Alto impacto en ROI',
            due_date: new Date(Date.now() + (accion.plazo_dias || 30) * 24 * 60 * 60 * 1000).toISOString()
          });

        if (actionableError) {
          console.error('❌ Error saving actionable:', actionableError);
        }
      }
      console.log('✅ Premium actionables saved');
    }

    // Guardar recomendaciones premium
    if (analysis.estrategias_crecimiento?.recomendaciones) {
      for (const recomendacion of analysis.estrategias_crecimiento.recomendaciones.slice(0, 3)) {
        const { error: recError } = await supabase
          .from('content_recommendations')
          .insert({
            user_id: userId,
            platform: recomendacion.plataforma || 'all',
            recommendation_type: 'premium_strategy',
            title: recomendacion.titulo || 'Estrategia Premium',
            description: recomendacion.descripcion,
            confidence_score: 0.90,
            suggested_content: recomendacion.contenido_sugerido || {}
          });

        if (recError) {
          console.error('❌ Error saving recommendation:', recError);
        }
      }
      console.log('✅ Premium recommendations saved');
    }

    return insight;

  } catch (error) {
    console.error('❌ Error saving premium results:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Autenticación
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { platform } = await req.json();
    const userId = user.id;
    
    console.log(`🚀 Iniciando análisis premium de IA para usuario ${userId}, plataforma: ${platform || 'todas'}`);

    // Obtener contexto del usuario
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('company_name, industry_sector, company_size')
      .eq('user_id', userId)
      .single();

    // Obtener API key de OpenAI
    const openaiApiKey = await getOpenAIApiKey(supabaseClient);

    // Recopilar todos los datos de redes sociales
    const socialData = await gatherSocialMediaData(supabaseClient, userId, platform);

    // Verificar que tengamos suficientes datos
    if (socialData.posts.length === 0) {
      throw new Error('No se encontraron datos suficientes para realizar el análisis premium');
    }

    // Generar análisis con IA avanzada
    const premiumAnalysis = await generatePremiumInsights(
      openaiApiKey, 
      socialData, 
      userProfile || {}
    );

    // Guardar resultados
    const savedInsight = await savePremiumResults(supabaseClient, userId, premiumAnalysis);

    console.log('🎉 Análisis premium completado exitosamente');

    return new Response(JSON.stringify({
      success: true,
      message: 'Análisis estratégico premium completado',
      analysis: premiumAnalysis,
      insight_id: savedInsight?.id,
      posts_analyzed: socialData.posts.length,
      total_data_points: socialData.posts.length + socialData.comments.length + socialData.followers.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en análisis premium:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Error en el análisis estratégico premium'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});