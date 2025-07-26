-- Crear 3 plantillas de agentes base para diferentes áreas de negocio

-- 1. Agente de Talento Humano - Reclutamiento
INSERT INTO public.agent_templates (
  id,
  name,
  description,
  instructions_template,
  category,
  pricing_model,
  pricing_amount,
  icon,
  tools_config,
  permissions_template,
  is_active,
  is_featured,
  version
) VALUES (
  gen_random_uuid(),
  'Asistente de Reclutamiento IA',
  'Agente especializado en procesos de reclutamiento y selección de talento. Automatiza la evaluación inicial de candidatos, programación de entrevistas y seguimiento del proceso de selección.',
  'Eres un asistente especializado en reclutamiento y selección de talento humano para {{company_name}}. 

Tu misión es optimizar el proceso de contratación mediante:
- Evaluación inicial de perfiles de candidatos
- Programación y coordinación de entrevistas
- Seguimiento del proceso de selección
- Generación de reportes de candidatos
- Comunicación con candidatos durante el proceso

Contexto de la empresa: {{company_context}}
Valores corporativos: {{company_values}}
Posiciones típicas a cubrir: {{typical_positions}}

Siempre mantén un tono profesional pero cálido, y asegúrate de representar adecuadamente la cultura organizacional de {{company_name}}.',
  'recursos_humanos',
  'premium',
  99.99,
  'Users',
  '[
    {
      "name": "calendar_integration",
      "description": "Integración con calendarios para programar entrevistas",
      "enabled": true,
      "config": {
        "providers": ["google", "outlook"],
        "default_duration": 60
      }
    },
    {
      "name": "email_automation",
      "description": "Envío automático de emails a candidatos",
      "enabled": true,
      "config": {
        "templates": ["interview_invitation", "rejection", "next_steps"],
        "auto_send": true
      }
    },
    {
      "name": "cv_analyzer",
      "description": "Análisis automático de CVs y perfiles",
      "enabled": true,
      "config": {
        "criteria": ["experience", "skills", "education"],
        "scoring": true
      }
    },
    {
      "name": "candidate_database",
      "description": "Base de datos de candidatos",
      "enabled": true,
      "config": {
        "storage": "secure",
        "retention_days": 365
      }
    }
  ]'::jsonb,
  '{
    "interaction_interfaces": {
      "chat": {
        "enabled": true,
        "description": "Chat en tiempo real con candidatos y reclutadores",
        "triggers": ["candidate_query", "interview_scheduling", "status_update"]
      },
      "forms": {
        "enabled": true,
        "description": "Formularios de aplicación y evaluación de candidatos",
        "triggers": ["job_application", "initial_screening", "feedback_collection"]
      },
      "email": {
        "enabled": true,
        "description": "Comunicación automatizada por email",
        "triggers": ["application_received", "interview_reminder", "process_updates"]
      },
      "web": {
        "enabled": true,
        "description": "Portal web para candidatos y reclutadores",
        "triggers": ["profile_creation", "job_browsing", "application_tracking"]
      },
      "dashboard": {
        "enabled": true,
        "description": "Dashboard de métricas de reclutamiento",
        "triggers": ["report_generation", "pipeline_analysis", "performance_tracking"]
      }
    },
    "data_access": {
      "candidate_profiles": "read_write",
      "job_positions": "read_write",
      "interview_schedules": "read_write",
      "company_culture": "read_only"
    },
    "automation_level": "high",
    "compliance": ["GDPR", "data_retention_policies"]
  }'::jsonb,
  true,
  true,
  '1.0.0'
),

-- 2. Agente de Servicio al Cliente - Atención de PQR
(
  gen_random_uuid(),
  'Agente de Atención al Cliente PQR',
  'Agente especializado en la gestión y resolución de Peticiones, Quejas y Reclamos. Proporciona atención 24/7, clasifica automáticamente los casos y escala según la complejidad.',
  'Eres un agente de servicio al cliente especializado en la atención de PQR (Peticiones, Quejas y Reclamos) para {{company_name}}.

Tu misión es brindar un servicio excepcional mediante:
- Atención inmediata y clasificación automática de PQR
- Resolución de consultas frecuentes de manera autónoma
- Escalamiento inteligente de casos complejos
- Seguimiento del estado de todas las solicitudes
- Generación de reportes de satisfacción y métricas de servicio

Información de la empresa: {{company_info}}
Productos/Servicios: {{products_services}}
Políticas de servicio: {{service_policies}}
Canales de contacto: {{contact_channels}}

Mantén siempre un tono empático, profesional y orientado a la solución. Tu objetivo es resolver el 80% de las consultas sin intervención humana y asegurar la satisfacción del cliente.',
  'servicio_cliente',
  'premium',
  89.99,
  'MessageCircle',
  '[
    {
      "name": "ticketing_system",
      "description": "Sistema de gestión de tickets PQR",
      "enabled": true,
      "config": {
        "auto_classification": true,
        "priority_levels": ["low", "medium", "high", "critical"],
        "sla_tracking": true
      }
    },
    {
      "name": "knowledge_base",
      "description": "Base de conocimiento para resolución automática",
      "enabled": true,
      "config": {
        "auto_update": true,
        "categories": ["technical", "billing", "general"],
        "search_enabled": true
      }
    },
    {
      "name": "sentiment_analysis",
      "description": "Análisis de sentimiento en comunicaciones",
      "enabled": true,
      "config": {
        "real_time": true,
        "escalation_triggers": ["negative", "frustrated"],
        "satisfaction_tracking": true
      }
    },
    {
      "name": "multi_channel",
      "description": "Soporte multicanal integrado",
      "enabled": true,
      "config": {
        "channels": ["chat", "email", "phone", "social_media"],
        "unified_view": true
      }
    }
  ]'::jsonb,
  '{
    "interaction_interfaces": {
      "chat": {
        "enabled": true,
        "description": "Chat en tiempo real para consultas inmediatas",
        "triggers": ["customer_inquiry", "complaint_submission", "follow_up"]
      },
      "forms": {
        "enabled": true,
        "description": "Formularios estructurados para PQR",
        "triggers": ["formal_complaint", "service_request", "feedback_submission"]
      },
      "email": {
        "enabled": true,
        "description": "Gestión automática de emails de soporte",
        "triggers": ["case_creation", "status_updates", "resolution_notification"]
      },
      "web": {
        "enabled": true,
        "description": "Portal de autoservicio para clientes",
        "triggers": ["faq_access", "case_tracking", "documentation_search"]
      },
      "api": {
        "enabled": true,
        "description": "API para integración con sistemas externos",
        "triggers": ["case_sync", "status_webhook", "automated_reporting"]
      }
    },
    "data_access": {
      "customer_profiles": "read_write",
      "case_history": "read_write",
      "product_info": "read_only",
      "service_policies": "read_only"
    },
    "automation_level": "high",
    "escalation_rules": ["human_required", "complex_case", "negative_sentiment"]
  }'::jsonb,
  true,
  true,
  '1.0.0'
),

