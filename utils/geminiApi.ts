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
