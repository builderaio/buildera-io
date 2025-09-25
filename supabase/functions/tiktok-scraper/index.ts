import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TikTokUserInfo {
  user_id: string
  unique_id: string
  nickname: string
  follower_count: number
  following_count: number
  video_count: number
  heart_count: number
  signature: string
  avatar_thumb?: string
  verified?: boolean
}

interface TikTokFollower {
  user_id: string
  unique_id: string
  nickname: string
  follower_count: number
  avatar_thumb?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 TikTok Scraper request received')

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured')
    }

    // Get user from request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        }
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { action, unique_id, user_id } = await req.json()

    switch (action) {
      case 'get_user_info':
        return await getUserInfo(unique_id, user.id, supabaseClient, rapidApiKey)
      case 'get_user_details':
        return await getUserInfo(unique_id, user.id, supabaseClient, rapidApiKey)
      case 'get_followers':
        return await getFollowers(user_id, user.id, supabaseClient, rapidApiKey)
      case 'get_following':
        return await getFollowing(user_id, user.id, supabaseClient, rapidApiKey)
      case 'get_posts':
        return await getPostsByUsername(unique_id, user.id, supabaseClient, rapidApiKey)
      case 'get_complete_analysis':
        return await getCompleteAnalysis(unique_id, user.id, supabaseClient, rapidApiKey)
      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('TikTok Scraper Error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

async function getUserInfo(uniqueId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`📊 Getting TikTok user info for: ${uniqueId}`)
  
  const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${encodeURIComponent(uniqueId)}`, {
    headers: {
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('TikTok API error:', errorText)
    throw new Error(`TikTok API error: ${response.status}`)
  }

  const apiResponse = await response.json()
  console.log('TikTok API Response:', JSON.stringify(apiResponse, null, 2))
  
  // Verificar que la respuesta sea exitosa
  if (apiResponse.code !== 0) {
    throw new Error(`TikTok API error: ${apiResponse.msg}`)
  }

  const userData = apiResponse.data?.user
  const statsData = apiResponse.data?.stats
  
  if (!userData) {
    throw new Error('No user data found in TikTok API response')
  }

  // Guardar información básica del usuario con la estructura correcta
  const userInfo: TikTokUserInfo = {
    user_id: userData.id,
    unique_id: userData.uniqueId,
    nickname: userData.nickname,
    follower_count: statsData?.followerCount || 0,
    following_count: statsData?.followingCount || 0,
    video_count: statsData?.videoCount || 0,
    heart_count: statsData?.heartCount || statsData?.heart || 0,
    signature: userData.signature || '',
    avatar_thumb: userData.avatarThumb,
    verified: userData.verified || false
  }

  // Guardar en la base de datos
  await supabase.from('tiktok_user_data').upsert({
    user_id: userId,
    tiktok_user_id: userInfo.user_id,
    unique_id: userInfo.unique_id,
    nickname: userInfo.nickname,
    follower_count: userInfo.follower_count,
    following_count: userInfo.following_count,
    video_count: userInfo.video_count,
    heart_count: userInfo.heart_count,
    signature: userInfo.signature,
    avatar_url: userInfo.avatar_thumb,
    is_verified: userInfo.verified,
    raw_data: apiResponse,
    updated_at: new Date().toISOString()
  })

  console.log(`✅ User info saved for ${userInfo.nickname}`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: userInfo,
      user_id: userInfo.user_id 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getFollowers(tikTokUserId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`👥 Getting followers for TikTok user: ${tikTokUserId}`)
  
  const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/followers?user_id=${tikTokUserId}`, {
    headers: {
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('TikTok Followers API error:', errorText)
    throw new Error(`TikTok Followers API error: ${response.status}`)
  }

  const apiResponse = await response.json()
  console.log('TikTok Followers API Response:', JSON.stringify(apiResponse, null, 2))
  
  // Verificar que la respuesta sea exitosa
  if (apiResponse.code !== 0) {
    throw new Error(`TikTok Followers API error: ${apiResponse.msg}`)
  }

  const followers = apiResponse.data?.followers || []

  // Guardar muestra de seguidores con la estructura correcta
  const followersToSave = followers.slice(0, 50).map((follower: any) => ({
    user_id: userId,
    tiktok_user_id: tikTokUserId,
    follower_user_id: follower.id,
    follower_unique_id: follower.unique_id,
    follower_nickname: follower.nickname,
    follower_count: follower.follower_count || 0,
    avatar_url: follower.avatar,
    raw_data: follower
  }))

  if (followersToSave.length > 0) {
    await supabase.from('tiktok_followers').upsert(followersToSave)
  }

  console.log(`✅ Saved ${followersToSave.length} followers`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: followers,
      saved_count: followersToSave.length,
      total_count: followers.length 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getFollowing(tikTokUserId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`🔗 Getting following for TikTok user: ${tikTokUserId}`)
  
  const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/following?user_id=${tikTokUserId}`, {
    headers: {
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('TikTok Following API error:', errorText)
    throw new Error(`TikTok Following API error: ${response.status}`)
  }

  const apiResponse = await response.json()
  console.log('TikTok Following API Response:', JSON.stringify(apiResponse, null, 2))
  
  // Verificar que la respuesta sea exitosa
  if (apiResponse.code !== 0) {
    throw new Error(`TikTok Following API error: ${apiResponse.msg}`)
  }

  // Usar la estructura correcta para followings
  const following = apiResponse.data?.followings || []

  // Guardar muestra de seguidos con la estructura correcta
  const followingToSave = following.slice(0, 50).map((followedUser: any) => ({
    user_id: userId,
    tiktok_user_id: tikTokUserId,
    following_user_id: followedUser.id,
    following_unique_id: followedUser.unique_id,
    following_nickname: followedUser.nickname,
    follower_count: followedUser.follower_count || 0,
    avatar_url: followedUser.avatar,
    raw_data: followedUser
  }))

  if (followingToSave.length > 0) {
    await supabase.from('tiktok_following').upsert(followingToSave)
  }

  console.log(`✅ Saved ${followingToSave.length} following`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: following,
      saved_count: followingToSave.length,
      total_count: following.length 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPosts(tikTokUserId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`📹 Getting posts for TikTok user: ${tikTokUserId}`)
  
  const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/posts?user_id=${tikTokUserId}&count=30`, {
    headers: {
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('TikTok Posts API error:', errorText)
    throw new Error(`TikTok Posts API error: ${response.status}`)
  }

  const apiResponse = await response.json()
  console.log('TikTok Posts API Response:', JSON.stringify(apiResponse, null, 2))
  
  // Verificar que la respuesta sea exitosa
  if (apiResponse.code !== 0) {
    throw new Error(`TikTok Posts API error: ${apiResponse.msg}`)
  }

  const videos = apiResponse.data?.videos || []

  // Guardar posts con la estructura correcta
  const postsToSave = videos.map((video: any) => ({
    user_id: userId,
    tiktok_user_id: tikTokUserId,
    video_id: video.video_id,
    aweme_id: video.aweme_id,
    title: video.title || '',
    cover_url: video.cover,
    duration: video.duration || 0,
    play_count: video.play_count || 0,
    digg_count: video.digg_count || 0,
    comment_count: video.comment_count || 0,
    share_count: video.share_count || 0,
    download_count: video.download_count || 0,
    collect_count: video.collect_count || 0,
    create_time: video.create_time,
    posted_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
    is_ad: video.is_ad || false,
    raw_data: video
  }))

  if (postsToSave.length > 0) {
    await supabase.from('tiktok_posts').upsert(postsToSave)
  }

  console.log(`✅ Saved ${postsToSave.length} posts`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: videos,
      saved_count: postsToSave.length,
      total_count: videos.length 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getCompleteAnalysis(uniqueId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`🔍 Starting complete TikTok analysis for: ${uniqueId}`)
  
  // 1. Obtener información del usuario
  const userInfoResponse = await getUserInfo(uniqueId, userId, supabase, rapidApiKey)
  const userInfoData = await userInfoResponse.json()
  
  if (!userInfoData.success) {
    throw new Error('Failed to get user info')
  }

  const tikTokUserId = userInfoData.user_id

  // 2. Obtener seguidores y seguidos en paralelo
  const [followersResponse, followingResponse] = await Promise.all([
    getFollowers(tikTokUserId, userId, supabase, rapidApiKey),
    getFollowing(tikTokUserId, userId, supabase, rapidApiKey)
  ])

  const followersData = await followersResponse.json()
  const followingData = await followingResponse.json()

  console.log(`✅ Complete analysis completed for ${userInfoData.data.nickname}`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      user_info: userInfoData.data,
      followers: {
        count: followersData.total_count,
        sample: followersData.data.slice(0, 10)
      },
      following: {
        count: followingData.total_count,
        sample: followingData.data.slice(0, 10)
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPostsByUsername(uniqueId: string, userId: string, supabase: any, rapidApiKey: string) {
  console.log(`📹 Getting posts for TikTok unique_id: ${uniqueId}`)
  
  // Usar la API directamente con unique_id y count=30
  const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/posts?unique_id=${encodeURIComponent(uniqueId)}&count=30`, {
    headers: {
      'x-rapidapi-host': 'tiktok-scraper7.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('TikTok Posts API error:', errorText)
    throw new Error(`TikTok Posts API error: ${response.status}`)
  }

  const apiResponse = await response.json()
  console.log('TikTok Posts API Response:', JSON.stringify(apiResponse, null, 2))
  
  // Verificar que la respuesta sea exitosa
  if (apiResponse.code !== 0) {
    throw new Error(`TikTok Posts API error: ${apiResponse.msg}`)
  }

  const videos = apiResponse.data?.videos || []

  // Obtener el user_id de TikTok desde la respuesta
  const tikTokUserId = videos.length > 0 ? videos[0].author?.id || 'unknown' : 'unknown'

  // Guardar posts con la estructura correcta
  const postsToSave = videos.map((video: any) => ({
    user_id: userId,
    tiktok_user_id: tikTokUserId,
    video_id: video.video_id,
    aweme_id: video.aweme_id,
    title: video.title || '',
    cover_url: video.cover,
    duration: video.duration || 0,
    play_count: video.play_count || 0,
    digg_count: video.digg_count || 0,
    comment_count: video.comment_count || 0,
    share_count: video.share_count || 0,
    download_count: video.download_count || 0,
    collect_count: video.collect_count || 0,
    create_time: video.create_time,
    posted_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
    is_ad: video.is_ad || false,
    raw_data: video
  }))

  if (postsToSave.length > 0) {
    await supabase.from('tiktok_posts').upsert(postsToSave)
  }

  console.log(`✅ Saved ${postsToSave.length} posts`)

  return new Response(
    JSON.stringify({ 
      success: true, 
      data: apiResponse.data, // Devolver toda la data original que incluye videos
      saved_count: postsToSave.length,
      total_count: videos.length 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}