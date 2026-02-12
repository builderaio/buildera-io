
# Marketing Hub: Journey y Experiencia AI-Based para Automatizacion Autonoma

## Diagnostico del Estado Actual

Tras auditar exhaustivamente el codebase, identifico que Buildera tiene **todas las piezas individuales** pero le falta el **cerebro orquestador** que las conecte en un flujo autonomo de toma de decisiones en tiempo real.

### Lo que EXISTE (piezas sueltas)
- 27 agentes individuales ejecutables bajo demanda
- Publicacion multi-plataforma via upload-post-manager
- Generacion de contenido con IA (posts, campanas, videos, reels)
- Analytics por plataforma (Instagram, LinkedIn, Facebook, TikTok)
- Social Listening con sentimiento
- Content Calendar y Scheduled Posts
- Journey Builder con pasos sociales (social_reply, social_dm, create_post)
- Social Automation Rules (triggers/acciones en memoria, no persistidas)
- Next Best Action engine (rule-based)
- Content Approvals (workflow de revision)
- Company State analysis (maturity scoring)
- Platform Settings con auto_publish por plataforma
- pg_cron habilitado (solo usado para AI model monitoring cada 15 min)

### Lo que FALTA (el gap critico)

```text
+-------------------------------------------------------------+
|                   ESTADO ACTUAL                               |
|                                                               |
|  [Agente 1] [Agente 2] [Agente 3] ... [Agente 27]           |
|      |           |           |              |                 |
|      v           v           v              v                 |
|  (ejecucion manual, uno por uno, usuario decide cuando)       |
|                                                               |
|  NO HAY:                                                      |
|  - Ciclo autonomo de evaluacion -> decision -> accion         |
|  - Cron jobs que disparen agentes automaticamente             |
|  - Guardrails que protejan la marca en tiempo real            |
|  - Feedback loop que aprenda del performance                  |
|  - Orquestador que coordine multiples agentes                 |
+-------------------------------------------------------------+

+-------------------------------------------------------------+
|                   ESTADO DESEADO                              |
|                                                               |
|  [Marketing Autopilot Engine] -- ejecuta cada 6h via cron     |
|      |                                                        |
|      +-> Fase 1: SENSE (analizar performance + listening)     |
|      +-> Fase 2: THINK (decidir que acciones tomar)           |
|      +-> Fase 3: ACT (ejecutar agentes automaticamente)       |
|      +-> Fase 4: GUARD (validar contra brand guidelines)      |
|      +-> Fase 5: LEARN (registrar resultados, ajustar)        |
|                                                               |
|  Todo con approval gates configurables por empresa            |
+-------------------------------------------------------------+
```

---

## Arquitectura Propuesta: Marketing Autopilot Engine

### El Ciclo Autonomo (SENSE -> THINK -> ACT -> GUARD -> LEARN)

**Fase 1 - SENSE (Percibir)**
- Recopilar metricas de todas las plataformas conectadas
- Analizar Social Listening (menciones, sentimiento, tendencias)
- Evaluar performance de contenido reciente (que funciono, que no)
- Revisar estado de campanas activas
- Detectar oportunidades y amenazas en tiempo real

**Fase 2 - THINK (Decidir)**
- IA analiza todo el contexto y genera un "plan de accion" priorizado
- Considera: objetivos de negocio, calendario editorial, presupuesto de creditos, historial de performance
- Genera decisiones tipo: "publicar contenido sobre X", "ajustar campana Y", "responder mencion Z"
- Cada decision incluye urgencia, impacto estimado, y riesgo

**Fase 3 - ACT (Ejecutar)**
- Orquesta los agentes necesarios automaticamente
- CONTENT_CREATOR para generar posts, CAMPAIGN_OPTIMIZER para ajustar campanas
- Programa publicaciones en horarios optimos (usando datos historicos)
- Responde comentarios/menciones via community manager

**Fase 4 - GUARD (Proteger)**
- Valida todo contenido generado contra: palabras prohibidas, tono de marca, limites de publicacion
- Revisa si requiere aprobacion humana (segun config de la empresa)
- Si auto_publish=false, envia a cola de aprobacion
- Si auto_publish=true y pasa guardrails, publica directamente

**Fase 5 - LEARN (Aprender)**
- Registra toda accion tomada con contexto y resultado esperado
- Despues de 24-48h, evalua resultado real vs esperado
- Alimenta modelo de preferencias de la empresa
- Ajusta parametros para proximas decisiones

---

## Plan de Implementacion

