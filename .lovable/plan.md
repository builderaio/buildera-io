

# Auditoría UX Integral - Buildera Platform

## Resumen Ejecutivo

Tras revisar exhaustivamente el código de la plataforma (40+ archivos, rutas, componentes, navegación, i18n, y flujo del journey), he identificado **23 brechas críticas** organizadas por severidad y fase del journey.

---

## BRECHAS ENCONTRADAS

### SEVERIDAD ALTA - Rompen experiencia o bloquean funcionalidad

**1. Página 404 sin i18n, sin diseño de marca, sin tema**
- `NotFound.tsx`: Texto hardcodeado en inglés ("Oops! Page not found", "Return to Home")
- Usa `bg-gray-100` (no respeta dark mode)
- Sin Header/Footer, sin branding Buildera
- Impacto: cualquier URL errónea muestra una pantalla ajena a la marca

**2. Sidebar blocking logic inconsistente**
- `shouldBlockNavigation` bloquea si `!onboardingComplete && company_name === 'Mi Negocio'`
- Pero los items del sidebar se deshabilitan si `item.id !== "adn-empresa"`, mientras que `setActiveView` bloquea si `view !== "negocio"`
- "adn-empresa" !== "negocio" -- el item con id `negocio` se muestra como disabled cuando debería ser el único habilitado
- Resultado: usuario post-registro puede quedar atrapado sin poder navegar a ninguna sección

**3. Admin pages con textos hardcodeados en español**
- `AdminCustomers.tsx`: "Gestión de Clientes", "Usuarios, empresas y suscripciones en un solo lugar"
- `AdminAIConfig.tsx`: "Configuración IA", "Proveedores, modelos y configuraciones del sistema"
- `AdminAgentPerformance.tsx`: "Rendimiento de Agentes"
- `AdminDashboard.tsx`: "Clientes", "Constructor Agentes", "Rendimiento", "Sistema"
- Viola requisito de i18n obligatorio

**4. PrivacyPolicy.tsx y TermsOfService.tsx sin i18n**
- Ambas páginas no usan `useTranslation`
- Todo el contenido legal está hardcodeado en español
- Usa `bg-gray-50` (no respeta dark mode)
- Para una plataforma con 3 idiomas (ES/EN/PT), esto es una brecha legal y funcional

**5. UserProfile.tsx usa `bg-gray-50`, `bg-gray-100`, colores hardcodeados**
- Loading y error states usan colores que no respetan el tema
- `h-32 w-32` spinner es excesivamente grande (UI inconsistente)
- `border-slate-800` no usa variables de tema

### SEVERIDAD MEDIA - Degradan la experiencia

**6. Toasts con "Error" hardcodeado (74 archivos)**
- Múltiples archivos usan `title: "Error"` en lugar de `t('common:status.error')`
- `SimpleContentPublisher.tsx`: 6 instancias de `title: "Error"`
- `ContentCreatorHub.tsx`: 3 instancias
- `ContentLibraryTab.tsx`: "No se pudo eliminar el contenido" hardcodeado
- `AuthMethodManager.tsx`: "Error desconocido" hardcodeado

**7. ContentLibraryTab.tsx - Mensaje hardcodeado**
- "Cargando tu biblioteca de contenidos..." sin i18n

**8. Footer links rotos o sin destino**
- "Sobre nosotros" (`href="#"`) - va a ningún lado
- "Contacto" (`href="#"`) - va a ningún lado
- "Admin" visible en el footer público - expone panel administrativo

**9. CompleteProfile ofrece roles obsoletos**
- Muestra opciones "developer" y "expert" en el selector de tipo de usuario
- Según las rutas, `/expert-dashboard` y `/developer/*` redirigen a `/company-dashboard`
- Estas opciones confunden al usuario y generan perfiles con tipos que no tienen funcionalidad diferenciada

**10. Journey step 5 "Activación" sin contenido útil visible**
- El sidebar muestra "Activación" en step 5, que renderiza `DepartmentActivationGuide`
- Pero ese componente requiere que el usuario ya tenga departamentos desbloqueados
- Si los departamentos ya están desbloqueados (step 5), la guía muestra pasos ya completados -- redundancia

**11. Inconsistencia entre "Configuración" en sidebar footer y "Mi Negocio"**
- El botón "Settings" del sidebar footer navega a `configuracion`, que se mapea a `negocio`
- Mismo destino que "Mi Negocio" -- el usuario espera una pantalla de configuración de cuenta/suscripción, no el ADN empresarial

**12. `SupportChatWidget` recibe `user={null}` siempre en App.tsx**
- Línea 87: `<SupportChatWidget user={null} />` -- el widget nunca recibe el usuario autenticado
- Impacto: el soporte no puede identificar al usuario

