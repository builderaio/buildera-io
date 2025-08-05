import { useState } from 'react';
import { sanitizeInput } from '@/utils/sanitizer';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  identifier: string;
}

const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Hook para implementar rate limiting en operaciones sensibles
 */
export const useRateLimit = (config: RateLimitConfig) => {
  const [isBlocked, setIsBlocked] = useState(false);
  
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const key = config.identifier;
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset o primera vez
      rateLimitStore.set(key, {
        attempts: 1,
        resetTime: now + config.windowMs
      });
      setIsBlocked(false);
      return true;
    }
    
    if (current.attempts >= config.maxAttempts) {
      setIsBlocked(true);
      return false;
    }
    
    // Incrementar intentos
    current.attempts++;
    rateLimitStore.set(key, current);
    setIsBlocked(false);
    return true;
  };
  
  const getRemainingTime = (): number => {
    const current = rateLimitStore.get(config.identifier);
    if (!current) return 0;
    
    return Math.max(0, current.resetTime - Date.now());
  };
  
  return {
    checkRateLimit,
    isBlocked,
    getRemainingTime
  };
};

/**
 * Validación de input con sanitización automática
 */
export const useSecureInput = (maxLength: number = 1000) => {
  const [value, setValue] = useState('');
  
  const setSecureValue = (input: string) => {
    const sanitized = sanitizeInput(input, maxLength);
    setValue(sanitized);
  };
  
  return {
    value,
    setValue: setSecureValue,
    length: value.length,
    maxLength
  };
};

/**
 * Validación de archivos de upload
 */
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Tamaño máximo: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    errors.push('File size must be less than 10MB');
  }
  
  // Tipos permitidos
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Validar extensión del archivo
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv', 'docx', 'xlsx'];
  
  if (!extension || !allowedExtensions.includes(extension)) {
    errors.push('File extension not allowed');
  }
  
  // Validar nombre del archivo
  if (file.name.length > 255) {
    errors.push('File name too long');
  }
  
  // Verificar caracteres peligrosos en el nombre
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(file.name)) {
    errors.push('File name contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Monitoreo de actividades sospechosas
 */
export const logSecurityEvent = async (event: {
  type: 'login_attempt' | 'password_reset' | 'file_upload' | 'admin_access' | 'suspicious_activity';
  userId?: string;
  details: Record<string, any>;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}) => {
  try {
    // En una implementación real, esto enviaría a un servicio de logging
    console.warn('Security Event:', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'client_side', // En el servidor se obtendría la IP real
      ...event
    });
    
    // Aquí podrías enviar a un servicio de monitoreo como Datadog, Sentry, etc.
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

/**
 * Detección de patrones sospechosos
 */
export const detectSuspiciousActivity = (activity: {
  rapidRequests?: boolean;
  unusualTime?: boolean;
  multipleFailedLogins?: boolean;
  adminAccess?: boolean;
}) => {
  const suspiciousFactors = Object.values(activity).filter(Boolean).length;
  
  if (suspiciousFactors >= 3) {
    logSecurityEvent({
      type: 'suspicious_activity',
      details: activity,
      risk_level: 'critical'
    });
    return 'critical';
  } else if (suspiciousFactors >= 2) {
    logSecurityEvent({
      type: 'suspicious_activity',
      details: activity,
      risk_level: 'high'
    });
    return 'high';
  } else if (suspiciousFactors >= 1) {
    return 'medium';
  }
  
  return 'low';
};