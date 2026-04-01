

# Funcionalidades con Código Mock/Predefinido — Análisis Detallado

## Hallazgos organizados por severidad

---

### SEVERIDAD CRÍTICA — Funcionalidad que aparenta funcionar pero no hace nada real

**1. Contacto.tsx — Formulario simulado, no envía emails**
- Línea 34: `await new Promise(resolve => setTimeout(resolve, 500))` — simula envío
- Muestra toast de éxito pero el mensaje del usuario se pierde completamente
- No invoca ninguna edge function ni sistema de email interno
- **Impacto**: Los leads/contactos de usuarios potenciales se pierden

**2. NotificationPreferences.tsx — Guardar preferencias es falso**
- Línea 49-50: `// TODO: Save to database when notification_preferences table exists` seguido de `setTimeout(500ms)`
- Muestra "Guardado exitosamente" pero no persiste nada — las preferencias se resetean al recargar
- **Impacto**: El usuario cree que configuró sus notificaciones pero nada funciona

**3. MarketingCalendar.tsx — 100% datos mock, sin conexión a DB**
- Líneas 40-66: Array hardcodeado con 3 posts ficticios (fechas de enero 2024)
- No consulta `social_posts` ni `calendar_items` ni ninguna tabla real
- No tiene `useTranslation` — todo hardcodeado en español
- Dark mode roto (`bg-blue-100 text-blue-800`, etc.)
- **Nota**: No se importa desde ningún componente activo — posible código muerto

**4. SocialAutomationRules.tsx — Reglas solo en memoria (useState)**
- Líneas 52-62: Las reglas de automatización se guardan en `useState<AutomationRule[]>([])` local
- No hay `useEffect` para cargar ni `supabase` para guardar
- Al recargar la página, todas las reglas desaparecen
- **Impacto**: El usuario crea reglas de automatización que nunca se ejecutan ni persisten

**5. useCompanyCredits.ts — Límite de créditos hardcodeado**
- Línea 70: `const totalCredits = 100; // TODO: Get from subscription plan`
- Todo usuario ve "100 créditos" independientemente de su plan de suscripción
- No hay tabla ni lógica para obtener créditos reales del plan

**6. UnifiedContentCreator.tsx — Biblioteca y Selector de imágenes son stubs**
- Línea 556: Tab "Biblioteca" muestra solo `"Biblioteca de contenido generado (próximamente)"`
- Línea 567: Selector de imágenes muestra solo `"Selector de imágenes (próximamente)"` con botón "Cerrar"
- Strings hardcodeadas en español sin i18n

---

### SEVERIDAD ALTA — Funcionalidad parcialmente implementada

**7. AcademiaBuildera.tsx — Tab "Leaderboard" es placeholder**
- Líneas 202-207: Muestra "Ranking en Desarrollo" con texto "estará disponible próximamente"
- Hardcodeado en español sin i18n
- El resto de la Academia (módulos, badges, tutor IA) sí funciona con datos reales

**8. InteligenciaHub.tsx — Tab "Mercado" es placeholder**
- Líneas 176-189: Muestra "Próximamente" con descripción genérica
- Las otras tabs (Diagnóstico, Competidores) sí funcionan

**9. MarketingMetrics.tsx — Gráfico de rendimiento semanal es placeholder**
- Líneas 497-504: Muestra "Gráfico de rendimiento semanal — Próximamente: Integración con Chart.js"
- El componente ya importa datos reales de Supabase para las métricas numéricas, pero el chart visual es un stub
- **Nota**: Parece no estar importado activamente (posible código muerto)

**10. SocialMediaPreview.tsx — Usa imagen dummy de Unsplash**
- Línea 73: `dummyImage = "https://images.unsplash.com/photo-..."` — se usa como fallback cuando no hay media
- Línea 172: `mockUser = getUserData()` — datos de usuario simulados para la preview social
- Esto es aceptable como fallback visual pero depende de un servicio externo (Unsplash)

