
# Enterprise Autopilot: IA Autonoma para Toda la Empresa

## Vision General

Escalar el patron SENSE-THINK-ACT-GUARD-LEARN del Marketing Autopilot a **6 departamentos empresariales**, creando un sistema que arranca con capacidades base y desbloquea automaticamente nuevas funcionalidades conforme el negocio crece.

```text
ARQUITECTURA: ENTERPRISE AUTOPILOT ENGINE
==========================================

                    +---------------------------+
                    |   ENTERPRISE ORCHESTRATOR  |
                    |  (Coordina todos los       |
                    |   departamentos)           |
                    +---------------------------+
                              |
       +----------+-----------+-----------+----------+----------+
       |          |           |           |          |          |
  +---------+ +--------+ +--------+ +--------+ +--------+ +--------+
  |MARKETING| |COMERCIAL| |FINANZAS| |LEGAL   | |RRHH    | |OPERAC. |
  |Autopilot| |Autopilot| |Autopilot| |Autopilot| |Autopilot| |Autopilot|
  |(EXISTE)  | |(NUEVO)  | |(NUEVO)  | |(NUEVO)  | |(NUEVO)  | |(NUEVO)  |
  +---------+ +--------+ +--------+ +--------+ +--------+ +--------+
       |          |           |           |          |          |
       +----------+-----------+-----------+----------+----------+
                              |
                    +---------------------------+
                    |   COMPANY STATE ANALYZER   |
                    |  (Maturity-based unlocking) |
                    +---------------------------+
```

---

## Lo Que Ya Existe (Fundamentos)

| Componente | Estado |
|---|---|
| Marketing Autopilot (SENSE-THINK-ACT-GUARD-LEARN) | Implementado |
| 27 agentes en platform_agents (8 categorias) | Activo |
| Company State Analyzer (maturity: starter/growing/established/scaling) | Activo |
| CRM basico (pipelines, deals, contacts, activities) | Tablas existen |
| Products catalog (company_products) | Tabla existe |
| AI Workforce Teams (equipos con tareas) | Tablas existen |
| Agent SDK Executor (ejecutor unificado) | Edge function activa |
| company_parameters (intercambio de datos inter-agente) | Activo |

---

## Los 6 Departamentos Autopilot

### Nivel 1 - STARTER (dia 1, gratis)
Capacidades base que arrancan inmediatamente:

| Departamento | Capacidades Base |
|---|---|
| **Marketing** | Autopilot existente: contenido, engagement, publicacion |
| **Comercial** | Lead scoring basico desde CRM, alertas de deals estancados |
| **Finanzas** | Dashboard de creditos, alertas de consumo, proyeccion simple |

### Nivel 2 - GROWING (>30% completion, >3 agent executions)
Se desbloquean automaticamente:

| Departamento | Capacidades Desbloqueadas |
|---|---|
| **Marketing** | Campanas multi-canal, A/B testing automatico |
| **Comercial** | Pipeline automation, propuestas auto-generadas, CRM enrichment |
| **Finanzas** | Facturacion automatica, alertas de cobro, forecast de revenue |
| **Legal** | Revision automatica de contratos, alertas de compliance |

### Nivel 3 - ESTABLISHED (>60% completion, >10 executions)
Capacidades avanzadas:

| Departamento | Capacidades Avanzadas |
|---|---|
| **Operaciones** | Automatizacion de procesos repetitivos, SLA monitoring |
| **RRHH** | Generacion de perfiles de cargo, evaluaciones, clima laboral |
| **Estrategia** | OKR tracking autonomo, alertas de desviacion, recomendaciones PTW |

### Nivel 4 - SCALING (>80% completion, >20 executions)
Orquestacion cross-departamental:

| Capacidad | Descripcion |
|---|---|
| Cross-department decisions | Finanzas bloquea campana de marketing si el budget esta agotado |
| Unified reporting | Un solo reporte ejecutivo con KPIs de todos los departamentos |
| Predictive alerts | IA predice problemas antes de que ocurran |

---

## Implementacion Tecnica

### Paso 1: Tabla `company_department_config`
Extiende el patron de `company_autopilot_config` a todos los departamentos:

- company_id, department (marketing/sales/finance/legal/hr/operations)
- autopilot_enabled, maturity_level_required
- allowed_actions (array), guardrails (jsonb)
- execution_frequency, last_execution_at
- auto_unlocked (boolean - se activo automaticamente por maturity)

