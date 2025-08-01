import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

interface LinkedInCompanyDetails {
  id?: string;
  name?: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  headquarters?: string;
  founded?: string;
  specialties?: string[];
  followers_count?: number;
  employees_count?: string;
  logo_url?: string;
  cover_image_url?: string;
  company_type?: string;
}

interface LinkedInPost {
  id?: string;
  text?: string;
  author?: {
    name?: string;
    id?: string;
  };
  created_at?: string;
  posted_at?: string;
  createdAt?: string;
  stats?: {
    total_reactions?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  reactions_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 LinkedIn Scraper Function Started');
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

    const { action, company_identifier } = await req.json();
    console.log(`🔗 LinkedIn Scraper - Action: ${action}, Company: ${company_identifier}, User: ${user.id}`);
    
    let responseData: any = {};

    switch (action) {
      case 'get_company_details':
        responseData = await getLinkedInCompanyDetails(company_identifier, user.id, supabase);
        break;
      case 'get_company_posts':
        responseData = await getLinkedInCompanyPosts(company_identifier, user.id, supabase);
        break;
      case 'get_complete_analysis':
        responseData = await getCompleteLinkedInAnalysis(company_identifier, user.id, supabase);
        break;
      default:
        throw new Error(`Action not supported: ${action}`);
    }

    // Trigger intelligent analysis after successful post processing
    if ((action === 'get_company_posts' || action === 'get_complete_analysis') && responseData.posts && responseData.posts.length > 0) {
      console.log('🧠 Triggering LinkedIn intelligent analysis...');
      
      try {
        const analysisResponse = await supabase.functions.invoke('linkedin-intelligent-analysis', {
          headers: {
            Authorization: authHeader,
          },
        });
        
        if (analysisResponse.error) {
          console.error('Analysis trigger error:', analysisResponse.error);
        } else {
          console.log('✅ LinkedIn intelligent analysis triggered successfully');
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
      company_identifier,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('❌ LinkedIn Scraper error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function getLinkedInCompanyDetails(companyIdentifier: string, userId: string, supabase: any): Promise<any> {
  console.log(`🏢 Getting LinkedIn company details for: ${companyIdentifier}`);
  
  const response = await fetch('https://linkedin-data-scraper.p.rapidapi.com/company_details', {
    method: 'POST',
    headers: {
      'x-rapidapi-host': 'linkedin-data-scraper.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_url: companyIdentifier.includes('linkedin.com') ? companyIdentifier : `https://www.linkedin.com/company/${companyIdentifier}`
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LinkedIn API error:', errorText);
    throw new Error(`LinkedIn API error: ${response.status}`);
  }

  const apiResponse = await response.json();
  console.log('LinkedIn Company Details Response:', JSON.stringify(apiResponse, null, 2));

  if (!apiResponse.success && !apiResponse.data) {
    throw new Error(apiResponse.message || 'Failed to get company details');
  }

  const companyData = apiResponse.data;

  // Save company data to database
  if (companyData) {
    const companyDataToSave = {
      user_id: userId,
      company_id: companyData.id || extractCompanyIdFromUrl(companyIdentifier),
      company_name: companyData.name || '',
      description: companyData.description || '',
      industry: companyData.industry || '',
      company_size: companyData.company_size || companyData.employees_count || '',
      website: companyData.website || '',
      followers_count: companyData.followers_count || 0,
      headquarters: companyData.headquarters || '',
      founded: companyData.founded || '',
      specialties: companyData.specialties || [],
      raw_data: companyData
    };

    const { error: saveError } = await supabase
      .from('linkedin_company_data')
      .upsert(companyDataToSave, { onConflict: 'user_id,company_id' });

    if (saveError) {
      console.error('❌ Error saving LinkedIn company data:', saveError);
    } else {
      console.log('✅ Saved LinkedIn company data to database');
    }
  }

  return {
    company_details: companyData,
    saved: true
  };
}

async function getLinkedInCompanyPosts(companyIdentifier: string, userId: string, supabase: any): Promise<any> {
  console.log(`📝 Getting LinkedIn company posts for: ${companyIdentifier}`);
  
  const response = await fetch('https://linkedin-data-scraper.p.rapidapi.com/company_posts', {
    method: 'POST',
    headers: {
      'x-rapidapi-host': 'linkedin-data-scraper.p.rapidapi.com',
      'x-rapidapi-key': rapidApiKey!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      company_url: companyIdentifier.includes('linkedin.com') ? companyIdentifier : `https://www.linkedin.com/company/${companyIdentifier}`,
      limit: 20
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('LinkedIn Posts API error:', errorText);
    throw new Error(`LinkedIn Posts API error: ${response.status}`);
  }

  const apiResponse = await response.json();
  console.log('LinkedIn Posts Response:', JSON.stringify(apiResponse, null, 2));

  if (!apiResponse.success && !apiResponse.data) {
    throw new Error(apiResponse.message || 'Failed to get posts');
  }

  const posts = apiResponse.data || [];
  console.log(`📝 Found ${posts.length} LinkedIn posts`);

  // Save posts to database
  if (posts.length > 0) {
    const postsToSave = posts.map((post: LinkedInPost) => ({
      user_id: userId,
      post_id: post.id || `linkedin_${Date.now()}_${Math.random()}`,
      post_type: 'company_post',
      content: post.text || '',
      likes_count: post.reactions_count || post.stats?.total_reactions || 0,
      comments_count: post.comments_count || post.stats?.comments || 0,
      shares_count: post.shares_count || post.stats?.shares || 0,
      views_count: post.views_count || post.stats?.views || 0,
      posted_at: post.posted_at || post.created_at || post.createdAt || new Date().toISOString(),
      engagement_rate: calculateEngagementRate(
        (post.reactions_count || 0) + (post.comments_count || 0),
        1000 // Default follower estimate
      ),
      raw_data: post
    }));

    const { error: saveError } = await supabase
      .from('linkedin_posts')
      .upsert(postsToSave, { onConflict: 'user_id,post_id' });

    if (saveError) {
      console.error('❌ Error saving LinkedIn posts:', saveError);
    } else {
      console.log(`✅ Saved ${postsToSave.length} LinkedIn posts to database`);
    }
  }

  return {
    posts: posts,
    posts_count: posts.length,
    saved: true
  };
}

async function getCompleteLinkedInAnalysis(companyIdentifier: string, userId: string, supabase: any): Promise<any> {
  console.log(`🔍 Getting complete LinkedIn analysis for: ${companyIdentifier}`);
  
  // Get company details first
  const companyDetails = await getLinkedInCompanyDetails(companyIdentifier, userId, supabase);
  
  // Get posts
  const posts = await getLinkedInCompanyPosts(companyIdentifier, userId, supabase);
  
  return {
    company_details: companyDetails.company_details,
    posts: posts.posts,
    posts_count: posts.posts_count,
    analysis_complete: true,
    saved: true
  };
}

function extractCompanyIdFromUrl(url: string): string {
  // Extract company ID or name from LinkedIn URL
  const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
  return match ? match[1] : url;
}

function calculateEngagementRate(interactions: number, followers: number): number {
  if (followers === 0) return 0;
  return Math.round((interactions / followers) * 10000) / 100; // Percentage with 2 decimals
}