import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FacebookPageDetails {
  name?: string;
  type?: string;
  page_id?: string;
  url?: string;
  image?: string;
  intro?: string;
  likes?: number;
  followers?: number;
  categories?: string[];
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  services?: string;
  price_range?: string;
  website?: string;
  cover_image?: string;
  verified?: boolean;
}

interface FacebookPageReview {
  type?: string;
  post_id?: string;
  recommend?: boolean;
  message?: string;
  author?: {
    id?: string;
    name?: string;
    url?: string;
    profile_picture?: {
      uri?: string;
      width?: number;
      height?: number;
      scale?: number;
    };
  };
  reactions_count?: number;
  share?: number;
  photos?: any[];
  tags?: any[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { action, page_url, page_id } = await req.json();

    console.log('🔍 Facebook Scraper called with:', { action, page_url, page_id });

    if (action === 'get_page_posts' && !page_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'page_id is required for get_page_posts action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if ((action === 'get_page_details' && !page_url)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'page_url is required for get_page_details action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const headers = {
      'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey
    };

    let result: any = {};

    if (action === 'get_page_details') {
      // 1. Obtener detalles de la página
      console.log('📋 Getting Facebook page details for:', page_url);
      
      const detailsUrl = `https://facebook-scraper3.p.rapidapi.com/page/details?url=${encodeURIComponent(page_url)}`;
      const detailsResponse = await fetch(detailsUrl, { headers });
      
      if (!detailsResponse.ok) {
        throw new Error(`Failed to fetch page details: ${detailsResponse.status}`);
      }
      
      const pageDetailsResponse = await detailsResponse.json();
      const pageDetails: FacebookPageDetails = pageDetailsResponse.results || pageDetailsResponse;
      console.log('✅ Page details retrieved:', pageDetails);

      // 2. Obtener ID de la página para reviews
      console.log('🆔 Getting Facebook page ID for:', page_url);
      
      const pageIdUrl = `https://facebook-scraper3.p.rapidapi.com/page/page_id?url=${encodeURIComponent(page_url)}`;
      const pageIdResponse = await fetch(pageIdUrl, { headers });
      
      let reviews: FacebookPageReview[] = [];
      
      if (pageIdResponse.ok) {
        const pageIdData = await pageIdResponse.json();
        const pageId = pageIdData.page_id;
        
        if (pageId) {
          console.log('📝 Getting Facebook page reviews for ID:', pageId);
          
          // 3. Obtener reviews de la página
          const reviewsUrl = `https://facebook-scraper3.p.rapidapi.com/page/reviews?page_id=${pageId}`;
          const reviewsResponse = await fetch(reviewsUrl, { headers });
          
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            reviews = reviewsData.results || [];
            console.log('✅ Reviews retrieved:', reviews.length);
          } else {
            console.log('⚠️ Failed to fetch reviews:', reviewsResponse.status);
          }
        }
      } else {
        console.log('⚠️ Failed to fetch page ID:', pageIdResponse.status);
      }

      result = {
        success: true,
        data: {
          page_details: pageDetails,
          reviews: reviews.slice(0, 10), // Limitar a 10 reviews
          total_reviews: reviews.length
        }
      };

      // Guardar en base de datos para cache y perfil
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          // Guardar cache original
          await supabase.from('facebook_page_data').upsert({
            user_id: user.id,
            page_url: page_url,
            page_details: pageDetails,
            reviews: reviews.slice(0, 10),
            total_reviews: reviews.length,
            last_updated: new Date().toISOString()
          });

          // Guardar información del perfil de Facebook
          console.log(`💾 Saving Facebook page profile data for user ${user.id}`);
          
          // Guardar en facebook_instagram_connections si no existe
          const { data: existingConnection } = await supabase
            .from('facebook_instagram_connections')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingConnection && pageDetails.page_id) {
            await supabase.from('facebook_instagram_connections').insert({
              user_id: user.id,
              facebook_page_id: pageDetails.page_id,
              facebook_access_token: 'scraped_data',
              facebook_page_name: pageDetails.name,
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            });
          }

          // Actualizar posts existentes con información del perfil de Facebook  
          if (pageDetails.page_id) {
            console.log(`💾 Updating Facebook posts with profile data for user ${user.id}`);
            
            const { error: updateError } = await supabase.from('facebook_posts')
              .update({
                profile_page_name: pageDetails.name,
                profile_page_id: pageDetails.page_id,
                profile_followers_count: pageDetails.followers || 0,
                profile_likes_count: pageDetails.likes || 0,
                profile_category: pageDetails.categories ? pageDetails.categories[0] : null,
                profile_website: pageDetails.website
              })
              .eq('user_id', user.id);

            if (updateError) {
              console.error('❌ Error updating Facebook posts with profile data:', updateError);
            } else {
              console.log('✅ Facebook posts updated with profile data successfully');
            }
          }
        }
      }

    } else if (action === 'get_page_posts') {
      // Obtener posts de la página usando page_id directamente
      console.log('📋 Getting Facebook page posts for ID:', page_id);
      
      const postsUrl = `https://facebook-scraper3.p.rapidapi.com/page/posts?page_id=${page_id}`;
      const postsResponse = await fetch(postsUrl, { headers });
      
      if (!postsResponse.ok) {
        throw new Error(`Failed to fetch page posts: ${postsResponse.status}`);
      }
      
      const postsData = await postsResponse.json();
      const posts = postsData.results || [];
      console.log('✅ Posts retrieved:', posts.length);

      result = {
        success: true,
        data: {
          posts: posts.slice(0, 20), // Limitar a 20 posts
          total_posts: posts.length,
          cursor: postsData.cursor
        }
      };

      // Guardar posts individuales en la tabla facebook_posts
      const authHeader = req.headers.get('Authorization');
      if (authHeader && posts.length > 0) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          console.log(`🔍 Processing ${posts.length} Facebook posts for user ${user.id}`);
          
          // Preparar los posts para insertar
          const postsToInsert = posts.slice(0, 20).map((post: any, index: number) => {
            const postId = post.post_id || post.id || `fb_${page_id}_${index}`;
            console.log('📝 Processing post:', { postId, hasText: !!post.text, hasMessage: !!post.message });
            
            return {
              user_id: user.id,
              post_id: postId,
              content: post.text || post.message || post.content || '',
              likes_count: parseInt(post.reactions_count || post.like_count || post.likes || 0),
              comments_count: parseInt(post.comments_count || post.comments || 0),
              shares_count: parseInt(post.shares_count || post.share_count || post.shares || 0),
              post_type: post.type || 'post',
              posted_at: post.time ? new Date(post.time * 1000).toISOString() : (post.created_time ? new Date(post.created_time).toISOString() : null),
              raw_data: post,
              engagement_rate: 0
            };
          });

          console.log(`💾 Attempting to insert ${postsToInsert.length} Facebook posts`);
          
          // Insertar posts uno por uno para ver errores específicos
          let insertedCount = 0;
          for (const postData of postsToInsert) {
            try {
              const { data, error } = await supabase.from('facebook_posts').upsert(postData, {
                onConflict: 'user_id,post_id'
              });
              
              if (error) {
                console.error('❌ Error inserting Facebook post:', error, 'Post data:', postData);
              } else {
                insertedCount++;
                console.log(`✅ Inserted Facebook post: ${postData.post_id}`);
              }
            } catch (error) {
              console.error('❌ Exception inserting Facebook post:', error, 'Post data:', postData);
            }
          }

          console.log(`💾 Successfully inserted ${insertedCount}/${postsToInsert.length} Facebook posts into database`);
          
          // También guardar en cache
          await supabase.from('facebook_page_data').upsert({
            user_id: user.id,
            page_url: `https://facebook.com/page_id/${page_id}`,
            posts: posts.slice(0, 20),
            total_posts: posts.length,
            last_updated: new Date().toISOString()
          });
        } else {
          console.error('❌ No user found in Facebook scraper');
        }
      } else {
        console.log('⚠️ No auth header or no posts to save in Facebook scraper');
      }

    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use: get_page_details or get_page_posts' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Facebook scraper completed successfully');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in Facebook scraper:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});