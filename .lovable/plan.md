

# Plan Estrategico de Optimizacion de Edge Functions

## Resumen Ejecutivo

El proyecto tiene **95 Edge Functions** desplegadas. El analisis cruzado entre invocaciones en `src/` y llamadas internas (edge-to-edge) revela oportunidades claras de eliminacion, fusion y redireccionamiento. El objetivo es liberar slots para nuevas funciones (social-automation-engine, social-listening-engine, slideshow-generator) y reducir complejidad operativa.

---

## Categoria 1: ELIMINAR (Zero Usage / Obsoletas)

Funciones sin ninguna invocacion activa en frontend ni backend:

| Funcion | Razon | Riesgo |
|---------|-------|--------|
| `execute-workforce-mission` | Sistema AI Workforce decomisionado. Zero refs en `src/`. Solo llama a `create-response-agent` internamente. | Ninguno |
| `generate-analytics-data` | Zero refs en `src/`. Genera datos mock en `system_analytics`. No invocado por nada. | Ninguno |
| `sync-api-usage` | Zero refs en `src/`. La funcion `getDecryptedApiKey()` retorna `null` siempre -- produce datos random. Inutil. | Ninguno |
| `social-tags-resolver` | Zero refs en `src/`. Usa RapidAPI Instagram Statistics para tags. Nunca se consume. | Ninguno |
| `social-media-bulk-processor` | Zero refs en `src/`. Solo invocado internamente por si mismo para `content-embeddings-generator`. Flujo sin trigger. | Ninguno |

**Total a eliminar: 5 funciones**

---

## Categoria 2: FUSIONAR (Redundancia Funcional)

### 2a. `marketing-autopilot-engine` -> absorber en `enterprise-autopilot-engine`

- `marketing-autopilot-engine` es un thin wrapper que solo hace `fetch()` a `enterprise-autopilot-engine` con `department=marketing`
- Tiene **1 invocacion** en `AutopilotDashboard.tsx`
- **Accion**: Cambiar la invocacion en `AutopilotDashboard.tsx` de `marketing-autopilot-engine` a `enterprise-autopilot-engine` con `{ department: 'marketing' }`. Eliminar la funcion wrapper.

### 2b. `content-insights-analyzer` vs `content-insights-generator`

- `content-insights-analyzer`: 1 invocacion en `AdvancedMarketingDashboard.tsx`
- `content-insights-generator`: 4+ invocaciones activas (ContentCreatorHub, SimpleContentPublisher, etc.)
- Ambas hacen analisis de contenido con OpenAI
- **Accion**: Migrar la unica invocacion de `content-insights-analyzer` hacia `content-insights-generator` anadiendo un parametro `mode: 'cross_platform_analysis'`. Eliminar `content-insights-analyzer`.

**Total a fusionar/eliminar: 2 funciones adicionales**

---

## Categoria 3: MANTENER (Con Uso Activo Verificado)

Funciones con invocaciones activas confirmadas que **no se tocan**:

| Grupo | Funciones |
|-------|-----------|
| **Core Social** | `upload-post-manager`, `advanced-social-analyzer`, `analyze-social-audience`, `analyze-social-content`, `analyze-social-activity`, `analyze-social-retrospective` |
| **Scrapers** | `linkedin-scraper`, `instagram-scraper`, `facebook-scraper`, `tiktok-scraper` |
| **Intelligent Analysis** | `linkedin-intelligent-analysis`, `instagram-intelligent-analysis`, `facebook-intelligent-analysis`, `tiktok-intelligent-analysis` |
| **AI Core** | `universal-ai-handler`, `ai-provider-handler`, `openai-responses-handler`, `agent-sdk-executor` |
| **Marketing Hub** | `marketing-hub-post-creator`, `marketing-hub-image-creator`, `marketing-hub-video-creator`, `marketing-hub-reel-creator`, `marketing-hub-content-calendar`, `marketing-hub-marketing-strategy` |
| **Content** | `generate-company-content`, `content-insights-generator`, `content-embeddings-generator` |
| **Strategy/DNA** | `company-strategy`, `brand-identity`, `generate-business-objectives`, `manage-company-objectives`, `company-info-extractor` |
| **Auth** | `webauthn-*` (4), `facebook-instagram-auth`, `linkedin-oauth-callback`, `tiktok-auth` |
| **Email** | `send-buildera-email`, `send-verification-email`, `send-password-reset-email`, `process-inbound-email`, `send-company-invitation`, `accept-company-invitation` |
| **Admin** | `fetch-available-models`, `ai-model-monitoring`, `run-champion-challenge`, `sandbox-agent-executor`, `check-subscription-status` |
| **Misc Active** | `translate-content`, `analyze-competitors`, `analyze-single-competitor`, `competitive-intelligence-agent`, `era-chat`, `era-content-optimizer`, `era-campaign-optimizer`, `ai-audience-generator`, `ai-learning-tutor`, `premium-ai-insights`, `semantic-content-analyzer`, `calculate-social-analytics`, `calculate-dashboard-metrics`, `download-content-asset`, `get-upload-post-analytics`, `audience-intelligence-analysis`, `create-company-agent`, `company-agent-chat`, `create-response-agent`, `execute-n8n-agent`, `onboarding-agent-orchestrator`, `delete-user`, `creatify-proxy`, `smart-link-manager`, `create-subscription-checkout`, `handle-subscription-webhook`, `advanced-content-analyzer`, `generate-next-best-actions` |
| **Autopilot** | `enterprise-autopilot-engine`, `marketing-diagnostic-loop` |

---

## Categoria 4: PENDIENTES DE DEPLOY (Requieren Slots)

Estas 3 funciones estan escritas pero **no se pudieron desplegar** por limite:

| Funcion | Estado |
|---------|--------|
| `social-automation-engine` | Codigo listo, no deployado |
| `social-listening-engine` | Codigo listo, no deployado |
| `slideshow-generator` | Codigo listo, no integrado en UI aun |

---

## Plan de Ejecucion

### Paso 1: Eliminar 5 funciones obsoletas
- Borrar directorios de: `execute-workforce-mission`, `generate-analytics-data`, `sync-api-usage`, `social-tags-resolver`, `social-media-bulk-processor`
- Eliminar sus entradas de `supabase/config.toml`
- Llamar `delete_edge_functions` para removerlas del deploy

### Paso 2: Fusionar `marketing-autopilot-engine`
- En `AutopilotDashboard.tsx`: cambiar invoke de `marketing-autopilot-engine` a `enterprise-autopilot-engine` con `{ company_id, department: 'marketing' }`
- Borrar directorio y config de `marketing-autopilot-engine`

### Paso 3: Fusionar `content-insights-analyzer`
- En `AdvancedMarketingDashboard.tsx`: cambiar invoke a `content-insights-generator` con parametro adicional `mode: 'cross_platform'`
- Agregar handling del modo `cross_platform` en `content-insights-generator` si no existe
- Borrar directorio y config de `content-insights-analyzer`

### Paso 4: Desplegar funciones pendientes
- Con los 7 slots liberados, deployar: `social-automation-engine`, `social-listening-engine`, `slideshow-generator`

---

## Resultado Esperado

| Metrica | Antes | Despues |
|---------|-------|---------|
| Total Edge Functions | 95 | 88 |
| Funciones sin uso | 7 | 0 |
| Slots libres para nuevas | 0 | 4+ |
| Funciones Autopilot deployadas | 1 | 4 |

