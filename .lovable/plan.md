

# Ajuste Estructural: Guiar al Usuario hacia el Autopilot de Marketing

## Problema Raiz

El Autopilot de Marketing tiene un ciclo SENSE-THINK-GUARD-ACT-LEARN que **aborta** cuando no hay datos suficientes (0 posts, 0 campanas). Sin embargo, el sistema **nunca guia proactivamente** al usuario para obtener esos datos usando las capacidades que ya existen (scrapers, conexion social, creacion de contenido). El resultado: el usuario activa el autopilot, no pasa nada, y no sabe por que ni que hacer.

Los problemas especificos son:

1. **El engine aborta silenciosamente** cuando no hay posts -- no ejecuta ninguna accion proactiva como importar datos o crear contenido inicial.
2. **El Getting Started checklist requiere pasos innecesarios** antes de permitir el autopilot (video, campaña) -- estos no son prerrequisitos reales del engine.
3. **No existe un "bootstrap" automatico** que, al activar el autopilot por primera vez, importe datos sociales existentes usando los scrapers disponibles.
4. **El prerequisite dialog** solo muestra un mensaje generico con botones de navegacion, sin ejecutar acciones concretas.

## Solucion: 3 Cambios Estructurales

### Cambio 1: Getting Started Simplificado y Realista

**Archivo**: `src/components/company/MarketingGettingStarted.tsx`

Reducir los pasos de Level 1 a los que realmente importan para que el autopilot funcione:

| Paso actual | Estado |
|---|---|
| Conectar red social | **MANTENER** - prerrequisito real |
| Completar marca | **MANTENER** - mejora calidad del output |
| Primera campaña | **ELIMINAR** - no es prerrequisito |
| Primer video | **ELIMINAR** - no es prerrequisito |
| Importar datos sociales (NUEVO) | **AGREGAR** - prerrequisito real del engine |
| Primera publicacion | **MANTENER** - demuestra que el sistema funciona |
| Activar autopilot | **MANTENER** - objetivo final |

El paso "Importar datos sociales" abrira el `SocialDataImportDialog` directamente, permitiendo al usuario pegar su URL de perfil y ejecutar el scraper existente. Esto llena la base de datos con los posts que el engine necesita.

### Cambio 2: Bootstrap Automatico al Activar Autopilot

**Archivo**: `src/components/company/marketing/AutopilotDashboard.tsx`

Cuando el usuario intente activar el autopilot y no haya posts suficientes, en vez de solo mostrar un dialog con botones de navegacion:

1. Mostrar un **dialog de bootstrap interactivo** que:
   - Detecte las redes conectadas
   - Ofrezca importar datos automaticamente (ejecutando los scrapers existentes desde el dialog)
   - Muestre progreso de la importacion en tiempo real
   - Una vez importados los datos, active el autopilot automaticamente

El flujo seria:
```text
Usuario activa toggle
    |
    v
+----------------------------+
| Prerequisitos no cumplidos |
+----------------------------+
    |
    v
+-------------------------------+
| Dialog Bootstrap Interactivo  |
| - Redes detectadas: LinkedIn  |
| - [Importar posts de LinkedIn]|  <-- ejecuta linkedin-scraper
| - [Conectar mas redes]        |  <-- abre SocialConnectionManager
| - Progreso: ████░░ 60%        |
+-------------------------------+
    |
    v (datos importados)
Autopilot se activa automaticamente
```

### Cambio 3: Engine Proactivo ante Datos Insuficientes

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

Modificar el comportamiento del engine cuando `checkDataSufficiency` falla para Marketing:

En vez de abortar con "Insufficient data", el engine debe:
1. Intentar ejecutar los scrapers automaticamente para las cuentas sociales conectadas
2. Si logra importar datos, reintentar el ciclo SENSE
3. Si no hay cuentas conectadas, registrar una decision de tipo `bootstrap_required` en `autopilot_decisions` con un mensaje claro para el usuario
4. Desactivar temporalmente el autopilot y notificar al usuario via toast/notificacion

Esto convierte el engine de "pasivo" (solo opera si hay datos) a "proactivo" (busca obtener los datos que necesita).

---

## Detalle Tecnico

### MarketingGettingStarted.tsx
- Eliminar pasos `firstCampaign` y `firstVideo`
- Agregar paso `importSocialData` que verifica si hay posts en cualquier tabla de posts
- La accion del nuevo paso abre un estado que el padre (`MarketingHubWow`) usa para mostrar el `SocialDataImportDialog`
- Comunicar con el padre via un nuevo callback `onImportData`

### AutopilotDashboard.tsx
- Reemplazar el `showPrereqDialog` simple por un **BootstrapDialog** interactivo
- El dialog:
  - Consulta `social_accounts` para detectar redes conectadas
  - Por cada red conectada, muestra boton "Importar posts"
  - Al hacer click, invoca el scraper correspondiente (`instagram-scraper`, `linkedin-scraper`, etc.)
  - Muestra estado de importacion (loading/success/error por plataforma)
  - Boton "Conectar redes" que abre el `SocialConnectionManager` via deep link
  - Al completar importacion, re-verifica prerrequisitos y activa autopilot automaticamente

### enterprise-autopilot-engine/index.ts
- En `checkDataSufficiency` para marketing, si falla:
  - Buscar cuentas sociales conectadas del company
  - Si hay cuentas, invocar scrapers automaticamente
  - Re-evaluar data sufficiency despues del scrape
  - Si sigue fallando, registrar decision `bootstrap_required` en vez de abortar silenciosamente
  - Marcar el ciclo como `needs_bootstrap` en el log en vez de simplemente `insufficient_data`

### MarketingHubWow.tsx
- Agregar estado y dialog para `SocialDataImportDialog` accesible desde Getting Started
- Pasar callback `onImportData` al componente `MarketingGettingStarted`

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/company/MarketingGettingStarted.tsx` | Simplificar pasos, agregar importacion de datos |
| `src/components/company/MarketingHubWow.tsx` | Agregar SocialDataImportDialog y callback |
| `src/components/company/marketing/AutopilotDashboard.tsx` | Bootstrap dialog interactivo |
| `supabase/functions/enterprise-autopilot-engine/index.ts` | Engine proactivo con auto-scrape |

