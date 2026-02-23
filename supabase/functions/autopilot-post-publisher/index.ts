import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const uploadPostApiKey = Deno.env.get('UPLOAD_POST_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);
const AUTH_HEADER = `Apikey ${uploadPostApiKey}`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  company_id: string;
  department?: string;
  decision_type?: string;
  parameters: {
    platforms?: string[];
    title?: string;
    content?: string;
    mediaUrls?: string[];
    postType?: 'text' | 'photo' | 'video';
    scheduledDate?: string;
    add_to_queue?: boolean;
    description?: string;
    first_comment?: string;
    timezone?: string;
    platform_params?: Record<string, any>;
  };
  cycle_id?: string;
  autopilot?: boolean;
  company_context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PublishRequest = await req.json();
    const { company_id, parameters, cycle_id } = body;

    if (!company_id || !parameters) {
      return new Response(JSON.stringify({ success: false, error: 'company_id and parameters required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { platforms, title, content, mediaUrls, postType = 'text', scheduledDate, add_to_queue, description, first_comment, timezone, platform_params } = parameters;

    if (!platforms?.length || !title) {
      return new Response(JSON.stringify({ success: false, error: 'platforms and title are required in parameters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📤 POST_PUBLISHER: Publishing for company ${company_id}`, { platforms, postType, scheduledDate, add_to_queue });

    // 1. Resolve company username from social_accounts
    const { data: companyRow } = await supabase.from('companies').select('created_by').eq('id', company_id).single();
    if (!companyRow?.created_by) {
      return new Response(JSON.stringify({ success: false, error: 'Company owner not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ownerUserId = companyRow.created_by;

    const { data: profileAccount } = await supabase.from('social_accounts')
      .select('company_username')
      .eq('user_id', ownerUserId)
      .eq('platform', 'upload_post_profile')
      .eq('is_connected', true)
      .single();

    if (!profileAccount?.company_username) {
      return new Response(JSON.stringify({ success: false, error: 'Upload-Post profile not connected. User must connect social networks first.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyUsername = profileAccount.company_username;
    console.log(`📤 Resolved Upload-Post username: ${companyUsername}`);

    // 2. Get platform-specific page IDs
    const { data: socialAccounts } = await supabase.from('social_accounts')
      .select('platform, facebook_page_id, linkedin_page_id')
      .eq('user_id', ownerUserId)
      .in('platform', ['facebook', 'linkedin']);

    const facebookAccount = socialAccounts?.find(a => a.platform === 'facebook');
    const linkedinAccount = socialAccounts?.find(a => a.platform === 'linkedin');

    // 3. Filter platforms by post type support
    const supportedPlatforms: Record<string, string[]> = {
      text: ['linkedin', 'x', 'facebook', 'threads', 'reddit', 'bluesky'],
      photo: ['tiktok', 'instagram', 'linkedin', 'facebook', 'x', 'threads', 'pinterest', 'reddit', 'bluesky'],
      video: ['tiktok', 'instagram', 'linkedin', 'youtube', 'facebook', 'x', 'threads', 'pinterest', 'reddit', 'bluesky'],
    };

    const normalizedPlatforms = platforms.map(p => p === 'twitter' ? 'x' : p);
    const validPlatforms = normalizedPlatforms.filter(p => supportedPlatforms[postType]?.includes(p));

    if (validPlatforms.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: `No valid platforms for post type "${postType}". Requested: ${platforms.join(', ')}`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Build FormData for Upload-Post API
    const formData = new FormData();
    formData.append('user', companyUsername);

    validPlatforms.forEach(p => formData.append('platform[]', p));
    formData.append('title', title);

    if (description?.trim()) formData.append('description', description.trim());
    else if (content?.trim()) formData.append('description', content.trim());

    if (first_comment?.trim()) formData.append('first_comment', first_comment.trim());
    if (timezone) formData.append('timezone', timezone);

    if (add_to_queue) {
      formData.append('add_to_queue', 'true');
    } else if (scheduledDate) {
      formData.append('scheduled_date', scheduledDate);
    }

    // TikTok AI content disclosure (mandatory for autopilot-generated content)
    if (validPlatforms.includes('tiktok')) {
      formData.append('is_aigc', 'true');
    }
    // YouTube AI disclosure
    if (validPlatforms.includes('youtube')) {
      formData.append('containsSyntheticMedia', 'true');
    }

    // Platform page IDs
    if (validPlatforms.includes('facebook') && facebookAccount?.facebook_page_id) {
      formData.append('facebook_page_id', facebookAccount.facebook_page_id);
    }
    if (validPlatforms.includes('linkedin') && linkedinAccount?.linkedin_page_id) {
      const pageId = linkedinAccount.linkedin_page_id.includes('urn:li:organization:')
        ? linkedinAccount.linkedin_page_id.split('urn:li:organization:')[1]
        : linkedinAccount.linkedin_page_id;
      formData.append('target_linkedin_page_id', pageId);
    }

    // Forward any platform-specific params
    if (platform_params) {
      for (const [key, value] of Object.entries(platform_params)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    }

    // Async upload for large media
    formData.append('async_upload', 'true');

    // 5. Call the appropriate Upload-Post endpoint
    let apiUrl: string;
    if (postType === 'text') {
      apiUrl = 'https://api.upload-post.com/api/upload_text';
    } else if (postType === 'photo' && mediaUrls?.length) {
      mediaUrls.forEach(url => { if (url.trim()) formData.append('photos[]', url.trim()); });
      if (content?.trim()) formData.append('caption', content.trim());
      apiUrl = 'https://api.upload-post.com/api/upload_photos';
    } else if (postType === 'video' && mediaUrls?.length) {
      formData.append('video', mediaUrls[0]);
      apiUrl = 'https://api.upload-post.com/api/upload';
    } else {
      // Fallback to text if no media provided
      apiUrl = 'https://api.upload-post.com/api/upload_text';
    }

    console.log(`📤 Calling Upload-Post API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': AUTH_HEADER },
      body: formData,
    });

    const responseText = await response.text();
    let result: any;
    try { result = JSON.parse(responseText); } catch { result = { raw: responseText }; }

    if (!response.ok) {
      console.error(`❌ Upload-Post API error (${response.status}):`, responseText);
      return new Response(JSON.stringify({
        success: false,
        error: `Upload-Post API returned ${response.status}`,
        details: result,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`✅ POST_PUBLISHER: Content ${scheduledDate ? 'scheduled' : add_to_queue ? 'queued' : 'published'} successfully`, result);

    // 6. Log to scheduled_social_posts for internal tracking
    try {
      const jobId = result?.id || result?.job_id || `autopilot_${Date.now()}`;
      await supabase.from('scheduled_social_posts').insert({
        company_username: companyUsername,
        user_id: ownerUserId,
        job_id: String(jobId),
        title,
        content: content || description || title,
        platforms: validPlatforms,
        post_type: postType,
        media_urls: mediaUrls || [],
        scheduled_date: scheduledDate || new Date().toISOString(),
        status: scheduledDate ? 'scheduled' : add_to_queue ? 'queued' : 'published',
        upload_post_response: result,
      });
    } catch (logErr) {
      console.warn('⚠️ Could not log to scheduled_social_posts:', logErr);
    }

    return new Response(JSON.stringify({
      success: true,
      published_to: validPlatforms,
      post_type: postType,
      status: scheduledDate ? 'scheduled' : add_to_queue ? 'queued' : 'published',
      upload_post_result: result,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('❌ POST_PUBLISHER error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
