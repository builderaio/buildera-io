import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logSecurityEvent } from '@/hooks/useSecurity';

interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  enableHSTS?: boolean;
  enableFrameProtection?: boolean;
  enableContentTypeProtection?: boolean;
}

/**
 * Security headers configuration for the application
 */
const DEFAULT_CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co;
  frame-src 'self' https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

/**
 * Hook para aplicar security headers mediante meta tags
 */
export const useSecurityHeaders = (config: SecurityHeadersConfig = {}) => {
  const { toast } = useToast();
  
  const applySecurityHeaders = useCallback(() => {
    try {
      // Content Security Policy
      const csp = config.contentSecurityPolicy || DEFAULT_CSP;
      
      // Aplicar CSP mediante meta tag
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        document.head.appendChild(cspMeta);
      }
      cspMeta.setAttribute('content', csp);
      
      // X-Frame-Options protection
      if (config.enableFrameProtection !== false) {
        let frameMeta = document.querySelector('meta[http-equiv="X-Frame-Options"]');
        if (!frameMeta) {
          frameMeta = document.createElement('meta');
          frameMeta.setAttribute('http-equiv', 'X-Frame-Options');
          frameMeta.setAttribute('content', 'DENY');
          document.head.appendChild(frameMeta);
        }
      }
      
      // X-Content-Type-Options
      if (config.enableContentTypeProtection !== false) {
        let contentTypeMeta = document.querySelector('meta[http-equiv="X-Content-Type-Options"]');
        if (!contentTypeMeta) {
          contentTypeMeta = document.createElement('meta');
          contentTypeMeta.setAttribute('http-equiv', 'X-Content-Type-Options');
          contentTypeMeta.setAttribute('content', 'nosniff');
          document.head.appendChild(contentTypeMeta);
        }
      }
      
      // Referrer Policy
      let referrerMeta = document.querySelector('meta[name="referrer"]');
      if (!referrerMeta) {
        referrerMeta = document.createElement('meta');
        referrerMeta.setAttribute('name', 'referrer');
        referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin');
        document.head.appendChild(referrerMeta);
      }
      
      logSecurityEvent({
        type: 'admin_access',
        details: { action: 'security_headers_applied' },
        risk_level: 'low'
      });
      
    } catch (error) {
      console.error('Failed to apply security headers:', error);
      toast({
        title: "Security Warning",
        description: "Failed to apply security headers. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [config, toast]);
  
  return { applySecurityHeaders };
};

/**
 * Error handler que no filtra información sensible
 */
export const useSecureErrorHandler = () => {
  const { toast } = useToast();
  
  const handleError = useCallback((error: any, context?: string) => {
    // Log completo para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.error('Secure Error Handler:', { error, context });
    }
    
    // Log de seguridad
    logSecurityEvent({
      type: 'suspicious_activity',
      details: {
        context,
        errorType: error?.name || 'Unknown',
        userAgent: navigator.userAgent
      },
      risk_level: 'medium'
    });
    
    // Mensaje genérico al usuario (no revelar detalles internos)
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    // Solo mostrar errores específicos seguros
    if (error?.message?.includes('Network')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error?.message?.includes('Authentication')) {
      userMessage = 'Authentication failed. Please log in again.';
    } else if (error?.message?.includes('Permission')) {
      userMessage = 'You do not have permission to perform this action.';
    }
    
    toast({
      title: "Error",
      description: userMessage,
      variant: "destructive"
    });
    
    return userMessage;
  }, [toast]);
  
  return { handleError };
};

/**
 * Validación de HTTPS en producción
 */
export const validateSecureConnection = () => {
  if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
    logSecurityEvent({
      type: 'suspicious_activity',
      details: { 
        issue: 'insecure_connection',
        protocol: location.protocol,
        host: location.host
      },
      risk_level: 'critical'
    });
    
    // Redirigir a HTTPS
    location.replace(location.href.replace('http:', 'https:'));
    return false;
  }
  return true;
};