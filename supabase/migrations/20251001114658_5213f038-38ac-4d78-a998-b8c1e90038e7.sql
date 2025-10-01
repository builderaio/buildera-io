-- Insert sample AI Workforce Agents based on SFIA skills
INSERT INTO public.ai_workforce_agents (
  internal_id,
  role_name,
  description,
  avatar_icon,
  primary_function,
  key_skills_summary,
  sfia_skills,
  average_sfia_level,
  execution_type,
  is_active,
  is_featured
) VALUES
(
  'AGENT_MKTG_STRATEGIST',
  '🧠 Estratega de Marketing',
  'Experto en planificación estratégica de marketing y análisis de mercado',
  'brain',
  'Define la estrategia, los objetivos y los KPIs de la campaña',
  ARRAY['Análisis de Mercado', 'Planificación Estratégica', 'Definición de Audiencias', 'ROI y Métricas'],
  '[
    {"skill_code": "STRG", "level": 5, "custom_description": "Define y comunica la estrategia organizacional y asegura la alineación con los objetivos del negocio."},
    {"skill_code": "MRKT", "level": 5, "custom_description": "Define la estrategia de marketing digital y supervisa la implementación de campañas complejas."},
    {"skill_code": "BPRE", "level": 4, "custom_description": "Analiza procesos empresariales y recomienda mejoras basadas en datos y mejores prácticas."}
  ]'::jsonb,
  4.7,
  'edge_function',
  true,
  true
),
(
  'AGENT_CREATIVE_DESIGNER',
  '🎨 Creativo de Contenido Visual',
  'Especialista en diseño gráfico y creación de contenido visual atractivo',
  'palette',
  'Diseña gráficos, infografías y contenido visual para redes sociales',
  ARRAY['Diseño Gráfico', 'Identidad Visual', 'Composición', 'Creatividad'],
  '[
    {"skill_code": "CONT", "level": 5, "custom_description": "Define estrategias de contenido y establece estándares y directrices para la creación de contenido."},
    {"skill_code": "MRKT", "level": 4, "custom_description": "Aplica técnicas de marketing digital para implementar campañas efectivas en diversos canales."}
  ]'::jsonb,
  4.5,
  'edge_function',
  true,
  true
),
(
  'AGENT_COPYWRITER',
  '✍️ Copywriter Persuasivo',
  'Experto en redacción persuasiva y storytelling para diferentes formatos',
  'pen',
  'Crea textos persuasivos, llamados a la acción y narrativas de marca',
  ARRAY['Copywriting', 'Storytelling', 'SEO Writing', 'Adaptación de Tono'],
  '[
    {"skill_code": "CONT", "level": 5, "custom_description": "Define estrategias de contenido y establece estándares y directrices para la creación de contenido."},
    {"skill_code": "MRKT", "level": 4, "custom_description": "Aplica técnicas de marketing digital para implementar campañas efectivas en diversos canales."}
  ]'::jsonb,
  4.5,
  'edge_function',
  true,
  true
),
(
  'AGENT_DATA_ANALYST',
  '📈 Analista de Datos y Audiencias',
  'Especialista en análisis de datos, métricas y comportamiento de audiencias',
  'chart',
  'Analiza métricas, identifica tendencias y genera insights accionables',
  ARRAY['Análisis de Datos', 'Métricas de Marketing', 'Segmentación', 'Visualización'],
  '[
    {"skill_code": "DTAN", "level": 5, "custom_description": "Define metodologías de análisis de datos y guía a otros en la aplicación de técnicas avanzadas."},
    {"skill_code": "BPRE", "level": 4, "custom_description": "Analiza procesos empresariales y recomienda mejoras basadas en datos y mejores prácticas."}
  ]'::jsonb,
  4.5,
  'edge_function',
  true,
  true
),
(
  'AGENT_SEO_SPECIALIST',
  '🔍 Especialista en SEO y Palabras Clave',
  'Experto en optimización para motores de búsqueda y estrategia de keywords',
  'search',
  'Optimiza contenido para SEO, investiga keywords y mejora rankings',
  ARRAY['SEO On-Page', 'Keyword Research', 'Link Building', 'SEO Técnico'],
  '[
    {"skill_code": "MRKT", "level": 4, "custom_description": "Aplica técnicas de marketing digital para implementar campañas efectivas en diversos canales."},
    {"skill_code": "DTAN", "level": 4, "custom_description": "Aplica técnicas de análisis de datos para establecer y verificar los requisitos del negocio y especificar soluciones eficaces."}
  ]'::jsonb,
  4.0,
  'edge_function',
  true,
  false
),
(
  'AGENT_COMMUNITY_MANAGER',
  '📣 Community Manager y Moderador',
  'Especialista en gestión de comunidades y engagement en redes sociales',
  'message',
  'Gestiona la comunidad, responde comentarios y fomenta el engagement',
  ARRAY['Community Management', 'Social Listening', 'Crisis Management', 'Engagement'],
  '[
    {"skill_code": "BURM", "level": 4, "custom_description": "Gestiona relaciones empresariales clave y facilita la comunicación entre stakeholders."},
    {"skill_code": "MRKT", "level": 4, "custom_description": "Aplica técnicas de marketing digital para implementar campañas efectivas en diversos canales."}
  ]'::jsonb,
  4.0,
  'edge_function',
  true,
  false
)
ON CONFLICT (internal_id) DO NOTHING;