-- Insert new SFIA skills for the new roles
INSERT INTO public.sfia_skills (code, name, description, level_1_description, level_2_description, level_3_description, level_4_description, level_5_description, level_6_description, level_7_description, category, is_active) VALUES
('BMAN', 'Gestión de Presupuestos y Finanzas', 'Planificación, monitoreo y control de presupuestos y finanzas organizacionales.', 
 'Asiste en la recopilación de información financiera básica.',
 'Recopila y organiza datos financieros para reportes presupuestarios.',
 'Prepara reportes de presupuesto y analiza variaciones menores.',
 'Gestiona presupuestos departamentales y analiza desviaciones significativas.',
 'Elabora presupuestos anuales, realiza proyecciones de flujo de caja y propone acciones correctivas estratégicas.',
 'Define políticas financieras organizacionales y supervisa la gestión financiera global.',
 'Establece la dirección estratégica financiera de la organización a nivel ejecutivo.',
 'Gestión Financiera', true),

('INAN', 'Innovación', 'Identificación y evaluación de oportunidades de innovación para mejorar productos, servicios y procesos.', 
 'Asiste en la recopilación de ideas de innovación.',
 'Documenta y organiza propuestas de innovación.',
 'Participa en la evaluación de iniciativas de innovación.',
 'Evalúa viabilidad financiera de nuevos proyectos, crea modelos de casos de negocio y análisis de ROI.',
 'Lidera programas de innovación estratégica y gestiona portafolios de innovación.',
 'Define la estrategia de innovación organizacional.',
 'Establece la visión de innovación a nivel corporativo.',
 'Estrategia e Innovación', true),

('FMIT', 'Gestión de la Infraestructura Financiera', 'Administración de sistemas y herramientas para la gestión financiera y contable.', 
 'Asiste en tareas básicas de registro contable.',
 'Realiza registros contables rutinarios bajo supervisión.',
 'Gestiona registros contables completos y realiza conciliaciones básicas.',
 'Administra herramientas contables, procesa facturación, gestiona pagos y realiza conciliaciones bancarias.',
 'Supervisa la infraestructura financiera completa y optimiza procesos contables.',
 'Define estándares y políticas para la infraestructura financiera.',
 'Establece la arquitectura financiera estratégica de la organización.',
 'Gestión Financiera', true),

('GOVN', 'Gobernanza Corporativa', 'Aseguramiento del cumplimiento de marcos regulatorios y estándares de gobernanza.', 
 'Asiste en la recopilación de información para cumplimiento.',
 'Documenta procesos relacionados con cumplimiento normativo.',
 'Prepara información para declaraciones de impuestos y asegura cumplimiento de registros contables con normativa local.',
 'Implementa controles de gobernanza y asegura cumplimiento regulatorio.',
 'Define marcos de gobernanza corporativa y políticas de cumplimiento.',
 'Establece la estrategia de gobernanza organizacional.',
 'Lidera la gobernanza corporativa a nivel ejecutivo.',
 'Gobernanza y Cumplimiento', true),

('COPL', 'Cumplimiento y Legislación de la Información', 'Gestión del cumplimiento de leyes y regulaciones relacionadas con información y contratos.', 
 'Asiste en la organización de documentación legal.',
 'Mantiene registros de contratos y documentación legal.',
 'Revisa contratos básicos y asegura cumplimiento de políticas.',
 'Revisa contratos para identificar cláusulas de riesgo, gestiona base de datos de contratos vigentes y asegura políticas de privacidad actualizadas.',
 'Define estrategias de cumplimiento legal y gestiona riesgos legales complejos.',
 'Establece marcos de cumplimiento organizacional.',
 'Lidera la estrategia legal y de cumplimiento a nivel corporativo.',
 'Gobernanza y Cumplimiento', true),

