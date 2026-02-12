
# Integracion de Creatify AI en el Marketing Hub de Buildera

## Resumen

Creatify.ai es una plataforma de generacion de video publicitario con IA. Integraremos sus 7 APIs principales en el Marketing Hub para que cada empresa registrada pueda generar contenido de video, imagenes publicitarias y assets creativos directamente desde Buildera.

---

## APIs de Creatify a Integrar

| API | Funcion | Costo (creditos) | Uso en Buildera |
|---|---|---|---|
| **URL to Video** | Convierte URL de producto en video publicitario | 5 cr/30s | Paso 5 "Creacion de Contenido" - generar video ads desde el sitio web de la empresa |
| **AI Avatar (Lipsync v2)** | Videos con avatares AI hablando un script | 5 cr/30s | Generar portavoces virtuales para la marca |
| **Ad Clone** | Recrea anuncios ganadores con los productos de la empresa | 3 cr/5s del video referencia | Clonar anuncios exitosos de competidores |
| **Image Ad (IAB)** | Genera banners publicitarios en todos los tamanos IAB | 2 cr/request | Banners para campanas display/mobile |
| **Asset Generator** | Genera imagenes/videos con modelos como Kling, etc. | Variable | Imagenes de producto, videos cortos |
| **AI Scripts** | Genera scripts para videos | 1 cr/request | Pre-generar guiones antes de crear videos |
| **Text to Speech** | Convierte texto a audio | 1 cr/30s | Voiceovers para contenido |

---

## Arquitectura Tecnica

### Autenticacion
Creatify usa dos headers: `X-API-ID` y `X-API-KEY` (obtenidos desde el dashboard de Creatify). Se almacenaran como secrets de Supabase: `CREATIFY_API_ID` y `CREATIFY_API_KEY`.

### Patron Asincrono
Todas las APIs de Creatify siguen un patron asincrono:
1. `POST` para crear la tarea (retorna un `id`)
2. `GET` para consultar el estado (polling hasta `status: done`)
3. Opcion de `webhook_url` para recibir notificacion cuando termine

Usaremos **polling** desde el frontend con intervalos de 5 segundos, ya que los webhooks requieren URL publica y agregan complejidad innecesaria en esta fase.

---

## Plan de Implementacion

### Fase 1: Infraestructura Base

**1.1 Configuracion de Secrets**
- Solicitar al usuario sus credenciales `CREATIFY_API_ID` y `CREATIFY_API_KEY`
- Almacenarlas como secrets de Supabase

**1.2 Edge Function central: `creatify-proxy`**
- Una sola edge function que actua como proxy hacia todas las APIs de Creatify
- Recibe `action` (create-link, url-to-video, avatar-video, ad-clone, iab-images, asset-generator, check-status) y `params`
- Valida autenticacion del usuario
- Agrega headers `X-API-ID` / `X-API-KEY`
- Retorna la respuesta de Creatify

```text
Estructura del Edge Function:

POST /creatify-proxy
Body: {
  action: "create-link" | "url-to-video" | "check-video-status" | 
          "avatar-video" | "check-avatar-status" |
          "ad-clone" | "check-clone-status" |
          "iab-images" | "check-iab-status" |
          "asset-generator" | "check-asset-status" |
          "get-avatars" | "get-voices",
  params: { ... }
}
```

**1.3 Tabla de base de datos: `creatify_jobs`**
```text
creatify_jobs:
  - id (uuid, PK)
  - company_id (uuid, FK -> companies)
  - user_id (uuid, FK -> auth.users)
  - job_type (text: url_to_video | avatar | ad_clone | iab_images | asset_generator)
  - creatify_job_id (text - el ID devuelto por Creatify)
  - status (text: pending | in_queue | running | done | failed)
  - input_params (jsonb - parametros enviados)
  - output_data (jsonb - respuesta final con URLs de video/imagen)
  - credits_used (integer)
  - campaign_id (uuid, FK -> marketing_campaigns, nullable)
  - calendar_item_id (uuid, FK -> content_calendar_items, nullable)
  - created_at, updated_at
```

**1.4 API Client en frontend: `src/lib/api/creatify.ts`**
- Funciones tipadas para cada operacion
- Hook `useCreatifyJob` con polling automatico de estado
- Manejo de errores y reintentos

---

### Fase 2: Integracion en el Marketing Hub (Paso 5: Creacion de Contenido)

**2.1 Nuevo componente: `CreatifyVideoCreator`**
Se integrara dentro de `ContentCreation.tsx` (paso 5 del wizard) como una opcion adicional de creacion de contenido. El usuario podra elegir entre:
- Generacion de copy (existente)
- **Generar Video Ad** (nuevo - URL to Video)
- **Generar Video con Avatar** (nuevo - AI Avatar)
- **Clonar Anuncio** (nuevo - Ad Clone)
- **Generar Banners** (nuevo - IAB Images)

**2.2 Flujo URL to Video**
1. Se toma automaticamente el `website_url` de la empresa
2. Se crea un Link via `POST /api/links/`
3. Se enriquece con logo, imagenes y descripcion del ADN de la empresa
4. Se genera el video con parametros pre-configurados segun la estrategia:
   - `target_audience`: del buyer persona definido en paso 2
   - `target_platform`: de la red social del item del calendario
   - `language`: del idioma del usuario (es/en/pt)
   - `script_style`: mapeado desde el objetivo de la campana
   - `aspect_ratio`: segun plataforma (9x16 para TikTok/Reels, 16x9 para YouTube, 1x1 para Feed)
