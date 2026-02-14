
# Auditoria Estructural: Elementos Obsoletos en Buildera

## Resumen

Tras revisar toda la estructura del proyecto, se identificaron **4 categorias de elementos obsoletos** que ya no se alinean con el modelo de negocio actual (centrado en agentes de plataforma + autopilot enterprise). Estos elementos desperdician espacio en el bundle, crean confusion en navegacion y violan la coherencia del producto.

---

## CATEGORIA 1: Sistema WhiteLabel Completo (OBSOLETO)

El modelo actual se basa en `platform_agents` gestionados desde el admin. El sistema WhiteLabel fue disenado para que **desarrolladores externos** crearan y vendieran agentes. Esto contradice el modelo actual donde Buildera controla todo el ecosistema de agentes.

**Paginas a eliminar (8 archivos):**
- `src/pages/WhiteLabelDashboard.tsx` - Dashboard de desarrollador WhiteLabel
- `src/pages/WhiteLabelMarketplace.tsx` - Marketplace de templates WhiteLabel
- `src/pages/WhiteLabelAnalytics.tsx` - Analytics por template
- `src/pages/WhiteLabelRevenue.tsx` - Ingresos por agentes vendidos
- `src/pages/WhiteLabelKnowledgeBase.tsx` - Base de conocimiento WhiteLabel
- `src/pages/WhiteLabelVoiceVision.tsx` - Capacidades voz/vision WhiteLabel
- `src/pages/WhiteLabelAPIGenerator.tsx` - Generador de API docs
- `src/pages/WhiteLabelABTesting.tsx` - A/B testing de templates

**Componentes asociados a eliminar:**
- `src/components/agent/AgentTemplateWizard.tsx` - Wizard para crear templates WhiteLabel
- `src/components/agent/AgentDeploymentManager.tsx` - Manager de deployments
- `src/pages/AgentFlowBuilder.tsx` - Wrapper del wizard
- `src/pages/CompanyWhiteLabelAgents.tsx` - Vista empresa de agentes WhiteLabel

**Tablas DB involucradas (no eliminar aun, solo dejar de consultar):**
- `whitelabel_agent_templates`
- `whitelabel_deployments`
- Tablas relacionadas (analytics, metrics, etc.)

**Rutas a eliminar en App.tsx (lineas 136, 144-156):**
```text
/marketplace/whitelabel
/company/whitelabel-agents
/developer/portal
/developer/dashboard
/whitelabel/marketplace
/whitelabel/agent-builder
/whitelabel/agent-builder/:templateId
/whitelabel/analytics/:templateId
/whitelabel/revenue
/whitelabel/knowledge
/whitelabel/voice-vision
/whitelabel/api-docs/:templateId
/whitelabel/ab-testing
/whitelabel/dashboard
```

---

## CATEGORIA 2: Dashboards de Developer y Expert (OBSOLETOS)

Estos roles eran parte de un modelo marketplace tripartito (Empresa + Developer + Experto). El modelo actual solo tiene un tipo de usuario: la **empresa**. No hay funcionalidad real detras de estos dashboards (todos usan datos dummy hardcodeados).

**Paginas a eliminar (3 archivos):**
- `src/pages/DeveloperDashboard.tsx` - 508 lineas de datos ficticios
- `src/pages/DeveloperPortal.tsx` - Landing page para developers
- `src/pages/ExpertDashboard.tsx` - 380 lineas de datos ficticios

**Componentes de Expertos a eliminar:**
- `src/components/company/Expertos.tsx` - Vista de expertos (ya no se renderiza en CompanyDashboard)
- `src/components/company/experts/ExpertCard.tsx`
- `src/components/company/experts/BookSessionDialog.tsx`
- `src/hooks/useExperts.ts`

**Rutas a eliminar en App.tsx:**
```text
/expert-dashboard
/developer-dashboard
/company-dashboard/expertos (redirect)
```

**Imports a limpiar en App.tsx:**
- `ExpertDashboard`
- `DeveloperDashboard`
- `DeveloperPortal`

---

## CATEGORIA 3: AI Workforce / Misiones (REEMPLAZADO)

El sistema de "Misiones" fue reemplazado por `UnifiedAgentsView` + el Enterprise Autopilot. El CompanyDashboard ya redirige `ai-workforce` a `UnifiedAgentsView`, pero la pagina standalone y sus componentes siguen existiendo.

**Paginas a eliminar:**
- `src/pages/AIWorkforce.tsx` - 263 lineas, pagina standalone de misiones

**Componentes a eliminar (directorio completo):**
- `src/components/ai-workforce/` (8 archivos):
  - `MissionCatalog.tsx`, `MissionLauncher.tsx`, `ActiveMissions.tsx`, `MissionResults.tsx`
  - `TeamCelebration.tsx`, `TeamCreationWizard.tsx`, `TeamsList.tsx`
  - `wizard/` (subdirectorio)

**Rutas a eliminar en App.tsx:**
```text
/ai-workforce
/ai-workforce/:agentId (ya es redirect)
```

---

## CATEGORIA 4: Componente ConfiguracionIA (HUERFANO)

`src/components/company/ConfiguracionIA.tsx` esta definido pero **no se importa ni se usa en ningun lado**. La configuracion de IA se gestiona desde el panel admin (`AdminAIConfig`, `AdminFunctionConfig`), no desde la vista de empresa.

**Archivo a eliminar:**
- `src/components/company/ConfiguracionIA.tsx`

---

## Plan de Implementacion

| Paso | Accion | Archivos |
|------|--------|----------|
| 1 | Limpiar App.tsx: eliminar imports y rutas obsoletas | `src/App.tsx` |
| 2 | Eliminar paginas WhiteLabel | 8 archivos en `src/pages/` |
| 3 | Eliminar paginas Developer/Expert/AIWorkforce | 4 archivos en `src/pages/` |
| 4 | Eliminar componentes WhiteLabel | `src/components/agent/` (2 archivos) |
| 5 | Eliminar componentes Experts | `src/components/company/experts/` + `Expertos.tsx` + `useExperts.ts` |
| 6 | Eliminar componentes AI Workforce | `src/components/ai-workforce/` (directorio completo) |
| 7 | Eliminar ConfiguracionIA huerfano | 1 archivo |
| 8 | Limpiar AuthenticatedLayout (comentario sobre expertos) | 1 archivo |
| 9 | Limpiar SupportChatWidget (referencias a expertos/marketplace) | 1 archivo |
| 10 | Eliminar redirect `/company-dashboard/expertos` en App.tsx | 1 linea |

**Total estimado: ~25 archivos eliminados, ~3,500+ lineas de codigo muerto removidas.**

### Notas Importantes
- Las tablas de base de datos (`whitelabel_*`, `experts`, etc.) NO se eliminan en esta fase para preservar datos historicos
- Los `platform_agents` del admin builder NO se tocan - son el sistema vigente
- El `AgentMarketplaceV2` (marketplace para empresas que ven agentes de plataforma) se MANTIENE - es funcional y alineado al modelo actual
