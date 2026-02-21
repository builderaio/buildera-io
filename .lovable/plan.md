

## Plan: Corregir perdida de datos en Strategic DNA

### Problema Raiz

Los 3 componentes de paso (CoreMissionLogicStep, TargetMarketDefinitionStep, CompetitivePositioningEngineStep) usan un **debounce de 1500ms** para guardar cambios. Cuando el usuario navega al siguiente paso o hace clic en "Generar Perfil", el componente se desmonta y el `useEffect` cleanup cancela el timer. **Los datos nunca se persisten.**

```text
Flujo roto:
  Usuario edita campo -> hasChanges=true -> timer 1500ms inicia
  Usuario hace clic "Siguiente" (antes de 1500ms) -> componente se desmonta
  -> clearTimeout(timer) -> saveChanges() NUNCA se ejecuta
  -> datos perdidos permanentemente
```

Esto explica por que la pantalla final muestra "No definido" en los 3 pilares: los datos estuvieron en estado local pero nunca llegaron a la base de datos.

### Solucion

Agregar un guardado inmediato al desmontar el componente (flush on unmount) en los 3 archivos de paso, y tambien forzar un flush antes de navegar en el componente padre.

### Cambios por Archivo

**1. `src/components/strategy/founder/steps/CoreMissionLogicStep.tsx`**
- Agregar un `useRef` para trackear los valores actuales y el estado de cambios
- Agregar un `useEffect` de cleanup que ejecute el guardado inmediato al desmontarse (flush on unmount)

**2. `src/components/strategy/founder/steps/TargetMarketDefinitionStep.tsx`**
- Mismo patron: `useRef` + flush on unmount

**3. `src/components/strategy/founder/steps/CompetitivePositioningEngineStep.tsx`**
- Mismo patron: `useRef` + flush on unmount

**4. `src/components/strategy/founder/FounderPTWSimplified.tsx`**
- En `handleNext`, antes de navegar al siguiente paso, esperar un breve tick para permitir que el flush del useEffect de cleanup se ejecute
- En el paso final ("Generar Perfil"), hacer `refetch()` despues de un delay para asegurar que los datos esten persistidos antes de mostrar el resumen

### Detalle Tecnico del Patron Flush-on-Unmount

Cada paso tendra:

```typescript
// Ref que mantiene la funcion de guardado actualizada
const saveRef = useRef(saveChanges);
saveRef.current = saveChanges;

const hasChangesRef = useRef(hasChanges);
hasChangesRef.current = hasChanges;

// Flush al desmontar
useEffect(() => {
  return () => {
    if (hasChangesRef.current) {
      saveRef.current();
    }
  };
}, []); // Solo al desmontar
```

Esto garantiza que cuando el usuario navega, los datos pendientes se persisten antes de que el componente desaparezca.

