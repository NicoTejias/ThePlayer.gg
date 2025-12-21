/**
 * Admin Configuration
 * 
 * Este archivo define quiénes son los administradores de la plataforma.
 * Para agregar o quitar administradores, edita la lista ADMIN_EMAILS.
 */

// Lista de emails autorizados como administradores
export const ADMIN_EMAILS = [
    'nicotejias@gmail.com',
    'nicolas.tejias@gmail.com',
    'hugocastro.arts@gmail.com',
];

/**
 * Verifica si un email pertenece a un administrador
 */
export const isAdminEmail = (email: string | null | undefined): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Verifica si un perfil es de administrador
 */
export const isAdminProfile = (profile: any): boolean => {
    return isAdminEmail(profile?.email) || profile?.role === 'admin';
};
