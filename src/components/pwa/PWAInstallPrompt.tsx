import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  if (isInstalled || isDismissed || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm ${className}`}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-elegant">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('pwa.dismiss', 'Cerrar')}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 pr-4">
              <h3 className="font-heading text-base font-semibold text-foreground">
                {t('pwa.installTitle', 'Instala Buildera')}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('pwa.installDescription', 'Accede más rápido con la app en tu dispositivo. Login con huella y notificaciones.')}
              </p>

              {/* Install button */}
              <Button
                onClick={handleInstall}
                size="sm"
                className="mt-3 gap-2"
              >
                <Download className="h-4 w-4" />
                {t('pwa.installButton', 'Instalar app')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
