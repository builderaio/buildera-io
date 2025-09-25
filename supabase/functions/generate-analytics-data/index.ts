import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting analytics data generation...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generar datos de analytics basados en datos reales
    const analyticsData = [];
    
    // Obtener datos reales de la base de datos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('created_at, user_type');
    
    const { data: linkedinConnections } = await supabase
      .from('linkedin_connections')
      .select('created_at');
    
    const { data: facebookConnections } = await supabase
      .from('facebook_instagram_connections')
      .select('created_at');
    
    const { data: tiktokConnections } = await supabase
      .from('tiktok_connections')
      .select('created_at');
    
    const { data: socialPosts } = await supabase
      .from('social_media_posts')
      .select('created_at, platform');
    
    const { data: aiLogs } = await supabase
      .from('ai_model_status_logs')
      .select('created_at, provider');
    
    // Calcular métricas para los últimos 30 días
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Generar métricas diarias para los últimos 30 días
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filtrar datos por día
      const dailyProfiles = profiles?.filter(p => 
        p.created_at.startsWith(dateStr)
      ) || [];
      
      const dailyLinkedIn = linkedinConnections?.filter(c => 
        c.created_at.startsWith(dateStr)
      ) || [];
      
      const dailyFacebook = facebookConnections?.filter(c => 
        c.created_at.startsWith(dateStr)
      ) || [];
      
      const dailyTikTok = tiktokConnections?.filter(c => 
        c.created_at.startsWith(dateStr)
      ) || [];
      
      const dailyPosts = socialPosts?.filter(p => 
        p.created_at.startsWith(dateStr)
      ) || [];
      
      const dailyAI = aiLogs?.filter(l => 
        l.created_at.startsWith(dateStr)
      ) || [];
      
      // Agregar métricas para este día
      analyticsData.push(
        {
          metric_name: 'daily_user_registrations',
          metric_value: dailyProfiles.length,
          metric_type: 'counter',
          platform: 'all',
          period_start: date.toISOString(),
          metadata: {
            companies: dailyProfiles.filter(p => p.user_type === 'company').length,
            developers: dailyProfiles.filter(p => p.user_type === 'developer').length,
            experts: dailyProfiles.filter(p => p.user_type === 'expert').length
          }
        },
        {
          metric_name: 'daily_linkedin_connections',
          metric_value: dailyLinkedIn.length,
          metric_type: 'counter',
          platform: 'linkedin',
          period_start: date.toISOString(),
          metadata: { description: 'New LinkedIn connections' }
        },
        {
          metric_name: 'daily_facebook_connections',
          metric_value: dailyFacebook.length,
          metric_type: 'counter',
          platform: 'facebook',
          period_start: date.toISOString(),
          metadata: { description: 'New Facebook connections' }
        },
        {
          metric_name: 'daily_tiktok_connections',
          metric_value: dailyTikTok.length,
          metric_type: 'counter',
          platform: 'tiktok',
          period_start: date.toISOString(),
          metadata: { description: 'New TikTok connections' }
        },
        {
          metric_name: 'daily_content_generation',
          metric_value: dailyPosts.length,
          metric_type: 'counter',
          platform: 'all',
          period_start: date.toISOString(),
          metadata: {
            linkedin: dailyPosts.filter(p => p.platform === 'linkedin').length,
            facebook: dailyPosts.filter(p => p.platform === 'facebook').length,
            instagram: dailyPosts.filter(p => p.platform === 'instagram').length,
            tiktok: dailyPosts.filter(p => p.platform === 'tiktok').length
          }
        },
        {
          metric_name: 'daily_ai_requests',
          metric_value: dailyAI.length,
          metric_type: 'counter',
          platform: 'all',
          period_start: date.toISOString(),
          metadata: {
            openai: dailyAI.filter(l => l.provider === 'OpenAI').length,
            anthropic: dailyAI.filter(l => l.provider === 'Anthropic').length,
            google: dailyAI.filter(l => l.provider === 'Google').length
          }
        }
      );
    }
    
    // Limpiar datos antiguos antes de insertar nuevos
    await supabase
      .from('system_analytics')
      .delete()
      .gte('period_start', thirtyDaysAgo.toISOString());
    
    // Insertar nuevas métricas en lotes
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < analyticsData.length; i += batchSize) {
      const batch = analyticsData.slice(i, i + batchSize);
      const { error } = await supabase
        .from('system_analytics')
        .insert(batch);
      
      if (error) {
        console.error('Error inserting analytics batch:', error);
        throw error;
      }
      
      insertedCount += batch.length;
    }
    
    console.log(`Successfully generated ${insertedCount} analytics records`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        records_generated: insertedCount,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Analytics generation failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});