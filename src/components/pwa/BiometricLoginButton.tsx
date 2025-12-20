import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Fingerprint, ScanFace, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { cn } from '@/lib/utils';

interface BiometricLoginButtonProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({
  email,
  onSuccess,
  onError,
  className = '',
  variant = 'outline',
  size = 'default',
  showText = true,
}) => {
  const { t } = useTranslation();
  const { isAvailable, isLoading, authenticateWithBiometric } = useBiometricAuth();

  // Detect device type for appropriate icon
  const isFaceId = React.useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac');
  }, []);

  const handleClick = async () => {
    try {
      const success = await authenticateWithBiometric(email);
      if (success) {
        onSuccess?.();
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };

  if (!isAvailable) {
    return null;
  }

  const Icon = isFaceId ? ScanFace : Fingerprint;
  const label = isFaceId 
    ? t('biometric.faceId', 'Face ID') 
    : t('biometric.fingerprint', 'Huella digital');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'relative gap-2 overflow-hidden',
          isLoading && 'cursor-wait',
          className
        )}
      >
        {/* Animated background on hover */}
        <motion.div
          className="absolute inset-0 bg-primary/5"
          initial={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.5, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        <span className="relative flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          )}
          
          {showText && (
            <span>
              {isLoading 
                ? t('biometric.verifying', 'Verificando...') 
                : t('biometric.loginWith', 'Entrar con {{method}}', { method: label })}
            </span>
          )}
        </span>
      </Button>
    </motion.div>
  );
};

// Smaller version for inline use
export const BiometricLoginIcon: React.FC<{
  email?: string;
  onSuccess?: () => void;
  className?: string;
}> = ({ email, onSuccess, className }) => {
  const { isAvailable, isLoading, authenticateWithBiometric } = useBiometricAuth();

  const isFaceId = React.useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac');
  }, []);

  const handleClick = async () => {
    const success = await authenticateWithBiometric(email);
    if (success) {
      onSuccess?.();
    }
  };

  if (!isAvailable) return null;

  const Icon = isFaceId ? ScanFace : Fingerprint;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border border-border',
        'bg-background transition-colors hover:bg-muted',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        isLoading && 'cursor-wait opacity-50',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Icon className="h-5 w-5 text-primary" />
      )}
    </motion.button>
  );
};

export default BiometricLoginButton;
