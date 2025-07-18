import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TikTokTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  open_id: string
}

interface TikTokUserInfo {
  open_id: string
  username: string
  display_name: string
  avatar_url: string
}

interface PublishVideoRequest {
  videoUrl: string
  title: string
  description?: string
  privacy_level?: 'PUBLIC_TO_EVERYONE' | 'FRIENDS_ONLY' | 'SELF_ONLY'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' },
      },
    }
  )

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser()

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { action, ...data } = await req.json()

    switch (action) {
      case 'exchange_code':
        return await exchangeCodeForToken(data.code, user.id, supabaseClient)
      
      case 'get_user_info':
        return await getUserInfo(user.id, supabaseClient)
      
      case 'publish_video':
        return await publishVideo(data as PublishVideoRequest, user.id, supabaseClient)
      
      case 'get_video_list':
        return await getVideoList(user.id, supabaseClient)
      
      case 'disconnect':
        return await disconnectTikTok(user.id, supabaseClient)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('TikTok Auth Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function exchangeCodeForToken(code: string, userId: string, supabaseClient: any) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  
  if (!clientKey || !clientSecret) {
    throw new Error('TikTok credentials not configured')
  }

  // Exchange authorization code for access token
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-auth`,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('TikTok token exchange failed:', errorText)
    throw new Error('Failed to exchange code for token')
  }

  const tokenData: TikTokTokenResponse = await tokenResponse.json()

  // Get user info
  const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: ['open_id', 'username', 'display_name', 'avatar_url']
    }),
  })

  const userInfoData = await userInfoResponse.json()
  
  // Store connection in database
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
  
  const { error } = await supabaseClient
    .from('tiktok_connections')
    .upsert({
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      scope: tokenData.scope,
      expires_at: expiresAt.toISOString(),
      tiktok_user_id: tokenData.open_id,
      user_data: userInfoData.data || {},
    })

  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to store TikTok connection')
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      user_info: userInfoData.data 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserInfo(userId: string, supabaseClient: any) {
  const { data: connection, error } = await supabaseClient
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !connection) {
    return new Response(
      JSON.stringify({ error: 'No TikTok connection found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      connected: true,
      user_data: connection.user_data,
      tiktok_user_id: connection.tiktok_user_id 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function publishVideo(request: PublishVideoRequest, userId: string, supabaseClient: any) {
  const { data: connection, error } = await supabaseClient
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !connection) {
    throw new Error('No TikTok connection found')
  }

  // Step 1: Initialize video upload
  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: request.title,
        description: request.description || '',
        privacy_level: request.privacy_level || 'PUBLIC_TO_EVERYONE',
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: 0, // Will be determined by TikTok
      },
    }),
  })

  if (!initResponse.ok) {
    const errorData = await initResponse.json()
    console.error('TikTok video init failed:', errorData)
    throw new Error('Failed to initialize video upload')
  }

  const initData = await initResponse.json()
  const publishId = initData.data.publish_id
  const uploadUrl = initData.data.upload_url

  // Step 2: Upload video file
  const videoResponse = await fetch(request.videoUrl)
  const videoBlob = await videoResponse.blob()

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: videoBlob,
    headers: {
      'Content-Type': 'video/mp4',
    },
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload video to TikTok')
  }

  // Step 3: Confirm upload and publish
  const confirmResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  })

  const confirmData = await confirmResponse.json()

  // Store publication record
  if (confirmData.data.status === 'PROCESSING_UPLOAD' || confirmData.data.status === 'PUBLISHED') {
    await supabaseClient
      .from('tiktok_publications')
      .insert({
        user_id: userId,
        tiktok_user_id: connection.tiktok_user_id,
        video_id: confirmData.data.video_id || publishId,
        content_data: {
          title: request.title,
          description: request.description,
          privacy_level: request.privacy_level,
          publish_id: publishId,
          status: confirmData.data.status,
        },
      })
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      publish_id: publishId,
      status: confirmData.data.status,
      video_id: confirmData.data.video_id 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getVideoList(userId: string, supabaseClient: any) {
  const { data: connection, error } = await supabaseClient
    .from('tiktok_connections')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !connection) {
    throw new Error('No TikTok connection found')
  }

  // Get video list from TikTok API
  const response = await fetch('https://open.tiktokapis.com/v2/video/list/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: ['id', 'title', 'video_description', 'create_time', 'cover_image_url', 'share_url', 'view_count', 'like_count', 'comment_count', 'share_count'],
      max_count: 20,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error('TikTok video list failed:', errorData)
    throw new Error('Failed to fetch video list')
  }

  const data = await response.json()

  return new Response(
    JSON.stringify({ 
      success: true, 
      videos: data.data.videos || [] 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function disconnectTikTok(userId: string, supabaseClient: any) {
  const { error } = await supabaseClient
    .from('tiktok_connections')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw new Error('Failed to disconnect TikTok')
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}