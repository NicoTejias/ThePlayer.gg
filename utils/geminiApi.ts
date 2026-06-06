import { supabase } from '../supabaseClient';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

/**
 * Envía un mensaje al asistente.
 * La lógica y la API key de Gemini viven en la Edge Function "gemini-chat" (servidor),
 * por lo que la key nunca se expone en el bundle del cliente.
 */
export async function sendMessageToGemini(history: ChatMessage[], userInput: string): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: { history, message: userInput },
    });

    if (error) {
        console.error('Error llamando a gemini-chat:', error);
        throw error;
    }

    return data?.text ?? 'Lo siento, no pude generar una respuesta.';
}

export interface FlyerEventInput {
    title: string;
    format: string;
    storeName: string;
    gameType?: string;
}

/**
 * Genera (o reutiliza) el flyer del torneo con el modelo de imágenes de Gemini.
 * La lógica y la API key viven en la Edge Function "gemini-flyer".
 * Los torneos recurrentes (mismo título+formato+tienda) reusan la misma imagen.
 * Devuelve una URL pública del bucket o un data: URL de fallback.
 */
export async function generateEventFlyer(event: FlyerEventInput): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini-flyer', {
        body: event,
    });

    if (error) {
        console.error('Error llamando a gemini-flyer:', error);
        throw error;
    }
    const url = data?.url ?? data?.dataUrl;
    if (!url) {
        throw new Error(data?.error || 'No se pudo generar el flyer');
    }
    return url;
}
