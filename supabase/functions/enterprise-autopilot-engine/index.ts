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
// DEPARTMENT → CATEGORY MAPPING (platform_agents uses 'category', not 'department')
// ═══════════════════════════════════════════════════════════════

const DEPT_CATEGORY_MAP: Record<string, string[]> = {
  marketing: ['marketing', 'content', 'analytics', 'branding'],
  sales: ['sales'],
  finance: ['finance'],
  legal: ['legal'],
  hr: ['hr'],
  operations: ['operations'],
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
      // Post tables use user_id, not company_id — resolve owner
      const { data: companyRow } = await supabase.from('companies')
        .select('created_by').eq('id', companyId).single();
      const ownerUserId = companyRow?.created_by;
      if (!ownerUserId) return { platforms: {}, activeCampaigns: [] };

      const [ig, li, fb, tt, campaigns] = await Promise.all([
        supabase.from('instagram_posts').select('id, like_count, comment_count, reach, created_at')
          .eq('user_id', ownerUserId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('linkedin_posts').select('id, likes_count, comments_count, views_count, created_at')
          .eq('user_id', ownerUserId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('facebook_posts').select('id, likes_count, comments_count, created_at')
          .eq('user_id', ownerUserId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
        supabase.from('tiktok_posts').select('id, digg_count, comment_count, play_count, created_at')
          .eq('user_id', ownerUserId).gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }).limit(50),
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

function generateContextHash(department: string, decisionType: string, actionParams: any): string {
  const raw = `${department}:${decisionType}:${JSON.stringify(actionParams || {})}`;
  // Simple hash: base64 of first 64 chars for Deno compatibility
  const encoder = new TextEncoder();
  const encoded = encoder.encode(raw);
  let hash = 0;
  for (let i = 0; i < encoded.length; i++) {
    hash = ((hash << 5) - hash + encoded[i]) | 0;
  }
  return btoa(String(Math.abs(hash))).substring(0, 16);
}

async function retrieveMemory(companyId: string, department: string, currentContextHash?: string) {
  // ═══ GAP 2: CONTEXT-HASH BASED RETRIEVAL ═══
  // First try to find memories with matching context_hash for similarity
  let contextMatches: any[] = [];
  if (currentContextHash) {
    const { data: hashMatches } = await supabase.from('autopilot_memory')
      .select('decision_type, outcome_score, outcome_evaluation, lesson_learned, applies_to_future')
      .eq('company_id', companyId)
      .eq('department', department)
      .eq('context_hash', currentContextHash)
      .in('outcome_evaluation', ['positive', 'negative'])
      .order('evaluated_at', { ascending: false })
      .limit(5);
    contextMatches = hashMatches || [];
  }

  const { data } = await supabase.from('autopilot_memory')
    .select('decision_type, outcome_score, outcome_evaluation, lesson_learned, applies_to_future')
    .eq('company_id', companyId)
    .eq('department', department)
    .in('outcome_evaluation', ['positive', 'negative'])
    .order('evaluated_at', { ascending: false })
    .limit(10);

  const allMemory = [...contextMatches, ...(data || [])];
  // Deduplicate
  const seen = new Set<string>();
  const unique = allMemory.filter(m => {
    const key = `${m.decision_type}:${m.lesson_learned}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!unique.length) return null;

  const lessons = unique.filter(m => m.lesson_learned).map(m =>
    `- [${m.outcome_evaluation}] ${m.decision_type}: ${m.lesson_learned}`
  ).join('\n');

  const rules = unique.flatMap(m => (m.applies_to_future as any[]) || []);

  return { lessons, rules, count: unique.length };
}

// ═══════════════════════════════════════════════════════════════
// PREFLIGHT: validate minimum data requirements per department
// ═══════════════════════════════════════════════════════════════

interface PreflightResult {
  ready: boolean;
  reason?: string;
  missing: string[];
}

async function preflightCheck(companyId: string, department: string): Promise<PreflightResult> {
  const missing: string[] = [];

  if (department === 'marketing') {
    const { data: socialAccounts } = await supabase.from('social_accounts')
      .select('id, platform')
      .eq('is_connected', true)
      .not('platform', 'eq', 'upload_post_profile');

    const { data: members } = await supabase.from('company_members')
      .select('user_id').eq('company_id', companyId);

    const connectedAccounts = (socialAccounts || []).length;

    // Resolve owner user_id (posts use user_id, not company_id)
    const { data: companyRow } = await supabase.from('companies')
      .select('created_by').eq('id', companyId).single();
    const ownerUserId = companyRow?.created_by;

    const [igCount, liCount, fbCount, tkCount] = await Promise.all([
      supabase.from('instagram_posts').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId || ''),
      supabase.from('linkedin_posts').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId || ''),
      supabase.from('facebook_posts').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId || ''),
      supabase.from('tiktok_posts').select('id', { count: 'exact', head: true }).eq('user_id', ownerUserId || ''),
    ]);
    const totalPosts = (igCount.count || 0) + (liCount.count || 0) + (fbCount.count || 0) + (tkCount.count || 0);

    if (connectedAccounts === 0) missing.push('social_accounts_connected');
    if (totalPosts < 5) missing.push('social_posts_minimum');

    if (connectedAccounts === 0 && totalPosts < 5) {
      return {
        ready: false,
        reason: `Marketing requires at least 1 connected social account or 5+ imported posts. Found: ${connectedAccounts} accounts, ${totalPosts} posts.`,
        missing,
      };
    }
  }

  if (department === 'sales') {
    const [deals, contacts] = await Promise.all([
      supabase.from('crm_deals').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);
    if ((deals.count || 0) === 0 && (contacts.count || 0) === 0) {
      missing.push('crm_data');
      return { ready: false, reason: 'Sales requires at least 1 deal or 1 contact in CRM.', missing };
    }
  }

  if (department === 'finance') {
    const [usage, snapshots] = await Promise.all([
      supabase.from('agent_usage_log').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      supabase.from('business_health_snapshots').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
    ]);
    if ((usage.count || 0) === 0 && (snapshots.count || 0) === 0) {
      missing.push('finance_activity');
      return { ready: false, reason: 'Finance requires at least some platform activity (agent executions or health snapshots).', missing };
    }
  }

  if (department === 'legal') {
    const { data: legalParams } = await supabase.from('company_parameters')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId).like('parameter_key', 'legal_%');
    if ((legalParams as any)?.count === 0 || !legalParams) {
      // Use count query properly
      const { count } = await supabase.from('company_parameters')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).like('parameter_key', 'legal_%');
      if ((count || 0) === 0) {
        missing.push('legal_parameters');
        return { ready: false, reason: 'Legal requires at least 1 legal parameter configured.', missing };
      }
    }
  }

  if (department === 'hr') {
    const { count } = await supabase.from('company_members')
      .select('id', { count: 'exact', head: true }).eq('company_id', companyId);
    if ((count || 0) < 2) {
      missing.push('hr_team_members');
      return { ready: false, reason: 'HR requires at least 2 team members registered.', missing };
    }
  }

  if (department === 'operations') {
    const { count } = await supabase.from('ai_workforce_teams')
      .select('id', { count: 'exact', head: true }).eq('company_id', companyId);
    if ((count || 0) === 0) {
      missing.push('operations_teams');
      return { ready: false, reason: 'Operations requires at least 1 AI workforce team configured.', missing };
    }
  }

  return { ready: true, missing };
}

function checkDataSufficiency(department: string, senseData: any): { sufficient: boolean; reason?: string } {
  if (department === 'marketing') {
    const platforms = senseData?.platforms || {};
    const totalCount = Object.values(platforms).reduce((sum: number, p: any) => sum + (p?.count || 0), 0);
    const hasCampaigns = (senseData?.activeCampaigns?.length || 0) > 0;
    if (totalCount === 0 && !hasCampaigns) {
      return { sufficient: false, reason: 'All platforms have 0 posts and no active campaigns. Cannot generate meaningful decisions.' };
    }
  }

  if (department === 'sales') {
    if ((senseData?.totalDeals || 0) === 0 && (senseData?.contactsCount || 0) === 0) {
      return { sufficient: false, reason: 'No deals or contacts found. Cannot generate sales decisions.' };
    }
  }

  if (department === 'finance') {
    if ((senseData?.creditsUsedThisMonth || 0) === 0 && (senseData?.recentSnapshots?.length || 0) === 0) {
      return { sufficient: false, reason: 'No credit usage or health snapshots found. Cannot generate finance decisions.' };
    }
  }

  if (department === 'legal') {
    if ((senseData?.parametersCount || 0) === 0) {
      return { sufficient: false, reason: 'No legal parameters configured. Cannot generate legal decisions.' };
    }
  }

  if (department === 'hr') {
    if ((senseData?.teamSize || 0) < 2) {
      return { sufficient: false, reason: 'Insufficient team data. Need at least 2 members for HR decisions.' };
    }
  }

  if (department === 'operations') {
    if ((senseData?.totalTasks || 0) === 0 && (senseData?.agentExecutions || 0) === 0) {
      return { sufficient: false, reason: 'No tasks or agent executions found. Cannot generate operations decisions.' };
    }
  }

  return { sufficient: true };
}

// ═══════════════════════════════════════════════════════════════
// CORE CYCLE: PREFLIGHT → SENSE → THINK → GUARD → ACT → LEARN
// ═══════════════════════════════════════════════════════════════

async function sensePhase(companyId: string, department: string) {
  const reg = DEPARTMENT_REGISTRY[department];
  if (!reg) throw new Error(`Unknown department: ${department}`);

  const now = new Date();
  const range = {
    thirtyDaysAgo: new Date(now.getTime() - 30 * 86400000).toISOString(),
    sevenDaysAgo: new Date(now.getTime() - 7 * 86400000).toISOString(),
  };

  const senseData = await reg.senseQuery(companyId, range);

  // ═══ GAP 4: COMPETITOR DATA IN SENSE ═══
  // For marketing and sales, incorporate company_competitors into the snapshot
  if (department === 'marketing' || department === 'sales') {
    try {
      const { data: competitors } = await supabase.from('company_competitors')
        .select('competitor_name, website_url, strengths, weaknesses, is_direct_competitor, priority_level')
        .eq('company_id', companyId)
        .order('priority_level', { ascending: true })
        .limit(10);

      if (competitors?.length) {
        senseData.competitors = competitors.map((c: any) => ({
          name: c.competitor_name,
          website: c.website_url,
          strengths: c.strengths || [],
          weaknesses: c.weaknesses || [],
          is_direct: c.is_direct_competitor,
          priority: c.priority_level,
        }));
        console.log(`🏢 [${department}] Loaded ${competitors.length} competitors into sense data`);
      }
    } catch (compErr) {
      console.warn(`⚠️ [${department}] Failed to load competitors (non-blocking):`, compErr);
    }
  }

  return senseData;
}

async function thinkPhase(companyId: string, department: string, senseData: any, deptConfig: any, externalIntel: any[], memory: any) {
  const reg = DEPARTMENT_REGISTRY[department];

  // Get brand context
  const { data: branding } = await supabase.from('company_branding')
    .select('brand_voice').eq('company_id', companyId).maybeSingle();

  // Fetch REAL available agents for this department's categories
  const categories = DEPT_CATEGORY_MAP[department] || [];
  const { data: availableAgents } = await supabase.from('platform_agents')
    .select('internal_code, name, edge_function_name, execution_type')
    .in('category', categories).eq('is_active', true);

  // ═══ GAP 5: INTEGRATE ACTIVE CAPABILITIES INTO THINK ═══
  const { data: activeCapabilities } = await supabase.from('autopilot_capabilities')
    .select('capability_code, capability_name, trigger_condition, required_data, description')
    .eq('company_id', companyId)
    .eq('department', department)
    .eq('is_active', true);

  const agentListBlock = (availableAgents || []).length > 0
    ? `\n\nAVAILABLE AGENTS (use ONLY these internal_code values for agent_to_execute):\n${
        (availableAgents || []).map(a => {
          const status = a.edge_function_name ? 'ready' : 'pending implementation';
          return `- ${a.internal_code}: ${a.name} (${status})`;
        }).join('\n')
      }\nIf no agent fits the action, set agent_to_execute to null.`
    : '\n\nNO AGENTS AVAILABLE for this department yet. Set agent_to_execute to null for all decisions.';

  let capabilitiesBlock = '';
  if (activeCapabilities?.length) {
    capabilitiesBlock = `\n\nACTIVE_CAPABILITIES (autonomous capabilities you can also leverage for decisions - use capability_code as agent_to_execute if appropriate):\n${
      activeCapabilities.map(c => {
        const reqData = c.required_data ? ` | Data: ${JSON.stringify(c.required_data)}` : '';
        return `- ${c.capability_code}: ${c.capability_name} — ${c.description || 'No description'}${reqData} | Trigger: ${JSON.stringify(c.trigger_condition)}`;
      }).join('\n')
    }\nYou may generate decisions that leverage these capabilities when their trigger conditions match the current data.`;
  }

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
${agentListBlock}
${capabilitiesBlock}
${memoryBlock}
${externalBlock}

Respond ONLY with a valid JSON array of decisions. Each decision:
{
  "decision_type": "one of the allowed types",
  "priority": "critical|high|medium|low",
  "risk_level": "low|medium|high|critical",
  "description": "What to do and why",
  "reasoning": "Data-driven justification including any external signals considered",
  "agent_to_execute": "AGENT_CODE from the AVAILABLE AGENTS list above, or null if none fits",
  "action_parameters": {},
  "expected_impact": {"metric": "relevant_metric", "estimated_change": "+X%"},
  "external_signal_influence": true/false
}

RISK_LEVEL GUIDE (mandatory for each decision):
- "low": Internal operational tasks with no spend or external impact (insights, metrics, dashboards)
- "medium": Actions generating internal content or reversible adjustments (drafts, calendar changes)
- "high": Actions affecting budget, clients, or brand (publishing, proposals, deal advancement)
- "critical": Strategic decisions compromising legal obligations or pricing`;

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
    console.warn(`⚠️ [${department}] AI response could not be parsed. Skipping decision generation.`);
    decisions = [];
  }

  // ═══ POST-AI RISK LEVEL VALIDATION ═══
  // Assign risk_level by default based on decision_type if AI didn't provide it
  const RISK_DEFAULTS: Record<string, string> = {
    analyze: 'low', forecast_pipeline: 'low', climate_survey: 'low', efficiency_report: 'low',
    bottleneck_detection: 'low', performance_review: 'low', sla_alert: 'low',
    create_content: 'medium', adjust_campaigns: 'medium', create_job_profile: 'medium',
    ab_test: 'medium', training_recommendation: 'medium', optimize_process: 'medium', automate_task: 'medium',
    publish: 'high', create_proposal: 'high', advance_deal: 'high', reply_comments: 'high',
    qualify_lead: 'medium', enrich_contact: 'medium', alert_stalled: 'medium',
    budget_alert: 'medium', forecast_revenue: 'medium', optimize_expenses: 'medium',
    invoice_reminder: 'medium', cashflow_warning: 'high', credit_alert: 'medium',
    review_contract: 'critical', compliance_alert: 'high', deadline_reminder: 'medium',
    regulatory_update: 'high', risk_assessment: 'high', talent_match: 'medium',
  };

  decisions = decisions.map(d => {
    if (!d.risk_level || !['low', 'medium', 'high', 'critical'].includes(d.risk_level)) {
      d.risk_level = RISK_DEFAULTS[d.decision_type] || 'medium';
    }
    // Special case: compliance_alert with financial impact → critical
    if (d.decision_type === 'compliance_alert' && d.action_parameters?.financial_impact) {
      d.risk_level = 'critical';
    }
    return d;
  });

  // ═══ L1: MULTI-CRITERIA SCORER & PRIORITY QUEUE ═══
  // Assign auditable priority_score (0-100) based on weighted criteria
  const priorityWeights: Record<string, number> = { critical: 1.0, high: 0.75, medium: 0.5, low: 0.25 };
  
  decisions = decisions.map(d => {
    const urgencyScore = (priorityWeights[d.priority] || 0.5) * 100; // 0-100
    const impactScore = d.expected_impact?.estimated_change 
      ? Math.min(100, Math.abs(parseFloat(String(d.expected_impact.estimated_change).replace(/[^0-9.-]/g, '')) || 0) * 5)
      : 30;
    const strategicScore = d.reasoning?.length > 100 ? 70 : d.reasoning?.length > 50 ? 50 : 30;
    const evidenceScore = d.external_signal_influence ? 80 : (d.action_parameters && Object.keys(d.action_parameters).length > 0 ? 60 : 30);

    const priority_score = Math.round(
      urgencyScore * 0.3 + impactScore * 0.3 + strategicScore * 0.2 + evidenceScore * 0.2
    );

    return {
      ...d,
      priority_score,
      scoring_breakdown: { urgency: urgencyScore, impact: impactScore, strategic: strategicScore, evidence: evidenceScore },
    };
  });

  // Sort by priority_score descending (Priority Queue)
  decisions.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));

  console.log(`🎯 [${department}] Scored & sorted ${decisions.length} decisions. Top score: ${decisions[0]?.priority_score || 'N/A'}`);

  return decisions;
}

// ═══════════════════════════════════════════════════════════════
// SECTOR COMPLIANCE RULES
// ═══════════════════════════════════════════════════════════════

const SECTOR_COMPLIANCE_RULES: Record<string, (decision: any) => { escalate?: string; block?: string } | null> = {
  fintech: (decision) => {
    if (decision.decision_type === 'create_proposal' && !decision.action_parameters?.compliance_alert_cleared) {
      return { block: 'Fintech: create_proposal requires prior compliance_alert clearance' };
    }
    if (decision.action_parameters?.monetary_value || decision.action_parameters?.financial_impact) {
      return { escalate: 'requires_approval' };
    }
    return null;
  },
  healthcare: (decision) => {
    if (['publish', 'create_proposal', 'create_content'].includes(decision.decision_type) && !decision.action_parameters?.legal_review_cleared) {
      return { escalate: 'escalated' };
    }
    return null;
  },
  salud: (decision) => {
    if (['publish', 'create_proposal', 'create_content'].includes(decision.decision_type) && !decision.action_parameters?.legal_review_cleared) {
      return { escalate: 'escalated' };
    }
    return null;
  },
  retail: (decision) => {
    if (decision.action_parameters?.discount || decision.action_parameters?.pricing_change) {
      return { escalate: 'requires_approval' };
    }
    return null;
  },
  services: () => null,
};

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

  // ═══ L3: CROSS-DEPARTMENTAL CHECKS ═══
  let crossBlockReason: string | null = null;

  // Finance → Marketing/Sales budget block
  if (department === 'marketing' || department === 'sales') {
    const { data: financeParams } = await supabase.from('company_parameters')
      .select('parameter_value').eq('company_id', companyId).eq('parameter_key', 'finance_budget_status').maybeSingle();
    if (financeParams?.parameter_value === 'exceeded') {
      crossBlockReason = `Finance department has flagged budget exceeded - ${department} spending actions blocked`;
    }
  }

  // ═══ L3: LEGAL → SALES COMPLIANCE CHECK ═══
  let legalBlockReason: string | null = null;
  if (department === 'sales') {
    const { data: legalStatus } = await supabase.from('company_parameters')
      .select('parameter_value').eq('company_id', companyId).eq('parameter_key', 'legal_compliance_status').maybeSingle();
    if (legalStatus?.parameter_value === 'review_required') {
      legalBlockReason = 'Legal department requires compliance review before sales actions can proceed';
    }
  }

  // ═══ L3: RATE LIMITER PER ACTION TYPE (last 24h) ═══
  const maxActionsPerDay = deptConfig.max_actions_per_day || 10;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
  const { data: recentActions } = await supabase.from('autopilot_decisions')
    .select('decision_type')
    .eq('company_id', companyId)
    .eq('action_taken', true)
    .gte('created_at', twentyFourHoursAgo);

  const actionCounts = (recentActions || []).reduce((acc: Record<string, number>, d) => {
    acc[d.decision_type] = (acc[d.decision_type] || 0) + 1;
    return acc;
  }, {});

  // ═══ L3: DAILY CREDIT BUDGET CHECK ═══
  const dailyCreditLimit = deptConfig.daily_credit_limit || 50;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayUsage } = await supabase.from('agent_usage_log')
    .select('credits_consumed')
    .eq('company_id', companyId)
    .gte('created_at', todayStart.toISOString());
  const creditsUsedToday = (todayUsage || []).reduce((s, r) => s + (r.credits_consumed || 0), 0);
  const budgetExceeded = creditsUsedToday >= dailyCreditLimit;

  // ═══ CAMPAIGN BUDGET CAPS ═══
  const campaignBudgetCache = new Map<string, { budget: number; consumed: number }>();

  // ═══ DEPARTMENT BUDGET ALLOCATION ═══
  let deptBudgetStatus: { limit: number; consumed: number } | null = null;
  try {
    const deptBudgetKey = `department_budget_${department}`;
    const { data: deptBudgetParam } = await supabase.from('company_parameters')
      .select('parameter_value').eq('company_id', companyId).eq('parameter_key', deptBudgetKey).eq('is_current', true).maybeSingle();

    if (deptBudgetParam?.parameter_value) {
      const budgetLimit = typeof deptBudgetParam.parameter_value === 'number'
        ? deptBudgetParam.parameter_value
        : parseFloat(String(deptBudgetParam.parameter_value)) || 0;

      if (budgetLimit > 0) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const categories = DEPT_CATEGORY_MAP[department] || [];
        let deptCreditsConsumed = 0;

        if (categories.length > 0) {
          const { data: deptAgents } = await supabase.from('platform_agents')
            .select('id').in('category', categories).eq('is_active', true);
          const agentIds = (deptAgents || []).map(a => a.id);

          if (agentIds.length > 0) {
            const { data: monthUsage } = await supabase.from('agent_usage_log')
              .select('credits_consumed')
              .eq('company_id', companyId)
              .in('agent_id', agentIds)
              .gte('created_at', monthStart.toISOString());
            deptCreditsConsumed = (monthUsage || []).reduce((s, r) => s + (r.credits_consumed || 0), 0);
          }
        }

        deptBudgetStatus = { limit: budgetLimit, consumed: deptCreditsConsumed };
      }
    }
  } catch (deptBudgetErr) {
    console.warn(`⚠️ [${department}] Department budget check failed (non-blocking):`, deptBudgetErr);
  }

  // ═══ SECTOR COMPLIANCE ═══
  let industrySector: string | null = null;
  try {
    const { data: companyData } = await supabase.from('companies')
      .select('industry_sector').eq('id', companyId).single();
    industrySector = companyData?.industry_sector?.toLowerCase() || null;
  } catch {}

  // ═══ PROCESS EACH DECISION ═══
  const guardedDecisions = [];

  for (const decision of decisions) {
    const desc = (decision.description || '').toLowerCase();
    let guardrail_result = 'auto_approved';
    let guardrail_details = 'All guardrails passed';
    let wasIntervened = false;
    const interventionReasons: string[] = [];

    // ─── HARD GUARDRAILS (block regardless of risk) ───

    // Budget block (Finance cross-dept)
    if (crossBlockReason && ['create_content', 'publish', 'create_proposal', 'adjust_campaigns'].includes(decision.decision_type)) {
      guardrail_result = 'blocked';
      guardrail_details = crossBlockReason;
      wasIntervened = true;
      interventionReasons.push(`finance_cross_dept: ${crossBlockReason}`);
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Legal → Sales block
    if (legalBlockReason && ['create_proposal', 'advance_deal'].includes(decision.decision_type)) {
      guardrail_result = 'blocked';
      guardrail_details = legalBlockReason;
      wasIntervened = true;
      interventionReasons.push(`legal_cross_dept: ${legalBlockReason}`);
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Daily credit budget exceeded
    if (budgetExceeded) {
      guardrail_result = 'blocked';
      guardrail_details = `Daily credit limit exceeded (${creditsUsedToday}/${dailyCreditLimit})`;
      wasIntervened = true;
      interventionReasons.push(`daily_budget: ${guardrail_details}`);
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Rate limiter per action type
    if ((actionCounts[decision.decision_type] || 0) >= maxActionsPerDay) {
      guardrail_result = 'blocked';
      guardrail_details = `Rate limit exceeded for ${decision.decision_type} (${actionCounts[decision.decision_type]}/${maxActionsPerDay} in 24h)`;
      wasIntervened = true;
      interventionReasons.push(`rate_limit: ${guardrail_details}`);
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Forbidden words
    if (forbiddenWords.some(w => desc.includes(w.toLowerCase()))) {
      guardrail_result = 'blocked';
      guardrail_details = 'Contains forbidden word';
      wasIntervened = true;
      interventionReasons.push('forbidden_words');
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Topic restrictions
    if (topicRestrictions.some(t => desc.includes(t.toLowerCase()))) {
      guardrail_result = 'blocked';
      guardrail_details = 'Contains restricted topic';
      wasIntervened = true;
      interventionReasons.push('topic_restriction');
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // Active hours block for publishing
    if (['publish', 'create_content'].includes(decision.decision_type) && !withinActive) {
      guardrail_result = 'blocked';
      guardrail_details = 'Outside active hours';
      wasIntervened = true;
      interventionReasons.push('active_hours');
      guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
      continue;
    }

    // ─── CAMPAIGN BUDGET CAP ───
    const campaignId = decision.action_parameters?.campaign_id;
    if (campaignId && ['create_content', 'publish', 'adjust_campaigns'].includes(decision.decision_type)) {
      try {
        if (!campaignBudgetCache.has(campaignId)) {
          const { data: campaign } = await supabase.from('marketing_campaigns')
            .select('budget').eq('id', campaignId).maybeSingle();
          const campaignBudget = campaign?.budget || 0;

          if (campaignBudget > 0) {
            const { data: campaignUsage } = await supabase.from('agent_usage_log')
              .select('credits_consumed')
              .eq('company_id', companyId)
              .not('input_data', 'is', null);
            // Filter by campaign_id in input_data
            const campaignCredits = (campaignUsage || []).reduce((s, r) => {
              const inputData = r.input_data as any;
              if (inputData?.campaign_id === campaignId) return s + (r.credits_consumed || 0);
              return s;
            }, 0);
            campaignBudgetCache.set(campaignId, { budget: campaignBudget, consumed: campaignCredits });
          }
        }

        const campBudget = campaignBudgetCache.get(campaignId);
        if (campBudget && campBudget.budget > 0) {
          const usageRatio = campBudget.consumed / campBudget.budget;
          if (usageRatio >= 0.9) {
            guardrail_result = 'blocked';
            guardrail_details = `Campaign budget cap reached (${campBudget.consumed}/${campBudget.budget} credits, ${(usageRatio * 100).toFixed(0)}%)`;
            wasIntervened = true;
            interventionReasons.push(`campaign_budget_cap: ${guardrail_details}`);
            guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
            continue;
          }
          if (usageRatio >= 0.75) {
            interventionReasons.push(`campaign_budget_warning: ${campBudget.consumed}/${campBudget.budget} credits (${(usageRatio * 100).toFixed(0)}%)`);
          }
        }
      } catch (campErr) {
        console.warn(`⚠️ Campaign budget check failed for ${campaignId}:`, campErr);
      }
    }

    // ─── DEPARTMENT BUDGET ALLOCATION ───
    if (deptBudgetStatus) {
      const deptUsageRatio = deptBudgetStatus.consumed / deptBudgetStatus.limit;
      if (deptUsageRatio >= 1.0) {
        guardrail_result = 'blocked';
        guardrail_details = `Department monthly budget exhausted (${deptBudgetStatus.consumed}/${deptBudgetStatus.limit} credits)`;
        wasIntervened = true;
        interventionReasons.push(`department_budget: ${guardrail_details}`);
        guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
        continue;
      }
      if (deptUsageRatio >= 0.8) {
        // Escalate to requires_approval regardless of risk_level
        interventionReasons.push(`department_budget_warning: ${(deptUsageRatio * 100).toFixed(0)}% consumed — escalating to requires_approval`);
        decision.risk_level = decision.risk_level === 'critical' ? 'critical' : 'high'; // force at least high
      }
    }

    // ─── SECTOR COMPLIANCE ───
    if (industrySector) {
      const sectorRules = SECTOR_COMPLIANCE_RULES[industrySector];
      if (sectorRules) {
        const sectorResult = sectorRules(decision);
        if (sectorResult?.block) {
          guardrail_result = 'blocked';
          guardrail_details = sectorResult.block;
          wasIntervened = true;
          interventionReasons.push(`sector_compliance: ${sectorResult.block}`);
          guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });
          continue;
        }
        if (sectorResult?.escalate) {
          const RISK_ORDER = ['low', 'medium', 'high', 'critical'];
          const escalateLevel = sectorResult.escalate === 'escalated' ? 'critical' : 'high';
          const currentIdx = RISK_ORDER.indexOf(decision.risk_level || 'medium');
          const escalateIdx = RISK_ORDER.indexOf(escalateLevel);
          if (escalateIdx > currentIdx) {
            decision.risk_level = escalateLevel;
            interventionReasons.push(`sector_compliance_escalation: ${industrySector} rules escalated to ${escalateLevel}`);
          }
        }
      }
    }

    // ─── EXPLICIT HUMAN APPROVAL CONFIG (legacy support) ───
    if (deptConfig.require_human_approval && ['create_content', 'publish', 'create_proposal', 'review_contract'].includes(decision.decision_type)) {
      if (decision.risk_level === 'low') decision.risk_level = 'high';
      interventionReasons.push('require_human_approval_config');
    }

    // ─── RISK-BASED 4-LEVEL CLASSIFICATION ───
    const riskLevel = decision.risk_level || 'medium';

    switch (riskLevel) {
      case 'low':
        guardrail_result = 'auto_approved';
        guardrail_details = 'Low risk — auto-approved for immediate execution';
        break;
      case 'medium':
        guardrail_result = 'post_review';
        guardrail_details = 'Medium risk — will execute and mark for post-execution human review';
        wasIntervened = true;
        interventionReasons.push('risk_classification: medium → post_review');
        break;
      case 'high':
        guardrail_result = 'requires_approval';
        guardrail_details = 'High risk — requires human approval before execution';
        wasIntervened = true;
        interventionReasons.push('risk_classification: high → requires_approval');
        break;
      case 'critical':
        guardrail_result = 'escalated';
        guardrail_details = 'Critical risk — executive escalation required, multiple stakeholders';
        wasIntervened = true;
        interventionReasons.push('risk_classification: critical → escalated');
        break;
    }

    // Append any warnings to details
    const warnings = interventionReasons.filter(r => r.includes('warning'));
    if (warnings.length > 0) {
      guardrail_details += ` | Warnings: ${warnings.join('; ')}`;
    }

    guardedDecisions.push({ ...decision, guardrail_result, guardrail_details });

    // ─── GUARDRAIL INTERVENTION LOG ───
    if (wasIntervened && guardrail_result !== 'auto_approved') {
      try {
        await supabase.from('autopilot_execution_log').insert({
          company_id: companyId,
          cycle_id: crypto.randomUUID(),
          phase: 'guardrail_intervention',
          status: guardrail_result,
          context_snapshot: {
            original_decision: {
              decision_type: decision.decision_type,
              risk_level: riskLevel,
              priority: decision.priority,
              description: decision.description,
              agent_to_execute: decision.agent_to_execute,
              action_parameters: decision.action_parameters,
            },
            guardrails_applied: interventionReasons,
            guardrail_result,
            guardrail_details,
            counterfactual: `Without guardrail intervention, the action "${decision.description}" would have been executed immediately with expected impact: ${JSON.stringify(decision.expected_impact || {})}`,
          },
          decisions_made: [decision],
          actions_taken: [],
          credits_consumed: 0,
          content_generated: 0,
          content_approved: 0,
          content_rejected: guardrail_result === 'blocked' ? 1 : 0,
          content_pending_review: ['requires_approval', 'escalated', 'post_review'].includes(guardrail_result) ? 1 : 0,
          execution_time_ms: 0,
        });
      } catch (logErr) {
        console.warn(`⚠️ Guardrail intervention log failed:`, logErr);
      }
    }
  }

  return guardedDecisions;
}

async function executeAgentForDecision(
  companyId: string, department: string, decision: any, cycleId: string,
  agentMap: Map<string, any>
): Promise<any> {
  const agentCode = decision.agent_to_execute;

  if (!agentCode) {
    console.log(`ℹ️ [${department}] Decision has no agent assigned (null). Logging as recommendation only.`);
    return { ...decision, action_taken: false, execution_result: 'recommendation_only' };
  }

  const agent = agentMap.get(agentCode);
  if (!agent) {
    // ═══ GAP 6: CHECK IF agent_to_execute IS A CAPABILITY ═══
    try {
      const { data: capability } = await supabase.from('autopilot_capabilities')
        .select('id, capability_code, capability_name, status, is_active')
        .eq('company_id', companyId)
        .eq('capability_code', agentCode)
        .maybeSingle();

      if (capability) {
        // This is a capability, not a platform agent — track usage
        const newCount = (capability as any).execution_count ? (capability as any).execution_count + 1 : 1;
        await supabase.from('autopilot_capabilities').update({
          execution_count: newCount,
          last_evaluated_at: new Date().toISOString(),
        } as any).eq('id', capability.id);
        console.log(`🧬 [${department}] Capability execution tracked: ${agentCode} (count: ${newCount})`);
        return { ...decision, action_taken: true, execution_result: 'capability_tracked', capability_code: agentCode };
      }
    } catch (capErr) {
      console.warn(`⚠️ [${department}] Capability lookup failed for ${agentCode}:`, capErr);
    }
    console.log(`⚠️ [${department}] No agent found for code: ${agentCode}. Not a real agent.`);
    return { ...decision, action_taken: false, execution_result: 'no_agent_mapped' };
  }

  if (!agent.edge_function_name || agent.execution_type === 'pending') {
    console.log(`⚠️ [${department}] Agent ${agentCode} exists but is pending implementation.`);
    return { ...decision, action_taken: false, execution_result: 'agent_not_implemented' };
  }

  if (agent.edge_function_name === 'enterprise-autopilot-engine') {
    console.warn(`🔄 [${department}] Agent ${agentCode} points to enterprise-autopilot-engine itself! Skipping to prevent recursion.`);
    return { ...decision, action_taken: false, execution_result: 'recursive_agent_blocked' };
  }

  try {
    console.log(`⚡ [${department}] Invoking agent: ${agent.name} (${agent.edge_function_name})`);
    const execStart = Date.now();

    // Load agent context requirements for rich payload
    const { data: agentFull } = await supabase.from('platform_agents')
      .select('context_requirements').eq('id', agent.id).single();

    let companyContext: any = {};
    const contextReqs = agentFull?.context_requirements as string[] || [];
    if (contextReqs.length > 0) {
      const contextLoaders: Record<string, () => Promise<any>> = {
        strategy: () => supabase.from('company_strategy').select('*').eq('company_id', companyId).maybeSingle().then(r => r.data),
        branding: () => supabase.from('company_branding').select('*').eq('company_id', companyId).maybeSingle().then(r => r.data),
        audiences: () => supabase.from('company_audiences').select('*').eq('company_id', companyId).then(r => r.data),
        communication: () => supabase.from('company_communication_settings').select('*').eq('company_id', companyId).maybeSingle().then(r => r.data),
        objectives: () => supabase.from('company_objectives').select('*').eq('company_id', companyId).then(r => r.data),
        products: () => supabase.from('company_products').select('*').eq('company_id', companyId).then(r => r.data),
        competitors: () => supabase.from('company_competitors').select('*').eq('company_id', companyId).then(r => r.data),
      };
      const contextPromises = contextReqs
        .filter(req => contextLoaders[req])
        .map(async req => ({ [req]: await contextLoaders[req]() }));
      const contextResults = await Promise.all(contextPromises);
      companyContext = Object.assign({}, ...contextResults);
    }

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
        company_context: companyContext,
      }),
    });

    const agentResult = await agentRes.json();
    const execTime = Date.now() - execStart;

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

    return { ...decision, action_taken: true, execution_result: agentResult.success !== false ? 'success' : 'failed' };
  } catch (err) {
    console.error(`❌ Agent execution failed for ${agentCode}:`, err);
    return { ...decision, action_taken: false, execution_result: 'error', execution_error: (err as Error).message };
  }
}