('SURE', 'Gestión de Proveedores', 'Gestión de relaciones con proveedores y aseguramiento de contratos efectivos.', 
 'Asiste en la documentación de información de proveedores.',
 'Mantiene registros actualizados de proveedores.',
 'Evalúa proveedores básicos y gestiona contratos estándar.',
 'Asegura que contratos con proveedores contengan términos y condiciones adecuados para proteger intereses de la empresa.',
 'Define estrategias de gestión de proveedores y negocia contratos complejos.',
 'Establece políticas de gestión de proveedores organizacional.',
 'Lidera la estrategia de proveedores a nivel corporativo.',
 'Gestión de Relaciones', true),

('RECR', 'Reclutamiento', 'Atracción, selección y contratación de talento para la organización.', 
 'Asiste en la publicación de vacantes y filtrado básico.',
 'Coordina entrevistas y mantiene registros de candidatos.',
 'Gestiona procesos de reclutamiento completos para posiciones estándar.',
 'Redacta descripciones de cargo atractivas, publica ofertas, filtra hojas de vida y coordina agenda de entrevistas con gerentes.',
 'Define estrategias de atracción de talento y gestiona reclutamiento para posiciones ejecutivas.',
 'Establece políticas de talento organizacional.',
 'Lidera la estrategia de capital humano a nivel corporativo.',
 'Gestión de Talento', true),

('PROF', 'Desarrollo Profesional', 'Facilitación del crecimiento y desarrollo de carrera de los empleados.', 
 'Asiste en la coordinación de actividades de capacitación.',
 'Coordina programas de capacitación y mantiene registros.',
 'Diseña procesos de incorporación (onboarding) para asegurar que nuevos empleados se integren efectivamente.',
 'Desarrolla programas de capacitación completos y gestiona planes de desarrollo individual.',
 'Define estrategias de desarrollo organizacional y programas de liderazgo.',
 'Establece la visión de desarrollo de talento organizacional.',
 'Lidera la transformación del talento a nivel corporativo.',
 'Gestión de Talento', true),

('PEMT', 'Gestión del Desempeño', 'Administración de sistemas y procesos de evaluación del desempeño.', 
 'Asiste en la recopilación de información de desempeño.',
 'Mantiene registros de evaluaciones de desempeño.',
 'Coordina procesos de evaluación de desempeño departamental.',
 'Administra software de evaluación, recopila feedback 360° y ayuda a líderes a establecer objetivos claros.',
 'Define estrategias de gestión del desempeño organizacional.',
 'Establece marcos de desempeño a nivel organizacional.',
 'Lidera la cultura de alto desempeño a nivel corporativo.',
 'Gestión de Talento', true),

('LEDA', 'Desarrollo del Liderazgo', 'Identificación, desarrollo y gestión de talento de liderazgo.', 
 'Asiste en la organización de actividades de desarrollo de líderes.',
 'Coordina programas de desarrollo de liderazgo.',
 'Implementa programas de desarrollo de líderes emergentes.',
 'Identifica necesidades de capacitación, coordina programas de formación y gestiona planes de sucesión para roles clave.',
 'Define estrategia de desarrollo de liderazgo organizacional.',
 'Establece la cultura de liderazgo organizacional.',
 'Lidera la transformación del liderazgo a nivel corporativo.',
 'Gestión de Talento', true),

('ADMN', 'Administración', 'Gestión de operaciones administrativas y soporte organizacional.', 
 'Realiza tareas administrativas básicas bajo supervisión.',
 'Gestiona tareas administrativas rutinarias de manera independiente.',
 'Gestiona agenda de gerencia, coordina logística de viajes y reuniones, administra inventario de suministros y es punto de contacto para consultas administrativas.',
 'Coordina operaciones administrativas complejas y supervisa procesos.',
 'Define políticas y procedimientos administrativos organizacionales.',
 'Establece estrategia de operaciones administrativas.',
 'Lidera la transformación administrativa a nivel corporativo.',
 'Operaciones', true),

('ASUP', 'Soporte de Aplicaciones', 'Provisión de soporte y mantenimiento de aplicaciones de software.', 
 'Proporciona soporte básico de primer nivel.',
 'Resuelve incidentes de aplicaciones estándar.',
 'Administra acceso del personal a herramientas de software internas (ej. Slack, Google Workspace) y ofrece soporte básico.',
 'Gestiona soporte completo de aplicaciones y resuelve problemas complejos.',
 'Define estrategias de soporte de aplicaciones organizacional.',
 'Establece arquitectura de soporte de aplicaciones.',
 'Lidera la estrategia de aplicaciones empresariales.',
 'Soporte Técnico', true)
