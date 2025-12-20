import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessStepRequest {
  action: 'enroll_contact' | 'process_step' | 'process_scheduled' | 'trigger_check';
  enrollmentId?: string;
  journeyId?: string;
  contactId?: string;
  context?: Record<string, unknown>;
  triggerType?: string;
  triggerData?: Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: ProcessStepRequest = await req.json();
    const { action } = request;

    let result: unknown;

    switch (action) {
      case 'enroll_contact':
        result = await enrollContact(supabase, request);
        break;
      case 'process_step':
        result = await processStep(supabase, request.enrollmentId!);
        break;
      case 'process_scheduled':
        result = await processScheduledExecutions(supabase);
        break;
      case 'trigger_check':
        result = await checkTriggers(supabase, request);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Journey engine error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function enrollContact(supabase: any, request: ProcessStepRequest) {
  const { journeyId, contactId, context = {} } = request;

  // Verify journey exists and is active
  const { data: journey, error: journeyError } = await supabase
    .from('journey_definitions')
    .select('*')
    .eq('id', journeyId)
    .eq('status', 'active')
    .single();

  if (journeyError || !journey) {
    throw new Error('Journey not found or not active');
  }

  // Check if contact is already enrolled
  const { data: existingEnrollment } = await supabase
    .from('journey_enrollments')
    .select('id, status')
    .eq('journey_id', journeyId)
    .eq('contact_id', contactId)
    .eq('status', 'active')
    .single();

  if (existingEnrollment && !journey.allow_re_enrollment) {
    throw new Error('Contact is already enrolled in this journey');
  }

  // Get the first step
  const { data: steps } = await supabase
    .from('journey_steps')
    .select('id')
    .eq('journey_id', journeyId)
    .order('position', { ascending: true })
    .limit(1);

  const firstStepId = steps?.[0]?.id;

  if (!firstStepId) {
    throw new Error('Journey has no steps');
  }

  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('journey_enrollments')
    .insert({
      journey_id: journeyId,
      contact_id: contactId,
      company_id: journey.company_id,
      current_step_id: firstStepId,
      enrollment_source: 'api',
      context: context,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (enrollError) throw enrollError;

  // Create first step execution
  await supabase
    .from('journey_step_executions')
    .insert({
      enrollment_id: enrollment.id,
      step_id: firstStepId,
      status: 'pending',
    });

  // Update journey stats
  await supabase
    .from('journey_definitions')
    .update({ total_enrolled: journey.total_enrolled + 1 })
    .eq('id', journeyId);

  // Process the first step immediately
  await processStep(supabase, enrollment.id);

  return enrollment;
}

async function processStep(supabase: any, enrollmentId: string) {
  // Get enrollment with current step
  const { data: enrollment, error: enrollError } = await supabase
    .from('journey_enrollments')
    .select(`
      *,
      current_step:journey_steps(*),
      contact:crm_contacts(*)
    `)
    .eq('id', enrollmentId)
    .single();

  if (enrollError || !enrollment) {
    throw new Error('Enrollment not found');
  }

  if (enrollment.status !== 'active') {
    return { message: 'Enrollment is not active', status: enrollment.status };
  }

  const step = enrollment.current_step;
  if (!step) {
    // No more steps - mark as completed
    await supabase
      .from('journey_enrollments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    return { message: 'Journey completed', status: 'completed' };
  }

  // Get or create step execution
  let { data: execution } = await supabase
    .from('journey_step_executions')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('step_id', step.id)
    .eq('status', 'pending')
    .single();

  if (!execution) {
    const { data: newExecution } = await supabase
      .from('journey_step_executions')
      .insert({
        enrollment_id: enrollmentId,
        step_id: step.id,
        status: 'pending',
      })
      .select()
      .single();
    execution = newExecution;
  }

  // Mark as executing
  await supabase
    .from('journey_step_executions')
    .update({ status: 'executing', started_at: new Date().toISOString() })
    .eq('id', execution.id);

  let result: unknown;
  let nextStepId: string | null = step.next_step_id;

  try {
    switch (step.step_type) {
      case 'send_email':
        result = await executeEmailStep(supabase, step, enrollment, execution.id);
        break;
      case 'delay':
        result = await executeDelayStep(supabase, step, enrollment, execution.id);
        return result; // Delay step schedules for later
      case 'condition':
        const conditionResult = await executeConditionStep(supabase, step, enrollment);
        nextStepId = conditionResult.passed ? step.condition_true_step_id : step.condition_false_step_id;
        result = conditionResult;
        break;
      case 'ai_decision':
        const aiResult = await executeAIDecisionStep(supabase, step, enrollment);
        nextStepId = aiResult.nextStepId;
        result = aiResult;
        break;
      case 'update_contact':
        result = await executeUpdateContactStep(supabase, step, enrollment);
        break;
      case 'add_tag':
        result = await executeAddTagStep(supabase, step, enrollment);
        break;
      case 'remove_tag':
        result = await executeRemoveTagStep(supabase, step, enrollment);
        break;
      case 'create_activity':
        result = await executeCreateActivityStep(supabase, step, enrollment);
        break;
      case 'exit':
        await supabase
          .from('journey_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollmentId);
        result = { message: 'Journey completed via exit step' };
        nextStepId = null;
        break;
      default:
        result = { message: `Step type ${step.step_type} not implemented` };
    }

    // Mark execution as completed
    await supabase
      .from('journey_step_executions')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        result: result,
      })
      .eq('id', execution.id);

    // Update enrollment stats
    await supabase
      .from('journey_enrollments')
      .update({
        steps_completed: enrollment.steps_completed + 1,
        current_step_id: nextStepId,
      })
      .eq('id', enrollmentId);

    // Update step stats
    await supabase
      .from('journey_steps')
      .update({
        total_executions: step.total_executions + 1,
        successful_executions: step.successful_executions + 1,
      })
      .eq('id', step.id);

    // Process next step if exists
    if (nextStepId) {
      await processStep(supabase, enrollmentId);
    } else if (step.step_type !== 'exit') {
      // No next step and not exit - mark as completed
      await supabase
        .from('journey_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', enrollmentId);
    }

    return result;
  } catch (error) {
    // Mark execution as failed
    await supabase
      .from('journey_step_executions')
      .update({
        status: 'failed',
        error_message: error.message,
        retry_count: execution.retry_count + 1,
      })
      .eq('id', execution.id);

    // Update step stats
    await supabase
      .from('journey_steps')
      .update({
        total_executions: step.total_executions + 1,
        failed_executions: step.failed_executions + 1,
      })
      .eq('id', step.id);

    throw error;
  }
}

async function executeEmailStep(supabase: any, step: any, enrollment: any, executionId: string) {
  const contact = enrollment.contact;
  
  if (!contact?.email) {
    return { success: false, message: 'Contact has no email' };
  }

  // Replace placeholders in subject and content
  let subject = step.email_subject || '';
  let content = step.email_content || '';

  subject = replacePlaceholders(subject, contact, enrollment.context);
  content = replacePlaceholders(content, contact, enrollment.context);

  // Call the send-email function
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      to: contact.email,
      subject: subject,
      htmlContent: content,
      recipientName: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
    },
  });

  if (error) throw error;

  // Update enrollment email stats
  await supabase
    .from('journey_enrollments')
    .update({ emails_sent: enrollment.emails_sent + 1 })
    .eq('id', enrollment.id);

  // Update execution with email info
  await supabase
    .from('journey_step_executions')
    .update({
      email_message_id: data?.messageId,
      email_status: 'sent',
    })
    .eq('id', executionId);

  return { success: true, messageId: data?.messageId };
}

async function executeDelayStep(supabase: any, step: any, enrollment: any, executionId: string) {
  const delayValue = step.delay_value || 1;
  const delayUnit = step.delay_unit || 'hours';

  let delayMs = delayValue;
  switch (delayUnit) {
    case 'minutes':
      delayMs = delayValue * 60 * 1000;
      break;
    case 'hours':
      delayMs = delayValue * 60 * 60 * 1000;
      break;
    case 'days':
      delayMs = delayValue * 24 * 60 * 60 * 1000;
      break;
    case 'weeks':
      delayMs = delayValue * 7 * 24 * 60 * 60 * 1000;
      break;
  }

  const scheduledFor = new Date(Date.now() + delayMs).toISOString();

  // Schedule the execution
  await supabase
    .from('journey_step_executions')
    .update({
      status: 'scheduled',
      scheduled_for: scheduledFor,
    })
    .eq('id', executionId);

  return { 
    success: true, 
    message: `Step scheduled for ${scheduledFor}`,
    scheduled_for: scheduledFor,
  };
}

async function executeConditionStep(supabase: any, step: any, enrollment: any) {
  const contact = enrollment.contact;
  const config = step.step_config || {};
  const conditions = config.conditions || [];

  let passed = true;

  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const contactValue = contact[field];

    switch (operator) {
      case 'equals':
        passed = passed && contactValue === value;
        break;
      case 'not_equals':
        passed = passed && contactValue !== value;
        break;
      case 'contains':
        passed = passed && String(contactValue || '').includes(value);
        break;
      case 'greater_than':
        passed = passed && Number(contactValue) > Number(value);
        break;
      case 'less_than':
        passed = passed && Number(contactValue) < Number(value);
        break;
      case 'is_set':
        passed = passed && contactValue != null && contactValue !== '';
        break;
      case 'is_not_set':
        passed = passed && (contactValue == null || contactValue === '');
        break;
    }
  }

  return { passed, conditions_evaluated: conditions.length };
}

