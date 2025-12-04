import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Se requiere userId');
    }

    console.log(`Iniciando eliminación del usuario: ${userId}`);

    // 1. Primero eliminar todas las relaciones en las tablas principales
    console.log('Eliminando registros relacionados...');
    
    // Eliminar conexiones sociales
    await supabaseAdmin.from('linkedin_connections').delete().eq('user_id', userId);
    await supabaseAdmin.from('facebook_instagram_connections').delete().eq('user_id', userId);
    await supabaseAdmin.from('tiktok_connections').delete().eq('user_id', userId);
    
    // Eliminar posts y contenido social
    await supabaseAdmin.from('instagram_posts').delete().eq('user_id', userId);
    await supabaseAdmin.from('linkedin_posts').delete().eq('user_id', userId);
    await supabaseAdmin.from('tiktok_posts').delete().eq('user_id', userId);
    await supabaseAdmin.from('social_media_calendar').delete().eq('user_id', userId);
    await supabaseAdmin.from('social_media_comments').delete().eq('user_id', userId);
    
    // Eliminar followers y análisis
    await supabaseAdmin.from('tiktok_followers').delete().eq('user_id', userId);
    await supabaseAdmin.from('instagram_followers_detailed').delete().eq('user_id', userId);
    await supabaseAdmin.from('followers_location_analysis').delete().eq('user_id', userId);
    
    // Eliminar contenido y recomendaciones
    await supabaseAdmin.from('content_recommendations').delete().eq('user_id', userId);
    await supabaseAdmin.from('instagram_content_analysis').delete().eq('user_id', userId);
    
    // Eliminar configuraciones de agentes (nueva arquitectura)
    await supabaseAdmin.from('agent_usage_log').delete().eq('user_id', userId);
    await supabaseAdmin.from('company_agent_configurations').delete().eq('user_id', userId);
    await supabaseAdmin.from('company_agents').delete().eq('user_id', userId);
    
    // Eliminar sesiones de tutorías y aprendizaje
    await supabaseAdmin.from('ai_tutor_sessions').delete().eq('user_id', userId);
    
    // Eliminar alertas y branding
    await supabaseAdmin.from('dashboard_alerts').delete().eq('user_id', userId);
    await supabaseAdmin.from('company_branding').delete().eq('user_id', userId);
    await supabaseAdmin.from('company_strategy').delete().eq('user_id', userId);
    
    // Eliminar suscripciones y uso
    await supabaseAdmin.from('subscription_usage').delete().eq('user_id', userId);
    await supabaseAdmin.from('user_subscriptions').delete().eq('user_id', userId);
    
    // 2. Eliminar membresías de empresas
    await supabaseAdmin.from('company_members').delete().eq('user_id', userId);
    
    // 3. Eliminar estado de onboarding
    await supabaseAdmin.from('user_onboarding_status').delete().eq('user_id', userId);
    
    // 4. Eliminar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Error eliminando perfil:', profileError);
      throw profileError;
    }

    // 5. Finalmente eliminar del auth.users
    console.log('Eliminando usuario de auth.users...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error eliminando usuario de auth:', authError);
      throw authError;
    }

    console.log(`Usuario ${userId} eliminado exitosamente`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuario eliminado exitosamente' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
