import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Importa el módulo xhr si aún no está en tus dependencias de Deno Deploy (aunque es más para navegadores, la función de Instagram lo tenía)
// import "https://deno.land/x/xhr@0.1.0/mod.ts"; 

const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY'); // Se agrega la clave de OpenAI
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    console.log('🚀 LinkedIn Scraper Function Started');
    console.log(`🔑 RAPIDAPI_KEY configured: ${!!rapidApiKey}`);
    console.log(`🔑 OPENAI_API_KEY configured: ${!!openAIApiKey}`); // Log para OpenAI
    
    if (!rapidApiKey) {
      console.error('❌ RAPIDAPI_KEY not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'RAPIDAPI_KEY not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const { action, company_identifier } = await req.json();
    console.log(`🔗 LinkedIn Scraper - Action: ${action}, Company: ${company_identifier}, User: ${user.id}`);

    let responseData: any = {}; // Usar any para flexibilidad
    let companyDetailsForPosts: any = null; // Para pasar a la función de posts

    switch (action) {
      case 'get_company_details':
        responseData = await getLinkedInCompanyDetails(company_identifier, user.id, supabase);
        break;
      case 'get_company_posts':
        // Primero obtenemos los detalles de la compañía para el conteo de seguidores
        const tempCompanyDetails = await getLinkedInCompanyDetails(company_identifier, user.id, supabase);
        companyDetailsForPosts = tempCompanyDetails.company_details;
        responseData = await getLinkedInCompanyPosts(company_identifier, user.id, supabase, companyDetailsForPosts?.followers_count || 0);
        break;
      case 'get_complete_analysis':
        responseData = await getCompleteLinkedInAnalysis(company_identifier, user.id, supabase);
        break;
      default:
        throw new Error(`Action not supported: ${action}`);
    }

    // El trigger de análisis inteligente asíncrono se mantiene si se desea una segunda capa de análisis,
    // pero la lógica principal de análisis IA se moverá a las funciones específicas.
    if ((action === 'get_company_posts' || action === 'get_complete_analysis') && responseData.posts && responseData.posts.length > 0) {
      console.log('🧠 Triggering LinkedIn intelligent analysis (secondary/async)...');
      try {
        const analysisResponse = await supabase.functions.invoke('linkedin-intelligent-analysis', {
          headers: {
            Authorization: authHeader
          }
        });
        if (analysisResponse.error) {
          console.error('Secondary analysis trigger error:', analysisResponse.error);
        } else {
          console.log('✅ LinkedIn intelligent analysis triggered successfully (secondary/async)');
          // Si el análisis secundario tiene datos, se pueden agregar
          responseData.secondary_analysis_triggered = true;
          responseData.secondary_insights_generated = analysisResponse.data?.insights_generated || 0;
          responseData.secondary_actionables_generated = analysisResponse.data?.actionables_generated || 0;
        }
      } catch (analysisError) {
        console.error('Error triggering secondary analysis:', analysisError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      company_identifier,
      data: responseData
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error: any) { // Usar any para error
    console.error('❌ LinkedIn Scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred' // Homologado con Instagram
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

// --- Funciones de Asistencia ---

function extractCompanyIdFromUrl(url: string): string {
  // Extract company ID or name from LinkedIn URL
  const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
  return match ? match[1] : url;
}

function calculateEngagementRate(interactions: number, followers: number): number {
  if (followers === 0) return 0;
  // La fórmula de Instagram usaba un cálculo diferente, ajustamos para que sea una tasa de engagement más estándar.
  // Interacciones / Seguidores * 100 para porcentaje
  return Math.round((interactions / followers) * 10000) / 100; // Porcentaje con 2 decimales
}

// Helper function to extract hashtags from text (placeholders for now)
function extractLinkedInHashtagsFromText(text: string): string[] {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(match => match.substring(1)) : [];
}

// Helper function to extract mentions from text (placeholders for now)
function extractLinkedInMentionsFromText(text: string): string[] {
    const regex = /@([\w.-]+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(match => match.substring(1)) : [];
}

// --- Funciones de scraping y análisis ---

async function getLinkedInCompanyDetails(companyIdentifier: string, userId: string, supabase: any) {
  console.log(`🏢 Getting LinkedIn company details for: ${companyIdentifier}`);
  try {
    const response = await fetch(`https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/companies/detail?identifier=${encodeURIComponent(companyIdentifier)}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey!
      }
    });

    console.log(`📡 LinkedIn Company API Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Raw response for ${companyIdentifier} (first 500 chars): ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error('❌ LinkedIn Company API error:', responseText);
      throw new Error(`LinkedIn API error: ${response.status} - ${response.statusText}. Details: ${responseText}`);
    }

    const apiResponse = JSON.parse(responseText); // Parse responseText
    console.log('✅ LinkedIn Company Details Response received');

    // La nueva API devuelve los datos directamente
    const companyData = apiResponse;

    // Save company data to database
    if (companyData) {
      const companyDataToSave = {
        user_id: userId,
        company_id: companyData.id || extractCompanyIdFromUrl(companyIdentifier),
        company_name: companyData.name || '',
        description: companyData.description || '',
        industry: companyData.industry || '',
        company_size: companyData.company_size || companyData.employees_count || '',
        website: companyData.website || '',
        followers_count: companyData.followers_count || 0,
        headquarters: companyData.headquarters || '',
        founded: companyData.founded || '',
        specialties: companyData.specialties || [],
        raw_data: companyData
      };

      const { error: saveError } = await supabase.from('linkedin_company_data').upsert(companyDataToSave, {
        onConflict: 'user_id,company_id'
      });
      if (saveError) {
        console.error('❌ Error saving LinkedIn company data:', saveError);
      } else {
        console.log('✅ Saved LinkedIn company data to database');
      }
    }

    let aiAnalysis = null;
    if (openAIApiKey) {
        try {
            console.log('🤖 Starting AI analysis for LinkedIn company details...');
            aiAnalysis = await organizeLinkedInDataWithAI(companyData);
            console.log('✅ AI analysis for LinkedIn company details completed');
        } catch (error) {
            console.error('❌ OpenAI analysis for company details failed:', error);
        }
    } else {
        console.log('⚠️ OpenAI API key not found, skipping AI analysis for company details');
    }

    return {
      company_details: companyData,
      analysis: aiAnalysis && aiAnalysis.ai_powered ? aiAnalysis : {
        summary: `Perfil de LinkedIn para la empresa ${companyData.name || companyIdentifier}. Cuenta con ${companyData.followers_count || 0} seguidores y se especializa en ${companyData.industry || 'no especificado'}.`,
        recommendations: [
          "Optimizar la página de empresa con palabras clave relevantes.",
          "Publicar contenido de valor para la industria.",
          "Fomentar el engagement de empleados con el contenido de la empresa."
        ],
        opportunities: [
          "Colaborar con otras empresas o líderes de opinión en la industria.",
          "Utilizar LinkedIn Ads para llegar a audiencias específicas.",
          "Analizar el rendimiento de las publicaciones para optimizar la estrategia."
        ],
        ai_powered: false
      },
      saved: true
    };
  } catch (error) {
    console.error('❌ Error getting LinkedIn company details:', error);
    throw error;
  }
}

async function getLinkedInCompanyPosts(companyIdentifier: string, userId: string, supabase: any, companyFollowers: number = 0) {
  console.log(`📝 Getting LinkedIn company posts for: ${companyIdentifier}`);
  try {
    const response = await fetch(`https://linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com/companies/posts?identifier=${encodeURIComponent(companyIdentifier)}&limit=20`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey!
      }
    });

    console.log(`📡 LinkedIn Posts API Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Raw response for ${companyIdentifier} (first 500 chars): ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error('❌ LinkedIn Posts API error:', responseText);
      // Retorna una respuesta significativa en lugar de lanzar, similar a Instagram
      return {
        posts: [],
        analysis: {
          summary: `Error al obtener posts de LinkedIn: ${response.status} - ${response.statusText}`,
          error_details: responseText.substring(0, 200),
          recommendations: [
            "Verificar acceso a la API",
            "La empresa podría no tener posts públicos",
            "Verificar límites de rate"
          ],
          ai_powered: false
        },
        stats: {
          total_posts: 0,
          avg_likes: 0,
          avg_comments: 0,
          avg_shares: 0,
          has_ai_analysis: false,
          error: true
        }
      };
    }

    let apiResponse;
    try {
        apiResponse = JSON.parse(responseText);
        console.log(`✅ Successfully parsed JSON response for ${companyIdentifier}`);
        console.log(`📄 Full API response structure:`, JSON.stringify(apiResponse, null, 2));
    } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        return {
            posts: [],
            analysis: {
                summary: "Error: Respuesta de la API no es JSON válido para posts de LinkedIn",
                recommendations: [
                    "Verificar formato de respuesta de la API"
                ],
                ai_powered: false
            },
            stats: {
                total_posts: 0,
                avg_likes: 0,
                avg_comments: 0,
                avg_shares: 0,
                has_ai_analysis: false,
                error: true
            }
        };
    }

    // La nueva API devuelve los posts directamente
    console.log(`📊 Posts data structure:`, typeof apiResponse, Array.isArray(apiResponse));
    console.log(`📊 Number of posts received:`, apiResponse?.length || 0);
    
    const posts = (apiResponse || []).slice(0, 12).map((post: any) => { // Limitar a 12 posts para análisis como Instagram
      const content = post.text || post.description || '';
      const hashtags = extractLinkedInHashtagsFromText(content);
      const mentions = extractLinkedInMentionsFromText(content);

      const reactions = (post.reactions_count || post.stats?.total_reactions || 0);
      const comments = (post.comments_count || post.stats?.comments || 0);
      const shares = (post.shares_count || post.stats?.shares || 0);

      return {
        id: post.id || `linkedin_${Date.now()}_${Math.random()}`,
        post_type: 'company_post',
        content: content,
        likes_count: reactions,
        comments_count: comments,
        shares_count: shares,
        views_count: post.views_count || post.stats?.views || 0,
        posted_at: post.posted_at || post.created_at || post.createdAt || new Date().toISOString(),
        engagement_rate: calculateEngagementRate(reactions + comments + shares, companyFollowers),
        url: post.url || '',
        image_url: post.image_url || post.media_url || '',
        video_url: post.video_url || '',
        hashtags: hashtags,
        mentions: mentions,
        raw_data: post
      };
    });
    console.log(`📝 Found ${posts.length} LinkedIn posts`);

    // Save posts to database
    if (posts.length > 0) {
      // Agregar user_id a cada post para la base de datos
      const postsWithUserId = posts.map(post => ({
        ...post,
        user_id: userId
      }));
      
      const { error: saveError } = await supabase.from('linkedin_posts').upsert(postsWithUserId, {
        onConflict: 'user_id,post_id'
      });
      if (saveError) {
        console.error('❌ Error saving LinkedIn posts:', saveError);
      } else {
        console.log(`✅ Saved ${postsWithUserId.length} LinkedIn posts to database`);
      }
    }

    let postsAnalysis = null;
    if (openAIApiKey && posts.length > 0) {
      try {
        console.log('🤖 Starting LinkedIn posts AI analysis...');
        postsAnalysis = await analyzeLinkedInPostsWithAI(posts, companyIdentifier);
        console.log('✅ LinkedIn posts AI analysis completed');

        console.log('🧠 Generating embeddings for LinkedIn posts...');
        await generateLinkedInPostEmbeddings(posts, userId, supabase); // Generar embeddings
      } catch (error) {
        console.error('❌ LinkedIn posts AI analysis or embedding generation failed:', error);
      }
    }

    const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.likes_count || 0), 0);
    const totalComments = posts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
    const totalShares = posts.reduce((sum: number, post: any) => sum + (post.shares_count || 0), 0);

    return {
      posts: posts,
      posts_count: posts.length,
      analysis: postsAnalysis || {
        summary: posts.length > 0 ? `Se encontraron ${posts.length} publicaciones recientes de ${companyIdentifier}` : `No se encontraron publicaciones públicas para ${companyIdentifier}. Esto puede ser porque la página es privada o no tiene posts públicos.`,
        insights: posts.length > 0 ? [
          "Las publicaciones muestran patrones de engagement variables.",
          "Analizar horarios de publicación para optimizar alcance.",
          "Revisar tipos de contenido con mejor rendimiento."
        ] : [
          "No hay posts disponibles para analizar.",
          "La cuenta podría ser privada o no tener contenido público.",
          "Verificar que la URL de LinkedIn sea correcta."
        ],
        recommendations: posts.length > 0 ? [
          "Mantener consistencia en la calidad del contenido y el mensaje.",
          "Usar hashtags relevantes para aumentar alcance.",
          "Interactuar más con los comentarios y reacciones."
        ] : [
          "Verificar que la página de empresa de LinkedIn sea pública.",
          "Asegurarse de que la página tenga publicaciones.",
          "Revisar la configuración de privacidad de la página."
        ],
        ai_powered: false
      },
      stats: {
        total_posts: posts.length,
        avg_likes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
        avg_comments: posts.length > 0 ? Math.round(totalComments / posts.length) : 0,
        avg_shares: posts.length > 0 ? Math.round(totalShares / posts.length) : 0,
        has_ai_analysis: !!postsAnalysis // Indicador de si se hizo análisis IA
      },
      saved: true
    };
  } catch (error) {
    console.error('❌ Error getting LinkedIn posts:', error);
    // Retorna una respuesta significativa en caso de error grave
    return {
      posts: [],
      analysis: {
        summary: `Error al obtener posts de ${companyIdentifier}: ${error.message}`,
        recommendations: [
          "Verificar que la empresa de LinkedIn exista y sea pública.",
          "Revisar la conectividad de la API.",
          "La cuenta podría tener restricciones de acceso."
        ],
        ai_powered: false
      },
      stats: {
        total_posts: 0,
        avg_likes: 0,
        avg_comments: 0,
        avg_shares: 0,
        has_ai_analysis: false,
        error: true
      }
    };
  }
}

async function getCompleteLinkedInAnalysis(companyIdentifier: string, userId: string, supabase: any) {
  console.log(`📊 Getting complete LinkedIn analysis for: ${companyIdentifier}`);
  try {
    // Get company details first
    console.log('🔄 Getting LinkedIn company details...');
    const companyDetailsResult = await getLinkedInCompanyDetails(companyIdentifier, userId, supabase);
    const companyDetails = companyDetailsResult.company_details;
    const companyAnalysis = companyDetailsResult.analysis; // Incluye el análisis de IA de los detalles

    // Get posts, passing the follower count for accurate engagement rate
    console.log('🔄 Getting LinkedIn posts...');
    const postsResult = await getLinkedInCompanyPosts(companyIdentifier, userId, supabase, companyDetails?.followers_count || 0);
    const posts = postsResult.posts;
    const postsAnalysis = postsResult.analysis; // Incluye el análisis de IA de los posts
    const postsStats = postsResult.stats;

    // Combinar los resultados en una única estructura de análisis completa
    return {
      company_details: companyDetails,
      posts: posts,
      posts_count: posts.length,
      analysis: {
        company: companyAnalysis,
        posts: postsAnalysis
      },
      stats: {
        company_followers: companyDetails?.followers_count || 0,
        company_employees: companyDetails?.company_size || companyDetails?.employees_count || 'N/A',
        ...postsStats, // Incluye las estadísticas de posts
        has_ai_analysis: (companyAnalysis?.ai_powered || postsAnalysis?.ai_powered) // Unificado
      },
      analysis_complete: true,
      saved: true
    };
  } catch (error) {
    console.error('❌ Error getting complete LinkedIn analysis:', error);
    throw error;
  }
}

// --- Funciones de Integración con OpenAI ---

async function organizeLinkedInDataWithAI(companyData: any) {
  console.log('🤖 Organizing LinkedIn company data with OpenAI');
  try {
    const prompt = `
Analiza los siguientes datos de una página de empresa de LinkedIn y proporciona un análisis detallado y organizado en español:

DATOS DE LA EMPRESA:
${JSON.stringify(companyData, null, 2)}

Por favor, proporciona un análisis estructurado que incluya:

1.  **Resumen del Perfil**: Información general sobre la empresa y su actividad.
2.  **Métricas Clave**: Análisis de seguidores, tamaño de la empresa y otros datos relevantes.
3.  **Industria y Especialidades**: Análisis de su sector y las áreas en las que se enfoca.
4.  **Recomendaciones**: Sugerencias para mejorar la presencia y estrategia en LinkedIn.
5.  **Oportunidades**: Identificación de posibles áreas de crecimiento, colaboraciones o mejoras.

Estructura la respuesta en formato JSON con las siguientes claves:
- summary: resumen ejecutivo
- metrics: métricas clave analizadas
- industry_specialties: análisis de industria y especialidades
- recommendations: recomendaciones específicas
- opportunities: oportunidades identificadas

Sé conciso pero informativo, y enfócate en insights accionables para marketing digital y reclutamiento.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey!}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing digital, análisis de redes sociales y reclutamiento en LinkedIn. Proporciona análisis detallados y recomendaciones prácticas basadas en datos de empresas de LinkedIn.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    try {
      const parsed = JSON.parse(analysisText);
      console.log('✅ Successfully parsed LinkedIn company AI response as JSON');
      return {
        ...parsed,
        ai_powered: true
      };
    } catch {
      console.log('⚠️ LinkedIn company AI response not JSON, structuring as text analysis');
      return {
        summary: analysisText,
        recommendations: [
          "Análisis generado por IA - revisar texto completo arriba"
        ],
        opportunities: [
          "Potencial identificado por IA - consultar análisis completo"
        ],
        ai_powered: true
      };
    }
  } catch (error) {
    console.error('❌ Error organizing LinkedIn company data with OpenAI:', error);
    return {
      error: 'No se pudo procesar el análisis de empresa con IA',
      raw_data: companyData,
      ai_powered: false // Asegura que se marque como no AI-powered si falla
    };
  }
}

async function analyzeLinkedInPostsWithAI(posts: any[], companyIdentifier: string) {
  console.log('🤖 Analyzing LinkedIn posts with OpenAI');
  try {
    const prompt = `
Analiza las siguientes publicaciones de LinkedIn de la empresa ${companyIdentifier} y proporciona un análisis detallado en español:

DATOS DE LAS PUBLICACIONES (muestra de ${posts.length}):
${JSON.stringify(posts.slice(0, 8), null, 2)}

Por favor, proporciona un análisis estructurado que incluya:

1.  **Resumen de Contenido**: Análisis general del tipo de contenido y temas recurrentes en las publicaciones.
2.  **Rendimiento**: Análisis de likes, comentarios, compartidos y engagement general.
3.  **Patrones**: Identificación de patrones en el contenido exitoso (ej. tipo de media, longitud del texto, llamados a la acción).
4.  **Audiencia**: Insights sobre la respuesta de la audiencia y tipos de contenido que generan más interacción.
5.  **Recomendaciones**: Sugerencias específicas para mejorar el contenido y la estrategia de publicación en LinkedIn.
6.  **Oportunidades**: Identificación de nuevas oportunidades de contenido o campañas.

Estructura la respuesta en formato JSON con las siguientes claves:
- summary: resumen ejecutivo del análisis de contenido
- content_analysis: análisis del tipo de contenido
- performance: análisis de rendimiento y engagement
- patterns: patrones identificados
- audience_response: análisis de respuesta de audiencia
- recommendations: recomendaciones específicas
- opportunities: oportunidades identificadas

Sé específico y proporciona insights accionables para marketing de contenido y estrategia de marca empleadora.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey!}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing de contenido y análisis de redes sociales para LinkedIn. Proporciona análisis detallados y recomendaciones prácticas basadas en datos de publicaciones de LinkedIn.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    try {
      const parsed = JSON.parse(analysisText);
      console.log('✅ Successfully parsed LinkedIn posts AI response as JSON');
      return {
        ...parsed,
        ai_powered: true
      };
    } catch {
      console.log('⚠️ LinkedIn posts AI response not JSON, structuring as text analysis');
      return {
        summary: analysisText,
        recommendations: [
          "Análisis de contenido generado por IA - revisar texto completo arriba"
        ],
        opportunities: [
          "Oportunidades de contenido identificadas por IA"
        ],
        ai_powered: true
      };
    }
  } catch (error) {
    console.error('❌ Error analyzing LinkedIn posts with OpenAI:', error);
    return {
      error: 'No se pudo procesar el análisis de posts de LinkedIn con IA',
      raw_data: posts,
      ai_powered: false
    };
  }
}

// Function to generate embeddings for posts
async function generateLinkedInPostEmbeddings(posts: any[], userId: string, supabase: any) {
  console.log(`🧠 Generating embeddings for ${posts.length} LinkedIn posts`);
  if (!openAIApiKey) {
    console.log('⚠️ OpenAI API key not available, skipping embeddings generation for LinkedIn posts');
    return;
  }
  try {
    for (const post of posts) {
      if (!post.content || post.content.trim().length < 10) {
        console.log(`⏭️ Skipping LinkedIn post ${post.id} - content too short or empty`);
        continue;
      }
      console.log(`🔤 Generating embedding for LinkedIn post ${post.id}`);

      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey!}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: post.content,
          encoding_format: 'float'
        })
      });

      if (!embeddingResponse.ok) {
        console.error(`❌ Error generating embedding for LinkedIn post ${post.id}: ${embeddingResponse.status}`);
        continue;
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Get the LinkedIn post ID from database (or use the one created during upsert if it's the primary key)
      // Assuming 'linkedin_posts' has a column 'id' which is its primary key or we use 'post_id'
      const { data: dbPost, error: dbError } = await supabase.from('linkedin_posts')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', post.id) // Using post.id which is the unique identifier from API/generated
          .single();

      if (dbError || !dbPost) {
        console.error(`❌ Could not find database record for LinkedIn post ${post.id}:`, dbError);
        continue;
      }
      
      // Save embedding to database (tabla 'content_embeddings' o similar)
      const { error: embeddingError } = await supabase.from('content_embeddings').upsert({
        user_id: userId,
        post_id: post.id, // ID original del post de LinkedIn
        linkedin_post_db_id: dbPost.id, // ID de la fila en nuestra tabla linkedin_posts
        platform: 'linkedin',
        content_text: post.content,
        content_type: 'post_content',
        embedding: embedding,
        embedding_model: 'text-embedding-3-small',
        processing_status: 'completed'
      }, {
        onConflict: 'user_id,post_id,platform', // Asegura unicidad por usuario, post y plataforma
        ignoreDuplicates: false
      });

      if (embeddingError) {
        console.error(`❌ Error saving embedding for LinkedIn post ${post.id}:`, embeddingError);
      } else {
        console.log(`✅ Generated and saved embedding for LinkedIn post ${post.id}`);
      }
      // Add a small delay to avoid rate limiting for OpenAI embeddings
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log(`✅ Completed embedding generation for ${posts.length} LinkedIn posts`);
  } catch (error) {
    console.error('❌ Error generating LinkedIn embeddings:', error);
  }
}