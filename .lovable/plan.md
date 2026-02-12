

# Maximizar el Uso de la API de Upload-Post

## Analisis Comparativo: APIs Disponibles vs Implementadas

| API | Endpoint | Estado | Valor para el usuario |
|---|---|---|---|
| Video Upload | `POST /api/upload_videos` | Parcial (usa `/api/upload` legacy) | Publicar videos en 9 plataformas |
| Photo Upload | `POST /api/upload_photos` | Implementado | Publicar fotos/carruseles |
| Text Upload | `POST /api/upload_text` | Implementado | Publicar texto |
| Upload Status | `GET /api/uploadposts/status` | Implementado | Monitoreo de publicaciones |
| Upload History | `GET /api/uploadposts/history` | Implementado | Historial |
| Schedule Management | `GET/DELETE /api/uploadposts/schedule` | Implementado | Programar/cancelar |
| Analytics | `GET /api/analytics/{profile}` | Implementado | Metricas por plataforma |
| Facebook Pages | `GET /api/uploadposts/facebook/pages` | Implementado | Seleccion de pagina |
| LinkedIn Pages | `GET /api/uploadposts/linkedin/pages` | Implementado | Seleccion de pagina |
| Pinterest Boards | `GET /api/uploadposts/pinterest/boards` | Implementado | Seleccion de tablero |
| User Profiles | `POST/GET/DELETE` | Implementado | Gestion de perfiles |
| JWT / Validate | `POST generate-jwt / validate-jwt` | Implementado | Autenticacion |
| **Instagram Media List** | `GET /api/uploadposts/media` | **NO IMPLEMENTADO** | Ver posts de Instagram |
| **Instagram Comments** | `GET/POST /api/uploadposts/comments` | **NO IMPLEMENTADO** | Leer y responder comentarios |
| **Instagram DMs** | `POST/GET /api/uploadposts/dms` | **NO IMPLEMENTADO** | Mensajes directos |
| **Current User / Me** | `GET /api/uploadposts/me` | **NO IMPLEMENTADO** | Validar plan y API key |

---

## APIs Sin Aprovechar y su Valor

### 1. Instagram Interactions (ALTO IMPACTO)

Estas 3 APIs representan la mayor oportunidad sin explotar. Permiten construir un **Community Manager automatizado** directamente dentro de Buildera:

**Instagram Media List** (`GET /api/uploadposts/media`)
- Listar posts, reels y carruseles recientes de la cuenta de Instagram
- Obtener media IDs, captions, permalinks, timestamps
- Base para todas las demas interacciones de Instagram

**Instagram Comments** (`GET /api/uploadposts/comments` + `POST /api/uploadposts/comments/reply`)
- Leer comentarios de cualquier post de Instagram
- Enviar respuestas privadas (DMs) a quienes comentan
- Requiere permiso `instagram_business_manage_comments`
- Caso de uso: responder automaticamente con IA a comentarios, detectar oportunidades de venta

**Instagram DMs** (`POST /api/uploadposts/dms/send` + `GET /api/uploadposts/dms/conversations`)
- Enviar mensajes directos a usuarios por IGSID
- Recuperar conversaciones de DMs
- Ventana de 24 horas de Instagram para mensajes
- Caso de uso: seguimiento a leads, soporte al cliente, nurturing

### 2. Current User API (BAJO ESFUERZO)

`GET /api/uploadposts/me` permite validar la API key y verificar el plan de suscripcion. Util para:
- Mostrar al usuario su plan actual y limites
- Validar que la API key sigue activa antes de operaciones costosas
- Prevenir errores silenciosos por API key expirada

### 3. Video Upload Endpoint Incorrecto

El codigo actual usa `/api/upload` (legacy) en lugar de `/api/upload_videos` (documentado). Esto podria causar incompatibilidades con plataformas nuevas como Bluesky y Pinterest para video.

### 4. Plataformas faltantes en el filtrado

El filtrado de plataformas en `filterPlatformsByPostType` no incluye **Bluesky** ni **Reddit** para texto, ni **Bluesky** para fotos/videos, a pesar de que Upload-Post las soporta.

---

## Plan de Implementacion

### Fase 1: Correcciones rapidas (bajo esfuerzo, alto impacto)

**1.1 Corregir endpoint de video**
- Cambiar `/api/upload` a `/api/upload_videos` en `postContent()`
- Archivo: `supabase/functions/upload-post-manager/index.ts` linea 744

**1.2 Agregar plataformas faltantes al filtrado**
- Agregar `bluesky` a text, photo y video
- Agregar `reddit` a text
- Archivo: `supabase/functions/upload-post-manager/index.ts` lineas 593-597

**1.3 Agregar accion `get_current_user`**
- Nueva accion en el switch del edge function
- Llama a `GET /api/uploadposts/me`
- Se usa en el Marketing Hub para mostrar estado de la cuenta Upload-Post

