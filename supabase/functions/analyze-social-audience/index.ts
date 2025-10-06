import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UrlAnalysisRequest {
  platform: string;
  url: string;
}

interface AudienceStats {
  socialType: string;
  name?: string;
  screenName?: string;
  description?: string;
  image?: string;
  verified?: boolean;
  usersCount?: number;
  qualityScore?: number;
  avgER?: number;
  pctUsersCount180d?: number;
  membersTypes?: any;
  categories?: string[];
  tags?: string[];
  type?: string;
  countries?: any;
  genders?: any;
  ages?: any;
  timeStatistics?: string;
  pctFakeFollowers?: number;
  membersReachability?: any;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  lastPosts?: any[];
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

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Supported platforms and validators (only those the function can analyze)
    const supportedPlatforms = ['instagram', 'youtube', 'twitter', 'tiktok', 'facebook']
    const platformValidationRules: Record<string, (url: string) => boolean> = {
      'instagram': (url: string) => url.includes('instagram.com/') && !url.includes('/p/') && !url.includes('/reel/'),
      'youtube': (url: string) => url.includes('youtube.com/') && (url.includes('/@') || url.includes('/channel/') || url.includes('/c/')),
      'twitter': (url: string) => url.includes('twitter.com/') || url.includes('x.com/'),
      'tiktok': (url: string) => url.includes('tiktok.com/@'),
      'facebook': (url: string) => url.includes('facebook.com/') && !url.includes('/groups/') && !url.includes('/profile.php')
    }

    // Helper to derive a company username for storage if missing
    const deriveCompanyUsername = async (): Promise<string> => {
      try {
        // Try to reuse any existing company_username for this user
        const { data: existing } = await supabase
          .from('social_accounts')
          .select('company_username')
          .eq('user_id', user.id)
          .not('company_username', 'is', null)
          .limit(1)
          .maybeSingle()

        if (existing?.company_username) {
          console.log(`Reusing existing company_username: ${existing.company_username}`)
          return existing.company_username as string
        }

        // Fallback: try primary company name and slugify
        const { data: membership } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .maybeSingle()

        if (membership?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', membership.company_id)
            .maybeSingle()
          const base = (company?.name || 'company')
            .normalize('NFD').replace(/\p{Diacritic}/gu, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
          const derivedUsername = `${base}_${user.id.substring(0,8)}`
          console.log(`Derived company_username from company: ${derivedUsername}`)
          return derivedUsername
        }

        // Final fallback: user-based slug
        const fallbackUsername = `user_${user.id.substring(0,8)}`
        console.log(`Using fallback company_username: ${fallbackUsername}`)
        return fallbackUsername
      } catch (error) {
        console.error('Error deriving company_username:', error)
        // Emergency fallback
        return `user_${user.id.substring(0,8)}`
      }
    }

    const { urls }: { urls: UrlAnalysisRequest[] } = await req.json()

    // If no URLs provided, return supported platforms so UI can adapt gracefully
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [], supportedPlatforms }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log(`Analyzing ${urls.length} social media URLs for user ${user.id}`)

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY')
    if (!rapidApiKey) {
      throw new Error('RapidAPI key not configured')
    }

    const results: AudienceStats[] = []

