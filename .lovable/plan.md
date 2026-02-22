

## Plan: Implementacion 100% del Ciclo Autonomo en Detalle Operativo

### Diagnostico

Tras auditar las 1,658 lineas del `enterprise-autopilot-engine/index.ts`, el ciclo SENSE-THINK-GUARD-ACT-LEARN-EVOLVE esta estructuralmente implementado. Sin embargo, existen 6 gaps especificos que impiden alcanzar la paridad total con la especificacion detallada.

---

### Gaps Identificados

| # | Fase | Gap | Severidad |
|---|------|-----|-----------|
| 1 | Todas | El motor escribe a `department_execution_log` (por fase) pero NUNCA a `autopilot_execution_log` (resumen por ciclo). Los dashboards leen de `autopilot_execution_log` y ven datos vacios. | CRITICO |
| 2 | LEARN | El campo `context_hash` existe en `autopilot_memory` pero nunca se genera ni almacena. La spec requiere hash para recuperacion por similitud de contexto. | ALTO |
| 3 | LEARN | La evaluacion de impacto solo cubre 3 tipos de decision (content/publish, qualify_lead/advance_deal, analyze). Los departamentos Finance, Legal, HR y Operations no tienen evaluacion de impacto. | ALTO |
| 4 | SENSE | La tabla `company_competitors` no se incorpora al snapshot de datos. La spec menciona "señales de competencia" como fuente de datos. | MEDIO |
| 5 | EVOLVE | `detectCapabilityGaps` solo analiza `action_taken=false`. La spec dice "decisiones con action_taken=false O outcome_score menor al umbral". | MEDIO |
| 6 | Todas | No se agrega `credits_consumed` al resumen del ciclo. La spec dice que el log auditable incluye creditos consumidos por ciclo. | MEDIO |

---

### Cambios Requeridos

#### 1. Registro de ciclo completo en `autopilot_execution_log`

Al final de `runDepartmentCycle`, despues de todas las fases, insertar un registro resumen en `autopilot_execution_log` con:
- `cycle_id`: UUID del ciclo
- `company_id`: empresa
- `phase`: "complete_cycle" (para diferenciarlo de los per-phase logs)
- `status`: "completed" o "failed"
- `context_snapshot`: snapshot de datos del SENSE
- `decisions_made`: array de decisiones del THINK
- `actions_taken`: array de acciones ejecutadas del ACT
- `credits_consumed`: suma total de creditos consumidos por agentes ejecutados en el ciclo
- `execution_time_ms`: tiempo total del ciclo
- Contadores: `content_generated`, `content_approved`, `content_rejected`, `content_pending_review`

Esto conecta el motor con los dashboards existentes que ya leen de esta tabla.

#### 2. Generacion de `context_hash` en LEARN

En `learnPhase`, al crear los `memoryRows`, generar un hash del contexto usando los campos clave:
- Hash basado en: `department + decision_type + JSON.stringify(action_parameters claves)`
- Usar un hash simple (base64 de substring) compatible con Deno
- Almacenar en el campo `context_hash` de `autopilot_memory`
- En `retrieveMemory`, usar `context_hash` para buscar memorias con contexto similar al actual

#### 3. Evaluacion de impacto completa por departamento

Ampliar la seccion de `pendingEvals` en `learnPhase` para cubrir todos los departamentos:

- **Finance** (`budget_alert`, `credit_alert`, `cashflow_warning`): Evaluar comparando creditos consumidos antes/despues, variacion en `business_health_snapshots`
- **Legal** (`compliance_alert`, `review_contract`): Verificar si se actualizaron parametros legales post-decision
- **HR** (`create_job_profile`, `climate_survey`, `talent_match`): Verificar si se agregaron miembros o se actualizaron parametros HR
- **Operations** (`optimize_process`, `automate_task`, `sla_alert`): Evaluar cambio en tasa de completitud de tareas y failure rate de agentes
- **Sales** (ampliar): Cubrir `create_proposal`, `forecast_pipeline`, `enrich_contact` ademas de los ya evaluados

#### 4. Datos de competencia en SENSE

En `sensePhase`, para los departamentos `marketing` y `sales`, consultar `company_competitors`:
- Obtener lista de competidores configurados (`name`, `website_url`, `strengths`, `weaknesses`)
- Incluirlos en el snapshot de datos como `competitors: [...]`
- El AI del THINK ya puede considerarlos gracias al context del prompt

#### 5. Gap detection con `outcome_score < threshold`

En `detectCapabilityGaps`, agregar una consulta adicional:
- Buscar decisiones en `autopilot_memory` con `outcome_score < 3` (umbral configurable) y `outcome_evaluation = 'negative'`
- Agrupar por `decision_type` con 3+ ocurrencias negativas
- Agregar como nueva seccion `low_performing_decisions` en el `GapReport`
- Incluir en la logica de `proposeNewCapabilities` para que el AI considere areas de bajo rendimiento

#### 6. Agregacion de creditos por ciclo

En `actPhase`, acumular los creditos consumidos por cada agente ejecutado:
- Sumar `agent.credits_per_use` de cada decision ejecutada exitosamente
- Retornar el total junto con los resultados
- Pasar este total al registro de `autopilot_execution_log` del punto 1

---

### Archivo a Modificar

`supabase/functions/enterprise-autopilot-engine/index.ts`

Todos los cambios se concentran en este unico archivo. No se requieren migraciones de base de datos porque las tablas y campos ya existen.

### Secuencia de Implementacion

1. Gap 1 - Registro en `autopilot_execution_log` (conecta motor con dashboards)
2. Gap 6 - Agregacion de creditos (necesario para el registro del punto 1)
3. Gap 2 - `context_hash` en LEARN
4. Gap 3 - Evaluacion de impacto completa
5. Gap 4 - Competidores en SENSE
6. Gap 5 - Gap detection con outcome_score

