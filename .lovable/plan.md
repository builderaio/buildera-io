

# Auditoria del Journey del Cliente: Registro hasta Marketing Autopilot

## Mapa Completo del Journey Actual

```text
FASE 1: REGISTRO
=================
Landing (/) --> Auth (/auth) --> CompanyAuth (signup)
  - Campos: nombre, empresa, website (opcional), pais, email, password
  - OAuth: Google, LinkedIn
  - Resultado: usuario creado en auth.users con metadata
  - Email de verificacion enviado automaticamente por Supabase

FASE 2: VERIFICACION EMAIL
============================
Email link --> EmailVerificationHandler (/auth/verify-email/:token)
  - Verifica OTP con Supabase
  - Envia email de bienvenida (sistema interno)
  - Redirige a: /company-dashboard?view=adn-empresa&first_login=true
  [PROBLEMA: redirige a adn-empresa en vez de onboarding]

OAuth callback --> SocialCallback (/auth/social-callback)
  - Detecta user_type de URL params
  - Redirige a: /complete-profile?user_type=company

FASE 3: COMPLETE PROFILE
==========================
CompleteProfile (/complete-profile)
  - Pide: nombre, tipo usuario, datos empresa
  - Crea perfil en tabla profiles
  - Crea empresa via RPC create_company_with_owner
  - Marca first_login_completed en user_onboarding_status
  - Redirige a: /company-dashboard?view=onboarding&first_login=true

FASE 4: ONBOARDING ORCHESTRATOR
=================================
CompanyDashboard detecta view=onboarding --> OnboardingOrchestrator
  
  Sub-fases:
  4a. checking: Verifica si empresa existe y tiene journey_type
  4b. journey-selection: JourneySelector (nuevo negocio vs existente)
  4c. form: Captura nombre empresa + website
  4d. loading: OnboardingWowLoader (barra de progreso ~3 min)
  4e. results: OnboardingWowResults (diagnostico ejecutivo)

  Bifurcacion:
  - NUEVO NEGOCIO sin web: Salta diagnostico --> founder-ptw
  - NUEVO NEGOCIO con web: Diagnostico N8N --> founder-ptw
  - NEGOCIO EXISTENTE: Diagnostico N8N --> mando-central (comando)

FASE 5: POST-ONBOARDING
=========================
  A) FounderPTWSimplified (3 pasos):
     1. Aspiracion (vision de exito a 1 anho)
     2. Cliente ideal
     3. Diferenciador
     --> Redirige a mando-central

  B) BusinessHealthDashboard (mando-central):
     - KPIs, objetivos, NBAs, agentes sugeridos
     - Desde aqui el usuario navega al Marketing Hub

FASE 6: DIA A DIA - MARKETING HUB
====================================
MarketingHubWow - 11 tabs:
  1. Dashboard (Getting Started + metricas)
  2. Crear (Post Rapido, Campanha, Estudio Creativo)
  3. Campanas
  4. Calendario
  5. Biblioteca (contenido unificado)
  6. Listening (Social Listening)
  7. Attribution (UTM Dashboard)
  8. Reports (PDF export)
  9. Automation (Social rules)
  10. Approvals (flujo revision)
  11. Autopilot (Marketing Autopilot Engine)

FASE 7: AUTOPILOT
====================
AutopilotDashboard:
  - Toggle ON/OFF
  - Configuracion (frecuencia, limites, guardrails)
  - Timeline de ejecuciones
  - Decisiones del ciclo SENSE-THINK-ACT-GUARD-LEARN
```

---

## Problemas y Gaps Detectados

### 1. Ruta de verificacion de email inconsistente
**Archivo**: `EmailVerificationHandler.tsx` linea 61
**Problema**: Redirige a `?view=adn-empresa&first_login=true` en vez de `?view=onboarding&first_login=true`. El usuario que se registra por email llega a una pantalla de configuracion de negocio sin pasar por el onboarding orquestado.
**Impacto**: El usuario pierde el JourneySelector y el diagnostico WOW.

### 2. Duplicacion de captura de datos empresa
**Problema**: Los datos de empresa se piden en 3 lugares distintos:
- `CompanyAuth.tsx` signup (companyName, websiteUrl)
- `CompleteProfile.tsx` (companyName, websiteUrl de nuevo)
- `OnboardingOrchestrator.tsx` form phase (name, website_url, industry_sector)

El usuario escribe el nombre de su empresa hasta 3 veces. Solo el onboarding orchestrator usa los datos del signup metadata para pre-llenar, pero CompleteProfile no los pasa.

