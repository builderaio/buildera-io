

# Plan: Alinear integracion Upload-Post con API oficial y mejores practicas

## Resumen de hallazgos

Tras analizar la documentacion oficial de Upload-Post (`docs.upload-post.com/api/reference`) y compararla con la implementacion actual en `upload-post-manager/index.ts`, se detectaron multiples gaps criticos y oportunidades de mejora.

---

## 1. Endpoint de Video incorrecto (CRITICO)

**Problema**: El codigo usa `POST /api/upload_videos` pero la documentacion oficial dice `POST /api/upload`.

- Linea 842: `fetch('https://api.upload-post.com/api/upload_videos'` -- INCORRECTO
- La API real es: `POST https://api.upload-post.com/api/upload`

**Correccion**: Cambiar el endpoint de video de `/api/upload_videos` a `/api/upload`.

---

## 2. Header de Authorization inconsistente (CRITICO)

**Problema**: Se usan 3 formatos distintos de Authorization header en el mismo archivo:

- `ApiKey ${apiKey}` (lineas 182, 221, etc.)
- `Api-Key ${apiKey}` (linea 557 -- getFacebookPages)
- `Apikey ${apiKey}` (lineas 806, 827, etc. -- upload endpoints)

**Documentacion oficial**: `Authorization: Apikey your-api-key-here` (con A mayuscula, resto minuscula)

**Correccion**: Estandarizar TODOS los headers a `Apikey ${apiKey}`.

---

## 3. Parametros faltantes en uploads

### 3.1 `description` (campo global)

**Problema**: El proxy nunca envia el campo `description` que la API usa para:
- LinkedIn: commentary
- YouTube: video description  
- Facebook: description
- Pinterest: pin notes
- Reddit: post body

Actualmente el codigo combina title + content en un solo campo `title` para videos (linea 838), perdiendo la separacion semantica.

**Correccion**: Enviar `description` como campo separado en FormData para todos los tipos de post.

### 3.2 `first_comment`

**Problema**: No se soporta. La API permite publicar un primer comentario automatico en Instagram, Facebook, Threads, Bluesky, Reddit, X y YouTube.

**Correccion**: Agregar campo `first_comment` al publisher y al proxy.

### 3.3 `timezone`

**Problema**: No se envia. Las fechas programadas se interpretan como UTC por defecto.

**Correccion**: Detectar la timezone del navegador del usuario y enviarla con `scheduled_date`.

### 3.4 `add_to_queue`

**Problema**: No se soporta el sistema de Queue. Es una alternativa a `scheduled_date` que asigna automaticamente el post al siguiente slot disponible.

**Correccion**: Agregar opcion "Agregar a cola" en el publisher como tercera opcion junto a "Inmediato" y "Programado".

---

## 4. Parametros platform-specific no expuestos

### 4.1 Platform-specific titles

**Problema**: Se envia un unico `title` para todas las plataformas. La API permite `instagram_title`, `linkedin_title`, `x_title`, `facebook_title`, `tiktok_title`, etc.

**Correccion**: Agregar panel colapsable "Personalizar por plataforma" en el publisher.

### 4.2 Parametros de plataforma criticos faltantes

| Plataforma | Parametro | Descripcion | Impacto |
|---|---|---|---|
| Instagram | `media_type` | REELS vs STORIES vs IMAGE | Alto - usuarios no pueden elegir tipo |
| Instagram | `collaborators` | Colaboradores | Medio |
| TikTok | `privacy_level` | Privacidad del post | Alto |
| TikTok | `is_aigc` | Marca contenido como IA | Legal/Compliance |
| YouTube | `tags[]` | Tags del video | SEO |
| YouTube | `privacyStatus` | public/unlisted/private | Alto |
| YouTube | `categoryId` | Categoria | Medio |
| YouTube | `containsSyntheticMedia` | AI transparency | Legal |
| Facebook | `facebook_media_type` | REELS vs STORIES vs VIDEO | Alto |
| Pinterest | `pinterest_board_id` | Board destino | Critico - requerido |
| Pinterest | `pinterest_link` | URL destino | Medio |
| Reddit | `subreddit` | Subreddit destino | Critico - requerido |
| Reddit | `flair_id` | Flair del post | Medio |