5. Polling de estado con indicador de progreso visual
6. Al completar, se muestra preview del video y se guarda en `generated_assets`

**2.3 Flujo AI Avatar**
1. El usuario selecciona un avatar de la galeria (1500+ opciones)
2. Se usa el script generado en el paso de estrategia o se escribe uno nuevo
3. Se selecciona voz y acento
4. Se configura fondo (imagen de producto o color de marca)
5. Se genera el video multi-escena
6. Preview y guardado

**2.4 Flujo Ad Clone**
1. El usuario pega la URL de un anuncio de la competencia (o se sugiere desde competitive intelligence)
2. Se crea un Link con los assets de SU empresa
3. Se genera un clon del anuncio con los productos de la empresa
4. Preview y guardado

**2.5 Flujo IAB Banners**
1. Se selecciona una imagen de producto o del branding de la empresa
2. Se generan automaticamente 12 tamanos IAB (mobile + desktop)
3. Se muestran todos los tamanos en una grilla con opcion de descarga individual o por lote

---

### Fase 3: Componentes UI

**3.1 `CreatifyStudio` (componente contenedor)**
- Tab interface con las 4 herramientas: Video Ad | Avatar | Ad Clone | Banners
- Historial de generaciones previas de la empresa
- Indicador de creditos restantes

**3.2 `VideoGenerationForm`**
- Formulario con los parametros configurables
- Selectors para visual_style, script_style, aspect_ratio
- Preview del link scrapeado antes de generar
- Barra de progreso durante generacion

**3.3 `AvatarSelector`**
- Galeria de avatares con filtros (genero, etnia, estilo)
- Selector de voz con preview de audio
- Editor de script multi-escena

**3.4 `GenerationStatusTracker`**
- Componente reutilizable para mostrar estado de cualquier job
- Animacion de loading con porcentaje
- Auto-refresh cada 5 segundos
- Manejo de errores con opcion de reintento

**3.5 `CreatifyGallery`**
- Galeria de todos los assets generados por la empresa
- Filtros por tipo (video, imagen, banner)
- Acciones: descargar, usar en calendario, eliminar

---

### Fase 4: i18n

Todos los nuevos componentes usaran el sistema de traduccion existente con claves en `creatify.json` para ES, EN y PT. Incluira traducciones para:
- Labels de formularios
- Nombres de estilos visuales y de script
- Mensajes de estado
- Errores

---

## Detalles Tecnicos

### Edge Function `creatify-proxy/index.ts`
- Valida JWT del usuario
- Lee `CREATIFY_API_ID` y `CREATIFY_API_KEY` de env
- Redirige la llamada a `https://api.creatify.ai/api/...` con los headers correctos
- Para acciones de tipo "check-status", acepta el `job_id` y consulta la API correspondiente
- Actualiza la tabla `creatify_jobs` con cada cambio de estado

### Hook `useCreatifyJob`
```text
useCreatifyJob(jobId):
  - Polling cada 5 segundos mientras status != done/failed
  - Retorna { status, progress, output, error, isLoading }
  - Se detiene automaticamente al completar
  - Timeout de 10 minutos maximo
```

### Mapeo de plataformas a aspect_ratio
```text
TikTok, Instagram Reels, YouTube Shorts -> 9x16
YouTube, LinkedIn Video -> 16x9
Instagram Feed, Facebook Feed -> 1x1
```

### Mapeo de objetivos de campana a script_style
```text
brand_awareness -> BrandStoryV2
lead_generation -> CallToActionV2
sales -> SpecialOffersV2
engagement -> DiscoveryWriter
education -> HowToV2
```

---

## Archivos a Crear/Modificar

### Nuevos archivos:
1. `supabase/functions/creatify-proxy/index.ts` - Edge function proxy
2. `src/lib/api/creatify.ts` - API client tipado
3. `src/hooks/useCreatifyJob.ts` - Hook de polling
4. `src/components/company/creatify/CreatifyStudio.tsx` - Contenedor principal
5. `src/components/company/creatify/VideoGenerationForm.tsx` - Form URL to Video
6. `src/components/company/creatify/AvatarVideoForm.tsx` - Form Avatar
7. `src/components/company/creatify/AdCloneForm.tsx` - Form Ad Clone
8. `src/components/company/creatify/IABBannerForm.tsx` - Form Banners
9. `src/components/company/creatify/GenerationStatusTracker.tsx` - Status tracker
10. `src/components/company/creatify/CreatifyGallery.tsx` - Galeria de assets
11. `public/locales/es/creatify.json` - Traducciones ES
12. `public/locales/en/creatify.json` - Traducciones EN
13. `public/locales/pt/creatify.json` - Traducciones PT
14. Migracion SQL para tabla `creatify_jobs`

### Archivos a modificar:
1. `src/components/company/campaign/steps/ContentCreation.tsx` - Agregar opciones de Creatify
2. `supabase/config.toml` - Agregar config de `creatify-proxy`
3. `src/integrations/supabase/types.ts` - Agregar tipos de la nueva tabla
4. `src/pages/CompanyDashboard.tsx` - Agregar vista de "Estudio Creatify" como opcion del dashboard

---

## Prerequisitos

Antes de implementar, se necesitara que el propietario del proyecto:
1. Cree una cuenta en [Creatify.ai](https://app.creatify.ai/) con un plan API (desde $99/mes)
2. Obtenga las credenciales `X-API-ID` y `X-API-KEY` desde el API Dashboard
3. Las proporcione para almacenarlas como secrets de Supabase
