import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramInfo {
  id?: string;
  username?: string;
  full_name?: string;
  biography?: string;
  profile_pic_url?: string;
  followers_count?: number;
  following_count?: number;
  media_count?: number;
  is_verified?: boolean;
  is_business?: boolean;
  business_category?: string;
  external_url?: string;
}

interface InstagramFollower {
  id?: string;
  username?: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Instagram Scraper Function Started');
    console.log('🔑 Checking API keys...');
    console.log(`RAPIDAPI_KEY configured: ${!!rapidApiKey}`);
    console.log(`OPENAI_API_KEY configured: ${!!openAIApiKey}`);
    
    if (!rapidApiKey) {
      console.error('❌ RAPIDAPI_KEY not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'RAPIDAPI_KEY not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, username_or_url } = await req.json();
    console.log(`📱 Instagram Scraper - Action: ${action}, Username: ${username_or_url}`);

    // Extract username from URL or use as is
    const username = extractInstagramUsername(username_or_url);
    console.log(`✅ Extracted username: ${username}`);
    
    let responseData: any = {};

    if (action === 'get_complete_analysis') {
      responseData = await getCompleteInstagramAnalysis(username);
    } else {
      throw new Error(`Action not supported: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Instagram Scraper Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractInstagramUsername(usernameOrUrl: string): string {
  // Extract username from Instagram URL or return as is
  const urlMatch = usernameOrUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  // Remove @ if present
  return usernameOrUrl.replace('@', '');
}

async function getInstagramProfileDetails(username: string): Promise<InstagramInfo> {
  console.log(`🔍 Getting Instagram profile details for: ${username}`);
  
  try {
    const response = await fetch(`https://instagram-social-api.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-social-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey!,
      },
    });

    console.log(`📡 Instagram API Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Instagram API Error: ${response.status} - ${response.statusText}`);
      console.error(`❌ Error Response: ${errorText}`);
      throw new Error(`Instagram API error: ${response.status} - ${response.statusText}. Details: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Instagram profile data received');
    
    return {
      id: data.data?.id,
      username: data.data?.username,
      full_name: data.data?.full_name,
      biography: data.data?.biography,
      profile_pic_url: data.data?.profile_pic_url,
      followers_count: data.data?.follower_count,
      following_count: data.data?.following_count,
      media_count: data.data?.media_count,
      is_verified: data.data?.is_verified,
      is_business: data.data?.is_business_account,
      business_category: data.data?.business_category_name,
      external_url: data.data?.external_url,
    };
  } catch (error) {
    console.error('❌ Error getting Instagram profile:', error);
    throw error;
  }
}

async function getInstagramFollowers(username: string): Promise<InstagramFollower[]> {
  console.log(`👥 Getting Instagram followers for: ${username}`);
  
  try {
    const response = await fetch(`https://instagram-social-api.p.rapidapi.com/v1/followers?username_or_id_or_url=${username}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-social-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey!,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Instagram followers data received');
    
    return data.data?.users?.slice(0, 50).map((user: any) => ({
      id: user.pk,
      username: user.username,
      full_name: user.full_name,
      profile_pic_url: user.profile_pic_url,
      is_verified: user.is_verified,
    })) || [];
  } catch (error) {
    console.error('❌ Error getting Instagram followers:', error);
    throw error;
  }
}