ON CONFLICT (code) DO NOTHING;

-- Insert new AI Workforce agents for Finance, Legal, HR, and Administrative areas
INSERT INTO public.ai_workforce_agents (
  internal_id, 
  role_name, 
  description, 
  primary_function,
  sfia_skills,
  key_skills_summary,
  average_sfia_level,
  avatar_icon,
  execution_type,
  input_parameters,
  is_active,
  is_featured
) VALUES
-- 1. Analista de Planificación y Análisis Financiero (FP&A Analyst)
(
  'AGENT_FPA_ANALYST',
  '📊 Analista de Planificación Financiera',
  'Estratega financiero que utiliza datos históricos y proyecciones para guiar decisiones de crecimiento, inversión y presupuestación.',
  'Optimización de recursos y maximización de rentabilidad mediante planificación financiera estratégica',
  '[
    {"skill_code": "BMAN", "skill_name": "Gestión de Presupuestos y Finanzas", "level": 5, "level_description": "Elabora presupuestos anuales, realiza proyecciones de flujo de caja y propone acciones correctivas estratégicas"},
    {"skill_code": "INAN", "skill_name": "Innovación", "level": 4, "level_description": "Evalúa viabilidad financiera de nuevos proyectos, crea modelos de casos de negocio y análisis de ROI"}
  ]'::jsonb,
  ARRAY['Planificación Presupuestaria', 'Análisis Financiero', 'Proyecciones de Flujo de Caja', 'Evaluación de ROI'],
  4.5,
  '📊',
  'n8n_workflow',
  '{"budget_data": "historical_financial_data", "projection_period": "timeframe", "business_case": "project_details"}'::jsonb,
  true,
  true
),

-- 2. Especialista en Contabilidad y Tesorería
(
  'AGENT_ACCOUNTING_TREASURY',
  '💰 Especialista en Contabilidad y Tesorería',
  'Guardián de la integridad financiera diaria. Gestiona registros contables, facturación, pagos y cumplimiento fiscal.',
  'Gestión precisa de registros contables, facturación y obligaciones fiscales',
  '[
    {"skill_code": "FMIT", "skill_name": "Gestión de la Infraestructura Financiera", "level": 4, "level_description": "Administra herramientas contables, procesa facturación, gestiona pagos y realiza conciliaciones bancarias"},
    {"skill_code": "GOVN", "skill_name": "Gobernanza Corporativa", "level": 3, "level_description": "Prepara información para declaraciones de impuestos y asegura cumplimiento de registros contables"}
  ]'::jsonb,
  ARRAY['Contabilidad General', 'Gestión de Tesorería', 'Facturación', 'Cumplimiento Fiscal'],
  3.5,
  '💰',
  'n8n_workflow',
  '{"invoice_data": "billing_information", "payment_data": "accounts_payable", "bank_data": "bank_statements"}'::jsonb,
  true,
  false
),

-- 3. Analista de Contratos y Cumplimiento Normativo
(
  'AGENT_CONTRACTS_COMPLIANCE',
  '⚖️ Analista de Contratos y Cumplimiento',
  'Mitiga riesgo legal de la empresa. Revisa, redacta y gestiona contratos, y monitorea cumplimiento de regulaciones.',
  'Gestión del ciclo de vida de contratos y aseguramiento del cumplimiento normativo',
  '[
    {"skill_code": "COPL", "skill_name": "Cumplimiento y Legislación de la Información", "level": 4, "level_description": "Revisa contratos para identificar cláusulas de riesgo, gestiona base de datos de contratos y asegura políticas de privacidad actualizadas"},
    {"skill_code": "SURE", "skill_name": "Gestión de Proveedores", "level": 4, "level_description": "Asegura que contratos con proveedores contengan términos y condiciones adecuados para proteger intereses de la empresa"}
  ]'::jsonb,
  ARRAY['Revisión de Contratos', 'Cumplimiento Normativo', 'Gestión de Proveedores', 'Protección de Datos'],
  4.0,
  '⚖️',
  'n8n_workflow',
  '{"contract_draft": "contract_document", "compliance_requirements": "regulatory_framework", "vendor_data": "supplier_information"}'::jsonb,
  true,
  false
),

