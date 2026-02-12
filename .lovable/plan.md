
# Rediseno del Marketing Hub - Flujo de Experiencia de Usuario

## Diagnostico: Problemas Identificados

### 1. Dashboard sin guia de accion (Tab "Dashboard")
El dashboard muestra metricas (Insights, Engagement, Campanas, Automatizacion) pero cuando un usuario nuevo llega, ve todo en ceros y no hay un flujo guiado que le diga **por donde empezar**. Las "Acciones Rapidas" son 4 botones genericos sin contexto ni priorizacion.

### 2. Tab "Crear" es confuso y fragmentado
- Muestra un banner del "Content Studio IA - Version Avanzada" que compite visualmente con el creador simple
- El creador simple tiene 2 sub-tabs (Generacion IA / Manual) pero no conecta con las campanas ni con Creatify
- No hay acceso a la generacion de video (Creatify) desde esta pestaña
- El usuario no sabe si crear contenido suelto o dentro de una campana

### 3. Creatify Studio completamente aislado
CreatifyStudio solo es accesible via `?view=creatify-studio` en CompanyDashboard, pero **no aparece en ningun menu del Marketing Hub**. El usuario no puede descubrir las capacidades de video/banner/avatar a menos que conozca la URL exacta.

### 4. Tab "Campanas" no muestra campanas activas
CampaignDashboard solo muestra borradores y un boton para crear nueva campana. No hay visualizacion de campanas completadas ni su rendimiento. El wizard de 7 pasos es robusto pero el usuario no sabe que existe.

### 5. Calendario desconectado del flujo de creacion
ContentCalendar muestra posts programados pero no tiene forma de crear contenido directamente desde el calendario. El flujo natural seria: ver hueco en calendario -> crear contenido -> programar.

### 6. Biblioteca sin valor agregado
ContentLibraryTab + UploadHistory + ScheduledPostsManager se muestran apilados sin un flujo coherente. No se muestran los assets de Creatify aqui.

### 7. Hardcoded strings (i18n violation)
Todo el MarketingHubWow tiene docenas de strings hardcodeados en espanol: "Insights Generados", "Engagement Total", "Rendimiento por Plataforma", "Acciones Rapidas", "Cargando Marketing Hub", etc.

---

## Solucion Propuesta: Marketing Hub Guiado por Valor

### Principio rector
Convertir el Marketing Hub de un "panel de datos" a un **flujo guiado de generacion de valor** con 3 caminos claros:

```text
+------------------------------------------+
|          MARKETING HUB                   |
|                                          |
|  [Estado Actual: Metricas + Conexiones]  |
|                                          |
|  3 Caminos de Valor:                     |
|  +----------+ +----------+ +----------+ |
|  | Campana  | | Contenido| | Estudio  | |
|  | Completa | | Rapido   | | Creativo | |
|  | (Wizard) | | (Post)   | | (Video)  | |
|  +----------+ +----------+ +----------+ |
|                                          |
|  [Calendario] [Biblioteca]               |
+------------------------------------------+
```

### Cambio 1: Dashboard con "Getting Started" inteligente

Cuando no hay metricas/campanas, mostrar un **onboarding contextual** en lugar de metricas vacias:

```text
Bienvenido al Marketing Hub
-----------------------------
Tu progreso: [===>--------] 30%

[ ] 1. Conectar redes sociales       [Ir ->]
[x] 2. Completar ADN de empresa      [Hecho]
[ ] 3. Crear primera campana         [Ir ->]
[ ] 4. Generar primer video          [Ir ->]
[ ] 5. Programar primer publicacion  [Ir ->]
```

Cuando **si hay datos**, mostrar el dashboard actual con metricas reales.

### Cambio 2: Reestructurar tabs de 5 a 5 (renombrar + integrar Creatify)

| Tab Actual | Tab Nuevo | Contenido |
|---|---|---|
| Dashboard | **Panel** | Metricas + Getting Started inteligente |
| Crear | **Crear** | 3 opciones claras: Post Rapido, Campana Completa, Estudio Creativo (Creatify) |
| Campanas | **Campanas** | Dashboard de campanas existente |
| Calendario | **Calendario** | Sin cambios, agregar boton "Crear desde aqui" |
| Biblioteca | **Biblioteca** | Unificar: content library + Creatify gallery + historial |

### Cambio 3: Tab "Crear" rediseñado con 3 caminos claros

