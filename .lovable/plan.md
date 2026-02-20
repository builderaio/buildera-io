
# Plan: Integrar Marketing Hub como Brazo Ejecutor del Strategic State Engine

## Resumen

Convertir el Marketing Hub de un modulo aislado en el ejecutor tactico del SSE. Esto requiere: una nueva tabla de impacto (`marketing_strategic_impact`), un hook de integracion (`useMarketingStrategicBridge`), modificaciones al CampaignWizard para vincular campanas a dimensiones/gaps, un Impact Engine que traduce metricas de marketing en deltas del SDI, y la conexion del onboarding al estado estrategico.

---

## 1. Nuevo Modelo de Datos

### Tabla: `marketing_strategic_impact`

Registra cada evento de marketing con su consecuencia estrategica.

```text
marketing_strategic_impact
├── id (uuid, PK)
├── company_id (uuid, FK)
├── event_type (text) -- 'campaign_created', 'post_published', 'automation_activated', 'engagement_spike', 'conversion'
├── event_source (text) -- 'campaign', 'autopilot', 'manual', 'automation_rule'
├── source_id (text, nullable) -- campaign_id, post_id, rule_id
├── strategic_dimension (text) -- 'brand', 'acquisition', 'authority', 'operations'
├── gap_id (uuid, nullable, FK -> company_strategic_gaps)
├── snapshot_version (integer, nullable) -- strategic_state version at time of event
├── sdi_before (integer)
├── sdi_after (integer)
├── dimension_delta (jsonb) -- { "presence": +2, "execution": +1 }
├── evidence (jsonb) -- { "engagement_rate": 4.5, "conversions": 12 }
├── created_at (timestamptz, default now())
└── INDEX on (company_id, created_at)
```

### Columnas adicionales en `scheduled_posts` (ALTER)

```text
+ strategic_dimension (text, nullable)
+ linked_gap_id (uuid, nullable)
```

### RLS

Ambas con politicas basadas en company membership (patron existente).

---

## 2. Hook: `useMarketingStrategicBridge`

Nuevo hook que conecta Marketing Hub con el SSE. Responsabilidades:

**A) Contexto estrategico para el Marketing Hub**
- Consulta gaps activos, maturity_stage, business_model, latest snapshot
- Expone `getRecommendedDimension(contentType)` que sugiere la dimension segun contexto
- Expone `getGapRecommendations()` que retorna campanas sugeridas por gap activo

**B) Impact Engine**
- `recordMarketingImpact(event)` -- persiste en `marketing_strategic_impact`
- `calculateDimensionImpact(eventType, metrics)` -- logica determinista:
  - `post_published` con engagement > 3% → Brand +1, Authority +1
  - `campaign_created` con dimension 'acquisition' → Acquisition readiness +2
  - `automation_activated` → Operations +2
  - `approval_completed` → Operations maturity +1
- Llama a `recordStrategicMemory()` y `recordScoreHistory()` del SSE existente

**C) Autopilot Maturity Gate**
- `getRecommendedAutopilotLevel(maturityStage)` retorna:
  - early → `{ mode: 'supervised', features: ['suggestions'] }`
  - growth → `{ mode: 'semi-auto', features: ['suggestions', 'partial_automation', 'optimized_approvals'] }`
  - consolidated → `{ mode: 'autonomous_optional', features: ['all', 'social_listening', 'attribution'] }`

**D) Gap-Campaign Linking**
- `getGapCampaignSuggestions(gaps, businessModel)` genera recomendaciones:
  - Gap 'positioning' → Campaña de Thought Leadership (B2B) o Brand Awareness (B2C)
  - Gap 'acquisition' → Campaña de Lead Gen (B2B) o Traffic (B2C)
  - Gap 'authority' → Campaña de Content Authority
  - Gap 'visibility' → Campaña de Social Reach
- Cada sugerencia incluye: buyer persona precargado del DNA, tono segun business model

---

## 3. Modificaciones a Componentes Existentes

### 3.1 `CampaignWizard.tsx`

- Agregar paso 0 (pre-step) o modal: **"Alineacion Estrategica"**
  - Selector de dimension estrategica (Brand / Acquisition / Authority / Operations)
  - Sugerencia automatica basada en gap mas critico
  - Si hay gap activo, mostrar: "Esta campana corrige: [gap_title]"
  - Vincular `gap_id` al `CampaignData`
- Al completar campana → llamar `recordMarketingImpact()` con dimension y gap seleccionados
- No permitir avanzar sin dimension seleccionada (validacion)

### 3.2 `MarketingHubWow.tsx` (Dashboard tab)

- Agregar seccion **"Impacto Estrategico"** en el dashboard:
  - Score antes/despues por campana reciente (de `marketing_strategic_impact`)
  - Brechas reducidas (count de gaps cerrados via marketing)
  - Dimension mas reforzada (aggregado de dimension_deltas)
  - Progress bar: "Contribucion del Marketing al SDI: X pts"
- Reemplazar metricas de vanidad con consecuencia estrategica

