import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Iniciando gestión de posts LinkedIn');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { action, content, scheduleTime } = await req.json();

    // Get LinkedIn connection for this user
    const { data: linkedinConnection, error: connectionError } = await supabase
      .from('linkedin_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connectionError || !linkedinConnection) {
      throw new Error('LinkedIn connection not found. Please connect your LinkedIn account first.');
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(linkedinConnection.expires_at);
    
    if (now >= expiresAt) {
      throw new Error('LinkedIn access token has expired. Please reconnect your account.');
    }

    const accessToken = linkedinConnection.access_token;
    const companyPageId = linkedinConnection.company_page_id;

    console.log(`📝 Acción: ${action} para página: ${linkedinConnection.company_page_name}`);

    switch (action) {
      case 'create_post':
        return await createLinkedInPost(accessToken, companyPageId, content);
      
      case 'schedule_post':
        return await scheduleLinkedInPost(accessToken, companyPageId, content, scheduleTime);
      
      case 'get_posts':
        return await getLinkedInPosts(accessToken, companyPageId);
      
      case 'get_analytics':
        return await getLinkedInAnalytics(accessToken, companyPageId);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ Error en gestión de posts LinkedIn:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createLinkedInPost(accessToken: string, companyPageId: string, content: any) {
  console.log('✍️ Creando post en LinkedIn Company Page...');

  const postData = {
    author: `urn:li:organization:${companyPageId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: content.text || content.message || ""
        },
        shareMediaCategory: content.mediaUrl ? "IMAGE" : "NONE"
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };

  // Si hay imagen, añadir media
  if (content.mediaUrl) {
    (postData.specificContent["com.linkedin.ugc.ShareContent"] as any).media = [
      {
        status: "READY",
        description: {
          text: content.imageDescription || ""
        },
        media: content.mediaUrl,
        title: {
          text: content.imageTitle || ""
        }
      }
    ];
  }

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error creando post:', errorText);
    throw new Error(`Failed to create LinkedIn post: ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Post creado exitosamente:', result);

  return new Response(JSON.stringify({
    success: true,
    data: {
      postId: result.id,
      message: 'Post creado exitosamente en LinkedIn Company Page'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function scheduleLinkedInPost(accessToken: string, companyPageId: string, content: any, scheduleTime: string) {
  console.log('⏰ Programando post en LinkedIn Company Page...');
  
  // LinkedIn API no soporta programación directa, pero podemos guardar en nuestra DB
  // y usar un cron job para publicar más tarde
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error } = await supabase
    .from('scheduled_posts')
    .insert({
      platform: 'linkedin',
      company_page_id: companyPageId,
      content: content,
      scheduled_for: scheduleTime,
      status: 'pending'
    });

  if (error) {
    throw new Error(`Failed to schedule post: ${error.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    data: {
      message: `Post programado para ${new Date(scheduleTime).toLocaleString()}`
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getLinkedInPosts(accessToken: string, companyPageId: string) {
  console.log('📖 Obteniendo posts recientes de LinkedIn...');

  const response = await fetch(
    `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:organization:${companyPageId}&sortBy=CREATED&count=20`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error obteniendo posts:', errorText);
    throw new Error(`Failed to get LinkedIn posts: ${errorText}`);
  }

  const data = await response.json();
  const posts = data.elements || [];

  const processedPosts = posts.map((post: any) => {
    const specificContent = post.specificContent?.['com.linkedin.ugc.ShareContent'];
    const shareCommentary = specificContent?.shareCommentary?.text || '';
    
    return {
      id: post.id,
      text: shareCommentary,
      createdTime: post.created?.time ? new Date(post.created.time).toISOString() : null,
      lastModified: post.lastModified?.time ? new Date(post.lastModified.time).toISOString() : null,
      lifecycleState: post.lifecycleState,
      hasMedia: specificContent?.shareMediaCategory !== 'NONE'
    };
  });

  return new Response(JSON.stringify({
    success: true,
    data: {
      posts: processedPosts,
      totalCount: posts.length
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getLinkedInAnalytics(accessToken: string, companyPageId: string) {
  console.log('📊 Obteniendo analytics de LinkedIn...');

  // Get company page statistics
  const statsResponse = await fetch(
    `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${companyPageId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  // Get follower statistics
  const followersResponse = await fetch(
    `https://api.linkedin.com/v2/networkSizes/${companyPageId}?edgeType=CompanyFollowedByMember`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  let analytics = {
    followers: 0,
    impressions: 0,
    clicks: 0,
    engagement: 0,
    shares: 0
  };

  if (followersResponse.ok) {
    const followersData = await followersResponse.json();
    analytics.followers = followersData.firstDegreeSize || 0;
  }

  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    // Process analytics data
    if (statsData.elements && statsData.elements.length > 0) {
      const stats = statsData.elements[0];
      analytics.impressions = stats.totalShareStatistics?.impressionCount || 0;
      analytics.clicks = stats.totalShareStatistics?.clickCount || 0;
      analytics.shares = stats.totalShareStatistics?.shareCount || 0;
      (analytics as any).engagement = Number(analytics.followers) > 0 ? 
        ((analytics.clicks + analytics.shares) / analytics.followers * 100).toFixed(2) : 0;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    data: analytics
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}