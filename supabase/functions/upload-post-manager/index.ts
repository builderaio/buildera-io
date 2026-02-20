import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_HEADER = (apiKey: string) => `Apikey ${apiKey}`;

interface RequestBody {
  action: string;
  data?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data }: RequestBody = await req.json();
    const uploadPostApiKey = Deno.env.get('UPLOAD_POST_API_KEY');

    if (!uploadPostApiKey) {
      return new Response(
        JSON.stringify({ error: 'API Key de Upload-Post no configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (action) {
      case 'init_profile':
        result = await initializeProfile(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'generate_jwt':
        result = await generateJWT(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_connections':
        result = await getConnections(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_facebook_pages':
        result = await getFacebookPages(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_linkedin_pages':
        result = await getLinkedInPages(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_pinterest_boards':
        result = await getPinterestBoards(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'update_facebook_page':
        result = await updateFacebookPage(supabaseClient, user.id, data);
        break;
      case 'update_linkedin_page':
        result = await updateLinkedInPage(supabaseClient, user.id, data);
        break;
      case 'post_content':
        result = await postContent(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_scheduled_posts':
        result = await getScheduledPosts(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'cancel_scheduled_post':
        result = await cancelScheduledPost(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'smoke_test':
        result = await runSmokeTest(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      case 'get_upload_status':
        result = await getUploadStatus(uploadPostApiKey, data);
        break;
      case 'get_upload_history':
        result = await getUploadHistory(uploadPostApiKey, data);
        break;
      case 'validate_token':
        result = await validateToken(data);
        break;
      case 'get_current_user':
        result = await getCurrentUser(uploadPostApiKey);
        break;
      case 'get_instagram_media':
        result = await getInstagramMedia(uploadPostApiKey, data);
        break;
      case 'get_instagram_comments':
        result = await getInstagramComments(uploadPostApiKey, data);
        break;
      case 'reply_instagram_comment':
        result = await replyInstagramComment(uploadPostApiKey, data);
        break;
      case 'send_instagram_dm':
        result = await sendInstagramDM(uploadPostApiKey, data);
        break;
      case 'get_instagram_conversations':
        result = await getInstagramConversations(uploadPostApiKey, data);
        break;
      // === GAP 1: Upload Document (LinkedIn PDF/PPT carousels) ===
      case 'upload_document':
        result = await uploadDocument(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      // === GAP 2: Edit Scheduled Post ===
      case 'edit_scheduled_post':
        result = await editScheduledPost(supabaseClient, user.id, uploadPostApiKey, data);
        break;
      // === GAP 3: Queue Management ===
      case 'get_queue_settings':
        result = await getQueueSettings(uploadPostApiKey, data);
        break;
      case 'update_queue_settings':
        result = await updateQueueSettings(uploadPostApiKey, data);
        break;
      case 'get_queue_preview':
        result = await getQueuePreview(uploadPostApiKey, data);
        break;
      case 'get_next_queue_slot':
        result = await getNextQueueSlot(uploadPostApiKey, data);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Acción no válida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-post-manager:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateCompanyUsername(supabaseClient: any, userId: string): Promise<string> {
  const { data: companies } = await supabaseClient
    .from('companies')
    .select('name')
    .eq('created_by', userId)
    .limit(1);

  let baseName = 'empresa';
  if (companies?.[0]?.name) {
    baseName = companies[0].name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  return `${baseName}_${userId.substring(0, 8)}`;
}

async function getPrimaryCompanyId(supabaseClient: any, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseClient
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .limit(1);

    if (error) {
      console.warn('Could not fetch primary company id:', error);
      return null;
    }
    return data?.[0]?.company_id || null;
  } catch (e) {
    console.warn('Error getting primary company id:', e);
    return null;
  }
}

async function initializeProfile(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const companyUsername = await generateCompanyUsername(supabaseClient, userId);

  try {
    const checkResponse = await fetch(`https://api.upload-post.com/api/uploadposts/users/${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      const socialAccounts = existing?.profile?.social_accounts || {};
      await updateSocialAccountsFromProfile(supabaseClient, userId, companyUsername, socialAccounts);

      const companyId = await getPrimaryCompanyId(supabaseClient, userId);
      await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: userId,
          company_id: companyId,
          company_username: companyUsername,
          platform: 'upload_post_profile',
          upload_post_profile_exists: true,
          is_connected: true,
          connected_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }, { onConflict: 'user_id,platform' });

      return { 
        success: true, 
        companyUsername, 
        profileExists: true,
        message: 'Perfil ya existe, sincronizando conexiones...' 
      };
    }

    if (checkResponse.status === 404) {
      const createResponse = await fetch('https://api.upload-post.com/api/uploadposts/users', {
        method: 'POST',
        headers: {
          'Authorization': AUTH_HEADER(apiKey),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: companyUsername }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Error creando perfil: ${createResponse.status} - ${errorText}`);
      }

      const companyId = await getPrimaryCompanyId(supabaseClient, userId);
      await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: userId,
          company_id: companyId,
          company_username: companyUsername,
          platform: 'upload_post_profile',
          upload_post_profile_exists: true,
          is_connected: true,
          connected_at: new Date().toISOString(),
        });

      return { 
        success: true, 
        companyUsername, 
        profileExists: false,
        message: 'Perfil creado exitosamente' 
      };
    }

    const errorText = await checkResponse.text();
    throw new Error(`Error verificando perfil: ${checkResponse.status} - ${errorText}`);

  } catch (error) {
    console.error('Error in initializeProfile:', error);
    throw error;
  }
}

async function generateJWT(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername, redirectUrl, logoImage, platforms } = data;

  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/users/generate-jwt', {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: companyUsername,
        redirect_url: redirectUrl ? `${redirectUrl}?status=success&source=upload_post` : `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/marketing-hub/connections/callback?status=success&source=upload_post`,
        logo_image: logoImage,
        redirect_button_text: 'Volver al Marketing Hub',
        platforms: platforms || ['tiktok', 'instagram', 'linkedin', 'facebook'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload-Post JWT Generation Error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        request: { companyUsername, platforms }
      });
      throw new Error(`Error generando JWT: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('JWT Generated:', { userId, companyUsername, platforms, result });
    
    const mappedResult = {
      ...result,
      access_url: result.access_url || result.url || result.auth_url || result.connection_url
    };

    return mappedResult;

  } catch (error) {
    console.error('Error in generateJWT:', error);
    throw error;
  }
}

async function getConnections(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername } = data;
  
  console.log('🔗 Getting connections for user:', companyUsername);

  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/users/${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ User profile not found in upload-post');
        return {
          success: false,
          message: 'User profile not found in upload-post',
          connections: {}
        };
      }
      const errorText = await response.text();
      throw new Error(`Error obteniendo conexiones: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📊 Profile data received from upload-post:', result);
    
    if (!result.success || !result.profile) {
      throw new Error('Invalid profile response format from upload-post API');
    }

    const socialAccounts = result.profile.social_accounts || {};
    await updateSocialAccountsFromProfile(supabaseClient, userId, companyUsername, socialAccounts);

    const companyId = await getPrimaryCompanyId(supabaseClient, userId);
    await supabaseClient
      .from('social_accounts')
      .upsert({
        user_id: userId,
        company_id: companyId,
        company_username: companyUsername,
        platform: 'upload_post_profile',
        upload_post_profile_exists: true,
        is_connected: true,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' });
    
    console.log('✅ Successfully updated local social accounts data');

    return {
      success: true,
      connections: socialAccounts,
      created_at: result.profile.created_at,
      profile: result.profile
    };

  } catch (error) {
    console.error('Error in getConnections:', error);
    throw error;
  }
}

async function updateSocialAccountsFromAPI(supabaseClient: any, userId: string, companyUsername: string, socialAccounts: any[]) {
  for (const account of socialAccounts) {
    await supabaseClient
      .from('social_accounts')
      .upsert({
        user_id: userId,
        company_username: companyUsername,
        platform: account.platform,
        platform_username: account.username,
        platform_display_name: account.display_name,
        is_connected: true,
        metadata: account,
        last_sync_at: new Date().toISOString(),
      });
  }
}

function extractUsernameFromUrl(platform: string, url: string): string | null {
  if (!url) return null;
  try {
    const cleaned = url.trim().replace(/\/+$/, '');
    switch (platform) {
      case 'linkedin': {
        const match = cleaned.match(/linkedin\.com\/(company|in)\/([^/?#]+)/i);
        return match ? match[2] : null;
      }
      case 'instagram': {
        const match = cleaned.match(/instagram\.com\/([^/?#]+)/i);
        return match && match[1] !== 'p' ? match[1] : null;
      }
      case 'facebook': {
        const match = cleaned.match(/facebook\.com\/([^/?#]+)/i);
        return match && !['profile.php', 'pages', 'groups'].includes(match[1]) ? match[1] : null;
      }
      case 'tiktok': {
        const match = cleaned.match(/tiktok\.com\/@?([^/?#]+)/i);
        return match ? match[1].replace(/^@/, '') : null;
      }
      case 'youtube': {
        const match = cleaned.match(/youtube\.com\/(@?[^/?#]+)/i);
        return match ? match[1] : null;
      }
      case 'twitter': {
        const match = cleaned.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
        return match ? match[1] : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

const platformUrlFields: Record<string, string> = {
  facebook: 'facebook_url',
  instagram: 'instagram_url',
  linkedin: 'linkedin_url',
  tiktok: 'tiktok_url',
  youtube: 'youtube_url',
  twitter: 'twitter_url',
};

async function updateSocialAccountsFromProfile(supabaseClient: any, userId: string, companyUsername: string, socialAccountsData: any) {
  try {
    console.log('🔄 Updating per-platform social accounts for:', companyUsername);

    const companyId = await getPrimaryCompanyId(supabaseClient, userId);
    const platforms = Object.keys(socialAccountsData || {});
    console.log('📱 Platforms to process:', platforms);

    let companyUrls: Record<string, string> = {};
    if (companyId) {
      const { data: companyData } = await supabaseClient
        .from('companies')
        .select('facebook_url, instagram_url, linkedin_url, tiktok_url, youtube_url, twitter_url')
        .eq('id', companyId)
        .single();
      if (companyData) {
        companyUrls = companyData;
      }
    }

    for (const platform of platforms) {
      const platformData = (socialAccountsData as any)[platform];

      const hasData = platformData && typeof platformData === 'object';
      const isConnected = !!(hasData && (platformData.username || platformData.display_name || platformData.social_images));

      let resolvedUsername: string | null = null;
      const urlField = platformUrlFields[platform];
      if (urlField && companyUrls[urlField]) {
        resolvedUsername = extractUsernameFromUrl(platform, companyUrls[urlField]);
        if (resolvedUsername) {
          console.log(`🔍 ${platform}: extracted username from company URL: ${resolvedUsername}`);
        }
      }
      if (!resolvedUsername && hasData) {
        resolvedUsername = platformData.username ?? null;
        if (resolvedUsername) {
          console.log(`📡 ${platform}: using API-provided username: ${resolvedUsername}`);
        }
      }

      const { data: existingRow } = await supabaseClient
        .from('social_accounts')
        .select('metadata, linkedin_page_id, facebook_page_id, platform_username')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single();

      if (!resolvedUsername && existingRow?.platform_username) {
        resolvedUsername = existingRow.platform_username;
      }

      const metadata = hasData ? { 
        ...platformData,
        ...((platform === 'linkedin' || platform === 'facebook') && 
            !existingRow?.metadata?.selected_page_name &&
            !(platform === 'linkedin' ? existingRow?.linkedin_page_id : existingRow?.facebook_page_id) &&
            platformData.display_name ? 
          { selected_page_name: platformData.display_name } : 
          existingRow?.metadata?.selected_page_name ? 
            { selected_page_name: existingRow.metadata.selected_page_name } : 
            {})
      } : {};

      const { error } = await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: userId,
          company_id: companyId,
          company_username: companyUsername,
          platform,
          platform_username: resolvedUsername,
          platform_display_name: hasData ? (platformData.display_name ?? null) : null,
          is_connected: isConnected,
          metadata,
          connected_at: isConnected ? new Date().toISOString() : null,
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error(`❌ Error upserting ${platform} row:`, error);
        throw error;
      }

      console.log(`✅ ${platform}: upserted (connected=${isConnected}, username=${resolvedUsername})`);
    }

    console.log('✅ All platform rows updated successfully');
  } catch (error) {
    console.error('❌ Error in updateSocialAccountsFromProfile:', error);
    throw error;
  }
}

async function getFacebookPages(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername } = data;

  try {
    console.log(`📘 Getting Facebook pages for profile: ${companyUsername}`);
    
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/facebook/pages?profile=${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });

    console.log(`📘 Facebook pages response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📘 Facebook pages error: ${response.status} - ${errorText}`);
      throw new Error(`Error obteniendo páginas de Facebook: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`📘 Facebook pages result:`, result);
    
    return result;

  } catch (error) {
    console.error('Error in getFacebookPages:', error);
    throw error;
  }
}

async function getLinkedInPages(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername } = data;
  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/linkedin/pages?profile=${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo páginas de LinkedIn: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getLinkedInPages:', error);
    throw error;
  }
}

async function getPinterestBoards(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername } = data;
  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/pinterest/boards?profile=${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo tableros de Pinterest: ${response.status} - ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getPinterestBoards:', error);
    throw error;
  }
}

async function updateFacebookPage(supabaseClient: any, userId: string, data: any) {
  const { companyUsername, facebookPageId, facebookPageName } = data;

  const updateData: any = { 
    facebook_page_id: facebookPageId,
  };
  
  if (facebookPageName) {
    const { data: currentData } = await supabaseClient
      .from('social_accounts')
      .select('metadata')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .eq('company_username', companyUsername)
      .single();
    
    updateData.metadata = {
      ...(currentData?.metadata || {}),
      selected_page_name: facebookPageName
    };
  }

  await supabaseClient
    .from('social_accounts')
    .update(updateData)
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .eq('company_username', companyUsername);

  return { success: true };
}

async function updateLinkedInPage(supabaseClient: any, userId: string, data: any) {
  const { companyUsername, linkedinPageId, linkedinPageName } = data;

  const updateData: any = { 
    linkedin_page_id: linkedinPageId,
  };
  
  if (linkedinPageName) {
    const { data: currentData } = await supabaseClient
      .from('social_accounts')
      .select('metadata')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .eq('company_username', companyUsername)
      .single();
    
    updateData.metadata = {
      ...(currentData?.metadata || {}),
      selected_page_name: linkedinPageName
    };
  }

  await supabaseClient
    .from('social_accounts')
    .update(updateData)
    .eq('user_id', userId)
    .eq('platform', 'linkedin')
    .eq('company_username', companyUsername);

  return { success: true };
}

// Platform filtering based on Upload-Post API restrictions
function filterPlatformsByPostType(platforms: string[], postType: string): string[] {
  const supportedPlatforms: Record<string, string[]> = {
    text: ['linkedin', 'x', 'facebook', 'threads', 'reddit', 'bluesky'],
    photo: ['tiktok', 'instagram', 'linkedin', 'facebook', 'x', 'threads', 'pinterest', 'reddit', 'bluesky'],
    video: ['tiktok', 'instagram', 'linkedin', 'youtube', 'facebook', 'x', 'twitter', 'threads', 'pinterest', 'reddit', 'bluesky']
  };

  // Normalize twitter to x for consistency (API accepts both for video)
  const normalizedPlatforms = platforms.map((p: string) => {
    if (p === 'twitter') return 'x';
    return p;
  });

  const validPlatforms = normalizedPlatforms.filter((platform: string) => {
    return supportedPlatforms[postType as keyof typeof supportedPlatforms]?.includes(platform);
  });

  console.log(`🔍 Platform filtering for ${postType}:`, {
    original: platforms,
    normalized: normalizedPlatforms,
    filtered: validPlatforms,
    supported: supportedPlatforms[postType as keyof typeof supportedPlatforms]
  });

  return validPlatforms;
}

async function postContent(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { 
    companyUsername, platforms, title, content, mediaUrls, postType, scheduledDate, async_upload,
    // New fields from plan
    description, first_comment, timezone, add_to_queue,
    // Platform-specific params
    platform_params
  } = data;
  
  console.log(`📝 postContent called with:`, { 
    companyUsername, platforms, title, postType, 
    mediaCount: mediaUrls?.length || 0, scheduledDate, async_upload,
    hasDescription: !!description, hasFirstComment: !!first_comment, timezone, add_to_queue
  });

  // Obtener Platform-Specific Parameters (IDs de páginas)
  const { data: socialAccounts } = await supabaseClient
    .from('social_accounts')
    .select('platform, facebook_page_id, linkedin_page_id')
    .eq('user_id', userId)
    .in('platform', ['facebook', 'linkedin']);
  
  const facebookAccount = socialAccounts?.find((acc: any) => acc.platform === 'facebook');
  const linkedinAccount = socialAccounts?.find((acc: any) => acc.platform === 'linkedin');
  
  console.log('📱 Platform-Specific Parameters:', {
    facebook_page_id: facebookAccount?.facebook_page_id,
    linkedin_page_id: linkedinAccount?.linkedin_page_id
  });

  // Filter platforms based on post type and API restrictions
  const platformsToSend = filterPlatformsByPostType(platforms, postType);
  
  if (platformsToSend.length === 0) {
    const supportedPlatforms: Record<string, string[]> = {
      text: ['LinkedIn', 'X (Twitter)', 'Facebook', 'Threads', 'Reddit'],
      photo: ['TikTok', 'Instagram', 'LinkedIn', 'Facebook', 'X (Twitter)', 'Threads', 'Pinterest', 'Reddit'],
      video: ['TikTok', 'Instagram', 'LinkedIn', 'YouTube', 'Facebook', 'X (Twitter)', 'Threads', 'Pinterest', 'Reddit']
    };
    
    const unsupportedPlatforms = platforms.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    const supportedList = supportedPlatforms[postType as keyof typeof supportedPlatforms]?.join(', ') || 'None';
    
    throw new Error(
      `${unsupportedPlatforms} no soporta publicaciones de ${postType}. ` +
      `Para publicaciones de ${postType}, puedes usar: ${supportedList}. ` +
      `Sugerencia: ${platforms.includes('instagram') || platforms.includes('tiktok') ? 
        'Instagram y TikTok solo soportan fotos y videos. Considera cambiar el tipo de publicación a "Foto" y agregar una imagen con tu texto.' : 
        'Selecciona una plataforma compatible para este tipo de contenido.'}`
    );
  }

  try {
    let response;
    const formData = new FormData();
    formData.append('user', companyUsername);
    
    // Platform-Specific Page IDs
    if (platformsToSend.includes('facebook') && facebookAccount?.facebook_page_id) {
      formData.append('facebook_page_id', facebookAccount.facebook_page_id);
      console.log('✅ Added Facebook Page ID:', facebookAccount.facebook_page_id);
    }
    
    if (platformsToSend.includes('linkedin') && linkedinAccount?.linkedin_page_id) {
      const linkedinPageId = linkedinAccount.linkedin_page_id.includes('urn:li:organization:')
        ? linkedinAccount.linkedin_page_id.split('urn:li:organization:')[1]
        : linkedinAccount.linkedin_page_id;
      
      formData.append('target_linkedin_page_id', linkedinPageId);
      console.log('✅ Added LinkedIn Page ID (target_linkedin_page_id):', linkedinPageId);
    }
    
    platformsToSend.forEach((platform: string) => {
      formData.append('platform[]', platform);
    });
    
    formData.append('title', title);
    
    // === NEW: description field (used by LinkedIn commentary, YouTube description, etc.) ===
    if (description && description.trim()) {
      formData.append('description', description.trim());
    } else if (content && content.trim()) {
      // Fallback: use content as description for semantic separation
      formData.append('description', content.trim());
    }
    
    // === NEW: first_comment (auto first comment on IG, FB, Threads, X, YT, Reddit, Bluesky) ===
    if (first_comment && first_comment.trim()) {
      formData.append('first_comment', first_comment.trim());
    }
    
    // === NEW: timezone for scheduled posts ===
    if (timezone) {
      formData.append('timezone', timezone);
    }
    
    // === NEW: add_to_queue as alternative to scheduled_date ===
    if (add_to_queue) {
      formData.append('add_to_queue', 'true');
    } else if (scheduledDate) {
      formData.append('scheduled_date', scheduledDate);
    }
    
    // Add async upload parameter if requested
    if (async_upload) {
      formData.append('async_upload', 'true');
    }
    
    // === NEW: Platform-specific parameters ===
    if (platform_params) {
      // Instagram
      if (platform_params.instagram_media_type) {
        formData.append('media_type', platform_params.instagram_media_type);
      }
      if (platform_params.instagram_collaborators) {
        formData.append('collaborators', platform_params.instagram_collaborators);
      }
      // === GAP 4: Instagram share_mode (Trial Reels) ===
      if (platform_params.instagram_share_mode) {
        formData.append('share_mode', platform_params.instagram_share_mode);
      }
      // === GAP 4: Instagram cover_url ===
      if (platform_params.instagram_cover_url) {
        formData.append('cover_url', platform_params.instagram_cover_url);
      }
      if (platform_params.instagram_user_tags) {
        formData.append('user_tags', platform_params.instagram_user_tags);
      }
      if (platform_params.instagram_location_id) {
        formData.append('location_id', platform_params.instagram_location_id);
      }
      // TikTok
      if (platform_params.tiktok_privacy_level) {
        formData.append('privacy_level', platform_params.tiktok_privacy_level);
      }
      if (platform_params.tiktok_is_aigc) {
        formData.append('is_aigc', 'true');
      }
      if (platform_params.tiktok_post_mode) {
        formData.append('post_mode', platform_params.tiktok_post_mode);
      }
      if (platform_params.tiktok_disable_comment) {
        formData.append('disable_comment', 'true');
      }
      if (platform_params.tiktok_auto_add_music) {
        formData.append('auto_add_music', 'true');
      }
      if (platform_params.tiktok_brand_content_toggle) {
        formData.append('brand_content_toggle', 'true');
      }
      if (platform_params.tiktok_brand_organic_toggle) {
        formData.append('brand_organic_toggle', 'true');
      }
      // YouTube
      if (platform_params.youtube_tags && platform_params.youtube_tags.length > 0) {
        platform_params.youtube_tags.forEach((tag: string) => {
          formData.append('tags[]', tag);
        });
      }
      if (platform_params.youtube_privacy_status) {
        formData.append('privacyStatus', platform_params.youtube_privacy_status);
      }
      if (platform_params.youtube_category_id) {
        formData.append('categoryId', platform_params.youtube_category_id);
      }
      if (platform_params.youtube_contains_synthetic_media) {
        formData.append('containsSyntheticMedia', 'true');
      }
      // === GAP 4: YouTube thumbnail_url ===
      if (platform_params.youtube_thumbnail_url) {
        formData.append('thumbnail_url', platform_params.youtube_thumbnail_url);
      }
      if (platform_params.youtube_made_for_kids !== undefined) {
        formData.append('madeForKids', platform_params.youtube_made_for_kids ? 'true' : 'false');
      }
      // Facebook
      if (platform_params.facebook_media_type) {
        formData.append('facebook_media_type', platform_params.facebook_media_type);
      }
      if (platform_params.facebook_link_url) {
        formData.append('facebook_link_url', platform_params.facebook_link_url);
      }
      // Pinterest
      if (platform_params.pinterest_board_id) {
        formData.append('pinterest_board_id', platform_params.pinterest_board_id);
      }
      if (platform_params.pinterest_link) {
        formData.append('pinterest_link', platform_params.pinterest_link);
      }
      if (platform_params.pinterest_alt_text) {
        formData.append('pinterest_alt_text', platform_params.pinterest_alt_text);
      }
      // Reddit
      if (platform_params.subreddit) {
        formData.append('subreddit', platform_params.subreddit);
      }
      if (platform_params.flair_id) {
        formData.append('flair_id', platform_params.flair_id);
      }
      // === GAP 5: X/Twitter polls & community ===
      if (platform_params.x_poll_options && platform_params.x_poll_options.length >= 2) {
        platform_params.x_poll_options.forEach((opt: string) => {
          formData.append('poll_options[]', opt);
        });
        if (platform_params.x_poll_duration) {
          formData.append('poll_duration', String(platform_params.x_poll_duration));
        }
      }
      if (platform_params.x_community_id) {
        formData.append('community_id', platform_params.x_community_id);
      }
      if (platform_params.x_reply_settings) {
        formData.append('reply_settings', platform_params.x_reply_settings);
      }
      if (platform_params.x_long_text_as_post) {
        formData.append('x_long_text_as_post', 'true');
      }
      if (platform_params.x_thread_image_layout) {
        formData.append('x_thread_image_layout', platform_params.x_thread_image_layout);
      }
      // === GAP 5: Threads media layout ===
      if (platform_params.threads_thread_media_layout) {
        formData.append('threads_thread_media_layout', platform_params.threads_thread_media_layout);
      }
      // Platform-specific first comments
      if (platform_params.instagram_first_comment) formData.append('instagram_first_comment', platform_params.instagram_first_comment);
      if (platform_params.facebook_first_comment) formData.append('facebook_first_comment', platform_params.facebook_first_comment);
      if (platform_params.x_first_comment) formData.append('x_first_comment', platform_params.x_first_comment);
      if (platform_params.threads_first_comment) formData.append('threads_first_comment', platform_params.threads_first_comment);
      if (platform_params.youtube_first_comment) formData.append('youtube_first_comment', platform_params.youtube_first_comment);
      if (platform_params.reddit_first_comment) formData.append('reddit_first_comment', platform_params.reddit_first_comment);
      if (platform_params.bluesky_first_comment) formData.append('bluesky_first_comment', platform_params.bluesky_first_comment);
      // Platform-specific titles
      if (platform_params.instagram_title) formData.append('instagram_title', platform_params.instagram_title);
      if (platform_params.linkedin_title) formData.append('linkedin_title', platform_params.linkedin_title);
      if (platform_params.x_title) formData.append('x_title', platform_params.x_title);
      if (platform_params.facebook_title) formData.append('facebook_title', platform_params.facebook_title);
      if (platform_params.tiktok_title) formData.append('tiktok_title', platform_params.tiktok_title);
      if (platform_params.youtube_title) formData.append('youtube_title', platform_params.youtube_title);
      if (platform_params.threads_title) formData.append('threads_title', platform_params.threads_title);
      if (platform_params.pinterest_title) formData.append('pinterest_title', platform_params.pinterest_title);
      if (platform_params.reddit_title) formData.append('reddit_title', platform_params.reddit_title);
      if (platform_params.bluesky_title) formData.append('bluesky_title', platform_params.bluesky_title);
    }

    if (postType === 'text') {
      console.log('📄 Sending text post to /api/upload_text');
      response = await fetch('https://api.upload-post.com/api/upload_text', {
        method: 'POST',
        headers: {
          'Authorization': AUTH_HEADER(apiKey),
        },
        body: formData,
      });
    } else if (postType === 'photo' && mediaUrls?.length) {
      mediaUrls.forEach((url: string) => {
        if (url.trim()) {
          formData.append('photos[]', url.trim());
        }
      });
      
      if (content && content.trim()) {
        formData.append('caption', content.trim());
      }
      
      console.log(`📸 Sending photo post to /api/upload_photos with ${mediaUrls.length} photos`);
      response = await fetch('https://api.upload-post.com/api/upload_photos', {
        method: 'POST',
        headers: {
          'Authorization': AUTH_HEADER(apiKey),
        },
        body: formData,
      });
    } else if (postType === 'video' && mediaUrls?.length) {
      formData.append('video', mediaUrls[0]);
      
      // FIX: Use description field instead of combining into title
      // title stays as title, content goes as description (already appended above)
      
      console.log('🎥 Sending video post to /api/upload');
      response = await fetch('https://api.upload-post.com/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': AUTH_HEADER(apiKey),
        },
        body: formData,
      });
    } else {
      throw new Error(`Tipo de post no soportado o faltan medios: ${postType}`);
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'No response';
      throw new Error(`Error publicando contenido: ${response?.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Persist full response including request_id and usage data
    if (result.job_id || result.request_id) {
      const responseToStore = {
        ...result,
        request_id: result.request_id || result.job_id,
        usage: result.usage || null,
      };
      
      await supabaseClient
        .from('scheduled_social_posts')
        .insert({
          user_id: userId,
          company_username: companyUsername,
          job_id: result.job_id || result.request_id,
          platforms,
          title,
          content,
          media_urls: mediaUrls,
          post_type: postType,
          scheduled_date: scheduledDate || new Date().toISOString(),
          upload_post_response: responseToStore,
        });
      
      if (scheduledDate || add_to_queue) {
        const contentData = {
          text: content || title,
          mediaUrls: mediaUrls || [],
          title: title,
          job_id: result.job_id || result.request_id,
          first_comment: first_comment || null,
        };
        
        for (const platform of platforms) {
          try {
            await supabaseClient
              .from('scheduled_posts')
              .insert({
                user_id: userId,
                company_page_id: companyUsername,
                platform: platform,
                content: contentData,
                scheduled_for: scheduledDate || new Date().toISOString(),
                status: add_to_queue ? 'queued' : 'scheduled'
              });
          } catch (insertError) {
            console.warn(`Could not insert into scheduled_posts for ${platform}:`, insertError);
          }
        }
      }
    }

    return result;

  } catch (error) {
    console.error('Error in postContent:', error);
    throw error;
  }
}

async function getScheduledPosts(supabaseClient: any, userId: string, apiKey: string, data: any) {
  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/schedule', {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo posts programados: ${response.status} - ${errorText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error in getScheduledPosts:', error);
    throw error;
  }
}

async function cancelScheduledPost(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { jobId } = data;

  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/schedule/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error cancelando post: ${response.status} - ${errorText}`);
    }

    await supabaseClient
      .from('scheduled_social_posts')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('job_id', jobId);

    return { success: true };

  } catch (error) {
    console.error('Error in cancelScheduledPost:', error);
    throw error;
  }
}

async function runSmokeTest(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername, platforms } = data;

  try {
    const testDate = new Date();
    testDate.setMinutes(testDate.getMinutes() + 10);

    const result = await postContent(supabaseClient, userId, apiKey, {
      companyUsername,
      platforms: platforms || ['linkedin'],
      title: 'Prueba de conexión desde Marketing Hub',
      postType: 'text',
      scheduledDate: testDate.toISOString(),
    });

    console.log('Smoke test completed:', { userId, companyUsername, platforms });

    return { success: true, result };

  } catch (error) {
    console.error('Error in runSmokeTest:', error);
    throw error;
  }
}

async function getUploadStatus(apiKey: string, data: any) {
  const { requestId } = data || {};
  
  if (!requestId) {
    throw new Error('Missing request_id parameter');
  }

  console.log(`📊 Getting upload status for request: ${requestId}`);

  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/status?request_id=${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting upload status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload status retrieved:', result);
    return { success: true, status: result };

  } catch (error) {
    console.error('Error in getUploadStatus:', error);
    throw error;
  }
}

async function getUploadHistory(apiKey: string, data: any) {
  const { page = 1, limit = 20 } = data || {};

  console.log(`📚 Getting upload history - page: ${page}, limit: ${limit}`);

  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting upload history: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Upload history retrieved: ${result.history?.length || 0} items`);
    return { success: true, ...result };

  } catch (error) {
    console.error('Error in getUploadHistory:', error);
    throw error;
  }
}

async function validateToken(data: any) {
  const { token } = data || {};
  if (!token) {
    return { success: false, error: 'Missing token' };
  }

  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/users/validate-jwt', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error validando token: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Token validated:', { isValid: true, result });
    return result;
  } catch (error) {
    console.error('Error in validateToken:', error);
    return { success: false, error: (error as any).message };
  }
}

// ============= ADDITIONAL API INTEGRATIONS =============

async function getCurrentUser(apiKey: string) {
  console.log('👤 Getting current user info from Upload-Post');
  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/me', {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting current user: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('✅ Current user retrieved:', result);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
}

async function getInstagramMedia(apiKey: string, data: any) {
  const { profile } = data || {};
  if (!profile) throw new Error('Missing profile parameter');
  console.log(`📷 Getting Instagram media for profile: ${profile}`);
  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/media?profile=${profile}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting Instagram media: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log(`✅ Instagram media retrieved: ${result.data?.length || 0} items`);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in getInstagramMedia:', error);
    throw error;
  }
}

async function getInstagramComments(apiKey: string, data: any) {
  const { media_id, post_url, profile } = data || {};
  if (!media_id && !post_url) throw new Error('Missing media_id or post_url parameter');
  const params = new URLSearchParams();
  if (media_id) params.append('media_id', media_id);
  if (post_url) params.append('post_url', post_url);
  if (profile) params.append('profile', profile);
  console.log(`💬 Getting Instagram comments:`, { media_id, post_url, profile });
  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/comments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting Instagram comments: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log(`✅ Comments retrieved: ${result.data?.length || 0} comments`);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in getInstagramComments:', error);
    throw error;
  }
}

async function replyInstagramComment(apiKey: string, data: any) {
  const { media_id, comment_id, message, profile } = data || {};
  if (!comment_id || !message) throw new Error('Missing comment_id or message parameter');
  console.log(`↩️ Replying to Instagram comment:`, { media_id, comment_id, profile });
  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/comments/reply', {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ media_id, comment_id, message, profile }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error replying to comment: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('✅ Reply sent successfully');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in replyInstagramComment:', error);
    throw error;
  }
}

async function sendInstagramDM(apiKey: string, data: any) {
  const { recipient_id, message, profile } = data || {};
  if (!recipient_id || !message) throw new Error('Missing recipient_id or message parameter');
  console.log(`📨 Sending Instagram DM to:`, { recipient_id, profile });
  try {
    const response = await fetch('https://api.upload-post.com/api/uploadposts/dms/send', {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id, message, profile }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error sending DM: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log('✅ DM sent successfully');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in sendInstagramDM:', error);
    throw error;
  }
}

async function getInstagramConversations(apiKey: string, data: any) {
  const { profile } = data || {};
  if (!profile) throw new Error('Missing profile parameter');
  console.log(`📬 Getting Instagram conversations for: ${profile}`);
  try {
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/dms/conversations?profile=${profile}`, {
      method: 'GET',
      headers: {
        'Authorization': AUTH_HEADER(apiKey),
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting conversations: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    console.log(`✅ Conversations retrieved: ${result.data?.length || 0} conversations`);
    return { success: true, ...result };
  } catch (error) {
    console.error('Error in getInstagramConversations:', error);
    throw error;
  }
}

// ============= GAP 1: Upload Document (LinkedIn PDF/PPT carousels) =============

async function uploadDocument(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { 
    companyUsername, documentUrl, title, description, visibility, 
    target_linkedin_page_id 
  } = data;

  if (!documentUrl) throw new Error('Missing document URL');
  if (!title) throw new Error('Missing document title');

  console.log(`📄 Uploading document to LinkedIn for ${companyUsername}`);

  // Get LinkedIn page ID from social_accounts if not provided
  let linkedinPageId = target_linkedin_page_id;
  if (!linkedinPageId) {
    const { data: linkedinAccount } = await supabaseClient
      .from('social_accounts')
      .select('linkedin_page_id')
      .eq('user_id', userId)
      .eq('platform', 'linkedin')
      .single();
    
    if (linkedinAccount?.linkedin_page_id) {
      linkedinPageId = linkedinAccount.linkedin_page_id.includes('urn:li:organization:')
        ? linkedinAccount.linkedin_page_id.split('urn:li:organization:')[1]
        : linkedinAccount.linkedin_page_id;
    }
  }

  const formData = new FormData();
  formData.append('user', companyUsername);
  formData.append('platform[]', 'linkedin');
  formData.append('document', documentUrl);
  formData.append('title', title);
  
  if (description) formData.append('description', description);
  if (visibility) formData.append('visibility', visibility);
  if (linkedinPageId) formData.append('target_linkedin_page_id', linkedinPageId);

  const response = await fetch('https://api.upload-post.com/api/upload_document', {
    method: 'POST',
    headers: { 'Authorization': AUTH_HEADER(apiKey) },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error uploading document: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Document uploaded:', result);

  // Persist in scheduled_social_posts
  if (result.job_id || result.request_id) {
    await supabaseClient
      .from('scheduled_social_posts')
      .insert({
        user_id: userId,
        company_username: companyUsername,
        job_id: result.job_id || result.request_id,
        platforms: ['linkedin'],
        title,
        content: description,
        post_type: 'document',
        scheduled_date: new Date().toISOString(),
        upload_post_response: result,
      });
  }

  return result;
}

// ============= GAP 2: Edit Scheduled Post =============

async function editScheduledPost(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { jobId, scheduled_date, title, caption } = data;

  if (!jobId) throw new Error('Missing jobId parameter');

  console.log(`✏️ Editing scheduled post: ${jobId}`);

  const body: any = {};
  if (scheduled_date) body.scheduled_date = scheduled_date;
  if (title) body.title = title;
  if (caption) body.caption = caption;

  const response = await fetch(`https://api.upload-post.com/api/uploadposts/schedule/${jobId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': AUTH_HEADER(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error editing scheduled post: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Update local record
  const updateData: any = {};
  if (scheduled_date) updateData.scheduled_date = scheduled_date;
  if (title) updateData.title = title;
  if (caption) updateData.content = caption;

  if (Object.keys(updateData).length > 0) {
    await supabaseClient
      .from('scheduled_social_posts')
      .update(updateData)
      .eq('user_id', userId)
      .eq('job_id', jobId);
  }

  console.log('✅ Scheduled post edited:', result);
  return { success: true, ...result };
}

// ============= GAP 3: Queue Management =============

async function getQueueSettings(apiKey: string, data: any) {
  const { companyUsername } = data;
  if (!companyUsername) throw new Error('Missing companyUsername');

  console.log(`⚙️ Getting queue settings for: ${companyUsername}`);

  const response = await fetch(
    `https://api.upload-post.com/api/uploadposts/queue/settings?profile_username=${companyUsername}`,
    {
      method: 'GET',
      headers: { 'Authorization': AUTH_HEADER(apiKey), 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting queue settings: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Queue settings retrieved:', result);
  return { success: true, ...result };
}

async function updateQueueSettings(apiKey: string, data: any) {
  const { companyUsername, timezone, slots, days_of_week } = data;
  if (!companyUsername) throw new Error('Missing companyUsername');

  console.log(`⚙️ Updating queue settings for: ${companyUsername}`);

  const body: any = { profile_username: companyUsername };
  if (timezone) body.timezone = timezone;
  if (slots) body.slots = slots;
  if (days_of_week) body.days_of_week = days_of_week;

  const response = await fetch('https://api.upload-post.com/api/uploadposts/queue/settings', {
    method: 'POST',
    headers: { 'Authorization': AUTH_HEADER(apiKey), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error updating queue settings: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Queue settings updated:', result);
  return { success: true, ...result };
}

async function getQueuePreview(apiKey: string, data: any) {
  const { companyUsername, count } = data;
  if (!companyUsername) throw new Error('Missing companyUsername');

  const params = new URLSearchParams({ profile_username: companyUsername });
  if (count) params.append('count', String(count));

  console.log(`👁️ Getting queue preview for: ${companyUsername}`);

  const response = await fetch(
    `https://api.upload-post.com/api/uploadposts/queue/preview?${params.toString()}`,
    {
      method: 'GET',
      headers: { 'Authorization': AUTH_HEADER(apiKey), 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting queue preview: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Queue preview retrieved:', result);
  return { success: true, ...result };
}

async function getNextQueueSlot(apiKey: string, data: any) {
  const { companyUsername } = data;
  if (!companyUsername) throw new Error('Missing companyUsername');

  console.log(`⏭️ Getting next queue slot for: ${companyUsername}`);

  const response = await fetch(
    `https://api.upload-post.com/api/uploadposts/queue/next-slot?profile_username=${companyUsername}`,
    {
      method: 'GET',
      headers: { 'Authorization': AUTH_HEADER(apiKey), 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error getting next queue slot: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Next queue slot:', result);
  return { success: true, ...result };
}
