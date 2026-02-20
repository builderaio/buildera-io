

# Plan: Sistema Operativo Empresarial — Arquitectura Estratégica

## Estado: Implementado (Sprint 2 completado)

---

## Arquitectura Implementada

### 1. Strategic State Engine (SSE) ✅
- **Tabla**: `company_strategic_state_snapshots` — estado estratégico versionado
- **Módulo**: `src/lib/strategicStateEngine.ts` — lógica propietaria
- Versionamiento automático (sin sobrescritura)
- Maturity stage derivado: Early → Growth → Consolidated → Scale
- Capability Index: métrica compuesta de uso efectivo de plataforma
- Structural risks: derivados automáticamente de gaps + scores

### 2. Gap Lifecycle System ✅
- **Tabla**: `company_strategic_gaps` (mejorada con category, severity_weight, linked_priority_id, resolution_impact_score, weeks_active, escalated_at)
- SDI penaliza por gaps activos, recompensa por resolución
- No se puede cerrar gap sin acción completada (evidencia estructural)

### 3. Adaptive Decision Engine (ADE) ✅
- **Tabla**: `company_weekly_decisions` — persistencia + rotación 7 días
- Generación basada en: gap más crítico + score más bajo + modelo de negocio
- No repite decisiones ejecutadas
- Pesos adaptativos por modelo (B2B/B2C/B2B2C)

### 4. Strategic Memory Layer ✅
- **Tabla**: `company_strategic_memory` — registro de cada acción
- Impacto medido: sdi_before → sdi_after → delta
- Patrones de comportamiento detectados: strategic-executor, gap-closer, observer, etc.
- Clasificación de impacto: high/medium/low/none

### 5. Self-Recalibrating Index ✅
- **Tabla**: `company_score_history` — tracking longitudinal
- Pesos dinámicos por etapa de madurez
- Penalización progresiva por estancamiento (3+ semanas sin mejora)
- Bonificación por consistencia estratégica

### 6. Strategic Feedback Loop ✅
- Cada decisión completada → recalcula SDI → actualiza risks → genera nuevas prioridades
- Snapshot persistido automáticamente
- Memoria estratégica actualizada

### 7. Barrier-to-Replication Design ✅
- Lógica propietaria en `strategicStateEngine.ts`
- Modelo de evolución versionado
- Motor adaptativo contextual
- Historial longitudinal no reproducible

---

## Tablas Creadas

| Tabla | Propósito |
|-------|-----------|
| `company_strategic_state_snapshots` | Estado versionado |
| `company_score_history` | Evolución SDI longitudinal |
| `company_strategic_memory` | Memoria de decisiones + impacto |
| `company_strategic_gaps` (enhanced) | Ciclo de vida de brechas |
| `company_weekly_decisions` | Motor de decisiones semanales |

## Funciones DB

| Función | Propósito |
|---------|-----------|
| `next_strategic_state_version()` | Auto-incremento de versión |
| `get_dimension_stagnation()` | Detección de estancamiento |

## Archivos Clave

| Archivo | Tipo |
|---------|------|
| `src/lib/strategicStateEngine.ts` | **IP Core** — lógica propietaria |
| `src/hooks/useStrategicControlData.ts` | Hook principal del SCC |
| `src/components/strategy/StrategicControlCenter.tsx` | Componente SCC |
| `src/lib/businessModelContext.ts` | Pesos por modelo de negocio |

---

## Nivel de Alineación Estimado: 75-82%

| Dimensión | Antes | Ahora |
|-----------|-------|-------|
| Integración de capas | Parcial (45%) | Completa con feedback loop (85%) |
| SDI coherente | Solo activaciones | Recalibrante + longitudinal (80%) |
| Personalización | Solo DNA wizard | SCC + prioridades + decisiones (75%) |
| Visibilidad de inteligencia | Insight básico | Perfil + narrativa + riesgos + patrones (80%) |
| Motor vs gestor | Gestor de tareas | Motor con memoria + estado versionado (85%) |
| Barrera de replicación | Baja | Alta — lógica propietaria + historial (75%) |

### Brechas restantes para 90%+
- Ejecución real de agentes desde SCC (no solo navegación)
- Dashboard de impacto temporal con gráficas de evolución
- Notificaciones proactivas basadas en patrones
- Comparaciones inter-empresa por arquetipo
