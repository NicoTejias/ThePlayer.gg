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

/**
 * Suscripción efectiva de un perfil.
 *
 * Los administradores tienen suscripción ILIMITADA: se les trata como tier
 * máximo (premium), Pro, y sin expiración en cualquier chequeo de la app.
 * Para el resto de usuarios devuelve sus valores reales del perfil.
 */
export const getEffectiveTier = (profile: any): string => {
    if (isAdminProfile(profile)) return 'premium';
    return profile?.subscription_tier || 'free';
};

/**
 * Indica si el perfil debe tratarse como suscriptor premium activo
 * (incluye a los administradores, que tienen acceso ilimitado).
 */
export const hasPremiumAccess = (profile: any): boolean => {
    if (isAdminProfile(profile)) return true;
    const tier = profile?.subscription_tier;
    return tier === 'premium' || tier === 'vip';
};

/**
 * Indica si el perfil debe tratarse como Pro (incluye administradores).
 */
export const isEffectivePro = (profile: any): boolean => {
    return isAdminProfile(profile) || profile?.is_pro === true;
};
