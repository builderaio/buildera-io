

# Auditoría Enterprise Brain - Fallas Funcionales

## Diagnóstico del Estado Actual

El Enterprise Brain opera a través de **3 superficies de control** que presentan duplicación, inconsistencias de datos y problemas de UX:

```text
Enterprise Brain (3 vistas separadas)
├── EnterpriseAutopilotDashboard.tsx (sidebar: "autopilot")
│   ├── 6 Department cards con toggle + manual cycle
│   ├── Tabs: Genesis / Intelligence / Lessons / Capabilities
│   └── Execution Timeline + Prerequisite Dialogs
├── GovernanceDashboard.tsx (sidebar: "gobernanza")  
│   ├── 6-panel grid: IQ, Departments, Log, Guardrails, Approvals, Capabilities
│   └── StatusBar with cycle/agents/credits metrics
└── AutopilotDashboard.tsx (Marketing Hub tab: "autopilot")
    ├── Marketing-specific autopilot config
    ├── Stats cards + Decisions + Timeline + Settings
    └── Bootstrap dialog for social data import
```

---

## FALLAS ENCONTRADAS

### SEVERIDAD CRÍTICA — Funcionalidad rota o confusa

**1. Departamento `customer_service` fantasma en GovernanceDashboard**
- `GovernanceDashboard.tsx` línea 110 usa `deptKeys = ["marketing", "sales", "legal", "hr", "customer_service", "finance"]`
- `DepartmentsPanel.tsx` también mapea `customer_service` con icono y default
- Pero `useDepartmentUnlocking.ts` define los 6 departamentos como: `marketing, sales, finance, legal, hr, operations`
- **No existe `customer_service`** — existe `operations`. Resultado: el departamento Operations nunca aparece en GovernanceDashboard, y `customer_service` siempre muestra 0 tareas/deshabilitado

**2. Duplicación confusa: 3 dashboards para la misma funcionalidad**
- El usuario puede acceder al Autopilot desde 3 lugares distintos con datos parcialmente superpuestos:
  - Sidebar → "Enterprise Autopilot" → `EnterpriseAutopilotDashboard` (consulta `department_execution_log`, `autopilot_capabilities`, `external_intelligence_cache`, `autopilot_memory`)
  - Sidebar → "Gobernanza" → `GovernanceDashboard` (consulta `autopilot_decisions`, `content_approvals`, `autopilot_execution_log`, `autopilot_memory`, `agent_usage_log`)
  - Marketing Hub → Tab Autopilot → `AutopilotDashboard` (consulta `company_autopilot_config`, `autopilot_execution_log`, `autopilot_decisions`)
- Cada uno consulta tablas diferentes y muestra métricas calculadas de forma distinta
- El IQ Score se calcula de forma diferente entre `EnterpriseAutopilotDashboard` (línea 264: `Math.min(100, ...)`) y `EnterpriseIQPanel` (línea 26: `Math.min(999, ...)`). Uno usa max 100, el otro max 999

**3. `department_execution_log` vs `autopilot_execution_log` — tablas diferentes**
- `EnterpriseAutopilotDashboard` consulta `department_execution_log` (cast as any, línea 122)
- `GovernanceDashboard` y `AutopilotDashboard` consultan `autopilot_execution_log`
- Son tablas diferentes con esquemas diferentes. Si `department_execution_log` no existe o no tiene datos, la vista Enterprise muestra timeline vacío silenciosamente

**4. ApprovalsPanel: `toast.error(err.message || "Error")` — hardcoded**
- Línea 51 usa `toast.error(err.message || "Error")` en vez de i18n

### SEVERIDAD ALTA — Dark mode y UX

**5. AutopilotDashboard.tsx — Dark mode completamente roto**
- Línea 536: `bg-blue-100` — stat card backgrounds
- Línea 545: `bg-green-100`
- Línea 554: `bg-red-100`
- Línea 563: `bg-yellow-100`
- Líneas 627-629: `bg-green-100 text-green-700`, `bg-red-100 text-red-700`, `bg-yellow-100 text-yellow-700` — guardrail result badges
- Líneas 687-689: `bg-green-100 text-green-700`, `bg-red-100 text-red-700` — phase timeline pills
- Total: **12 instancias** de colores light-only que se vuelven invisibles en dark mode

**6. AutopilotDashboard empty state bloquea configuración inicial**
- Línea 466-476: Si `!config && logs.length === 0 && decisions.length === 0`, muestra un empty state sin CTA para activar
- El usuario nuevo ve "Autopilot no configurado" con solo texto explicativo y ningún botón para activarlo
- Debería mostrar un botón "Activar Autopilot" o el toggle directamente

**7. IQ Score inconsistente entre vistas**
- `EnterpriseAutopilotDashboard` línea 264: `Math.min(100, Math.round(totalCycles * 2 + totalLessons * 5 + activatedCaps * 10))`
- `EnterpriseIQPanel` línea 26: `Math.min((cyclesCompleted * 2) + (lessonsLearned * 5) + (activatedCaps * 10), 999)`
- Mismo cálculo base pero con caps en 100