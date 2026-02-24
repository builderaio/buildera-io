import { useCallback } from 'react';
import { logSecurityEvent } from '@/hooks/useSecurity';

interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
}

/**
 * CSP configuration for the application (via meta tag).
 * NOTE: Only CSP and Referrer-Policy work as meta tags.
 * All other security headers (HSTS, X-Frame-Options, Permissions-Policy, etc.)
 * are configured via public/_headers as real HTTP headers.
 * 
 * unsafe-inline in style-src: REQUIRED by Tailwind CSS and shadcn/ui (inline styles).
 * unsafe-eval REMOVED: framer-motion does not require it in production builds.
 */
const DEFAULT_CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://hcaptcha.com https://*.hcaptcha.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://hcaptcha.com https://*.hcaptcha.com;
  frame-src 'self' https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

/**
 * Hook to apply CSP and Referrer-Policy via meta tags.
 * Other security headers are applied as real HTTP headers in public/_headers.
 */
export const useSecurityHeaders = (config: SecurityHeadersConfig = {}) => {
  const applySecurityHeaders = useCallback(() => {
    try {
      // Content Security Policy (valid as meta tag)
      const csp = config.contentSecurityPolicy || DEFAULT_CSP;
      
      let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (!cspMeta) {
        cspMeta = document.createElement('meta');
        cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
        document.head.appendChild(cspMeta);
      }
      cspMeta.setAttribute('content', csp);
      
      // Referrer Policy (valid as meta tag)
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
    }
  }, [config]);
  
  return { applySecurityHeaders };
};

/**
 * Secure error handler that doesn't leak sensitive information
 */
export const useSecureErrorHandler = () => {
  const handleError = useCallback((error: any, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Secure Error Handler:', { error, context });
    }
    
    logSecurityEvent({
      type: 'suspicious_activity',
      details: {
        context,
        errorType: error?.name || 'Unknown',
        userAgent: navigator.userAgent
      },
      risk_level: 'medium'
    });
    
    let userMessage = 'An unexpected error occurred. Please try again.';
    
    if (error?.message?.includes('Network')) {
      userMessage = 'Network error. Please check your connection.';
    } else if (error?.message?.includes('Authentication')) {
      userMessage = 'Authentication failed. Please log in again.';
    } else if (error?.message?.includes('Permission')) {
      userMessage = 'You do not have permission to perform this action.';
    }
    
    return userMessage;
  }, []);
  
  return { handleError };
};

/**
 * HTTPS validation in production
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
    
    location.replace(location.href.replace('http:', 'https:'));
    return false;
  }
  return true;
};
