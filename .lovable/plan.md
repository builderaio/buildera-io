

# Fix: Validacion de Prerequisites en el Autopilot

## Diagnostico de los Problemas

Analizando los datos del usuario `mdelatorrep@gmail.com` (empresa Iddeo, ID: `224c42a1`):

| Dato | Estado |
|------|--------|
| Strategy | Existe (generada con AI) |
| Social connections (LinkedIn, Instagram, Facebook) | NINGUNA |
| Social accounts | Solo upload_post_profile (no conectada a redes reales), TikTok is_connected=false |
| Social posts (IG, LI, FB, TK) | 0 en todas |
| Agent usage log | Vacio (0 ejecuciones registradas) |
| Autopilot marketing (dept config) | ACTIVADO (autopilot_enabled=true) |
| Autopilot decisions | 2 ciclos ejecutados, ambos con `reasoning: "AI response could not be parsed"` y `agent_to_execute: "ANALYTICS_REPORTER"` (agente inexistente) |

### Problemas raiz identificados:

1. **Sin validacion de prerequisites al activar**: El toggle de autopilot se activa sin verificar que existan redes sociales conectadas ni datos. El usuario activo marketing autopilot sin tener NINGUNA red social conectada.

2. **Fallback a agente fantasma**: Cuando la IA no puede parsear la respuesta (porque recibe datos completamente vacios), el engine usa `ANALYTICS_REPORTER` como fallback, pero ese agente NO existe en `platform_agents`. Resultado: "No agent mapped", no pasa nada.

3. **Engine ejecuta ciclos vacios**: El SENSE phase devuelve 0 posts en todas las plataformas, la IA no puede generar decisiones utiles con datos vacios, y el ciclo completo es desperdicio de recursos.

---

## Plan de Solucion

### Paso 1: Prerequisite Gate en el Enterprise Engine

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

Agregar una fase `PREFLIGHT` antes de SENSE que valide condiciones minimas por departamento:

- Marketing: al menos 1 red social conectada (`social_accounts` con `is_connected=true` y plataforma real) O al menos 10 posts importados
- Sales: al menos 1 deal o 1 contacto en CRM
- Finance: al menos configuracion de presupuesto

Si preflight falla, el ciclo se aborta inmediatamente con un resultado descriptivo y se registra en `autopilot_execution_log` con `phase: 'preflight'` y `error_details` explicando que falta.

### Paso 2: Prerequisite Gate en la UI (toggle de activacion)

**Archivos**: 
- `src/components/company/EnterpriseAutopilotDashboard.tsx`
- `src/components/company/marketing/AutopilotDashboard.tsx`

Antes de permitir `autopilot_enabled=true`:
- Verificar redes sociales conectadas (para marketing)
- Si no cumple, mostrar un Dialog/Alert explicando que se necesita y con CTAs directos:
  - "Conectar redes sociales" -> navega a la seccion de conexion
  - "Importar datos de redes" -> abre el flujo de importacion
- El toggle NO se activa hasta que se cumplan los minimos

### Paso 3: Corregir el fallback de AI parsing

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

Cambiar el fallback cuando AI no puede parsearse:
- En vez de inventar una decision con `ANALYTICS_REPORTER` (inexistente), generar una decision con `decision_type: 'analyze'` pero con `agent_to_execute: null`
- Esto evita el intento de ejecucion de un agente fantasma
- Registrar el fallo de parsing en el log con detalles utiles

### Paso 4: SENSE Phase con deteccion de datos insuficientes

**Archivo**: `supabase/functions/enterprise-autopilot-engine/index.ts`

Despues del SENSE, evaluar si los datos son "suficientes" para que la IA tome decisiones:
- Marketing: si todas las plataformas tienen `count: 0` y no hay campanas activas, abortar con mensaje claro
- Esto evita enviar datos vacios a la IA que no puede generar nada util

### Paso 5: Desactivar autopilot del usuario actual

**Migracion SQL**

Desactivar el autopilot de marketing para la empresa Iddeo ya que fue activado sin datos:

```text
UPDATE company_department_config 
SET autopilot_enabled = false 
WHERE company_id = '224c42a1-...' AND department = 'marketing';
```

### Paso 6: i18n para mensajes de prerequisites

**Archivos**: `public/locales/[es|en|pt]/common.json`

Agregar cadenas:
- `enterprise.prerequisites.socialRequired`: "Necesitas conectar al menos una red social para activar el autopilot de marketing"
- `enterprise.prerequisites.connectNow`: "Conectar ahora"
- `enterprise.prerequisites.importData`: "Importar datos"
- `enterprise.preflight.aborted`: "Ciclo abortado: datos insuficientes"

---

## Flujo Corregido

```text
USUARIO ACTIVA TOGGLE AUTOPILOT
        |
        v
PREREQUISITE CHECK (UI)
  - Marketing: redes sociales conectadas?
  - Sales: datos CRM?
  - Finance: presupuesto configurado?
        |
   NO --+--> DIALOG: "Necesitas X para activar"
        |         |-> CTA: "Conectar redes"
        |         |-> CTA: "Importar datos"
        |
   SI --+--> TOGGLE ACTIVA
        |
        v
ENGINE CYCLE STARTS
        |
        v
PREFLIGHT CHECK (Engine)
  - Datos minimos existen?
        |
   NO --+--> LOG: "preflight_failed" + ABORT
        |
   SI --+--> SENSE -> THINK -> GUARD -> ACT -> LEARN
```

---

## Secuencia de Implementacion

| Orden | Entregable | Prioridad |
|-------|-----------|-----------|
| 1 | Preflight gate en enterprise-autopilot-engine | Alta |
| 2 | Corregir fallback AI (eliminar ANALYTICS_REPORTER fantasma) | Alta |
| 3 | SENSE data sufficiency check | Alta |
| 4 | Prerequisite gate en UI (EnterpriseAutopilotDashboard) | Alta |
| 5 | Prerequisite gate en UI (AutopilotDashboard marketing) | Alta |
| 6 | Desactivar autopilot de Iddeo | Media |
| 7 | i18n ES/EN/PT | Baja |