-- 4. Especialista en Adquisición de Talento
(
  'AGENT_TALENT_ACQUISITION',
  '🎯 Especialista en Adquisición de Talento',
  'Atrae y contrata el mejor talento. Gestiona todo el proceso de reclutamiento desde la definición del perfil hasta la oferta.',
  'Atracción, selección y contratación de talento de alta calidad',
  '[
    {"skill_code": "RECR", "skill_name": "Reclutamiento", "level": 4, "level_description": "Redacta descripciones de cargo atractivas, publica ofertas, filtra hojas de vida y coordina entrevistas con gerentes"},
    {"skill_code": "PROF", "skill_name": "Desarrollo Profesional", "level": 3, "level_description": "Diseña proceso de incorporación (onboarding) para asegurar integración efectiva de nuevos empleados"}
  ]'::jsonb,
  ARRAY['Reclutamiento', 'Selección de Personal', 'Onboarding', 'Employer Branding'],
  3.5,
  '🎯',
  'n8n_workflow',
  '{"job_description": "position_requirements", "candidate_pool": "applicant_data", "interview_feedback": "evaluation_criteria"}'::jsonb,
  true,
  true
),

-- 5. Generalista de Desarrollo y Cultura Organizacional (HR Business Partner)
(
  'AGENT_HR_BUSINESS_PARTNER',
  '🌱 HR Business Partner',
  'Fomenta ambiente de trabajo productivo y positivo. Gestiona ciclo de vida del empleado post-contratación.',
  'Gestión de desempeño, desarrollo de carrera y cultura organizacional',
  '[
    {"skill_code": "PEMT", "skill_name": "Gestión del Desempeño", "level": 4, "level_description": "Administra software de evaluación, recopila feedback 360° y ayuda a líderes a establecer objetivos claros"},
    {"skill_code": "LEDA", "skill_name": "Desarrollo del Liderazgo", "level": 4, "level_description": "Identifica necesidades de capacitación, coordina programas de formación y gestiona planes de sucesión para roles clave"}
  ]'::jsonb,
  ARRAY['Gestión del Desempeño', 'Desarrollo de Talento', 'Clima Laboral', 'Planes de Sucesión'],
  4.0,
  '🌱',
  'n8n_workflow',
  '{"performance_data": "employee_metrics", "training_needs": "skill_gaps", "succession_plan": "critical_roles"}'::jsonb,
  true,
  false
),

-- 6. Coordinador de Operaciones Administrativas
(
  'AGENT_ADMIN_OPERATIONS',
  '🗂️ Coordinador de Operaciones Administrativas',
  'Asegura funcionamiento fluido de la oficina y procesos administrativos. Punto central de soporte para el equipo.',
  'Gestión de recursos, coordinación logística y organización de documentación',
  '[
    {"skill_code": "ADMN", "skill_name": "Administración", "level": 3, "level_description": "Gestiona agenda de gerencia, coordina logística de viajes y reuniones, administra inventario de suministros y es punto de contacto para consultas administrativas"},
    {"skill_code": "ASUP", "skill_name": "Soporte de Aplicaciones", "level": 3, "level_description": "Administra acceso del personal a herramientas de software internas y ofrece soporte básico"}
  ]'::jsonb,
  ARRAY['Gestión Administrativa', 'Coordinación Logística', 'Soporte de Herramientas', 'Gestión de Recursos'],
  3.0,
  '🗂️',
  'n8n_workflow',
  '{"calendar_data": "schedule_information", "travel_requests": "logistics_data", "inventory_data": "supplies_tracking", "access_requests": "software_permissions"}'::jsonb,
  true,
  false
);