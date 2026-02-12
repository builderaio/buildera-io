
# Autopilot Engine: De Motor de Marketing a Cerebro Empresarial Adaptativo

## Diagnostico del Estado Actual

### Lo que existe hoy
- **marketing-autopilot-engine**: Edge function con ciclo SENSE-THINK-ACT-GUARD-LEARN hardcodeado exclusivamente para marketing (redes sociales, campanas, engagement)
- **company_department_config**: Tabla para 6 departamentos con auto-unlock por madurez
- **useDepartmentUnlocking**: Hook que desbloquea departamentos, pero NO los ejecuta
- **15 agentes enterprise**: Registrados en platform_agents, todos apuntan a `enterprise-autopilot-engine` (que NO existe aun)
- **openai-responses-handler**: Proxy centralizado con soporte para `web_search_preview` (busqueda web en tiempo real)

### Gaps Criticos Identificados

**1. El engine actual es rigido y solo sabe de marketing**
- SENSE solo consulta tablas de redes sociales (instagram_posts, linkedin_posts, etc.)
- THINK genera decisiones con tipos fijos: `create_content|publish|reply_comments|adjust_campaigns|analyze`
- No hay mecanismo para que el engine aprenda de sus propias decisiones pasadas
- No hay integracion con fuentes externas (mercado, industria, macroeconomia)

**2. No existe un Enterprise Autopilot Engine**
- Los 15 agentes enterprise apuntan a `enterprise-autopilot-engine` pero esa edge function no existe
- No hay ciclo SENSE-THINK-ACT-GUARD-LEARN para Sales, Finance, Legal, HR, Operations

**3. No hay memoria adaptativa**
- La fase LEARN solo almacena decisiones, no evalua su impacto real
- No hay feedback loop: el engine no sabe si sus decisiones anteriores funcionaron
- No hay evolucion del sistema de prompts basada en resultados

**4. No hay inteligencia externa**
- Ninguna fase consulta datos de mercado, tendencias de industria, o cambios macroeconomicos
- El engine opera en una burbuja de datos internos exclusivamente

---

## Arquitectura Propuesta: Adaptive Enterprise Brain

```text
ANTES:                              DESPUES:
============================        ================================
marketing-autopilot-engine          enterprise-autopilot-engine
  SENSE (solo social media)           SENSE (multi-departamento)
  THINK (solo marketing)                + External Intelligence Layer
  GUARD (solo brand check)            THINK (por departamento + cross)
  ACT   (solo log)                      + Memory-Augmented Reasoning
  LEARN (solo store)                  GUARD (por departamento)
                                      ACT   (ejecuta agentes reales)
                                      LEARN (evalua impacto + adapta)
                                        + Knowledge Evolution Loop
```

---

## Plan de Implementacion

### Paso 1: Crear tabla `autopilot_memory` (memoria adaptativa)
Nueva tabla para que el engine aprenda de si mismo:

- `company_id`, `department`, `cycle_id`
- `decision_type`: que tipo de decision se tomo
- `context_hash`: fingerprint del contexto que genero la decision
- `outcome_score`: resultado medido (positivo/negativo/neutro)
- `lesson_learned`: texto generado por IA describiendo que aprendio
- `applies_to_future`: reglas extraidas para decisiones futuras
- `external_signal_used`: si la decision fue influenciada por datos externos
- `created_at`, `evaluated_at`

Tambien crear tabla `external_intelligence_cache`:
- `source` (market_trends, industry_news, macroeconomic, technology, regulatory)
- `region`, `industry_sector`
- `data` (jsonb), `relevance_score`
- `fetched_at`, `expires_at`

### Paso 2: Crear edge function `enterprise-autopilot-engine`
El cerebro central, departamento-agnostico y adaptativo:

**SENSE Phase (por departamento)**:
- Marketing: metricas de redes, campanas, engagement (existe)
- Sales: pipeline health, deals estancados, lead scoring, conversion rates
- Finance: consumo de creditos, proyeccion, alertas de presupuesto
- Legal: contratos pendientes, fechas de vencimiento, compliance checks
- HR: vacantes abiertas, evaluaciones pendientes, clima laboral
- Operations: SLAs, tareas repetitivas, cuellos de botella

**SENSE Phase (External Intelligence Layer)**:
- Usa `web_search_preview` via openai-responses-handler para buscar:
  - Tendencias de la industria del usuario (campo `industry_sector` de la empresa)
  - Cambios regulatorios relevantes al pais de la empresa
  - Movimientos de competidores (si tiene `company_competitors`)
  - Condiciones macroeconomicas de la region
- Cachea resultados en `external_intelligence_cache` (TTL: 24h)
- La frecuencia de busqueda externa se controla por maturity level:
  - Starter: semanal
  - Growing: cada 3 dias
  - Established: diaria
  - Scaling: en tiempo real (cada ciclo)

**THINK Phase (Memory-Augmented Reasoning)**:
- Antes de generar decisiones nuevas, consulta `autopilot_memory`:
  - "En contextos similares, que decisiones funcionaron?"
  - "Que lecciones aprendidas aplican a esta situacion?"
- Incluye datos externos en el prompt de la IA:
  - "Tendencias actuales de la industria: [...]"
  - "Alerta macroeconomica: [...]"
  - "Movimiento de competidor: [...]"
- El system prompt es dinamico y se construye en base al departamento + contexto
- Genera decisiones con tipos especificos por departamento:
  - Sales: `qualify_lead|advance_deal|create_proposal|alert_stalled|enrich_contact`
  - Finance: `budget_alert|forecast_revenue|optimize_expenses|invoice_reminder`
  - Legal: `review_contract|compliance_alert|deadline_reminder`
  - HR: `create_job_profile|climate_survey|talent_match`
  - Operations: `optimize_process|sla_alert|automate_task`

