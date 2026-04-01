

# Auditoría End-to-End de Marketing - Fallas Funcionales Activas

## Resumen del Estado Actual

Tras revisar en detalle los archivos del módulo de marketing (MarketingHubWow, CrearContentHub, ContentCreatorTab, ContentCreatorHub, ContentGenerator, SimpleContentPublisher, ContentCalendar, AutopilotDashboard, AdvancedContentCreator), se identifican **4 categorías de fallas** que afectan la funcionalidad end-to-end.

---

## FALLAS CRÍTICAS — Rompen la experiencia

### 1. ContentCreatorTab.tsx: 40+ strings hardcodeadas en español (sin i18n)

El componente NO usa `useTranslation` para sus propias strings. Todas las etiquetas, toasts y textos están hardcodeados:

- Línea 81: `"Idea cargada"`, `"Describe el contenido y usa 'Generar Contenido' para crearlo"`
- Línea 212: `"Formulario limpiado"`, `"Puedes crear nuevo contenido ahora"`
- Líneas 228, 255: `"Content Studio IA - Versión Avanzada"`
- Líneas 231, 258: `"Crea, guarda y gestiona insights personalizados con generación multimedia automática"`
- Línea 266: `"Insights persistentes y organizados"`, `"Generación automática de imágenes y videos"`, etc.
- Línea 281: `"Probar Ahora"`
- Línea 295: `"Crear Contenido"`, `"Elige tu método preferido"`
- Línea 308: `"Generación IA"`, Línea 315: `"Escribir Manual"`
- Línea 323: `"Describe el contenido que quieres crear"`
- Línea 328: Placeholder hardcodeado
- Línea 341: `"Generando contenido..."`, Línea 346: `"Generar Contenido con IA"`
- Línea 356: `"Escribe tu contenido"`, Línea 384: `"Optimizar con Era"`
- Línea 403: `"Generar Imagen"`, Línea 418: `"Tu Contenido"` / `"Contenido Generado"`
- Línea 434: `"Imagen Generada"`, Línea 454: `"Copiar"`
- Línea 461: `"Publicar Ahora"`, Línea 476: `"Limpiar"`
- Líneas 497-615: Toda la sección de "Análisis de Contenido Histórico" hardcodeada
- Línea 642: `"Contenido Simple"` hardcodeado en el publisher props

### 2. ContentCalendar.tsx: 100% sin i18n + Dark mode roto

- **Sin useTranslation en absoluto** — no importa react-i18next
- Línea 93: `title: 'Error'` hardcodeado
- Línea 169: `"Post eliminado"` hardcodeado
- Línea 177: `title: 'Error'` hardcodeado
- Línea 190: Días de la semana hardcodeados `['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']`
- Línea 245: `"+{count} más"` hardcodeado
- Línea 266: `"Próximas Publicaciones"` hardcodeado
- Líneas 335-336: `"No hay publicaciones programadas"`, `"Crea contenido programado desde las pestañas de creación"`
- Línea 347: `"Cargando calendario..."` hardcodeado
- Línea 356: `"Calendario de Contenido"`, `"Visualiza y gestiona todo tu contenido programado"`
- Línea 366: `"Actualizar"` hardcodeado
- Líneas 375-394: `"Posts programados"`, `"Posts publicados"`, `"Para hoy"`, `"Con errores"` hardcodeados
- Línea 407: `toLocaleDateString('es-ES', ...)` — locale hardcodeado
- Línea 422: `"Mes"`, `"Semana"`, `"Día"` hardcodeados
- Líneas 443-446: Quick actions all hardcoded
- Línea 454: `"Ir"` hardcodeado
- **Dark mode**: Líneas 104-108: `bg-blue-100 text-blue-800`, `bg-green-100 text-green-800`, etc. — se ven mal en modo oscuro

### 3. ContentCreatorTab.tsx: Dark mode still broken

Pese a correcciones previas, persisten:
- Línea 253: `text-purple-700` — invisible en dark mode
- Línea 412: `border-green-200 bg-gradient-to-br from-green-50/30 to-blue-50/30` — light-only colors
- Línea 415: `bg-green-100` — light-only background
- Línea 552: `bg-purple-100` — light-only progress bar background

