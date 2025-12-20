-- Create enum types for journey system
CREATE TYPE journey_trigger_type AS ENUM (
  'lifecycle_change',
  'manual', 
  'tag_added',
  'deal_created',
  'deal_stage_changed',
  'form_submit',
  'inbound_email',
  'ai_triggered',
  'contact_created',
  'activity_completed'
);

CREATE TYPE journey_step_type AS ENUM (
  'send_email',
  'delay',
  'condition',
  'ai_decision',
  'update_contact',
  'create_activity',
  'move_deal_stage',
  'add_tag',
  'remove_tag',
  'webhook',
  'enroll_in_journey',
  'exit'
);

CREATE TYPE journey_status AS ENUM (
  'draft',
  'active',
  'paused',
  'archived'
);

CREATE TYPE journey_enrollment_status AS ENUM (
  'active',
  'completed',
  'goal_reached',
  'exited',
  'failed',
  'paused'
);

CREATE TYPE journey_execution_status AS ENUM (
  'pending',
  'scheduled',
  'executing',
  'executed',
  'failed',
  'skipped'
);

-- Journey Definitions table
CREATE TABLE public.journey_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status journey_status NOT NULL DEFAULT 'draft',
  
  -- Trigger configuration
  trigger_type journey_trigger_type NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Goal configuration
  goal_type TEXT, -- 'deal_won', 'lifecycle_reached', 'tag_added', 'custom', null = no goal
  goal_conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Settings
  allow_re_enrollment BOOLEAN DEFAULT false,
  re_enrollment_delay_days INTEGER DEFAULT 30,
  max_enrollments_per_contact INTEGER DEFAULT 1,
  
  -- Entry/Exit rules
  entry_segment_conditions JSONB DEFAULT '{}'::jsonb,
  exit_conditions JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Stats cache
  total_enrolled INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  total_goal_reached INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Journey Steps table
CREATE TABLE public.journey_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journey_definitions(id) ON DELETE CASCADE,
  
  -- Step identification
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Step type and configuration
  step_type journey_step_type NOT NULL,
  step_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Email specific (optional)
  email_template_id UUID,
  email_subject TEXT,
  email_content TEXT,
  
  -- Flow control
  next_step_id UUID REFERENCES public.journey_steps(id) ON DELETE SET NULL,
  condition_true_step_id UUID REFERENCES public.journey_steps(id) ON DELETE SET NULL,
  condition_false_step_id UUID REFERENCES public.journey_steps(id) ON DELETE SET NULL,
  
  -- AI Decision specific
  ai_prompt TEXT,
  ai_options JSONB DEFAULT '{}'::jsonb,
  
  -- Delay specific
  delay_value INTEGER,
  delay_unit TEXT, -- 'minutes', 'hours', 'days', 'weeks'
  
  -- Visual position for builder
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  
  -- Stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Journey Enrollments table
CREATE TABLE public.journey_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id UUID NOT NULL REFERENCES public.journey_definitions(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Status tracking
  status journey_enrollment_status NOT NULL DEFAULT 'active',
  current_step_id UUID REFERENCES public.journey_steps(id) ON DELETE SET NULL,
  
  -- Timestamps
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  exited_at TIMESTAMP WITH TIME ZONE,
  goal_reached_at TIMESTAMP WITH TIME ZONE,
  
  -- Context and metadata
  enrollment_source TEXT, -- 'trigger', 'manual', 'ai', 'api'
  enrolled_by UUID,
  exit_reason TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  
  -- Progress tracking
  steps_completed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate enrollments
  UNIQUE(journey_id, contact_id, enrolled_at)
);

-- Journey Step Executions table
CREATE TABLE public.journey_step_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.journey_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.journey_steps(id) ON DELETE CASCADE,
  
  -- Execution status
  status journey_execution_status NOT NULL DEFAULT 'pending',
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  
  -- Result tracking
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- For condition/AI steps
  decision_made TEXT,
  decision_reason TEXT,
  
  -- Email tracking
  email_message_id TEXT,
  email_status TEXT,
  email_opened_at TIMESTAMP WITH TIME ZONE,
  email_clicked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_journey_definitions_company ON public.journey_definitions(company_id);
