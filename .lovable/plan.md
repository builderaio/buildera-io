

# Validacion Integral de Flujos Funcionales - Buildera

## Resumen Ejecutivo

Tras una revision exhaustiva del codigo fuente, base de datos, funciones RPC, edge functions y configuraciones, se identificaron **14 problemas** que afectan el funcionamiento correcto de la plataforma. A continuacion se presenta cada hallazgo con su solucion propuesta.

---

## Problemas Identificados y Soluciones

### 1. Error de Build: `pushManager` no existe en TypeScript
**Archivo:** `src/hooks/usePushNotifications.ts`
**Severidad:** CRITICA (bloquea el build)
**Problema:** TypeScript no reconoce `pushManager` en `ServiceWorkerRegistration` porque falta el tipo `WebWorker` en la configuracion.
**Solucion:** Agregar un cast `as any` en las 3 lineas afectadas (59, 124, 185) para evitar el error de tipos sin cambiar funcionalidad.

---

### 2. `supabase/config.toml` sin configuracion de Edge Functions
**Archivo:** `supabase/config.toml`
**Severidad:** ALTA
**Problema:** El archivo solo contiene `project_id`. Se eliminaron todas las configuraciones de `[functions.*]` (verify_jwt, etc.) en el ultimo diff. Esto puede causar que funciones que necesitan bypass de JWT no funcionen correctamente.
**Solucion:** Restaurar las configuraciones de `verify_jwt` para las edge functions que lo requieren (sandbox-agent-executor, analyze-competitors, translate-content, openai-responses-handler con `verify_jwt = false`, y las demas con `verify_jwt = true`).

---

### 3. Registro (CompanyAuth): Sitio web obligatorio contradice el flujo de Founder Journey
**Archivo:** `src/components/auth/CompanyAuth.tsx` (lineas 70-78)
**Severidad:** ALTA
**Problema:** En el formulario de registro, `websiteUrl` se valida como **obligatorio** para TODOS los usuarios empresa. Sin embargo, el Founder Journey (nuevo negocio sin sitio web) fue disenado especificamente para usuarios sin website. Un usuario nuevo no puede registrarse sin sitio web.
**Solucion:** Hacer el campo `websiteUrl` opcional en el registro de CompanyAuth, removiendo la validacion obligatoria.

---

### 4. CompleteProfile: Sitio web obligatorio para tipo "company"
**Archivo:** `src/pages/CompleteProfile.tsx` (linea 366)
**Severidad:** ALTA
**Problema:** El campo `websiteUrl` tiene `required` para usuarios tipo company, bloqueando a fundadores sin sitio web.
**Solucion:** Eliminar el atributo `required` del campo website en CompleteProfile para usuarios company.

---

### 5. `delete_company_cascade` no elimina ~20 tablas con `company_id`
**Severidad:** ALTA
**Problema:** La funcion RPC `delete_company_cascade` solo elimina datos de ~15 tablas, pero existen ~45 tablas con columna `company_id`. Faltan tablas criticas como:
- `company_play_to_win`, `company_ptw_reviews`
- `company_products`, `company_parameters`, `company_current_parameters`
- `company_objectives`, `company_objective_progress`
- `company_marketing_goals`, `marketing_campaigns`, `marketing_strategies`
- `competitive_intelligence`, `crm_*` (accounts, contacts, deals, pipelines, tags, activities, custom_fields)
- `content_calendar_items`, `content_library`, `content_insights`, `content_clusters`
- `social_accounts`, `social_*_analysis`
- `onboarding_wow_results`, `push_subscriptions`
- `journey_definitions`, `journey_enrollments`
- `whitelabel_deployments`, `whitelabel_reviews`
- `company_platform_settings`, `company_schedule_config`, `company_external_data`
- `revenue_tracking`

**Solucion:** Crear una migracion SQL que reemplace `delete_company_cascade` con una version completa que elimine todas las tablas con `company_id`.

---