async function executeAIDecisionStep(supabase: any, step: any, enrollment: any) {
  const contact = enrollment.contact;
  const prompt = replacePlaceholders(step.ai_prompt || '', contact, enrollment.context);
  const options = step.ai_options || {};

  // Call AI to make a decision
  try {
    const { data, error } = await supabase.functions.invoke('ai-completions', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are a marketing automation assistant. Based on the following information about a contact, choose the best option. 
            Available options: ${JSON.stringify(Object.keys(options))}
            Respond with ONLY the option key, nothing else.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      },
    });

    if (error) throw error;

    const decision = data?.content?.trim() || Object.keys(options)[0];
    const nextStepId = options[decision] || step.condition_true_step_id;

    return {
      decision,
      nextStepId,
      aiResponse: data?.content,
    };
  } catch (error) {
    console.error('AI decision error:', error);
    // Fall back to first option
    const fallbackDecision = Object.keys(options)[0];
    return {
      decision: fallbackDecision,
      nextStepId: options[fallbackDecision] || step.condition_true_step_id,
      error: error.message,
    };
  }
}

async function executeUpdateContactStep(supabase: any, step: any, enrollment: any) {
  const config = step.step_config || {};
  const updates = config.updates || {};

  const { error } = await supabase
    .from('crm_contacts')
    .update(updates)
    .eq('id', enrollment.contact_id);

  if (error) throw error;

  return { success: true, updated_fields: Object.keys(updates) };
}

