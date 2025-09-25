import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookAuthData {
  accessToken: string;
  userID: string;
  expiresIn: number;
  grantedScopes: string[];
}

interface InstagramBusinessAccount {
  id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...data } = await req.json()

    switch (action) {
      case 'exchange_token':
        return await handleTokenExchange(data, supabase)
      case 'get_instagram_accounts':
        return await getInstagramAccounts(data, supabase)
      case 'connect_instagram':
        return await connectInstagramAccount(data, supabase)
      case 'publish_content':
        return await publishContent(data, supabase)
      case 'get_insights':
        return await getInsights(data, supabase)
      default:
        throw new Error('Acción no válida')
    }
  } catch (error) {
    console.error('❌ Error en Facebook/Instagram Auth:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleTokenExchange(data: any, supabase: any) {
  const { shortLivedToken, userId } = data

  try {
    console.log('🔄 Intercambiando token de corta duración por token de larga duración...')

    // Intercambiar por token de larga duración
    const exchangeUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
    exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token')
    exchangeUrl.searchParams.set('client_id', Deno.env.get('FACEBOOK_APP_ID') || '')
    exchangeUrl.searchParams.set('client_secret', Deno.env.get('FACEBOOK_APP_SECRET') || '')
    exchangeUrl.searchParams.set('fb_exchange_token', shortLivedToken)

    const exchangeResponse = await fetch(exchangeUrl.toString())
    const exchangeData = await exchangeResponse.json()

    if (!exchangeResponse.ok) {
      throw new Error(`Error intercambiando token: ${exchangeData.error?.message}`)
    }

    console.log('✅ Token de larga duración obtenido')

    // Obtener información del usuario de Facebook
    const userUrl = new URL('https://graph.facebook.com/v21.0/me')
    userUrl.searchParams.set('fields', 'id,name,email,accounts{id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count}}')
    userUrl.searchParams.set('access_token', exchangeData.access_token)

    const userResponse = await fetch(userUrl.toString())
    const userData = await userResponse.json()

    if (!userResponse.ok) {
      throw new Error(`Error obteniendo datos de usuario: ${userData.error?.message}`)
    }

    console.log('📊 Datos de usuario obtenidos:', userData.name)

    // Guardar en base de datos
    const { error: dbError } = await supabase
      .from('facebook_instagram_connections')
      .upsert({
        user_id: userId,
        facebook_user_id: userData.id,
        access_token: exchangeData.access_token,
        token_type: 'long_lived',
        expires_at: new Date(Date.now() + (exchangeData.expires_in * 1000)).toISOString(),
        user_data: userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      throw new Error(`Error guardando en base de datos: ${dbError.message}`)
    }

    console.log('💾 Conexión guardada en base de datos')

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          facebook_connected: true,
          instagram_accounts: userData.accounts?.data?.filter((page: any) => page.instagram_business_account) || [],
          user_name: userData.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error en intercambio de token:', error)
    throw error
  }
}

async function getInstagramAccounts(data: any, supabase: any) {
  const { userId } = data

  try {
    // Obtener conexión existente
    const { data: connection, error } = await supabase
      .from('facebook_instagram_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !connection) {
      throw new Error('No se encontró conexión de Facebook')
    }

    const instagramAccounts = connection.user_data?.accounts?.data?.filter((page: any) => 
      page.instagram_business_account
    ).map((page: any) => ({
      page_id: page.id,
      page_name: page.name,
      instagram_account: page.instagram_business_account,
      page_access_token: page.access_token
    })) || []

    return new Response(
      JSON.stringify({
        success: true,
        data: { instagram_accounts: instagramAccounts }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error obteniendo cuentas de Instagram:', error)
    throw error
  }
}

async function connectInstagramAccount(data: any, supabase: any) {
  const { userId, pageId, instagramAccountId } = data

  try {
    // Obtener la conexión de Facebook
    const { data: connection, error } = await supabase
      .from('facebook_instagram_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !connection) {
      throw new Error('No se encontró conexión de Facebook')
    }

    // Encontrar la página específica
    const page = connection.user_data?.accounts?.data?.find((p: any) => p.id === pageId)
    if (!page) {
      throw new Error('Página no encontrada')
    }

    // Obtener métricas de la cuenta de Instagram
    const insightsUrl = new URL(`https://graph.facebook.com/v21.0/${instagramAccountId}/insights`)
    insightsUrl.searchParams.set('metric', 'follower_count,impressions,reach,profile_views')
    insightsUrl.searchParams.set('period', 'day')
    insightsUrl.searchParams.set('access_token', page.access_token)

    const insightsResponse = await fetch(insightsUrl.toString())
    const insightsData = await insightsResponse.json()

    // Guardar conexión específica de Instagram
    const { error: dbError } = await supabase
      .from('instagram_business_connections')
      .upsert({
        user_id: userId,
        facebook_page_id: pageId,
        instagram_account_id: instagramAccountId,
        page_access_token: page.access_token,
        account_data: page.instagram_business_account,
        insights_data: insightsData.data || [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      throw new Error(`Error guardando conexión de Instagram: ${dbError.message}`)
    }

    console.log('📸 Cuenta de Instagram conectada:', page.instagram_business_account.username)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          instagram_connected: true,
          account: page.instagram_business_account,
          insights: insightsData.data || []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error conectando Instagram:', error)
    throw error
  }
}

async function publishContent(data: any, supabase: any) {
  const { userId, instagramAccountId, content } = data

  try {
    // Obtener conexión de Instagram
    const { data: connection, error } = await supabase
      .from('instagram_business_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('instagram_account_id', instagramAccountId)
      .single()

    if (error || !connection) {
      throw new Error('No se encontró conexión de Instagram')
    }

    console.log('📤 Publicando contenido en Instagram...')

    // Paso 1: Crear contenedor
    const containerUrl = new URL(`https://graph.facebook.com/v21.0/${instagramAccountId}/media`)
    
    const containerData: any = {
      access_token: connection.page_access_token,
      caption: content.caption
    }

    if (content.media_type === 'IMAGE') {
      containerData.image_url = content.media_url
    } else if (content.media_type === 'VIDEO' || content.media_type === 'REELS') {
      containerData.video_url = content.media_url
      containerData.media_type = content.media_type
    }

    const containerResponse = await fetch(containerUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerData)
    })

    const containerResult = await containerResponse.json()

    if (!containerResponse.ok) {
      throw new Error(`Error creando contenedor: ${containerResult.error?.message}`)
    }

    console.log('📦 Contenedor creado:', containerResult.id)

    // Paso 2: Publicar contenido
    const publishUrl = new URL(`https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`)
    const publishResponse = await fetch(publishUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerResult.id,
        access_token: connection.page_access_token
      })
    })

    const publishResult = await publishResponse.json()

    if (!publishResponse.ok) {
      throw new Error(`Error publicando: ${publishResult.error?.message}`)
    }

    console.log('🎉 Contenido publicado exitosamente:', publishResult.id)

    // Guardar registro de publicación
    const { error: logError } = await supabase
      .from('instagram_publications')
      .insert({
        user_id: userId,
        instagram_account_id: instagramAccountId,
        media_id: publishResult.id,
        content_data: content,
        published_at: new Date().toISOString()
      })

    if (logError) {
      console.warn('⚠️ Error guardando log de publicación:', logError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          media_id: publishResult.id,
          container_id: containerResult.id,
          published: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error publicando contenido:', error)
    throw error
  }
}

async function getInsights(data: any, supabase: any) {
  const { userId, instagramAccountId, metric = 'follower_count,impressions,reach' } = data

  try {
    // Obtener conexión de Instagram
    const { data: connection, error } = await supabase
      .from('instagram_business_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('instagram_account_id', instagramAccountId)
      .single()

    if (error || !connection) {
      throw new Error('No se encontró conexión de Instagram')
    }

    // Obtener insights
    const insightsUrl = new URL(`https://graph.facebook.com/v21.0/${instagramAccountId}/insights`)
    insightsUrl.searchParams.set('metric', metric)
    insightsUrl.searchParams.set('period', 'day')
    insightsUrl.searchParams.set('access_token', connection.page_access_token)

    const insightsResponse = await fetch(insightsUrl.toString())
    const insightsData = await insightsResponse.json()

    if (!insightsResponse.ok) {
      throw new Error(`Error obteniendo insights: ${insightsData.error?.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { insights: insightsData.data || [] }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error obteniendo insights:', error)
    throw error
  }
}