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
    console.log('🔗 LinkedIn OAuth callback iniciado');

    const { code, state, error, userId } = await req.json();

    if (error) {
      console.error('❌ Error de LinkedIn OAuth:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `LinkedIn OAuth error: ${error}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!code) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Authorization code is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // LinkedIn app credentials
    const clientId = '78pxtzefworlny';
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
    const redirectUri = 'https://buildera.io/auth/linkedin/callback';

    if (!clientSecret) {
      throw new Error('LinkedIn Client Secret not configured');
    }

    console.log('🔑 Intercambiando authorization code por access token...');

    // Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Error al obtener access token:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Access token obtenido exitosamente');

    // Step 2: Get user's company pages
    console.log('🏢 Obteniendo páginas de empresa...');
    
    const organizationsResponse = await fetch('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!organizationsResponse.ok) {
      const errorText = await organizationsResponse.text();
      console.error('❌ Error al obtener organizaciones:', errorText);
      throw new Error(`Failed to get organizations: ${errorText}`);
    }

    const organizationsData = await organizationsResponse.json();
    console.log('📊 Organizaciones obtenidas:', organizationsData);

    if (!organizationsData.elements || organizationsData.elements.length === 0) {
      throw new Error('No se encontraron páginas de empresa administradas');
    }

    // Step 3: Get company page details
    const organizationId = organizationsData.elements[0].organization;
    const orgIdFormatted = organizationId.split(':').pop(); // Extract numeric ID

    console.log(`🔍 Obteniendo detalles de la organización: ${orgIdFormatted}`);

    const companyResponse = await fetch(`https://api.linkedin.com/v2/organizations/${orgIdFormatted}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    let companyData = {};
    if (companyResponse.ok) {
      companyData = await companyResponse.json();
      console.log('✅ Datos de empresa obtenidos');
    } else {
      console.warn('⚠️ No se pudieron obtener datos detallados de la empresa');
    }

    // Step 4: Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    console.log('💾 Guardando conexión en base de datos...');

    const { data: connectionData, error: insertError } = await supabase
      .from('linkedin_connections')
      .insert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt.toISOString(),
        scope: tokenData.scope,
        company_page_id: orgIdFormatted,
        company_page_name: (companyData as any).localizedName || 'Empresa LinkedIn',
        company_page_data: companyData,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error guardando en base de datos:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log('✅ Conexión LinkedIn guardada exitosamente');

    return new Response(JSON.stringify({
      success: true,
      data: {
        companyPageId: orgIdFormatted,
        companyPageName: (companyData as any).localizedName || 'Empresa LinkedIn',
        scope: tokenData.scope,
        expiresAt: expiresAt.toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error en LinkedIn OAuth callback:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});