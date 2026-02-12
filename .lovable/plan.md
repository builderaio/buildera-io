

# Rediseno de Layout, Arquitectura de Informacion y Diseno Visual

## Diagnostico: Problemas Detectados

Tras auditar todos los modulos, he identificado **3 categorias de problemas** que desconectan la experiencia actual de la propuesta de valor de la plataforma.

---

### A. i18n Roto y Textos Hardcoded

**Problema critico**: La landing page muestra las claves de traduccion en crudo (`hero.title`, `hero.badge`, `header.login`) en vez del texto real. Esto significa que los visitantes ven texto sin sentido.

Ademas, multiples componentes internos tienen strings en espanol hardcoded que violan la politica de internacionalizacion:

| Componente | Textos hardcoded encontrados |
|---|---|
| BusinessHealthDashboard | "Objetivo Estrategico", "Progreso de Objetivos", "Agentes Rapidos", "Actividad Reciente", "Puntuacion de Salud", "de 100 puntos", "Ver Diagnostico Completo", "Recomendacion destacada", "No tienes objetivos definidos", "Definir Objetivos", "Sin actividad reciente", "No hay agentes habilitados", "Explorar agentes", "Editar", "Ver todos", "agentes", "creditos" |
| ResponsiveLayout (Sidebar) | "AI Business Platform", "BUILDERA", "Mi Empresa", "Creditos:", "cr" |
| WhiteLabelDashboard | Completamente en ingles sin i18n |
| AdminLayout | Hardcoded en espanol: "Sesion cerrada", "Portal Admin", "Buildera", etc. |

---

### B. Arquitectura de Informacion Desalineada

**1. Sidebar no refleja la propuesta de valor**
- 4 items genericos (Comando, Marketing, Agentes, Mi Negocio) sin indicar el diferencial: automatizacion autonoma
- No hay indicador del estado del Autopilot (activo/inactivo)
- La etiqueta "AI Business Platform" es generica y no comunica valor
- Los emojis (casa, megafono, robot, edificio) son informales para una plataforma B2B

**2. Marketing Hub sobrecargado**
- 11 tabs en una sola barra: Dashboard, Crear, Campanas, Listening, UTM, Reports, Automation, Approvals, Autopilot, Calendar, Library
- En mobile, imposible de navegar (overflow horizontal)
- El Autopilot (la funcionalidad mas poderosa) esta en la posicion 9 de 11
- No hay agrupacion logica (creacion vs analisis vs automatizacion)

**3. Header de la landing page**
- No incluye enlace a Pricing (existe la pagina pero no esta en el menu)
- Falta menu hamburguesa en mobile (los links se ocultan con `hidden md:flex`)
- No refleja la nueva narrativa del Marketing Autopilot

**4. Dashboard (Comando) desconectado del Autopilot**
- No muestra el estado del autopilot (activo/pausado/ejecutando)
- No muestra las ultimas decisiones autonomas tomadas
- No hay acceso directo a activar/configurar el autopilot

---

### C. Consistencia Visual y de Diseno

- Cards de metricas del Marketing Hub usan gradientes pesados (`from-card to-muted/30`) mientras el Dashboard usa cards planas
- Los headers de cards del Marketing Hub tienen gradientes de colores fuertes (green-600, pink-600) que no son del brand palette (#3c46b2, #f15438)
- Tipografia: el font heading `DOCKER ONE` no esta aplicado consistentemente en todos los titulos

---

## Plan de Implementacion

### Paso 1: Corregir i18n de la Landing Page
**Prioridad: CRITICA** - Los visitantes ven texto roto

Investigar por que las traducciones del namespace `landing` no se cargan. El archivo `public/locales/es/landing.json` existe y tiene contenido valido. El problema puede estar en:
- La importacion de `src/i18n/config.ts` en `main.tsx`
- Un problema de carga asincrona del backend HTTP

**Archivos**: `src/main.tsx`, `src/i18n/config.ts`

### Paso 2: Internacionalizar BusinessHealthDashboard
Mover los ~17 strings hardcoded a claves i18n en `common.json` / `company.json`

**Archivos**: `src/components/company/BusinessHealthDashboard.tsx`, `public/locales/[es|en|pt]/common.json`

### Paso 3: Redisenar Sidebar con enfoque en Autopilot
- Reemplazar emojis por iconos Lucide profesionales
- Agregar indicador visual del estado del Autopilot (punto verde = activo, ambar = pausado)
- Cambiar "AI Business Platform" por subtitulo dinamico con estado: "Autopilot: Activo" o "Autopilot: Inactivo"
- Mantener los 4 pilares pero con labels mas descriptivos

```text
Antes:                     Despues:
casa Comando               Activity  Centro de Comando
megafono Marketing          Megaphone Marketing Hub
robot Agentes              Bot       Agentes IA
edificio Mi Negocio        Building  Mi Negocio
                           [Estado Autopilot: Activo]
```

**Archivos**: `src/components/ResponsiveLayout.tsx`

### Paso 4: Reorganizar Marketing Hub Tabs
Agrupar los 11 tabs en 3 secciones logicas con sub-navegacion:

```text
Tabs principales (5):
  Dashboard | Crear | Campanas | Calendario | Autopilot

Dentro de Dashboard:
  - Metricas
  - Biblioteca (Library)
  - Reportes

Dentro de Autopilot:
  - Estado y Timeline
  - Automation Rules
  - Approvals
  - Listening
  - UTM/Attribution
```

Esto reduce la barra de tabs de 11 a 5, hace el Autopilot prominente, y agrupa funcionalidades relacionadas.

**Archivos**: `src/components/company/MarketingHubWow.tsx`

### Paso 5: Agregar Estado Autopilot al Dashboard (Comando)
Insertar una card prominente en el dashboard que muestre:
- Estado actual del autopilot (activo/inactivo/ejecutando)
- Ultima ejecucion y sus resultados
- Boton de activar/configurar si esta inactivo
- Proxima ejecucion programada

**Archivos**: `src/components/company/BusinessHealthDashboard.tsx`

### Paso 6: Actualizar Header de Landing Page
- Agregar enlace a `/pricing` en la navegacion
- Implementar menu hamburguesa para mobile
- Asegurar que el logo Buildera se muestra correctamente

**Archivos**: `src/components/Header.tsx`

### Paso 7: Normalizar paleta de colores
Reemplazar los gradientes arbitrarios del Marketing Hub (green-600, pink-600, purple-600) por la paleta oficial:
- Primary: #3c46b2 (cerulean blue)
- Secondary/Accent: #f15438 (orange-red)
- Neutrales para cards: bg-card con bordes sutiles

**Archivos**: `src/components/company/MarketingHubWow.tsx`

### Paso 8: Internacionalizar componentes restantes
- ResponsiveLayout sidebar strings
- WhiteLabelDashboard (completo)
- AdminLayout strings

**Archivos**: Multiples archivos + locales

---

## Secuencia de Ejecucion

| Paso | Prioridad | Dependencia |
|------|-----------|-------------|
| 1. Fix i18n landing | CRITICA | Ninguna |
| 2. i18n BusinessHealthDashboard | Alta | Ninguna |
| 3. Rediseno Sidebar + Autopilot indicator | Alta | Ninguna |
| 4. Reorganizar Marketing Hub tabs | Media | Paso 3 |
| 5. Autopilot card en Dashboard | Media | Paso 3 |
| 6. Header landing + mobile menu | Media | Paso 1 |
| 7. Normalizar colores | Baja | Paso 4 |
| 8. i18n componentes restantes | Baja | Pasos 2-3 |

---

## Resultado Esperado

Tras estas mejoras:
- La landing page mostrara contenido real en vez de claves i18n
- El sidebar comunicara inmediatamente que la plataforma tiene un motor autonomo de marketing
- El Marketing Hub sera navegable en mobile con 5 tabs en vez de 11
- El Dashboard mostrara el estado del Autopilot como funcionalidad central
- Los colores estaran alineados con la marca Buildera
- Todos los textos estaran internacionalizados en ES/EN/PT

