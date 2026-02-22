

## Plan: Ciclo de Vida de Capacidades Autonomas — COMPLETADO ✅

### Gaps Implementados

| # | Gap | Estado |
|---|-----|--------|
| 1 | Puente Aprobacion → Trial (`processApprovedCapabilities`) | ✅ DONE |
| 2 | Trial obligatorio en `evaluateCapabilities` (seeded/proposed → trial, no active) | ✅ DONE |
| 3 | Filtro de deprecadas recientes (<30d) en `proposeNewCapabilities` | ✅ DONE |
| 4 | Reversibilidad post-activacion (active → deprecated si negatives > positives*2) | ✅ DONE |
| 5 | Log auditable `logCapabilityTransition` en todas las transiciones | ✅ DONE |

### Flujo Completo Implementado

```text
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
            ├─ negatives > positives*2 (min 3 evals) → status=deprecated + logTransition
            └─ else → actualizar last_evaluated_at
```