### 1. Edge Function: `marketing-autopilot-engine`
El cerebro central. Se ejecuta via pg_cron cada 6 horas (configurable por empresa). Flujo:

1. Obtiene lista de empresas con autopilot habilitado
2. Para cada empresa, ejecuta el ciclo SENSE-THINK-ACT-GUARD-LEARN
3. Usa `universal-ai-handler` con functionName `marketing_autopilot` para las decisiones
4. Registra todo en nueva tabla `autopilot_execution_log`

### 2. Base de datos: Nuevas tablas

**`company_autopilot_config`**: Configuracion por empresa
- autopilot_enabled, execution_frequency (2h/6h/12h/24h)
- max_posts_per_day, max_credits_per_cycle
- require_human_approval (boolean)
- allowed_actions (array: create_content, publish, reply_comments, adjust_campaigns)
- brand_guardrails (JSON: forbidden_words, tone_rules, topic_restrictions)
- active_hours (JSON: cuando puede publicar)

**`autopilot_execution_log`**: Historial de cada ciclo
- company_id, cycle_id, phase (sense/think/act/guard/learn)
- decisions_made (JSON array), actions_taken (JSON array)
- content_generated, content_approved, content_rejected
- credits_consumed, execution_time_ms

**`autopilot_decisions`**: Cada decision individual
- cycle_id, decision_type, priority, description
- action_taken (que agente se ejecuto)
- guardrail_result (passed/blocked/sent_to_approval)
- expected_impact, actual_impact (rellenado en fase LEARN)

### 3. Persistencia de Automation Rules
Las SocialAutomationRules actuales solo viven en estado React (memoria). Crear tabla `social_automation_rules` para persistirlas y que el autopilot las ejecute.

### 4. pg_cron Job
Registrar un cron job que invoque `marketing-autopilot-engine` cada hora. La edge function internamente filtra empresas segun su frecuencia configurada.

### 5. UI: Autopilot Dashboard
Nuevo tab "Autopilot" en Marketing Hub que muestre:
- Toggle ON/OFF con configuracion
- Timeline de acciones tomadas automaticamente
- Metricas de impacto (contenido generado, engagement ganado)
- Cola de aprobacion pendiente (si require_human_approval=true)
- Guardrails configurables (palabras prohibidas, limites, horarios)

### 6. Brand Guardrails Service
Funcion reutilizable que valida cualquier contenido contra:
- company_communication_settings (palabras prohibidas, eslogan aprobado)
- company_branding (tono, personalidad)
- platform_settings (limites diarios, auto_publish flag)
- Retorna: approved / blocked (con razon) / needs_review

### 7. i18n
Todas las claves nuevas en ES/EN/PT para autopilot dashboard, configuracion, logs.

---

## Secuencia de Implementacion

| Paso | Componente | Dependencias |
|------|-----------|-------------|
| 1 | Migracion DB (tablas autopilot + automation rules) | Ninguna |
| 2 | Edge Function `marketing-autopilot-engine` | Tablas creadas |
| 3 | Persistencia de SocialAutomationRules en DB | Tabla social_automation_rules |
| 4 | Brand Guardrails validation logic (dentro del engine) | Communication settings existentes |
| 5 | pg_cron job registration | Edge function desplegada |
| 6 | Autopilot Dashboard UI (tab en Marketing Hub) | Todo lo anterior |
| 7 | i18n keys (ES/EN/PT) | UI creada |

---

## Guardrails y Proteccion de Marca

El sistema NUNCA publicara contenido que:
- Contenga palabras de la lista prohibida (company_communication_settings.forbidden_words)
- Viole el tono configurado en company_branding
- Exceda el limite de posts diarios por plataforma
- Este fuera del horario activo de la empresa
- Use temas restringidos por la empresa

Cuando require_human_approval=true, todo contenido generado va a la cola de ContentApprovalPanel existente antes de publicarse.

---

## Detalles Tecnicos Clave

- El autopilot engine usa el `universal-ai-handler` existente para decisiones, no crea un nuevo pipeline de IA
- Los agentes se ejecutan via la misma infraestructura de `useAgentExecution` (creditos, logging, parametros)
- El ciclo LEARN usa los analytics existentes (instagram_posts, linkedin_posts, etc.) para evaluar impacto
- La frecuencia del cron es horaria, pero cada empresa configura su ritmo (el engine filtra internamente)
- El dashboard muestra datos en real-time via polling o Supabase Realtime sobre autopilot_execution_log
