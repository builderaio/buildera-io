import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * MARKETING DIAGNOSTIC FEEDBACK LOOP
 * 
 * Implements the Larry methodology diagnostic matrix:
 * 
 * | Views       | Conversions | Action                                        |
 * |-------------|-------------|-----------------------------------------------|
 * | 🟢 High     | 🟢 High    | SCALE IT — make 3 variations of winning hook  |
 * | 🟢 High     | 🔴 Low     | FIX THE CTA — hook works, downstream broken   |
 * | 🔴 Low      | 🟢 High    | FIX THE HOOKS — content converts, needs reach  |
 * | 🔴 Low      | 🔴 Low     | FULL RESET — try radically different approach  |
 * 
 * Integrates with enterprise-autopilot-engine LEARN phase.
 */

interface DiagnosticResult {
  action: 'scale_it' | 'fix_cta' | 'fix_hooks' | 'full_reset';
  views_level: 'high' | 'low';
  conversions_level: 'high' | 'low';
  reasoning: string;
  recommended_actions: string[];
  platform_breakdown: Record<string, any>;
}

async function gatherMetrics(companyId: string, days: number = 7) {
  // Get company owner
  const { data: company } = await supabase.from('companies')
    .select('created_by').eq('id', companyId).single();
  
  if (!company?.created_by) throw new Error('Company not found');
  const userId = company.created_by;

  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  // Gather engagement from all platforms
  const [ig, li, fb, tk, scheduled] = await Promise.all([
    supabase.from('instagram_posts')
      .select('id, like_count, comment_count, reach, impressions_count, created_at')
      .eq('user_id', userId).gte('created_at', cutoff),
    supabase.from('linkedin_posts')
      .select('id, likes_count, comments_count, views_count, created_at')
      .eq('user_id', userId).gte('created_at', cutoff),
    supabase.from('facebook_posts')
      .select('id, likes_count, comments_count, created_at')
      .eq('user_id', userId).gte('created_at', cutoff),
    supabase.from('tiktok_posts')
      .select('id, digg_count, comment_count, play_count, share_count, created_at')
      .eq('user_id', userId).gte('created_at', cutoff),
    supabase.from('scheduled_social_posts')
      .select('id, status, platform, upload_post_response, created_at')
      .eq('user_id', userId).gte('created_at', cutoff),
  ]);

  const calcPlatform = (posts: any[] | null, viewsKey: string, engKeys: string[]) => {
    if (!posts?.length) return { views: 0, engagements: 0, count: 0 };
    const views = posts.reduce((s, p) => s + (p[viewsKey] || 0), 0);
    const engagements = posts.reduce((s, p) => engKeys.reduce((sum, k) => sum + (p[k] || 0), s), 0);
    return { views, engagements, count: posts.length };
  };

  const platforms: Record<string, any> = {
    instagram: calcPlatform(ig.data, 'reach', ['like_count', 'comment_count']),
    linkedin: calcPlatform(li.data, 'views_count', ['likes_count', 'comments_count']),
    facebook: calcPlatform(fb.data, 'likes_count', ['likes_count', 'comments_count']),
    tiktok: calcPlatform(tk.data, 'play_count', ['digg_count', 'comment_count', 'share_count']),
  };

  const totalViews = Object.values(platforms).reduce((s: number, p: any) => s + (p.views || 0), 0);
  const totalEngagements = Object.values(platforms).reduce((s: number, p: any) => s + (p.engagements || 0), 0);
  const totalPosts = Object.values(platforms).reduce((s: number, p: any) => s + (p.count || 0), 0);

  // Conversions: count successful scheduled posts as proxy
  const successfulPosts = (scheduled.data || []).filter(p => p.status === 'published' || p.status === 'completed').length;

  return {
    totalViews,
    totalEngagements,
    totalPosts,
    conversions: successfulPosts,
    platforms,
    period_days: days,
  };
}

