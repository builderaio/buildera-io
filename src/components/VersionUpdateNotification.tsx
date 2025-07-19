import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, X } from 'lucide-react';
import { versionChecker } from '@/utils/versionCheck';

const VersionUpdateNotification: React.FC = () => {
  const [showNotification, setShowNotification] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Escuchar evento de nueva versión
    const handleNewVersion = () => {
      setShowNotification(true);
    };

    window.addEventListener('newVersionAvailable', handleNewVersion);

    // Iniciar verificación automática cada 30 minutos
    versionChecker.startVersionCheck(30);

    // Verificar inmediatamente al cargar
    setTimeout(() => {
      versionChecker.checkForUpdates().then(hasUpdate => {
        if (hasUpdate) {
          setShowNotification(true);
        }
      });
    }, 5000); // Esperar 5 segundos después de cargar

    return () => {
      window.removeEventListener('newVersionAvailable', handleNewVersion);
      versionChecker.stopVersionCheck();
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Limpiar cache y recargar
    await versionChecker.clearAllCache();
    versionChecker.forceReload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm animate-fade-in">
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium mb-2">Nueva versión disponible</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Hay actualizaciones importantes. Recomendamos actualizar para obtener las últimas mejoras.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Actualizar ahora
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Después
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              disabled={isUpdating}
              className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VersionUpdateNotification;