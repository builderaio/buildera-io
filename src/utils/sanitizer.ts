import DOMPurify from 'dompurify';

// Configuración segura para DOMPurify
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th',
    'thead', 'tbody', 'blockquote', 'pre', 'code'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  SANITIZE_NAMED_PROPS: true,
  WHOLE_DOCUMENT: false,
  IN_PLACE: false
};

/**
 * Sanitiza contenido HTML para prevenir ataques XSS
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
};

/**
 * Configuración más restrictiva para email templates
 */
const EMAIL_TEMPLATE_CONFIG = {
  ...SAFE_HTML_CONFIG,
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'table', 'tr', 'td', 'th',
    'thead', 'tbody'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class']
};

/**
 * Sanitiza contenido HTML específicamente para email templates
 */
export const sanitizeEmailTemplate = (dirty: string): string => {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }
  
  return DOMPurify.sanitize(dirty, EMAIL_TEMPLATE_CONFIG);
};

/**
 * Valida y sanitiza input de usuario básico
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remover caracteres peligrosos
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  
  return cleaned.substring(0, maxLength);
};

/**
 * Hook para usar sanitización segura en React
 */
export const useSafeHtml = (html: string) => {
  return {
    __html: sanitizeHtml(html)
  };
};

/**
 * Hook para usar sanitización de email templates en React
 */
export const useSafeEmailHtml = (html: string) => {
  return {
    __html: sanitizeEmailTemplate(html)
  };
};