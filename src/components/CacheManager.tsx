import { useEffect } from 'react';
import { versionChecker } from '@/utils/versionCheck';

// Componente para manejar la gestión de caché en el ciclo de vida de la app
const CacheManager: React.FC = () => {
  useEffect(() => {
    // Función para detectar si es una recarga o primera visita
    const handlePageLoad = () => {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const navigationType = navigationEntries[0].type;
        
        // Si es una recarga forzada (Ctrl+F5), limpiar todo el cache
        if (navigationType === 'reload') {
          console.log('Detected hard refresh, clearing cache...');
          versionChecker.clearAllCache();
        }
      }
    };

    // Ejecutar al cargar la página
    handlePageLoad();

    // Configurar verificación automática de versiones
    versionChecker.startVersionCheck(15); // Verificar cada 15 minutos

    // Limpiar intervalo al desmontar
    return () => {
      versionChecker.stopVersionCheck();
    };
  }, []);

  useEffect(() => {
    // Limpiar cache cuando la página se va a cerrar/recargar
    const handleBeforeUnload = () => {
      // Marcar que la app se está cerrando para evitar verificaciones innecesarias
      sessionStorage.setItem('app-closing', 'true');
    };

    // Cuando la página se vuelve visible, verificar versión
    const handleVisibilityChange = () => {
      if (!document.hidden && !sessionStorage.getItem('app-closing')) {
        // Página visible de nuevo, verificar si hay actualizaciones
        setTimeout(() => {
          versionChecker.checkForUpdates().then(hasUpdate => {
            if (hasUpdate) {
              // Mostrar notificación de nueva versión
              const event = new CustomEvent('newVersionAvailable');
              window.dispatchEvent(event);
            }
          });
        }, 2000);
      }
    };

    // Cuando la app vuelve a tener foco, verificar versión
    const handleFocus = () => {
      if (!sessionStorage.getItem('app-closing')) {
        setTimeout(() => {
          versionChecker.checkForUpdates();
        }, 1000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Este componente no renderiza nada, solo maneja efectos
  return null;
};

export default CacheManager;