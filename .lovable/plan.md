

# Simplificacion Estructural Post-Onboarding: De Dashboard Complejo a Flujo Guiado

## Problema Diagnosticado

Despues del onboarding (que funciona bien), el usuario aterriza en un dashboard empresarial completo con:
- 9 items en el sidebar (Panel, Marketing Hub, Ventas/CRM, Cerebro Empresarial, Gobernanza, Departamentos, Activacion, Agentes IA, Mi Negocio)
- KPIs vacios (todo en cero)
- Tarjetas de "Cerebro Empresarial" sin contexto
- Sin guia clara de que hacer primero
- Los prerequisitos nunca se solicitan proactivamente

El usuario ve una plataforma "enterprise-grade" vacia y no sabe como empezar. La promesa del homepage ("Diagnostico -> ADN -> Autopilot") se rompe en el dashboard.

## Solucion: Guided Activation Flow

### Cambio 1: Post-Onboarding Wizard (nuevo componente)
Crear `PostOnboardingActivationWizard` - un flujo guiado de 3 pasos que aparece como vista principal cuando el usuario llega al dashboard por primera vez despues del onboarding:

```text
Paso 1: "Conecta tus redes sociales"
  - Mostrar botones de LinkedIn, Instagram, Facebook, TikTok
  - Boton "Omitir por ahora"

Paso 2: "Configura tu marca"  
  - Colores, tono de voz (simplificado)
  - Boton "Generar con IA" usando datos del diagnostico
  - Boton "Omitir por ahora"

Paso 3: "Activa tu primer departamento"
  - Tarjeta de Marketing con toggle ON/OFF
  - Explicacion simple: "Buildera creara y publicara contenido por ti"
  - CTA: "Activar Marketing Autopilot"
```

### Cambio 2: Sidebar Progresivo
Modificar `ResponsiveLayout.tsx` para mostrar el sidebar de forma progresiva segun el journey_current_step:

- **Step 1-2 (nuevo usuario)**: Solo mostrar 3 items: Centro de Comando, Mi Negocio, Marketing Hub
- **Step 3 (redes conectadas)**: Agregar Agentes IA
- **Step 4+ (contenido creado)**: Agregar Cerebro Empresarial, Gobernanza
- **Step 5 (autopilot activo)**: Mostrar todo (Ventas/CRM, Departamentos, Activacion)

### Cambio 3: Dashboard Simplificado para Nuevos Usuarios
Modificar `BusinessHealthDashboard.tsx` para detectar usuarios nuevos (sin actividad) y mostrar una vista simplificada:

- Reemplazar KPIs vacios con una tarjeta hero: "Tu negocio esta listo. Sigue estos 3 pasos para activar la automatizacion."
- Mostrar el checklist de activacion como elemento principal (no como widget secundario)
- Ocultar secciones de "Actividad Reciente" y "Quick Agents" si estan vacias

### Cambio 4: Prerequisitos Proactivos
Modificar el flujo para que cuando el usuario intente navegar a "Cerebro Empresarial" o "Autopilot" sin prerequisitos, se muestre un modal/banner claro indicando que falta y con CTAs directos para completar cada item.

## Detalle Tecnico

### Archivos a crear:
1. `src/components/onboarding/PostOnboardingActivationWizard.tsx` - Wizard de 3 pasos post-onboarding

### Archivos a modificar:
1. `src/components/ResponsiveLayout.tsx` - Sidebar progresivo basado en journey_current_step
2. `src/components/company/BusinessHealthDashboard.tsx` - Vista simplificada para nuevos usuarios
3. `src/pages/CompanyDashboard.tsx` - Integrar el wizard post-onboarding como vista
4. `public/locales/es/common.json` - Traducciones ES
5. `public/locales/en/common.json` - Traducciones EN
6. `public/locales/pt/common.json` - Traducciones PT

### Logica del Sidebar Progresivo:

```text
sidebarItems filtrados por:

if (journeyStep <= 2) {
  Mostrar: panel, marketing-hub, negocio
}
else if (journeyStep === 3) {
  Agregar: agentes
}
else if (journeyStep === 4) {
  Agregar: autopilot, gobernanza
}
else {
  Mostrar todo (9 items)
}
```

### Logica del Dashboard para Nuevos Usuarios:

```text
const isNewUser = recentActivity.length === 0 
  && enabledAgentIds.length === 0 
  && !deptConfigs.some(d => d.autopilot_enabled);

if (isNewUser) {
  Renderizar vista de activacion guiada
} else {
  Renderizar dashboard completo actual
}
```

### Flujo del PostOnboardingActivationWizard:

El wizard se mostrara como vista `activation-wizard` en el CompanyDashboard. Se activara automaticamente cuando:
- `onboarding_completed_at` existe
- `journey_current_step <= 2`
- No hay redes sociales conectadas NI autopilot activo

Cada paso completado avanza el `journey_current_step` via `useJourneyProgression`.

Al completar o saltar todos los pasos, redirige al dashboard normal con la vista simplificada que muestra el progreso restante.

### Impacto en la Experiencia:

```text
ANTES:
Onboarding OK -> Dashboard vacio con 9 menus -> Usuario perdido -> Abandono

DESPUES:
Onboarding OK -> Wizard 3 pasos (conectar, marca, activar) -> Dashboard con 3 menus
  -> A medida que avanza, se desbloquean mas secciones
  -> Siempre hay un "siguiente paso" claro
```