### SEVERIDAD BAJA - Inconsistencias y polish

**13. Header "aria-label" hardcodeado en español**
- `aria-label="Inicio Buildera"` y `aria-label="Principal"` no usan i18n

**14. Hero image alt text hardcodeado**
- `alt="Transformación empresarial con IA"` sin i18n

**15. Contacto page reutiliza FinalCTA**
- `/contacto` simplemente renderiza `<FinalCTA />` -- no es una página de contacto real
- Sin formulario de contacto, sin información de contacto directa

**16. Pricing page sin contexto de funcionalidades**
- Solo renderiza `<SubscriptionPlans />` sin comparativa de features, FAQ, o social proof

**17. Doble check de auth en CompanyDashboard y ResponsiveLayout**
- `ResponsiveLayout.tsx` hace `checkAuth()` con retry loop (6 intentos)
- `CompanyDashboard.tsx` hace su propio `checkAuth()` independiente
- Redundancia que puede causar race conditions y retrasos de carga

**18. Console.log/console.group proliferación en producción**
- `CompanyDashboard.tsx`: 20+ `console.log` statements
- `OnboardingOrchestrator.tsx`: múltiples `console.group/log`
- Impacto en performance y leaks de información en producción

**19. Sidebar "Marketing Autopilot" como tagline**
- `t('common:sidebar.platformTagline', 'Marketing Autopilot')` -- el fallback no refleja la propuesta de valor completa de la plataforma (no es solo marketing)

**20. InviteAccept muestra rol como "admin"/"member" sin traducción contextual**
- El label del rol se muestra parcialmente traducido

**21. El "activation-wizard" no tiene ruta en el sidebar**
- Solo se accede automáticamente en post-onboarding (journeyStep <= 2)
- Si el usuario navega fuera, no puede volver a acceder al wizard

**22. Creatify Studio como ruta directa (`creatify-studio`) sin acceso desde sidebar**
- Solo accesible internamente desde Marketing Hub
- Si un usuario recibe un link directo, no hay sidebar item para orientarse

**23. `LanguageSelector` oculto en mobile (header del dashboard)**
- `<div className="hidden sm:block"><LanguageSelector /></div>` -- usuarios móviles no pueden cambiar idioma

---

## PLAN DE CORRECCIÓN

### Fase 1: Críticos (Bloqueantes de UX)

1. **Reescribir NotFound.tsx**: Agregar i18n, Header/Footer, soporte dark mode, botón CTA de regreso
2. **Corregir sidebar blocking logic**: Unificar `shouldBlockNavigation` para que compare contra `item.id === "negocio"` consistentemente
3. **Internacionalizar Admin pages**: Mover todos los textos hardcodeados a `public/locales/{lang}/admin.json`
4. **Internacionalizar PrivacyPolicy y TermsOfService**: Crear archivos de traducción `legal.json` para ES/EN/PT
5. **Corregir UserProfile.tsx**: Reemplazar `bg-gray-*` por clases de tema (`bg-background`, `bg-muted`)
6. **Pasar `user` real al SupportChatWidget**: Usar el state `user` de App.tsx

### Fase 2: Media (Degradan calidad)

7. **Reemplazar todos los `title: "Error"` hardcodeados**: Script de búsqueda y reemplazo masivo por `t('common:status.error')`
8. **Corregir Footer links**: Eliminar links a "#", redirigir "Contacto" a `/contacto`, ocultar link "Admin"
9. **Eliminar roles obsoletos de CompleteProfile**: Remover opciones "developer" y "expert", dejar solo "company" (ocultar selector)
10. **Separar "Configuración" de "Mi Negocio"**: Crear una vista de configuración de cuenta/suscripción dedicada
11. **Hacer LanguageSelector visible en mobile**: Remover `hidden sm:block`

### Fase 3: Polish

12. **Internacionalizar aria-labels y alt texts**
13. **Crear página de Contacto real**: Formulario con campos nombre, email, mensaje
14. **Limpiar console.logs de producción**: Wrappear en `if (import.meta.env.DEV)`
15. **Actualizar sidebar tagline**: Cambiar "Marketing Autopilot" por algo alineado con "Empresa Autónoma"

---

## Impacto Estimado

| Categoría | Brechas | Archivos afectados |
|---|---|---|
| i18n / Textos hardcodeados | 8 | ~80 archivos |
| Dark mode / Theming | 3 | 4 archivos |
| Navegación / Routing | 5 | 3 archivos |
| Lógica de negocio | 4 | 5 archivos |
| Accesibilidad | 3 | 3 archivos |

