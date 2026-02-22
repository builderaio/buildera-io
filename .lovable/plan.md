

## Plan: Autonomy Control Center — Dashboard Enterprise-Grade de Gobernanza en Tiempo Real

### Contexto

La imagen de referencia muestra un **Autonomy Control Center** con layout tipo "command center" oscuro y 6 paneles en grid: Enterprise IQ, Departamentos, Log de Ejecucion, Guardrails Presupuestarios, Aprobaciones Pendientes y Capacidades Activas — todo en una sola vista sin tabs.

El dashboard actual (`GovernanceDashboard.tsx`) es basico: 4 KPI cards + 2 tabs (Aprobaciones / Decisiones) con datos planos. No tiene el layout de command center, ni el IQ score, ni los guardrails presupuestarios, ni las capacidades activas, ni la barra de estado inferior.

### Estrategia

Reescribir `GovernanceDashboard.tsx` como un **Autonomy Control Center** enterprise-grade que replica la estructura de la imagen de referencia, conectado a datos reales de Supabase (`autopilot_decisions`, `autopilot_execution_log`, `content_approvals`, `autopilot_capabilities`, `autopilot_memory`, `company_department_config`).

---

### Componentes del nuevo dashboard (6 paneles + barra de estado)

#### 1. Enterprise IQ (izquierda superior)
- IQ Score calculado: `(cyclesCompleted * 2) + (lessonsLearned * 5) + (activatedCaps * 10)`, max 999
- Crecimiento mensual (comparar con hace 30 dias)
- Barra de progreso hacia siguiente nivel (Principiante < 50, Aprendiz < 150, Competente < 300, Experto < 500, Maestro)
- **Datos**: `autopilot_execution_log` (ciclos), `autopilot_memory` (lecciones), `autopilot_capabilities` (activas)

#### 2. Departamentos activos (izquierda inferior)
- Lista de 6 departamentos con icono, nombre, count de agentes activos y tareas del dia
- Status dot (active/monitoring/inactive) basado en `company_department_config.autopilot_enabled`
- **Datos**: `company_department_config`, `autopilot_decisions` (count por dept hoy)

#### 3. Log de Ejecucion (centro superior)
- Feed cronologico de las ultimas decisiones ejecutadas hoy
- Cada entrada: agente ejecutado, descripcion breve, hora
- Badge con count total de decisiones hoy
- **Datos**: `autopilot_decisions` filtrado por hoy con `action_taken = true`

#### 4. Guardrails Presupuestarios (centro inferior)
- Lista de alertas de guardrails activos por departamento
- Cada alerta: icono de nivel (warning/success/info), mensaje, departamento, valor
- **Datos**: `autopilot_execution_log` con `phase = 'guardrail_intervention'`, `company_credits` para % usado

#### 5. Aprobaciones Pendientes (derecha superior)
- Lista de items en `content_approvals` con `status = 'pending_review'`
- Cada item: departamento, risk badge (basado en `content_data`), monto/descripcion, tiempo relativo
- Botones de aprobar (checkmark verde) y rechazar (X)
- Badge con count de pendientes
- **Datos**: `content_approvals` con status `pending_review`, acciones de approve/reject

#### 6. Capacidades Activas (derecha inferior)
- Lista de `autopilot_capabilities` activas/trial
- Cada una: badge LIVE/TRIAL, nombre, score (basado en `execution_count` o outcome metrics), barra de progreso
- Badge con count de activas
- **Datos**: `autopilot_capabilities` con `is_active = true` o `status = 'trial'`

#### 7. Barra de estado inferior
- Ciclo actual (#), agentes activos, creditos usados hoy, proximo ciclo (countdown)
- **Datos**: `autopilot_execution_log` (count ciclos), `agent_usage_log` (creditos hoy)

---

### Acciones funcionales en el dashboard

| Accion | Panel | Implementacion |
|--------|-------|---------------|
| Aprobar contenido | Aprobaciones | Update `content_approvals.status` a `approved` + `reviewed_at`, `reviewer_id` |
| Rechazar contenido | Aprobaciones | Update `content_approvals.status` a `rejected` + `reviewer_comments` |
| Refresh datos | Header | Re-fetch de todos los queries |
| Ver detalle de decision | Log | Expandir con reasoning y guardrail_details |

---

### i18n

Agregar claves en `public/locales/{es,en,pt}/company.json` bajo namespace `governance` para todos los labels del panel (Enterprise IQ, departamentos, logs, guardrails, aprobaciones, capacidades, barra de estado).

---

### Seccion Tecnica

```text
Layout Grid (12 columnas):
  Col 1-3:  [IQ Score] + [Departamentos]
  Col 4-8:  [Log de Ejecucion] + [Guardrails Presupuestarios]
  Col 9-12: [Aprobaciones Pendientes] + [Capacidades Activas]
  Full:     [Status Bar]

Queries Supabase:
  1. autopilot_decisions → filtro company_id, order by created_at desc, limit 50
  2. content_approvals → filtro company_id, status pending_review
  3. autopilot_capabilities → filtro company_id, is_active=true OR status=trial
  4. autopilot_execution_log → filtro company_id, phase=guardrail_intervention
  5. autopilot_memory → count lecciones para IQ
  6. company_department_config → estado de departamentos
  7. agent_usage_log → creditos consumidos hoy
```

### Archivos a Modificar

- `src/components/company/GovernanceDashboard.tsx` — reescritura completa del componente
- `public/locales/es/company.json` — claves i18n para gobernanza
- `public/locales/en/company.json` — claves i18n para gobernanza
- `public/locales/pt/company.json` — claves i18n para gobernanza