    for (const urlData of urls) {
      try {
        const platform = urlData.platform.toLowerCase()
        console.log(`Starting analysis for ${platform}: ${urlData.url}`)
        
        // Validate platform is supported
        if (!supportedPlatforms.includes(platform)) {
          console.log(`Platform ${platform} not supported, skipping`)
          continue
        }

        // Validate URL format for the platform
        const validator = platformValidationRules[platform as keyof typeof platformValidationRules]
        if (validator && !validator(urlData.url)) {
          console.log(`Invalid URL format for ${platform}: ${urlData.url}, skipping`)
          continue
        }

        // Map platform to social type
        const socialTypeMap: { [key: string]: string } = {
          'instagram': 'INST',
          'facebook': 'FB',
          'twitter': 'TW',
          'tiktok': 'TT',
          'youtube': 'YT'
        }

        const socialType = socialTypeMap[platform]

        // Call Community endpoint as shown in curl example
        console.log(`Making Community API call for: ${urlData.url}`)

        const response = await fetch(`https://instagram-statistics-api.p.rapidapi.com/community?url=${encodeURIComponent(urlData.url)}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'instagram-statistics-api.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey
          }
        })

        if (!response.ok) {
          console.error(`API error for ${platform}: ${response.status} ${response.statusText}`)
          continue
        }

        const apiData = await response.json()
        console.log(`Successfully received data for ${platform}:`, JSON.stringify(apiData, null, 2))

        // Check if response has the expected structure
        if (!apiData.data || apiData.meta?.code !== 200) {
          console.error(`Invalid API response format for ${platform}:`, apiData)
          continue
        }

        const profileData = apiData.data

        // Transform API response to our format using the actual data structure
        const audienceStats: AudienceStats = {
          socialType: socialType,
          name: profileData.name || 'Perfil',
          screenName: profileData.screenName || '',
          description: profileData.description || '',
          image: profileData.image || '',
          verified: profileData.verified || false,
          usersCount: profileData.usersCount || 0,
          qualityScore: profileData.qualityScore || 0,
          avgER: profileData.avgER || 0,
          pctUsersCount180d: 0, // Not provided in API response
          membersTypes: profileData.membersTypes || {},
          categories: profileData.categories || [],
          tags: profileData.tags || [],
          type: profileData.type || 'profile',
          countries: profileData.countries || [],
          genders: profileData.genders || [],
          ages: profileData.ages || [],
          timeStatistics: profileData.timeStatistics || new Date().toISOString(),
          pctFakeFollowers: profileData.pctFakeFollowers || 0,
          membersReachability: profileData.membersReachability || {},
          avgLikes: 0, // Calculate from lastPosts if needed
          avgComments: 0, // Calculate from lastPosts if needed
          avgViews: profileData.avgViews || 0,
          lastPosts: profileData.lastPosts || []
        }

        // Store raw data and processed data in social_accounts table
        try {
          // Ensure we have a non-null company_username to satisfy DB constraint
          const companyUsername = await deriveCompanyUsername()
          console.log(`Storing data for platform ${platform} with company_username: ${companyUsername}`)

          const socialAccountData = {
            user_id: user.id,
            company_username: companyUsername,
            platform: platform,
            platform_username: audienceStats.screenName || null,
            platform_display_name: audienceStats.name || 'Perfil',
            is_connected: true,
            metadata: {
              raw_analysis_data: apiData,
              processed_stats: audienceStats,
              analysis_timestamp: new Date().toISOString(),
              api_source: 'instagram-statistics-api',
              api_response_meta: apiData.meta
            },
            last_sync_at: new Date().toISOString(),
            connected_at: new Date().toISOString()
          }

          console.log(`Attempting to upsert social account data:`, {
            user_id: socialAccountData.user_id,
            platform: socialAccountData.platform,
            company_username: socialAccountData.company_username
          })

          const { error: dbError } = await supabase
            .from('social_accounts')
            .upsert(socialAccountData, {
              onConflict: 'user_id,platform'
            })

          if (dbError) {
            console.error('Error storing social account data:', JSON.stringify(dbError, null, 2))
          } else {
            console.log(`Successfully stored ${platform} data to social_accounts table`)
          }
        } catch (dbError) {
          console.error('Database storage error:', JSON.stringify(dbError, null, 2))
        }

        // Store detailed analysis data in social_analysis table
        try {
          console.log(`Storing detailed analysis data for platform ${platform}`)

          const analysisData = {
            user_id: user.id,
            cid: profileData.cid || null,
            social_type: profileData.socialType || socialType,
            group_id: profileData.groupID || null,
            url: urlData.url,
            name: profileData.name || null,
            image: profileData.image || null,
            description: profileData.description || null,
            screen_name: profileData.screenName || null,
            users_count: profileData.usersCount || 0,
            community_status: profileData.communityStatus || null,
            is_blocked: profileData.isBlocked || false,
            is_closed: profileData.isClosed || false,
            verified: profileData.verified || false,
            tags: profileData.tags || [],
            suggested_tags: profileData.suggestedTags || [],
            rating_tags: profileData.ratingTags || [],
            categories: profileData.categories || [],
            avg_er: profileData.avgER || 0,
            avg_interactions: profileData.avgInteractions || 0,
            avg_views: profileData.avgViews || 0,
            rating_index: profileData.ratingIndex || 0,
            quality_score: profileData.qualityScore || 0,
            time_statistics: profileData.timeStatistics && profileData.timeStatistics !== '1970-01-01T00:00:00.000Z' ? new Date(profileData.timeStatistics).toISOString() : null,
            time_posts_loaded: profileData.timePostsLoaded && profileData.timePostsLoaded !== '1970-01-01T00:00:00.000Z' ? new Date(profileData.timePostsLoaded).toISOString() : null,
            time_short_loop: profileData.timeShortLoop && profileData.timeShortLoop !== '1970-01-01T00:00:00.000Z' ? new Date(profileData.timeShortLoop).toISOString() : null,
            start_date: profileData.startDate && profileData.startDate !== '1970-01-01T00:00:00.000Z' ? new Date(profileData.startDate).toISOString() : null,
            members_cities: profileData.membersCities || [],
            members_countries: profileData.membersCountries || [],
            members_genders_ages: profileData.membersGendersAges || {},
            country: profileData.country || null,
            country_code: profileData.countryCode || null,
            city: profileData.city || null,
            profile_type: profileData.type || null,
            gender: profileData.gender || null,
            age: profileData.age || null,
            last_posts: profileData.lastPosts || [],
            last_from_mentions: profileData.lastFromMentions || [],
            similar_profiles: profileData.similar || [],
            members_types: profileData.membersTypes || [],
            members_reachability: profileData.membersReachability || [],
            countries: profileData.countries || [],
            cities: profileData.cities || [],
            genders: profileData.genders || [],
            ages: profileData.ages || [],
            interests: profileData.interests || [],
            brand_safety: profileData.brandSafety || {},
            pct_fake_followers: profileData.pctFakeFollowers || 0,
            audience_severity: profileData.audienceSeverity || 0,
            contact_email: profileData.contactEmail || null, // Instagram specific
            raw_api_response: apiData
          }

          const { error: analysisError } = await supabase
            .from('social_analysis')
            .upsert(analysisData, {
              onConflict: 'user_id,social_type'
            })

          if (analysisError) {
            console.error('Error storing social analysis data:', JSON.stringify(analysisError, null, 2))
          } else {
            console.log(`Successfully stored detailed analysis data for ${platform}`)
          }
        } catch (analysisError) {
          console.error('Social analysis storage error:', JSON.stringify(analysisError, null, 2))
        }

        results.push(audienceStats)

      } catch (error) {
        console.error(`Error analyzing ${urlData.platform} (${urlData.url}):`, error)
        // Continue processing other URLs even if one fails
        continue
      }
    }

    console.log(`Analysis completed. Successfully analyzed ${results.length} out of ${urls.length} URLs`)
    
    // If no results were obtained, provide helpful feedback
    if (results.length === 0 && urls.length > 0) {
      console.warn('No profiles could be analyzed successfully')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        supportedPlatforms,
        message: results.length > 0 
          ? `Successfully analyzed ${results.length} social media profiles`
          : urls.length > 0 
            ? 'No profiles could be analyzed at this time. Please check your URLs and try again.'
            : 'No URLs provided for analysis'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in analyze-social-audience function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        data: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})