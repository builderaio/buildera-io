# Edge Functions Migration Guide

## 📊 Estado Actual

**Completado**: ✅ Fases 1-3 del plan de refactorización

### ✅ Implementado

1. **Arquitectura Centralizada**
   - 📁 `src/services/edgeFunctions/` - Servicio unificado
   - 🎯 3 capas: Data, AI/ML, Business
   - 🔧 Error handling, retries, caching, logging

2. **Configuración**
   - ✅ `supabase/config.toml` actualizado con 60+ funciones
   - ✅ Todas las funciones críticas configuradas
   - ✅ JWT verification aplicada donde corresponde

3. **Migraciones Completadas**
   - ✅ `useCompanyData` - Ahora usa `edgeFunctions.data.getCompanyData()`
   - ✅ `useCompanyAgent` - Ahora usa `edgeFunctions.business.createCompanyAgent()`

### 📋 Pendiente de Migración

**Prioridad ALTA** (afectan funcionalidad crítica):
- [ ] `SubscriptionPlans.tsx` - checkout y validación
- [ ] `SupportChatWidget.tsx` - chat con agentes
- [ ] Campaign Wizard steps - generación AI
- [ ] Content creators - generación de contenido
- [ ] Social media analytics - análisis

**Prioridad MEDIA**:
- [ ] Admin components - monitoring, configuración
- [ ] AI Workforce - misiones y deployment
- [ ] Marketing Hub - dashboards

**Prioridad BAJA**:
- [ ] Email handlers
- [ ] OAuth callbacks
- [ ] Utility functions

## 🔄 Cómo Migrar un Componente

### Antes ❌
```typescript
// Invocación directa
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1: value1 }
});

if (error) {
  console.error('Error:', error);
  // manejo manual
}
```

### Después ✅
```typescript
// Usar servicio centralizado
import { edgeFunctions } from '@/services/edgeFunctions';

const { data, error } = await edgeFunctions.layer.functionName({
  param1: value1
});

// Error handling automático
// Logging automático
// Reintentos automáticos
// Caché (si está habilitado)
```

## 📝 Pasos de Migración

### 1. Identificar el componente
```bash
# Buscar invocaciones directas
grep -r "supabase.functions.invoke" src/components/your-component.tsx
```

### 2. Identificar la capa
- **Data**: lecturas/escrituras DB → `edgeFunctions.data.*`
- **AI/ML**: generación/análisis → `edgeFunctions.ai.*`
- **Business**: campañas/subs → `edgeFunctions.business.*`

### 3. Verificar que existe la función
```typescript
// Revisar en:
// - src/services/edgeFunctions/data.ts
// - src/services/edgeFunctions/ai.ts
// - src/services/edgeFunctions/business.ts
```

### 4. Si NO existe, agregarla
```typescript
// En el archivo de la capa correspondiente:
export async function myNewFunction(request: any) {
  return invokeEdgeFunction(
    'my-new-function',
    request,
    { retries: 2, timeout: 45000 }
  );
}
```

### 5. Actualizar config.toml
```toml
[functions.my-new-function]
verify_jwt = true  # o false si es público
```

### 6. Reemplazar en el componente
```typescript
// Importar
import { edgeFunctions } from '@/services/edgeFunctions';

// Reemplazar
- const { data, error } = await supabase.functions.invoke('my-function', {...});
+ const { data, error } = await edgeFunctions.layer.myFunction(params);
```

### 7. Simplificar error handling
```typescript
// Ya no necesitas reintentos manuales ni logging extensivo
// El servicio lo maneja automáticamente

// Solo necesitas:
if (error) {
  toast.error('Mensaje user-friendly');
  return;
}
```

## 🎯 Ejemplos por Módulo

### Campaign Wizard
```typescript
// ❌ Antes
const { data, error } = await supabase.functions.invoke('campaign-ai-generator', {
  body: { companyId, objectives }
});

// ✅ Después
const { data, error } = await edgeFunctions.business.generateCampaign({
  companyId, 
  objectives
});
```

### Content Generation
```typescript
// ❌ Antes
const { data, error } = await supabase.functions.invoke('generate-company-content', {
  body: { companyId, contentType, tone }
});

// ✅ Después
const { data, error } = await edgeFunctions.ai.generateCompanyContent({
  companyId,
  contentType,
  tone
});
```

### Social Analysis
```typescript
// ❌ Antes - múltiples llamadas separadas
const content = await supabase.functions.invoke('analyze-social-content', {...});
const audience = await supabase.functions.invoke('analyze-social-audience', {...});
const activity = await supabase.functions.invoke('analyze-social-activity', {...});

// ✅ Después - batch operation
const results = await edgeFunctions.ai.batchAnalyzeSocial(companyId);
// [content, audience, activity, retrospective] - en paralelo
```

## ⚙️ Opciones Avanzadas

```typescript
// Con opciones personalizadas
const { data, error } = await edgeFunctions.ai.generateCompanyContent(
  { companyId, contentType: 'post' },
  {
    retries: 5,           // 5 intentos
    timeout: 90000,       // 90 segundos
    cache: true,          // activar caché
    cacheTTL: 600000      // 10 minutos
  }
);
```

## 🧹 FASE 5: Limpieza (Siguiente)

Una vez migrados todos los componentes:

1. **Buscar y eliminar** imports innecesarios de `supabase.functions`
2. **Consolidar** funciones duplicadas
3. **Optimizar** timeouts y retries basado en uso real
4. **Documentar** casos edge y soluciones

## 📊 Progreso

- [x] Fase 1: Auditoría (100%)
- [x] Fase 2: Arquitectura (100%)
- [x] Fase 3: Migración (10% - useCompanyData, useCompanyAgent)
- [ ] Fase 4: Estabilización (En proceso)
- [ ] Fase 5: Limpieza (Pendiente)

## 🚀 Próximos Pasos

1. Migrar `SubscriptionPlans.tsx`
2. Migrar Campaign Wizard steps
3. Migrar Content creators
4. Testing end-to-end
5. Documentar patrones encontrados

## 🆘 Troubleshooting

### "Function not found"
- Verificar que existe en `supabase/config.toml`
- Verificar que el nombre coincide exactamente
- Deployar funciones: automático en siguiente build

### "Unauthorized"
- Verificar `verify_jwt = true/false` en config.toml
- Verificar autenticación del usuario

### Timeouts
- Ajustar `timeout` en opciones
- Verificar logs en Supabase Dashboard

### Errores persistentes
- Revisar logs: console.log con prefijo `[EdgeFunction]`
- Revisar Edge Function logs en Supabase
- Verificar que la función edge existe y funciona

## 📚 Referencias

- [README del servicio](src/services/edgeFunctions/README.md)
- [Tipos](src/services/edgeFunctions/types.ts)
- [Supabase Dashboard](https://supabase.com/dashboard/project/ubhzzppmkhxbuiajfswa/functions)
