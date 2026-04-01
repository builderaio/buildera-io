

# Fallas Pendientes en la Plataforma Buildera

Tras revisar el estado actual del código post-correcciones, identifico las siguientes fallas que aún persisten organizadas por prioridad.

---

## FALLAS ACTIVAS

### 1. PrivacyPolicy.tsx y TermsOfService.tsx -- i18n NO aplicado al contenido
- Se agregó `useTranslation` y `bg-background`, pero **todo el contenido sigue hardcodeado en español**
- "Volver a Inicio", "Política de Privacidad y Seguridad", "Última actualización: Enero 2025", "Términos de Servicio", etc.
- No se crearon archivos `legal.json` de traducción
- **Archivos**: `PrivacyPolicy.tsx`, `TermsOfService.tsx`

### 2. Toasts hardcodeados `title: "Error"` -- 445 instancias en 37 archivos
- La corrección masiva nunca se ejecutó
- Archivos más críticos: `SimpleContentPublisher.tsx`, `ContentCreatorHub.tsx`, `ContentLibraryTab.tsx`, `SocialConnectionManager.tsx`, `ResetPassword.tsx`, `InsightsManager.tsx`, `AgentBuilderWizard.tsx`
- Descripciones también hardcodeadas en español (ej: "No se pudo eliminar el contenido")

### 3. Console.log en producción -- 20+ instancias en CompanyDashboard.tsx
- `console.group('🔐 [CompanyDashboard] checkAuth')` y docenas de `console.log` con datos de sesión
- Expone información del usuario (user_id, email, user_type) en la consola del navegador
- **Archivo**: `CompanyDashboard.tsx`

### 4. CompleteProfile.tsx -- roles obsoletos "developer" y "expert" aún activos
- Líneas 239-241: `<SelectItem value="developer">`, `<SelectItem value="expert">`
- Ambos redirigen a `/company-dashboard` sin funcionalidad diferenciada
- Formularios de developer (GitHub, skills) y expert (industry, expertise) aún visibles
- **Archivo**: `CompleteProfile.tsx`

### 5. "Configuración" en sidebar footer apunta a "negocio" (mismo destino que "Mi Negocio")
- Línea 492 de ResponsiveLayout: `setActiveView('configuracion')` → se mapea a `negocio`
- No existe vista de configuración de cuenta/suscripción separada
- **Archivo**: `ResponsiveLayout.tsx`

### 6. Sidebar tagline "Marketing Autopilot" no refleja propuesta de valor
- Línea 221: `t('common:sidebar.platformTagline', 'Marketing Autopilot')`
- Buildera es una plataforma de "Empresa Autónoma", no solo marketing

### 7. Contacto page sin formulario real
- Solo renderiza `<FinalCTA />` -- un CTA genérico, no una página de contacto
- **Archivo**: `Contacto.tsx`

### 8. Doble checkAuth redundante
- `ResponsiveLayout.tsx` hace retry loop de 6 intentos para auth
- `CompanyDashboard.tsx` hace su propio `checkAuth()` independiente
- Puede causar race conditions y carga lenta

---

## PLAN DE CORRECCIÓN

### Paso 1: Eliminar roles obsoletos de CompleteProfile
- Remover opciones "developer" y "expert" del `<Select>`
- Auto-setear `userType = 'company'` 
- Eliminar formularios condicionales de developer/expert
- **Archivo**: `CompleteProfile.tsx`

### Paso 2: Internacionalizar contenido legal
- Crear `public/locales/[es|en|pt]/legal.json` con todo el contenido de PrivacyPolicy y TermsOfService
- Reemplazar strings hardcodeadas por claves `t('legal:...')`
- **Archivos**: `PrivacyPolicy.tsx`, `TermsOfService.tsx`, + 3 archivos i18n

### Paso 3: Reemplazar toasts hardcodeados (top 10 archivos más críticos)
- Añadir `useTranslation` donde falte
- Reemplazar `title: "Error"` por `title: t('errors:general.title')`
- Reemplazar descripciones hardcodeadas por claves de traducción
- **Archivos prioritarios**: `ResetPassword.tsx`, `ContentCreatorHub.tsx`, `SimpleContentPublisher.tsx`, `ContentLibraryTab.tsx`, `SocialConnectionManager.tsx`, `InsightsManager.tsx`, `CompanyManagementWidget.tsx`, `ContentGenerator.tsx`, `TargetAudience.tsx`, `AgentBuilderWizard.tsx`

### Paso 4: Wrappear console.logs en DEV guard
- Reemplazar `console.log(...)` y `console.group(...)` con `if (import.meta.env.DEV)` en CompanyDashboard.tsx
- **Archivo**: `CompanyDashboard.tsx`

### Paso 5: Crear vista de Configuración separada
- Crear componente `AccountSettingsView.tsx` con: suscripción, datos de cuenta, preferencias
- Actualizar mapping en `CompanyDashboard.tsx` para que `configuracion` renderice la nueva vista
- **Archivos**: nuevo `AccountSettingsView.tsx`, `CompanyDashboard.tsx`

### Paso 6: Actualizar tagline del sidebar
- Cambiar fallback de "Marketing Autopilot" a "Empresa Autónoma" o "Agentic Enterprise"
- **Archivo**: `ResponsiveLayout.tsx` + archivos i18n `common.json`

### Paso 7: Crear página de Contacto real
- Formulario con nombre, email, asunto, mensaje
- Integrar con el sistema de email interno de Buildera
- **Archivo**: `Contacto.tsx`

---

## Resumen de impacto

| Paso | Archivos | Severidad |
|---|---|---|
| 1. Roles obsoletos | 1 | Alta |
| 2. Legal i18n | 5 | Alta |
| 3. Toasts i18n | 10+ | Media |
| 4. Console.log cleanup | 1 | Media |
| 5. Vista Configuración | 2 | Media |
| 6. Tagline | 2 | Baja |
| 7. Contacto real | 1 | Baja |

