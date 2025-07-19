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
      <Alert className="border-primary/20 bg-card/95 backdrop-blur-sm dark:bg-card/95 dark:border-primary/20 shadow-lg">
        <RefreshCw className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium mb-2">Nueva versión disponible</p>
              <p className="text-sm text-muted-foreground mb-3">
                Hay actualizaciones importantes. Recomendamos actualizar para obtener las últimas mejoras.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
              className="h-6 w-6 p-0 hover:bg-accent"
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