**Correccion**: Agregar selector de parametros especificos segun plataformas seleccionadas.

---

## 5. Plataformas faltantes en el filtro

**Problema**: `filterPlatformsByPostType` no incluye `reddit` en las plataformas soportadas para text, photo y video.

**Codigo actual**:
```
text: ['linkedin', 'x', 'facebook', 'threads', 'reddit', 'bluesky']  -- OK
photo: ['tiktok', 'instagram', 'linkedin', 'facebook', 'x', 'threads', 'pinterest', 'bluesky'] -- FALTA reddit
video: ['tiktok', 'instagram', 'linkedin', 'youtube', 'facebook', 'twitter', 'threads', 'pinterest', 'bluesky'] -- FALTA reddit, usa 'twitter' en vez de 'x'
```

**Correccion**: Agregar `reddit` a photo y video. Cambiar `twitter` a `x` en video (consistencia, pero mantener backward compat con el API que acepta ambos para video).

---

## 6. `validateToken` funcion rota (BUG)

**Problema critico**: La funcion `validateToken` tiene llaves mal cerradas. En linea 1061 se cierra la funcion prematuramente con `}` pero el `try/catch` del token validation continua desde linea 1218.

```
async function validateToken(data: any) {
  const { token } = data || {};
  if (!token) {
    return { success: false, error: 'Missing token' };
}    // <-- cierra la funcion aqui

// Codigo suelto fuera de cualquier funcion:
  try {
    const response = await fetch('...');
    ...
  }
}
```

**Correccion**: Cerrar correctamente la funcion envolviendo todo el bloque.

---

## 7. Analytics API no integrada en el proxy principal

**Problema**: Existe una edge function separada `get-upload-post-analytics` pero no esta integrada como accion del `upload-post-manager`. Esto fragmenta la logica.

**Correccion**: Agregar accion `get_analytics` al switch del manager para centralizacion, o documentar que es intencionalmente separada.

---

## 8. Respuesta de upload no parseada completamente

**Problema**: La respuesta de la API incluye campos utiles que no se persisten:

- `usage.count` / `usage.limit` (creditos consumidos vs limite)
- Per-platform `url`, `post_id`, `publish_id` (links directos al post publicado)
- `request_id` (para async uploads -- se retorna pero no se persiste en DB)

**Correccion**: Persistir `request_id` y `usage` en `scheduled_social_posts.upload_post_response`, y mostrar links directos a posts publicados en la UI.

---

## 9. Video upload: soporte de media type

**Problema**: Para videos, el codigo solo envia `video=URL`. No soporta:
- Instagram Stories (`media_type: "STORIES"`)
- Facebook Stories (`facebook_media_type: "STORIES"`)
- Facebook Videos normales (`facebook_media_type: "VIDEO"`)

**Correccion**: Agregar selector de tipo de contenido por plataforma (Reel vs Story vs Video normal).

---

## Archivos a modificar

| Archivo | Cambio | Prioridad |
|---|---|---|
| `supabase/functions/upload-post-manager/index.ts` | Fix endpoint video, fix Auth headers, fix validateToken bug, agregar `description`, `first_comment`, `timezone`, `add_to_queue`, platform-specific params, fix filtro plataformas | Critica |
| `src/components/company/SimpleContentPublisher.tsx` | Agregar campos: first_comment, timezone, add_to_queue, panel platform-specific params, selector media_type (Reel/Story/Video) | Alta |
| `public/locales/{es,en,pt}/marketing.json` | Traducciones para nuevos campos | Media |

---

## Impacto esperado

- **Fiabilidad**: Fix de endpoint video + Auth headers + validateToken bug = publicaciones de video que actualmente pueden fallar pasaran a funcionar
- **Funcionalidad**: De ~60% de los parametros de la API a ~90%
- **UX**: First comment, queue system, platform-specific titles y parametros por plataforma
- **Compliance**: Soporte de `is_aigc` (TikTok) y `containsSyntheticMedia` (YouTube) para transparencia de contenido IA
- **Competitividad**: Exposicion de capacidades avanzadas como Trial Reels, X Threads, Reddit flairs y Pinterest boards

