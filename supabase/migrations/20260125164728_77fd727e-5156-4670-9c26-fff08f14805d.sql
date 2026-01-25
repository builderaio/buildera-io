-- =============================================
-- MODULE: Play to Win Strategy (Roger Martin Framework)
-- =============================================

-- Tabla principal para la estrategia Play to Win
CREATE TABLE public.company_play_to_win (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Paso 1: Winning Aspiration (¿Qué significa ganar?)
  winning_aspiration TEXT,
  aspiration_metrics JSONB DEFAULT '[]'::jsonb, -- [{metric, target, current, unit}]
  aspiration_timeline TEXT, -- '1_year', '3_years', '5_years'
  
  -- Paso 2: Where to Play (¿Dónde competir?)
  target_markets JSONB DEFAULT '[]'::jsonb, -- [{name, description, priority, size_estimate}]
  target_segments JSONB DEFAULT '[]'::jsonb, -- [{name, description, size, growth_potential}]
  geographic_focus JSONB DEFAULT '[]'::jsonb, -- [{region, country, priority}]
  channels_focus JSONB DEFAULT '[]'::jsonb, -- [{channel, priority, rationale}]
  
  -- Paso 3: How to Win (¿Cómo ganar?)
  competitive_advantage TEXT,
  differentiation_factors JSONB DEFAULT '[]'::jsonb, -- [{factor, description, evidence}]
  value_proposition_canvas JSONB, -- {customer_jobs, pains, gains, products, pain_relievers, gain_creators}
  moat_type TEXT, -- 'cost', 'differentiation', 'focus', 'network_effects'
  
  -- Paso 4: Capabilities (¿Qué capacidades necesito?)
  required_capabilities JSONB DEFAULT '[]'::jsonb, -- [{name, category, current_level, target_level, gap, actions}]
  capability_roadmap JSONB DEFAULT '[]'::jsonb, -- [{capability_id, milestone, target_date, status}]
  
  -- Paso 5: Management Systems (¿Cómo gestionar?)
  review_cadence TEXT DEFAULT 'monthly', -- 'weekly', 'biweekly', 'monthly', 'quarterly'
  okrs JSONB DEFAULT '[]'::jsonb, -- [{objective, key_results: [{result, target, current, status}]}]
  kpi_definitions JSONB DEFAULT '[]'::jsonb, -- [{name, formula, target, frequency, owner}]
  governance_model JSONB, -- {decision_rights, escalation_path, review_meetings}
  
  -- Meta
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  last_review_date DATE,
  next_review_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete', 'reviewing')),
  generated_with_ai BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_ptw_company ON public.company_play_to_win(company_id);
CREATE INDEX idx_ptw_status ON public.company_play_to_win(status);

-- Tabla para historial de revisiones estratégicas
CREATE TABLE public.company_ptw_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ptw_id UUID NOT NULL REFERENCES public.company_play_to_win(id) ON DELETE CASCADE,
  
  review_type TEXT NOT NULL CHECK (review_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
  review_date DATE NOT NULL,
  
  -- Snapshot de métricas al momento del review
  metrics_snapshot JSONB,
  okr_progress_snapshot JSONB,
  
  -- Insights del review
  wins TEXT[], -- logros del período
  challenges TEXT[], -- desafíos encontrados
  learnings TEXT[], -- aprendizajes
  adjustments JSONB, -- cambios propuestos
  
  -- Decisiones
  decisions_made JSONB DEFAULT '[]'::jsonb, -- [{decision, rationale, owner, deadline}]
  action_items JSONB DEFAULT '[]'::jsonb, -- [{action, owner, deadline, status}]
  
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para reviews
CREATE INDEX idx_ptw_reviews_company ON public.company_ptw_reviews(company_id);
CREATE INDEX idx_ptw_reviews_ptw ON public.company_ptw_reviews(ptw_id);
CREATE INDEX idx_ptw_reviews_date ON public.company_ptw_reviews(review_date DESC);

-- Trigger para updated_at
CREATE TRIGGER update_company_play_to_win_updated_at
  BEFORE UPDATE ON public.company_play_to_win
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_trigger();

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE public.company_play_to_win ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ptw_reviews ENABLE ROW LEVEL SECURITY;

-- Policies para company_play_to_win
CREATE POLICY "Users can view their company PTW strategy"
  ON public.company_play_to_win FOR SELECT
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert PTW strategy for their company"
  ON public.company_play_to_win FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company PTW strategy"
  ON public.company_play_to_win FOR UPDATE
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company PTW strategy"
  ON public.company_play_to_win FOR DELETE
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Policies para company_ptw_reviews
CREATE POLICY "Users can view their company PTW reviews"
  ON public.company_ptw_reviews FOR SELECT
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert PTW reviews for their company"
  ON public.company_ptw_reviews FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company PTW reviews"
  ON public.company_ptw_reviews FOR UPDATE
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company PTW reviews"
  ON public.company_ptw_reviews FOR DELETE
  USING (
    company_id IN (
      SELECT cm.company_id FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );