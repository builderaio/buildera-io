

## Plan: Analisis de Gaps entre Propuesta de Valor del Homepage y Funcionalidad Real

### Resumen Ejecutivo

El homepage promete una plataforma de automatizacion empresarial con IA que opera 6 departamentos (Marketing, Ventas, Finanzas, Legal, RRHH y Operaciones) con 27+ agentes, gobernanza, guardrails y un ciclo autonomo. Tras revisar todo el codebase, la infraestructura del backend y los componentes del frontend, he identificado **3 niveles de gaps**: funcionalidades completamente ausentes, parcialmente implementadas y cosmeticas.

---

### Estado Actual vs Promesas del Homepage

| Promesa del Homepage | Estado Real | Gap |
|---|---|---|
| 6 departamentos automatizados | Backend soporta los 6, pero solo Marketing tiene data sources reales | ALTO |
| 27+ agentes especializados | Existen en DB pero muchos son placeholders sin edge function real | MEDIO |
| Diagnostico Digital en 60s | Funcional (onboarding + scraping) | OK |
| ADN Estrategico | Funcional (Strategic DNA wizard) | OK |
| Autopilot Empresarial | Funcional para Marketing; otros deptos sin datos para operar | MEDIO |
| Gobernanza y Guardrails | Backend implementado; Governance.tsx es pagina estatica/informativa, no funcional | ALTO |
| CRM / Ventas | CRM existe (deals, contacts, pipeline) pero no integrado en flujo principal | MEDIO |
| Finanzas (presupuesto, alertas) | Solo monitorea uso de creditos de la plataforma, no finanzas reales | ALTO |
| Legal (compliance, contratos) | Solo lee company_parameters con prefijo "legal_", sin funcionalidad real | ALTO |
| RRHH (talento, clima) | Solo lee miembros del equipo, sin herramientas de HR reales | ALTO |
| Operaciones (SLA, bottlenecks) | Solo lee ejecuciones de agentes, sin monitoreo operativo real | ALTO |
| Casos de Uso por departamento | Componente UseCases.tsx esta VACIO (render nulo) | CRITICO |
| Aprendizaje documentado | autopilot_memory existe y funciona | OK |
| Capability Genesis | Implementado en edge function | OK |

---

### Gaps Ordenados por Prioridad

#### PRIORIDAD 1 - Criticos (rompen la confianza inmediatamente)

**Gap 1: Seccion "Casos de Uso" completamente vacia**
- `UseCases.tsx` renderiza un `<section>` vacio sin contenido
- El homepage tiene i18n completo con 6 casos de uso detallados pero el componente no los muestra
- **Accion**: Implementar el componente para renderizar las 6 cards con titulo, descripcion y features desde i18n

**Gap 2: Pagina de Gobernanza es solo informativa**
- `Governance.tsx` es una landing page estatica que describe las features de gobernanza
- No conecta con datos reales de `content_approvals`, `autopilot_decisions`, ni guardrail logs
- **Accion**: Convertir en dashboard funcional que muestre aprobaciones pendientes reales, logs de guardrails y configuracion de reglas

#### PRIORIDAD 2 - Altos (el usuario descubre el gap al usar la plataforma)

**Gap 3: Departamentos no-Marketing sin fuentes de datos reales**
- Sales: tiene CRM pero pocas empresas lo llenan; autopilot no puede operar sin datos
- Finance: solo monitorea creditos internos, no tiene integracion contable
- Legal: lee parametros con prefijo "legal_" pero no hay UI para ingresarlos
- HR: lee miembros del equipo, sin herramientas de gestion de talento
- Operations: lee ejecuciones de agentes, sin monitoreo de procesos reales
- **Accion**: Para cada departamento, crear una pantalla minima de configuracion y entrada de datos que alimente el autopilot. El CRM de ventas ya existe pero necesita ser mas visible en la navegacion.

**Gap 4: CRM desconectado del flujo principal**
- Los componentes `CRMDashboard`, `ContactsList` y `PipelineKanban` existen pero no aparecen en la navegacion del dashboard
- El autopilot de Sales depende de estos datos
- **Accion**: Agregar "Ventas/CRM" como vista accesible desde el menu lateral del dashboard

#### PRIORIDAD 3 - Medios (mejoran la experiencia pero no bloquean)

**Gap 5: Metricas del homepage sin sustento verificable**
- "73% eficiencia operativa", "12x velocidad de decision", "340% ROI en marketing" — son numeros aspiracionales sin conexion a datos reales de usuarios
- **Accion**: Agregar disclaimer "Resultados proyectados basados en benchmarks de la industria" o reemplazar con metricas mas conservadoras y verificables

**Gap 6: Contador de "27+ agentes" vs realidad**
- Necesita verificacion de cuantos agentes estan realmente operativos con edge functions funcionales vs cuantos son registros en DB sin backend
- **Accion**: Auditar `platform_agents` y alinear el numero con la realidad

---

### Plan de Implementacion Sugerido

**Fase 1 - Quick Wins (1-2 dias)**
1. Implementar UseCases.tsx con el contenido i18n existente
2. Agregar CRM como vista en la navegacion del dashboard
3. Agregar disclaimer a las metricas del homepage

**Fase 2 - Funcionalidad Core (3-5 dias)**
4. Convertir Governance.tsx en dashboard funcional conectado a datos reales
5. Crear pantallas de configuracion basica para cada departamento no-Marketing (Legal, Finance, HR, Operations)
6. Integrar datos de entrada por departamento para que el autopilot tenga contexto

**Fase 3 - Consolidacion (1-2 semanas)**
7. Auditar y limpiar el catalogo de agentes
8. Crear flujos guiados de activacion por departamento
9. Implementar metricas reales basadas en datos del usuario para reemplazar los KPIs estaticos del homepage

---

### Detalle Tecnico

**Archivos a crear/modificar en Fase 1:**
- `src/components/UseCases.tsx` — renderizar grid de 6 cards con datos de i18n `landing.useCases.cases.*`
- `src/pages/CompanyDashboard.tsx` — agregar case "crm" o "ventas" que renderice `CRMDashboard`
- `src/components/home/BusinessImpact.tsx` — agregar nota de disclaimer bajo las metricas

**Archivos a crear/modificar en Fase 2:**
- `src/pages/Governance.tsx` — refactor completo a dashboard funcional con queries a `content_approvals`, `autopilot_decisions`
- Nuevos componentes por departamento en `src/components/company/departments/` para configuracion de Finance, Legal, HR, Operations
- Actualizacion del sidebar/navegacion para exponer las nuevas vistas

**Tablas de Supabase involucradas:**
- `content_approvals` — aprobaciones pendientes (ya existe)
- `autopilot_decisions` — log de decisiones (ya existe)
- `autopilot_capabilities` — capacidades genesis (ya existe)
- `autopilot_memory` — aprendizaje documentado (ya existe)
- `crm_deals`, `crm_contacts`, `crm_activities` — CRM de ventas (ya existe)
- `company_parameters` — parametros por departamento (ya existe)
- `department_configs` — configuracion de autopilot por depto (ya existe)

