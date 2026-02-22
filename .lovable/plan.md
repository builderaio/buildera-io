

## Plan: Implementacion 100% del GOVERNANCE_FRAMEWORK

### Diagnostico

Tras auditar `guardPhase` (lineas 672-763) y el flujo ACT (lineas 877-954) en `enterprise-autopilot-engine/index.ts`, el framework de gobernanza tiene guardrails funcionales (budget diario, legal cross-dept, finance cross-dept, rate limiter, forbidden words, active hours) pero carece de 6 componentes criticos de la especificacion.

---

### Gaps Identificados

| # | Componente | Gap | Severidad |
|---|-----------|-----|-----------|
| 1 | Niveles de aprobacion | Solo existen 2 resultados: `passed` (auto) y `sent_to_approval`. Faltan: `post_review` (riesgo medio, ejecutar y marcar para revision) y `escalation` (riesgo critico, multiples stakeholders). La spec define 4 niveles proporcionales al riesgo. | CRITICO |
| 2 | Topes por campana | No se valida `campaign_budget_cap`. El sistema solo revisa el limite diario global de creditos. Las campanas activas pueden exceder su presupuesto asignado sin freno. | ALTO |
| 3 | Presupuesto departamental | No existe `department_budget_allocation`. El mismo limite diario aplica a todos los departamentos sin diferenciacion. | ALTO |
| 4 | Registro de intervenciones de guardrails | Cuando un guardrail bloquea una accion, el resultado se registra en `autopilot_decisions` pero NO se genera un log independiente que explique que hubiera pasado sin la intervencion del guardrail. | MEDIO |
| 5 | Clasificacion de riesgo en decisiones | El THINK phase no clasifica decisiones por nivel de riesgo (low/medium/high/critical). El GUARD no puede aplicar control proporcional porque no sabe el riesgo de cada decision. | ALTO |
| 6 | Compliance adaptado por sector | La validacion legal es un flag binario (`review_required`). No hay reglas diferenciadas por sector (fintech, salud, retail). | MEDIO |

---

### Cambios Requeridos

#### 1. Clasificacion de riesgo en THINK (pre-requisito para GUARD proporcional)

**Funcion**: `thinkPhase`

Ampliar el prompt del AI para que cada decision incluya un campo `risk_level` con valores:
- `"low"`: tareas operativas internas sin gasto ni impacto externo (insights, metricas)
- `"medium"`: acciones que generan contenido interno o ajustes reversibles (borradores, calendario)
- `"high"`: acciones que afectan presupuesto, clientes o marca (publicaciones, propuestas)
- `"critical"`: decisiones estrategicas que comprometen obligaciones legales o pricing

Agregar al prompt JSON schema:
```
"risk_level": "low|medium|high|critical"
```

Agregar una capa de validacion post-AI que asigne risk_level por defecto segun `decision_type` si el AI no lo proporciona:
- `analyze`, `forecast_pipeline`, `climate_survey` → low
- `create_content`, `adjust_campaigns`, `create_job_profile` → medium
- `publish`, `create_proposal`, `advance_deal` → high
- `review_contract`, `compliance_alert` con impacto financiero → critical

#### 2. GUARD con 4 niveles de control proporcional al riesgo

**Funcion**: `guardPhase`

Reemplazar la logica binaria actual por un sistema de 4 niveles basado en `risk_level`:

- **Low risk** (`risk_level: 'low'`): `guardrail_result: 'auto_approved'` — ejecucion inmediata sin intervencion
- **Medium risk** (`risk_level: 'medium'`): `guardrail_result: 'post_review'` — se ejecuta pero se marca para revision humana posterior. Insertar en `content_approvals` con `status: 'approved'` y `requires_post_review: true`
- **High risk** (`risk_level: 'high'`): `guardrail_result: 'requires_approval'` — NO se ejecuta hasta recibir aprobacion humana. Insertar en `content_approvals` con `status: 'pending_review'`
- **Critical risk** (`risk_level: 'critical'`): `guardrail_result: 'escalated'` — NO se ejecuta. Insertar en `content_approvals` con `status: 'draft'`, `approval_type: 'executive_escalation'` y notificacion a multiples stakeholders

Los guardrails existentes (budget, legal, forbidden words, active hours) siguen aplicandose ANTES de la clasificacion por riesgo y pueden anular cualquier nivel.

#### 3. Topes por campana (`campaign_budget_cap`)

**Funcion**: `guardPhase`