async function executeAddTagStep(supabase: any, step: any, enrollment: any) {
  const config = step.step_config || {};
  const tagsToAdd = config.tags || [];

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('ai_tags')
    .eq('id', enrollment.contact_id)
    .single();

  const currentTags = contact?.ai_tags || [];
  const newTags = [...new Set([...currentTags, ...tagsToAdd])];

  await supabase
    .from('crm_contacts')
    .update({ ai_tags: newTags })
    .eq('id', enrollment.contact_id);

  return { success: true, tags_added: tagsToAdd };
}

async function executeRemoveTagStep(supabase: any, step: any, enrollment: any) {
  const config = step.step_config || {};
  const tagsToRemove = config.tags || [];

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('ai_tags')
    .eq('id', enrollment.contact_id)
    .single();

  const currentTags = contact?.ai_tags || [];
  const newTags = currentTags.filter((t: string) => !tagsToRemove.includes(t));

  await supabase
    .from('crm_contacts')
    .update({ ai_tags: newTags })
    .eq('id', enrollment.contact_id);

  return { success: true, tags_removed: tagsToRemove };
}

async function executeCreateActivityStep(supabase: any, step: any, enrollment: any) {
  const config = step.step_config || {};

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      company_id: enrollment.company_id,
      contact_id: enrollment.contact_id,
      activity_type: config.activity_type || 'task',
      subject: replacePlaceholders(config.subject || 'Automated task', enrollment.contact, enrollment.context),
      description: replacePlaceholders(config.description || '', enrollment.contact, enrollment.context),
      activity_date: new Date().toISOString(),
      ai_generated: true,
    })
    .select()
    .single();

  if (error) throw error;

  return { success: true, activity_id: data.id };
}

