# Auditoria Estructural del Portal Administrativo

## Estado Actual

El portal admin tiene **6 paginas activas con ruta** y **12 paginas huerfanas** (existen como archivos pero no tienen ruta ni import en App.tsx). La navegacion del sidebar solo muestra 6 items organizados en 3 grupos (Negocio, Agentes, Plataforma).

### Paginas con Ruta Activa


| Pagina                | Ruta                       | Funcion                                                            |
| --------------------- | -------------------------- | ------------------------------------------------------------------ |
| AdminDashboard        | `/admin/dashboard`         | KPIs basicos, alertas, quick actions                               |
| AdminCustomers        | `/admin/customers`         | Usuarios, empresas, suscripciones (3 tabs)                         |
| AdminAgentBuilder     | `/admin/agent-builder`     | Crear/editar agentes de plataforma                                 |
| AdminAgentPerformance | `/admin/agent-performance` | Uso y rendimiento de agentes                                       |
| AdminAIConfig         | `/admin/ai-config`         | Proveedores IA, modelos, funciones, monitoring, champion-challenge |
| AdminSystem           | `/admin/system`            | Email y base de datos (2 tabs)                                     |


### Paginas Huerfanas (12 archivos sin ruta, sin import)

- `AdminAnalytics.tsx` (677 lineas)
- `AdminAIMonitoring.tsx`
- `AdminAPIKeys.tsx`
- `AdminChampionChallenge.tsx`
- `AdminFunctionConfig.tsx`
- `AdminAgentUsage.tsx`
- `AdminDatabase.tsx`
- `AdminEmailSystem.tsx`
- `AdminSubscriptions.tsx`
- `AdminUsers.tsx`
- `AdminCompanies.tsx`
- `AdminLogin.tsx` (este SI tiene ruta, es la excepcion)

---

## Brechas Identificadas

### BRECHA 1: AdminAIConfig no usa AdminLayout (INCONSISTENCIA UX)

`AdminAIConfig.tsx` renderiza su propio header custom con botones de navegacion en vez de usar `AdminLayout` como las demas paginas. Esto rompe la consistencia del sidebar y la navegacion.

**Solucion**: Refactorizar para usar `AdminLayout` + `AdminPageHeader`, como hacen `AdminCustomers`, `AdminAgentPerformance` y `AdminSystem`.

### BRECHA 2: No hay visibilidad del Autopilot Enterprise (CRITICO)

El admin no tiene ninguna vista para monitorear el estado del Autopilot:

- No ve cuantas empresas tienen autopilot activo
- No ve los ciclos de ejecucion (tabla `autopilot_decisions`)
- No ve las lecciones aprendidas (`autopilot_memory`)
- No ve los departamentos activos (`company_department_config`)

Esto es critico porque el Autopilot es el nucleo del producto.

**Solucion**: Agregar una tab "Autopilot" en el Dashboard o crear una nueva seccion en el sidebar con metricas de ciclos ejecutados, decisiones tomadas, lecciones aprendidas y departamentos activos por empresa.

### BRECHA 3: No hay gestion de creditos a nivel admin (CRITICO)

La tabla `company_credits` existe pero el admin no puede:

- Ver el saldo de creditos de cada empresa
- Asignar creditos manualmente
- Ver el consumo historico de creditos

**Solucion**: Agregar un tab "Creditos" en AdminCustomers o una vista dedicada con la capacidad de ver y ajustar creditos por empresa.

### BRECHA 4: No hay log de seguridad (IMPORTANTE)

La tabla `security_events` registra intentos de login, bloqueos y eventos de seguridad, pero no existe ninguna vista admin para revisar estos eventos. El admin no puede detectar ataques o comportamientos sospechosos.

**Solucion**: Agregar un tab "Seguridad" en AdminSystem con la lista de eventos de seguridad, filtrable por tipo y nivel de riesgo.

### BRECHA 5: Dashboard quickActions apuntan a rutas legacy

Las quickActions del Dashboard (lineas 290-301) incluyen paths como `/admin/agent-usage`, `/admin/ai-monitoring`, `/admin/database`, `/admin/email-system`, `/admin/analytics`. Todos redirigen via redirects en App.tsx, pero la experiencia es suboptima (doble navegacion) y algunos como Analytics ya no se renderizan (redirige al dashboard mismo).

**Solucion**: Actualizar los quickActions para que apunten a las rutas consolidadas correctas.

### BRECHA 6: 12 paginas huerfanas ocupando espacio en el bundle

Los 12 archivos legacy siguen en `src/pages/` sin ser importados. Aumentan el tamano del proyecto y crean confusion.

**Solucion**: Eliminar todos los archivos huerfanos que ya fueron consolidados en las vistas unificadas.

### BRECHA 7: Falta visibilidad del estado del Cron Job del Autopilot

El cron job configurado previamente ejecuta el engine cada hora, pero el admin no tiene forma de verificar si esta funcionando, ver los logs de ejecucion o pausar/reanudar el scheduler.

**Solucion**: En la seccion de Autopilot del admin, mostrar el timestamp de la ultima ejecucion del cron y el estado del job.

### BRECHA 8: No hay vista de onboarding/journey por empresa

