
# Simplificación Estructural Post-Onboarding — IMPLEMENTADO ✅

## Cambios realizados

### ✅ Cambio 1: PostOnboardingActivationWizard
- `src/components/onboarding/PostOnboardingActivationWizard.tsx` — Wizard de 3 pasos (redes sociales, marca, autopilot)
- Se muestra automáticamente cuando `journey_current_step <= 2` después del onboarding

### ✅ Cambio 2: Sidebar Progresivo
- `src/components/ResponsiveLayout.tsx` — Items filtrados por `minStep` basado en `journey_current_step`
- Step 1-2: Panel, Marketing Hub, Mi Negocio
- Step 3: + Agentes IA
- Step 4: + Cerebro Empresarial, Gobernanza
- Step 5: Todo (Ventas, Departamentos, Activación)

### ✅ Cambio 3: Dashboard Simplificado para Nuevos Usuarios
- `src/components/company/BusinessHealthDashboard.tsx` — Detecta `isNewUser` y muestra vista de activación guiada con hero card + checklist

### ✅ Cambio 4: Auto-redirect + Integración
- `src/pages/CompanyDashboard.tsx` — Redirige automáticamente a `activation-wizard` para usuarios con `journey_current_step <= 2`
- i18n completo en ES/EN/PT

## Pendiente (futuro)
- Cambio 4 del plan original: Prerequisitos proactivos (modal/banner al navegar a secciones sin prerequisitos)
