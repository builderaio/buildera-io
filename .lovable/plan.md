

# Plan: Integrar el Framework "Organización Agéntica" de McKinsey a Buildera

## Resumen del Paper

El paper de McKinsey (Sept 2025) define la **Organización Agéntica** como el nuevo paradigma donde humanos y agentes IA trabajan juntos. Se estructura en **5 pilares empresariales**:

1. **Business Model** — canales IA, hiperpersonalización, costos marginales hacia costo de cómputo, datos propietarios como diferenciador
2. **Operating Model** — workflows AI-first, equipos agénticos orientados a outcomes, redes planas
3. **Governance** — decisiones en tiempo real, guardrails embebidos, accountability humana
4. **Workforce, People & Culture** — perfiles M-shaped (generalistas), T-shaped (especialistas), frontline IA-empowered, cultura como pegamento
5. **Technology & Data** — propiedad distribuida de IT/datos, protocolos agente-a-agente, sourcing dinámico

Propone 3 shifts: Linear→Exponencial, Technology-forward→Future-back, Amenaza→Oportunidad.

## Mapeo con la Plataforma Existente

Buildera ya tiene una arquitectura robusta que se alinea naturalmente:

| Concepto McKinsey | Ya existe en Buildera | Oportunidad de mejora |
|---|---|---|
| 5 pilares | 6 departamentos (Marketing, Sales, Finance, Legal, HR, Ops) | Agregar evaluación de madurez agéntica por pilar |
| Equipos agénticos | Ecosistema de 40+ agentes | Visualizar como "equipos agénticos" con supervisión humana |
| Governance embebida | Autonomy Control Center + Guardrails | Integrar métricas de los 5 pilares McKinsey |
| Maturity stages | SDI + MaturityStage (early/growth/consolidated/scale) | Enriquecer con "Agentic Maturity Index" |
| Workforce profiles | No existe | Nuevo: evaluación de perfiles del equipo (M-shaped, T-shaped, Frontline) |

## Cambios Propuestos

### 1. Nuevo componente: Agentic Maturity Assessment

Un panel dentro del Strategic Control Center que evalúe la madurez agéntica de la empresa en los 5 pilares de McKinsey. Cada pilar tiene un score 0-100 basado en datos reales de la plataforma:

- **Business Model**: ¿tiene canales IA activos? ¿datos propietarios configurados? ¿productos digitalizados?
- **Operating Model**: ¿cuántos agentes activos? ¿workflows automatizados? ¿ratio humano/agente?
- **Governance**: ¿guardrails configurados? ¿ciclos de autopilot activos? ¿aprobaciones gestionadas?
- **Workforce**: ¿equipo configurado? ¿roles asignados? ¿upskilling tracking?
- **Technology & Data**: ¿integraciones activas? ¿datos propietarios? ¿protocolos agente-agente?

**Archivos a crear:**
- `src/components/strategy/AgenticMaturityAssessment.tsx` — componente visual con radar chart de los 5 pilares
- `src/hooks/useAgenticMaturityScore.ts` — hook que calcula scores desde datos existentes (company_agents, department_configs, social_accounts, etc.)

### 2. Tabla de base de datos: `agentic_maturity_scores`

Persistir snapshots del score agéntico para tracking histórico.

```sql
CREATE TABLE public.agentic_maturity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  business_model_score INTEGER DEFAULT 0,
  operating_model_score INTEGER DEFAULT 0,
  governance_score INTEGER DEFAULT 0,
  workforce_score INTEGER DEFAULT 0,
  technology_data_score INTEGER DEFAULT 0,
  composite_score INTEGER DEFAULT 0,
  pillar_details JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.agentic_maturity_scores ENABLE ROW LEVEL SECURITY;
```

### 3. Integrar en el Strategic Control Center

Añadir una sección "Índice de Madurez Agéntica" en `StrategicControlCenter.tsx` que muestre:
- Radar chart con los 5 pilares
- Score compuesto (0-100)  
- Recomendaciones accionables por pilar débil
- Comparativa con el "paradigma agéntico ideal" de McKinsey

### 4. Enriquecer el Copiloto ERA con contexto agéntico

Actualizar `create-company-agent/index.ts` para inyectar el agentic maturity score en las instrucciones del agente, permitiéndole aconsejar sobre la transición agéntica de la empresa.

### 5. Workforce Profile Assessment (nuevo tab en ADN)

Un componente simple en el Business Configuration Hub que permita al usuario catalogar su equipo según los 3 perfiles McKinsey:
- M-shaped supervisors (generalistas que orquestan agentes)
- T-shaped specialists (expertos de dominio)
- AI-empowered frontline (empleados operativos potenciados con IA)

**Archivo:** `src/components/company/adn-tabs/ADNWorkforceProfilesTab.tsx`

### 6. i18n

Todas las strings nuevas en ES, EN, PT como requieren las instrucciones del proyecto.

## Orden de implementación

1. Migración SQL (tabla `agentic_maturity_scores`)
2. Hook `useAgenticMaturityScore.ts` (cálculo desde datos existentes)
3. Componente `AgenticMaturityAssessment.tsx` (radar + scores + recomendaciones)
4. Integración en `StrategicControlCenter.tsx`
5. `ADNWorkforceProfilesTab.tsx` + registro en index
6. Actualización del copiloto ERA
7. Strings i18n

