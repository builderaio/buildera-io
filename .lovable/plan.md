

## Plan: Asegurar la Implementacion 100% del CAPABILITY_GENESIS_ENGINE

### Diagnostico

Tras auditar las funciones `detectCapabilityGaps`, `proposeNewCapabilities`, `evaluateCapabilities` y `manageCapabilityLifecycle` en `enterprise-autopilot-engine/index.ts`, el motor Genesis esta estructuralmente completo pero tiene 5 gaps que impiden la operacion al 100% segun la especificacion.

---

### Estado Actual vs Especificacion

| Componente | Spec | Estado | Gap |
|-----------|------|--------|-----|
| Gap Detector - Decisiones bloqueadas | Analiza `action_taken=false` y `guardrail_result=blocked` | Funcional | Sin filtro por departamento en la query (linea 1250-1254) |
| Gap Detector - Correlacion temporal | Correlaciona fallos por frecuencia temporal | Ausente | No agrupa por ventana temporal (7d, 30d) |
| Gap Detector - gap_evidence verificable | Genera evidencia con numero de incidencias, periodo y departamento | Parcial | Incluye counts pero no periodo temporal ni departamento en la evidencia |
| Capability Proposer - Especificacion completa | Define `required_data`, metricas de exito | Parcial | El prompt AI no solicita `required_data` ni `success_metrics` |
| Gobernanza - Auto-activate con trial | Auto-activate para bajo riesgo, human approval para alto impacto | Parcial | No existe notificacion ni registro de gobernanza para capabilities de alto impacto que requieren aprobacion humana |
| Trial Manager - Evaluacion especifica | Evalua ejecuciones **relacionadas con la capability** durante el trial | Incorrecto | Consulta TODAS las decisiones del periodo, no solo las relacionadas con la capability (lineas 1471-1475) |
| Integracion en flujos - Decision Engine | Las capacidades activas se incluyen en la evaluacion de decisiones THINK | Ausente | `thinkPhase` solo consulta `platform_agents`, NUNCA consulta `autopilot_capabilities` activas |
| Integracion en flujos - Agent Router | El router detecta automaticamente nuevas capabilities | Ausente | No hay mapeo entre capabilities y decision types en el routing |

---

### Cambios Requeridos

#### 1. Gap Detector: Filtro por departamento y correlacion temporal

**Funcion**: `detectCapabilityGaps`

- Agregar `.eq('department', department)` al query de `autopilot_decisions` (linea 1250-1254) — actualmente lee decisiones de TODOS los departamentos
- Enriquecer `gap_evidence` con ventana temporal: calcular periodo de incidencias (fecha primera, fecha ultima, duracion en dias)
- Incluir departamento afectado explicitamente en cada gap item

#### 2. Capability Proposer: Especificacion completa del agente

**Funcion**: `proposeNewCapabilities`

Ampliar el prompt del AI (linea 1387-1402) para que cada capability propuesta incluya:
- `required_data`: array de fuentes de datos que necesita (e.g., `["crm_deals", "company_parameters"]`)
- `success_metrics`: metricas de exito medibles (e.g., `{"metric": "conversion_rate", "target": "+10%"}`)
- `risk_level`: `"low"` | `"medium"` | `"high"` — determina si se auto-activa o requiere aprobacion humana

Almacenar estos campos adicionales en el insert a `autopilot_capabilities`.

#### 3. Gobernanza: Aprobacion humana para capabilities de alto riesgo

**Funcion**: `proposeNewCapabilities`

Despues del insert:
- Si `risk_level = "low"` y `auto_activate = true`: comportamiento actual (trial automatico con 7 dias)
- Si `risk_level = "medium"`: status `proposed` con notificacion en `content_approvals` para revision del usuario
- Si `risk_level = "high"`: status `proposed` + insercion en `content_approvals` con `approval_type: 'capability'` y `requires_human_approval: true`

Esto conecta las capabilities de alto riesgo al sistema de gobernanza existente.

#### 4. Trial Manager: Evaluacion especifica por capability

**Funcion**: `manageCapabilityLifecycle`

Corregir la evaluacion de trial (lineas 1471-1475) para que:
- Filtre decisiones por `decision_type` relacionados con la capability (`capability_code` como filtro textual parcial)
- Si no hay decision_types especificos, use el departamento de la capability como filtro
- Agregar `deprecation_reason` descriptivo al deprecar (actualmente falta el campo)

#### 5. Integracion en THINK: Decision Engine incluye capabilities activas

**Funcion**: `thinkPhase`

Agregar un bloque despues del fetch de `platform_agents` (linea 547-549):
- Consultar `autopilot_capabilities` con `company_id`, `department`, `is_active = true`
- Construir un bloque `ACTIVE_CAPABILITIES` en el system prompt que liste las capabilities con su `trigger_condition`, `capability_name` y `required_data`
- Instruir al AI que puede generar decisiones basadas en estas capabilities ademas de los agentes existentes

Esto cierra el ciclo: las capabilities generadas por EVOLVE se integran al THINK en el siguiente ciclo.

#### 6. Integracion en ACT: Ejecucion de capabilities sin agente mapeado

**Funcion**: `actPhase` (o seccion de routing)

Cuando una decision tiene `agent_to_execute` que corresponde a una capability (no un `platform_agent`):
- Registrar la ejecucion con `action_taken: true` y resultado descriptivo
- Incrementar un contador en la capability para tracking de uso durante trial
- Esto permite que capabilities en trial acumulen evidencia de uso para su evaluacion

---

### Secuencia de Implementacion

1. Gap 1 - Filtro por departamento en `detectCapabilityGaps` (fix critico)
2. Gap 5 - Integracion de capabilities activas en `thinkPhase` (cierra el ciclo)
3. Gap 2 - Proposer con `required_data`, `success_metrics`, `risk_level`
4. Gap 3 - Gobernanza con `content_approvals`
5. Gap 4 - Trial Manager corregido
6. Gap 6 - Registro de uso de capabilities en ACT

### Archivos a Modificar

- `supabase/functions/enterprise-autopilot-engine/index.ts` (todos los cambios)

No se requieren migraciones de base de datos — los campos `gap_evidence`, `trigger_condition` y similares son JSONB y aceptan datos adicionales sin cambio de esquema.