En lugar del creador fragmentado actual, mostrar 3 cards de accion:

**Camino 1: Post Rapido**
- Para cuando el usuario quiere publicar algo ya
- Generacion IA o manual -> Optimizar con Era -> Publicar/Programar
- Es el ContentCreatorTab actual pero simplificado

**Camino 2: Campana Completa**
- El wizard de 7 pasos existente
- Para estrategias de marketing completas
- Acceso directo al CampaignWizard

**Camino 3: Estudio Creativo (Creatify)**
- Video Ads desde URL del sitio web
- Videos con Avatar AI
- Clonar anuncios de competidores
- Banners IAB en todos los tamanos
- Es el CreatifyStudio integrado directamente

### Cambio 4: Biblioteca unificada

Consolidar en una sola vista con filtros:
- Contenido generado (texto)
- Imagenes generadas
- Videos Creatify (desde creatify_jobs)
- Posts publicados (historial Upload-Post)
- Posts programados

### Cambio 5: Internacionalizacion

Mover todos los strings hardcodeados a `marketing.json` en los 3 idiomas (ES, EN, PT).

---

## Detalles Tecnicos

### Archivos a modificar:

1. **`src/components/company/MarketingHubWow.tsx`** (archivo principal - 910 lineas)
   - Agregar logica de "Getting Started" basada en estado del usuario
   - Reestructurar tab "Crear" con las 3 opciones
   - Integrar CreatifyStudio en el tab "Crear" como opcion
   - Integrar CreatifyGallery en tab "Biblioteca"
   - Reemplazar ~60 strings hardcodeados con claves i18n

2. **`src/components/company/ContentCreatorTab.tsx`** (692 lineas)
   - Simplificar eliminando el banner del "Advanced Creator" que confunde
   - Convertir en la opcion "Post Rapido" dentro del nuevo tab Crear

3. **`src/components/company/ContentCalendar.tsx`** (465 lineas)
   - Agregar boton de "Crear contenido" al hacer click en un dia vacio

4. **`public/locales/es/marketing.json`** - Crear traducciones ES
5. **`public/locales/en/marketing.json`** - Crear traducciones EN
6. **`public/locales/pt/marketing.json`** - Crear traducciones PT

### Nuevo componente: `MarketingGettingStarted.tsx`
Widget de onboarding que evalua el estado actual del usuario:
- Redes conectadas? (social_accounts)
- ADN completo? (company_branding)
- Primera campana? (marketing_campaigns)
- Primer video? (creatify_jobs)
- Primera publicacion? (scheduled_posts / upload history)

### Nuevo componente: `CrearContentHub.tsx`
Las 3 tarjetas de accion para el tab "Crear":
- Post Rapido (abre ContentCreatorTab inline)
- Campana Completa (navega a tab campanas/wizard)
- Estudio Creativo (abre CreatifyStudio inline)

### Nuevo componente: `UnifiedLibrary.tsx`
Vista consolidada de todos los assets:
- Query content_library + creatify_jobs (done) + generated_content
- Filtros por tipo (texto, imagen, video, banner)
- Acciones: descargar, publicar, programar, eliminar

### Impacto en navegacion
- Eliminar `creatify-studio` como vista separada en CompanyDashboard (se accede desde Marketing Hub)
- Mantener la ruta `?view=creatify-studio` como redirect al Marketing Hub tab "Crear"

---

## Plan de Ejecucion

### Fase 1: Infraestructura i18n + Getting Started
1. Crear archivos de traduccion `marketing.json` (ES/EN/PT)
2. Crear componente `MarketingGettingStarted.tsx`
3. Integrar Getting Started en el dashboard del Marketing Hub

### Fase 2: Reestructurar Tab "Crear"
4. Crear componente `CrearContentHub.tsx` con las 3 opciones
5. Integrar CreatifyStudio como opcion dentro del tab Crear
6. Simplificar ContentCreatorTab (remover banner Advanced confuso)

### Fase 3: Biblioteca Unificada
7. Crear componente `UnifiedLibrary.tsx`
8. Integrar CreatifyGallery + ContentLibrary + UploadHistory

### Fase 4: Refactor i18n completo
9. Reemplazar todos los strings hardcodeados en MarketingHubWow.tsx
10. Internacionalizar ContentCreatorTab, ContentCalendar, ConnectionStatusBar
