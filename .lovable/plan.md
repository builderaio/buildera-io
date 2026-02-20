

# Plan: Elevar el SCC a Motor de Inteligencia Estrategica (45% -> 70-80%)

## Resumen Ejecutivo

Transformar el Strategic Control Center de un gestor de tareas estatico a un motor operativo inteligente con persistencia de brechas, decisiones dinamicas rotativas, personalizacion por modelo de negocio y narrativa estrategica visible. Esto requiere 2 nuevas tablas en Supabase, modificaciones al hook de datos y una reescritura significativa del componente SCC.

---

## 1. Cambios en Estructura de Datos (Migraciones SQL)

### Tabla: `company_strategic_gaps`
Persiste cada brecha detectada con su ciclo de vida (detectada -> resuelta).

```text
company_strategic_gaps
├── id (uuid, PK)
├── company_id (uuid, FK -> companies)
├── gap_key (text) -- e.g. 'diag-visibility', 'dna-mission'
├── title (text)
├── description (text)
├── variable (text) -- positioning, channel, offer, etc.
├── source (text) -- 'dna' | 'diagnostic'
├── impact_weight (integer) -- puntos de impacto
├── urgency (text) -- critical, high, medium, low
├── detected_at (timestamptz, default now())
├── resolved_at (timestamptz, nullable)
├── resolved_by_action (text, nullable)
├── created_at / updated_at
└── UNIQUE(company_id, gap_key)
```

### Tabla: `company_weekly_decisions`
Persiste decisiones semanales con rotacion automatica de 7 dias.

```text
company_weekly_decisions
├── id (uuid, PK)
├── company_id (uuid, FK -> companies)
├── week_start (date) -- lunes de la semana
├── decision_key (text)
├── title (text)
├── reason (text)
├── action_view (text)
├── variable (text)
├── source (text)
├── completed_at (timestamptz, nullable)
├── created_at
└── UNIQUE(company_id, week_start, decision_key)
```

RLS: Ambas tablas con politicas para que usuarios solo accedan a gaps/decisiones de empresas donde son miembros.

---

## 2. Modificaciones al Hook: `useStrategicControlData.ts`

### 2.1 Perfil Estrategico
- Extraer `archetype` del `executive_diagnosis` (ya existe en el campo JSONB).
- Derivar `sdiLevel` (Emerging/Building/Competitive/Reference) del score overall.
- Leer `businessModel` desde `strategy.businessModel`.
- Retornar un objeto `strategicProfile` con estos 3 campos.

### 2.2 Gap Tracking Persistente
- Nueva funcion `syncStrategicGaps()`: compara gaps generados dinamicamente contra `company_strategic_gaps`. Inserta nuevos, marca como resueltos los que ya no aplican.
- Modificar `calculateIntegratedScore()` para consultar gaps reales de la tabla: penalizar por `resolved_at IS NULL`, bonificar por gaps resueltos.

### 2.3 Decisiones Semanales Dinamicas
- Calcular `week_start` como el lunes de la semana actual.
- Al cargar el SCC, verificar si existen decisiones para la semana actual en `company_weekly_decisions`.
- Si no existen: generarlas basadas en (a) gap activo mas critico, (b) score mas bajo, (c) business model. Guardarlas en la tabla.
- Si existen: cargarlas y filtrar las completadas.
- Funcion `completeDecision(id)` que marca `completed_at` y dispara recalculo.

### 2.4 Personalizacion por Business Model
- Nueva funcion `getBusinessModelPriorityWeights()` que retorna pesos de ordenamiento segun modelo:
  - B2B: authority (x2), positioning (x1.5), channel (x1)
  - B2C: brand (x2), visibility (x1.5), trust (x1.5)
  - B2B2C: channel (x2), offer (x1.5), positioning (x1)
- Aplicar estos pesos al ordenar prioridades en `generateIntegratedPriorities()`.

---

## 3. Componentes a Modificar

### 3.1 `StrategicControlCenter.tsx` - Cambios principales

**A) Nuevo bloque: "Tu Perfil Estrategico Actual"**
- Se inserta entre el header y el Insight Block.
- Muestra 3 chips/badges: Archetype, Nivel SDI, Business Model.
- Se actualiza reactivamente con los datos del hook.

**B) Prioridades con Narrativa Estrategica**
- Cada `PriorityCard` incluira una seccion expandible "Por que es importante:" con:
  - Brecha que corrige (gap_key vinculado)
  - Riesgo que mitiga (del diagnostico)
  - Impacto estrategico (puntos SDI proyectados)

**C) Decisiones Semanales con Persistencia**
- Reemplazar `DecisionItem` estatico por version interactiva.
- Boton "Completar" que llama a `completeDecision()`.
- Decisiones completadas se muestran tachadas con timestamp.
- Indicador de semana actual y dias restantes.

**D) Ciclo de Retroalimentacion**
- Al marcar una decision como completada:
  1. Marcar gap asociado como resuelto en `company_strategic_gaps`
  2. Recalcular SDI (re-fetch datos)
  3. Regenerar prioridades (se eliminan las resueltas)
  4. Toast de confirmacion con delta de score

### 3.2 `useStrategicControlData.ts` - Funciones nuevas

- `syncStrategicGaps(companyId, generatedPriorities)` -- sync bidireccional
- `completeWeeklyDecision(decisionId)` -- marca completada
- `resolveGap(gapId)` -- marca gap resuelto
- `getOrCreateWeeklyDecisions(companyId, strategy, diagnostic, businessModel)` -- rotacion semanal
- `getBusinessModelPriorityWeights(model)` -- pesos de ordenamiento

---

## 4. Flujo del Ciclo de Retroalimentacion

```text
Usuario completa accion
  -> completeWeeklyDecision()
    -> resolveGap() si aplica
      -> UPDATE company_strategic_gaps SET resolved_at = now()
    -> Re-fetch diagnostic + operational data
    -> Recalcular SDI (gaps resueltos suman puntos)
    -> Regenerar prioridades (sin gaps resueltos)
    -> Regenerar decisiones (sin repetir completadas)
    -> UI se actualiza reactivamente
```

---

## 5. Nivel Estimado de Alineacion Post-Implementacion

| Dimension | Antes (45%) | Despues (estimado) |
|-----------|-------------|-------------------|
| Integracion de capas | Parcial | Completa con feedback loop |
| SDI coherente | Solo activaciones | Madurez global + gap tracking |
| Personalizacion real | Solo en DNA wizard | SCC + prioridades + decisiones |
| Visibilidad de inteligencia | Insight basico | Perfil + narrativa + ciclo |
| Motor vs. gestor de tareas | Gestor | Motor con persistencia |

**Nivel estimado: 72-78%** (Sistema Operativo Empresarial en consolidacion)

Las brechas restantes para llegar a 80%+ serian: ejecucion real de agentes desde el SCC (no solo navegacion), dashboard de impacto temporal, y notificaciones proactivas -- pero estan fuera del alcance de este sprint.

---

## 6. Archivos Afectados

| Archivo | Tipo de cambio |
|---------|---------------|
| Migracion SQL (2 tablas + RLS) | Nuevo |
| `src/hooks/useStrategicControlData.ts` | Refactor mayor |
| `src/components/strategy/StrategicControlCenter.tsx` | Refactor mayor |
| `src/lib/businessModelContext.ts` | Extension menor (pesos SCC) |