### 3. No hay conexion entre onboarding y autopilot activation
**Problema**: Despues del onboarding (diagnostico o PTW), el usuario llega al dashboard sin ninguna sugerencia de activar el Autopilot. El Getting Started widget (`MarketingGettingStarted.tsx`) tiene 5 pasos (conectar redes, branding, campanha, video, post) pero ninguno menciona el Autopilot.
**Impacto**: La funcionalidad mas poderosa de la plataforma queda enterrada en el tab 11 de 11.

### 4. Autopilot sin pre-configuracion inteligente
**Problema**: Cuando el usuario activa el Autopilot, empieza con config vacia. No hereda:
- Los guardrails de `company_communication_settings` (forbidden_words, tono)
- Los datos del diagnostico onboarding (fortalezas, debilidades, plan de accion)
- Las audiencias detectadas en `company_audiences`
- La estrategia PTW (aspiracion, diferenciador, cliente ideal)
**Impacto**: El usuario tiene que configurar manualmente lo que la plataforma ya sabe.

### 5. Getting Started no evoluciona
**Problema**: `MarketingGettingStarted.tsx` es estatico: 5 pasos hardcoded. No hay un "nivel 2" que guie hacia automatizacion despues de completar lo basico. Una vez el usuario completa los 5 pasos, el widget desaparece (`if (progress === 100) return null`).

### 6. Journey step no avanza mas alla de 2
**Problema**: `journey_current_step` se pone a 2 al completar onboarding. No hay logica que lo incremente a 3 (conexion redes), 4 (primer contenido), 5 (autopilot activo). Este campo no se usa para nada despues.

### 7. Texto hardcoded en espanol
**Archivos**: `CompleteProfile.tsx`, `EmailVerificationHandler.tsx`, `Auth.tsx` (parcial)
**Problema**: Multiples strings en espanol sin i18n, violando la politica de internacionalizacion obligatoria.

---

## Plan de Mejora Propuesto

### Paso 1: Corregir ruta de verificacion email
Cambiar `EmailVerificationHandler.tsx` para redirigir a `?view=onboarding&first_login=true` en lugar de `?view=adn-empresa`.

### Paso 2: Eliminar duplicacion de datos
Hacer que `CompleteProfile.tsx` pre-llene company name y website desde `user_metadata` del signup, y que `OnboardingOrchestrator` tambien use esos datos para no repetir el formulario.

### Paso 3: Smart Autopilot Onboarding
Agregar un paso 6 al Getting Started: "Activar Marketing Autopilot". Cuando el usuario lo activa, pre-configurar automaticamente:
- `brand_guardrails` desde `company_communication_settings`
- `allowed_actions` basadas en el diagnostico (si tiene redes conectadas: publish; si no: solo create_content)
- `active_hours` con horarios por defecto segun el pais del registro
- Contexto estrategico del PTW para alimentar el ciclo THINK

### Paso 4: Journey progression automatica
Implementar logica que actualice `journey_current_step` conforme el usuario avanza:
- Step 1: Registro completado
- Step 2: Onboarding/diagnostico completado
- Step 3: Primera red social conectada
- Step 4: Primer contenido publicado
- Step 5: Autopilot activado

### Paso 5: Getting Started v2 (progresivo)
Despues de completar los 5 pasos basicos, mostrar un segundo nivel de Getting Started enfocado en automatizacion:
- Configurar guardrails de marca
- Activar Autopilot en modo supervisado (require_human_approval=true)
- Revisar primeras decisiones del Autopilot
- Graduarse a modo autonomo

### Paso 6: i18n de pantallas pendientes
Internacionalizar `CompleteProfile.tsx` y `EmailVerificationHandler.tsx` con claves en ES/EN/PT.

---

## Secuencia de Implementacion

| Paso | Cambio | Archivos |
|------|--------|----------|
| 1 | Fix redirect verificacion email | EmailVerificationHandler.tsx |
| 2 | Pre-llenar datos en CompleteProfile y Orchestrator | CompleteProfile.tsx, OnboardingOrchestrator.tsx |
| 3 | Agregar "Activar Autopilot" al Getting Started | MarketingGettingStarted.tsx |
| 4 | Smart pre-config del Autopilot al activarlo | AutopilotDashboard.tsx |
| 5 | Journey step progression automatica | Nueva logica en hooks/edge function |
| 6 | Getting Started v2 (nivel avanzado) | MarketingGettingStarted.tsx |
| 7 | i18n de CompleteProfile y EmailVerificationHandler | Ambos archivos + locales ES/EN/PT |