### Paso 2: Nuevos Agentes por Departamento
Agregar ~15 agentes nuevos a `platform_agents`:

**Comercial:**
- SALES_PIPELINE_OPTIMIZER - Analiza deals, sugiere acciones
- LEAD_SCORER - Scoring automatico de leads
- PROPOSAL_GENERATOR - Genera propuestas comerciales

**Finanzas:**
- CASHFLOW_MONITOR - Monitorea flujo de caja y alerta
- REVENUE_FORECASTER - Proyeccion de ingresos
- EXPENSE_ANALYZER - Analisis de gastos y optimizacion

**Legal:**
- CONTRACT_REVIEWER - Revision automatica de contratos
- COMPLIANCE_MONITOR - Monitoreo de cumplimiento normativo

**RRHH:**
- JOB_PROFILER - Genera perfiles de cargo
- CLIMATE_ANALYZER - Analiza clima laboral
- TALENT_SCOUT - Busqueda y matching de talento

**Operaciones:**
- PROCESS_OPTIMIZER - Identifica cuellos de botella
- SLA_MONITOR - Monitorea niveles de servicio
- TASK_AUTOMATOR - Automatiza tareas repetitivas

### Paso 3: Edge Function `enterprise-autopilot-engine`
Un orquestador que:
1. Lee el maturity level de la empresa
2. Determina que departamentos estan desbloqueados
3. Ejecuta el ciclo SENSE-THINK-ACT-GUARD-LEARN para cada departamento activo
4. Coordina decisiones cross-departamentales (e.g., finanzas aprueba presupuesto de marketing)

### Paso 4: Extender `useCompanyState`
Agregar areas nuevas al state analyzer:
- sales (CRM deals, pipeline health)
- finance (credits, revenue tracking)
- legal (contracts, compliance)
- hr (team size, evaluations)
- operations (processes, SLAs)

### Paso 5: Auto-unlock Logic
Hook `useDepartmentUnlocking` que:
- Observa cambios en maturity level
- Cuando sube de nivel, auto-inserta configs en `company_department_config`
- Muestra notificacion al usuario: "Nueva capacidad desbloqueada: Autopilot Financiero"
- Registra el unlock en `company_parameters` para trazabilidad

### Paso 6: UI - Enterprise Command Center
Nuevo tab en el sidebar o evolucion del "Centro de Comando" actual:
- Vista unificada de todos los departamentos con su estado
- Cards por departamento mostrando: estado (activo/bloqueado/desbloqueado), ultimo ciclo, decisiones pendientes
- Departamentos bloqueados aparecen con candado y barra de progreso hacia el desbloqueo
- Click en departamento abre su dashboard especifico

### Paso 7: Dashboard por Departamento
Cada departamento tiene su propio dashboard siguiendo el patron del AutopilotDashboard:
- Toggle ON/OFF
- Timeline de decisiones
- Guardrails configurables
- Metricas especificas del area

### Paso 8: i18n Completo
Todas las nuevas cadenas en ES/EN/PT desde el inicio.

---

## Secuencia de Implementacion Sugerida

| Fase | Entregable | Esfuerzo |
|---|---|---|
| 1 | Tabla company_department_config + migracion | Bajo |
| 2 | Nuevos agentes en platform_agents (INSERT SQL) | Bajo |
| 3 | Extender useCompanyState con areas empresariales | Medio |
| 4 | Hook useDepartmentUnlocking (auto-desbloqueo) | Medio |
| 5 | Enterprise Autopilot Engine (edge function) | Alto |
| 6 | UI: Enterprise Command Center (nuevo tab) | Alto |
| 7 | Dashboards por departamento (Sales, Finance, Legal, HR, Ops) | Alto |
| 8 | Cross-department coordination logic | Alto |
| 9 | i18n de todo lo nuevo | Medio |

**Recomendacion**: Implementar en 3 oleadas:
- **Oleada 1** (Pasos 1-4): Infraestructura + auto-unlock. El usuario ve los departamentos bloqueandose/desbloqueandose.
- **Oleada 2** (Pasos 5-6): Engine + Command Center. Los departamentos empiezan a funcionar autonomamente.
- **Oleada 3** (Pasos 7-9): Dashboards detallados + coordinacion cross-departamental.
