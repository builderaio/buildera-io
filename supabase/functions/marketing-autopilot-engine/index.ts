import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── SENSE PHASE ───────────────────────────────────────────────
async function sensePhase(companyId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Gather metrics from all platforms in parallel
  const [instagram, linkedin, facebook, tiktok, campaigns, listening, approvals] = await Promise.all([
    supabase.from('instagram_posts').select('id, like_count, comment_count, reach, created_at')
      .eq('company_id', companyId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    supabase.from('linkedin_posts').select('id, likes_count, comments_count, views_count, created_at')
      .eq('company_id', companyId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    supabase.from('facebook_posts').select('id, likes_count, comments_count, created_at')
      .eq('company_id', companyId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    supabase.from('tiktok_posts').select('id, digg_count, comment_count, play_count, created_at')
      .eq('company_id', companyId).gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false }),
    supabase.from('marketing_campaigns').select('id, name, status, budget, start_date, end_date')
      .eq('company_id', companyId).in('status', ['active', 'running']),
    supabase.from('social_listening_mentions').select('id, sentiment, platform, created_at')
      .eq('company_id', companyId).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('content_approvals').select('id, status')
      .eq('company_id', companyId).eq('status', 'pending_review'),
  ]);

  // Calculate engagement metrics
  const calcEngagement = (posts: any[], likeField: string, commentField: string) => {
    if (!posts?.length) return { total: 0, avg: 0, count: 0, trend: 'stable' as string };
    const total = posts.reduce((s, p) => s + (p[likeField] || 0) + (p[commentField] || 0), 0);
    const recentPosts = posts.filter(p => new Date(p.created_at) >= sevenDaysAgo);
    const olderPosts = posts.filter(p => new Date(p.created_at) < sevenDaysAgo);
    const recentAvg = recentPosts.length ? recentPosts.reduce((s, p) => s + (p[likeField] || 0) + (p[commentField] || 0), 0) / recentPosts.length : 0;
    const olderAvg = olderPosts.length ? olderPosts.reduce((s, p) => s + (p[likeField] || 0) + (p[commentField] || 0), 0) / olderPosts.length : 0;
    const trend = recentAvg > olderAvg * 1.1 ? 'improving' : recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
    return { total, avg: posts.length ? total / posts.length : 0, count: posts.length, trend };
  };

  // Sentiment analysis
  const mentions = listening.data || [];
  const sentimentBreakdown = {
    positive: mentions.filter(m => m.sentiment === 'positive').length,
    negative: mentions.filter(m => m.sentiment === 'negative').length,
    neutral: mentions.filter(m => m.sentiment === 'neutral').length,
    total: mentions.length,
  };

  return {
    platforms: {
      instagram: calcEngagement(instagram.data || [], 'like_count', 'comment_count'),
      linkedin: calcEngagement(linkedin.data || [], 'likes_count', 'comments_count'),
      facebook: calcEngagement(facebook.data || [], 'likes_count', 'comments_count'),
      tiktok: calcEngagement(tiktok.data || [], 'digg_count', 'comment_count'),
    },
    activeCampaigns: campaigns.data || [],
    sentiment: sentimentBreakdown,
    pendingApprovals: approvals.data?.length || 0,
    collectedAt: now.toISOString(),
  };
}

// ─── THINK PHASE ───────────────────────────────────────────────
async function thinkPhase(companyId: string, senseData: any, config: any) {
  // Get brand context
  const [branding, commSettings] = await Promise.all([
    supabase.from('company_branding').select('brand_voice, visual_identity').eq('company_id', companyId).maybeSingle(),
    supabase.from('company_communication_settings').select('*').eq('company_id', companyId).maybeSingle(),
  ]);

  const systemPrompt = `You are the Marketing Autopilot AI for a business automation platform. 
You analyze marketing performance data and generate prioritized action decisions.

RULES:
- Only suggest actions from the allowed list: ${(config.allowed_actions || []).join(', ')}
- Max posts per day: ${config.max_posts_per_day}
- Consider brand tone: ${branding.data?.brand_voice ? JSON.stringify(branding.data.brand_voice) : 'professional'}
- Forbidden topics: ${commSettings.data?.topics_to_avoid?.join(', ') || 'none'}
- Content pillars: ${commSettings.data?.content_pillars?.join(', ') || 'general business'}

Respond ONLY with a valid JSON array of decisions. Each decision:
{
  "decision_type": "create_content|publish|reply_comments|adjust_campaigns|analyze",
  "priority": "critical|high|medium|low",
  "description": "What to do and why",
  "reasoning": "Data-driven justification",
  "agent_to_execute": "CONTENT_CREATOR|CAMPAIGN_OPTIMIZER|COMMUNITY_MANAGER|ANALYTICS_REPORTER",
  "action_parameters": {},
  "expected_impact": {"metric": "engagement|reach|followers", "estimated_change": "+X%"}
}`;

  const userPrompt = `Current marketing performance data:
${JSON.stringify(senseData, null, 2)}

Based on this data, what marketing actions should we take right now? Generate 1-5 prioritized decisions.`;

  // Call universal-ai-handler
  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/universal-ai-handler`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      functionName: 'marketing_autopilot',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const aiResult = await aiResponse.json();

  if (!aiResult.success) {
    throw new Error(`AI decision failed: ${aiResult.error}`);
  }

  // Parse decisions from AI response
  let decisions: any[] = [];
  try {
    const responseText = aiResult.response;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      decisions = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI decisions:', e);
    decisions = [{
      decision_type: 'analyze',
      priority: 'medium',
      description: 'Review current performance metrics manually',
      reasoning: 'AI response could not be parsed into actionable decisions',
      agent_to_execute: 'ANALYTICS_REPORTER',
      action_parameters: {},
      expected_impact: { metric: 'engagement', estimated_change: '0%' },
    }];
  }

  return decisions;
}

// ─── GUARD PHASE ───────────────────────────────────────────────
async function guardPhase(companyId: string, decisions: any[], config: any) {
  const [commSettings, platformSettings] = await Promise.all([
    supabase.from('company_communication_settings').select('forbidden_words, topics_to_avoid, tone_by_platform')
      .eq('company_id', companyId).maybeSingle(),
    supabase.from('platform_settings').select('platform, auto_publish, daily_post_limit')
      .eq('company_id', companyId),
  ]);

  const forbiddenWords = [
    ...(commSettings.data?.forbidden_words || []),
    ...(config.brand_guardrails?.forbidden_words || []),
  ];
  const topicRestrictions = [
    ...(commSettings.data?.topics_to_avoid || []),
    ...(config.brand_guardrails?.topic_restrictions || []),
  ];

  // Check active hours
  const now = new Date();
  const activeHours = config.active_hours || { start: '09:00', end: '21:00' };
  const currentHour = now.getHours();
  const startHour = parseInt(activeHours.start?.split(':')[0] || '9');
  const endHour = parseInt(activeHours.end?.split(':')[0] || '21');
  const withinActiveHours = currentHour >= startHour && currentHour <= endHour;

  return decisions.map(decision => {
    const description = (decision.description || '').toLowerCase();
    
    // Check forbidden words
    const hasForbiddenWord = forbiddenWords.some(w => description.includes(w.toLowerCase()));
    if (hasForbiddenWord) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Contains forbidden word' };
    }

    // Check topic restrictions
    const hasForbiddenTopic = topicRestrictions.some(t => description.includes(t.toLowerCase()));
    if (hasForbiddenTopic) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Contains restricted topic' };
    }

    // Check active hours for publishing actions
    if (decision.decision_type === 'publish' && !withinActiveHours) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Outside active publishing hours' };
    }

    // Check if human approval required
    if (config.require_human_approval && ['create_content', 'publish'].includes(decision.decision_type)) {
      return { ...decision, guardrail_result: 'sent_to_approval', guardrail_details: 'Human approval required by config' };
    }

    return { ...decision, guardrail_result: 'passed', guardrail_details: 'All guardrails passed' };
  });
}

// ─── ACT PHASE ─────────────────────────────────────────────────
async function actPhase(companyId: string, guardedDecisions: any[], cycleId: string) {
  const actionsExecuted: any[] = [];

  for (const decision of guardedDecisions) {
    if (decision.guardrail_result === 'blocked') {
      actionsExecuted.push({ ...decision, action_taken: false });
      continue;
    }

    if (decision.guardrail_result === 'sent_to_approval') {
      // Insert into content_approvals
      await supabase.from('content_approvals').insert({
        company_id: companyId,
        content_type: 'autopilot_decision',
        content_data: decision,
        status: 'pending_review',
        submitted_by: 'autopilot_engine',
        notes: `[Autopilot Cycle ${cycleId}] ${decision.description}`,
      });
      actionsExecuted.push({ ...decision, action_taken: false, sent_to_approval: true });
      continue;
    }

    // For passed decisions, log them as executed (actual agent execution would happen here)
    actionsExecuted.push({ ...decision, action_taken: true });
  }

  return actionsExecuted;
}

// ─── LEARN PHASE ───────────────────────────────────────────────
async function learnPhase(companyId: string, cycleId: string, decisions: any[], executionTimeMs: number) {
  // Store each decision for later impact evaluation
  const decisionRows = decisions.map(d => ({
    company_id: companyId,
    cycle_id: cycleId,
    decision_type: d.decision_type,
    priority: d.priority || 'medium',
    description: d.description,
    reasoning: d.reasoning,
    agent_to_execute: d.agent_to_execute,
    action_parameters: d.action_parameters,
    action_taken: d.action_taken || false,
    guardrail_result: d.guardrail_result,
    guardrail_details: d.guardrail_details,
    expected_impact: d.expected_impact,
  }));

  if (decisionRows.length > 0) {
    await supabase.from('autopilot_decisions').insert(decisionRows);
  }

  // Update config with last execution time
  await supabase.from('company_autopilot_config')
    .update({
      last_execution_at: new Date().toISOString(),
      total_cycles_run: undefined, // Will use raw SQL below
    })
    .eq('company_id', companyId);

  // Increment total_cycles_run
  await supabase.rpc('increment_autopilot_cycles', { p_company_id: companyId }).catch(() => {
    // RPC might not exist yet, just update manually
    console.log('RPC increment_autopilot_cycles not available, skipping increment');
  });

  return {
    decisions_stored: decisionRows.length,
    execution_time_ms: executionTimeMs,
  };
}

// ─── LOG PHASE ─────────────────────────────────────────────────
async function logPhase(companyId: string, cycleId: string, phase: string, status: string, data: any) {
  await supabase.from('autopilot_execution_log').insert({
    company_id: companyId,
    cycle_id: cycleId,
    phase,
    status,
    decisions_made: data.decisions || [],
    actions_taken: data.actions || [],
    content_generated: data.content_generated || 0,
    content_approved: data.content_approved || 0,
    content_rejected: data.content_rejected || 0,
    content_pending_review: data.content_pending_review || 0,
    credits_consumed: data.credits_consumed || 0,
    execution_time_ms: data.execution_time_ms || 0,
    error_message: data.error_message || null,
    context_snapshot: data.context_snapshot || null,
  });
}

// ─── MAIN ENGINE ───────────────────────────────────────────────
async function runAutopilotCycle(companyId: string, config: any) {
  const cycleId = crypto.randomUUID();
  const startTime = Date.now();
  console.log(`🚀 Starting autopilot cycle ${cycleId} for company ${companyId}`);

  try {
    // SENSE
    console.log('📡 Phase: SENSE');
    const senseData = await sensePhase(companyId);
    await logPhase(companyId, cycleId, 'sense', 'completed', {
      context_snapshot: senseData,
      execution_time_ms: Date.now() - startTime,
    });

    // THINK
    console.log('🧠 Phase: THINK');
    const thinkStart = Date.now();
    const decisions = await thinkPhase(companyId, senseData, config);
    await logPhase(companyId, cycleId, 'think', 'completed', {
      decisions,
      execution_time_ms: Date.now() - thinkStart,
    });

    // GUARD
    console.log('🛡️ Phase: GUARD');
    const guardStart = Date.now();
    const guardedDecisions = await guardPhase(companyId, decisions, config);
    const blocked = guardedDecisions.filter(d => d.guardrail_result === 'blocked').length;
    const pendingReview = guardedDecisions.filter(d => d.guardrail_result === 'sent_to_approval').length;
    const passed = guardedDecisions.filter(d => d.guardrail_result === 'passed').length;
    await logPhase(companyId, cycleId, 'guard', 'completed', {
      decisions: guardedDecisions,
      content_approved: passed,
      content_rejected: blocked,
      content_pending_review: pendingReview,
      execution_time_ms: Date.now() - guardStart,
    });

    // ACT
    console.log('⚡ Phase: ACT');
    const actStart = Date.now();
    const actionsExecuted = await actPhase(companyId, guardedDecisions, cycleId);
    await logPhase(companyId, cycleId, 'act', 'completed', {
      actions: actionsExecuted,
      content_generated: actionsExecuted.filter(a => a.action_taken).length,
      execution_time_ms: Date.now() - actStart,
    });

    // LEARN
    console.log('📚 Phase: LEARN');
    const learnStart = Date.now();
    const learnResult = await learnPhase(companyId, cycleId, actionsExecuted, Date.now() - startTime);
    await logPhase(companyId, cycleId, 'learn', 'completed', {
      execution_time_ms: Date.now() - learnStart,
    });

    console.log(`✅ Cycle ${cycleId} completed in ${Date.now() - startTime}ms`);
    return {
      cycle_id: cycleId,
      total_decisions: decisions.length,
      passed,
      blocked,
      pending_review: pendingReview,
      execution_time_ms: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`❌ Cycle ${cycleId} failed:`, error);
    await logPhase(companyId, cycleId, 'sense', 'failed', {
      error_message: (error as Error).message,
      execution_time_ms: Date.now() - startTime,
    });
    throw error;
  }
}

// ─── SERVE ─────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetCompanyId = body.company_id;

    // Get all companies with autopilot enabled (or a specific one)
    let query = supabase.from('company_autopilot_config')
      .select('*')
      .eq('autopilot_enabled', true);

    if (targetCompanyId) {
      query = query.eq('company_id', targetCompanyId);
    }

    const { data: configs, error } = await query;
    if (error) throw error;

    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No companies with autopilot enabled',
        results: [],
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Filter by execution frequency
    const now = new Date();
    const eligibleConfigs = configs.filter(config => {
      if (targetCompanyId) return true; // Manual trigger bypasses frequency check
      if (!config.last_execution_at) return true; // Never executed

      const lastExec = new Date(config.last_execution_at);
      const frequencyMs: Record<string, number> = {
        '1h': 3600000, '2h': 7200000, '6h': 21600000,
        '12h': 43200000, '24h': 86400000,
      };
      const interval = frequencyMs[config.execution_frequency] || 21600000;
      return (now.getTime() - lastExec.getTime()) >= interval;
    });

    const results = [];
    for (const config of eligibleConfigs) {
      try {
        const result = await runAutopilotCycle(config.company_id, config);
        results.push({ company_id: config.company_id, success: true, ...result });
      } catch (error) {
        results.push({ company_id: config.company_id, success: false, error: (error as Error).message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      companies_processed: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Autopilot engine error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
