
# Revision Completa de la Experiencia: Hallazgos y Mejoras

## Problemas Identificados

### 1. SocialDataImportDialog no recibe `onNavigateToCreate` (CRITICO)
El componente tiene la prop `onNavigateToCreate` para redirigir a empresas sin historial al tab "Crear", pero en `MarketingHubWow.tsx` (linea 681-689) no se pasa esta prop. Resultado: cuando el scraper retorna 0 posts, aparece el mensaje de cold start pero **sin el boton** para crear contenido con IA.

**Archivo**: `src/components/company/MarketingHubWow.tsx`
- Agregar `onNavigateToCreate={() => handleTabChange('create')}` al componente `SocialDataImportDialog`

### 2. Texto hardcodeado en SocialDataImportDialog (viola regla i18n)
El dialogo tiene multiples strings en espanol sin i18n:
- "Importar Datos de Redes Sociales" (titulo)
- "Ingresa el nombre de usuario..." (descripcion)
- "Plataforma", "Nombre de usuario o pagina"
- "Cancelar", "Importar Datos", "Importando..."
- Mensajes de error y toast de exito

**Archivo**: `src/components/agents/SocialDataImportDialog.tsx`
- Reemplazar todos los strings hardcodeados con claves de traduccion `t()`
- Agregar las claves correspondientes en los 3 archivos de idioma (es, en, pt)

### 3. useJourneyProgression nunca se invoca (CRITICO)
El hook existe pero no se usa en ningun componente `.tsx`. Esto significa que la columna `journey_current_step` nunca avanza, dejando sin efecto todo el sistema de progresion del customer journey. Los pasos 3 (red social conectada), 4 (primera publicacion) y 5 (autopilot activado) nunca se registran.

**Archivo**: `src/components/company/MarketingHubWow.tsx`
- Importar y usar `useJourneyProgression`
- Llamar `checkAndAdvance()` despues de: conectar redes, importar datos, y al cargar el hub
- Tambien invocarlo en `AutopilotDashboard.tsx` al activar el autopilot

### 4. Paso "importSocialData" del Getting Started: texto desalineado con la accion
Cuando no hay redes conectadas, el paso redirige a "create" (crear contenido), pero el texto sigue diciendo "Importar datos de redes sociales". Deberia decir algo como "Importar datos o crear contenido" para que el usuario entienda la bifurcacion.

**Archivos**: `public/locales/es/marketing.json`, `en/marketing.json`, `pt/marketing.json`
- Actualizar la clave `importSocialData` a un texto que refleje ambas opciones: "Obtener datos iniciales" o similar

### 5. AutopilotDashboard Bootstrap: scraper sin username
Cuando el bootstrap intenta importar (linea 189-238), envia el `company_id` y `user_id` al scraper pero NO envia el username/slug. Los scrapers necesitan un identificador de perfil publico. El import probablemente falla silenciosamente.

**Archivo**: `src/components/company/marketing/AutopilotDashboard.tsx`
- En `handleBootstrapImport`, consultar primero la tabla `companies` para obtener la URL de la plataforma y extraer el slug
- Si no hay URL, consultar `social_accounts.platform_username`
- Si tampoco existe, mostrar el `SocialDataImportDialog` para esa plataforma en vez de intentar el scraper

### 6. Falta el reseteo de `zeroPosts` al cambiar de plataforma
En `SocialDataImportDialog`, cuando el usuario cambia la plataforma despues de recibir el mensaje de 0 posts, el estado `zeroPosts` persiste mostrando el Alert innecesariamente.

**Archivo**: `src/components/agents/SocialDataImportDialog.tsx`
- Agregar `setZeroPosts(false)` en el `useEffect` que escucha cambios de `platform`

### 7. Claves i18n faltantes para cold start en bootstrap
Las claves del bootstrap dialog (`autopilot.bootstrap.coldStartDesc`, `autopilot.bootstrap.generateContent`) usan fallbacks hardcodeados. Deben existir en los archivos de traduccion.

**Archivos**: `public/locales/*/marketing.json`
- Verificar y agregar las claves bajo la seccion `autopilot.bootstrap`

## Plan de Implementacion

| Prioridad | Archivo | Cambio |
|-----------|---------|--------|
| P0 | `MarketingHubWow.tsx` | Pasar `onNavigateToCreate` al SocialDataImportDialog |
| P0 | `MarketingHubWow.tsx` | Integrar `useJourneyProgression` y llamar `checkAndAdvance` |
| P0 | `AutopilotDashboard.tsx` | Corregir bootstrap import para incluir username/slug |
| P1 | `SocialDataImportDialog.tsx` | Internacionalizar todos los strings hardcodeados |
| P1 | `SocialDataImportDialog.tsx` | Resetear `zeroPosts` al cambiar plataforma |
| P1 | `AutopilotDashboard.tsx` | Llamar `advanceToStep(5)` al activar autopilot |
| P2 | `public/locales/*/marketing.json` | Agregar/actualizar claves i18n para cold start, import dialog, y paso bifurcado |
| P2 | `public/locales/*/marketing.json` | Renombrar clave `importSocialData` para reflejar bifurcacion |

## Detalle Tecnico

### MarketingHubWow.tsx
```typescript
// 1. Import
import { useJourneyProgression } from '@/hooks/useJourneyProgression';

// 2. Inside component, after companyId is available
const { checkAndAdvance } = useJourneyProgression(profile?.company_id);

// 3. Call on hub init
useEffect(() => { if (userId) checkAndAdvance(); }, [userId]);

// 4. Pass onNavigateToCreate
<SocialDataImportDialog
  ...
  onNavigateToCreate={() => handleTabChange('create')}
/>
```

### AutopilotDashboard.tsx - Bootstrap Fix
```typescript
const handleBootstrapImport = async (platform: string) => {
  // Fetch username from companies or social_accounts
  const { data: company } = await supabase
    .from('companies')
    .select(`${platform}_url`)
    .eq('id', companyId)
    .maybeSingle();
  
  let slug = extractUsernameFromUrl(platform, company?.[`${platform}_url`]);
  
  if (!slug) {
    const { data: acc } = await supabase
      .from('social_accounts')
      .select('platform_username')
      .eq('company_id', companyId)
      .eq('platform', platform)
      .maybeSingle();
    slug = acc?.platform_username;
  }
  
  if (!slug) {
    // No username available - redirect to import dialog
    toast({ title: 'Ingresa el nombre de usuario...', variant: 'destructive' });
    return;
  }
  
  // Build proper body per platform
  // ... (same switch as SocialDataImportDialog)
};
```

### SocialDataImportDialog.tsx - zeroPosts reset
```typescript
useEffect(() => {
  if (platform && resolvedUsernames[platform]) {
    setUsername(resolvedUsernames[platform]);
  } else {
    setUsername('');
  }
  setZeroPosts(false); // Reset on platform change
  setError(null);
}, [platform, resolvedUsernames]);
```
