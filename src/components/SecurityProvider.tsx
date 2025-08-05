import { useEffect } from 'react';
import { useSecurityHeaders, validateSecureConnection } from '@/hooks/useSecurityHeaders';

/**
 * Security Provider component que aplica configuraciones de seguridad globales
 */
interface SecurityProviderProps {
  children: React.ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  const { applySecurityHeaders } = useSecurityHeaders();
  
  useEffect(() => {
    // Validar conexión segura
    if (!validateSecureConnection()) {
      return;
    }
    
    // Aplicar security headers
    applySecurityHeaders();
    
    // Detectar herramientas de desarrollo abiertas (solo en producción)
    if (process.env.NODE_ENV === 'production') {
      const detectDevTools = () => {
        const threshold = 160;
        const isDevToolsOpen = 
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold;
        
        if (isDevToolsOpen) {
          console.clear();
          console.warn('%cDETENTE!', 'color: red; font-size: 50px; font-weight: bold;');
          console.warn('%cEsta es una función del navegador destinada para desarrolladores. Si alguien te dijo que pegues algo aquí para activar una función o "hackear" la cuenta de alguien, es una estafa y te dará acceso a tu cuenta.', 'color: red; font-size: 16px;');
        }
      };
      
      setInterval(detectDevTools, 1000);
    }
    
    // Detectar copy/paste en campos sensibles
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.getAttribute('data-sensitive') === 'true') {
        console.warn('Paste detected in sensitive field');
      }
    };
    
    document.addEventListener('paste', handlePaste);
    
    // Prevenir drag and drop no autorizado
    const preventUnauthorizedDrop = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (!target.hasAttribute('data-allow-drop')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('dragover', preventUnauthorizedDrop);
    document.addEventListener('drop', preventUnauthorizedDrop);
    
    // Cleanup
    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragover', preventUnauthorizedDrop);
      document.removeEventListener('drop', preventUnauthorizedDrop);
    };
  }, [applySecurityHeaders]);
  
  return <>{children}</>;
};