

# Integracion del Enterprise Autopilot Brain al Post-Onboarding

## Estado Actual y Gaps Identificados

### Lo que existe
1. **Onboarding**: `OnboardingOrchestrator` maneja el flujo de registro y diagnostico inicial, al completar marca `onboarding_completed_at` y dispara evento `onboarding-completed`
2. **Journey Progression**: `useJourneyProgression` define 5 pasos: Registration -> Onboarding -> Social Connected -> First Publish -> Autopilot Activated
3. **Marketing Getting Started**: `MarketingGettingStarted` muestra checklist progresivo (Level 1: social, brand, campaign... -> Level 2: guardrails, supervised, autonomous)
4. **Enterprise Autopilot Dashboard**: Existe en `/company-dashboard?view=autopilot` pero es accesible solo manualmente
5. **Department Unlocking**: `useDepartmentUnlocking` auto-crea configs en `company_department_config` pero NO esta montado en ningun componente principal (solo dentro del propio dashboard)

### Gaps Criticos para una experiencia seamless

| Gap | Impacto |
|-----|---------|
| `useDepartmentUnlocking` solo corre dentro de `EnterpriseAutopilotDashboard` - si el usuario nunca visita esa vista, nunca se desbloquean departamentos | Departamentos permanecen bloqueados |
| Journey step 5 solo se alcanza al activar `company_autopilot_config` (marketing), no contempla enterprise autopilot | Journey nunca "completa" con enterprise |
| No hay seed automatico de `autopilot_capabilities` por empresa | Dashboard muestra 0 capabilities |
| No hay transicion guiada desde el onboarding al Enterprise Autopilot | Usuario no sabe que existe |
| `BusinessHealthDashboard` (Centro de Comando) solo muestra el Marketing Autopilot status card, no el Enterprise | Enterprise invisible |
| Sidebar no tiene entrada para Enterprise Autopilot | Inaccesible sin URL directa |
| `MarketingGettingStarted` tiene step "activateAutopilot" que apunta al marketing autopilot viejo, no al enterprise | Desalineado |

---

## Plan de Implementacion

### Paso 1: Montar `useDepartmentUnlocking` en el layout principal

**Archivo**: `src/components/ResponsiveLayout.tsx`

Montar el hook a nivel de `ResponsiveLayout` (que envuelve toda la app autenticada) para que se ejecute siempre que el usuario tenga un `companyId`. Esto garantiza que los departamentos se desbloqueen automaticamente sin importar que vista este viendo el usuario.

- Importar `useDepartmentUnlocking` y `useCompanyState`
- Ejecutar el hook con `companyId` y `maturityLevel` del state
- Los toasts de "departamento desbloqueado" aparecen de forma natural en cualquier vista

### Paso 2: Seed automatico de `autopilot_capabilities` por empresa

**Archivo**: `supabase/migrations/[new].sql`

Crear una funcion SQL `seed_company_capabilities(p_company_id UUID)` que inserte las 16 capabilities predefinidas para una empresa si no existen aun. Llamarla:
- Desde `useDepartmentUnlocking` cuando se desbloquea el primer departamento
- O como trigger en la tabla `company_department_config` (ON INSERT)

Alternativa mas simple: Agregar logica en el hook `useDepartmentUnlocking` que al insertar configs de departamento, tambien inserte las capabilities correspondientes a ese departamento.

### Paso 3: Actualizar `BusinessHealthDashboard` (Centro de Comando)

**Archivo**: `src/components/company/BusinessHealthDashboard.tsx`

Reemplazar/extender el `AutopilotStatusCard` actual (que solo muestra marketing) con un `EnterpriseAutopilotStatusCard` que:
- Muestre cuantos departamentos estan activos de cuantos desbloqueados
- Muestre el IQ Score del autopilot
- Tenga un CTA prominente: "Configurar Autopilot Empresarial" que navegue a `?view=autopilot`
- Si el usuario recien completo onboarding, muestre un badge "NUEVO" con animacion

### Paso 4: Agregar entrada en el Sidebar

