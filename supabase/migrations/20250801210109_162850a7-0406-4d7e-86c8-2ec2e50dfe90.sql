-- Crear plantillas de prompts faltantes para ERA Content Optimizer

-- Plantilla para objetivo estratégico
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'objetivo estratégico',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza este OBJETIVO ESTRATÉGICO:
- Debe ser específico, medible, alcanzable, relevante y temporal (SMART)
- Alineado con la misión y visión de la empresa
- Incluye métricas claras de éxito
- Orientado a resultados de impacto empresarial
- Lenguaje estratégico y profesional
- Máximo 120 palabras',
    120,
    'strategic',
    true
);

-- Plantilla para propuesta de valor
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'propuesta de valor',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza esta PROPUESTA DE VALOR:
- Comunicar claramente el beneficio único
- Diferenciación competitiva evidente
- Enfocada en el valor para el cliente
- Lenguaje persuasivo y directo
- Resalta el "por qué elegir esta empresa"
- Máximo 180 palabras',
    180,
    'persuasive',
    true
);

-- Plantilla para ventaja competitiva
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'ventaja competitiva',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza esta VENTAJA COMPETITIVA:
- Debe ser clara y diferenciadora
- Basada en fortalezas reales y verificables
- Difícil de replicar por competidores
- Generadora de valor superior
- Lenguaje confiable y factual
- Máximo 150 palabras',
    150,
    'confident',
    true
);

-- Plantilla para público objetivo
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'público objetivo',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza esta definición de PÚBLICO OBJETIVO:
- Demografía específica y detallada
- Necesidades y pain points claramente identificados
- Comportamientos de compra relevantes
- Canales de comunicación preferidos
- Evita generalidades, sé específico
- Máximo 200 palabras',
    200,
    'analytical',
    true
);

-- Plantilla para estrategia de marketing
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'estrategia de marketing',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza esta ESTRATEGIA DE MARKETING:
- Alineada con objetivos empresariales
- Canales y tácticas específicas
- Métricas de éxito definidas
- Cronograma realista
- Presupuesto considerado
- Enfoque en ROI
- Máximo 250 palabras',
    250,
    'strategic',
    true
);

-- Plantilla para modelo de negocio
INSERT INTO era_prompt_templates (
    field_type,
    system_prompt,
    specific_instructions,
    max_words,
    tone,
    is_active
) VALUES (
    'modelo de negocio',
    'Eres Era, la IA especializada de Buildera. Tu trabajo es optimizar contenido empresarial para que sea más profesional, claro y persuasivo.',
    'Optimiza este MODELO DE NEGOCIO:
- Fuentes de ingresos claras
- Estructura de costos definida
- Propuesta de valor central
- Segmentos de clientes específicos
- Canales de distribución
- Sostenibilidad y escalabilidad
- Máximo 300 palabras',
    300,
    'business',
    true
);