import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Obtener el usuario autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { platform } = await req.json();
    const userId = user.id;
    
    console.log(`Calculando analytics para usuario ${userId}, plataforma: ${platform || 'todas'}`);

    // Función para calcular analytics de Instagram
    const calculateInstagramAnalytics = async () => {
      const { data: posts, error } = await supabaseClient
        .from('instagram_posts')
        .select('*')
        .eq('user_id', userId)
        .gte('posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0);
      const totalFollowers = posts[0]?.profile_followers_count || 0;
      const avgEngagement = totalFollowers > 0 ? ((totalLikes + totalComments) / totalFollowers / totalPosts) * 100 : 0;

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();

      return [
        {
          user_id: userId,
          platform: 'instagram',
          metric_type: 'total_posts',
          value: totalPosts,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'instagram',
          metric_type: 'total_likes',
          value: totalLikes,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'instagram',
          metric_type: 'total_comments',
          value: totalComments,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'instagram',
          metric_type: 'avg_engagement_rate',
          value: Math.round(avgEngagement * 100) / 100,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days', total_followers: totalFollowers }
        }
      ];
    };

    // Función para calcular analytics de LinkedIn
    const calculateLinkedInAnalytics = async () => {
      const { data: posts, error } = await supabaseClient
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', userId)
        .gte('posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalShares = posts.reduce((sum, post) => sum + (post.shares_count || 0), 0);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();

      return [
        {
          user_id: userId,
          platform: 'linkedin',
          metric_type: 'total_posts',
          value: totalPosts,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'linkedin',
          metric_type: 'total_likes',
          value: totalLikes,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'linkedin',
          metric_type: 'total_comments',
          value: totalComments,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'linkedin',
          metric_type: 'total_shares',
          value: totalShares,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        }
      ];
    };

    // Función para calcular analytics de Facebook
    const calculateFacebookAnalytics = async () => {
      const { data: posts, error } = await supabaseClient
        .from('facebook_posts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalShares = posts.reduce((sum, post) => sum + (post.shares_count || 0), 0);
      const totalReactions = posts.reduce((sum, post) => sum + (post.reactions_count || 0), 0);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();

      return [
        {
          user_id: userId,
          platform: 'facebook',
          metric_type: 'total_posts',
          value: totalPosts,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'facebook',
          metric_type: 'total_likes',
          value: totalLikes,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'facebook',
          metric_type: 'total_comments',
          value: totalComments,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'facebook',
          metric_type: 'total_shares',
          value: totalShares,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'facebook',
          metric_type: 'total_reactions',
          value: totalReactions,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        }
      ];
    };

    // Función para calcular analytics de TikTok
    const calculateTikTokAnalytics = async () => {
      const { data: posts, error } = await supabaseClient
        .from('tiktok_posts')
        .select('*')
        .eq('user_id', userId)
        .gte('posted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;
      if (!posts || posts.length === 0) return [];

      const totalPosts = posts.length;
      const totalViews = posts.reduce((sum, post) => sum + (post.play_count || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.digg_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0);

      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();

      return [
        {
          user_id: userId,
          platform: 'tiktok',
          metric_type: 'total_posts',
          value: totalPosts,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'tiktok',
          metric_type: 'total_views',
          value: totalViews,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'tiktok',
          metric_type: 'total_likes',
          value: totalLikes,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        },
        {
          user_id: userId,
          platform: 'tiktok',
          metric_type: 'total_comments',
          value: totalComments,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          period_type: 'monthly',
          metadata: { timeframe: '30_days' }
        }
      ];
    };

    // Calcular analytics para todas las plataformas
    let analyticsData = [];
    
    if (!platform || platform === 'instagram') {
      const instagramAnalytics = await calculateInstagramAnalytics();
      analyticsData.push(...instagramAnalytics);
    }
    
    if (!platform || platform === 'linkedin') {
      const linkedinAnalytics = await calculateLinkedInAnalytics();
      analyticsData.push(...linkedinAnalytics);
    }
    
    if (!platform || platform === 'facebook') {
      const facebookAnalytics = await calculateFacebookAnalytics();
      analyticsData.push(...facebookAnalytics);
    }
    
    if (!platform || platform === 'tiktok') {
      const tiktokAnalytics = await calculateTikTokAnalytics();
      analyticsData.push(...tiktokAnalytics);
    }

    // Guardar analytics en la base de datos
    if (analyticsData.length > 0) {
      // Eliminar analytics existentes del período
      const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabaseClient
        .from('social_media_analytics')
        .delete()
        .eq('user_id', userId)
        .gte('period_start', periodStart);

      // Insertar nuevos analytics
      const { error: insertError } = await supabaseClient
        .from('social_media_analytics')
        .insert(analyticsData);

      if (insertError) throw insertError;
    }

    console.log(`Analytics calculados: ${analyticsData.length} métricas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics: analyticsData.length,
        message: `Se calcularon ${analyticsData.length} métricas de analytics`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculando analytics:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});