**Archivo**: `src/components/ResponsiveLayout.tsx` (seccion del sidebar)

Agregar un item de navegacion "Autopilot Brain" o "Cerebro Empresarial" debajo de las entradas existentes:
- Icono: Brain
- Ruta: `?view=autopilot`
- Badge: numero de departamentos activos (si > 0)
- Tooltip: maturity level actual

### Paso 5: Extender `useJourneyProgression` para enterprise

**Archivo**: `src/hooks/useJourneyProgression.ts`

Actualizar la logica de `checkAndAdvance` para considerar el enterprise autopilot:
- Step 5 ahora se alcanza si ANY departamento tiene `autopilot_enabled=true` en `company_department_config` (no solo marketing)
- Agregar un Step 6 (opcional): "Enterprise Autopilot con 3+ departamentos activos" -> marca `journey_completed_at`

### Paso 6: Post-onboarding welcome al Enterprise Autopilot

**Archivo**: Nuevo componente `src/components/company/EnterpriseAutopilotWelcome.tsx`

Crear un componente de bienvenida que se muestre una sola vez tras completar el onboarding:
- Se muestra en el `BusinessHealthDashboard` si `onboarding_completed_at` existe pero `company_department_config` esta vacio
- Explica el concepto: "Tu empresa ahora tiene un cerebro autonomo que crece contigo"
- Muestra los 6 departamentos con su estado (desbloqueados segun maturity)
- CTA principal: "Activar tu primer departamento" -> navega a `?view=autopilot`
- Se marca como vista en `user_guided_tour` o similar

### Paso 7: Actualizar `MarketingGettingStarted` Level 2

**Archivo**: `src/components/company/MarketingGettingStarted.tsx`

Actualizar el step "activateAutopilot" para que apunte al enterprise autopilot en vez del marketing-only:
- Cambiar la accion de `onNavigateTab("autopilot")` a `navigate("/company-dashboard?view=autopilot")`
- Agregar un nuevo step en Level 2: "Explorar Cerebro Empresarial" que lleve al Enterprise Dashboard

### Paso 8: i18n completo

**Archivos**: `public/locales/[es|en|pt]/common.json`

Agregar todas las cadenas nuevas:
- `enterprise.welcome.title`: "Tu Cerebro Empresarial esta listo"
- `enterprise.welcome.description`: "A medida que tu negocio crece..."
- `enterprise.welcome.cta`: "Explorar Autopilot Empresarial"
- `sidebar.enterpriseBrain`: "Cerebro Empresarial"
- Y demas cadenas para el componente de bienvenida

---

## Flujo Post-Onboarding Resultante

```text
ONBOARDING COMPLETO
        |
        v
BUSINESS HEALTH DASHBOARD
  - Enterprise Welcome Card (primera vez)
  - Enterprise Status Card (permanente)
  - Sidebar: "Cerebro Empresarial" visible
        |
        v
USUARIO VISITA ENTERPRISE AUTOPILOT
  - Departamentos auto-desbloqueados segun maturity
  - Capabilities seeded para su empresa
  - Puede activar departamentos con toggle
        |
        v
EMPRESA CRECE (mas datos, mas ejecuciones)
  - Maturity sube automaticamente
  - Nuevos departamentos se desbloquean (toast)
  - Nuevas capabilities se activan
  - Journey progression avanza
```

---

## Secuencia de Implementacion

| Orden | Paso | Prioridad |
|-------|------|-----------|
| 1 | Montar `useDepartmentUnlocking` en layout principal | Alta |
| 2 | Seed de capabilities al crear departamento | Alta |
| 3 | Sidebar: entrada de navegacion al Enterprise Autopilot | Alta |
| 4 | Enterprise Status Card en Centro de Comando | Alta |
| 5 | Extender `useJourneyProgression` | Media |
| 6 | Enterprise Welcome post-onboarding | Media |
| 7 | Actualizar `MarketingGettingStarted` | Baja |
| 8 | i18n completo ES/EN/PT | Baja |

