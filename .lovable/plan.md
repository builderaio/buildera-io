
# Fix: Acceso a Conectar Redes desde el Marketing Hub

## Problema

Todos los botones de "Conectar redes" apuntan a destinos que ya no existen o no hacen nada:

1. **ConnectionStatusBar** (visible en Marketing Hub Dashboard): El boton "Conectar mas redes" navega a `?view=adn-empresa&tab=canales` -- una pestana que fue eliminada.
2. **Autopilot prereq dialogs**: Navegan a `?view=marketing-hub` pero ahi no hay ninguna accion de conexion, solo se ve el dashboard.
3. **MarketingHubWow "connectNetworks" button**: Se navega a si mismo sin hacer nada.

El componente `SocialConnectionManager` (que realmente ejecuta el flujo de conexion via Upload-Post) NO esta integrado en el Marketing Hub.

## Solucion

### Paso 1: Integrar SocialConnectionManager en el Marketing Hub

Agregar un estado `showConnectDialog` en `MarketingHubWow.tsx` que abra un Dialog/Sheet con el `SocialConnectionManager`. Esto permite conectar redes sin salir del Marketing Hub.

### Paso 2: Actualizar ConnectionStatusBar

Cambiar el boton "Conectar mas redes" para que en vez de navegar, reciba un callback `onConnectClick` que el padre (MarketingHubWow) use para abrir el dialog de conexion.

### Paso 3: Actualizar botones de prerequisitos del Autopilot

Los botones de "Conectar ahora" en `EnterpriseAutopilotDashboard` y `marketing/AutopilotDashboard` deben navegar a `?view=marketing-hub&action=connect` y el Marketing Hub debe detectar ese parametro para abrir automaticamente el dialog de conexion.

### Paso 4: Actualizar el boton interno de "connectNetworks"

El boton que aparece cuando no hay redes conectadas (en la seccion de Platform Performance) debe tambien abrir el dialog en vez de navegar a si mismo.

---

## Detalle Tecnico

### ConnectionStatusBar.tsx
- Agregar prop `onConnectClick?: () => void`
- Si existe, usarlo en el boton; si no, fallback a navegacion al marketing hub

### MarketingHubWow.tsx
- Importar `SocialConnectionManager`
- Agregar estado `showConnectDialog`
- Leer parametro `action=connect` de searchParams para abrir automaticamente
- Pasar `onConnectClick` a `ConnectionStatusBar`
- Agregar Dialog con `SocialConnectionManager` dentro
- Cuando se cierre el dialog, recargar conexiones (`loadConnections`)

### EnterpriseAutopilotDashboard.tsx y AutopilotDashboard.tsx
- Cambiar navegacion de "Conectar ahora" a `?view=marketing-hub&action=connect`

### MarketingGettingStarted.tsx
- Cambiar accion de "connectSocial" a `?view=marketing-hub&action=connect`

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| ConnectionStatusBar.tsx | Agregar prop `onConnectClick`, usar en boton |
| MarketingHubWow.tsx | Integrar SocialConnectionManager en Dialog, leer `action=connect` |
| EnterpriseAutopilotDashboard.tsx | Navegar a `?view=marketing-hub&action=connect` |
| marketing/AutopilotDashboard.tsx | Navegar a `?view=marketing-hub&action=connect` |
| MarketingGettingStarted.tsx | Navegar a `?view=marketing-hub&action=connect` |