async function getInstagramFollowing(username: string): Promise<InstagramFollower[]> {
  console.log(`👥 Getting Instagram following for: ${username}`);
  
  try {
    const response = await fetch(`https://instagram-social-api.p.rapidapi.com/v1/following?username_or_id_or_url=${username}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'instagram-social-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey!,
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Instagram following data received');
    
    return data.data?.users?.slice(0, 50).map((user: any) => ({
      id: user.pk,
      username: user.username,
      full_name: user.full_name,
      profile_pic_url: user.profile_pic_url,
      is_verified: user.is_verified,
    })) || [];
  } catch (error) {
    console.error('❌ Error getting Instagram following:', error);
    throw error;
  }
}

async function getCompleteInstagramAnalysis(username: string): Promise<any> {
  console.log(`📊 Getting complete Instagram analysis for: ${username}`);
  
  try {
    // Get all data in parallel for better performance
    console.log('🔄 Getting Instagram data...');
    const [profileInfo, followers, following] = await Promise.all([
      getInstagramProfileDetails(username),
      getInstagramFollowers(username),
      getInstagramFollowing(username)
    ]);

    console.log('✅ All Instagram data retrieved successfully');

    // Organize data with AI if OpenAI key is available
    let aiAnalysis = null;
    if (openAIApiKey) {
      try {
        const analysisData = { profile: profileInfo, followers, following };
        aiAnalysis = await organizeInstagramDataWithAI(analysisData);
      } catch (error) {
        console.error('❌ OpenAI analysis failed:', error);
      }
    }

    const result = {
      profile: profileInfo,
      followers: followers,
      following: following,
      analysis: aiAnalysis || {
        summary: `Perfil de Instagram para @${profileInfo.username || username}. Cuenta ${profileInfo.is_business ? 'empresarial' : 'personal'} con ${profileInfo.followers_count || 0} seguidores.`,
        recommendations: [
          "Verificar configuración de la cuenta empresarial",
          "Optimizar biografía para mejor engagement",
          "Mantener contenido consistente",
          "Analizar patrones de seguidores para mejores horarios de publicación"
        ],
        opportunities: [
          "Aumentar frecuencia de publicaciones",
          "Utilizar stories más frecuentemente",
          "Colaboraciones con influencers locales",
          "Engagement con seguidores de cuentas similares"
        ]
      },
      summary: {
        total_followers: profileInfo.followers_count || 0,
        total_following: profileInfo.following_count || 0,
        total_posts: profileInfo.media_count || 0,
        engagement_ratio: calculateEngagementRatio(profileInfo),
        account_type: profileInfo.is_business ? 'Empresa' : 'Personal',
        verification_status: profileInfo.is_verified ? 'Verificado' : 'No verificado',
        followers_sample: followers.length,
        following_sample: following.length
      }
    };

    console.log('✅ Complete analysis prepared successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error getting complete Instagram analysis:', error);
    throw error;
  }
}

async function organizeInstagramDataWithAI(data: any): Promise<any> {
  console.log('🤖 Organizing Instagram data with OpenAI');
  
  try {
    const prompt = `
Analiza los siguientes datos de Instagram y proporciona un análisis detallado y organizado en español:

DATOS DEL PERFIL:
${JSON.stringify(data.profile, null, 2)}

SEGUIDORES (muestra de ${data.followers.length}):
${JSON.stringify(data.followers.slice(0, 10), null, 2)}

SIGUIENDO (muestra de ${data.following.length}):
${JSON.stringify(data.following.slice(0, 10), null, 2)}

Por favor, proporciona un análisis estructurado que incluya:

1. **Resumen del Perfil**: Información general sobre la cuenta
2. **Métricas Clave**: Análisis de seguidores, siguiendo, y engagement
3. **Tipo de Audiencia**: Análisis de los seguidores más relevantes
4. **Estrategia de Seguimiento**: Análisis de a quién sigue la cuenta
5. **Recomendaciones**: Sugerencias para mejorar la presencia en Instagram
6. **Oportunidades**: Identificación de posibles colaboraciones o mejoras

Estructura la respuesta en formato JSON con las siguientes claves:
- summary: resumen ejecutivo
- metrics: métricas clave analizadas
- audience: análisis de audiencia
- strategy: análisis de estrategia
- recommendations: recomendaciones específicas
- opportunities: oportunidades identificadas

Sé conciso pero informativo, y enfócate en insights accionables para marketing digital.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing digital y análisis de redes sociales. Proporciona análisis detallados y recomendaciones prácticas basadas en datos de Instagram.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;
    
    // Try to parse as JSON, fallback to text if parsing fails
    try {
      return JSON.parse(analysisText);
    } catch {
      return { analysis: analysisText };
    }

  } catch (error) {
    console.error('❌ Error organizing data with OpenAI:', error);
    return {
      error: 'No se pudo procesar el análisis con IA',
      raw_data: data
    };
  }
}

function calculateEngagementRatio(profile: InstagramInfo): number {
  if (!profile.followers_count || profile.followers_count === 0) return 0;
  
  // Simple engagement estimation based on following/followers ratio
  const followingRatio = (profile.following_count || 0) / profile.followers_count;
  const mediaRatio = (profile.media_count || 0) / profile.followers_count;
  
  return Math.round((followingRatio + mediaRatio) * 100) / 100;
}