### Fase 2: Instagram Community Manager (alto impacto)

**2.1 Nuevas acciones en `upload-post-manager`**

Agregar 4 acciones al switch existente:
- `get_instagram_media` -> `GET /api/uploadposts/media?profile={username}`
- `get_instagram_comments` -> `GET /api/uploadposts/comments?media_id={id}` o `?post_url={url}`
- `reply_instagram_comment` -> `POST /api/uploadposts/comments/reply` (envia DM al comentarista)
- `send_instagram_dm` -> `POST /api/uploadposts/dms/send`
- `get_instagram_conversations` -> `GET /api/uploadposts/dms/conversations?profile={username}`

**2.2 Nuevo componente: `InstagramCommunityManager.tsx`**

Interfaz con 3 secciones:
- **Posts recientes**: Grid de los ultimos posts con metricas (likes, comments)
- **Comentarios**: Al hacer click en un post, ver comentarios con opcion de responder (reply publico via DM)
- **Bandeja de DMs**: Lista de conversaciones activas con respuesta inline

**2.3 Integracion en el Marketing Hub**

Agregar como nueva seccion dentro del tab "Panel" o como un sub-tab en "Biblioteca":
- Accesible cuando Instagram esta conectado
- Muestra badge de notificacion con comentarios sin responder
- Opcion de respuesta asistida por IA (usar el ADN de la empresa para generar respuestas on-brand)

### Fase 3: i18n

Agregar todas las nuevas claves de traduccion a `marketing.json` en ES, EN y PT para:
- Labels del Community Manager
- Estados de conexion
- Mensajes de error y confirmacion

---

## Detalles Tecnicos

### Cambios en `upload-post-manager/index.ts`

Agregar al switch (linea 50-100):
```text
case 'get_current_user':
  result = await getCurrentUser(apiKey);
  break;
case 'get_instagram_media':
  result = await getInstagramMedia(apiKey, data);
  break;
case 'get_instagram_comments':
  result = await getInstagramComments(apiKey, data);
  break;
case 'reply_instagram_comment':
  result = await replyInstagramComment(apiKey, data);
  break;
case 'send_instagram_dm':
  result = await sendInstagramDM(apiKey, data);
  break;
case 'get_instagram_conversations':
  result = await getInstagramConversations(apiKey, data);
  break;
```

### Nuevas funciones en el edge function

- `getCurrentUser(apiKey)` -> `GET /api/uploadposts/me`
- `getInstagramMedia(apiKey, data)` -> `GET /api/uploadposts/media?profile={username}`
- `getInstagramComments(apiKey, data)` -> `GET /api/uploadposts/comments?media_id={id}&profile={username}`
- `replyInstagramComment(apiKey, data)` -> `POST /api/uploadposts/comments/reply` con `{ media_id, comment_id, message, profile }`
- `sendInstagramDM(apiKey, data)` -> `POST /api/uploadposts/dms/send` con `{ recipient_id, message, profile }`
- `getInstagramConversations(apiKey, data)` -> `GET /api/uploadposts/dms/conversations?profile={username}`

### Nuevos archivos

1. `src/components/company/instagram/InstagramCommunityManager.tsx` - Componente contenedor
2. `src/components/company/instagram/InstagramPostGrid.tsx` - Grid de posts recientes
3. `src/components/company/instagram/InstagramCommentViewer.tsx` - Visor de comentarios con respuesta
4. `src/components/company/instagram/InstagramDMInbox.tsx` - Bandeja de mensajes directos

### Archivos a modificar

1. `supabase/functions/upload-post-manager/index.ts` - Agregar 6 acciones nuevas + corregir video endpoint + ampliar plataformas
2. `src/components/company/MarketingHubWow.tsx` - Integrar Instagram Community Manager
3. `public/locales/es/marketing.json` - Traducciones ES
4. `public/locales/en/marketing.json` - Traducciones EN
5. `public/locales/pt/marketing.json` - Traducciones PT

### Componente InstagramCommunityManager - Estructura

```text
+--------------------------------------------+
|  Instagram Community Manager               |
|                                            |
|  [Posts] [Comentarios] [Mensajes]          |
|                                            |
|  +--------+ +--------+ +--------+         |
|  | Post 1 | | Post 2 | | Post 3 |         |
|  | 24 com | | 12 com | | 8 com  |         |
|  +--------+ +--------+ +--------+         |
|                                            |
|  Comentarios de Post 1:                    |
|  - @user1: "Me encanta!"  [Responder DM]  |
|  - @user2: "Precio?"      [Responder DM]  |
|  - @user3: "Disponible?"  [Responder DM]  |
|                                            |
|  [Sugerir respuesta con IA]               |
+--------------------------------------------+
```