function diagnose(
  metrics: any,
  viewsThreshold: number = 1000,
  conversionsThreshold: number = 5,
): DiagnosticResult {
  const viewsHigh = metrics.totalViews >= viewsThreshold;
  const conversionsHigh = metrics.conversions >= conversionsThreshold;

  let action: DiagnosticResult['action'];
  let reasoning: string;
  let recommended_actions: string[];

  if (viewsHigh && conversionsHigh) {
    action = 'scale_it';
    reasoning = `Views (${metrics.totalViews}) and conversions (${metrics.conversions}) are both above threshold. Content is performing well.`;
    recommended_actions = [
      'Create 3 variations of the winning hook with slight tweaks',
      'Increase posting frequency to 3x/day',
      'Cross-post top performers to all platforms',
      'A/B test caption length and hashtag strategies',
      'Consider paid amplification on best performers',
    ];
  } else if (viewsHigh && !conversionsHigh) {
    action = 'fix_cta';
    reasoning = `Views are strong (${metrics.totalViews}) but conversions are low (${metrics.conversions}). Hook works, downstream is broken.`;
    recommended_actions = [
      'Rewrite CTA to be more specific and urgent',
      'Add clearer value proposition in slides 4-6',
      'Test different CTA positions (slide 5 vs 6)',
      'Add social proof/testimonials before CTA',
      'Simplify the conversion path (fewer steps)',
    ];
  } else if (!viewsHigh && conversionsHigh) {
    action = 'fix_hooks';
    reasoning = `Views are low (${metrics.totalViews}) but conversion rate is high (${metrics.conversions}). Content converts well, needs more eyeballs.`;
    recommended_actions = [
      'Test new hook formulas (Person+Conflict, Budget Pain)',
      'Use trending sounds and hashtags',
      'Post at different times (test peak hours)',
      'Improve thumbnail/first-frame quality',
      'Collaborate with micro-influencers for reach',
    ];
  } else {
    action = 'full_reset';
    reasoning = `Both views (${metrics.totalViews}) and conversions (${metrics.conversions}) are below threshold. Need a radically different approach.`;
    recommended_actions = [
      'FULL RESET: Try a completely different content angle',
      'Research competitor content that IS working',
      'Switch visual style (minimal → bold, or vice versa)',
      'Change target audience or pain point focus',
      'Try different content formats (video vs carousel vs story)',
    ];
  }

  return {
    action,
    views_level: viewsHigh ? 'high' : 'low',
    conversions_level: conversionsHigh ? 'high' : 'low',
    reasoning,
    recommended_actions,
    platform_breakdown: metrics.platforms,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { company_id, days = 7, views_threshold = 1000, conversions_threshold = 5, source = 'manual' } = body;

    if (!company_id) throw new Error('company_id is required');

    console.log(`📊 Running diagnostic for company ${company_id} (${days} days)`);

    // Gather metrics
    const metrics = await gatherMetrics(company_id, days);
    console.log(`📈 Metrics: ${metrics.totalViews} views, ${metrics.totalEngagements} engagements, ${metrics.conversions} conversions`);

    // Run diagnostic
    const diagnostic = diagnose(metrics, views_threshold, conversions_threshold);
    console.log(`🎯 Diagnostic: ${diagnostic.action}`);

    // Persist snapshot
    await supabase.from('marketing_diagnostic_snapshots').insert({
      company_id,
      cycle_id: `diag_${Date.now()}`,
      total_views: metrics.totalViews,
      total_engagements: metrics.totalEngagements,
      total_conversions: metrics.conversions,
      views_level: diagnostic.views_level,
      conversions_level: diagnostic.conversions_level,
      diagnostic_action: diagnostic.action,
      diagnostic_reasoning: diagnostic.reasoning,
      recommended_actions: diagnostic.recommended_actions,
      platform_breakdown: diagnostic.platform_breakdown,
      views_threshold,
      conversions_threshold,
    });

    // If called from autopilot, feed back into memory
    if (source === 'autopilot') {
      await supabase.from('autopilot_memory').insert({
        company_id,
        department: 'marketing',
        cycle_id: `diag_${Date.now()}`,
        decision_type: `diagnostic_${diagnostic.action}`,
        context_summary: diagnostic.reasoning,
        outcome_evaluation: 'pending',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      diagnostic: {
        action: diagnostic.action,
        views_level: diagnostic.views_level,
        conversions_level: diagnostic.conversions_level,
        reasoning: diagnostic.reasoning,
        recommended_actions: diagnostic.recommended_actions,
      },
      metrics: {
        total_views: metrics.totalViews,
        total_engagements: metrics.totalEngagements,
        total_conversions: metrics.conversions,
        total_posts: metrics.totalPosts,
        period_days: days,
      },
      platform_breakdown: diagnostic.platform_breakdown,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
