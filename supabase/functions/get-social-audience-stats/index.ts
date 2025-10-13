// ⚠️ DEPRECATED: Esta función está deprecada. Usa 'analyze-social-audience' en su lugar.
// Esta función será eliminada en una versión futura.
// Usa analyze-social-audience que es más completa y maneja mejor los datos.

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

// Función para extraer username de URL
function extractUsernameFromUrl(url: string, platform: string): string | null {
  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com\/([^\/\?]+)/,
    facebook: /facebook\.com\/([^\/\?]+)/,
    twitter: /(?:twitter|x)\.com\/([^\/\?]+)/,
    tiktok: /tiktok\.com\/@([^\/\?]+)/,
    youtube: /youtube\.com\/(?:@|channel\/|user\/)([^\/\?]+)/
  }
  
  const pattern = patterns[platform.toLowerCase()]
  if (!pattern) return null
  
  const match = url.match(pattern)
  return match ? match[1] : null
}

Deno.serve(async (req) => {
  console.warn('⚠️ DEPRECATION WARNING: get-social-audience-stats is deprecated. Use analyze-social-audience instead.')
  
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

    // Leer el body para obtener social_urls
    const body = await req.json()
    const { social_urls } = body

    console.log('📨 Request received:', { 
      userId: user.id, 
      hasSocialUrls: !!social_urls,
      urlsCount: social_urls ? Object.keys(social_urls).length : 0
    })

    let accountsToProcess: Array<{platform: string, username: string}> = []

    // Opción 1: Si se enviaron URLs, procesarlas
    if (social_urls && Object.keys(social_urls).length > 0) {
      console.log('🔗 Processing from URLs:', social_urls)
      for (const [platform, url] of Object.entries(social_urls)) {
        const username = extractUsernameFromUrl(url as string, platform)
        if (username) {
          accountsToProcess.push({ platform, username })
          console.log(`✅ Extracted ${platform}: ${username}`)
        } else {
          console.log(`❌ Failed to extract username from ${platform}: ${url}`)
        }
      }
    }
    // Opción 2: Si no hay URLs, buscar en social_accounts (comportamiento original)
    else {
      console.log('🔍 No URLs provided, checking social_accounts...')
      const { data: socialAccounts, error: accountsError } = await supabase
        .from('social_accounts')
        .select('platform, platform_username')
        .eq('user_id', user.id)
        .eq('is_connected', true)

      if (accountsError) {
        console.error('❌ Error fetching social accounts:', accountsError)
        throw new Error('Failed to fetch social accounts')
      }

      if (socialAccounts && socialAccounts.length > 0) {
        accountsToProcess = socialAccounts
          .filter(acc => acc.platform_username) // Filtrar los que no tienen username
          .map(acc => ({
            platform: acc.platform,
            username: acc.platform_username
          }))
        console.log('📋 Found connected accounts:', accountsToProcess.length)
      }
    }

    // Si no hay nada que procesar
    if (accountsToProcess.length === 0) {
      console.log('⚠️ No accounts to process')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No social URLs or connected accounts found',
          message: 'Por favor agrega URLs de redes sociales o conecta cuentas',
          data: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audienceStats: AudienceStats[] = []

    // Procesar cada cuenta
    for (const account of accountsToProcess) {
      try {
        let cid = ''
        const username = account.username
        
        // Mapear plataforma a prefijo de CID según la documentación
        switch (account.platform.toLowerCase()) {
          case 'instagram':
            cid = `INST:${username}`
            break
          case 'youtube':
            cid = `YT:${username}`
            break
          case 'twitter':
            cid = `TW:${username}`
            break
          case 'tiktok':
            cid = `TT:${username}`
            break
          case 'facebook':
            cid = `FB:${username}`
            break
          default:
            console.log(`❌ Platform not supported: ${account.platform}`)
            continue
        }

        console.log(`🔍 Fetching stats for ${account.platform} with CID: ${cid}`)

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
          console.error(`❌ API error for ${account.platform}:`, response.status, response.statusText)
          const errorData: AudienceStats = {
            cid,
            socialType: account.platform.toUpperCase(),
            name: username,
            screenName: username,
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
          }
          audienceStats.push(errorData)
          
          // Guardar el error en la base de datos también
          await supabase
            .from('social_analysis')
            .upsert({
              user_id: user.id,
              platform: account.platform,
              analysis_data: errorData,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,platform'
            })
          
          continue
        }

        const data = await response.json()
        console.log(`✅ Received data for ${account.platform}:`, JSON.stringify(data, null, 2))

        const statsData: AudienceStats = {
          cid: data.cid || cid,
          socialType: data.socialType || account.platform.toUpperCase(),
          name: data.name || username,
          screenName: data.screenName || username,
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
        }

        audienceStats.push(statsData)

        // Guardar resultados en social_analysis
        console.log(`💾 Saving analysis for ${account.platform} to database...`)
        const { error: saveError } = await supabase
          .from('social_analysis')
          .upsert({
            user_id: user.id,
            platform: account.platform,
            analysis_data: statsData,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,platform'
          })

        if (saveError) {
          console.error(`❌ Error saving ${account.platform} analysis:`, saveError)
        } else {
          console.log(`✅ Saved ${account.platform} analysis to database`)
        }

      } catch (error) {
        console.error(`❌ Error processing ${account.platform}:`, error)
        const errorData: AudienceStats = {
          cid: `${account.platform.toUpperCase()}:${account.username}`,
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
        }
        audienceStats.push(errorData)

        // Guardar el error en la base de datos
        await supabase
          .from('social_analysis')
          .upsert({
            user_id: user.id,
            platform: account.platform,
            analysis_data: errorData,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,platform'
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: audienceStats,
        accounts_processed: accountsToProcess.length
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