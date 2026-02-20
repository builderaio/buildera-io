
# Plan: Alinear integracion Creatify.ai con API oficial y mejores practicas

## Resumen de hallazgos

Tras investigar la documentacion oficial de Creatify.ai (`docs.creatify.ai/api-reference`), se detectaron multiples gaps entre lo que la API ofrece y lo que Buildera implementa actualmente.

---

## 1. Endpoint incorrecto para URL-to-Video

**Problema critico**: El proxy usa `/lipsyncs/` para `url-to-video`, pero la API oficial usa `/link_to_videos/`.

- `/lipsyncs/` es para **AI Avatar (lipsync)** solamente
- `/link_to_videos/` es el endpoint correcto para **URL-to-Video**
- Actualmente ambas acciones (`url-to-video` y `avatar-video`) apuntan al mismo endpoint, lo que causa confusion y posibles errores

**Correccion**:
- `case "url-to-video"` -> endpoint = `/link_to_videos/`
- `case "avatar-video"` -> endpoint = `/lipsyncs/` (correcto)
- `case "check-video-status"` -> endpoint = `/link_to_videos/${params.id}/` (no `/lipsyncs/`)

Misma correccion en `marketing-hub-video-creator/index.ts`.

---

## 2. Campo `link_id` vs `link`

**Problema**: El cliente envia `link_id` pero la API espera `link` (campo UUID).

**Correccion**: En el proxy, antes de enviar a Creatify, renombrar `link_id` -> `link` para la accion `url-to-video`.

---

## 3. Visual Style invalido

**Problema**: `VideoGenerationForm.tsx` envia `visual_style: "modern"` que no es un valor valido de la API.

**Valores validos**: `AvatarBubbleTemplate`, `DynamicProductTemplate`, `FullScreenTemplate`, `VanillaTemplate`, `MotionCardsTemplate`, etc. (21+ opciones oficiales).

**Correccion**: Reemplazar `"modern"` por `"AvatarBubbleTemplate"` como default, y agregar selector de visual style al formulario con las opciones mas relevantes.

---

## 4. Script Styles incompletos

**Problema**: Solo se ofrecen 5 script styles de los 40+ disponibles.

**Script styles faltantes de alto valor**:
- `BenefitsV2` (Benefits)
- `ProblemSolutionV2` (Problem Solution)
- `ProductHighlightsV2` (Product Highlights)
- `EmotionalWriter` (Emotional)
- `MotivationalWriter` (Motivational)
- `ThreeReasonsWriter` (3 Reasons Why)
- `GenzWriter` (Gen Z)
- `TrendingTopicsV2` (Trending Topics)
- Hooks virales: `NegativeHook`, `SecretHook`, `NumberOneHook`, etc.

**Correccion**: Agregar al menos 10-15 script styles adicionales al selector, agrupados por categoria (Clasicos, Hooks Virales, Emocionales).

---

## 5. Parametros de video no expuestos

**Parametros disponibles en la API que no se usan**:

| Parametro | Descripcion | Valor |
|---|---|---|
| `video_length` | Duracion (15, 30, 45, 60 seg) | No expuesto |
| `target_audience` | Audiencia objetivo (texto libre) | Se envia pero no se captura del usuario |
| `override_script` | Script personalizado | No disponible |
| `override_avatar` | Avatar personalizado para URL-to-Video | No disponible |
| `override_voice` | Voz personalizada para URL-to-Video | No disponible |
| `no_background_music` | Sin musica de fondo | No disponible |
| `no_caption` | Sin subtitulos | No disponible |
| `no_cta` | Sin call-to-action | No disponible |
| `model_version` | Standard / Aurora v1 / Aurora v1 Fast | No disponible |
| `webhook_url` | Callback para status updates | No implementado |
| `caption_setting` | Personalizacion de subtitulos | No disponible |

**Correccion**: Agregar selectores para `video_length`, `target_audience`, y un panel "Avanzado" colapsable con `override_script`, `no_background_music`, `no_caption`, `model_version`.

---

## 6. Response handling incompleto

**Problema**: El output del video usa `job.output.output` pero la API de `/link_to_videos/` retorna:
- `video_output` (URL del video final)
- `video_thumbnail` (thumbnail)
- `preview` / `previews` (previews antes de renderizar)
- `editor_url` (link al editor de Creatify, expira en 24h)
- `credits_used` (creditos consumidos)
- `duration` (duracion real)
- `outputs[]` (multiples outputs con status individual)

**Correccion**: Actualizar el polling y la UI para leer `video_output` en vez de `output`, y mostrar `video_thumbnail`, `credits_used`, `duration`, y link al `editor_url`.

---

## 7. `OBJECTIVE_SCRIPT_STYLE` mapping limitado

**Problema actual** (5 mappings):
```
brand_awareness -> BrandStoryV2
lead_generation -> CallToActionV2
sales -> SpecialOffersV2
engagement -> DiscoveryWriter
education -> HowToV2
```

**Mappings faltantes sugeridos**:
```
traffic -> ProblemSolutionV2
conversions -> BenefitsV2
product_launch -> ProductHighlightsV2
viral -> NegativeHook o SecretHook
community -> EmotionalWriter
retention -> MotivationalWriter
```

---

## 8. Credits tracking ausente

**Problema**: La API retorna `credits_used` en cada respuesta pero no se persiste ni se muestra.

**Correccion**: Guardar `credits_used` en `creatify_jobs.output_data` y agregar un contador de creditos consumidos en la galeria/dashboard.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `supabase/functions/creatify-proxy/index.ts` | Corregir endpoint `/link_to_videos/`, renombrar `link_id`->`link`, guardar `credits_used` |
| `supabase/functions/marketing-hub-video-creator/index.ts` | Corregir endpoint de `/lipsyncs/` a `/link_to_videos/` |
| `src/lib/api/creatify.ts` | Agregar `video_length`, `target_audience`, `override_script`, `model_version` a tipos. Agregar mappings de `OBJECTIVE_SCRIPT_STYLE`. Actualizar `createUrlToVideo` params |
| `src/components/company/creatify/VideoGenerationForm.tsx` | Agregar selector visual_style real, video_length, target_audience. Corregir lectura de `video_output` en vez de `output`. Panel avanzado colapsable |
| `src/components/company/creatify/GenerationStatusTracker.tsx` | Mostrar `credits_used`, `duration`, thumbnail |
| `src/hooks/useCreatifyJob.ts` | Leer `video_output` ademas de `output` para compatibilidad |
| `public/locales/{es,en,pt}/creatify.json` | Agregar traducciones para nuevos script styles, visual styles, y parametros |

---

## Impacto esperado

- **Funcionalidad**: De usar un endpoint incorrecto a alineacion completa con la API oficial
- **Opciones creativas**: De 5 script styles a 15+, de 0 visual styles a 10+
- **Control del usuario**: Duracion de video, audiencia, opciones avanzadas
- **Fiabilidad**: Response handling correcto para `video_output`, credits tracking
- **Competitividad**: Acceso al 90%+ de las capacidades de Creatify vs el ~30% actual
