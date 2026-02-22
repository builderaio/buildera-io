

## Plan: Asegurar la Implementacion 100% del Ciclo de Vida de Capacidades Autonomas

### Diagnostico

Tras auditar las funciones `evaluateCapabilities`, `proposeNewCapabilities`, `manageCapabilityLifecycle` y el flujo de gobernanza en `enterprise-autopilot-engine/index.ts`, el ciclo de vida tiene la estructura fundamental pero presenta 5 gaps que rompen la cadena completa Gap→Propuesta→Aprobacion→Trial→Evaluacion→Activacion.

---

### Gaps Identificados

| # | Etapa del ciclo | Gap | Severidad |
|---|----------------|-----|-----------|
| 1 | Aprobacion → Trial | No existe puente entre `content_approvals` (aprobacion humana) y `autopilot_capabilities`. Cuando un usuario aprueba una capability de riesgo medio/alto en el dashboard de gobernanza, NADA actualiza la capability a status `trial`. El ciclo se rompe aqui. | CRITICO |
| 2 | Evaluacion seeded/proposed | `evaluateCapabilities` activa capabilities `seeded`/`proposed` directamente a `active` basandose en `trigger_condition`, **saltandose el periodo de trial de 7 dias**. Esto contradice la spec. | ALTO |
| 3 | Re-propuesta de deprecadas | `proposeNewCapabilities` verifica `existingCodes` para evitar duplicados, pero incluye capabilities deprecadas. El AI puede re-proponer una capability ya evaluada y deprecada. | MEDIO |
| 4 | Reversibilidad post-activacion | No existe mecanismo para degradar una capability `active` de vuelta a `deprecated` si su rendimiento cae despues de la activacion. La spec dice "cada etapa es reversible". | MEDIO |
| 5 | Trazabilidad de transiciones | Las transiciones de estado (proposed→trial→active, proposed→deprecated) no se registran como eventos auditables individuales. Solo se actualiza el campo `status` sin historial. | MEDIO |

---

### Cambios Requeridos

#### 1. Puente Aprobacion → Trial (GAP CRITICO)

**Funcion**: Nueva funcion `processApprovedCapabilities(companyId)`

En cada ciclo (en `runDepartmentCycle`, despues de CAPABILITY GENESIS), consultar `content_approvals` con:
- `content_type = 'capability_approval'`
- `status = 'approved'`
- `company_id = companyId`

Para cada aprobacion encontrada:
- Actualizar la capability correspondiente en `autopilot_capabilities` a `status: 'trial'`, `trial_expires_at: now + 7 dias`
- Marcar la `content_approval` como `published` (estado final del flujo de gobernanza)
- Registrar el evento de transicion

Esto cierra el ciclo: Propuesta → Gobernanza → Aprobacion humana → Trial automatico.

#### 2. Corregir `evaluateCapabilities` para respetar el trial

**Funcion**: `evaluateCapabilities`

Cambiar el flujo actual que va `seeded/proposed → active` directamente:
- En lugar de activar a `active`, transicionar a `trial` con `trial_expires_at = now + 7 dias`
- Solo capabilities con `auto_activate = true` o que vengan de triggers deben pasar por trial
- Capabilities `seeded` que cumplen trigger_condition → status `trial` (no `active`)

Esto garantiza que TODA capability pasa por el periodo de prueba de 7 dias.

#### 3. Filtro de capabilities deprecadas en propuestas

**Funcion**: `proposeNewCapabilities`

Al construir `existingCodes`, incluir TAMBIEN las capabilities con status `deprecated`:
- Cambiar el query de `autopilot_capabilities` para incluir todas (no solo las activas)
- Agregar al prompt del AI: "Do NOT re-propose deprecated capabilities"
- Si una capability deprecada tiene menos de 30 dias, excluirla. Si tiene mas de 30 dias, permitir re-propuesta (el contexto puede haber cambiado)

#### 4. Monitoreo post-activacion con reversibilidad

**Funcion**: Ampliar `manageCapabilityLifecycle`

Despues de evaluar capabilities en `trial`, agregar un bloque para capabilities `active`:
- Consultar capabilities activas con `last_evaluated_at` mas de 14 dias
- Evaluar su rendimiento reciente (ultimas 2 semanas) en `autopilot_memory`
- Si `negatives > positives * 2` y hay al menos 3 evaluaciones: degradar a `deprecated` con razon descriptiva
- Si rendimiento es neutral: mantener pero actualizar `last_evaluated_at`

Esto implementa la reversibilidad: una capability activa puede ser deprecada si su rendimiento cae.

#### 5. Log auditable de transiciones de estado

**Funcion**: Nueva funcion helper `logCapabilityTransition(companyId, capabilityCode, fromStatus, toStatus, reason)`

Insertar un registro en `autopilot_execution_log` con:
- `phase: 'capability_lifecycle'`
- `context_snapshot` con el estado previo y nuevo de la capability
- `status` con la transicion (e.g., `proposed_to_trial`, `trial_to_active`, `active_to_deprecated`)

Llamar esta funcion en cada punto donde se cambia el status de una capability:
- En `proposeNewCapabilities` al crear (→ proposed / → trial)
- En `processApprovedCapabilities` al aprobar (proposed → trial)
- En `evaluateCapabilities` al activar trigger (seeded → trial)
- En `manageCapabilityLifecycle` al promover/deprecar (trial → active / trial → deprecated / active → deprecated)

---

### Secuencia de Implementacion

1. Gap 5 - Helper `logCapabilityTransition` (necesario para todos los demas cambios)
2. Gap 1 - `processApprovedCapabilities` (puente critico aprobacion → trial)
3. Gap 2 - Correccion de `evaluateCapabilities` (trial obligatorio)
4. Gap 3 - Filtro de deprecadas en propuestas
5. Gap 4 - Monitoreo post-activacion con reversibilidad

### Archivos a Modificar

- `supabase/functions/enterprise-autopilot-engine/index.ts` (todos los cambios)

No se requieren migraciones de base de datos — `autopilot_execution_log` ya tiene los campos necesarios para el log de transiciones.

### Seccion Tecnica

```text
Flujo completo despues de los cambios:

Gap Detectado ──► proposeNewCapabilities()
                    │
                    ├─ risk=low  → status=trial (7d auto) + logTransition
                    ├─ risk=med  → status=proposed + content_approvals(pending_review)
                    └─ risk=high → status=proposed + content_approvals(draft)
                    
Usuario aprueba ──► processApprovedCapabilities()
                    └─ content_approval.status=approved → capability.status=trial (7d) + logTransition

Trigger met ──► evaluateCapabilities()
                └─ seeded/proposed + trigger OK → status=trial (7d) + logTransition

7 dias ──► manageCapabilityLifecycle()
            ├─ positives > negatives → status=active + logTransition
            └─ else → status=deprecated + logTransition

14 dias post-activacion ──► manageCapabilityLifecycle()
            ├─ negatives > positives*2 → status=deprecated (reversibilidad) + logTransition
            └─ else → actualizar last_evaluated_at
```