async function actPhase(companyId: string, department: string, guardedDecisions: any[], cycleId: string) {
  // Resolve agent mappings using category
  const categories = DEPT_CATEGORY_MAP[department] || [];
  const { data: agents } = await supabase.from('platform_agents')
    .select('id, internal_code, name, edge_function_name, execution_type, credits_per_use')
    .in('category', categories).eq('is_active', true);

  const agentMap = new Map((agents || []).map(a => [a.internal_code, a]));

  // Separate decisions by guardrail result
  const nonExecutable: any[] = [];
  const executable: any[] = [];
  const postReviewQueue: any[] = []; // Execute but flag for review

  for (const decision of guardedDecisions) {
    if (decision.guardrail_result === 'blocked') {
      nonExecutable.push({ ...decision, action_taken: false });

    } else if (decision.guardrail_result === 'escalated') {
      // Critical risk — executive escalation, do NOT execute
      await supabase.from('content_approvals').insert({
        company_id: companyId,
        content_type: `autopilot_${department}_decision`,
        content_data: {
          ...decision,
          approval_type: 'executive_escalation',
          requires_multiple_stakeholders: true,
        },
        status: 'draft',
        submitted_by: 'enterprise_autopilot_engine',
        notes: `[⚠️ EXECUTIVE ESCALATION] [${department}] [Cycle ${cycleId}] Critical risk: ${decision.description}`,
      });
      nonExecutable.push({ ...decision, action_taken: false, escalated: true });

    } else if (decision.guardrail_result === 'requires_approval' || decision.guardrail_result === 'sent_to_approval') {
      // High risk — requires human approval before execution
      await supabase.from('content_approvals').insert({
        company_id: companyId,
        content_type: `autopilot_${department}_decision`,
        content_data: decision,
        status: 'pending_review',
        submitted_by: 'enterprise_autopilot_engine',
        notes: `[Enterprise Autopilot ${department}] [Cycle ${cycleId}] ${decision.description}`,
      });
      nonExecutable.push({ ...decision, action_taken: false, sent_to_approval: true });

    } else if (decision.guardrail_result === 'post_review') {
      // Medium risk — execute but mark for post-review
      executable.push(decision);
      postReviewQueue.push(decision);

    } else {
      // auto_approved / passed — execute normally
      executable.push(decision);
    }
  }

  // ═══ L2: PARALLEL EXECUTION MANAGER ═══
  // Group independent decisions (no depends_on) vs dependent ones
  const independent: any[] = [];
  const dependent: any[] = [];

  for (const d of executable) {
    if (d.action_parameters?.depends_on) {
      dependent.push(d);
    } else {
      independent.push(d);
    }
  }

  // Execute independent decisions in parallel
  let parallelResults: any[] = [];
  if (independent.length > 0) {
    console.log(`⚡ [${department}] Executing ${independent.length} independent decisions in parallel`);
    const settled = await Promise.allSettled(
      independent.map(d => executeAgentForDecision(companyId, department, d, cycleId, agentMap))
    );
    parallelResults = settled.map(r => r.status === 'fulfilled' ? r.value : { action_taken: false, execution_result: 'error', execution_error: (r as PromiseRejectedResult).reason?.message });
  }

  // Execute dependent decisions serially
  const serialResults: any[] = [];
  for (const d of dependent) {
    const result = await executeAgentForDecision(companyId, department, d, cycleId, agentMap);
    serialResults.push(result);
  }

  const allResults = [...nonExecutable, ...parallelResults, ...serialResults];

  // ═══ POST-REVIEW: Insert content_approvals for executed post_review decisions ═══
  for (const decision of postReviewQueue) {
    const executedResult = allResults.find(r =>
      r.decision_type === decision.decision_type && r.description === decision.description && r.action_taken
    );
    if (executedResult) {
      try {
        await supabase.from('content_approvals').insert({
          company_id: companyId,
          content_type: `autopilot_${department}_post_review`,
          content_data: {
            ...decision,
            execution_result: executedResult.execution_result,
            requires_post_review: true,
          },
          status: 'approved', // Already executed, marked for human review
          submitted_by: 'enterprise_autopilot_engine',
          notes: `[POST-REVIEW] [${department}] [Cycle ${cycleId}] Executed (medium risk) — pending human review: ${decision.description}`,
        });
      } catch (prErr) {
        console.warn(`⚠️ Post-review approval insert failed:`, prErr);
      }
    }
  }

  // ═══ GAP 6: CREDIT AGGREGATION PER CYCLE ═══
  // Sum credits_per_use for all successfully executed decisions
  let totalCreditsConsumed = 0;
  for (const result of allResults) {
    if (result.action_taken && result.execution_result === 'success') {
      const agentCode = result.agent_to_execute;
      if (agentCode) {
        const agent = agentMap.get(agentCode);
        totalCreditsConsumed += agent?.credits_per_use || 1;
      }
    }
  }

  return { results: allResults, credits_consumed: totalCreditsConsumed };
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
    expected_impact: {
      ...(d.expected_impact || {}),
      priority_score: d.priority_score,
      scoring_breakdown: d.scoring_breakdown,
    },
  }));

  if (rows.length) {
    await supabase.from('autopilot_decisions').insert(rows);
  }

  // Store in memory for future reasoning with context_hash (GAP 2)
  const memoryRows = decisions.filter(d => d.action_taken).map(d => ({
    company_id: companyId,
    department,
    cycle_id: cycleId,
    decision_type: d.decision_type,
    context_summary: d.reasoning,
    context_hash: generateContextHash(department, d.decision_type, d.action_parameters),
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
    for (const pe of pendingEvals) {
      let evaluation = 'neutral';
      let score = 0;
      let lesson = `Decision "${pe.decision_type}" was executed but no measurable impact data was available for evaluation.`;

      try {
        // Metric-based impact evaluation by decision type
        if (pe.decision_type === 'create_content' || pe.decision_type === 'publish') {
          // Check if new posts were created after this decision and measure engagement
          const { data: recentPosts } = await supabase.from('scheduled_posts')
            .select('id, engagement_score')
            .eq('company_id', companyId)
            .gte('created_at', pe.created_at)
            .limit(10);
          if (recentPosts?.length) {
            const avgEngagement = recentPosts.reduce((s, p) => s + ((p as any).engagement_score || 0), 0) / recentPosts.length;
            score = avgEngagement > 0 ? Math.min(10, Math.round(avgEngagement)) : 0;
            evaluation = score >= 5 ? 'positive' : score >= 2 ? 'neutral' : 'negative';
            lesson = `Content decision resulted in ${recentPosts.length} posts with avg engagement score ${avgEngagement.toFixed(1)}.`;
          }
        } else if (pe.decision_type === 'qualify_lead' || pe.decision_type === 'advance_deal') {
          // Check if deals advanced in pipeline after this decision
          const { data: advancedDeals } = await supabase.from('crm_deals')
            .select('id, stage')
            .eq('company_id', companyId)
            .gte('updated_at', pe.created_at)
            .limit(10);
          if (advancedDeals?.length) {
            score = Math.min(10, advancedDeals.length * 2);
            evaluation = score >= 4 ? 'positive' : 'neutral';
            lesson = `Sales decision correlated with ${advancedDeals.length} deal updates in the pipeline.`;
          }
        } else if (pe.decision_type === 'analyze') {
          // Check if insights were generated
          const { count } = await supabase.from('content_insights')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', pe.created_at);
          if ((count || 0) > 0) {
            score = 5;
            evaluation = 'positive';
            lesson = `Analysis decision resulted in ${count} new insights generated.`;
          }
        // ═══ GAP 3: FULL IMPACT EVALUATION BY DEPARTMENT ═══
        } else if (['create_proposal', 'forecast_pipeline', 'enrich_contact'].includes(pe.decision_type)) {
          // Sales: check deal movement and contact enrichment
          const { data: dealUpdates } = await supabase.from('crm_deals')
            .select('id, value').eq('company_id', companyId).gte('updated_at', pe.created_at).limit(10);
          const { data: contactUpdates } = await supabase.from('crm_contacts')
            .select('id').eq('company_id', companyId).gte('updated_at', pe.created_at).limit(10);
          const totalActivity = (dealUpdates?.length || 0) + (contactUpdates?.length || 0);
          score = Math.min(10, totalActivity);
          evaluation = totalActivity >= 3 ? 'positive' : totalActivity >= 1 ? 'neutral' : 'negative';
          lesson = `Sales decision correlated with ${dealUpdates?.length || 0} deal updates and ${contactUpdates?.length || 0} contact updates.`;
        } else if (['budget_alert', 'credit_alert', 'cashflow_warning'].includes(pe.decision_type)) {
          // Finance: compare credit consumption before/after
          const { data: usageBefore } = await supabase.from('agent_usage_log')
            .select('credits_consumed').eq('company_id', companyId)
            .lt('created_at', pe.created_at).gte('created_at', new Date(new Date(pe.created_at).getTime() - 7 * 86400000).toISOString());
          const { data: usageAfter } = await supabase.from('agent_usage_log')
            .select('credits_consumed').eq('company_id', companyId)
            .gte('created_at', pe.created_at).limit(50);
          const before = (usageBefore || []).reduce((s, r) => s + (r.credits_consumed || 0), 0);
          const after = (usageAfter || []).reduce((s, r) => s + (r.credits_consumed || 0), 0);
          score = after < before ? 8 : after === before ? 5 : 3;
          evaluation = after < before ? 'positive' : after <= before * 1.1 ? 'neutral' : 'negative';
          lesson = `Finance alert: credits before=${before}, after=${after}. ${after < before ? 'Consumption reduced' : 'No improvement'}.`;
        } else if (['compliance_alert', 'review_contract'].includes(pe.decision_type)) {
          // Legal: check if legal parameters were updated post-decision
          const { data: legalUpdates } = await supabase.from('company_parameters')
            .select('parameter_key, updated_at').eq('company_id', companyId)
            .like('parameter_key', 'legal_%').gte('updated_at', pe.created_at);
          score = (legalUpdates?.length || 0) > 0 ? 7 : 3;
          evaluation = (legalUpdates?.length || 0) > 0 ? 'positive' : 'neutral';
          lesson = `Legal decision: ${legalUpdates?.length || 0} legal parameters updated post-action.`;
        } else if (['create_job_profile', 'climate_survey', 'talent_match'].includes(pe.decision_type)) {
          // HR: check if new members were added or HR params updated
          const { data: newMembers } = await supabase.from('company_members')
            .select('id').eq('company_id', companyId).gte('joined_at', pe.created_at);
          const { data: hrUpdates } = await supabase.from('company_parameters')
            .select('id').eq('company_id', companyId).like('parameter_key', 'hr_%').gte('updated_at', pe.created_at);
          const total = (newMembers?.length || 0) + (hrUpdates?.length || 0);
          score = Math.min(10, total * 2 + 3);
          evaluation = total > 0 ? 'positive' : 'neutral';
          lesson = `HR decision: ${newMembers?.length || 0} new members, ${hrUpdates?.length || 0} HR parameter updates.`;
        } else if (['optimize_process', 'automate_task', 'sla_alert'].includes(pe.decision_type)) {
          // Operations: evaluate task completion rate and agent failure rate
          const { data: recentTasks } = await supabase.from('ai_workforce_team_tasks')
            .select('status').in('team_id', 
              (await supabase.from('ai_workforce_teams').select('id').eq('company_id', companyId)).data?.map(t => t.id) || []
            ).gte('created_at', pe.created_at);
          const completed = (recentTasks || []).filter(t => t.status === 'completed').length;
          const total = recentTasks?.length || 0;
          const completionRate = total > 0 ? completed / total : 0;
          const { data: recentExecs } = await supabase.from('agent_usage_log')
            .select('status').eq('company_id', companyId).gte('created_at', pe.created_at).limit(50);
          const failureRate = (recentExecs || []).length > 0 
            ? (recentExecs || []).filter(e => e.status === 'failed').length / (recentExecs || []).length 
            : 0;
          score = Math.round(completionRate * 7 + (1 - failureRate) * 3);
          evaluation = score >= 6 ? 'positive' : score >= 3 ? 'neutral' : 'negative';
          lesson = `Operations: ${completed}/${total} tasks completed (${(completionRate * 100).toFixed(0)}%), agent failure rate: ${(failureRate * 100).toFixed(1)}%.`;
        }
      } catch (evalErr) {
        console.warn(`⚠️ Impact evaluation failed for ${pe.id}:`, evalErr);
      }

      await supabase.from('autopilot_memory').update({
        outcome_evaluation: evaluation,
        outcome_score: score,
        lesson_learned: lesson,
        evaluated_at: new Date().toISOString(),
      }).eq('id', pe.id);
    }
  }

  // === MARKETING DIAGNOSTIC FEEDBACK LOOP (Larry Methodology) ===
  if (department === 'marketing') {
    try {
      const diagResponse = await fetch(`${supabaseUrl}/functions/v1/marketing-diagnostic-loop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, days: 7, source: 'autopilot' }),
      });
      const diagResult = await diagResponse.json();
      if (diagResult.success) {
        console.log(`📊 Diagnostic: ${diagResult.diagnostic?.action} (Views: ${diagResult.diagnostic?.views_level}, Conversions: ${diagResult.diagnostic?.conversions_level})`);
      }
    } catch (diagErr) {
      console.warn('⚠️ Marketing diagnostic loop failed (non-blocking):', diagErr);
    }
  }

  // ═══ L4: PATTERN EXTRACTOR ═══
  // Group positive evaluations by decision_type, extract patterns with 3+ occurrences
  try {
    const { data: positiveMemory } = await supabase.from('autopilot_memory')
      .select('id, decision_type, context_summary, outcome_score, lesson_learned')
      .eq('company_id', companyId)
      .eq('department', department)
      .eq('outcome_evaluation', 'positive')
      .is('applies_to_future', null)
      .order('evaluated_at', { ascending: false })
      .limit(50);

    if (positiveMemory?.length) {
      // Group by decision_type
      const grouped = new Map<string, typeof positiveMemory>();
      for (const m of positiveMemory) {
        const arr = grouped.get(m.decision_type) || [];
        arr.push(m);
        grouped.set(m.decision_type, arr);
      }

      for (const [decType, entries] of grouped) {
        if (entries.length < 3) continue; // Need 3+ positive occurrences

        console.log(`🔮 [${department}] Extracting pattern for "${decType}" (${entries.length} positive outcomes)`);

        const lessons = entries.map(e => e.lesson_learned || e.context_summary || '').filter(Boolean).join('\n');

        const patternRes = await fetch(`${supabaseUrl}/functions/v1/universal-ai-handler`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            functionName: 'pattern_extractor',
            messages: [
              { role: 'system', content: `You extract reusable decision patterns from successful outcomes. Respond ONLY with a JSON array of 1-3 rule objects: [{"rule": "When [context], execute [action] because [reason]", "confidence": 0.0-1.0, "applies_to": "${decType}"}]` },
              { role: 'user', content: `These ${entries.length} executions of "${decType}" in the ${department} department all had positive outcomes:\n${lessons}\n\nExtract reusable patterns/rules for future decisions.` },
            ],
          }),
        });

        const patternResult = await patternRes.json();
        if (patternResult.success) {
          const rules = tryParseJson(patternResult.response);
          if (rules?.length) {
            // Apply rules to the most recent entry for this decision_type
            const targetId = entries[0].id;
            await supabase.from('autopilot_memory').update({
              applies_to_future: rules,
            }).eq('id', targetId);
            console.log(`✅ [${department}] Stored ${rules.length} pattern rules for "${decType}"`);
          }
        }
      }
    }
  } catch (patternErr) {
    console.warn(`⚠️ [${department}] Pattern extraction failed (non-blocking):`, patternErr);
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
    .select('*').eq('company_id', companyId).eq('is_active', false)
    .in('status', ['seeded', 'proposed'] as any[]);

  if (!caps?.length) return [];

  const activated: string[] = [];

  for (const cap of caps) {
    const cond = cap.trigger_condition as any;
    let shouldActivate = false;

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
      // ═══ GAP 2 FIX: Route to trial instead of direct activation ═══
      const previousStatus = cap.status;
      const trialExpiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
      await supabase.from('autopilot_capabilities').update({
        is_active: false,
        status: 'trial',
        trial_expires_at: trialExpiry,
        activation_reason: `Trigger conditions met: ${JSON.stringify(cond)}. Entering 7-day trial.`,
        last_evaluated_at: new Date().toISOString(),
      } as any).eq('id', cap.id);
      activated.push(cap.capability_code);

      await logCapabilityTransition(
        companyId,
        cap.capability_code,
        previousStatus,
        'trial',
        `Trigger conditions met: ${JSON.stringify(cond)}. Entering mandatory 7-day trial period until ${trialExpiry}.`
      );
    }
  }

  return activated;
}

// ═══════════════════════════════════════════════════════════════
// CAPABILITY GENESIS ENGINE
// ═══════════════════════════════════════════════════════════════

interface GapReport {
  unmapped_agents: { decision_type: string; count: number; department: string; period_days: number; first_seen: string; last_seen: string }[];
  recurring_blocks: { decision_type: string; block_reason: string; count: number; department: string; period_days: number; first_seen: string; last_seen: string }[];
  unhandled_signals: { source: string; signal_count: number }[];
  repeated_patterns: { decision_type: string; success_count: number }[];
  low_performing_decisions: { decision_type: string; negative_count: number; avg_score: number }[];
}

async function detectCapabilityGaps(companyId: string, department: string): Promise<GapReport> {
  console.log(`🔍 [${department}] Detecting capability gaps...`);

  // ═══ GAP 1 FIX: Filter decisions by department using decision_type registry ═══
  const reg = DEPARTMENT_REGISTRY[department];
  const deptDecisionTypes = reg?.decisionTypes || [];

  const { data: recentDecisions } = await supabase.from('autopilot_decisions')
    .select('decision_type, agent_to_execute, guardrail_result, guardrail_details, action_taken, created_at')
    .eq('company_id', companyId)
    .in('decision_type', deptDecisionTypes.length > 0 ? deptDecisionTypes : ['__none__'])
    .order('created_at', { ascending: false })
    .limit(50);

  const decisions = recentDecisions || [];

  // 1. Decisions without mapped agent — with temporal correlation
  const unmappedMap = new Map<string, { count: number; dates: string[] }>();
  for (const d of decisions) {
    if (d.guardrail_result === 'passed' && !d.action_taken) {
      const existing = unmappedMap.get(d.decision_type) || { count: 0, dates: [] };
      existing.count++;
      existing.dates.push(d.created_at);
      unmappedMap.set(d.decision_type, existing);
    }
  }
  const unmapped_agents = Array.from(unmappedMap.entries())
    .map(([decision_type, v]) => {
      const sorted = v.dates.sort();
      const firstSeen = sorted[0];
      const lastSeen = sorted[sorted.length - 1];
      const periodDays = Math.ceil((new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 86400000) || 1;
      return { decision_type, count: v.count, department, period_days: periodDays, first_seen: firstSeen, last_seen: lastSeen };
    })
    .filter(g => g.count >= 2);

  // 2. Recurring guardrail blocks — with temporal correlation
  const blockMap = new Map<string, { reason: string; count: number; dates: string[] }>();
  for (const d of decisions) {
    if (d.guardrail_result === 'blocked') {
      const key = d.decision_type;
      const existing = blockMap.get(key);
      if (existing) {
        existing.count++;
        existing.dates.push(d.created_at);
      } else {
        blockMap.set(key, { reason: d.guardrail_details || 'unknown', count: 1, dates: [d.created_at] });
      }
    }
  }
  const recurring_blocks = Array.from(blockMap.entries())
    .map(([decision_type, v]) => {
      const sorted = v.dates.sort();
      const firstSeen = sorted[0];
      const lastSeen = sorted[sorted.length - 1];
      const periodDays = Math.ceil((new Date(lastSeen).getTime() - new Date(firstSeen).getTime()) / 86400000) || 1;
      return { decision_type, block_reason: v.reason, count: v.count, department, period_days: periodDays, first_seen: firstSeen, last_seen: lastSeen };
    })
    .filter(b => b.count >= 3);

  // 3. External signals without corresponding capabilities
  const { data: recentIntel } = await supabase.from('external_intelligence_cache')
    .select('source, structured_signals')
    .eq('company_id', companyId)
    .gte('fetched_at', new Date(Date.now() - 7 * 86400000).toISOString())
    .limit(20);

  const { data: existingCaps } = await supabase.from('autopilot_capabilities')
    .select('capability_code')
    .eq('company_id', companyId);

  const capCodes = new Set((existingCaps || []).map(c => c.capability_code));
  const unhandled_signals: { source: string; signal_count: number }[] = [];

  for (const intel of (recentIntel || [])) {
    const signals = Array.isArray(intel.structured_signals) ? intel.structured_signals : [];
    const highImpact = signals.filter((s: any) => s.impact === 'high' && s.category === 'threat');
    if (highImpact.length > 0) {
      unhandled_signals.push({ source: intel.source, signal_count: highImpact.length });
    }
  }

  // 4. Repeated successful patterns
  const { data: memoryData } = await supabase.from('autopilot_memory')
    .select('decision_type, outcome_evaluation')
    .eq('company_id', companyId)
    .eq('department', department)
    .eq('outcome_evaluation', 'positive')
    .limit(50);

  const patternMap = new Map<string, number>();
  for (const m of (memoryData || [])) {
    patternMap.set(m.decision_type, (patternMap.get(m.decision_type) || 0) + 1);
  }
  const repeated_patterns = Array.from(patternMap.entries())
    .map(([decision_type, success_count]) => ({ decision_type, success_count }))
    .filter(p => p.success_count >= 3);

  // ═══ GAP 5: LOW PERFORMING DECISIONS (outcome_score < threshold) ═══
  const { data: lowPerformers } = await supabase.from('autopilot_memory')
    .select('decision_type, outcome_score')
    .eq('company_id', companyId)
    .eq('department', department)
    .eq('outcome_evaluation', 'negative')
    .lt('outcome_score', 3)
    .limit(50);

  const lowPerfMap = new Map<string, { count: number; totalScore: number }>();
  for (const lp of (lowPerformers || [])) {
    const existing = lowPerfMap.get(lp.decision_type) || { count: 0, totalScore: 0 };
    existing.count++;
    existing.totalScore += lp.outcome_score || 0;
    lowPerfMap.set(lp.decision_type, existing);
  }
  const low_performing_decisions = Array.from(lowPerfMap.entries())
    .map(([decision_type, v]) => ({ decision_type, negative_count: v.count, avg_score: v.count > 0 ? v.totalScore / v.count : 0 }))
    .filter(d => d.negative_count >= 3);

  const report: GapReport = { unmapped_agents, recurring_blocks, unhandled_signals, repeated_patterns, low_performing_decisions };
  const totalGaps = unmapped_agents.length + recurring_blocks.length + unhandled_signals.length + repeated_patterns.length + low_performing_decisions.length;
  console.log(`🔍 [${department}] Found ${totalGaps} capability gaps (including ${low_performing_decisions.length} low-performing decision types)`);

  return report;
}

async function proposeNewCapabilities(companyId: string, department: string, gapReport: GapReport) {
  const totalGaps = gapReport.unmapped_agents.length + gapReport.recurring_blocks.length +
    gapReport.unhandled_signals.length + gapReport.repeated_patterns.length +
    (gapReport.low_performing_decisions?.length || 0);

  if (totalGaps < 2) {
    console.log(`💡 [${department}] Not enough gaps (${totalGaps}) to propose new capabilities`);
    return [];
  }

  console.log(`💡 [${department}] Proposing new capabilities for ${totalGaps} gaps...`);

  // Get company profile
  const { data: company } = await supabase.from('companies')
    .select('name, industry_sector, country, description')
    .eq('id', companyId).single();

  // ═══ GAP 3 FIX: Include ALL capabilities (including deprecated <30d) to avoid re-proposals ═══
  const { data: existingCaps } = await supabase.from('autopilot_capabilities')
    .select('capability_code, capability_name, status, deactivated_at')
    .eq('company_id', companyId);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  // Exclude deprecated caps only if they were deprecated more than 30 days ago
  const existingCodes = (existingCaps || [])
    .filter(c => {
      if (c.status === 'deprecated') {
        // Allow re-proposal if deprecated more than 30 days ago
        return c.deactivated_at && c.deactivated_at > thirtyDaysAgo;
      }
      return true; // all non-deprecated are always excluded
    })
    .map(c => c.capability_code);

  // Build list of recently deprecated codes for the AI prompt
  const recentlyDeprecated = (existingCaps || [])
    .filter(c => c.status === 'deprecated' && c.deactivated_at && c.deactivated_at > thirtyDaysAgo)
    .map(c => c.capability_code);

  const aiRes = await fetch(`${supabaseUrl}/functions/v1/openai-responses-handler`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      functionName: 'capability_genesis',
      input: JSON.stringify({
        company: { name: company?.name, industry: company?.industry_sector, country: company?.country },
        department,
        gap_report: gapReport,
        existing_capabilities: existingCodes,
      }),
      overrides: {
        systemPrompt: `You are a Capability Genesis AI. Given a company profile, department, and gap analysis, propose 1-3 NEW capabilities that would address the identified gaps.

Each capability must be a JSON object with:
- code: snake_case unique identifier (e.g. "competitive_response_engine")
- name: Human-readable name (in Spanish)
- description: Brief description of what this capability does (in Spanish)
- department: The department this belongs to
- trigger_condition: JSON object with activation conditions (e.g. {"min_signals": 3})
- required_maturity: "starter" | "growing" | "established" | "scaling"
- auto_activate: true for low-risk analytics/monitoring, false for action-heavy capabilities
- proposed_reason: Why this capability is needed based on the gaps (in Spanish)
- required_data: array of data sources this capability needs (e.g. ["crm_deals", "company_parameters", "agent_usage_log"])
- success_metrics: array of measurable success metrics (e.g. [{"metric": "conversion_rate", "target": "+10%", "measurement_period": "30d"}])
- risk_level: "low" for monitoring/analytics only, "medium" for recommendations that modify data, "high" for capabilities that execute financial transactions or external communications

RISK LEVEL GUIDE:
- low: read-only analytics, monitoring, alerts, reporting → auto-activates with trial
- medium: creates/modifies internal records, generates recommendations → requires user review
- high: sends external communications, makes financial decisions, modifies contracts → requires explicit human approval

IMPORTANT: 
- Do NOT duplicate existing capabilities: ${existingCodes.join(', ')}
- Do NOT re-propose recently deprecated capabilities: ${recentlyDeprecated.join(', ') || 'none'}
- Focus on gaps that have the highest business impact
- Respond ONLY with a valid JSON array of capability objects`,
      },
    }),
  });

  const aiResult = await aiRes.json();
  if (!aiResult.success) {
    console.error('Capability proposal AI failed:', aiResult.error);
    return [];
  }

  const proposed = tryParseJson(aiResult.output || aiResult.response || '');
  if (!proposed?.length) return [];

  // Insert proposed capabilities
  const inserted: string[] = [];
  for (const cap of proposed.slice(0, 3)) {
    if (existingCodes.includes(cap.code)) continue;

    const riskLevel = cap.risk_level || (cap.auto_activate ? 'low' : 'medium');
    const initialStatus = riskLevel === 'low' && cap.auto_activate ? 'proposed' : 'proposed';

    const { error } = await supabase.from('autopilot_capabilities').insert({
      company_id: companyId,
      capability_code: cap.code,
      capability_name: cap.name,
      description: cap.description,
      department: cap.department || department,
      trigger_condition: cap.trigger_condition || {},
      required_maturity: cap.required_maturity || 'growing',
      is_active: false,
      status: initialStatus,
      source: 'ai_generated',
      auto_activate: cap.auto_activate || false,
      proposed_reason: cap.proposed_reason || 'AI-generated based on gap analysis',
      gap_evidence: {
        ...gapReport,
        risk_level: riskLevel,
        success_metrics: cap.success_metrics || [],
      },
      required_data: cap.required_data || [],
    } as any);

    if (!error) {
      inserted.push(cap.code);
      console.log(`✨ [${department}] Proposed new capability: ${cap.code} (risk: ${riskLevel})`);

      // ═══ GAP 5: Log the creation transition ═══
      const createdStatus = riskLevel === 'low' && cap.auto_activate ? 'trial' : 'proposed';
      await logCapabilityTransition(companyId, cap.code, 'none', createdStatus, `Capability proposed by Genesis AI. Risk: ${riskLevel}. Reason: ${cap.proposed_reason || 'gap analysis'}`);

      // ═══ GAP 3: GOVERNANCE BASED ON RISK LEVEL ═══
      if (riskLevel === 'low' && cap.auto_activate) {
        // Low risk: auto-activate with 7-day trial
        const trialExpiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
        await supabase.from('autopilot_capabilities').update({
          status: 'trial',
          trial_expires_at: trialExpiry,
        } as any).eq('company_id', companyId).eq('capability_code', cap.code);
        console.log(`🚀 [${department}] Auto-activated trial (low risk, until ${trialExpiry}): ${cap.code}`);
      } else if (riskLevel === 'medium') {
        // Medium risk: submit for user review via content_approvals
        await supabase.from('content_approvals').insert({
          company_id: companyId,
          content_type: 'capability_approval',
          content_id: cap.code,
          content_data: {
            capability_code: cap.code,
            capability_name: cap.name,
            description: cap.description,
            department: cap.department || department,
            risk_level: riskLevel,
            required_data: cap.required_data || [],
            success_metrics: cap.success_metrics || [],
            proposed_reason: cap.proposed_reason,
          },
          status: 'pending_review',
          submitted_by: 'capability_genesis_engine',
          notes: `[Capability Genesis] New ${riskLevel}-risk capability proposed: ${cap.name}. Requires user review before activation.`,
        });
        console.log(`📋 [${department}] Medium-risk capability sent for review: ${cap.code}`);
      } else if (riskLevel === 'high') {
        // High risk: explicit human approval required
        await supabase.from('content_approvals').insert({
          company_id: companyId,
          content_type: 'capability_approval',
          content_id: cap.code,
          content_data: {
            capability_code: cap.code,
            capability_name: cap.name,
            description: cap.description,
            department: cap.department || department,
            risk_level: riskLevel,
            required_data: cap.required_data || [],
            success_metrics: cap.success_metrics || [],
            proposed_reason: cap.proposed_reason,
            requires_human_approval: true,
          },
          status: 'draft',
          submitted_by: 'capability_genesis_engine',
          notes: `[⚠️ HIGH RISK] [Capability Genesis] New high-risk capability: ${cap.name}. REQUIRES EXPLICIT HUMAN APPROVAL before any activation.`,
        });
        console.log(`🔒 [${department}] High-risk capability requires human approval: ${cap.code}`);
      }
    }
  }

  return inserted;
}

async function manageCapabilityLifecycle(companyId: string) {
  // ═══ L5: TRIAL MANAGER WITH 7-DAY EVALUATION ═══
  const { data: trialCaps } = await supabase.from('autopilot_capabilities')
    .select('id, capability_code, department, trial_expires_at, created_at')
    .eq('company_id', companyId)
    .eq('status', 'trial');

  if (trialCaps?.length) {
    const now = new Date();
    for (const cap of trialCaps) {
      const expiresAt = cap.trial_expires_at ? new Date(cap.trial_expires_at) : new Date(new Date(cap.created_at).getTime() + 7 * 24 * 3600000);

      if (now < expiresAt) continue; // Trial not expired yet

      // ═══ GAP 4 FIX: Evaluate ONLY decisions related to this capability ═══
      // Filter by decision_type matching capability_code, or by department if no specific match
      const capCode = cap.capability_code;
      const deptTypes = DEPARTMENT_REGISTRY[cap.department]?.decisionTypes || [];

      // First try: decisions where agent_to_execute matches capability_code
      let { data: relatedDecisions } = await supabase.from('autopilot_decisions')
        .select('action_taken, guardrail_result, decision_type')
        .eq('company_id', companyId)
        .eq('agent_to_execute', capCode)
        .gte('created_at', cap.created_at)
        .limit(20);

      // Fallback: filter by department's decision types if no direct matches
      if (!relatedDecisions?.length && deptTypes.length > 0) {
        const { data: deptDecisions } = await supabase.from('autopilot_decisions')
          .select('action_taken, guardrail_result, decision_type')
          .eq('company_id', companyId)
          .in('decision_type', deptTypes)
          .gte('created_at', cap.created_at)
          .limit(20);
        relatedDecisions = deptDecisions || [];
      }

      const executed = (relatedDecisions || []).filter(d => d.action_taken);

      // Also check execution_count on the capability itself (GAP 6 tracking)
      const { data: capData } = await supabase.from('autopilot_capabilities')
        .select('execution_count').eq('id', cap.id).single();
      const capExecutions = capData?.execution_count || 0;

      const { data: relatedMemory } = await supabase.from('autopilot_memory')
        .select('outcome_evaluation')
        .eq('company_id', companyId)
        .eq('department', cap.department)
        .gte('created_at', cap.created_at)
        .in('outcome_evaluation', ['positive', 'negative']);

      const positives = (relatedMemory || []).filter(m => m.outcome_evaluation === 'positive').length;
      const negatives = (relatedMemory || []).filter(m => m.outcome_evaluation === 'negative').length;
      const totalEvidence = executed.length + capExecutions;

      if (totalEvidence > 0 && positives > negatives) {
        // Promote to active
        await supabase.from('autopilot_capabilities').update({
          status: 'active',
          is_active: true,
          activated_at: now.toISOString(),
          activation_reason: `Trial evaluation: ${positives} positive, ${negatives} negative outcomes in ${totalEvidence} executions (${capExecutions} direct capability uses)`,
          last_evaluated_at: now.toISOString(),
        } as any).eq('id', cap.id);
        console.log(`✅ Promoted capability ${cap.capability_code} to active (${positives} positive, ${totalEvidence} total evidence)`);

        // ═══ GAP 5: Log trial→active transition ═══
        await logCapabilityTransition(companyId, cap.capability_code, 'trial', 'active',
          `Trial passed: ${positives} positive vs ${negatives} negative in ${totalEvidence} executions`);
      } else {
        // Deprecate with descriptive reason
        const deprecationReason = totalEvidence === 0
          ? `No related executions found during 7-day trial period (${cap.created_at} to ${now.toISOString()})`
          : `Insufficient positive outcomes: ${positives} positive vs ${negatives} negative in ${totalEvidence} executions`;
        await supabase.from('autopilot_capabilities').update({
          status: 'deprecated',
          is_active: false,
          deactivated_at: now.toISOString(),
          last_evaluated_at: now.toISOString(),
          activation_reason: deprecationReason,
        } as any).eq('id', cap.id);
        console.log(`🗑️ Deprecated capability ${cap.capability_code}: ${deprecationReason}`);

        // ═══ GAP 5: Log trial→deprecated transition ═══
        await logCapabilityTransition(companyId, cap.capability_code, 'trial', 'deprecated', deprecationReason);
      }
    }
  }

  // ═══ GAP 4: POST-ACTIVATION REVERSIBILITY ═══
  // Check active capabilities older than 14 days for performance degradation
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const { data: activeCaps } = await supabase.from('autopilot_capabilities')
    .select('id, capability_code, department, last_evaluated_at, activated_at')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .eq('is_active', true);

  if (activeCaps?.length) {
    for (const cap of activeCaps) {
      // Only re-evaluate if last evaluation was >14 days ago
      const lastEval = cap.last_evaluated_at || cap.activated_at;
      if (lastEval && lastEval > fourteenDaysAgo) continue;

      // Evaluate recent performance (last 2 weeks)
      const { data: recentMemory } = await supabase.from('autopilot_memory')
        .select('outcome_evaluation')
        .eq('company_id', companyId)
        .eq('department', cap.department)
        .gte('created_at', fourteenDaysAgo)
        .in('outcome_evaluation', ['positive', 'negative']);

      const positives = (recentMemory || []).filter(m => m.outcome_evaluation === 'positive').length;
      const negatives = (recentMemory || []).filter(m => m.outcome_evaluation === 'negative').length;
      const totalEvals = positives + negatives;

      if (totalEvals >= 3 && negatives > positives * 2) {
        // Performance degraded — reverse to deprecated
        const degradeReason = `Post-activation performance degraded: ${negatives} negative vs ${positives} positive outcomes in last 14 days (${totalEvals} total evaluations)`;
        await supabase.from('autopilot_capabilities').update({
          status: 'deprecated',
          is_active: false,
          deactivated_at: new Date().toISOString(),
          last_evaluated_at: new Date().toISOString(),
          activation_reason: degradeReason,
        } as any).eq('id', cap.id);
        console.log(`⬇️ Reversed capability ${cap.capability_code} to deprecated: ${degradeReason}`);

        await logCapabilityTransition(companyId, cap.capability_code, 'active', 'deprecated', degradeReason);
      } else {
        // Performance OK — just update last_evaluated_at
        await supabase.from('autopilot_capabilities').update({
          last_evaluated_at: new Date().toISOString(),
        } as any).eq('id', cap.id);
      }
    }
  }

  // Fallback RPCs for any remaining lifecycle management
  try { await supabase.rpc('promote_trial_capabilities' as any); } catch {}
  try { await supabase.rpc('deprecate_unused_capabilities' as any); } catch {}

  console.log(`♻️ Lifecycle management completed for company ${companyId}`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

async function runDepartmentCycle(companyId: string, department: string, deptConfig: any, maturityLevel: string) {
  const cycleId = crypto.randomUUID();
  const startTime = Date.now();
  console.log(`🚀 [${department.toUpperCase()}] Starting cycle ${cycleId} for company ${companyId}`);

  try {
    // PREFLIGHT
    console.log(`🔑 [${department}] PREFLIGHT`);
    const preflight = await preflightCheck(companyId, department);
    if (!preflight.ready) {
      console.warn(`🚫 [${department}] Preflight failed: ${preflight.reason}`);
      await logExecution(companyId, cycleId, department, 'preflight', 'aborted', {
        error_message: preflight.reason,
        context_snapshot: { missing: preflight.missing },
        execution_time_ms: Date.now() - startTime,
      });
      return { department, cycle_id: cycleId, success: false, aborted: true, reason: preflight.reason, missing: preflight.missing };
    }

    // SENSE
    console.log(`📡 [${department}] SENSE`);
    const senseData = await sensePhase(companyId, department);
    await logExecution(companyId, cycleId, department, 'sense', 'completed', {
      context_snapshot: senseData, execution_time_ms: Date.now() - startTime,
    });

    // DATA SUFFICIENCY CHECK
    const sufficiency = checkDataSufficiency(department, senseData);
    if (!sufficiency.sufficient) {
      console.warn(`🚫 [${department}] Insufficient data: ${sufficiency.reason}`);

      // PROACTIVE BOOTSTRAP for marketing: try auto-scraping connected accounts
      if (department === 'marketing') {
        console.log(`🔄 [marketing] Attempting proactive data bootstrap...`);

        // Get company owner user_id
        const { data: companyData } = await supabase.from('companies')
          .select('created_by').eq('id', companyId).single();
        const ownerUserId = companyData?.created_by;

        // Get connected social accounts for this company's owner
        const { data: socialAccounts } = await supabase.from('social_accounts')
          .select('id, platform, platform_username, company_id')
          .eq('is_connected', true)
          .not('platform', 'eq', 'upload_post_profile');

        // Filter to accounts belonging to company owner or company
        const companyAccounts = (socialAccounts || []).filter((a: any) => {
          if (a.company_id === companyId) return true;
          return false;
        });

        // If no company-level accounts, try owner's personal accounts
        let accountsToScrape = companyAccounts;
        if (accountsToScrape.length === 0 && ownerUserId) {
          const { data: ownerAccounts } = await supabase.from('social_accounts')
            .select('id, platform, platform_username')
            .eq('user_id', ownerUserId)
            .eq('is_connected', true)
            .not('platform', 'eq', 'upload_post_profile');
          accountsToScrape = ownerAccounts || [];
        }

        console.log(`📋 [marketing] Found ${accountsToScrape.length} accounts to scrape`);

        const scraperMap: Record<string, { fn: string; buildBody: (account: any, userId: string) => any }> = {
          instagram: {
            fn: 'instagram-scraper',
            buildBody: (account, uid) => ({
              action: 'get_posts',
              username_or_url: account.platform_username || '',
              user_id: uid,
            }),
          },
          linkedin: {
            fn: 'linkedin-scraper',
            buildBody: (account, uid) => ({
              action: 'get_company_posts',
              company_identifier: account.platform_username || '',
              user_id: uid,
            }),
          },
          facebook: { fn: 'facebook-scraper', buildBody: (account, uid) => ({ user_id: uid }) },
          tiktok: { fn: 'tiktok-scraper', buildBody: (account, uid) => ({ user_id: uid }) },
        };

        let scraped = false;
        for (const account of accountsToScrape) {
          const scraper = scraperMap[account.platform];
          if (!scraper || !account.platform_username) continue;
          try {
            console.log(`⚡ [marketing] Auto-scraping ${account.platform} (${account.platform_username})...`);
            const resp = await fetch(`${supabaseUrl}/functions/v1/${scraper.fn}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(scraper.buildBody(account, ownerUserId || '')),
            });
            const result = await resp.json();
            console.log(`📊 [marketing] ${account.platform} scrape result: ${resp.status}, success: ${result?.success}`);
            if (result?.success) scraped = true;
          } catch (e) {
            console.error(`❌ [marketing] Auto-scrape failed for ${account.platform}:`, e);
          }
        }

        if (scraped) {
          // Re-check data sufficiency after scraping
          const senseData2 = await sensePhase(companyId, department);
          const sufficiency2 = checkDataSufficiency(department, senseData2);
          if (sufficiency2.sufficient) {
            console.log(`✅ [marketing] Bootstrap successful! Continuing cycle with new data.`);
            // Continue with the new sense data - reassign and proceed
            Object.assign(senseData, senseData2);
          } else {
            // Still insufficient - log bootstrap_required decision
            console.warn(`🚫 [marketing] Bootstrap completed but still insufficient data.`);
            await supabase.from('autopilot_decisions').insert({
              company_id: companyId,
              cycle_id: cycleId,
              decision_type: 'cold_start_content',
              priority: 'high',
              description: 'Tu empresa es nueva en el mundo digital. El Autopilot puede generar tu primer calendario de contenido automáticamente. Crea contenido con IA desde el Marketing Hub.',
              reasoning: `Auto-scrape attempted for ${accountsToScrape.map((a: any) => a.platform).join(', ')} but ${sufficiency2.reason}`,
              action_taken: false,
              guardrail_result: 'needs_action',
              expected_impact: { suggested_action: 'generate_initial_content' },
            });
            await logExecution(companyId, cycleId, department, 'sense', 'needs_bootstrap', {
              error_message: `Bootstrap attempted but: ${sufficiency2.reason}`,
              context_snapshot: senseData2,
              execution_time_ms: Date.now() - startTime,
            });
            return { department, cycle_id: cycleId, success: false, aborted: true, reason: 'needs_bootstrap', missing: ['social_posts_minimum'] };
          }
        } else if (accountsToScrape.length === 0) {
          // No connected accounts at all
          await supabase.from('autopilot_decisions').insert({
            company_id: companyId,
            cycle_id: cycleId,
            decision_type: 'cold_start_content',
            priority: 'critical',
            description: 'Tu empresa es nueva en el mundo digital. No necesitas historial: crea tu primer contenido con IA desde el Marketing Hub y el Autopilot se encargará del resto.',
            reasoning: 'No connected social accounts found. Cold start mode: user can generate initial content with AI agents.',
            action_taken: false,
            guardrail_result: 'needs_action',
            expected_impact: { suggested_action: 'generate_initial_content' },
          });
          await logExecution(companyId, cycleId, department, 'sense', 'needs_bootstrap', {
            error_message: 'No connected social accounts. Bootstrap impossible.',
            context_snapshot: senseData,
            execution_time_ms: Date.now() - startTime,
          });
          return { department, cycle_id: cycleId, success: false, aborted: true, reason: 'needs_bootstrap', missing: ['social_accounts_connected', 'social_posts_minimum'] };
        }
      } else {
        // Non-marketing departments: original behavior
        await logExecution(companyId, cycleId, department, 'sense', 'insufficient_data', {
          error_message: sufficiency.reason,
          context_snapshot: senseData,
          execution_time_ms: Date.now() - startTime,
        });
        return { department, cycle_id: cycleId, success: false, aborted: true, reason: sufficiency.reason };
      }
    }

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
    const pending = guarded.filter(d => ['sent_to_approval', 'requires_approval', 'escalated'].includes(d.guardrail_result)).length;
    const passed = guarded.filter(d => ['passed', 'auto_approved', 'post_review'].includes(d.guardrail_result)).length;
    await logExecution(companyId, cycleId, department, 'guard', 'completed', {
      decisions: guarded, content_approved: passed, content_rejected: blocked,
      content_pending_review: pending, execution_time_ms: Date.now() - guardStart,
    });

    // ACT
    console.log(`⚡ [${department}] ACT`);
    const actStart = Date.now();
    const actResult = await actPhase(companyId, department, guarded, cycleId);
    const actions = actResult.results;
    const cycleCreditsConsumed = actResult.credits_consumed;
    await logExecution(companyId, cycleId, department, 'act', 'completed', {
      actions, content_generated: actions.filter((a: any) => a.action_taken).length,
      credits_consumed: cycleCreditsConsumed,
      execution_time_ms: Date.now() - actStart,
    });

    // LEARN
    console.log(`📚 [${department}] LEARN`);
    await learnPhase(companyId, department, cycleId, actions, Date.now() - startTime);

    // CAPABILITY GENESIS (Gap Detection + Proposal)
    console.log(`🧬 [${department}] CAPABILITY GENESIS`);
    const gapReport = await detectCapabilityGaps(companyId, department);
    const proposedCaps = await proposeNewCapabilities(companyId, department, gapReport);
    if (proposedCaps.length > 0) {
      console.log(`✨ [${department}] Proposed ${proposedCaps.length} new capabilities: ${proposedCaps.join(', ')}`);
    }

    // ═══ GAP 1: PROCESS APPROVED CAPABILITIES (Approval → Trial Bridge) ═══
    console.log(`🔗 [${department}] GOVERNANCE BRIDGE`);
    const approvedCaps = await processApprovedCapabilities(companyId);
    if (approvedCaps.length > 0) {
      console.log(`🔗 [${department}] Bridged ${approvedCaps.length} approved capabilities to trial: ${approvedCaps.join(', ')}`);
    }

    // ═══ GAP 1: UNIFIED CYCLE LOG IN autopilot_execution_log ═══
    const totalExecutionTime = Date.now() - startTime;
    const contentGenerated = actions.filter((a: any) => a.action_taken).length;
    const contentApproved = passed;
    const contentRejected = blocked;
    const contentPendingReview = pending;

    try {
      await supabase.from('autopilot_execution_log').insert({
        company_id: companyId,
        cycle_id: cycleId,
        phase: 'complete_cycle',
        status: 'completed',
        context_snapshot: senseData,
        decisions_made: decisions,
        actions_taken: actions.filter((a: any) => a.action_taken),
        credits_consumed: cycleCreditsConsumed,
        execution_time_ms: totalExecutionTime,
        content_generated: contentGenerated,
        content_approved: contentApproved,
        content_rejected: contentRejected,
        content_pending_review: contentPendingReview,
      });
      console.log(`📋 [${department}] Cycle summary logged to autopilot_execution_log (credits: ${cycleCreditsConsumed})`);
    } catch (logErr) {
      console.error(`⚠️ [${department}] Failed to write autopilot_execution_log:`, logErr);
    }

    console.log(`✅ [${department}] Cycle ${cycleId} done in ${totalExecutionTime}ms`);
    return { department, cycle_id: cycleId, total_decisions: decisions.length, passed, blocked, pending_review: pending, credits_consumed: cycleCreditsConsumed, execution_time_ms: totalExecutionTime };
  } catch (error) {
    console.error(`❌ [${department}] Cycle failed:`, error);
    await logExecution(companyId, cycleId, department, 'error', 'failed', {
      error_message: (error as Error).message, execution_time_ms: Date.now() - startTime,
    });
    // Also log failure to autopilot_execution_log
    try {
      await supabase.from('autopilot_execution_log').insert({
        company_id: companyId,
        cycle_id: cycleId,
        phase: 'complete_cycle',
        status: 'failed',
        error_message: (error as Error).message,
        execution_time_ms: Date.now() - startTime,
        credits_consumed: 0,
        content_generated: 0,
        content_approved: 0,
        content_rejected: 0,
        content_pending_review: 0,
      });
    } catch {}
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
// GAP 5: AUDITABLE CAPABILITY TRANSITION LOG
// ═══════════════════════════════════════════════════════════════

async function logCapabilityTransition(
  companyId: string,
  capabilityCode: string,
  fromStatus: string,
  toStatus: string,
  reason: string,
  cycleId?: string
) {
  try {
    await supabase.from('autopilot_execution_log').insert({
      company_id: companyId,
      cycle_id: cycleId || crypto.randomUUID(),
      phase: 'capability_lifecycle',
      status: `${fromStatus}_to_${toStatus}`,
      context_snapshot: {
        capability_code: capabilityCode,
        from_status: fromStatus,
        to_status: toStatus,
        reason,
        timestamp: new Date().toISOString(),
      },
      decisions_made: [],
      actions_taken: [],
      credits_consumed: 0,
      content_generated: 0,
      content_approved: 0,
      content_rejected: 0,
      content_pending_review: 0,
      execution_time_ms: 0,
    });
    console.log(`📝 [lifecycle] Transition logged: ${capabilityCode} ${fromStatus} → ${toStatus}`);
  } catch (err) {
    console.error(`⚠️ Failed to log capability transition for ${capabilityCode}:`, err);
  }
}

// ═══════════════════════════════════════════════════════════════
// GAP 1: BRIDGE APPROVAL → TRIAL (processApprovedCapabilities)
// ═══════════════════════════════════════════════════════════════

async function processApprovedCapabilities(companyId: string) {
  const { data: approvedItems } = await supabase.from('content_approvals')
    .select('id, content_id, content_data')
    .eq('company_id', companyId)
    .eq('content_type', 'capability_approval')
    .eq('status', 'approved');

  if (!approvedItems?.length) return [];

  const processed: string[] = [];
  for (const approval of approvedItems) {
    const capCode = approval.content_id || (approval.content_data as any)?.capability_code;
    if (!capCode) continue;

    // Get current capability status
    const { data: cap } = await supabase.from('autopilot_capabilities')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('capability_code', capCode)
      .maybeSingle();

    if (!cap || cap.status === 'trial' || cap.status === 'active') continue;

    const previousStatus = cap.status;
    const trialExpiry = new Date(Date.now() + 7 * 24 * 3600000).toISOString();

    // Transition capability to trial
    await supabase.from('autopilot_capabilities').update({
      status: 'trial',
      trial_expires_at: trialExpiry,
      last_evaluated_at: new Date().toISOString(),
    } as any).eq('id', cap.id);

    // Mark content_approval as published (final governance state)
    await supabase.from('content_approvals').update({
      status: 'published',
    }).eq('id', approval.id);

    // Log the transition
    await logCapabilityTransition(
      companyId,
      capCode,
      previousStatus,
      'trial',
      `Human approval received. Trial period until ${trialExpiry}`
    );

    processed.push(capCode);
    console.log(`🔗 [governance] Approval→Trial bridge: ${capCode} (${previousStatus} → trial, expires ${trialExpiry})`);
  }

  return processed;
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

    // Group by company for capability evaluation + lifecycle management
    const companies = [...new Set(eligible.map(c => c.company_id))];
    const capResults: Record<string, string[]> = {};
    for (const cId of companies) {
      capResults[cId] = await evaluateCapabilities(cId);
      await manageCapabilityLifecycle(cId);
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
