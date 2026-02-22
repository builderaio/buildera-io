

## Plan: Asegurar la Implementacion Detallada del Enterprise Autopilot Brain

### Diagnostico

Tras revisar las ~1,440 lineas del `enterprise-autopilot-engine/index.ts`, el dashboard de ~830 lineas, y la infraestructura de soporte (RPCs, tablas, migraciones), la arquitectura de 5 capas ya esta implementada en su estructura fundamental. Sin embargo, existen gaps especificos dentro de cada capa que impiden que opere al 100% segun la especificacion.

---

### Estado por Capa

| Capa | Componente | Estado | Gap |
|------|-----------|--------|-----|
| L1 Decision Engine | Context Builder | Parcial | Construye contexto en THINK pero no como modulo discreto reutilizable |
| L1 Decision Engine | Multi-criteria Scorer | Parcial | El AI score es implicito en el prompt, no auditable como paso separado |
| L1 Decision Engine | Priority Queue | Basico | Las decisiones tienen priority pero se procesan en orden de array, sin cola priorizada |
| L2 Agent Orchestration | Agent Router | Completo | Mapeo por DEPT_CATEGORY_MAP funcional |
| L2 Agent Orchestration | Context Injector | Completo | Inyeccion via context_requirements funcional |
| L2 Agent Orchestration | Execution Manager | Parcial | Ejecucion serial solamente, sin soporte paralelo |
| L3 Guardrail & Compliance | Budget Validator | Parcial | Solo verifica finance_budget_status, sin topes por capa (diario/campana/departamento) |
| L3 Guardrail & Compliance | Compliance Checker | Parcial | Solo forbidden_words y topic_restrictions, falta validacion Legal->Ventas |
| L3 Guardrail & Compliance | Rate Limiter | Basico | Solo active_hours, sin limites por agente o por accion |
| L4 Learning & Memory | Impact Evaluator | Funcional | Evalua metricas reales despues de 7 dias |
| L4 Learning & Memory | Memory Store | Funcional | autopilot_memory opera correctamente |
| L4 Learning & Memory | Pattern Extractor | Ausente | No extrae patrones ni genera `applies_to_future` rules |
| L5 Capability Genesis | Gap Detector | Funcional | Detecta unmapped agents, recurring blocks, unhandled signals |
| L5 Capability Genesis | Capability Proposer | Funcional | Propone via AI con gap evidence |
| L5 Capability Genesis | Trial Manager | Incompleto | `trial_expires_at` no se establece al crear, promocion es RPC sin logica de evaluacion |

---

### Cambios Requeridos

#### 1. L1 - Priority Queue con scoring auditable

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

En la fase THINK, despues de recibir las decisiones del AI, implementar un scoring discreto que:
- Asigne un `priority_score` numerico (0-100) basado en: urgencia (peso 0.3), impacto esperado (0.3), alineacion estrategica (0.2), evidencia de datos (0.2)
- Ordene las decisiones por score antes de pasarlas a GUARD
- Registre el score en `autopilot_decisions` para auditoria

Esto convierte la priorizacion implicita del AI en un paso auditable y trazable.

#### 2. L3 - Guardrails multi-departamentales completos

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts` (funcion `guardPhase`)

Agregar validaciones cruzadas faltantes:
- **Legal -> Ventas**: Si existen parametros `legal_compliance_status = 'review_required'`, bloquear decisiones de tipo `create_proposal` y `advance_deal` en Sales
- **Rate Limiter por accion**: Consultar `autopilot_decisions` para contar ejecuciones del mismo `decision_type` en las ultimas 24h. Si supera un umbral configurable (`max_actions_per_day` en `company_department_config`), bloquear con razon `rate_limit_exceeded`
- **Budget por capas**: Verificar creditos consumidos en el dia actual vs `daily_credit_limit` (nuevo campo en `company_department_config`)

#### 3. L4 - Pattern Extractor

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts` (funcion `learnPhase`)

Despues de evaluar decisiones pendientes, agregar un paso que:
- Agrupe decisiones evaluadas del mismo `decision_type` con `outcome_evaluation = 'positive'` (3+ ocurrencias)
- Genere reglas de patron usando AI: "Cuando [contexto similar], ejecutar [decision_type] produce resultados positivos"
- Guarde las reglas en el campo `applies_to_future` de `autopilot_memory`
- Estas reglas ya se consumen en `retrieveMemory` pero nunca se generan

#### 4. L5 - Trial Manager con ciclo de vida de 7 dias

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts` (funciones `proposeNewCapabilities` y `manageCapabilityLifecycle`)

- Al insertar una capability con status `trial`, establecer `trial_expires_at = now() + 7 dias`
- En `manageCapabilityLifecycle`, antes de llamar a los RPCs, evaluar capabilities en trial:
  - Consultar si hubo ejecuciones relacionadas durante el periodo de trial
  - Si la capability produjo resultados positivos: promover a `active`
  - Si no hubo uso o resultados negativos: deprecar con `deprecation_reason`

#### 5. L2 - Ejecucion paralela en ACT

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts` (funcion `actPhase`)

- Agrupar decisiones `passed` que no tienen dependencias entre si
- Ejecutar agentes independientes en paralelo usando `Promise.allSettled`
- Mantener ejecucion serial para agentes con dependencias explicitas (si `action_parameters.depends_on` esta definido)

#### 6. Migracion de base de datos

Agregar campos faltantes para soportar los guardrails completos:
- `company_department_config.daily_credit_limit` (integer, default 50)
- `company_department_config.max_actions_per_day` (integer, default 10)

#### 7. Homepage - Alinear ArchitectureOverview con las 5 capas

**Archivo**: `src/components/home/ArchitectureOverview.tsx`

Actualizar el contenido para reflejar las 5 capas reales del Brain (L1-L5) con sus componentes internos, en lugar de la descripcion generica actual. Mantener el tono accesible pero alinear con la arquitectura real.

---

### Secuencia de Implementacion

1. Migracion DB (nuevos campos en `company_department_config`)
2. L3 Guardrails mejorados (validaciones cruzadas + rate limiter + budget por capas)
3. L1 Priority Queue con scoring auditable
4. L4 Pattern Extractor
5. L5 Trial Manager con evaluacion de 7 dias
6. L2 Ejecucion paralela en ACT
7. ArchitectureOverview actualizado

### Archivos a Modificar
- `supabase/functions/enterprise-autopilot-engine/index.ts` (cambios 1-5)
- `src/components/home/ArchitectureOverview.tsx` (cambio 7)
- Nueva migracion SQL (cambio 6)

