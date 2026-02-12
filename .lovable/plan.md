

# Fix Estructural: Autopilot Sin Agentes Fantasmas y con Controles Uniformes

## Problemas Criticos Encontrados

### 1. BUG FATAL: El engine busca agentes por columna inexistente (Linea 509)

```text
// enterprise-autopilot-engine/index.ts, linea 509:
.eq('department', department)  // <-- 'department' NO EXISTE en platform_agents
```

La tabla `platform_agents` tiene `category` (analytics, content, marketing, finance, hr, legal, operations), NO `department`. Esto significa que el ACT phase **NUNCA encuentra agentes** para ningun departamento. Todas las decisiones caen en `no_agent_mapped`.

### 2. Agentes recursivos (se llaman a si mismos)

Los agentes de Finance, HR, Legal, Operations tienen `edge_function_name: 'enterprise-autopilot-engine'`, lo que crearia un loop recursivo si el engine lograra encontrarlos.

| Agente | edge_function_name | Problema |
|--------|-------------------|----------|
| CASHFLOW_MONITOR | enterprise-autopilot-engine | Recursivo |
| EXPENSE_ANALYZER | enterprise-autopilot-engine | Recursivo |
| REVENUE_FORECASTER | enterprise-autopilot-engine | Recursivo |
| JOB_PROFILER | enterprise-autopilot-engine | Recursivo |
| CLIMATE_ANALYZER | enterprise-autopilot-engine | Recursivo |
| TALENT_SCOUT | enterprise-autopilot-engine | Recursivo |
| COMPLIANCE_MONITOR | enterprise-autopilot-engine | Recursivo |
| CONTRACT_REVIEWER | enterprise-autopilot-engine | Recursivo |
| PROCESS_OPTIMIZER | enterprise-autopilot-engine | Recursivo |
| SLA_MONITOR | enterprise-autopilot-engine | Recursivo |

### 3. La IA no sabe que agentes existen

El prompt THINK dice `"agent_to_execute": "AGENT_CODE matching this department"` pero no lista los codigos disponibles. La IA inventa codigos como `ANALYTICS_REPORTER` que no existen.

### 4. `no_agent_mapped` marca `action_taken: true`

Cuando no se encuentra el agente, el engine marca la decision como `action_taken: true` con resultado `no_agent_mapped`, lo que es enganoso: no se tomo ninguna accion real.

### 5. Preflight incompleto

Solo Marketing y Sales tienen validacion de prerequisitos. Finance, Legal, HR y Operations no tienen ninguna validacion, ni en el engine ni en la UI.

### 6. Mapeo category-to-department ausente

No existe un mapeo entre las `category` de `platform_agents` y los `department` del autopilot para resolver correctamente que agentes pertenecen a cada departamento.

---

## Plan de Solucion

### Paso 1: Crear mapeo category-to-department en el engine

Definir un mapa explicito que relaciona cada departamento del autopilot con las categorias de `platform_agents` que le corresponden:

```text
marketing -> ['marketing', 'content', 'analytics', 'branding']
sales     -> ['sales']  (+ crear categoria si se agregan agentes)
finance   -> ['finance']
legal     -> ['legal']
hr        -> ['hr']
operations -> ['operations']
```

Cambiar la query de la linea 509 de `.eq('department', department)` a `.in('category', DEPT_CATEGORY_MAP[department])`.

### Paso 2: Inyectar agentes disponibles en el prompt THINK

En la funcion `thinkPhase`, antes de llamar a la IA, consultar los agentes reales disponibles por categoria y agregar al system prompt:

```text
AVAILABLE AGENTS (use ONLY these codes):
- CONTENT_CREATOR: Creador de Contenido (edge: marketing-hub-post-creator)
- MKTG_STRATEGIST: Estratega de Marketing (edge: marketing-hub-marketing-strategy)
- ...
If no agent fits the action, set agent_to_execute to null.
```

Esto elimina la alucinacion de codigos de agentes.

### Paso 3: Corregir agentes recursivos

Actualizar los agentes de Finance, HR, Legal y Operations en la base de datos para que apunten a edge functions reales o, si no existen funciones especificas, marcarlos como `execution_type: 'pending'` con `edge_function_name: null`. El engine debe manejar esto de forma explicita registrando que el agente existe pero no tiene implementacion aun, sin intentar ejecutar nada.

### Paso 4: Corregir `no_agent_mapped` -> `action_taken: false`

En `actPhase`, cuando un agente no tiene `edge_function_name` o no se encuentra en el mapa, marcar `action_taken: false` en vez de `true`, y agregar un `execution_result: 'agent_not_implemented'` descriptivo.

### Paso 5: Completar preflight para todos los departamentos

Agregar validaciones minimas en `preflightCheck`:

- **Finance**: al menos 1 registro en `agent_usage_log` (indica actividad) o `business_health_snapshots`
- **Legal**: al menos 1 parametro con prefix `legal_` en `company_parameters`
- **HR**: al menos 2 miembros en `company_members`
- **Operations**: al menos 1 equipo en `ai_workforce_teams`

### Paso 6: Completar prerequisitos en la UI

En `EnterpriseAutopilotDashboard.tsx`, extender `checkDepartmentPrerequisites` para cubrir los 6 departamentos con mensajes y CTAs apropiados.

### Paso 7: Completar `checkDataSufficiency` para todos los departamentos

Agregar validaciones de datos insuficientes post-SENSE para finance, legal, hr, operations (actualmente solo marketing y sales las tienen).

### Paso 8: Migracion SQL para corregir agentes recursivos

Actualizar `edge_function_name` de los 10 agentes recursivos a `null` y su `execution_type` a `'pending'`.

### Paso 9: i18n para prerequisitos de todos los departamentos

Agregar cadenas para:
- `enterprise.prerequisites.financeRequired`
- `enterprise.prerequisites.legalRequired`
- `enterprise.prerequisites.hrRequired`
- `enterprise.prerequisites.operationsRequired`

En ES, EN, PT.

---

## Resumen de Impacto

| Problema | Impacto | Fix |
|----------|---------|-----|
| `.eq('department', ...)` en columna inexistente | TODOS los agentes son `no_agent_mapped` | Usar `category` con mapeo |
| IA inventa codigos de agentes | Decisiones con agentes fantasma | Inyectar lista real en prompt |
| 10 agentes apuntan al engine mismo | Loop recursivo potencial | Marcar como `pending`, edge_function=null |
| `action_taken: true` sin accion | Metricas falsas | Cambiar a `false` |
| Preflight solo para 2/6 departamentos | 4 departamentos sin validacion | Completar los 6 |
| Data sufficiency solo para 2/6 | Ciclos vacios en 4 departamentos | Completar los 6 |

---

## Secuencia de Implementacion

| Orden | Entregable | Archivo |
|-------|-----------|---------|
| 1 | Mapeo category-department + fix query | enterprise-autopilot-engine |
| 2 | Inyectar agentes disponibles en prompt THINK | enterprise-autopilot-engine |
| 3 | Corregir action_taken para no_agent_mapped | enterprise-autopilot-engine |
| 4 | Completar preflight para 6 departamentos | enterprise-autopilot-engine |
| 5 | Completar data sufficiency para 6 departamentos | enterprise-autopilot-engine |
| 6 | Migracion SQL: fix agentes recursivos | SQL migration |
| 7 | Completar prerequisitos UI para 6 departamentos | EnterpriseAutopilotDashboard |
| 8 | i18n ES/EN/PT | common.json x3 |

