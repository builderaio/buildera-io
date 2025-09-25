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

        // Actualizar posts existentes con información del perfil LinkedIn
        if (result && result.data) {
          console.log(`💾 Updating LinkedIn posts with profile data for user ${user.id}`)
          
          const companyData = result.data;
          
          const { error: updateError } = await supabase.from('linkedin_posts')
            .update({
              profile_name: companyData.name,
              profile_headline: companyData.tagline,
              profile_followers_count: companyData.follower_count || 0,
              profile_industry: companyData.industry,
              profile_location: companyData.location,
              profile_url: companyData.company_url || `https://linkedin.com/company/${company_identifier}`
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('❌ Error updating LinkedIn posts with profile data:', updateError);
          } else {
            console.log('✅ LinkedIn posts updated with profile data successfully');
          }
        }
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
        
        // Verificar diferentes estructuras de respuesta de la API específica de LinkedIn que estamos usando
        let posts = [];
        
        // La API linkedin-scraper-api-real-time-fast-affordable devuelve la estructura: result.data.data.posts
        if (result && result.data && result.data.data && result.data.data.posts) {
          posts = result.data.data.posts;
          console.log(`📋 Found posts in result.data.data.posts: ${posts.length}`);
        } else if (result && result.data && result.data.posts) {
          posts = result.data.posts;
          console.log(`📋 Found posts in result.data.posts: ${posts.length}`);
        } else if (result && result.posts) {
          posts = result.posts;
          console.log(`📋 Found posts in result.posts: ${posts.length}`);
        } else if (result && Array.isArray(result)) {
          posts = result;
          console.log(`📋 Found posts as direct array: ${posts.length}`);
        }
        
        console.log('🔍 Posts structure sample:', posts.length > 0 ? posts[0] : 'No posts');
        
        if (posts && posts.length > 0) {
          console.log(`🔍 Processing ${posts.length} LinkedIn posts for user ${user.id}`);
          
          const postsToInsert = posts.map((post: any, index: number) => {
            // La API devuelve posts con activity_urn, full_urn, etc.
            const postId = post.activity_urn || post.full_urn || post.post_id || post.activity_id || post.id || `li_${company_identifier}_${index}`;
            
            // El contenido está en post.text
            const content = post.text || post.description || post.commentary || post.content || '';
            
            // La fecha está en post.posted_at con estructura específica
            let postedAt = null;
            if (post.posted_at) {
              if (post.posted_at.timestamp) {
                postedAt = new Date(post.posted_at.timestamp).toISOString();
              } else if (post.posted_at.date) {
                postedAt = new Date(post.posted_at.date).toISOString();
              } else if (typeof post.posted_at === 'string') {
                postedAt = new Date(post.posted_at).toISOString();
              } else if (typeof post.posted_at === 'number') {
                postedAt = new Date(post.posted_at).toISOString();
              }
            }
            
            // Las métricas están en post.stats
            const likesCount = parseInt(post.stats?.total_reactions || post.stats?.like || post.reactions?.like_count || post.likes_count || post.likes || 0);
            const commentsCount = parseInt(post.stats?.comments || post.comments_count || post.comments || 0);
            const sharesCount = parseInt(post.stats?.reposts || post.reposts_count || post.shares_count || post.shares || 0);
            const viewsCount = parseInt(post.stats?.views || post.views_count || post.views || 0);
            
            console.log('📝 Processing LinkedIn post:', { 
              postId, 
              hasContent: !!content, 
              contentLength: content.length,
              postedAt,
              likesCount,
              commentsCount,
              sharesCount,
              viewsCount,
              postKeys: Object.keys(post),
              statsKeys: post.stats ? Object.keys(post.stats) : 'No stats'
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
          console.log('📋 Sample post to insert:', JSON.stringify(postsToInsert[0], null, 2));
          
          // Verificar que tenemos un supabase client válido con autenticación
          const { data: authUser, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
          console.log('🔐 Auth check - User ID:', authUser?.user?.id, 'Error:', authError);
          
          // Insertar posts uno por uno para ver errores específicos
          let insertedCount = 0;
          for (const [index, postData] of postsToInsert.entries()) {
            try {
              console.log(`📝 Inserting post ${index + 1}/${postsToInsert.length}: ${postData.post_id}`);
              
              const { data, error } = await supabase.from('linkedin_posts').upsert(postData, {
                onConflict: 'user_id,post_id'
              });
              
              if (error) {
                console.error(`❌ Error inserting LinkedIn post ${index + 1}:`, {
                  error: error,
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  code: error.code,
                  postId: postData.post_id,
                  userId: postData.user_id
                });
              } else {
                insertedCount++;
                console.log(`✅ Successfully inserted LinkedIn post ${index + 1}: ${postData.post_id}`);
                console.log(`📊 Insert result:`, data);
              }
            } catch (error) {
              console.error(`❌ Exception inserting LinkedIn post ${index + 1}:`, {
                error: error,
                message: (error as Error).message,
                postId: postData.post_id,
                userId: postData.user_id
              });
            }
          }

          console.log(`💾 Successfully inserted ${insertedCount}/${postsToInsert.length} LinkedIn posts into database`);
        } else {
          console.log('⚠️ No posts found in LinkedIn result');
          console.log('🔍 Available result keys:', result ? Object.keys(result) : 'No result');
          if (result && result.data) {
            console.log('🔍 result.data keys:', Object.keys(result.data));
            if (result.data.data) {
              console.log('🔍 result.data.data keys:', Object.keys(result.data.data));
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