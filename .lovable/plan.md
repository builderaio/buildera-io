

## Plan: Corregir el mapeo de ICPs desde el diagnóstico

### Problema Identificado

El componente `TargetMarketDefinitionStep` tiene una **condicion de carrera (race condition)** critica:

- `useState(initialSegments)` solo usa el valor inicial **en el primer render**
- `diagnosticData` se carga de forma asincrona desde la base de datos
- Si el componente se monta *antes* de que `diagnosticData` este disponible, los ICPs quedan vacios permanentemente
- No existe un `useEffect` que sincronice los datos del diagnostico cuando llegan tarde

Ademas, para el usuario `mdelatorrep@gmail.com`, los datos de audiencia en `company_audiences` existen (6 segmentos: Abogados, Firmas legales, Asesores legales, etc.) pero `pain_points` y `goals` son `null`, lo que tambien debe manejarse correctamente.

### Cambios Propuestos

**Archivo: `src/components/strategy/founder/steps/TargetMarketDefinitionStep.tsx`**

1. Agregar un `useEffect` que observe cambios en `diagnosticData` y actualice el estado `segments` cuando:
   - Los segmentos actuales estan vacios (no hay datos guardados ni ingresados manualmente)
   - Los datos del diagnostico acaban de llegar (transicion de null a datos reales)

2. Agregar una referencia (`useRef`) para rastrear si el usuario ya edito manualmente los segmentos, evitando sobrescribir cambios del usuario.

3. Mejorar el manejo de `pain_points` y `goals` nulos para que la descripcion del ICP no quede vacia cuando estos campos son `null` en la base de datos.

### Detalle Tecnico

```text
Flujo actual (roto):
  Mount -> useState([]) -> diagnosticData llega -> estado NO se actualiza

Flujo corregido:
  Mount -> useState([]) -> diagnosticData llega -> useEffect detecta cambio
    -> si segments vacio Y no editado manualmente -> setSegments(inferredSegments)
```

El `useEffect` tendra estas condiciones de seguridad:
- Solo actua si `segments` esta vacio
- Solo actua si el usuario no ha editado manualmente (via `userHasEdited` ref)
- Solo actua si `strategy.targetSegments` no tiene datos guardados previamente
- Tambien sincroniza `icpInferred`, `maturity` y `decisionMaker` si aplica