### 6. `agent-sdk-executor`: Referencia a tabla `company_credits` que no existe
**Archivo:** `supabase/functions/agent-sdk-executor/index.ts` (linea 78)
**Severidad:** MEDIA
**Problema:** La funcion consulta `company_credits` y llama `deduct_company_credits` RPC, pero ninguna de estas existe en la base de datos. La ejecucion de agentes con creditos siempre fallara.
**Solucion:** Crear la tabla `company_credits` y la funcion RPC `deduct_company_credits`, o eliminar la logica de creditos temporalmente hasta que se implemente el sistema de facturacion.

---

### 7. AdminDashboard: `get_admin_recent_activity` puede fallar silenciosamente
**Archivo:** `src/pages/AdminDashboard.tsx` (linea 106)
**Severidad:** MEDIA
**Problema:** La llamada a `supabase.rpc('get_admin_recent_activity')` se incluye en el `Promise.all` pero no se verifica si la funcion existe o retorna datos validos. Si falla, puede bloquear la carga de todo el dashboard.
**Solucion:** Mover la llamada fuera del `Promise.all` principal y manejar su error de forma independiente.

---

### 8. OnboardingOrchestrator: Logica de bifurcacion incompleta para empresas existentes con website
**Archivo:** `src/components/OnboardingOrchestrator.tsx` (lineas 80-94)
**Severidad:** MEDIA
**Problema:** En la verificacion inicial (linea 80), si `journey_type` es `existing_business` y la empresa tiene nombre y website, se salta directamente al `startExtraction` sin verificar si la extraccion ya fue completada. Esto puede causar re-ejecuciones innecesarias del diagnostico.
**Solucion:** Agregar verificacion de `onboarding_wow_results` antes de re-ejecutar la extraccion.

---

### 9. Hardcoded strings en Auth y multiples componentes
**Archivos:** `src/pages/Auth.tsx`, `src/components/auth/CompanyAuth.tsx`, `src/pages/CompleteProfile.tsx`
**Severidad:** MEDIA (viola requisito de i18n)
**Problema:** Multiples textos en espanol estan hardcodeados sin usar el sistema i18n, violando la directriz de internacionalizacion obligatoria. Ejemplos: "Volver al Inicio", "Iniciar Sesion", "Registrarse", "Nombre del contacto", "El nombre es requerido", etc.
**Solucion:** Reemplazar todos los strings hardcodeados con claves de traduccion usando `t()` y agregar las traducciones correspondientes en los 3 idiomas (ES, EN, PT).

---

### 10. `delete-user` edge function no elimina todas las tablas
**Archivo:** `supabase/functions/delete-user/index.ts`
**Severidad:** MEDIA
**Problema:** Similar al problema de `delete_company_cascade`, la funcion de eliminacion de usuario solo cubre un subconjunto de tablas. Faltan tablas como `company_play_to_win`, `marketing_campaigns`, CRM, etc.
**Solucion:** Actualizar la funcion para cubrir todas las tablas que referencian `user_id`.

---

### 11. AuthenticatedLayout redirect infinito para company users
**Archivo:** `src/components/AuthenticatedLayout.tsx` (linea 139)
**Severidad:** MEDIA
**Problema:** Si un usuario company accede via una ruta que usa AuthenticatedLayout como wrapper, se ejecuta `window.location.href = '/company-dashboard'` lo cual puede causar un redirect loop ya que CompanyDashboard esta dentro de `<ResponsiveLayout />` no `AuthenticatedLayout`.
**Solucion:** Este codigo es legacy y el redirect puede ser removido ya que las rutas company usan ResponsiveLayout directamente.

---

### 12. FounderPTWSimplified: `onComplete` navega a ruta inexistente
**Archivo:** `src/components/strategy/founder/FounderPTWSimplified.tsx` (linea 100)
**Severidad:** BAJA
**Problema:** `handleGoToDashboard` navega a `?view=comando` pero el CompanyDashboard no tiene un case para "comando", lo que mostraria el default (BusinessHealthDashboard). Funciona pero semanticamente es incorrecto.
**Solucion:** Cambiar a `?view=mando-central` que es el case correcto.