Para decisiones de tipo `create_content`, `publish`, `adjust_campaigns` que incluyan un `campaign_id` en `action_parameters`:
- Consultar `marketing_campaigns` para obtener el `budget` de la campana
- Consultar `agent_usage_log` para calcular creditos ya consumidos asociados a esa campana (filtrar por `input_data->campaign_id`)
- Si creditos consumidos >= 90% del budget: bloquear con `guardrail_details: 'Campaign budget cap reached (X/Y credits)'`
- Si creditos consumidos >= 75%: emitir warning en `guardrail_details` pero permitir ejecucion

#### 4. Presupuesto departamental (`department_budget_allocation`)

**Funcion**: `guardPhase`

Consultar `company_parameters` con key `department_budget_{department}` para obtener el limite mensual del departamento:
- Calcular creditos consumidos en el mes actual por agentes de las categorias del departamento
- Si consumo >= presupuesto: bloquear con `guardrail_details: 'Department monthly budget exhausted'`
- Si consumo >= 80%: escalar a `requires_approval` independientemente del risk_level original
- Si no existe parametro de presupuesto departamental: usar comportamiento actual (sin limite departamental)

#### 5. Registro de intervenciones de guardrails

**Funcion**: `guardPhase` (al final)

Para cada decision donde `guardrail_result !== 'auto_approved'`, insertar un registro en `autopilot_execution_log` con:
- `phase: 'guardrail_intervention'`
- `context_snapshot`: decision original, guardrail aplicado, resultado
- `status`: el `guardrail_result` (blocked, post_review, requires_approval, escalated)
- Descripcion de "que hubiera pasado sin el guardrail": la accion que se habria ejecutado y su impacto esperado

Esto permite auditar todas las intervenciones de guardrails independientemente del log de decisiones.

#### 6. Compliance adaptado por sector

**Funcion**: `guardPhase`

Consultar `companies.industry_sector` para obtener el sector de la empresa y aplicar reglas especificas:

Definir un mapa de reglas por sector:
- **fintech**: bloquear `create_proposal` sin `compliance_alert` previo; forzar `requires_approval` para cualquier accion que involucre valores monetarios
- **healthcare/salud**: escalar a `critical` cualquier comunicacion externa (publicaciones, propuestas) que no tenga revision legal previa
- **retail**: permitir mayor autonomia en contenido pero forzar `requires_approval` para descuentos y pricing
- **services**: reglas estandar sin restricciones adicionales por sector

Si el sector no esta en el mapa, usar reglas estandar. Las reglas sectoriales se aplican como una capa adicional sobre los guardrails existentes.

---

### Actualizacion del ACT phase

Modificar `actPhase` para manejar los nuevos `guardrail_result` valores:
- `auto_approved` y `post_review`: ejecutar normalmente
- `post_review`: despues de ejecutar, insertar en `content_approvals` con estado `approved` y flag `requires_post_review`
- `requires_approval`: enviar a aprobacion (comportamiento actual de `sent_to_approval`)
- `escalated`: enviar a aprobacion con tipo `executive_escalation`, no ejecutar
- `blocked`: no ejecutar (comportamiento actual)

---

### Secuencia de Implementacion

1. Gap 5 - Clasificacion de riesgo en THINK (pre-requisito)
2. Gap 2 - 4 niveles de GUARD proporcional al riesgo
3. Gap 3 - Topes por campana
4. Gap 4 - Presupuesto departamental
5. Gap 1 - Registro de intervenciones de guardrails
6. Gap 6 - Compliance adaptado por sector
7. Actualizacion del ACT phase para nuevos guardrail_result

### Archivos a Modificar

- `supabase/functions/enterprise-autopilot-engine/index.ts`

No se requieren migraciones de base de datos. Los campos `guardrail_result` y `guardrail_details` en `autopilot_decisions` son de tipo texto y aceptan los nuevos valores. El campo `content_data` en `content_approvals` es JSONB y puede contener los nuevos campos de escalamiento.

### Resumen Tecnico

```text
ANTES (2 niveles):
  Decision → guardrail check → passed | sent_to_approval | blocked

DESPUES (4 niveles proporcionales):
  Decision (con risk_level) → guardrails existentes → risk-based classification:
    low      → auto_approved     → ejecutar silenciosamente
    medium   → post_review       → ejecutar + marcar para revision
    high     → requires_approval → NO ejecutar, esperar aprobacion
    critical → escalated         → NO ejecutar, escalamiento ejecutivo

NUEVAS CAPAS DE VALIDACION:
  campaign_budget_cap    → bloquear si campana excede 90% presupuesto
  department_budget      → bloquear si departamento excede presupuesto mensual
  sector_compliance      → reglas adicionales por industry_sector
  guardrail_intervention → log auditable independiente por cada intervencion
```
