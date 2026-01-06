import { z } from 'zod';

/**
 * Esquemas de validación con Zod
 * Usa estos esquemas ANTES de enviar datos a Supabase
 */

// Validación de perfil de usuario
export const ProfileUpdateSchema = z.object({
    username: z
        .string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
        .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos'),

    first_name: z
        .string()
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .optional(),

    last_name: z
        .string()
        .max(50, 'El apellido no puede exceder 50 caracteres')
        .optional(),

    bio: z
        .string()
        .max(500, 'La biografía no puede exceder 500 caracteres')
        .optional(),

    region: z
        .string()
        .max(100)
        .optional(),
});

// Validación de listing del marketplace
export const MarketplaceListingSchema = z.object({
    title: z
        .string()
        .min(5, 'El título debe tener al menos 5 caracteres')
        .max(100, 'El título no puede exceder 100 caracteres'),

    description: z
        .string()
        .min(10, 'La descripción debe tener al menos 10 caracteres')
        .max(2000, 'La descripción no puede exceder 2000 caracteres'),

    price: z
        .number()
        .min(0, 'El precio no puede ser negativo')
        .max(10000000, 'El precio es demasiado alto'),

    card_names: z
        .array(z.string().max(100))
        .min(1, 'Debes incluir al menos una carta')
        .max(50, 'No puedes incluir más de 50 cartas'),

    contact_info: z
        .string()
        .max(200, 'La información de contacto no puede exceder 200 caracteres')
        .optional(),
});

// Validación de resultados de torneo
export const TournamentResultSchema = z.object({
    player_name: z
        .string()
        .min(2, 'El nombre del jugador debe tener al menos 2 caracteres')
        .max(100, 'El nombre del jugador no puede exceder 100 caracteres'),

    placement: z
        .number()
        .int('La posición debe ser un número entero')
        .min(1, 'La posición debe ser al menos 1')
        .max(1000, 'La posición es demasiado alta'),

    wins: z
        .number()
        .int()
        .min(0, 'Las victorias no pueden ser negativas')
        .max(100, 'Demasiadas victorias'),

    losses: z
        .number()
        .int()
        .min(0, 'Las derrotas no pueden ser negativas')
        .max(100, 'Demasiadas derrotas'),

    draws: z
        .number()
        .int()
        .min(0, 'Los empates no pueden ser negativos')
        .max(100, 'Demasiados empates')
        .optional(),
});

// Validación de solicitud de tienda
export const StoreSubscriptionSchema = z.object({
    storeName: z
        .string()
        .min(3, 'El nombre de la tienda debe tener al menos 3 caracteres')
        .max(100, 'El nombre de la tienda no puede exceder 100 caracteres'),

    contactName: z
        .string()
        .min(3, 'El nombre de contacto debe tener al menos 3 caracteres')
        .max(100, 'El nombre de contacto no puede exceder 100 caracteres'),

    email: z
        .string()
        .email('Email inválido'),

    phone: z
        .string()
        .regex(/^[+]?[0-9\s()-]{8,20}$/, 'Teléfono inválido'),

    region: z
        .string()
        .min(1, 'Debes seleccionar una región'),

    plan: z
        .enum(['basic', 'medium', 'premium'], {
            errorMap: () => ({ message: 'Plan inválido' })
        }),

    message: z
        .string()
        .max(1000, 'El mensaje no puede exceder 1000 caracteres')
        .optional(),
});

// Helper para validar y obtener errores amigables
export const validateData = <T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = result.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
    );

    return { success: false, errors };
};
