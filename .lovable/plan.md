

# Problemas Funcionales Críticos en el Módulo de Marketing

## Hallazgos

### SEVERIDAD CRÍTICA — Funcionalidad Rota

**1. ContentGenerator.tsx usa datos MOCK en lugar de IA real**
- Líneas 86-97: `await new Promise(resolve => setTimeout(resolve, 2000))` — simula una espera de 2 segundos y luego devuelve contenido hardcodeado con `generateMockContent()`
- La función NUNCA llama a un Edge Function ni a ninguna API de IA
- El usuario cree que está generando contenido con IA pero recibe templates estáticos predefinidos
- **Archivo**: `src/components/company/ContentGenerator.tsx`

**2. "Email Sequence" en CrearContentHub no tiene implementación**
- El card de "Email Sequence" se muestra en la UI pero no hay handler para `activePath === "email-sequence"`
- Al hacer click, el estado cambia a `"email-sequence"` pero ningún `if` lo captura, así que se muestra la pantalla de selección de nuevo (bucle silencioso)
- **Archivo**: `src/components/company/CrearContentHub.tsx` (líneas 19, 114)

**3. Toast `title: 'Error'` hardcodeado en SimpleContentPublisher línea 602**
- Pese a correcciones previas, la línea 602 aún usa `title: 'Error'` en lugar de `t('errors:general.title')`
- **Archivo**: `src/components/company/SimpleContentPublisher.tsx`

### SEVERIDAD ALTA — Degradan UX Significativamente

**4. ContentCreatorHub.tsx — 20+ strings hardcodeadas en español sin i18n**
- "Creación Rápida" (línea 269), "Con IA" (274), "Manual" (275), "Plataforma" (289), "Formato" (306)
- "Generando..." (330), "Generar Contenido" (335), "Optimizar con Era" (363), "Generar Ideas" (412)
- "No hay ideas de contenido" (430), "Cargando ideas de contenido..." (422)
- Toasts: "Generando ideas" (93), "¡Ideas generadas!" (108), "¡Contenido generado!" (158), "Preparando contenido" (210)
- **Archivo**: `src/components/company/ContentCreatorHub.tsx`

**5. ContentCreatorTab.tsx — 30+ strings hardcodeadas + tema roto en dark mode**
- `bg-white/80` en 3 instancias (líneas 442, 450, 530, 556, 584) — rompe dark mode completamente
- `text-blue-900` (451), `text-purple-700` (559), `text-orange-700` (588) — colores hardcodeados
- Textos: "Content Studio IA - Versión Avanzada" (247, 273), "Crear Contenido" (314), "Generación IA" (327)
- "Escribir Manual" (333), "Generar Contenido con IA" (364), "Publicar Ahora" (480), "Limpiar" (496)
- `border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50` (línea 270) — hardcoded light theme
- **Archivo**: `src/components/company/ContentCreatorTab.tsx`

**6. ContentLibraryTab.tsx — 100% sin i18n**
- "Biblioteca de Contenidos" (78), "elementos" (79), "Actualizar" (88)
- "Tu colección personal de contenido exitoso..." (91), "Tu biblioteca está vacía" (99)
- "Contenido eliminado" (45), `title: "Error"` hardcodeado (49)
- "Copiar URL" (175), "URL copiada" (173)
- **Archivo**: `src/components/company/ContentLibraryTab.tsx`

**7. ContentGenerator.tsx — 100% sin i18n**
- Todo el componente usa strings en español hardcodeadas: "Post de Texto", "Post con Imagen", "Video/Reel"
- Tones: "Profesional", "Casual", "Entusiasta", etc.
- Toasts y labels todos hardcodeados
- **Archivo**: `src/components/company/ContentGenerator.tsx`

**8. ScheduledPostsManager.tsx — Emoji icons en lugar de componentes**
- Usa emojis como iconos de plataforma ('📘', '📷', '💼') en vez de los componentes de iconos reales (FaFacebook, FaInstagram, etc.)
- Probablemente sin i18n (nombre de componente y patrón sugieren hardcoded)

**9. `console.log` en producción en SimpleContentPublisher**
- Línea 507: `console.log('Successfully published via edge function:', data)`
- Línea 573: `console.log('📊 Content tracking:', { source, contentIdeaId, ... })`

### SEVERIDAD MEDIA — Inconsistencias

**10. ContentCreatorTab.tsx — Duplicación lógica del Advanced Creator**
- El `showAdvancedCreator` se renderiza dos veces: una en el early return (línea 217-236) y otra dentro del main return (línea 241-266)
- La primera instancia nunca se alcanza porque el segundo render ya maneja ambos estados

**11. ContentCreatorHub.tsx — useEraOptimizer callback con toast hardcodeado**
- Línea 49: `"¡Contenido optimizado!"` y `"Tu contenido ha sido mejorado por Era"` — sin i18n

---

## Plan de Corrección (por prioridad)

### Paso 1: Reemplazar ContentGenerator mock por IA real
- Eliminar `generateMockContent()` y `generateMockHashtags()`
- Invocar `generate-company-content` Edge Function (mismo patrón que `ContentCreatorHub.handleQuickCreateWithAI`)
- Agregar i18n a todo el componente

### Paso 2: Implementar o deshabilitar "Email Sequence"
- **Opción A**: Crear componente `EmailSequenceBuilder.tsx` con formulario básico (subject, body, schedule) integrado con el sistema de email interno
- **Opción B**: Ocultar temporalmente el card con un badge "Próximamente" y no hacer nada al clickear
- Recomendar **Opción B** por ahora (menor riesgo, Feature compleja)

### Paso 3: Internacionalizar ContentCreatorHub.tsx
- Agregar claves al namespace `marketing` (ES/EN/PT)
- Reemplazar las ~20 strings por `t('marketing:...')`

### Paso 4: Fix ContentCreatorTab.tsx — dark mode + i18n
- Reemplazar `bg-white/80` → `bg-card/80`
- Reemplazar `from-purple-50 to-pink-50` → `from-purple-500/5 to-pink-500/5`
- Eliminar `text-blue-900`, `text-purple-700`, `text-orange-700` → usar `text-primary` o `text-foreground`
- Internacionalizar ~30 strings
- Eliminar renderizado duplicado del Advanced Creator

### Paso 5: Internacionalizar ContentLibraryTab.tsx
- Agregar `useTranslation`
- Reemplazar todas las strings + fix `title: "Error"` → `t('errors:general.title')`

### Paso 6: Fix SimpleContentPublisher remaining issues
- Línea 602: `title: 'Error'` → `t('errors:general.title')`
- Wrap `console.log` líneas 507, 573 en `if (import.meta.env.DEV)`

### Paso 7: Fix ScheduledPostsManager emoji icons
- Verificar i18n y reemplazar emojis por componentes icon reales

---

## Resumen de impacto

| Paso | Severidad | Archivos |
|------|-----------|----------|
| 1. Mock → IA real | Crítica | 1 |
| 2. Email Sequence | Crítica | 1 |
| 3. ContentCreatorHub i18n | Alta | 1 + locales |
| 4. ContentCreatorTab dark+i18n | Alta | 1 |
| 5. ContentLibraryTab i18n | Alta | 1 |
| 6. Publisher fixes | Media | 1 |
| 7. ScheduledPosts icons | Media | 1 |

