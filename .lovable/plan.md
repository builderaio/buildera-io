

# Capability Genesis: Creacion Dinamica de Capacidades en Tiempo Real

## Diagnostico del Gap

El sistema actual tiene un conjunto **fijo de 16 capabilities** pre-definidas en una migracion SQL. La funcion `evaluateCapabilities` solo evalua condiciones de activacion (`min_deals`, `min_posts`, etc.) para esas 16 capabilities existentes.

**Lo que NO puede hacer hoy:**
- Detectar que una empresa necesita una capacidad que no existe en el catalogo
- Crear nuevas capabilities basadas en patrones emergentes de uso
- Proponer capacidades derivadas de inteligencia externa (ej: nueva regulacion requiere capability `gdpr_compliance_monitor` que no existia)
- Aprender de empresas similares y replicar capabilities exitosas

---

## Solucion: Capability Genesis Engine

Un sistema de 3 capas que permite al Autopilot Brain **inventar, proponer y activar** nuevas capabilities en tiempo real.

### Capa 1: Deteccion de Necesidades (Capability Gap Detector)

Dentro de la fase LEARN del enterprise-autopilot-engine, agregar logica que analiza:

1. **Decisiones sin agente mapeado** (`no_agent_mapped`): Si el engine genera decisiones que ningun agente puede ejecutar, es senal de que falta una capability
2. **Decisiones bloqueadas recurrentes**: Si guardrails bloquean repetidamente el mismo tipo de accion, puede indicar que se necesita una capability de compliance o gestion
3. **Senales externas sin respuesta**: Si `external_intelligence_cache` detecta cambios (regulatorios, competitivos) pero no hay capability para reaccionar
4. **Patrones de uso**: Si un departamento ejecuta el mismo decision_type repetidamente con exito, podria beneficiarse de una capability automatizada

### Capa 2: Generacion de Capabilities via IA (Capability Proposer)

Una nueva funcion `proposeNewCapabilities` que:

1. Recopila los gaps detectados en la capa anterior
2. Llama a `openai-responses-handler` con un prompt especializado:
   - "Dada esta empresa con industria X, estos gaps detectados, y estas senales externas, propone 1-3 nuevas capabilities con: codigo, nombre, descripcion, trigger_condition, departamento, maturity requerido"
3. La IA genera capabilities personalizadas para esa empresa especifica
4. Se insertan en `autopilot_capabilities` con status `proposed` (nuevo campo)

### Capa 3: Activacion Gobernada

Las capabilities propuestas por IA pasan por un flujo de gobernanza:

- **Auto-activacion**: Si la capability tiene `auto_activate=true` (cuando el riesgo es bajo, ej: analytics)
- **Aprobacion humana**: Si requiere accion costosa o riesgosa (ej: contratar servicio externo), se crea entrada en `content_approvals`
- **Periodo de prueba**: Capabilities nuevas entran en modo `trial` por 7 dias antes de ser permanentes

---

## Implementacion Tecnica

### 1. Migrar tabla `autopilot_capabilities` (nuevos campos)

Agregar columnas:
- `status`: `seeded | proposed | trial | active | deprecated` (reemplaza el booleano `is_active`)
- `source`: `system_seed | ai_generated | external_signal | pattern_detected`
- `auto_activate`: booleano para capabilities de bajo riesgo
- `trial_expires_at`: fecha de fin del periodo de prueba
- `proposed_reason`: texto explicando por que la IA propuso esta capability
- `gap_evidence`: JSONB con los datos que justifican la necesidad

### 2. Capability Gap Detector (nueva funcion en el engine)

Se ejecuta al final de cada ciclo LEARN. Analiza:
- Ultimas 50 decisiones del departamento
- Busca patrones: decision_types sin agente, bloqueos recurrentes, senales externas sin respuesta
- Genera un `gap_report` JSONB con las necesidades detectadas

### 3. Capability Proposer (nueva funcion en el engine)

Se ejecuta si el gap detector encuentra 2+ gaps consistentes. Llama a la IA con:
- Perfil de la empresa (industria, maturity, departamentos activos)
- Gap report
- Inteligencia externa reciente
- Capabilities existentes (para no duplicar)

La IA responde con un JSON de capabilities nuevas que se insertan como `proposed`.

### 4. Capability Lifecycle Manager

Logica que gestiona el ciclo de vida:
- `proposed` -> `trial` (cuando se auto-activa o el usuario aprueba)
- `trial` -> `active` (cuando pasan 7 dias sin problemas)
- `active` -> `deprecated` (cuando no se usa en 30 dias)
- Dashboard muestra capabilities propuestas con CTA "Activar" / "Rechazar"

### 5. UI: Panel de Capabilities Propuestas

En el `EnterpriseAutopilotDashboard`, agregar seccion "Capabilities Sugeridas":
- Cards con icono, nombre, descripcion, y razon de la propuesta
- Badge "IA Sugerida" o "Senal Externa"
- Botones: Activar / Periodo de Prueba / Rechazar
- Indicador de evidencia (cuantos gaps respaldan la sugerencia)

### 6. i18n

Cadenas para ES/EN/PT cubriendo:
- Estados de capabilities (proposed, trial, active, deprecated)
- Panel de sugerencias
- Notificaciones de nuevas capabilities propuestas

---

## Flujo Completo

```text
CICLO AUTOPILOT (LEARN Phase)
        |
        v
GAP DETECTOR
  - "3 decisiones sin agente mapeado tipo 'competitor_response'"
  - "Senal externa: nuevo competidor detectado, sin capability para reaccionar"
        |
        v
CAPABILITY PROPOSER (IA)
  - Input: gaps + perfil empresa + intel externa
  - Output: { code: "competitive_response_engine", 
               name: "Motor de Respuesta Competitiva",
               department: "marketing",
               trigger: { min_competitor_signals: 3 },
               auto_activate: true }
        |
        v
INSERT autopilot_capabilities (status: 'proposed')
        |
        v
AUTO-ACTIVATE o APPROVAL HUMANO
        |
        v
TRIAL (7 dias) -> ACTIVE
```

---

## Secuencia de Implementacion

| Orden | Entregable | Prioridad |
|-------|-----------|-----------|
| 1 | Migracion: nuevos campos en autopilot_capabilities | Alta |
| 2 | Capability Gap Detector en LEARN phase | Alta |
| 3 | Capability Proposer (llamada IA) | Alta |
| 4 | Capability Lifecycle Manager (trial/active/deprecated) | Media |
| 5 | UI: Panel de Capabilities Sugeridas en Dashboard | Media |
| 6 | i18n ES/EN/PT | Baja |

