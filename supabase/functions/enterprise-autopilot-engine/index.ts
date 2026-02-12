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

// ═══════════════════════════════════════════════════════════════
// DEPARTMENT REGISTRY: data sources, decision types, sense queries
// ═══════════════════════════════════════════════════════════════

interface DepartmentConfig {
  decisionTypes: string[];
  senseQuery: (companyId: string, range: { thirtyDaysAgo: string; sevenDaysAgo: string }) => Promise<any>;
  systemPromptContext: string;
}

const DEPARTMENT_REGISTRY: Record<string, DepartmentConfig> = {
  marketing: {
    decisionTypes: ['create_content', 'publish', 'reply_comments', 'adjust_campaigns', 'analyze', 'ab_test'],
    systemPromptContext: 'social media engagement, content creation, campaign optimization, audience growth',
    senseQuery: async (companyId, { thirtyDaysAgo, sevenDaysAgo }) => {
      const [ig, li, fb, tt, campaigns] = await Promise.all([
        supabase.from('instagram_posts').select('id, like_count, comment_count, reach, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('linkedin_posts').select('id, likes_count, comments_count, views_count, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('facebook_posts').select('id, likes_count, comments_count, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('tiktok_posts').select('id, digg_count, comment_count, play_count, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('marketing_campaigns').select('id, name, status, budget, start_date, end_date')
          .eq('company_id', companyId).in('status', ['active', 'running']),
      ]);
      const calcEng = (posts: any[], lk: string, cm: string) => {
        if (!posts?.length) return { total: 0, avg: 0, count: 0, trend: 'stable' };
        const total = posts.reduce((s, p) => s + (p[lk] || 0) + (p[cm] || 0), 0);
        const recent = posts.filter(p => new Date(p.created_at) >= new Date(sevenDaysAgo));
        const older = posts.filter(p => new Date(p.created_at) < new Date(sevenDaysAgo));
        const rAvg = recent.length ? recent.reduce((s, p) => s + (p[lk] || 0) + (p[cm] || 0), 0) / recent.length : 0;
        const oAvg = older.length ? older.reduce((s, p) => s + (p[lk] || 0) + (p[cm] || 0), 0) / older.length : 0;
        const trend = rAvg > oAvg * 1.1 ? 'improving' : rAvg < oAvg * 0.9 ? 'declining' : 'stable';
        return { total, avg: posts.length ? total / posts.length : 0, count: posts.length, trend };
      };
      return {
        platforms: {
          instagram: calcEng(ig.data || [], 'like_count', 'comment_count'),
          linkedin: calcEng(li.data || [], 'likes_count', 'comments_count'),
          facebook: calcEng(fb.data || [], 'likes_count', 'comments_count'),
          tiktok: calcEng(tt.data || [], 'digg_count', 'comment_count'),
        },
        activeCampaigns: campaigns.data || [],
      };
    },
  },

  sales: {
    decisionTypes: ['qualify_lead', 'advance_deal', 'create_proposal', 'alert_stalled', 'enrich_contact', 'forecast_pipeline'],
    systemPromptContext: 'sales pipeline, deal progression, lead qualification, revenue forecasting, proposal generation',
    senseQuery: async (companyId, { thirtyDaysAgo }) => {
      const [deals, contacts, activities] = await Promise.all([
        supabase.from('crm_deals').select('id, title, value, stage, probability, expected_close_date, updated_at, created_at')
          .eq('company_id', companyId).order('updated_at', { ascending: false }).limit(100),
        supabase.from('crm_contacts').select('id, lead_score, status, last_interaction_at, created_at')
          .eq('company_id', companyId).order('created_at', { ascending: false }).limit(100),
        supabase.from('crm_activities').select('id, activity_type, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo).limit(200),
      ]);
      const d = deals.data || [];
      const stalled = d.filter(deal => {
        const updated = new Date(deal.updated_at);
        return (Date.now() - updated.getTime()) > 7 * 86400000;
      });
      return {
        totalDeals: d.length,
        pipelineValue: d.reduce((s, deal) => s + (deal.value || 0), 0),
        stalledDeals: stalled.length,
        avgDealValue: d.length ? d.reduce((s, deal) => s + (deal.value || 0), 0) / d.length : 0,
        contactsCount: contacts.data?.length || 0,
        recentActivities: activities.data?.length || 0,
        stageDistribution: d.reduce((acc: Record<string, number>, deal) => {
          acc[deal.stage || 'unknown'] = (acc[deal.stage || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
      };
    },
  },

  finance: {
    decisionTypes: ['budget_alert', 'forecast_revenue', 'optimize_expenses', 'invoice_reminder', 'cashflow_warning', 'credit_alert'],
    systemPromptContext: 'budget monitoring, credit consumption, revenue forecasting, expense optimization, cashflow management',
    senseQuery: async (companyId, { thirtyDaysAgo }) => {
      const [usage, config, snapshots] = await Promise.all([
        supabase.from('agent_usage_log').select('credits_consumed, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo),
        supabase.from('company_autopilot_config').select('max_credits_per_cycle')
          .eq('company_id', companyId).maybeSingle(),
        supabase.from('business_health_snapshots').select('credits_consumed, estimated_conversions, snapshot_date')
          .eq('company_id', companyId).order('snapshot_date', { ascending: false }).limit(30),
      ]);
      const totalUsed = (usage.data || []).reduce((s, r) => s + (r.credits_consumed || 0), 0);
      return {
        creditsUsedThisMonth: totalUsed,
        maxCreditsPerCycle: config.data?.max_credits_per_cycle || 10,
        recentSnapshots: (snapshots.data || []).slice(0, 7),
        burnRate: (usage.data || []).length > 0 ? totalUsed / (usage.data!.length) : 0,
      };
    },
  },

  legal: {
    decisionTypes: ['review_contract', 'compliance_alert', 'deadline_reminder', 'regulatory_update', 'risk_assessment'],
    systemPromptContext: 'contract review, compliance monitoring, regulatory changes, legal deadlines, risk assessment',
    senseQuery: async (companyId) => {
      // Legal sense checks company parameters for contract-related data
      const [params] = await Promise.all([
        supabase.from('company_parameters').select('parameter_key, parameter_value, updated_at')
          .eq('company_id', companyId)
          .like('parameter_key', 'legal_%'),
      ]);
      return {
        legalParameters: params.data || [],
        parametersCount: params.data?.length || 0,
      };
    },
  },

  hr: {
    decisionTypes: ['create_job_profile', 'climate_survey', 'talent_match', 'performance_review', 'training_recommendation'],
    systemPromptContext: 'talent management, job profiling, employee climate, performance evaluation, training needs',
    senseQuery: async (companyId) => {
      const [members, params] = await Promise.all([
        supabase.from('company_members').select('id, role, joined_at')
          .eq('company_id', companyId),
        supabase.from('company_parameters').select('parameter_key, parameter_value')
          .eq('company_id', companyId).like('parameter_key', 'hr_%'),
      ]);
      return {
        teamSize: members.data?.length || 0,
        roles: (members.data || []).reduce((acc: Record<string, number>, m) => {
          acc[m.role || 'member'] = (acc[m.role || 'member'] || 0) + 1;
          return acc;
        }, {}),
        hrParameters: params.data || [],
      };
    },
  },

  operations: {
    decisionTypes: ['optimize_process', 'sla_alert', 'automate_task', 'bottleneck_detection', 'efficiency_report'],
    systemPromptContext: 'process optimization, SLA monitoring, task automation, bottleneck detection, operational efficiency',
    senseQuery: async (companyId, { thirtyDaysAgo }) => {
      const [tasks, usage] = await Promise.all([
        supabase.from('ai_workforce_team_tasks').select('id, status, task_type, started_at, completed_at')
          .in('team_id', (await supabase.from('ai_workforce_teams').select('id').eq('company_id', companyId)).data?.map(t => t.id) || []),
        supabase.from('agent_usage_log').select('execution_time_ms, status, created_at')
          .eq('company_id', companyId).gte('created_at', thirtyDaysAgo),
      ]);
      const t = tasks.data || [];
      const completed = t.filter(tk => tk.status === 'completed');
      const avgTime = completed.length ? completed.reduce((s, tk) => {
        if (tk.started_at && tk.completed_at) return s + (new Date(tk.completed_at).getTime() - new Date(tk.started_at).getTime());
        return s;
      }, 0) / completed.length : 0;
      return {
        totalTasks: t.length,
        completedTasks: completed.length,
        pendingTasks: t.filter(tk => tk.status === 'pending').length,
        avgCompletionTimeMs: avgTime,
        agentExecutions: usage.data?.length || 0,
        failureRate: usage.data?.length ? usage.data.filter(u => u.status === 'error').length / usage.data.length : 0,
      };
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// EXTERNAL INTELLIGENCE LAYER
// ═══════════════════════════════════════════════════════════════

async function gatherExternalIntelligence(companyId: string, maturityLevel: string) {
  // Check frequency: starter=weekly, growing=3d, established=daily, scaling=every cycle
  const freqHours: Record<string, number> = { starter: 168, growing: 72, established: 24, scaling: 0 };
  const maxAge = freqHours[maturityLevel] ?? 72;

  if (maxAge > 0) {
    const cutoff = new Date(Date.now() - maxAge * 3600000).toISOString();
    const { data: cached } = await supabase.from('external_intelligence_cache')
      .select('id').eq('company_id', companyId).gte('fetched_at', cutoff).limit(1);
    if (cached?.length) {
      // Return cached intelligence
      const { data } = await supabase.from('external_intelligence_cache')
        .select('source, data, structured_signals, relevance_score')
        .eq('company_id', companyId).gte('expires_at', new Date().toISOString())
        .order('relevance_score', { ascending: false }).limit(10);
      return data || [];
    }
  }

  // Fetch company profile for context
  const { data: company } = await supabase.from('companies')
    .select('name, industry_sector, country, description')
    .eq('id', companyId).single();

  if (!company?.industry_sector) return [];

  const year = new Date().getFullYear();
  const queries = [
    { source: 'industry_news', query: `${company.industry_sector} industry trends ${year}` },
    { source: 'macroeconomic', query: `macroeconomic outlook ${company.country || 'global'} ${year}` },
    { source: 'technology', query: `${company.industry_sector} technology innovations AI automation ${year}` },
  ];

  if (company.country) {
    queries.push({ source: 'regulatory', query: `new business regulations ${company.country} ${company.industry_sector} ${year}` });
  }

  const results: any[] = [];

  for (const q of queries) {
    try {
      const aiRes = await fetch(`${supabaseUrl}/functions/v1/openai-responses-handler`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'external_intelligence',
          model: 'gpt-4o-mini',
          input: `Search for: ${q.query}. Summarize the top 3 findings as JSON array: [{"title":"...","summary":"...","impact":"high|medium|low","category":"opportunity|threat|neutral"}]`,
          tools: [{ type: 'web_search_preview' }],
        }),
      });
      const aiResult = await aiRes.json();
      if (aiResult.success) {
        const parsed = tryParseJson(aiResult.response);
        await supabase.from('external_intelligence_cache').insert({
          company_id: companyId,
          source: q.source as any,
          region: company.country,
          industry_sector: company.industry_sector,
          query_used: q.query,
          data: { raw: aiResult.response },
          structured_signals: parsed || [],
          relevance_score: 0.7,
          expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
        });
        results.push({ source: q.source, signals: parsed || [] });
      }
    } catch (e) {
      console.error(`External intelligence fetch failed for ${q.source}:`, e);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// MEMORY-AUGMENTED REASONING
// ═══════════════════════════════════════════════════════════════

async function retrieveMemory(companyId: string, department: string) {
  const { data } = await supabase.from('autopilot_memory')
    .select('decision_type, outcome_score, outcome_evaluation, lesson_learned, applies_to_future')
    .eq('company_id', companyId)
    .eq('department', department)
    .in('outcome_evaluation', ['positive', 'negative'])
    .order('evaluated_at', { ascending: false })
    .limit(10);

  if (!data?.length) return null;

  const lessons = data.filter(m => m.lesson_learned).map(m =>
    `- [${m.outcome_evaluation}] ${m.decision_type}: ${m.lesson_learned}`
  ).join('\n');

  const rules = data.flatMap(m => (m.applies_to_future as any[]) || []);

  return { lessons, rules, count: data.length };
}

// ═══════════════════════════════════════════════════════════════
// CORE CYCLE: SENSE → THINK → GUARD → ACT → LEARN
// ═══════════════════════════════════════════════════════════════

async function sensePhase(companyId: string, department: string) {
  const reg = DEPARTMENT_REGISTRY[department];
  if (!reg) throw new Error(`Unknown department: ${department}`);

  const now = new Date();
  const range = {
    thirtyDaysAgo: new Date(now.getTime() - 30 * 86400000).toISOString(),
    sevenDaysAgo: new Date(now.getTime() - 7 * 86400000).toISOString(),
  };

  return await reg.senseQuery(companyId, range);
}

async function thinkPhase(companyId: string, department: string, senseData: any, deptConfig: any, externalIntel: any[], memory: any) {
  const reg = DEPARTMENT_REGISTRY[department];

  // Get brand context
  const { data: branding } = await supabase.from('company_branding')
    .select('brand_voice').eq('company_id', companyId).maybeSingle();

  let memoryBlock = '';
  if (memory?.lessons) {
    memoryBlock = `\n\nLESSONS FROM PAST DECISIONS (use these to make better decisions):\n${memory.lessons}`;
    if (memory.rules?.length) {
      memoryBlock += `\n\nRULES EXTRACTED:\n${memory.rules.map((r: any) => `- ${typeof r === 'string' ? r : JSON.stringify(r)}`).join('\n')}`;
    }
  }

  let externalBlock = '';
  if (externalIntel?.length) {
    externalBlock = `\n\nEXTERNAL INTELLIGENCE (market, industry, macro signals):\n${JSON.stringify(externalIntel.slice(0, 5), null, 2)}`;
  }

  const systemPrompt = `You are the Enterprise Autopilot AI for the ${department.toUpperCase()} department.
You analyze business data and generate prioritized action decisions for: ${reg!.systemPromptContext}.

RULES:
- Only use decision types from: ${reg!.decisionTypes.join(', ')}
- Max actions per cycle: ${deptConfig.max_posts_per_day || 5}
- Allowed actions: ${(deptConfig.allowed_actions || reg!.decisionTypes).join(', ')}
- Brand tone: ${branding?.brand_voice ? JSON.stringify(branding.brand_voice) : 'professional'}
${memoryBlock}
${externalBlock}

Respond ONLY with a valid JSON array of decisions. Each decision:
{
  "decision_type": "one of the allowed types",
  "priority": "critical|high|medium|low",
  "description": "What to do and why",
  "reasoning": "Data-driven justification including any external signals considered",
  "agent_to_execute": "AGENT_CODE matching this department",
  "action_parameters": {},
  "expected_impact": {"metric": "relevant_metric", "estimated_change": "+X%"},
  "external_signal_influence": true/false
}`;

  const userPrompt = `Current ${department} performance data:\n${JSON.stringify(senseData, null, 2)}\n\nBased on this data, what actions should we take? Generate 1-5 prioritized decisions.`;

  const aiResponse = await fetch(`${supabaseUrl}/functions/v1/universal-ai-handler`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      functionName: 'enterprise_autopilot',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const aiResult = await aiResponse.json();
  if (!aiResult.success) throw new Error(`AI decision failed: ${aiResult.error}`);

  let decisions: any[] = [];
  try {
    const jsonMatch = aiResult.response.match(/\[[\s\S]*\]/);
    if (jsonMatch) decisions = JSON.parse(jsonMatch[0]);
  } catch {
    decisions = [{
      decision_type: 'analyze',
      priority: 'medium',
      description: `Review current ${department} performance metrics`,
      reasoning: 'AI response could not be parsed',
      agent_to_execute: 'ANALYTICS_REPORTER',
      action_parameters: {},
      expected_impact: { metric: 'insight', estimated_change: '0%' },
    }];
  }

  return decisions;
}

async function guardPhase(companyId: string, department: string, decisions: any[], deptConfig: any) {
  const now = new Date();
  const currentHour = now.getHours();
  const activeHours = deptConfig.active_hours || { start: '09:00', end: '21:00' };
  const startH = parseInt(activeHours.start?.split(':')[0] || '9');
  const endH = parseInt(activeHours.end?.split(':')[0] || '21');
  const withinActive = currentHour >= startH && currentHour <= endH;

  const guardrails = deptConfig.guardrails || {};
  const forbiddenWords: string[] = guardrails.forbidden_words || [];
  const topicRestrictions: string[] = guardrails.topic_restrictions || [];

  // Cross-departmental checks
  let crossBlockReason: string | null = null;
  if (department === 'marketing' || department === 'sales') {
    // Check if finance has flagged budget concerns
    const { data: financeParams } = await supabase.from('company_parameters')
      .select('parameter_value').eq('company_id', companyId).eq('parameter_key', 'finance_budget_status').maybeSingle();
    if (financeParams?.parameter_value === 'exceeded') {
      crossBlockReason = `Finance department has flagged budget exceeded - ${department} spending actions blocked`;
    }
  }

  return decisions.map(decision => {
    const desc = (decision.description || '').toLowerCase();

    if (crossBlockReason && ['create_content', 'publish', 'create_proposal', 'adjust_campaigns'].includes(decision.decision_type)) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: crossBlockReason };
    }
    if (forbiddenWords.some(w => desc.includes(w.toLowerCase()))) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Contains forbidden word' };
    }
    if (topicRestrictions.some(t => desc.includes(t.toLowerCase()))) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Contains restricted topic' };
    }
    if (['publish', 'create_content'].includes(decision.decision_type) && !withinActive) {
      return { ...decision, guardrail_result: 'blocked', guardrail_details: 'Outside active hours' };
    }
    if (deptConfig.require_human_approval && ['create_content', 'publish', 'create_proposal', 'review_contract'].includes(decision.decision_type)) {
      return { ...decision, guardrail_result: 'sent_to_approval', guardrail_details: 'Human approval required' };
    }
    return { ...decision, guardrail_result: 'passed', guardrail_details: 'All guardrails passed' };
  });
}

async function actPhase(companyId: string, department: string, guardedDecisions: any[], cycleId: string) {
  const results: any[] = [];

  // Resolve agent mappings for this department
  const { data: agents } = await supabase.from('platform_agents')
    .select('id, internal_code, name, edge_function_name, credits_per_use')
    .eq('department', department).eq('is_active', true);
  
  const agentMap = new Map((agents || []).map(a => [a.internal_code, a]));

  for (const decision of guardedDecisions) {
    if (decision.guardrail_result === 'blocked') {
      results.push({ ...decision, action_taken: false });
      continue;
    }
    if (decision.guardrail_result === 'sent_to_approval') {
      await supabase.from('content_approvals').insert({
        company_id: companyId,
        content_type: `autopilot_${department}_decision`,
        content_data: decision,
        status: 'pending_review',
        submitted_by: 'enterprise_autopilot_engine',
        notes: `[Enterprise Autopilot ${department}] [Cycle ${cycleId}] ${decision.description}`,
      });
      results.push({ ...decision, action_taken: false, sent_to_approval: true });
      continue;
    }

    // Real agent execution
    const agentCode = decision.agent_to_execute;
    const agent = agentMap.get(agentCode);
    
    if (agent?.edge_function_name) {
      try {
        console.log(`⚡ [${department}] Invoking agent: ${agent.name} (${agent.edge_function_name})`);
        const execStart = Date.now();
        
        const agentRes = await fetch(`${supabaseUrl}/functions/v1/${agent.edge_function_name}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: companyId,
            department,
            decision_type: decision.decision_type,
            parameters: decision.action_parameters || {},
            cycle_id: cycleId,
            autopilot: true,
          }),
        });
        
        const agentResult = await agentRes.json();
        const execTime = Date.now() - execStart;
        
        // Log usage
        await supabase.from('agent_usage_log').insert({
          agent_id: agent.id,
          company_id: companyId,
          status: agentResult.success !== false ? 'completed' : 'failed',
          credits_consumed: agent.credits_per_use || 1,
          execution_time_ms: execTime,
          input_data: decision.action_parameters,
          output_data: agentResult,
          output_summary: agentResult.summary || decision.description,
          error_message: agentResult.error || null,
        });
        
        results.push({ ...decision, action_taken: true, execution_result: agentResult.success !== false ? 'success' : 'failed' });
      } catch (err) {
        console.error(`❌ Agent execution failed for ${agentCode}:`, err);
        results.push({ ...decision, action_taken: true, execution_result: 'error', execution_error: (err as Error).message });
      }
    } else {
      // No agent mapped - log the decision as taken
      console.log(`⚠️ [${department}] No agent mapped for code: ${agentCode}`);
      results.push({ ...decision, action_taken: true, execution_result: 'no_agent_mapped' });
    }
  }

  return results;
}

async function learnPhase(companyId: string, department: string, cycleId: string, decisions: any[], executionTimeMs: number) {
  // Store decisions for impact evaluation
  const rows = decisions.map(d => ({
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

  if (rows.length) {
    await supabase.from('autopilot_decisions').insert(rows);
  }

  // Store in memory for future reasoning
  const memoryRows = decisions.filter(d => d.action_taken).map(d => ({
    company_id: companyId,
    department,
    cycle_id: cycleId,
    decision_type: d.decision_type,
    context_summary: d.reasoning,
    external_signal_used: d.external_signal_influence || false,
    outcome_evaluation: 'pending',
  }));

  if (memoryRows.length) {
    await supabase.from('autopilot_memory').insert(memoryRows);
  }

  // Evaluate past decisions (older than 7 days, still pending)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: pendingEvals } = await supabase.from('autopilot_memory')
    .select('id, decision_type, context_summary, created_at')
    .eq('company_id', companyId).eq('department', department)
    .eq('outcome_evaluation', 'pending')
    .lte('created_at', sevenDaysAgo).limit(5);

  if (pendingEvals?.length) {
    // Simple auto-evaluation: mark as neutral if no actual_impact data is available
    for (const pe of pendingEvals) {
      await supabase.from('autopilot_memory').update({
        outcome_evaluation: 'neutral',
        outcome_score: 0,
        lesson_learned: `Decision "${pe.decision_type}" was executed but no measurable impact data was available for evaluation.`,
        evaluated_at: new Date().toISOString(),
      }).eq('id', pe.id);
    }
  }

  // Update config
  await supabase.from('company_department_config')
    .update({ last_execution_at: new Date().toISOString() })
    .eq('company_id', companyId).eq('department', department);

  return { decisions_stored: rows.length, memory_entries: memoryRows.length };
}

async function logExecution(companyId: string, cycleId: string, department: string, phase: string, status: string, data: any) {
  await supabase.from('department_execution_log').insert({
    company_id: companyId,
    cycle_id: cycleId,
    department,
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

// ═══════════════════════════════════════════════════════════════
// CAPABILITY EVOLUTION
// ═══════════════════════════════════════════════════════════════

async function evaluateCapabilities(companyId: string) {
  const { data: caps } = await supabase.from('autopilot_capabilities')
    .select('*').eq('company_id', companyId).eq('is_active', false);

  if (!caps?.length) return [];

  const activated: string[] = [];

  for (const cap of caps) {
    const cond = cap.trigger_condition as any;
    let shouldActivate = false;

    // Evaluate trigger conditions dynamically
    if (cond.min_deals) {
      const { count } = await supabase.from('crm_deals').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) >= cond.min_deals) shouldActivate = true;
    }
    if (cond.min_contacts) {
      const { count } = await supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) >= cond.min_contacts) shouldActivate = true;
    }
    if (cond.min_posts) {
      const { count } = await supabase.from('instagram_posts').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) >= cond.min_posts) shouldActivate = true;
    }
    if (cond.min_agent_executions) {
      const { count } = await supabase.from('agent_usage_log').select('id', { count: 'exact', head: true }).eq('company_id', companyId);
      if ((count || 0) >= cond.min_agent_executions) shouldActivate = true;
    }

    if (shouldActivate) {
      await supabase.from('autopilot_capabilities').update({
        is_active: true,
        activated_at: new Date().toISOString(),
        activation_reason: `Trigger conditions met: ${JSON.stringify(cond)}`,
        last_evaluated_at: new Date().toISOString(),
      }).eq('id', cap.id);
      activated.push(cap.capability_code);
    }
  }

  return activated;
}

// ═══════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

async function runDepartmentCycle(companyId: string, department: string, deptConfig: any, maturityLevel: string) {
  const cycleId = crypto.randomUUID();
  const startTime = Date.now();
  console.log(`🚀 [${department.toUpperCase()}] Starting cycle ${cycleId} for company ${companyId}`);

  try {
    // SENSE
    console.log(`📡 [${department}] SENSE`);
    const senseData = await sensePhase(companyId, department);
    await logExecution(companyId, cycleId, department, 'sense', 'completed', {
      context_snapshot: senseData, execution_time_ms: Date.now() - startTime,
    });

    // EXTERNAL INTELLIGENCE
    console.log(`🌐 [${department}] EXTERNAL INTELLIGENCE`);
    const externalIntel = await gatherExternalIntelligence(companyId, maturityLevel);

    // MEMORY RETRIEVAL
    console.log(`🧠 [${department}] MEMORY`);
    const memory = await retrieveMemory(companyId, department);

    // THINK
    console.log(`💭 [${department}] THINK`);
    const thinkStart = Date.now();
    const decisions = await thinkPhase(companyId, department, senseData, deptConfig, externalIntel, memory);
    await logExecution(companyId, cycleId, department, 'think', 'completed', {
      decisions, execution_time_ms: Date.now() - thinkStart,
    });

    // GUARD
    console.log(`🛡️ [${department}] GUARD`);
    const guardStart = Date.now();
    const guarded = await guardPhase(companyId, department, decisions, deptConfig);
    const blocked = guarded.filter(d => d.guardrail_result === 'blocked').length;
    const pending = guarded.filter(d => d.guardrail_result === 'sent_to_approval').length;
    const passed = guarded.filter(d => d.guardrail_result === 'passed').length;
    await logExecution(companyId, cycleId, department, 'guard', 'completed', {
      decisions: guarded, content_approved: passed, content_rejected: blocked,
      content_pending_review: pending, execution_time_ms: Date.now() - guardStart,
    });

    // ACT
    console.log(`⚡ [${department}] ACT`);
    const actStart = Date.now();
    const actions = await actPhase(companyId, department, guarded, cycleId);
    await logExecution(companyId, cycleId, department, 'act', 'completed', {
      actions, content_generated: actions.filter(a => a.action_taken).length,
      execution_time_ms: Date.now() - actStart,
    });

    // LEARN
    console.log(`📚 [${department}] LEARN`);
    await learnPhase(companyId, department, cycleId, actions, Date.now() - startTime);

    console.log(`✅ [${department}] Cycle ${cycleId} done in ${Date.now() - startTime}ms`);
    return { department, cycle_id: cycleId, total_decisions: decisions.length, passed, blocked, pending_review: pending, execution_time_ms: Date.now() - startTime };
  } catch (error) {
    console.error(`❌ [${department}] Cycle failed:`, error);
    await logExecution(companyId, cycleId, department, 'error', 'failed', {
      error_message: (error as Error).message, execution_time_ms: Date.now() - startTime,
    });
    return { department, cycle_id: cycleId, success: false, error: (error as Error).message };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function tryParseJson(text: string): any[] | null {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : null;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════════
// SERVE
// ═══════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const targetCompanyId = body.company_id;
    const targetDepartment = body.department; // optional: run only one department

    // Get all companies with departments enabled
    let query = supabase.from('company_department_config')
      .select('*').eq('autopilot_enabled', true);

    if (targetCompanyId) query = query.eq('company_id', targetCompanyId);
    if (targetDepartment) query = query.eq('department', targetDepartment);

    const { data: configs, error } = await query;
    if (error) throw error;

    if (!configs?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No active departments', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Frequency check
    const now = Date.now();
    const eligible = configs.filter(c => {
      if (targetCompanyId) return true; // manual trigger bypasses
      if (!c.last_execution_at) return true;
      const freqMs: Record<string, number> = { '1h': 3600000, '2h': 7200000, '6h': 21600000, '12h': 43200000, '24h': 86400000 };
      return (now - new Date(c.last_execution_at).getTime()) >= (freqMs[c.execution_frequency] || 21600000);
    });

    // Group by company for capability evaluation
    const companies = [...new Set(eligible.map(c => c.company_id))];
    const capResults: Record<string, string[]> = {};
    for (const cId of companies) {
      capResults[cId] = await evaluateCapabilities(cId);
    }

    // Run cycles
    const results = [];
    for (const config of eligible) {
      const result = await runDepartmentCycle(config.company_id, config.department, config, config.maturity_level_required || 'starter');
      results.push({ company_id: config.company_id, ...result, capabilities_activated: capResults[config.company_id] || [] });
    }

    return new Response(JSON.stringify({
      success: true,
      departments_processed: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Enterprise autopilot engine error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
