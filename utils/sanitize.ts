import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir ataques XSS
 * Usa esto SIEMPRE que renderices contenido generado por usuarios
 */
export const sanitizeHtml = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    });
};

/**
 * Sanitiza texto plano (elimina TODO el HTML)
 * Usa esto para campos que NO deberían tener formato
 */
export const sanitizeText = (dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    });
};

/**
 * Valida y sanitiza URL
 * Previene javascript:, data:, y otros esquemas peligrosos
 */
export const sanitizeUrl = (url: string): string => {
    try {
        const parsed = new URL(url);
        // Solo permitir http y https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return '#';
        }
        return DOMPurify.sanitize(url);
    } catch {
        return '#'; // URL inválida
    }
};

/**
 * Escapa caracteres especiales para uso en SQL LIKE
 * (Aunque Supabase usa queries parametrizadas, esto es una capa extra)
 */
export const escapeSqlLike = (value: string): string => {
    return value.replace(/[%_\\]/g, '\\$&');
};