El admin no puede ver en que paso del journey se encuentra cada empresa, si estan atascadas, o cual es la tasa de conversion del onboarding.

**Solucion**: Agregar una columna "Journey Step" en la tab de empresas de AdminCustomers y un funnel de conversion en el dashboard.

---

## Plan de Implementacion

### Fase 1: Limpieza y Consistencia (P0)


| #   | Cambio                                                                 | Archivo(s)                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Eliminar 11 paginas huerfanas                                          | `AdminAnalytics.tsx`, `AdminAIMonitoring.tsx`, `AdminAPIKeys.tsx`, `AdminChampionChallenge.tsx`, `AdminFunctionConfig.tsx`, `AdminAgentUsage.tsx`, `AdminDatabase.tsx`, `AdminEmailSystem.tsx`, `AdminSubscriptions.tsx`, `AdminUsers.tsx`, `AdminCompanies.tsx` |
| 2   | Refactorizar AdminAIConfig para usar AdminLayout                       | `AdminAIConfig.tsx`                                                                                                                                                                                                                                              |
| 3   | Corregir quickActions del Dashboard                                    | `AdminDashboard.tsx`                                                                                                                                                                                                                                             |
| 4   | Limpiar user_type references (`developer`, `expert`) en AdminCustomers | `AdminCustomers.tsx`                                                                                                                                                                                                                                             |


### Fase 2: Inteligencia de Negocio Critica (P0)


| #   | Cambio                                                                                                         | Archivo(s)           |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------- |
| 5   | Agregar seccion "Autopilot" al Dashboard con metricas de ciclos, decisiones, lecciones y departamentos activos | `AdminDashboard.tsx` |
| 6   | Agregar tab "Creditos" en AdminCustomers con vista y gestion de creditos por empresa                           | `AdminCustomers.tsx` |
| 7   | Agregar tab "Seguridad" en AdminSystem con log de security_events                                              | `AdminSystem.tsx`    |


### Fase 3: Visibilidad Operativa (P1)


| #   | Cambio                                                        | Archivo(s)           |
| --- | ------------------------------------------------------------- | -------------------- |
| 8   | Agregar columna journey_step y maturity en la tab de empresas | `AdminCustomers.tsx` |
| 9   | Agregar funnel de conversion del onboarding en el Dashboard   | `AdminDashboard.tsx` |


---

## Detalle Tecnico

### 1. Eliminar Paginas Huerfanas

Borrar los 11 archivos que ya no tienen import ni ruta activa. Son vestigios de la consolidacion anterior.

### 2. AdminAIConfig con AdminLayout

```text
// Reemplazar el header custom por:
<AdminLayout>
  <AdminPageHeader
    title="Configuracion IA"
    subtitle="Proveedores, modelos y configuraciones del sistema"
    icon={Brain}
    showBackButton={true}
  />
  <main className="flex-1 p-4 sm:p-6 overflow-auto">
    <UnifiedAIConfiguration />
  </main>
</AdminLayout>
```

### 3. QuickActions Corregidos

```text
quickActions = [
  { title: "Clientes", icon: Users, path: '/admin/customers' },
  { title: "Constructor Agentes", icon: Bot, path: '/admin/agent-builder' },
  { title: "Rendimiento Agentes", icon: Activity, path: '/admin/agent-performance' },
  { title: "Configuracion IA", icon: Brain, path: '/admin/ai-config' },
  { title: "Sistema", icon: Settings, path: '/admin/system' },
];
```

### 4. Seccion Autopilot en Dashboard

Consultar datos reales:

```text
// Empresas con autopilot activo
const { count: autopilotActive } = await supabase
  .from('company_department_config')
  .select('company_id', { count: 'exact', head: true })
  .eq('autopilot_enabled', true);

// Decisiones del ultimo dia
const { data: recentDecisions } = await supabase
  .from('autopilot_decisions')
  .select('id, decision_type, confidence_score, status')
  .gte('created_at', last24h)
  .order('created_at', { ascending: false })
  .limit(20);

// Total lecciones aprendidas
const { count: totalLessons } = await supabase
  .from('autopilot_memory')
  .select('id', { count: 'exact', head: true });
```

Renderizar como seccion en el dashboard con:

- KPI: Empresas con Autopilot Activo
- KPI: Decisiones ultimas 24h
- KPI: Lecciones Aprendidas
- Lista: Ultimas decisiones con tipo, confianza y estado

### 5. Tab Creditos en AdminCustomers

Consultar `company_credits` y mostrar:

- Tabla: Empresa | Creditos Disponibles | Consumidos | Ultima Recarga
- Boton: Asignar Creditos (dialog con input de cantidad)

### 6. Tab Seguridad en AdminSystem

Consultar `security_events` y mostrar:

- Filtros: por event_type y risk_level
- Tabla: Timestamp | Tipo | Detalles | Nivel de Riesgo
- Destacar eventos de alto riesgo con badge rojo

### 7. Journey Step en Empresas

Consultar `company_journey` y mostrar:

- Columna adicional en la tabla de empresas
- Badge con el step actual (1-5)
- Color coding: 1-2 = rojo, 3 = amarillo, 4-5 = verde