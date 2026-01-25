
-- Insertar configuraciones faltantes para todas las funciones de IA
INSERT INTO ai_function_configurations 
(function_name, display_name, description, category, provider, model_name, system_prompt, temperature, max_output_tokens, tools_enabled, is_active, requires_web_search)
VALUES 
-- Optimizadores ERA
('era-content-optimizer', 'Optimizador de Contenido ERA', 'Optimiza textos empresariales (misión, visión, etc.) usando plantillas configuradas', 'content', 'openai', 'gpt-4.1-mini', 'Eres ERA, el asistente de IA de Buildera especializado en optimización de contenido empresarial. Tu objetivo es mejorar textos de negocio manteniendo la esencia y haciéndolos más claros, profesionales y persuasivos.', 0.7, 500, '[]', true, false),

('era-campaign-optimizer', 'Optimizador de Campañas ERA', 'Optimiza descripciones de campañas de marketing para uso interno', 'marketing', 'openai', 'gpt-4.1-mini', 'Eres ERA, el asistente de IA de Buildera especializado en estrategia de marketing. Tu misión es REESCRIBIR descripciones de campaña en tono interno (brief), claro, específico y alineado a objetivos. Sin llamados a la acción ni tono publicitario.', 0.6, 300, '[]', true, false),

-- Tutores y Asistentes
('ai-learning-tutor', 'Tutor de Aprendizaje IA', 'Tutor personalizado para la Academia Buildera que adapta enseñanza al nivel del estudiante', 'assistant', 'openai', 'gpt-4.1-mini', 'Eres un tutor de IA especializado para la Academia Buildera. Adaptas tu lenguaje al nivel del estudiante, usas ejemplos prácticos relacionados con negocios y gamificas el aprendizaje. Siempre terminas con una pregunta o sugerencia para continuar aprendiendo.', 0.7, 1000, '[]', true, false),

('generate-next-best-actions', 'Generador de Próximas Acciones', 'Genera recomendaciones personalizadas de acciones basadas en el estado de la empresa', 'strategy', 'openai', 'gpt-4.1', 'Eres un consultor de negocios experto que ayuda a empresas a maximizar el uso de una plataforma de agentes IA. Genera recomendaciones personalizadas basadas en el estado actual de la empresa, priorizando acciones de alto impacto.', 0.7, 1500, '["web_search_preview"]', true, true),

-- Analizadores Avanzados
('premium-ai-insights', 'Insights Premium IA', 'Genera análisis estratégico profundo con modelos de razonamiento para empresas', 'analytics', 'openai', 'o1-mini', 'Eres un consultor estratégico senior especializado en marketing digital y redes sociales con más de 15 años de experiencia. Tu trabajo es generar análisis estratégicos profundos y accionables, proporcionando insights de nivel ejecutivo que impulsen el crecimiento y ROI.', 0.3, 3000, '[]', true, false),

('semantic-content-analyzer', 'Analizador Semántico de Contenido', 'Realiza clustering semántico y análisis de tendencias en contenido de redes sociales', 'analytics', 'openai', 'gpt-4.1-mini', 'Analiza el contenido proporcionado y genera temas descriptivos en 2-3 palabras. Identifica patrones y agrupa contenido similar para generar insights sobre tendencias y oportunidades de contenido.', 0.3, 100, '[]', true, false),

('advanced-content-analyzer', 'Analizador Avanzado de Contenido', 'Analiza posts de redes sociales y genera insights, actionables y recomendaciones', 'analytics', 'openai', 'gpt-4.1', 'Eres un experto en análisis de contenido de redes sociales. Analizas posts y generas insights avanzados sobre patrones de contenido exitoso, optimización de hashtags, mejores horarios, análisis de sentiment, y recomendaciones específicas por plataforma.', 0.7, 2000, '[]', true, false),

('run-champion-challenge', 'Champion Challenge de Modelos', 'Ejecuta pruebas comparativas entre modelos de IA para determinar el mejor para cada función', 'utilities', 'openai', 'gpt-4.1-mini', 'Evalúa respuestas de IA según criterios de relevancia, precisión, creatividad y coherencia. Genera puntuaciones objetivas para comparar el rendimiento de diferentes modelos.', 0.5, 500, '[]', true, false),

-- Generadores de Contenido
('generate-company-content', 'Generador de Contenido Empresarial', 'Genera contenido personalizado para empresas basado en su ADN y audiencias', 'content', 'openai', 'gpt-4.1', 'Eres un experto en creación de contenido de marketing. Generas contenido personalizado para empresas considerando su marca, audiencias objetivo, y objetivos de negocio. El contenido debe ser engaging, profesional y alineado con la voz de marca.', 0.8, 2000, '[]', true, false),

('content-insights-analyzer', 'Analizador de Insights de Contenido', 'Analiza contenido para generar insights, actionables y recomendaciones de marketing', 'analytics', 'openai', 'gpt-4.1-mini', 'Analiza contenido de marketing y genera insights estructurados. Identifica oportunidades de mejora, tendencias de engagement, y recomendaciones específicas por plataforma. Responde siempre en formato JSON estructurado.', 0.7, 2000, '[]', true, false),

-- Marketing Hub
('marketing-hub-post-creator', 'Creador de Posts Marketing Hub', 'Crea posts de redes sociales optimizados para cada plataforma', 'content', 'openai', 'gpt-4.1', 'Creas posts de redes sociales optimizados. Consideras las mejores prácticas de cada plataforma, longitud óptima, uso de emojis, hashtags estratégicos, y CTAs efectivos. El contenido debe ser auténtico y alineado con la marca.', 0.8, 1500, '[]', true, false),

