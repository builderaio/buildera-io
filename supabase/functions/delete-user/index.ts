import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();
    if (!userId) throw new Error('Se requiere userId');

    console.log(`Iniciando eliminación del usuario: ${userId}`);

    // Helper to safely delete from a table
    const safeDelete = async (table: string, column = 'user_id') => {
      try {
        await supabaseAdmin.from(table).delete().eq(column, userId);
      } catch (e) {
        console.warn(`Skipping ${table}: ${(e as Error).message}`);
      }
    };

    // Social connections
    await safeDelete('linkedin_connections');
    await safeDelete('facebook_instagram_connections');
    await safeDelete('tiktok_connections');
    await safeDelete('instagram_business_connections');

    // Social posts & content
    await safeDelete('instagram_posts');
    await safeDelete('linkedin_posts');
    await safeDelete('tiktok_posts');
    await safeDelete('facebook_posts');
    await safeDelete('social_media_calendar');
    await safeDelete('social_media_comments');
    await safeDelete('scheduled_posts');
    await safeDelete('scheduled_social_posts');

    // Social analytics & followers
    await safeDelete('tiktok_followers');
    await safeDelete('tiktok_following');
    await safeDelete('tiktok_user_data');
    await safeDelete('instagram_followers_detailed');
    await safeDelete('followers_location_analysis');
    await safeDelete('social_media_analytics');
    await safeDelete('social_activity_analysis');
    await safeDelete('social_analysis');
    await safeDelete('social_content_analysis');
    await safeDelete('social_retrospective_analysis');
    await safeDelete('facebook_page_data');
    await safeDelete('instagram_content_analysis');

    // Content
    await safeDelete('content_recommendations');
    await safeDelete('content_library');
    await safeDelete('content_insights');
    await safeDelete('content_clusters');
    await safeDelete('content_embeddings');
    await safeDelete('completed_content_ideas');
    await safeDelete('generated_content');

    // Marketing
    await safeDelete('marketing_campaigns');
    await safeDelete('marketing_insights');
    await safeDelete('marketing_actionables');
    await safeDelete('marketing_onboarding_status');

    // Competitive
    await safeDelete('competitive_analysis_sessions');
    await safeDelete('competitive_intelligence');

    // Audience
    await safeDelete('audience_analysis');
    await safeDelete('audience_insights');
    await safeDelete('custom_audiences');
    await safeDelete('company_audiences');

    // Agents & AI
    await safeDelete('agent_usage_log');
    await safeDelete('company_agent_configurations');
    await safeDelete('company_agents');
    await safeDelete('ai_tutor_sessions');
    await safeDelete('ai_assessments');
    await safeDelete('ai_workforce_teams');

    // Dashboard & alerts
    await safeDelete('dashboard_alerts');
    await safeDelete('company_dashboard_metrics');
    await safeDelete('company_external_data');
    await safeDelete('company_files');
    await safeDelete('data_processing_jobs');
    await safeDelete('system_analytics');
    await safeDelete('security_events');

    // Branding & strategy
    await safeDelete('company_branding');
    await safeDelete('company_strategy');

    // Onboarding
    await safeDelete('onboarding_wow_results');
    await safeDelete('push_subscriptions');
    await safeDelete('social_accounts');

    // Products
    await safeDelete('products');

    // Profiles (developer/expert)
    await safeDelete('developer_profiles');
    await safeDelete('expert_public_profiles');
    await safeDelete('experts');

    // Gamification & learning
    await safeDelete('user_badges');
    await safeDelete('user_gamification');
    await safeDelete('user_guided_tour');
    await safeDelete('user_learning_progress');
    await safeDelete('user_tutorials');
    await safeDelete('user_credentials');
    await safeDelete('user_roles');

    // Subscriptions
    await safeDelete('subscription_usage');
    await safeDelete('user_subscriptions');

    // Memberships
    await safeDelete('company_members');

    // Onboarding status
    await safeDelete('user_onboarding_status');

    // Profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);
    
    if (profileError) {
      console.error('Error eliminando perfil:', profileError);
      throw profileError;
    }

    // Finally delete from auth.users
    console.log('Eliminando usuario de auth.users...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error eliminando usuario de auth:', authError);
      throw authError;
    }

    console.log(`Usuario ${userId} eliminado exitosamente`);

    return new Response(
      JSON.stringify({ success: true, message: 'Usuario eliminado exitosamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
