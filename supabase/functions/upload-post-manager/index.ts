import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateCompanyUsername(supabaseClient: any, userId: string): Promise<string> {
  // Obtener información de la empresa del usuario
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
    // Verificar si el perfil ya existe
    const checkResponse = await fetch(`https://api.upload-post.com/api/uploadposts/users/${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (checkResponse.ok) {
      // El perfil ya existe: sincronizar conexiones desde el perfil existente
      const existing = await checkResponse.json();
      const socialAccounts = existing?.profile?.social_accounts || {};
      await updateSocialAccountsFromProfile(supabaseClient, userId, companyUsername, socialAccounts);

      // Asegurar bandera de existencia del perfil en la base local
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
      // Crear nuevo perfil
      const createResponse = await fetch('https://api.upload-post.com/api/uploadposts/users', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: companyUsername }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Error creando perfil: ${createResponse.status} - ${errorText}`);
      }

      // Actualizar base de datos local
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
        'Authorization': `ApiKey ${apiKey}`,
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
    
    // Log de telemetría
    console.log('JWT Generated:', { userId, companyUsername, platforms, result });
    
    // Mapear la respuesta para que sea compatible con el frontend
    // El frontend espera access_url, pero el API puede devolver url o access_url
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
        'Authorization': `ApiKey ${apiKey}`,
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

    // Actualizar base de datos local con las conexiones usando la estructura correcta
    const socialAccounts = result.profile.social_accounts || {};
    await updateSocialAccountsFromProfile(supabaseClient, userId, companyUsername, socialAccounts);

    // Asegurar bandera de existencia del perfil en la base local
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

async function updateSocialAccountsFromProfile(supabaseClient: any, userId: string, companyUsername: string, socialAccountsData: any) {
  try {
    console.log('🔄 Updating per-platform social accounts for:', companyUsername);

    const companyId = await getPrimaryCompanyId(supabaseClient, userId);
    const platforms = Object.keys(socialAccountsData || {});
    console.log('📱 Platforms to process:', platforms);

    for (const platform of platforms) {
      const platformData = (socialAccountsData as any)[platform];

      const hasData = platformData && typeof platformData === 'object';
      const isConnected = !!(hasData && (platformData.username || platformData.display_name || platformData.social_images));

      // Upsert one row per plataforma
      const { error } = await supabaseClient
        .from('social_accounts')
        .upsert({
          user_id: userId,
          company_id: companyId,
          company_username: companyUsername,
          platform,
          platform_username: hasData ? (platformData.username ?? null) : null,
          platform_display_name: hasData ? (platformData.display_name ?? null) : null,
          is_connected: isConnected,
          metadata: hasData ? platformData : {},
          connected_at: isConnected ? new Date().toISOString() : null,
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error(`❌ Error upserting ${platform} row:`, error);
        throw error;
      }

      console.log(`✅ ${platform}: upserted (connected=${isConnected})`);
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
    const response = await fetch(`https://api.upload-post.com/api/uploadposts/facebook/pages?profile=${companyUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo páginas de Facebook: ${response.status} - ${errorText}`);
    }

    return await response.json();

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
        'Authorization': `ApiKey ${apiKey}`,
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
        'Authorization': `ApiKey ${apiKey}`,
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
  const { companyUsername, facebookPageId } = data;

  await supabaseClient
    .from('social_accounts')
    .update({ facebook_page_id: facebookPageId })
    .eq('user_id', userId)
    .eq('platform', 'facebook')
    .eq('company_username', companyUsername);

  return { success: true };
}

async function postContent(supabaseClient: any, userId: string, apiKey: string, data: any) {
  const { companyUsername, platforms, title, content, mediaUrls, postType, scheduledDate, async_upload } = data;
  
  console.log(`📝 postContent called with:`, { 
    companyUsername, platforms, title, postType, 
    mediaCount: mediaUrls?.length || 0, scheduledDate, async_upload
  });

  try {
    let response;
    const formData = new FormData();
    formData.append('user', companyUsername);
    
    platforms.forEach((platform: string) => {
      formData.append('platform[]', platform);
    });
    
    formData.append('title', title);
    if (scheduledDate) {
      formData.append('scheduled_date', scheduledDate);
    }
    
    // Add async upload parameter if requested
    if (async_upload) {
      formData.append('async_upload', 'true');
    }

    if (postType === 'text') {
      // Para texto solo necesitamos user, platform[], title y scheduled_date
      console.log('📄 Sending text post to /api/upload_text');
      response = await fetch('https://api.upload-post.com/api/upload_text', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
        },
        body: formData,
      });
    } else if (postType === 'photo' && mediaUrls?.length) {
      // Para fotos: user, platform[], photos[], title, caption, scheduled_date
      mediaUrls.forEach((url: string) => {
        if (url.trim()) {
          formData.append('photos[]', url.trim());
        }
      });
      
      // El contenido va como 'caption' para fotos, no como 'title' adicional
      if (content && content.trim()) {
        formData.append('caption', content.trim());
      }
      
      console.log(`📸 Sending photo post to /api/upload_photos with ${mediaUrls.length} photos`);
      response = await fetch('https://api.upload-post.com/api/upload_photos', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
        },
        body: formData,
      });
    } else if (postType === 'video' && mediaUrls?.length) {
      // Para videos: user, platform[], video, title, scheduled_date
      formData.append('video', mediaUrls[0]);
      
      // Si hay contenido adicional, podemos incluirlo en el title o como descripción
      if (content && content.trim()) {
        // Combinar title y content para videos
        formData.set('title', `${title}\n\n${content.trim()}`);
      }
      
      console.log('🎥 Sending video post to /api/upload');
      response = await fetch('https://api.upload-post.com/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `ApiKey ${apiKey}`,
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
    
    // Guardar en base de datos local
    if (result.job_id) {
      await supabaseClient
        .from('scheduled_social_posts')
        .insert({
          user_id: userId,
          company_username: companyUsername,
          job_id: result.job_id,
          platforms,
          title,
          content,
          media_urls: mediaUrls,
          post_type: postType,
          scheduled_date: scheduledDate || new Date().toISOString(),
          upload_post_response: result,
        });
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
        'Authorization': `ApiKey ${apiKey}`,
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
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error cancelando post: ${response.status} - ${errorText}`);
    }

    // Actualizar estado en base de datos local
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
        'Authorization': `Apikey ${apiKey}`,
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
        'Authorization': `Apikey ${apiKey}`,
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