# Edge Functions Service

Servicio centralizado para gestionar todas las invocaciones a Edge Functions en Buildera.

## 📋 Arquitectura

El servicio está organizado en **3 capas lógicas**:

### 1. **Data Layer** (`data.ts`)
Operaciones de base de datos y lectura de datos:
- `getCompanyData()` - Objetivos y audiencias de empresa
- `getSocialAudienceStats()` - Estadísticas de redes sociales
- `calculateDashboardMetrics()` - Métricas del dashboard
- `manageCompanyObjectives()` - CRUD de objetivos

### 2. **AI/ML Layer** (`ai.ts`)
Generación de contenido, análisis con IA:
- **Generación**: `generateCompanyContent()`, `generateMarketingPost()`, etc.
- **Análisis**: `analyzeSocialContent()`, `analyzeSocialAudience()`, etc.
- **Optimización**: `optimizeContentWithERA()`, `chatWithERA()`
- **Batch**: `batchAnalyzeSocial()` - múltiples análisis en paralelo

### 3. **Business Layer** (`business.ts`)
Lógica de negocio, campañas, suscripciones:
- **Campañas**: `generateCampaign()`, `extractBrandIdentity()`
- **Suscripciones**: `checkSubscriptionStatus()`, `createSubscriptionCheckout()`
- **Agentes**: `createCompanyAgent()`, `chatWithCompanyAgent()`
- **Social**: `facebookAuth()`, `linkedinCallback()`, `syncLinkedInData()`
- **Email**: `sendBuilderaEmail()`, `sendWelcomeEmail()`

## 🚀 Uso

```typescript
import { edgeFunctions } from '@/services/edgeFunctions';

// ✅ Usar el servicio centralizado
const { data, error } = await edgeFunctions.data.getCompanyData(companyId);

// ✅ Con opciones avanzadas
const result = await edgeFunctions.ai.generateCompanyContent(request, {
  retries: 3,
  timeout: 60000,
  cache: true
});

// ✅ Batch operations
const results = await edgeFunctions.ai.batchAnalyzeSocial(companyId);
```

## ⚙️ Opciones Disponibles

```typescript
interface EdgeFunctionOptions {
  retries?: number;      // Número de reintentos (default: 2)
  timeout?: number;      // Timeout en ms (default: 30000)
  cache?: boolean;       // Activar caché (default: false)
  cacheTTL?: number;     // TTL del caché en ms (default: 300000)
}
```

## 🔧 Core Features

### Error Handling
- Manejo automático de errores
- Reintentos con backoff exponencial
- Errores tipados (`EdgeFunctionError`)

### Logging
- Logs estructurados por función
- Performance monitoring
- Seguimiento de intentos y errores

### Caching
- Caché en memoria para reducir llamadas
- TTL configurable por función
- Invalidación manual con `clearCache()`

### Retry Logic
- Reintentos automáticos configurables
- Backoff exponencial (1s, 2s, 4s...)
- Timeout por función

## 📊 Monitoreo

```typescript
// Ver logs en consola
console.log('🔄 [EdgeFunction] Invoking function-name');
console.log('✅ [EdgeFunction] Success function-name (250ms)');
console.log('❌ [EdgeFunction] Error in function-name');

// Limpiar caché
import { clearCache } from '@/services/edgeFunctions';
clearCache('generate-company-content'); // Función específica
clearCache(); // Todo el caché
```

## 🎯 Beneficios

1. **Mantenibilidad**: Un solo lugar para gestionar edge functions
2. **Consistencia**: Mismo manejo de errores en toda la app
3. **Performance**: Caché inteligente y reintentos automáticos
4. **Debugging**: Logs estructurados y centralizados
5. **Escalabilidad**: Fácil agregar nuevas funciones

## 📝 Agregar Nueva Función

1. Definir tipos en `types.ts` (si necesario)
2. Agregar función en la capa apropiada (`data.ts`, `ai.ts`, `business.ts`)
3. Configurar en `supabase/config.toml`
4. Usar desde componentes: `edgeFunctions.layer.functionName()`

## ⚠️ Importante

- **NO** invocar `supabase.functions.invoke()` directamente
- **SIEMPRE** usar `edgeFunctions` para invocaciones
- Configurar funciones nuevas en `config.toml`
- Usar tipos definidos en `types.ts`

## 🔗 Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Dashboard de funciones](https://supabase.com/dashboard/project/ubhzzppmkhxbuiajfswa/functions)
