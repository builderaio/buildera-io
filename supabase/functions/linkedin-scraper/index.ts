import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RAPIDAPI_KEY = '6ea24b8796msh5fbfd28825402cap1fa874jsn29c9f9708650'
const RAPIDAPI_HOST = 'linkedin-scraper-api-real-time-fast-affordable.p.rapidapi.com'

serve(async (req) => {
  console.log('🔍 LinkedIn Scraper request received')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body = await req.json()
    const { action, company_identifier } = body

    console.log(`📋 Action: ${action}, Company identifier: ${company_identifier}`)

    if (!company_identifier) {
      throw new Error('Company identifier is required')
    }

    let apiUrl = ''
    let result = null

    switch (action) {
      case 'get_company_details':
        // GET company details
        apiUrl = `https://${RAPIDAPI_HOST}/companies/detail?identifier=${encodeURIComponent(company_identifier)}`
        
        console.log(`🌐 Fetching company details from: ${apiUrl}`)
        
        const detailsResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': RAPIDAPI_KEY
          }
        })

        if (!detailsResponse.ok) {
          throw new Error(`LinkedIn API error: ${detailsResponse.status} ${detailsResponse.statusText}`)
        }

        result = await detailsResponse.json()
        console.log('✅ Company details fetched successfully')
        break

      case 'get_company_posts':
        // GET company posts
        apiUrl = `https://${RAPIDAPI_HOST}/company/posts?company_name=${encodeURIComponent(company_identifier)}`
        
        console.log(`🌐 Fetching company posts from: ${apiUrl}`)
        
        const postsResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': RAPIDAPI_HOST,
            'x-rapidapi-key': RAPIDAPI_KEY
          }
        })

        if (!postsResponse.ok) {
          throw new Error(`LinkedIn API error: ${postsResponse.status} ${postsResponse.statusText}`)
        }

        result = await postsResponse.json()
        console.log('✅ Company posts fetched successfully')
        
        // Guardar posts en la tabla linkedin_posts
        if (result?.posts && Array.isArray(result.posts)) {
          const postsToSave = result.posts.slice(0, 20).map((post: any) => ({
            user_id: user.id,
            post_id: post.id || post.postId || `linkedin_${Date.now()}_${Math.random()}`,
            post_type: post.type || 'unknown',
            content: post.text || post.content || '',
            likes_count: post.reactions_count || post.stats?.total_reactions || 0,
            comments_count: post.comments_count || post.stats?.comments || 0,
            shares_count: post.shares_count || post.stats?.shares || 0,
            views_count: post.views_count || post.stats?.views || 0,
            posted_at: post.posted_at || post.createdAt || new Date().toISOString(),
            raw_data: post
          }))
          
          if (postsToSave.length > 0) {
            const { error: saveError } = await supabase
              .from('linkedin_posts')
              .upsert(postsToSave, { onConflict: 'user_id,post_id' })
            
            if (saveError) {
              console.error('❌ Error saving LinkedIn posts:', saveError)
            } else {
              console.log(`✅ Saved ${postsToSave.length} LinkedIn posts to database`)
            }
          }
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        company_identifier,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('❌ LinkedIn Scraper error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})