async function processScheduledExecutions(supabase: any) {
  const now = new Date().toISOString();

  // Find scheduled executions that are due
  const { data: executions, error } = await supabase
    .from('journey_step_executions')
    .select('*, enrollment:journey_enrollments(*)')
    .eq('status', 'scheduled')
    .lte('scheduled_for', now)
    .limit(50);

  if (error) throw error;

  const results = [];

  for (const execution of executions || []) {
    try {
      // Move to the next step
      const { data: step } = await supabase
        .from('journey_steps')
        .select('*')
        .eq('id', execution.step_id)
        .single();

      // Mark current execution as completed
      await supabase
        .from('journey_step_executions')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', execution.id);

      // Update enrollment to next step
      const nextStepId = step?.next_step_id;
      
      await supabase
        .from('journey_enrollments')
        .update({
          current_step_id: nextStepId,
          steps_completed: execution.enrollment.steps_completed + 1,
        })
        .eq('id', execution.enrollment_id);

      // Process next step if exists
      if (nextStepId) {
        await processStep(supabase, execution.enrollment_id);
      } else {
        // No next step - mark as completed
        await supabase
          .from('journey_enrollments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', execution.enrollment_id);
      }

      results.push({ execution_id: execution.id, status: 'processed' });
    } catch (error) {
      results.push({ execution_id: execution.id, status: 'error', error: error.message });
    }
  }

  return { processed: results.length, results };
}

async function checkTriggers(supabase: any, request: ProcessStepRequest) {
  const { triggerType, triggerData } = request;

  if (!triggerType || !triggerData) {
    throw new Error('Trigger type and data are required');
  }

  const companyId = triggerData.company_id;
  const contactId = triggerData.contact_id;

  if (!companyId || !contactId) {
    throw new Error('Company ID and Contact ID are required');
  }

  // Find active journeys with matching trigger
  const { data: journeys, error } = await supabase
    .from('journey_definitions')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .eq('trigger_type', triggerType);

  if (error) throw error;

  const enrolled = [];

  for (const journey of journeys || []) {
    // Check trigger conditions
    const conditions = journey.trigger_conditions || {};
    let shouldEnroll = true;

    // Evaluate conditions based on trigger type
    switch (triggerType) {
      case 'lifecycle_change':
        if (conditions.from_stage && triggerData.from_stage !== conditions.from_stage) {
          shouldEnroll = false;
        }
        if (conditions.to_stage && triggerData.to_stage !== conditions.to_stage) {
          shouldEnroll = false;
        }
        break;
      case 'tag_added':
        if (conditions.tag && !triggerData.tags?.includes(conditions.tag)) {
          shouldEnroll = false;
        }
        break;
      case 'deal_created':
        if (conditions.pipeline_id && triggerData.pipeline_id !== conditions.pipeline_id) {
          shouldEnroll = false;
        }
        break;
    }

    if (shouldEnroll) {
      try {
        const enrollment = await enrollContact(supabase, {
          action: 'enroll_contact',
          journeyId: journey.id,
          contactId: contactId as string,
          context: triggerData as Record<string, unknown>,
        });
        enrolled.push({ journey_id: journey.id, enrollment_id: enrollment.id });
      } catch (error) {
        console.error(`Failed to enroll in journey ${journey.id}:`, error);
      }
    }
  }

  return { triggered: triggerType, enrolled };
}

function replacePlaceholders(text: string, contact: any, context: any = {}): string {
  const data = { ...contact, ...context };
  
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] ?? match;
  });
}