**11. AutonomyDashboardPreview.tsx — 100% mock (intencional)**
- Líneas 21-56: Datos estáticos de departamentos, aprobaciones, guardrails, logs, capacidades
- Es un componente de la landing page (`Index.tsx`) — diseñado para ser una preview visual
- **Veredicto**: Correcto como está. Es marketing, no funcionalidad real

---

### SEVERIDAD MEDIA — Código muerto o no conectado

**12. MarketingCalendar.tsx — Probablemente código muerto**
- No se importa desde ningún archivo activo
- Duplica funcionalidad de `ContentCalendar.tsx` que sí está integrado en el Marketing Hub

**13. MarketingMetrics.tsx — Probablemente código muerto**
- No se importa desde ningún componente activo
- Duplica funcionalidad del overview del Marketing Hub

**14. MarketingHubInsights.tsx — Código muerto**
- No se importa desde ningún archivo
- 1078 líneas de código no utilizado

---

## Plan de Corrección (6 pasos)

### Paso 1: Conectar Contacto.tsx al sistema de email interno
- Reemplazar el `setTimeout` mock por una invocación a una edge function de email
- Usar el sistema de email propietario de Buildera (según las instrucciones del proyecto)
- Guardar el contacto en una tabla `contact_submissions` para seguimiento

### Paso 2: Crear tabla y conectar NotificationPreferences
- Crear migración para tabla `notification_preferences` (user_id, settings jsonb)
- Reemplazar el `setTimeout` por `supabase.from('notification_preferences').upsert()`
- Cargar preferencias guardadas al montar el componente

### Paso 3: Persistir SocialAutomationRules en base de datos
- Crear tabla `social_automation_rules` (id, company_id, name, trigger, action, config, is_active)
- Agregar `loadRules()` en `useEffect` y `saveRule()` en handlers
- Las reglas deben persistir entre sesiones

### Paso 4: Hacer dinámico el límite de créditos
- Crear lógica para obtener créditos del plan de suscripción del usuario
- Reemplazar `const totalCredits = 100` por consulta real a la tabla de suscripciones/planes

### Paso 5: Eliminar componentes muertos
- Eliminar `MarketingCalendar.tsx` (367 líneas — duplicado por ContentCalendar)
- Eliminar `MarketingHubInsights.tsx` (1078 líneas — no importado)
- Verificar `MarketingMetrics.tsx` y eliminar si confirma que no se usa

### Paso 6: Resolver stubs "próximamente" en componentes activos
- `UnifiedContentCreator.tsx`: Conectar tab Biblioteca con `UnifiedLibrary` existente; conectar selector de imágenes con `ContentImageSelector` existente
- `AcademiaBuildera.tsx`: Implementar leaderboard con datos de `user_learning_progress` o mostrar un coming soon con i18n correcto
- `MarketingMetrics.tsx` (si se mantiene): Integrar Recharts para el gráfico semanal (ya se usa en UTMDashboard)

---

## Resumen

| # | Componente | Problema | Severidad |
|---|-----------|----------|-----------|
| 1 | Contacto.tsx | Formulario no envía nada | Crítica |
| 2 | NotificationPreferences.tsx | No persiste preferencias | Crítica |
| 3 | MarketingCalendar.tsx | 100% mock + código muerto | Crítica/Muerto |
| 4 | SocialAutomationRules.tsx | Reglas solo en memoria | Crítica |
| 5 | useCompanyCredits.ts | Créditos hardcodeados en 100 | Crítica |
| 6 | UnifiedContentCreator.tsx | 2 tabs son stubs | Alta |
| 7 | AcademiaBuildera.tsx | Leaderboard placeholder | Alta |
| 8 | InteligenciaHub.tsx | Tab Mercado placeholder | Alta |
| 9 | MarketingMetrics.tsx | Chart stub + posible muerto | Alta |
| 10 | SocialMediaPreview.tsx | Imagen fallback externa | Media |
| 11 | MarketingHubInsights.tsx | Código muerto (1078 líneas) | Media |

