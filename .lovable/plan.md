

# Analisis Completo del Flujo y Coherencia de la Plataforma

## Resumen Ejecutivo

Tras analizar el flujo completo desde registro hasta operacion autonoma, la plataforma tiene una arquitectura solida con el ciclo SENSE-THINK-GUARD-ACT-LEARN-EVOLVE, pero existen **9 brechas criticas** que impiden que la propuesta de valor se cumpla de forma consistente. La empresa no crece de forma verdaderamente autonoma porque hay desconexiones entre etapas, prerequisitos silenciosos, y funcionalidades que nunca se invocan.

---

## Brechas Identificadas

### BRECHA 1: Las decisiones `cold_start_content` nunca se muestran al usuario (CRITICO)

**Problema**: El engine genera decisiones `cold_start_content` con `suggested_action: generate_initial_content`, pero **ninguna parte del frontend** busca ni renderiza estas decisiones. El AutopilotDashboard muestra decisiones genericas, pero no tiene logica especial para presentar CTAs de cold start.

**Impacto**: La empresa nueva activa el Autopilot, el ciclo falla, se graba una decision en la BD, pero el usuario nunca la ve ni recibe guidance.

**Solucion**: En `AutopilotDashboard.tsx`, al cargar decisiones, detectar las de tipo `cold_start_content` y mostrar un banner prominente con un boton "Crear mi primer contenido con IA" que invoque al `CALENDAR_PLANNER`.

### BRECHA 2: El NBA Engine ignora los departamentos enterprise (CRITICO)

**Problema**: `useNextBestAction.ts` solo genera recomendaciones para las 6 areas originales (profile, strategy, content, agents, social, audience). No menciona sales, finance, legal, hr ni operations. Una empresa con CRM vacio o sin configuracion legal nunca recibe guidance para activar esos departamentos.

**Impacto**: Los departamentos enterprise se desbloquean silenciosamente via `useDepartmentUnlocking` pero el usuario nunca recibe una recomendacion contextual para poblarlos con datos.

**Solucion**: Agregar reglas NBA para cada departamento enterprise:
- Sales incompleto: "Agrega tu primer deal o contacto al CRM"
- Finance incompleto: "Ejecuta tu primer agente para activar monitoreo financiero"
- Legal/HR/Ops: Guidance contextual basado en madurez

### BRECHA 3: Preflight de Marketing usa `company_id` pero los posts usan `user_id` (INCONSISTENCIA)

**Problema**: En el engine (lineas 329-335), el `preflightCheck` para marketing consulta posts con `.eq('company_id', companyId)`. Pero las tablas de posts (`instagram_posts`, etc.) normalmente usan `user_id` como clave (visible en `senseQuery` linea 42-56 donde se resuelve `ownerUserId`).

**Impacto**: El preflight puede reportar 0 posts cuando en realidad existen pero estan vinculados por `user_id`, causando que el Autopilot aborte innecesariamente.

**Solucion**: En `preflightCheck`, resolver primero el `ownerUserId` (como ya se hace en `senseQuery`) y filtrar por `user_id` en las tablas de posts.

### BRECHA 4: El journey `checkAndAdvance` no detecta el paso 2 (onboarding completado)

**Problema**: `useJourneyProgression` verifica pasos 3, 4 y 5 pero **nunca verifica el paso 2** (onboarding/diagnostico completado). Si el paso 2 no se setea correctamente durante el onboarding, `checkAndAdvance` no puede corregirlo retroactivamente.

**Impacto**: Empresas que completan el onboarding pero sufren un error durante el guardado pueden quedar atrapadas en step 1 permanentemente.

**Solucion**: Agregar verificacion de paso 2 en `checkAndAdvance`: si existe `company_strategy` o `company_digital_presence`, avanzar a paso 2.

### BRECHA 5: El Getting Started Level 2 no conecta con el Enterprise Autopilot

**Problema**: `MarketingGettingStarted` tiene un Level 2 con pasos como "Modo supervisado", "Revisar decisiones", "Modo autonomo" y "Explorar cerebro empresarial". Pero:
- El paso "exploreEnterpriseBrain" siempre se marca como `completed: false` (hardcoded)
- El paso redirige a `autopilot` en vez de al `EnterpriseAutopilotDashboard`
- No hay transicion natural del Marketing Autopilot al Enterprise Autopilot (6 departamentos)

