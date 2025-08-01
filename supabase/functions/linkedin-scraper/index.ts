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
        
        // Guardar posts en la base de datos
        console.log('🔍 Full LinkedIn API result:', JSON.stringify(result, null, 2));
        
        // Verificar diferentes estructuras de respuesta de la API
        let posts = [];
        if (result && result.data && result.data.posts) {
          posts = result.data.posts;
          console.log(`📋 Found posts in result.data.posts: ${posts.length}`);
        } else if (result && result.posts) {
          posts = result.posts;
          console.log(`📋 Found posts in result.posts: ${posts.length}`);
        } else if (result && Array.isArray(result)) {
          posts = result;
          console.log(`📋 Found posts as array: ${posts.length}`);
        } else if (result && result.data && Array.isArray(result.data)) {
          posts = result.data;
          console.log(`📋 Found posts in result.data array: ${posts.length}`);
        }
        
        if (posts && posts.length > 0) {
          console.log(`🔍 Processing ${posts.length} LinkedIn posts for user ${user.id}`);
          
          const postsToInsert = posts.map((post, index) => {
            // Intentar múltiples campos para el ID del post
            const postId = post.post_id || post.activity_id || post.id || post.activity_urn || post.full_urn || `li_${company_identifier}_${index}`;
            
            // Intentar múltiples campos para el contenido
            const content = post.text || post.description || post.commentary || post.content || '';
            
            // Intentar múltiples campos para la fecha
            let postedAt = null;
            if (post.posted_at && post.posted_at.timestamp) {
              postedAt = new Date(post.posted_at.timestamp).toISOString();
            } else if (post.posted_date) {
              postedAt = new Date(post.posted_date).toISOString();
            } else if (post.time) {
              postedAt = new Date(post.time).toISOString();
            } else if (post.created_at) {
              postedAt = new Date(post.created_at).toISOString();
            }
            
            // Intentar múltiples campos para métricas
            const likesCount = parseInt(post.stats?.total_reactions || post.reactions?.like_count || post.likes_count || post.likes || 0);
            const commentsCount = parseInt(post.stats?.comments || post.comments_count || post.comments || 0);
            const sharesCount = parseInt(post.stats?.reposts || post.reposts_count || post.shares_count || post.shares || 0);
            const viewsCount = parseInt(post.stats?.views || post.views_count || post.views || 0);
            
            console.log('📝 Processing LinkedIn post:', { 
              postId, 
              hasContent: !!content, 
              postedAt,
              likesCount,
              commentsCount,
              sharesCount,
              viewsCount,
              postKeys: Object.keys(post)
            });
            
            return {
              user_id: user.id,
              post_id: postId,
              content: content,
              likes_count: likesCount,
              comments_count: commentsCount,
              shares_count: sharesCount,
              views_count: viewsCount,
              post_type: post.post_type || post.type || 'post',
              posted_at: postedAt,
              raw_data: post,
              engagement_rate: 0
            };
          });

          console.log(`💾 Attempting to insert ${postsToInsert.length} LinkedIn posts`);
          
          // Insertar posts uno por uno para ver errores específicos
          let insertedCount = 0;
          for (const postData of postsToInsert) {
            try {
              const { data, error } = await supabase.from('linkedin_posts').upsert(postData, {
                onConflict: 'user_id,post_id'
              });
              
              if (error) {
                console.error('❌ Error inserting LinkedIn post:', error, 'Post data:', postData);
              } else {
                insertedCount++;
                console.log(`✅ Inserted LinkedIn post: ${postData.post_id}`);
              }
            } catch (error) {
              console.error('❌ Exception inserting LinkedIn post:', error, 'Post data:', postData);
            }
          }

          console.log(`💾 Successfully inserted ${insertedCount}/${postsToInsert.length} LinkedIn posts into database`);
        } else {
          console.log('⚠️ No posts found in LinkedIn result');
          console.log('🔍 Available result keys:', result ? Object.keys(result) : 'No result');
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