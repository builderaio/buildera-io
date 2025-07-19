// Utilidad para detectar nuevas versiones y forzar reload
export class VersionChecker {
  private static instance: VersionChecker;
  private currentVersion: string;
  private checkInterval: number | null = null;

  private constructor() {
    // Generar versión basada en timestamp de build o usar variable de entorno
    this.currentVersion = import.meta.env.VITE_APP_VERSION || Date.now().toString();
  }

  public static getInstance(): VersionChecker {
    if (!VersionChecker.instance) {
      VersionChecker.instance = new VersionChecker();
    }
    return VersionChecker.instance;
  }

  // Verificar si hay nueva versión comparando hash de assets
  public async checkForUpdates(): Promise<boolean> {
    try {
      // Hacer un fetch al index.html principal con cache busting
      const response = await fetch(`/?v=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      // Verificar ETag o Last-Modified headers
      const etag = response.headers.get('etag');
      const lastModified = response.headers.get('last-modified');
      
      const storedEtag = localStorage.getItem('app-etag');
      const storedLastModified = localStorage.getItem('app-last-modified');

      if (etag && storedEtag && etag !== storedEtag) {
        localStorage.setItem('app-etag', etag);
        return true;
      }

      if (lastModified && storedLastModified && lastModified !== storedLastModified) {
        localStorage.setItem('app-last-modified', lastModified);
        return true;
      }

      // Almacenar headers si es la primera vez
      if (etag && !storedEtag) {
        localStorage.setItem('app-etag', etag);
      }
      if (lastModified && !storedLastModified) {
        localStorage.setItem('app-last-modified', lastModified);
      }

      return false;
    } catch (error) {
      console.warn('Error checking for updates:', error);
      return false;
    }
  }

  // Forzar reload de la aplicación
  public forceReload(): void {
    // Limpiar cache del browser antes de reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      }).finally(() => {
        location.reload();
      });
    } else {
      location.reload();
    }
  }

  // Iniciar verificación automática
  public startVersionCheck(intervalMinutes: number = 30): void {
    this.stopVersionCheck();
    
    this.checkInterval = window.setInterval(async () => {
      const hasUpdate = await this.checkForUpdates();
      if (hasUpdate) {
        this.notifyNewVersion();
      }
    }, intervalMinutes * 60 * 1000);
  }

  public stopVersionCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Notificar al usuario sobre nueva versión
  private notifyNewVersion(): void {
    const event = new CustomEvent('newVersionAvailable', {
      detail: { currentVersion: this.currentVersion }
    });
    window.dispatchEvent(event);
  }

  // Limpiar todo el cache del navegador
  public async clearAllCache(): Promise<void> {
    try {
      // Limpiar Service Worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpiar localStorage relacionado con cache
      localStorage.removeItem('app-etag');
      localStorage.removeItem('app-last-modified');
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Verificación manual de nueva versión
  public async checkNow(): Promise<void> {
    const hasUpdate = await this.checkForUpdates();
    if (hasUpdate) {
      this.forceReload();
    }
  }
}

// Función helper para uso fácil
export const versionChecker = VersionChecker.getInstance();