### 4. `title: "Error"` hardcodeado — 240 instancias en 22 archivos

Los archivos más críticos del módulo de marketing:
- ContentCalendar.tsx (2 instancias)
- AdvancedMarketingDashboard.tsx
- FollowersLocationAnalysis.tsx (2 instancias)
- BaseConocimiento.tsx (3 instancias)
- SocialMediaCalendar.tsx (2 instancias)
- AudienciasCreate.tsx (3 instancias)
- UploadHistory.tsx
- Campaign steps (TargetAudience, CampaignObjective, SocialMediaPreview, ContentEnhancementDialog)

### 5. ContentCreatorHub.tsx todavía existe pero NO se usa

El componente `ContentCreatorHub.tsx` (484 líneas) fue supuestamente "fusionado" con `ContentCreatorTab`, pero sigue existiendo como archivo muerto. No se importa desde ningún componente activo del hub simplificado, pero sí se importa en el plan anterior. Genera confusión y peso.

### 6. AdvancedContentCreator.tsx: console.log en producción

Línea 58: `console.log('AdvancedContentCreator mounted with profile:', profile)` — expone datos de usuario en producción.

---

## PLAN DE CORRECCIÓN (7 pasos)

### Paso 1: Internacionalizar ContentCalendar.tsx completo
- Agregar `useTranslation`
- Reemplazar todas las strings hardcodeadas por claves i18n
- Cambiar `toLocaleDateString('es-ES')` por `toLocaleDateString(i18n.language)`
- Fix dark mode: reemplazar `bg-blue-100 text-blue-800` → `bg-blue-500/10 text-blue-500` (funciona en ambos temas)
- Fix `title: 'Error'` → `t('errors:general.title')`
- Agregar claves al namespace `marketing.json` (ES/EN/PT)

### Paso 2: Internacionalizar ContentCreatorTab.tsx
- Reemplazar las ~40 strings hardcodeadas por claves `t('marketing:creator...')`
- Incluir placeholders, toasts, labels y toda la sección "Análisis Histórico"
- Agregar claves al namespace `marketing.json`

### Paso 3: Fix dark mode en ContentCreatorTab.tsx
- `text-purple-700` → `text-purple-500` o `text-primary`
- `border-green-200 from-green-50/30 to-blue-50/30` → `border-green-500/20 from-green-500/5 to-blue-500/5`
- `bg-green-100` → `bg-green-500/10`
- `bg-purple-100` → `bg-purple-500/10`

### Paso 4: Fix masivo de `title: "Error"` en los 10 archivos de marketing restantes
- Agregar `useTranslation` donde no exista
- Reemplazar `title: "Error"` → `t('errors:general.title')`
- Archivos: ContentCalendar, AdvancedMarketingDashboard, FollowersLocationAnalysis, BaseConocimiento, SocialMediaCalendar, AudienciasCreate, UploadHistory, TargetAudience, CampaignObjective, ContentEnhancementDialog, SocialMediaPreview

### Paso 5: Eliminar ContentCreatorHub.tsx
- Verificar que no se importa desde ningún componente activo
- Eliminar el archivo (código muerto)

### Paso 6: Wrap console.log de producción
- AdvancedContentCreator.tsx línea 58: wrap en `if (import.meta.env.DEV)`

### Paso 7: Agregar traducciones faltantes a marketing.json (ES/EN/PT)
- Claves para ContentCalendar (calendar.*)
- Claves para ContentCreatorTab (creator.*)
- Verificar que no falten claves en los 3 idiomas

---

## Resumen de impacto

| Paso | Severidad | Archivos |
|------|-----------|----------|
| 1. Calendar i18n + dark mode | Crítica | 1 + locales |
| 2. CreatorTab i18n | Crítica | 1 + locales |
| 3. CreatorTab dark mode | Alta | 1 |
| 4. Error toasts masivo | Alta | 10+ |
| 5. Eliminar código muerto | Media | 1 |
| 6. Console.log cleanup | Media | 1 |
| 7. Locales update | Alta | 3 |

