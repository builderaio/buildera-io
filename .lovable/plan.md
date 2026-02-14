
# Fix: Flujo de usuarios nuevos - ADN de empresa como paso obligatorio

## Problema identificado

El flujo actual para **nuevos negocios** (Founder Journey) tiene dos fallos criticos:

1. **Onboarding marcado como completo prematuramente**: `completeOnboardingAndRedirectToPTW` marca `dna_empresarial_completed: true` ANTES de que el usuario configure su ADN de empresa (marca, canales, productos, etc.)
2. **Se salta el ADN por completo**: Despues del PTW Simplificado (3 pasos de estrategia), el usuario va directo al Dashboard sin pasar por la configuracion de negocio, que es prerequisito para el Autopilot

### Flujo actual (incorrecto)
```text
Journey Selection -> Form (nombre) -> Onboarding COMPLETO -> Founder PTW -> Dashboard
                                      ^^^^^^^^^^^^^^^^^
                                      Se marca completo sin ADN
```

### Flujo propuesto (correcto)
```text
Journey Selection -> Form (nombre) -> Founder PTW -> ADN de Empresa -> Onboarding COMPLETO -> Dashboard
```

---

## Cambios planificados

### 1. `OnboardingOrchestrator.tsx` - No marcar onboarding como completo prematuramente

En `completeOnboardingAndRedirectToPTW` (linea 262):
- Eliminar `dna_empresarial_completed: true` y `onboarding_completed_at`
- Solo marcar `first_login_completed: true` para evitar loops de redireccion
- Mantener la navegacion al Founder PTW

### 2. `FounderCompletionScreen.tsx` - Redirigir al ADN en lugar del Dashboard

Cambiar las opciones de la pantalla de completitud:
- **Boton principal**: "Configurar mi Negocio" -> navega a `?view=negocio` (BusinessConfigurationHub / ADN)
- **Boton secundario**: "Expandir Estrategia" permanece igual (PTW completo)
- Eliminar la opcion de ir directo al Dashboard sin configurar ADN

### 3. `FounderPTWSimplified.tsx` - Ajustar `onComplete` para ir al ADN

Cambiar `handleGoToDashboard` para que navegue a `?view=negocio` en lugar de `?view=mando-central`, asegurando que el usuario pase por el ADN.

### 4. `CompanyDashboard.tsx` - Ajustar la ruta de `onComplete` del Founder PTW

Cambiar la prop `onComplete` del caso `founder-ptw` de `handleNavigate('mando-central')` a `handleNavigate('negocio')`.

### 5. `BusinessConfigurationHub.tsx` - Marcar onboarding completo al alcanzar umbral minimo

Agregar logica para que cuando el usuario complete un porcentaje minimo del ADN (al menos perfil + marca basica):
- Marque `dna_empresarial_completed: true` y `onboarding_completed_at`
- Dispare el evento `onboarding-completed`
- Muestre un toast de felicitacion

---

## Detalles tecnicos

### Archivo: `OnboardingOrchestrator.tsx`
- Funcion `completeOnboardingAndRedirectToPTW` (linea 262-300): cambiar upsert para NO marcar `dna_empresarial_completed` ni `onboarding_completed_at`, solo `first_login_completed: true` y `current_step: 3`

### Archivo: `FounderCompletionScreen.tsx`
- Renombrar `onGoToDashboard` a `onGoToADN` o cambiar su comportamiento
- Actualizar labels: "Configurar mi Negocio" / "Ver acciones recomendadas" -> "Completar perfil de empresa"

### Archivo: `CompanyDashboard.tsx` (linea 352)
- Cambiar: `onComplete={() => handleNavigate('mando-central')}` a `onComplete={() => handleNavigate('negocio')}`

### Archivo: `BusinessConfigurationHub.tsx`
- Agregar efecto que detecte cuando el perfil alcanza completitud minima (~40%) y marque el onboarding como completo si aun no lo esta
