import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY')

interface SocialAccount {
  id: string
  platform: string
  username: string
  platform_user_id: string
  is_connected: boolean
}

interface AudienceStats {
  cid: string
  socialType: string
  name: string
  screenName: string
  usersCount: number
  avgER: number
  avgInteractions: number
  qualityScore: number
  verified: boolean
  countries: Array<{ name: string; percent: number }>
  cities: Array<{ name: string; percent: number }>
  genders: Array<{ name: string; percent: number }>
  ages: Array<{ name: string; percent: number }>
  lastPosts: Array<any>
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { data: socialAccounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_connected', true)

    if (accountsError) {
      console.error('Error fetching social accounts:', accountsError)
      throw new Error('Failed to fetch social accounts')
    }

    if (!socialAccounts || socialAccounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [], 
          message: 'No connected social accounts found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audienceStats: AudienceStats[] = []

    // Procesar cada cuenta social conectada
    for (const account of socialAccounts) {
      try {
        let cid = ''
        
        // Mapear plataforma a prefijo de CID según la documentación
        switch (account.platform.toLowerCase()) {
          case 'instagram':
            cid = `INST:${account.platform_user_id}`
            break
          case 'youtube':
            cid = `YT:${account.platform_user_id}`
            break
          case 'twitter':
            cid = `TW:${account.platform_user_id}`
            break
          case 'tiktok':
            cid = `TT:${account.platform_user_id}`
            break
          case 'facebook':
            cid = `FB:${account.platform_user_id}`
            break
          default:
            console.log(`Platform not supported: ${account.platform}`)
            continue
        }

        console.log(`Fetching stats for ${account.platform} with CID: ${cid}`)

        const response = await fetch(
          `https://instagram-statistics-api.p.rapidapi.com/community?cid=${encodeURIComponent(cid)}`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Host': 'instagram-statistics-api.p.rapidapi.com',
              'X-RapidAPI-Key': RAPIDAPI_KEY!
            }
          }
        )

        if (!response.ok) {
          console.error(`API error for ${account.platform}:`, response.status, response.statusText)
          audienceStats.push({
            cid,
            socialType: account.platform.toUpperCase(),
            name: account.username,
            screenName: account.username,
            usersCount: 0,
            avgER: 0,
            avgInteractions: 0,
            qualityScore: 0,
            verified: false,
            countries: [],
            cities: [],
            genders: [],
            ages: [],
            lastPosts: [],
            error: `API Error: ${response.status}`
          })
          continue
        }

        const data = await response.json()
        console.log(`Received data for ${account.platform}:`, JSON.stringify(data, null, 2))

        audienceStats.push({
          cid: data.cid || cid,
          socialType: data.socialType || account.platform.toUpperCase(),
          name: data.name || account.username,
          screenName: data.screenName || account.username,
          usersCount: data.usersCount || 0,
          avgER: data.avgER || 0,
          avgInteractions: data.avgInteractions || 0,
          qualityScore: data.qualityScore || 0,
          verified: data.verified || false,
          countries: data.countries || [],
          cities: data.cities || [],
          genders: data.genders || [],
          ages: data.ages || [],
          lastPosts: data.lastPosts || []
        })

      } catch (error) {
        console.error(`Error processing ${account.platform}:`, error)
        audienceStats.push({
          cid: `${account.platform.toUpperCase()}:${account.platform_user_id}`,
          socialType: account.platform.toUpperCase(),
          name: account.username,
          screenName: account.username,
          usersCount: 0,
          avgER: 0,
          avgInteractions: 0,
          qualityScore: 0,
          verified: false,
          countries: [],
          cities: [],
          genders: [],
          ages: [],
          lastPosts: [],
          error: (error as Error).message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: audienceStats,
        accounts_processed: socialAccounts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-social-audience-stats:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})