-- 3. Agente de Contabilidad - Registro y Clasificación de Transacciones
(
  gen_random_uuid(),
  'Asistente Contable Inteligente',
  'Agente especializado en el registro, clasificación y análisis de transacciones contables. Automatiza la contabilización, genera reportes financieros y asegura el cumplimiento normativo.',
  'Eres un asistente contable especializado en el registro y clasificación de transacciones financieras para {{company_name}}.

Tu misión es mantener la contabilidad actualizada y precisa mediante:
- Registro automático y clasificación de transacciones
- Conciliación bancaria automatizada
- Generación de reportes financieros en tiempo real
- Cumplimiento de normativas fiscales y contables
- Análisis de flujo de caja y proyecciones financieras

Información fiscal de la empresa: {{tax_info}}
Plan contable: {{chart_of_accounts}}
Políticas contables: {{accounting_policies}}
Normativas aplicables: {{regulations}}

Siempre mantén la precisión y el cumplimiento normativo como prioridades. Todos los registros deben ser auditables y seguir las mejores prácticas contables.',
  'contabilidad',
  'enterprise',
  149.99,
  'Calculator',
  '[
    {
      "name": "transaction_processor",
      "description": "Procesamiento automático de transacciones",
      "enabled": true,
      "config": {
        "auto_categorization": true,
        "duplicate_detection": true,
        "validation_rules": true
      }
    },
    {
      "name": "bank_reconciliation",
      "description": "Conciliación bancaria automatizada",
      "enabled": true,
      "config": {
        "bank_connections": ["open_banking", "file_import"],
        "matching_algorithms": ["exact", "fuzzy", "pattern"],
        "auto_reconcile": true
      }
    },
    {
      "name": "financial_reporting",
      "description": "Generación automática de reportes financieros",
      "enabled": true,
      "config": {
        "report_types": ["balance_sheet", "income_statement", "cash_flow"],
        "scheduling": true,
        "custom_formats": true
      }
    },
    {
      "name": "tax_compliance",
      "description": "Cumplimiento fiscal automatizado",
      "enabled": true,
      "config": {
        "tax_calculations": true,
        "deadline_reminders": true,
        "regulatory_updates": true
      }
    }
  ]'::jsonb,
  '{
    "interaction_interfaces": {
      "forms": {
        "enabled": true,
        "description": "Formularios para ingreso de transacciones y datos contables",
        "triggers": ["manual_entry", "expense_submission", "invoice_processing"]
      },
      "email": {
        "enabled": true,
        "description": "Procesamiento de facturas y documentos por email",
        "triggers": ["invoice_received", "bank_statement", "expense_report"]
      },
      "web": {
        "enabled": true,
        "description": "Portal contable para consultas y reportes",
        "triggers": ["report_generation", "account_inquiry", "data_export"]
      },
      "api": {
        "enabled": true,
        "description": "Integración con sistemas ERP y bancarios",
        "triggers": ["data_sync", "automated_entries", "real_time_updates"]
      },
      "dashboard": {
        "enabled": true,
        "description": "Dashboard financiero en tiempo real",
        "triggers": ["kpi_monitoring", "alert_generation", "trend_analysis"]
      }
    },
    "data_access": {
      "financial_records": "read_write",
      "bank_accounts": "read_write",
      "tax_information": "read_write",
      "audit_trails": "read_only"
    },
    "automation_level": "very_high",
    "compliance": ["GAAP", "IFRS", "tax_regulations", "audit_requirements"],
    "security_level": "maximum"
  }'::jsonb,
  true,
  true,
  '1.0.0'
);