**Impacto**: El usuario completa Level 1 pero Level 2 no lo guia efectivamente hacia la operacion enterprise autonoma.

**Solucion**: 
- Marcar "exploreEnterpriseBrain" como completado si existe al menos 1 departamento enterprise con `autopilot_enabled: true`
- Cambiar la navegacion al `EnterpriseAutopilotDashboard`

### BRECHA 6: El Autopilot no se auto-ejecuta periodicamente

**Problema**: El `enterprise-autopilot-engine` tiene logica de frecuencia (1h, 6h, 24h) pero **no existe ningun cron job o scheduler** que lo invoque. Solo se ejecuta cuando el usuario hace clic en "Run Cycle" manualmente.

**Impacto**: La promesa de "autonomia" es falsa - el cerebro solo funciona cuando el usuario lo activa manualmente.

**Solucion**: Configurar un Supabase CRON (pg_cron o edge function scheduled) que invoque `enterprise-autopilot-engine` cada hora, procesando solo las empresas cuya frecuencia lo requiera (la logica de filtrado ya existe en el serve handler).

### BRECHA 7: La fase LEARN no evalua impacto real

**Problema**: La evaluacion de decisiones pasadas (lineas 750-758) simplemente marca todo como `neutral` con score 0 despues de 7 dias. No hay medicion de impacto real (ej: si se creo contenido, medir engagement posterior).

**Impacto**: El "Memory-Augmented Reasoning" nunca aprende patrones reales. Las lecciones son genericas como "no measurable impact data was available".

**Solucion**: Implementar evaluacion de impacto basada en metricas:
- Si decision fue `create_content`: comparar engagement antes/despues
- Si fue `adjust_campaigns`: comparar ROI
- Si fue `qualify_lead`: verificar si el lead avanzo en el pipeline

### BRECHA 8: Los agentes enterprise no reciben contexto de empresa

**Problema**: En la fase ACT (linea 668-679), cuando se invoca un agente, el body solo contiene `company_id, department, decision_type, parameters, cycle_id, autopilot: true`. No incluye el contexto de empresa (estrategia, audiencias, marca) que los agentes necesitan segun `context_requirements`.

**Impacto**: Los agentes ejecutados por el Autopilot producen resultados genericos porque no tienen acceso al ADN de la empresa.

**Solucion**: Antes de invocar cada agente, consultar su `context_requirements` de `platform_agents` y cargar el contexto correspondiente (estrategia, branding, audiencias) para incluirlo en el payload.

### BRECHA 9: Departamentos enterprise no tienen bootstrap interactivo

**Problema**: Cuando un departamento enterprise (sales, finance, etc.) falla el preflight, simplemente retorna `aborted: true` sin ofrecer un camino alternativo como lo hace marketing con el cold_start flow.

**Impacto**: Ventas dice "requiere 1 deal" pero no ofrece un boton para crear un deal. Legal dice "requiere 1 parametro legal" sin explicar como configurarlo.

**Solucion**: Para cada departamento, agregar un flujo de bootstrap con CTAs especificos:
- Sales: "Crear primer deal" o "Importar contactos CSV"
- Finance: "Ejecutar primer agente" (cualquiera)
- Legal: "Configurar parametros legales en ADN"
- HR: "Invitar miembros al equipo"
- Operations: "Crear primer equipo AI"

---

## Plan de Implementacion (Priorizado)