**GUARD Phase (departamento-especifico + cross-departmental)**:
- Guardrails por departamento desde `company_department_config.guardrails`
- Cross-departmental checks:
  - Finance puede bloquear acciones de Marketing si presupuesto agotado
  - Legal puede bloquear acciones de HR si hay compliance pendiente
  - Operations puede throttle acciones si SLAs en riesgo

**ACT Phase (ejecuta agentes reales)**:
- El gap mas critico: el ACT actual solo registra logs, no ejecuta agentes
- El nuevo ACT invoca los agentes reales via `supabase.functions.invoke(agent.edge_function_name)`
- Respeta `max_credits_per_cycle` y `require_human_approval`
- Si `require_human_approval=true`, crea entry en `content_approvals` con toda la info

**LEARN Phase (Knowledge Evolution Loop)**:
- Evalua decisiones pasadas comparando `expected_impact` vs `actual_impact`
- Genera `lesson_learned` via IA: "La decision X tuvo resultado Y porque Z"
- Extrae reglas reutilizables en `applies_to_future`
- Ajusta internamente el peso de diferentes tipos de decisiones
- Detecta patrones: "Los martes las decisiones de contenido funcionan 30% mejor"

### Paso 3: External Intelligence Service
Funcion auxiliar dentro del engine que:

1. Construye queries de busqueda basadas en el perfil de la empresa:
   - `"{industry_sector} trends {country} {current_year}"`
   - `"{company_competitors[0].name} latest news"`
   - `"macroeconomic forecast {region} {quarter}"`
2. Llama a `openai-responses-handler` con `web_search_preview` habilitado
3. Parsea y estructura la informacion en categorias:
   - `market_opportunity`: oportunidades detectadas
   - `threat_alert`: amenazas o riesgos
   - `regulatory_change`: cambios normativos
   - `competitor_move`: acciones de competidores
   - `technology_shift`: cambios tecnologicos relevantes
4. Almacena en `external_intelligence_cache` con score de relevancia
5. Dispara nuevas capacidades automaticamente:
   - Si detecta cambio regulatorio -> activa revision Legal automatica
   - Si detecta competidor lanzando producto -> activa analisis Competitivo
   - Si detecta recesion en la region -> activa modo conservador en Finance

### Paso 4: Capability Evolution System
Logica que permite al engine "crecer" autonomamente:

- Nueva tabla `autopilot_capabilities`:
  - `department`, `capability_code`, `capability_name`
  - `trigger_condition` (jsonb): condicion para activar
  - `required_maturity`, `required_data`
  - `is_active`, `activated_at`, `activation_reason`

- Ejemplos de capabilities que se auto-activan:
  - `predictive_churn`: Se activa cuando hay >50 clientes en CRM y >3 meses de datos
  - `ab_testing_auto`: Se activa cuando hay >100 posts publicados
  - `cross_sell_engine`: Se activa cuando hay >3 productos y >20 deals cerrados
  - `regulatory_monitor`: Se activa cuando external intelligence detecta cambios legales
  - `market_expansion`: Se activa cuando revenue crece >20% en 3 meses consecutivos

### Paso 5: Refactorizar marketing-autopilot-engine
Convertir el engine actual en un thin wrapper que llama al enterprise engine con `department='marketing'`. Esto mantiene compatibilidad retroactiva mientras unifica la logica.

### Paso 6: Dashboard Adaptativo (UI)
Crear componente `EnterpriseAutopilotDashboard` que muestre:

- Vista unificada de todos los departamentos activos
- Timeline de decisiones cross-departamentales
- "Intelligence Feed": novedades externas detectadas con impacto en el negocio
- "Lessons Learned": ultimas lecciones del sistema
- "Capabilities Unlocked": nuevas capacidades auto-habilitadas
- Indicador de "IQ del Autopilot" (cuantos ciclos, cuantas lecciones, precision de predicciones)

### Paso 7: i18n completo
Todas las cadenas nuevas en ES/EN/PT.

---

## Secuencia de Ejecucion

| Paso | Entregable | Prioridad |
|------|-----------|-----------|
| 1 | Tablas: autopilot_memory, external_intelligence_cache, autopilot_capabilities | Alta |
| 2 | Edge function: enterprise-autopilot-engine (SENSE multi-dept + THINK + GUARD + ACT + LEARN) | Alta |
| 3 | External Intelligence Layer (web search + cache + triggers) | Alta |
| 4 | Capability Evolution System (auto-activation) | Media |
| 5 | Refactorizar marketing-autopilot-engine como wrapper | Media |
| 6 | UI: EnterpriseAutopilotDashboard | Media |
| 7 | i18n | Baja |

---

## Resultado Esperado

Tras esta implementacion, el Autopilot Engine sera:

- **Flexible**: Un solo engine ejecuta el ciclo para cualquier departamento, con SENSE/THINK/GUARD configurables por area
- **Robusto**: Guardrails cross-departamentales, limites de creditos, approval gates, y fallback a modo conservador ante errores
- **Inteligente**: Aprende de sus propias decisiones pasadas (Memory-Augmented Reasoning) y se alimenta de inteligencia externa de mercado, industria y macroeconomia
- **Evolutivo**: Auto-desbloquea nuevas capabilities cuando detecta que la empresa tiene los datos y la madurez necesaria, sin intervencion humana