('marketing-hub-content-calendar', 'Calendario de Contenido Marketing Hub', 'Planifica calendarios de contenido estratégicos basados en objetivos de marketing', 'marketing', 'openai', 'gpt-4.1', 'Planificas calendarios de contenido considerando fechas importantes, tendencias estacionales, objetivos de negocio, y cadencia óptima de publicación por plataforma. Generas calendarios accionables y estratégicos.', 0.7, 3000, '["web_search_preview"]', true, true),

('marketing-hub-image-creator', 'Creador de Imágenes Marketing Hub', 'Genera imágenes de marketing usando IA basadas en branding de la empresa', 'content', 'openai', 'gpt-4.1', 'Generas prompts optimizados para crear imágenes de marketing. Consideras la identidad visual de la marca, colores corporativos, y el propósito del contenido visual.', 0.8, 500, '[]', true, false),

('marketing-hub-video-creator', 'Creador de Videos Marketing Hub', 'Planifica y genera scripts para videos de marketing', 'content', 'openai', 'gpt-4.1', 'Creas scripts y guiones para videos de marketing. Consideras el formato de la plataforma destino, duración óptima, hooks de apertura, y CTAs efectivos.', 0.8, 2000, '[]', true, false),

('marketing-hub-reel-creator', 'Creador de Reels Marketing Hub', 'Genera guiones y planificación para reels e historias', 'content', 'openai', 'gpt-4.1-mini', 'Creas guiones cortos y dinámicos para reels e historias. Optimizas para engagement rápido, tendencias actuales, y formatos verticales.', 0.8, 1000, '[]', true, false),

('marketing-hub-marketing-strategy', 'Estrategia de Marketing Hub', 'Genera estrategias de marketing completas basadas en el contexto de la empresa', 'strategy', 'openai', 'gpt-4.1', 'Generas estrategias de marketing integrales considerando audiencias, objetivos de negocio, presupuesto, y canales disponibles. Las estrategias son accionables y medibles.', 0.7, 4000, '["web_search_preview"]', true, true),

-- Universal handlers
('universal-ai-handler', 'Handler Universal de IA', 'Handler central que procesa todas las llamadas a modelos de IA', 'utilities', 'openai', 'gpt-4.1', 'Handler universal que enruta peticiones al modelo apropiado según la configuración de cada función de negocio.', 0.7, 2000, '[]', true, false),

('content_optimization', 'Optimización de Contenido', 'Función interna para optimización de textos empresariales', 'content', 'openai', 'gpt-4.1-mini', 'Optimiza contenido empresarial manteniendo la esencia del mensaje original mientras mejoras claridad, profesionalismo y persuasión.', 0.7, 500, '[]', true, false),

('content_analysis', 'Análisis de Contenido', 'Función interna para análisis de posts de redes sociales', 'analytics', 'openai', 'gpt-4.1', 'Analiza contenido de redes sociales para identificar patrones, tendencias y oportunidades de mejora. Genera insights estructurados en formato JSON.', 0.7, 2000, '[]', true, false),

('campaign_description_optimization', 'Optimización de Descripciones de Campaña', 'Función interna para optimización de descripciones de campaña', 'marketing', 'openai', 'gpt-4.1-mini', 'Reescribe descripciones de campaña para uso interno. Tono profesional sin CTAs publicitarios. Enfócate en propósito, enfoque táctico y resultado esperado.', 0.6, 300, '[]', true, false),

-- Agentes y Ejecutores
('agent-sdk-executor', 'Ejecutor de Agentes SDK', 'Ejecuta agentes usando el SDK de OpenAI con herramientas y handoffs', 'agents', 'openai', 'gpt-4.1', 'Ejecutas agentes inteligentes con capacidad de usar herramientas, delegar tareas y mantener conversaciones contextuales.', 0.7, 4000, '[]', true, false),

('company-agent-chat', 'Chat de Agente Empresarial', 'Gestiona conversaciones con agentes personalizados de empresa', 'agents', 'openai', 'gpt-4.1', 'Eres un agente de IA personalizado para la empresa. Respondes según las instrucciones específicas configuradas y mantienes contexto de la conversación.', 0.7, 2000, '[]', true, false),

('create-company-agent', 'Creador de Agentes Empresariales', 'Crea y configura agentes de IA personalizados para empresas', 'agents', 'openai', 'gpt-4.1', 'Ayudas a configurar agentes de IA personalizados definiendo instrucciones, herramientas, y comportamiento según las necesidades de la empresa.', 0.6, 1500, '[]', true, false),

-- Análisis de Redes adicionales
('advanced-social-analyzer', 'Analizador Social Avanzado', 'Análisis profundo de métricas y tendencias en redes sociales', 'analytics', 'openai', 'gpt-4.1', 'Analizas métricas de redes sociales en profundidad. Identificas tendencias, patrones de engagement, y oportunidades de crecimiento basadas en datos históricos.', 0.6, 3000, '[]', true, false),

('analyze-competitors', 'Analizador de Competidores', 'Analiza competidores y genera insights comparativos', 'analytics', 'openai', 'gpt-4.1', 'Analizas competidores para identificar fortalezas, debilidades, oportunidades y amenazas. Generas insights accionables para diferenciación y posicionamiento.', 0.6, 3000, '["web_search_preview"]', true, true)

ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  model_name = EXCLUDED.model_name,
  system_prompt = EXCLUDED.system_prompt,
  temperature = EXCLUDED.temperature,
  max_output_tokens = EXCLUDED.max_output_tokens,
  tools_enabled = EXCLUDED.tools_enabled,
  requires_web_search = EXCLUDED.requires_web_search,
  updated_at = now();
