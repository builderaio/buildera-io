-- Create company_agent_configurations table for storing agent configurations per company
CREATE TABLE public.company_agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.platform_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Agent configuration (dynamic based on input_schema)
  configuration JSONB NOT NULL DEFAULT '{}',
  
  -- For recurring agents
  is_recurring BOOLEAN DEFAULT false,
  schedule_config JSONB DEFAULT NULL, -- {frequency: 'daily'|'weekly'|'monthly', time: '09:00', days: [1,3,5], timezone: 'America/Mexico_City'}
  next_execution_at TIMESTAMPTZ DEFAULT NULL,
  last_execution_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Execution tracking
  total_executions INTEGER DEFAULT 0,
  last_execution_status TEXT DEFAULT NULL,
  last_execution_result JSONB DEFAULT NULL,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(company_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.company_agent_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company agent configurations"
ON public.company_agent_configurations
FOR SELECT
USING (
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create agent configurations for their companies"
ON public.company_agent_configurations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their company agent configurations"
ON public.company_agent_configurations
FOR UPDATE
USING (
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their company agent configurations"
ON public.company_agent_configurations
FOR DELETE
USING (
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm WHERE cm.user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_company_agent_configs_company ON public.company_agent_configurations(company_id);
CREATE INDEX idx_company_agent_configs_agent ON public.company_agent_configurations(agent_id);
CREATE INDEX idx_company_agent_configs_next_exec ON public.company_agent_configurations(next_execution_at) WHERE is_recurring = true AND is_active = true;

-- Trigger to update updated_at
CREATE TRIGGER update_company_agent_configurations_updated_at
BEFORE UPDATE ON public.company_agent_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate input_schema for existing platform agents
UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": ["topic", "platform"],
  "properties": {
    "topic": {
      "type": "string",
      "title": "Tema del contenido",
      "description": "¿Sobre qué quieres crear contenido?"
    },
    "platform": {
      "type": "string",
      "title": "Plataforma",
      "enum": ["instagram", "linkedin", "twitter", "facebook", "tiktok"],
      "description": "Plataforma de destino"
    },
    "tone": {
      "type": "string",
      "title": "Tono",
      "enum": ["professional", "casual", "inspirational", "educational", "humorous"],
      "default": "professional",
      "description": "Tono del contenido"
    },
    "content_type": {
      "type": "string",
      "title": "Tipo de contenido",
      "enum": ["post", "carousel", "story", "reel"],
      "default": "post"
    }
  }
}'::jsonb WHERE internal_code = 'CONTENT_CREATOR';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": [],
  "properties": {
    "analysis_depth": {
      "type": "string",
      "title": "Profundidad del análisis",
      "enum": ["quick", "standard", "deep"],
      "default": "standard",
      "description": "Nivel de detalle del análisis"
    },
    "focus_areas": {
      "type": "array",
      "title": "Áreas de enfoque",
      "items": {
        "type": "string",
        "enum": ["brand_identity", "target_audience", "competitors", "market_trends", "growth_opportunities"]
      },
      "description": "Áreas específicas a analizar"
    },
    "time_horizon": {
      "type": "string",
      "title": "Horizonte temporal",
      "enum": ["short_term", "medium_term", "long_term"],
      "default": "medium_term"
    }
  }
}'::jsonb WHERE internal_code = 'MKTG_STRATEGIST';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": [],
  "properties": {
    "platforms": {
      "type": "array",
      "title": "Plataformas a analizar",
      "items": {
        "type": "string",
        "enum": ["instagram", "linkedin", "twitter", "facebook", "tiktok"]
      },
      "description": "Redes sociales a incluir en el análisis"
    },
    "metrics_focus": {
      "type": "array",
      "title": "Métricas prioritarias",
      "items": {
        "type": "string",
        "enum": ["engagement", "reach", "growth", "conversions", "sentiment"]
      }
    },
    "comparison_period": {
      "type": "string",
      "title": "Período de comparación",
      "enum": ["week", "month", "quarter"],
      "default": "month"
    }
  }
}'::jsonb WHERE internal_code = 'INSIGHTS_GENERATOR';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": ["platforms"],
  "recurring_capable": true,
  "properties": {
    "platforms": {
      "type": "array",
      "title": "Plataformas de publicación",
      "items": {
        "type": "string",
        "enum": ["instagram", "linkedin", "twitter", "facebook"]
      },
      "description": "Dónde publicar el contenido"
    },
    "auto_publish": {
      "type": "boolean",
      "title": "Publicación automática",
      "default": false,
      "description": "Publicar automáticamente sin confirmación"
    },
    "optimize_timing": {
      "type": "boolean",
      "title": "Optimizar horario",
      "default": true,
      "description": "Publicar en el mejor momento según audiencia"
    },
    "cross_post": {
      "type": "boolean",
      "title": "Cross-posting",
      "default": false,
      "description": "Adaptar y publicar en múltiples plataformas"
    }
  }
}'::jsonb WHERE internal_code = 'CONTENT_PUBLISHER';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": ["image_type"],
  "properties": {
    "image_type": {
      "type": "string",
      "title": "Tipo de imagen",
      "enum": ["social_post", "story", "banner", "logo", "infographic"],
      "description": "Formato de la imagen"
    },
    "style": {
      "type": "string",
      "title": "Estilo visual",
      "enum": ["minimalist", "vibrant", "corporate", "artistic", "photorealistic"],
      "default": "minimalist"
    },
    "brand_colors": {
      "type": "boolean",
      "title": "Usar colores de marca",
      "default": true
    },
    "include_logo": {
      "type": "boolean",
      "title": "Incluir logo",
      "default": false
    }
  }
}'::jsonb WHERE internal_code = 'IMAGE_CREATOR';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": ["video_type"],
  "properties": {
    "video_type": {
      "type": "string",
      "title": "Tipo de video",
      "enum": ["reel", "story", "explainer", "testimonial", "tutorial"],
      "description": "Formato del video"
    },
    "duration": {
      "type": "string",
      "title": "Duración",
      "enum": ["15s", "30s", "60s", "90s"],
      "default": "30s"
    },
    "style": {
      "type": "string",
      "title": "Estilo",
      "enum": ["dynamic", "calm", "professional", "fun"],
      "default": "dynamic"
    },
    "include_captions": {
      "type": "boolean",
      "title": "Incluir subtítulos",
      "default": true
    }
  }
}'::jsonb WHERE internal_code = 'VIDEO_CREATOR';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": [],
  "properties": {
    "platforms": {
      "type": "array",
      "title": "Plataformas a analizar",
      "items": {
        "type": "string",
        "enum": ["instagram", "linkedin", "twitter", "facebook", "tiktok"]
      }
    },
    "analysis_type": {
      "type": "string",
      "title": "Tipo de análisis",
      "enum": ["demographics", "behavior", "interests", "engagement_patterns"],
      "default": "demographics"
    },
    "segment_by": {
      "type": "string",
      "title": "Segmentar por",
      "enum": ["age", "location", "interests", "engagement_level"],
      "default": "engagement_level"
    }
  }
}'::jsonb WHERE internal_code = 'AUDIENCE_ANALYST';

UPDATE public.platform_agents SET input_schema = '{
  "type": "object",
  "required": ["planning_period"],
  "recurring_capable": true,
  "properties": {
    "planning_period": {
      "type": "string",
      "title": "Período de planificación",
      "enum": ["week", "two_weeks", "month"],
      "default": "week",
      "description": "Horizonte del calendario"
    },
    "posts_per_week": {
      "type": "integer",
      "title": "Posts por semana",
      "minimum": 1,
      "maximum": 14,
      "default": 5
    },
    "platforms": {
      "type": "array",
      "title": "Plataformas",
      "items": {
        "type": "string",
        "enum": ["instagram", "linkedin", "twitter", "facebook"]
      }
    },
    "content_mix": {
      "type": "object",
      "title": "Mix de contenido",
      "properties": {
        "educational": { "type": "integer", "default": 30 },
        "promotional": { "type": "integer", "default": 20 },
        "entertainment": { "type": "integer", "default": 30 },
        "engagement": { "type": "integer", "default": 20 }
      }
    }
  }
}'::jsonb WHERE internal_code = 'CALENDAR_PLANNER';