---

### 13. Falta tabla `company_credits` para sistema de creditos de agentes
**Severidad:** MEDIA
**Problema:** El `agent-sdk-executor` y el modelo de negocio de Buildera dependen de un sistema de creditos por agente, pero la tabla `company_credits` y la funcion `deduct_company_credits` no existen en la base de datos.
**Solucion:** Crear la tabla y la funcion RPC correspondiente o deshabilitar temporalmente la verificacion de creditos.

---

### 14. `company_dashboard_metrics` se elimina por `user_id` en cascade pero tabla puede tener `company_id`
**Severidad:** BAJA
**Problema:** En `delete_company_cascade`, la linea `DELETE FROM company_dashboard_metrics WHERE user_id = ANY(member_user_ids)` usa `user_id` pero la tabla podria tener un `company_id` directo.
**Solucion:** Verificar esquema y usar la columna correcta.

---

## Plan de Implementacion

### Fase 1: Correccion Critica (Build + Bloqueos)
1. Fix build error de `pushManager` en `usePushNotifications.ts`
2. Hacer `websiteUrl` opcional en `CompanyAuth.tsx` y `CompleteProfile.tsx`
3. Restaurar `config.toml` con configuraciones de edge functions

### Fase 2: Integridad de Datos (Admin Portal)
4. Actualizar `delete_company_cascade` para cubrir TODAS las tablas con `company_id` (~45 tablas)
5. Actualizar `delete-user` edge function para cubrir todas las tablas con `user_id`
6. Separar `get_admin_recent_activity` del `Promise.all` en AdminDashboard

### Fase 3: Logica de Negocio
7. Crear tabla `company_credits` y funcion `deduct_company_credits` (o deshabilitar verificacion)
8. Fix ruta "comando" -> "mando-central" en FounderPTW
9. Fix logica de re-extraccion en OnboardingOrchestrator

### Fase 4: Internacionalizacion
10. Reemplazar hardcoded strings con claves i18n en Auth, CompanyAuth, CompleteProfile

---

## Detalles Tecnicos

### Migracion SQL para `delete_company_cascade` (tablas faltantes)
Se agregaran DELETE statements para las siguientes tablas adicionales:
- `company_play_to_win`, `company_ptw_reviews`, `company_products`
- `company_parameters`, `company_current_parameters`
- `company_objectives`, `company_objective_progress`
- `company_marketing_goals`, `marketing_campaigns`
- `competitive_intelligence`, `competitor_profiles`
- `content_calendar_items`, `content_library`, `content_insights`, `content_clusters`, `content_embeddings`
- `crm_pipelines` (y dependientes: `crm_pipeline_stages`, `crm_deals`, `crm_activities`, `crm_contacts`, `crm_accounts`, `crm_tags`, `crm_custom_fields`)
- `social_accounts`, `social_activity_analysis`, `social_analysis`, `social_content_analysis`, `social_retrospective_analysis`
- `onboarding_wow_results`, `push_subscriptions`
- `journey_steps` y `journey_step_executions` (dependientes de `journey_definitions`)
- `journey_enrollments`, `journey_definitions`
- `whitelabel_deployments`, `whitelabel_reviews`
- `company_platform_settings`, `company_schedule_config`, `company_external_data`
- `revenue_tracking`, `company_files`, `generated_content`, `generated_assets`
- `marketing_strategies`, `marketing_insights`, `marketing_actionables`
- `scheduled_posts`, `scheduled_social_posts`

### Fix `usePushNotifications.ts`
```typescript
const registration = await navigator.serviceWorker.ready;
const subscription = await (registration as any).pushManager.getSubscription();
```

### Fix `CompanyAuth.tsx` - Remover validacion obligatoria de website
Se eliminan las lineas 70-78 que bloquean el registro sin sitio web.

