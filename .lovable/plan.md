

# Soporte para Empresas Nuevas sin Historial Digital

## Problema

Cuando una empresa es nueva y no tiene publicaciones en redes sociales:

1. El paso **"Importar datos sociales"** del Getting Started exige minimo 5 posts -- imposible de cumplir
2. El **Autopilot Engine** aborta porque `checkDataSufficiency` requiere al menos 1 post
3. El usuario queda atrapado sin saber que hacer

## Solucion

Crear un **camino alternativo** para empresas sin historial: en vez de importar datos, pueden generar contenido inicial usando los agentes de creacion que ya existen (CONTENT_CREATOR, CALENDAR_PLANNER).

### Cambio 1: Getting Started -- Paso de importacion flexible

**Archivo**: `src/components/company/MarketingGettingStarted.tsx`

- Convertir el paso "Importar datos sociales" en un paso bifurcado:
  - Si la empresa tiene redes con contenido: mostrar la opcion de importar (flujo actual)
  - Si no tiene contenido o no tiene redes: mostrar opcion alternativa **"Crear tu primer contenido con IA"** que lleva a la pestana "Crear" del Marketing Hub
- El paso se marca como completado si hay 5+ posts importados **O** si hay 1+ post programado/creado via la plataforma

### Cambio 2: Autopilot Engine -- Modo Cold Start

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

Cuando `checkDataSufficiency` falla para marketing y el bootstrap (scraping) tambien falla:

- En vez de solo registrar `bootstrap_required` y abortar, registrar una decision actionable de tipo `cold_start_content` que sugiera crear contenido inicial
- La descripcion de la decision incluira un mensaje especifico: "Tu empresa es nueva en el mundo digital. El Autopilot puede generar tu primer calendario de contenido automaticamente."
- Agregar un campo `suggested_action` con valor `generate_initial_content` para que el frontend pueda mostrar un CTA directo

### Cambio 3: Bootstrap Dialog -- Opcion de generar contenido

**Archivo**: `src/components/company/marketing/AutopilotDashboard.tsx`

En el Bootstrap Dialog que aparece cuando faltan prerrequisitos:

- Agregar una seccion para empresas sin datos: **"Sin historial? Genera tu primer contenido"**
- Boton que invoca el agente `CALENDAR_PLANNER` para crear un calendario inicial de 1 semana basado en la estrategia y marca de la empresa
- Al completarse la generacion, los posts creados satisfacen el requisito de datos y el autopilot puede activarse

### Cambio 4: SocialDataImportDialog -- Mensaje para empresas nuevas

**Archivo**: `src/components/agents/SocialDataImportDialog.tsx`

- Si el scraper retorna 0 posts, mostrar un mensaje amigable en vez de un error: "No encontramos publicaciones en este perfil. Si tu empresa es nueva, puedes crear contenido con IA desde el Marketing Hub."
- Incluir un boton/link directo a la pestana "Crear"

---

## Detalle Tecnico

### MarketingGettingStarted.tsx
- Verificar tambien `scheduled_posts` ademas de las tablas de posts importados para el paso `importSocialData`
- Cambiar el umbral: completado si `totalImportedPosts >= 5 OR scheduledPosts >= 1`
- Cambiar la accion del paso: si no hay redes conectadas, redirigir a `onNavigateTab("create")` en vez de `onImportData()`

### enterprise-autopilot-engine/index.ts
- En el bloque donde se registra `bootstrap_required` (lineas 1167-1182 y 1186-1201), agregar `suggested_action: 'generate_initial_content'` al objeto de la decision
- Modificar la descripcion para incluir guidance especifica sobre creacion de contenido

### AutopilotDashboard.tsx
- En el Bootstrap Dialog, despues de la lista de plataformas para importar, agregar un bloque condicional que aparezca cuando no hay datos importables
- El boton de "Generar contenido" invocara `supabase.functions.invoke('marketing-hub-content-calendar', { body: { user_id, company_id, ... } })`
- Al terminar, refrescar prerrequisitos y activar autopilot

### SocialDataImportDialog.tsx
- Despues de la invocacion del scraper, si `data.posts_count === 0` o `data.posts?.length === 0`, mostrar un Alert informativo con un boton que cierre el dialog y ejecute `onNavigateTab?.("create")`
- Agregar prop opcional `onNavigateToCreate?: () => void`

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/company/MarketingGettingStarted.tsx` | Paso flexible: importar o crear contenido |
| `src/components/agents/SocialDataImportDialog.tsx` | Mensaje amigable cuando 0 posts + link a crear |
| `src/components/company/marketing/AutopilotDashboard.tsx` | Opcion de generar calendario inicial en bootstrap dialog |
| `supabase/functions/enterprise-autopilot-engine/index.ts` | Decision cold_start_content con suggested_action |
