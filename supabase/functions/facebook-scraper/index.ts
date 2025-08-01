import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

interface FacebookPageDetails {
  id?: string;
  name?: string;
  username?: string;
  about?: string;
  description?: string;
  category?: string;
  website?: string;
  phone?: string;
  email?: string;
  location?: string;
  followers_count?: number;
  likes_count?: number;
  checkins?: number;
  talking_about_count?: number;
  were_here_count?: number;
  cover_photo?: string;
  profile_picture?: string;
  verification_status?: string;
  page_token?: string;
}

interface FacebookPost {
  id?: string;
  message?: string;
  story?: string;
  created_time?: string;
  type?: string;
  status_type?: string;
  object_id?: string;
  link?: string;
  picture?: string;
  full_picture?: string;
  permalink_url?: string;
  shares?: { count?: number };
  reactions?: { summary?: { total_count?: number } };
  comments?: { summary?: { total_count?: number } };
  likes?: { summary?: { total_count?: number } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Facebook Scraper Function Started');
    console.log(`🔑 RAPIDAPI_KEY configured: ${!!rapidApiKey}`);
    
    if (!rapidApiKey) {
      console.error('❌ RAPIDAPI_KEY not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'RAPIDAPI_KEY not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, page_url, page_id } = await req.json();
    console.log(`📘 Facebook Scraper - Action: ${action}, Page URL/ID: ${page_url || page_id}, User: ${user.id}`);
    
    let responseData: any = {};

    switch (action) {
      case 'get_page_details':
        responseData = await getFacebookPageDetails(page_url, user.id, supabase);
        break;
      case 'get_posts':
        responseData = await getFacebookPosts(page_id || page_url, user.id, supabase);
        break;
      case 'get_complete_analysis':
        responseData = await getCompleteFacebookAnalysis(page_url, user.id, supabase);
        break;
      default:
        throw new Error(`Action not supported: ${action}`);
    }

    // Trigger intelligent analysis after successful post processing
    if ((action === 'get_posts' || action === 'get_complete_analysis') && responseData.posts && responseData.posts.length > 0) {
      console.log('🧠 Triggering Facebook intelligent analysis...');
      
      try {
        const analysisResponse = await supabase.functions.invoke('facebook-intelligent-analysis', {
          headers: {
            Authorization: authHeader,
          },
        });
        
        if (analysisResponse.error) {
          console.error('Analysis trigger error:', analysisResponse.error);
        } else {
          console.log('✅ Facebook intelligent analysis triggered successfully');
          responseData.analysis_triggered = true;
          responseData.insights_generated = analysisResponse.data?.insights_generated || 0;
          responseData.actionables_generated = analysisResponse.data?.actionables_generated || 0;
        }
      } catch (analysisError) {
        console.error('Error triggering analysis:', analysisError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ Facebook Scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function getFacebookPageDetails(pageUrl: string, userId: string, supabase: any): Promise<any> {
  console.log(`📊 Getting Facebook page details for: ${pageUrl}`);
  
  const response = await fetch('https://facebook-scraper3.p.rapidapi.com/page_details', {
    method: 'POST',
    headers: {
      'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page_url: pageUrl
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Facebook API error:', errorText);
    throw new Error(`Facebook API error: ${response.status}`);
  }

  const apiResponse = await response.json();
  console.log('Facebook Page Details Response:', JSON.stringify(apiResponse, null, 2));

  if (!apiResponse.success) {
    throw new Error(apiResponse.message || 'Failed to get page details');
  }

  const pageData = apiResponse.data;

  // Save page data to database
  if (pageData) {
    const pageDataToSave = {
      user_id: userId,
      page_id: pageData.id || extractPageIdFromUrl(pageUrl),
      page_name: pageData.name || '',
      page_username: pageData.username || '',
      page_category: pageData.category || '',
      followers_count: pageData.followers_count || 0,
      likes_count: pageData.likes_count || 0,
      about: pageData.about || pageData.description || '',
      website: pageData.website || '',
      raw_data: pageData
    };

    const { error: saveError } = await supabase
      .from('facebook_page_data')
      .upsert(pageDataToSave, { onConflict: 'user_id,page_id' });

    if (saveError) {
      console.error('❌ Error saving Facebook page data:', saveError);
    } else {
      console.log('✅ Saved Facebook page data to database');
    }
  }

  return {
    page_details: pageData,
    saved: true
  };
}

async function getFacebookPosts(pageIdentifier: string, userId: string, supabase: any): Promise<any> {
  console.log(`📝 Getting Facebook posts for: ${pageIdentifier}`);
  
  // Extract page ID if URL is provided
  const pageId = pageIdentifier.includes('facebook.com') ? extractPageIdFromUrl(pageIdentifier) : pageIdentifier;
  
  const response = await fetch('https://facebook-scraper3.p.rapidapi.com/page_posts', {
    method: 'POST',
    headers: {
      'x-rapidapi-host': 'facebook-scraper3.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      page_id: pageId,
      limit: 20
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Facebook Posts API error:', errorText);
    throw new Error(`Facebook Posts API error: ${response.status}`);
  }

  const apiResponse = await response.json();
  console.log('Facebook Posts Response:', JSON.stringify(apiResponse, null, 2));

  if (!apiResponse.success) {
    throw new Error(apiResponse.message || 'Failed to get posts');
  }

  const posts = apiResponse.data || [];
  console.log(`📝 Found ${posts.length} Facebook posts`);

  // Save posts to database
  if (posts.length > 0) {
    const postsToSave = posts.map((post: FacebookPost) => ({
      user_id: userId,
      post_id: post.id || `facebook_${Date.now()}_${Math.random()}`,
      post_type: post.type || 'status',
      content: post.message || post.story || '',
      author_name: 'Page Owner',
      author_id: pageId,
      likes_count: post.likes?.summary?.total_count || post.reactions?.summary?.total_count || 0,
      comments_count: post.comments?.summary?.total_count || 0,
      shares_count: post.shares?.count || 0,
      reactions_count: post.reactions?.summary?.total_count || 0,
      posted_at: post.created_time || new Date().toISOString(),
      engagement_rate: calculateEngagementRate(
        (post.likes?.summary?.total_count || 0) + (post.comments?.summary?.total_count || 0),
        1000 // Default follower estimate
      ),
      raw_data: post
    }));

    const { error: saveError } = await supabase
      .from('facebook_posts')
      .upsert(postsToSave, { onConflict: 'user_id,post_id' });

    if (saveError) {
      console.error('❌ Error saving Facebook posts:', saveError);
    } else {
      console.log(`✅ Saved ${postsToSave.length} Facebook posts to database`);
    }
  }

  return {
    posts: posts,
    posts_count: posts.length,
    saved: true
  };
}

async function getCompleteFacebookAnalysis(pageUrl: string, userId: string, supabase: any): Promise<any> {
  console.log(`🔍 Getting complete Facebook analysis for: ${pageUrl}`);
  
  // Get page details first
  const pageDetails = await getFacebookPageDetails(pageUrl, userId, supabase);
  
  // Extract page ID for posts
  const pageId = pageDetails.page_details?.id || extractPageIdFromUrl(pageUrl);
  
  // Get posts
  const posts = await getFacebookPosts(pageId, userId, supabase);
  
  return {
    page_details: pageDetails.page_details,
    posts: posts.posts,
    posts_count: posts.posts_count,
    analysis_complete: true,
    saved: true
  };
}

function extractPageIdFromUrl(url: string): string {
  // Extract page ID or username from Facebook URL
  const match = url.match(/facebook\.com\/([^\/\?]+)/);
  return match ? match[1] : url;
}

function calculateEngagementRate(interactions: number, followers: number): number {
  if (followers === 0) return 0;
  return Math.round((interactions / followers) * 10000) / 100; // Percentage with 2 decimals
}