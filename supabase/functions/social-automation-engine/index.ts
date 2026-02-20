import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SOCIAL AUTOMATION ENGINE
 * 
 * Real-time listener that evaluates social automation rules
 * and executes action_payloads when triggers match.
 * 
 * Actions:
 * - evaluate_rules: Process incoming social event against active rules
 * - execute_rule: Force-execute a specific rule
 * - get_execution_log: Get execution history
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, company_id, event_data, rule_id } = body;

    if (!company_id) {
      return new Response(JSON.stringify({ success: false, error: 'company_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    switch (action) {
      case 'evaluate_rules':
        return await evaluateRules(company_id, event_data);
      case 'execute_rule':
        return await executeRule(company_id, rule_id, event_data);
      case 'get_execution_log':
        return await getExecutionLog(company_id, body.limit || 50);
      default:
        return new Response(JSON.stringify({ success: false, error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Social automation engine error:', error);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ═══════════════════════════════════════
// EVALUATE RULES against an incoming event
// ═══════════════════════════════════════
async function evaluateRules(companyId: string, eventData: any) {
  const startTime = Date.now();

  if (!eventData?.platform || !eventData?.trigger_type) {
    return jsonResponse({ success: false, error: 'event_data must include platform and trigger_type' }, 400);
  }

  // Fetch active rules for this company + platform + trigger
  const { data: rules, error } = await supabase
    .from('social_automation_rules')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('trigger_type', eventData.trigger_type)
    .contains('platforms', [eventData.platform]);

  if (error) throw error;

  const results: any[] = [];

  for (const rule of (rules || [])) {
    // Check cooldown
    if (rule.last_triggered_at && rule.cooldown_minutes) {
      const cooldownEnd = new Date(rule.last_triggered_at).getTime() + rule.cooldown_minutes * 60000;
      if (Date.now() < cooldownEnd) {
        results.push({ rule_id: rule.id, status: 'skipped', reason: 'cooldown_active' });
        continue;
      }
    }

    // Evaluate trigger condition
    const matches = evaluateTriggerCondition(rule.trigger_config, eventData);
    if (!matches) {
      results.push({ rule_id: rule.id, status: 'skipped', reason: 'condition_not_met' });
      continue;
    }

    // Execute action
    const execResult = await executeAction(companyId, rule, eventData);
    results.push(execResult);

    // Update rule stats
    await supabase
      .from('social_automation_rules')
      .update({
        execution_count: (rule.execution_count || 0) + 1,
        last_triggered_at: new Date().toISOString(),
      })
      .eq('id', rule.id);
  }

  return jsonResponse({
    success: true,
    rules_evaluated: (rules || []).length,
    results,
    execution_time_ms: Date.now() - startTime,
  });
}

// ═══════════════════════════════════════
// EXECUTE a single rule directly
// ═══════════════════════════════════════
async function executeRule(companyId: string, ruleId: string, eventData: any) {
  if (!ruleId) {
    return jsonResponse({ success: false, error: 'rule_id required' }, 400);
  }

  const { data: rule, error } = await supabase
    .from('social_automation_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('company_id', companyId)
    .single();

  if (error || !rule) {
    return jsonResponse({ success: false, error: 'Rule not found' }, 404);
  }

  const result = await executeAction(companyId, rule, eventData || {});

  // Update stats
  await supabase
    .from('social_automation_rules')
    .update({
      execution_count: (rule.execution_count || 0) + 1,
      last_triggered_at: new Date().toISOString(),
    })
    .eq('id', ruleId);

  return jsonResponse({ success: true, result });
}

// ═══════════════════════════════════════
// GET EXECUTION LOG
// ═══════════════════════════════════════
async function getExecutionLog(companyId: string, limit: number) {
  const { data, error } = await supabase
    .from('automation_execution_log')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return jsonResponse({ success: true, logs: data || [] });
}

// ═══════════════════════════════════════
// TRIGGER CONDITION EVALUATOR
// ═══════════════════════════════════════
function evaluateTriggerCondition(triggerConfig: any, eventData: any): boolean {
  if (!triggerConfig || Object.keys(triggerConfig).length === 0) {
    return true; // No conditions = always match
  }

  // Keyword matching
  if (triggerConfig.keywords?.length > 0 && eventData.text) {
    const text = eventData.text.toLowerCase();
    const keywordMatch = triggerConfig.keywords.some((kw: string) =>
      text.includes(kw.toLowerCase())
    );
    if (triggerConfig.keyword_match_mode === 'all') {
      const allMatch = triggerConfig.keywords.every((kw: string) =>
        text.includes(kw.toLowerCase())
      );
      if (!allMatch) return false;
    } else if (!keywordMatch) {
      return false;
    }
  }

  // Sentiment filter
  if (triggerConfig.sentiment && eventData.sentiment) {
    if (triggerConfig.sentiment !== eventData.sentiment) return false;
  }

  // Username filter
  if (triggerConfig.from_usernames?.length > 0 && eventData.username) {
    if (!triggerConfig.from_usernames.includes(eventData.username.toLowerCase())) {
      return false;
    }
  }

  // Follower threshold
  if (triggerConfig.min_followers && eventData.follower_count) {
    if (eventData.follower_count < triggerConfig.min_followers) return false;
  }

  return true;
}

// ═══════════════════════════════════════
// ACTION EXECUTOR
// ═══════════════════════════════════════
async function executeAction(companyId: string, rule: any, eventData: any) {
  const startTime = Date.now();
  let status = 'executed';
  let actionResult: any = {};
  let errorMessage: string | null = null;

  try {
    switch (rule.action_type) {
      case 'auto_reply':
        actionResult = await executeAutoReply(companyId, rule.action_config, eventData);
        break;
      case 'send_dm':
        actionResult = await executeSendDM(companyId, rule.action_config, eventData);
        break;
      case 'create_content_approval':
        actionResult = await executeCreateApproval(companyId, rule.action_config, eventData);
        break;
      case 'notify_team':
        actionResult = await executeNotifyTeam(companyId, rule.action_config, eventData);
        break;
      case 'tag_contact':
        actionResult = await executeTagContact(companyId, rule.action_config, eventData);
        break;
      case 'log_event':
        actionResult = { logged: true, event: eventData };
        break;
      default:
        actionResult = { action: rule.action_type, config: rule.action_config, note: 'Custom action registered' };
    }
  } catch (err) {
    status = 'failed';
    errorMessage = (err as Error).message;
    actionResult = { error: errorMessage };
  }

  const executionTimeMs = Date.now() - startTime;

  // Log execution
  await supabase.from('automation_execution_log').insert({
    company_id: companyId,
    rule_id: rule.id,
    platform: eventData.platform || 'unknown',
    trigger_type: rule.trigger_type,
    trigger_data: eventData,
    action_type: rule.action_type,
    action_payload: rule.action_config,
    action_result: actionResult,
    status,
    error_message: errorMessage,
    execution_time_ms: executionTimeMs,
  });

  return {
    rule_id: rule.id,
    rule_name: rule.name,
    action_type: rule.action_type,
    status,
    error_message: errorMessage,
    execution_time_ms: executionTimeMs,
    result: actionResult,
  };
}

// ═══════════════════════════════════════
// ACTION IMPLEMENTATIONS
// ═══════════════════════════════════════

async function executeAutoReply(companyId: string, config: any, eventData: any) {
  // Use Upload-Post API to send reply
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('upload_post_profile_key')
    .eq('company_id', companyId)
    .eq('platform', eventData.platform)
    .eq('is_active', true)
    .limit(1);

  if (!accounts?.length) {
    return { sent: false, reason: 'No active social account for platform' };
  }

  // Interpolate reply template
  const replyText = interpolateTemplate(config.reply_template || config.message || '', eventData);

  // Call upload-post-manager to post reply
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/upload-post-manager`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'post_now',
      profile_key: accounts[0].upload_post_profile_key,
      post: {
        text: replyText,
        platforms: { [eventData.platform]: true },
        in_reply_to: eventData.post_id || eventData.comment_id,
      },
    }),
  });

  const result = await response.json();
  return { sent: true, reply_text: replyText, upload_post_result: result };
}

async function executeSendDM(companyId: string, config: any, eventData: any) {
  const message = interpolateTemplate(config.message_template || config.message || '', eventData);
  return { dm_queued: true, to: eventData.username, message, note: 'DM action registered for platform API' };
}

async function executeCreateApproval(companyId: string, config: any, eventData: any) {
  const { data, error } = await supabase.from('content_approvals').insert({
    company_id: companyId,
    content_id: `auto-${Date.now()}`,
    content_type: config.content_type || 'social_response',
    content_data: {
      trigger_event: eventData,
      suggested_response: config.suggested_response || '',
      priority: config.priority || 'normal',
    },
    status: 'draft',
  }).select().single();

  if (error) throw error;
  return { approval_created: true, approval_id: data.id };
}

async function executeNotifyTeam(companyId: string, config: any, eventData: any) {
  // Send internal email via buildera email system
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-buildera-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: config.notify_email || config.emails,
      subject: `[Automation] ${config.alert_title || 'Social Event Detected'}`,
      htmlBody: `<p>Evento detectado: ${eventData.trigger_type} en ${eventData.platform}</p>
                 <p>Contenido: ${eventData.text || 'N/A'}</p>
                 <p>Usuario: ${eventData.username || 'N/A'}</p>`,
    }),
  });

  const result = await response.json();
  return { notified: true, result };
}

async function executeTagContact(companyId: string, config: any, eventData: any) {
  // Tag in CRM if contact exists
  const { data: contacts } = await supabase
    .from('crm_contacts')
    .select('id, tags')
    .eq('company_id', companyId)
    .ilike('social_handle', `%${eventData.username || ''}%`)
    .limit(1);

  if (contacts?.length) {
    const existingTags = contacts[0].tags || [];
    const newTags = [...new Set([...existingTags, ...(config.tags || [])])];
    await supabase
      .from('crm_contacts')
      .update({ tags: newTags })
      .eq('id', contacts[0].id);
    return { tagged: true, contact_id: contacts[0].id, tags: newTags };
  }

  return { tagged: false, reason: 'Contact not found in CRM' };
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function interpolateTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