| # | Prioridad | Archivo(s) | Cambio |
|---|-----------|-----------|--------|
| 1 | P0 | `enterprise-autopilot-engine/index.ts` | Fix preflight: resolver user_id para consultar posts |
| 2 | P0 | `AutopilotDashboard.tsx` | Renderizar decisiones cold_start_content como banner CTA |
| 3 | P0 | `enterprise-autopilot-engine/index.ts` | ACT phase: cargar context_requirements del agente |
| 4 | P1 | `useNextBestAction.ts` | Agregar reglas NBA para departamentos enterprise |
| 5 | P1 | `useJourneyProgression.ts` | Agregar verificacion de paso 2 en checkAndAdvance |
| 6 | P1 | `MarketingGettingStarted.tsx` | Fix Level 2: paso Enterprise Brain con navegacion correcta |
| 7 | P2 | `enterprise-autopilot-engine/index.ts` | LEARN phase: evaluacion de impacto basada en metricas |
| 8 | P2 | `EnterpriseAutopilotDashboard.tsx` | Bootstrap interactivo para departamentos enterprise |
| 9 | P2 | Crear cron job | Scheduler para ejecucion periodica del engine |

---

## Detalle Tecnico

### 1. Fix Preflight (P0)
```text
preflightCheck():
  if department === 'marketing':
    // Resolver owner como en senseQuery
    const ownerUserId = (await supabase.from('companies')
      .select('created_by').eq('id', companyId).single()).data?.created_by;
    // Consultar posts por user_id (no company_id)
    const igCount = await supabase.from('instagram_posts')
      .select('id', {count:'exact',head:true}).eq('user_id', ownerUserId);
    // ... igual para las demas plataformas
```

### 2. Cold Start Banner en AutopilotDashboard (P0)
Al cargar decisiones, filtrar las de tipo `cold_start_content` y si existen, mostrar un Alert prominente con:
- Titulo: descripcion de la decision
- Boton principal: "Crear contenido con IA" que navega a Marketing Hub tab "create"
- Boton secundario: "Importar datos" que abre SocialDataImportDialog

### 3. Context Loading en ACT Phase (P0)
```text
actPhase():
  for decision in guardedDecisions:
    const agent = agentMap.get(agentCode);
    // NEW: Load context requirements
    const { data: agentFull } = await supabase.from('platform_agents')
      .select('context_requirements').eq('id', agent.id).single();
    const context = await loadAgentContext(companyId, agentFull.context_requirements);
    // Include in body
    body = { ...existingBody, company_context: context };
```

### 4. NBA Enterprise Rules (P1)
Agregar en `useNextBestAction.ts`:
```text
// Rule: Sales CRM vacio
if (companyState.areas.sales.status === 'incomplete') {
  nbas.push({ id: 'setup-crm', priority: 'medium', type: 'profile',
    title: 'Configura tu CRM', action: { view: 'crm' } });
}
// Similar para finance, legal, hr, operations
```

### 5. Journey Step 2 Verification (P1)
En `checkAndAdvance`, antes de verificar pasos 3-5:
```text
const strategyRes = await supabase.from('company_strategy')
  .select('id').eq('company_id', companyId).maybeSingle();
if (strategyRes.data) await advanceToStep(2);
```

### 6. Level 2 Enterprise Brain Step (P1)
```text
// En checkProgress de MarketingGettingStarted:
const { data: enterpriseDepts } = await supabase
  .from('company_department_config')
  .select('id').eq('company_id', companyId)
  .neq('department', 'marketing').eq('autopilot_enabled', true).limit(1);
  
level2Steps[4] = { // exploreEnterpriseBrain
  completed: (enterpriseDepts?.length || 0) > 0,
  action: () => navigate("/company-dashboard?view=enterprise-autopilot"),
};
```

### 7. LEARN Impact Evaluation (P2)
Implementar funciones de evaluacion por tipo de decision:
- `create_content`: Buscar posts creados en el ciclo y medir engagement vs promedio
- `qualify_lead`: Verificar si leads cambiaron de stage
- `analyze`: Verificar si insights fueron generados

### 8. Bootstrap Enterprise Departments (P2)
En `EnterpriseAutopilotDashboard.tsx`, cuando un departamento muestra estado "aborted" por preflight:
- Renderizar un componente `DepartmentBootstrap` con instrucciones y CTAs especificos
- Cada departamento tiene su propio wizard de setup rapido

### 9. Cron Job (P2)
Crear un scheduled edge function o usar pg_cron:
```text
-- pg_cron option
SELECT cron.schedule('autopilot-hourly', '0 * * * *',
  $$SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/enterprise-autopilot-engine',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := '{}'::jsonb
  )$$
);
```