### 3.3 `MarketingGettingStarted.tsx`

- Al completar cada paso, llamar al SSE:
  - `connectSocial` → actualizar `capability_index` (channels) + registrar en `marketing_strategic_impact` con dimension 'acquisition'
  - `completeBrand` → dimension 'brand' + actualizar structural_risk (quitar 'no_brand_identity')
  - `importSocialData` → dimension 'operations' + habilitar score real
  - `activateAutopilot` → dimension 'operations' + actualizar maturity gate
- Cada paso llama `recordMarketingImpact()` con sdi_before/after

### 3.4 `SimpleContentPublisher.tsx`

- Al publicar contenido, agregar selector de dimension estrategica (pre-seleccionado por bridge)
- Guardar `strategic_dimension` en `scheduled_posts`
- Al confirmar publicacion → `recordMarketingImpact('post_published', ...)`

### 3.5 `SocialAutomationRules.tsx`

- Al activar una regla → `recordMarketingImpact('automation_activated', { dimension: 'operations' })`
- Al desactivar → registrar como evento negativo

### 3.6 `AutopilotDashboard.tsx`

- Mostrar nivel recomendado de autonomia segun `maturityStage`
- Si el usuario intenta activar modo autonomo en etapa 'early', mostrar warning con explicacion estrategica
- Badge visible: "Nivel recomendado: Supervisado / Semi-autonomo / Autonomo"

---

## 4. Flujo de Datos: Marketing → SSE

```text
Accion de Marketing
  → useMarketingStrategicBridge.recordMarketingImpact()
    → INSERT marketing_strategic_impact (con sdi_before, dimension, gap_id)
    → strategicStateEngine.recordStrategicMemory()
    → Si gap_id vinculado + metricas minimas alcanzadas:
        → resolveGap(gap_id)
        → Recalcular SDI
        → Crear nuevo snapshot
    → Actualizar dimension_scores en score_history
    → UI se actualiza reactivamente
```

---

## 5. Logica de Impacto Cuantificable

| Evento Marketing | Dimension | Delta SDI | Condicion |
|---|---|---|---|
| Post publicado (engagement > 3%) | Brand/Authority | +1-2 | Verificado por metricas |
| Campana creada con gap vinculado | Variable del gap | +2-3 | Gap activo |
| Campana completada + metricas min | Gap resolution | +5-8 | Cierra gap |
| Automatizacion activada | Operations | +2 | Primera activacion |
| Aprobacion completada (< 24h) | Operations | +1 | Mejora operativa |
| Red social conectada | Acquisition | +3 | Nuevo canal |
| Brand identity completado | Brand | +3 | Primer setup |
| Autopilot activado | Operations | +4 | Segun maturity gate |

---

## 6. Archivos Afectados

| Archivo | Tipo |
|---|---|
| Migracion SQL (1 tabla + ALTER) | Nuevo |
| `src/hooks/useMarketingStrategicBridge.ts` | Nuevo |
| `src/components/company/campaign/CampaignWizard.tsx` | Modificacion (alineacion estrategica) |
| `src/components/company/MarketingHubWow.tsx` | Modificacion (seccion impacto) |
| `src/components/company/MarketingGettingStarted.tsx` | Modificacion (SSE callbacks) |
| `src/components/company/SimpleContentPublisher.tsx` | Modificacion menor (dimension) |
| `src/components/company/marketing/SocialAutomationRules.tsx` | Modificacion menor |
| `src/components/company/marketing/AutopilotDashboard.tsx` | Modificacion (maturity gate) |
| `src/lib/strategicStateEngine.ts` | Sin cambios (se reutiliza) |
| `src/hooks/useStrategicControlData.ts` | Sin cambios (se reutiliza) |

---

## 7. Estimacion de Alineacion Post-Implementacion

| Dimension | Antes | Despues |
|---|---|---|
| Marketing como ejecutor del SSE | 0% (aislado) | 80% (vinculado bidireccional) |
| Impacto cuantificable marketing → SDI | 0% | 90% (cada accion mide delta) |
| Gap-Campaign linking | 0% | 85% (recomendaciones + validacion) |
| Autopilot como capa de madurez | 30% (manual) | 75% (gate automatico) |
| Onboarding → Strategic State | 10% | 80% (cada paso modifica SSE) |
| Analytics estrategico | 0% | 70% (antes/despues por campana) |

**Nivel global estimado: 78-85%** (Sistema Operativo Empresarial en consolidacion avanzada)

---

## 8. Ventaja Competitiva Defensable Nueva

- **Impact Engine propietario**: Logica determinista que traduce metricas tacticas en movimiento estrategico. No es un dashboard, es un motor de causalidad.
- **Gap-Campaign linking bidireccional**: Las brechas estrategicas generan campanas; las campanas cierran brechas. Ciclo cerrado imposible de replicar sin el SSE subyacente.
- **Maturity-gated Autopilot**: El nivel de autonomia se desbloquea por madurez estrategica real, no por configuracion manual. Esto crea un path de adopcion natural.
