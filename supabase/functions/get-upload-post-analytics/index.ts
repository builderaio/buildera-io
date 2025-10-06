import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsResult {
  platform: string;
  companyUsername: string;
  analytics: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Crear cliente de Supabase
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader! },
        },
      }
    );

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('No autenticado');
    }

    console.log('📊 Obteniendo analítica de UploadPost para usuario:', user.id);

    // Obtener la API key de UploadPost
    const uploadPostApiKey = Deno.env.get('UPLOAD_POST_API_KEY');
    if (!uploadPostApiKey) {
      throw new Error('UPLOAD_POST_API_KEY no está configurada');
    }

    // Obtener las cuentas conectadas del usuario desde social_accounts
    const { data: socialAccounts, error: accountsError } = await supabaseClient
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_connected', true)
      .neq('platform', 'upload_post_profile');

    if (accountsError) {
      console.error('Error obteniendo cuentas sociales:', accountsError);
      throw accountsError;
    }

    if (!socialAccounts || socialAccounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          message: 'No hay cuentas conectadas'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Cuentas conectadas encontradas:', socialAccounts.length);

    // Agrupar por company_username para hacer una sola llamada por perfil
    const profilesMap = new Map<string, string[]>();
    
    for (const account of socialAccounts) {
      const companyUsername = account.company_username;
      const platform = mapPlatformName(account.platform);
      
      if (!profilesMap.has(companyUsername)) {
        profilesMap.set(companyUsername, []);
      }
      
      if (platform) {
        profilesMap.get(companyUsername)!.push(platform);
      }
    }

    console.log('📝 Perfiles a consultar:', Array.from(profilesMap.entries()));

    // Obtener analítica para cada perfil
    const analyticsResults: AnalyticsResult[] = [];

    for (const [companyUsername, platforms] of profilesMap.entries()) {
      const platformsParam = platforms.join(',');
      
      try {
        console.log(`📡 Obteniendo analítica para ${companyUsername} en plataformas: ${platformsParam}`);
        
        const analyticsUrl = `https://api.upload-post.com/api/analytics/${companyUsername}?platforms=${platformsParam}`;
        
        const response = await fetch(analyticsUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Apikey ${uploadPostApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error en API de UploadPost para ${companyUsername}:`, response.status, errorText);
          
          // Agregar resultado con error
          for (const platform of platforms) {
            analyticsResults.push({
              platform,
              companyUsername,
              analytics: null,
              error: `Error ${response.status}: ${errorText}`
            });
          }
          continue;
        }

        const analyticsData = await response.json();
        console.log(`✅ Analítica obtenida para ${companyUsername}:`, analyticsData);

        // Procesar cada plataforma en la respuesta
        for (const platform of platforms) {
          if (analyticsData[platform]) {
            analyticsResults.push({
              platform,
              companyUsername,
              analytics: analyticsData[platform]
            });
          } else {
            analyticsResults.push({
              platform,
              companyUsername,
              analytics: null,
              error: 'No hay datos disponibles para esta plataforma'
            });
          }
        }

      } catch (error: any) {
        console.error(`Error obteniendo analítica para ${companyUsername}:`, error);
        
        // Agregar resultados con error para todas las plataformas
        for (const platform of platforms) {
          analyticsResults.push({
            platform,
            companyUsername,
            analytics: null,
            error: error.message || 'Error desconocido'
          });
        }
      }
    }

    console.log('✅ Analítica obtenida exitosamente:', analyticsResults.length, 'resultados');

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsResults,
        count: analyticsResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error en get-upload-post-analytics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error interno del servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Mapear nombres de plataforma de la BD a nombres esperados por la API de UploadPost
function mapPlatformName(platform: string): string | null {
  const mapping: Record<string, string> = {
    'instagram': 'instagram',
    'facebook': 'Facebook', // Nota: API usa Facebook con mayúscula
    'linkedin': 'Linkedin', // Nota: API usa Linkedin con mayúscula
    'twitter': 'X', // Twitter ahora es X en la API
    'tiktok': 'tiktok',
    'youtube': 'youtube'
  };
  
  return mapping[platform.toLowerCase()] || null;
}