CREATE INDEX idx_journey_definitions_status ON public.journey_definitions(status);
CREATE INDEX idx_journey_definitions_trigger ON public.journey_definitions(trigger_type);

CREATE INDEX idx_journey_steps_journey ON public.journey_steps(journey_id);
CREATE INDEX idx_journey_steps_type ON public.journey_steps(step_type);

CREATE INDEX idx_journey_enrollments_journey ON public.journey_enrollments(journey_id);
CREATE INDEX idx_journey_enrollments_contact ON public.journey_enrollments(contact_id);
CREATE INDEX idx_journey_enrollments_company ON public.journey_enrollments(company_id);
CREATE INDEX idx_journey_enrollments_status ON public.journey_enrollments(status);
CREATE INDEX idx_journey_enrollments_current_step ON public.journey_enrollments(current_step_id);

CREATE INDEX idx_journey_step_executions_enrollment ON public.journey_step_executions(enrollment_id);
CREATE INDEX idx_journey_step_executions_step ON public.journey_step_executions(step_id);
CREATE INDEX idx_journey_step_executions_status ON public.journey_step_executions(status);
CREATE INDEX idx_journey_step_executions_scheduled ON public.journey_step_executions(scheduled_for) WHERE status = 'scheduled';

-- Enable RLS
ALTER TABLE public.journey_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_step_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journey_definitions
CREATE POLICY "Company members can view journeys"
  ON public.journey_definitions
  FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage journeys"
  ON public.journey_definitions
  FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ))
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ));

-- RLS Policies for journey_steps
CREATE POLICY "Company members can view journey steps"
  ON public.journey_steps
  FOR SELECT
  USING (journey_id IN (
    SELECT jd.id FROM public.journey_definitions jd
    JOIN public.company_members cm ON cm.company_id = jd.company_id
    WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage journey steps"
  ON public.journey_steps
  FOR ALL
  USING (journey_id IN (
    SELECT jd.id FROM public.journey_definitions jd
    JOIN public.company_members cm ON cm.company_id = jd.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ))
  WITH CHECK (journey_id IN (
    SELECT jd.id FROM public.journey_definitions jd
    JOIN public.company_members cm ON cm.company_id = jd.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ));

-- RLS Policies for journey_enrollments
CREATE POLICY "Company members can view enrollments"
  ON public.journey_enrollments
  FOR SELECT
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage enrollments"
  ON public.journey_enrollments
  FOR ALL
  USING (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ))
  WITH CHECK (company_id IN (
    SELECT cm.company_id FROM public.company_members cm 
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ));

-- RLS Policies for journey_step_executions
CREATE POLICY "Company members can view executions"
  ON public.journey_step_executions
  FOR SELECT
  USING (enrollment_id IN (
    SELECT je.id FROM public.journey_enrollments je
    JOIN public.company_members cm ON cm.company_id = je.company_id
    WHERE cm.user_id = auth.uid()
  ));

CREATE POLICY "Company admins can manage executions"
  ON public.journey_step_executions
  FOR ALL
  USING (enrollment_id IN (
    SELECT je.id FROM public.journey_enrollments je
    JOIN public.company_members cm ON cm.company_id = je.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ))
  WITH CHECK (enrollment_id IN (
    SELECT je.id FROM public.journey_enrollments je
    JOIN public.company_members cm ON cm.company_id = je.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('owner', 'admin')
  ));

-- Triggers for updated_at
CREATE TRIGGER update_journey_definitions_updated_at
  BEFORE UPDATE ON public.journey_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_steps_updated_at
  BEFORE UPDATE ON public.journey_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_enrollments_updated_at
  BEFORE UPDATE ON public.journey_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journey_step_executions_updated_at
  BEFORE UPDATE ON public.journey_step_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();