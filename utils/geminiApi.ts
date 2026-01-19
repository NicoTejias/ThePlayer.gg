import { supabase } from '../supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

/**
 * Fetches dynamic context from the database to "teach" Gemini about the current state of the platform.
 */
async function getPlatformContext() {
    try {
        // Fetch Stores
        const { data: stores } = await supabase
            .from('profiles')
            .select('username, city, bio')
            .eq('role', 'store');

        // Fetch Upcoming Tournaments
        const { data: tournaments } = await supabase
            .from('community_events')
            .select('title, event_date, description, store_name')
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(10);

        const storesCtx = stores?.map(s => `- ${s.username} en ${s.city || 'Chile'}: ${s.bio || ''}`).join('\n') || 'No hay tiendas registradas aún.';
        const tournamentsCtx = tournaments?.map(t => `- ${t.title} el ${new Date(t.event_date).toLocaleDateString()}: Organizado por ${t.store_name}`).join('\n') || 'No hay torneos próximos programados.';

        return `
Eres el asistente oficial de ThePlayer.gg (La mayor plataforma de TCG de Chile).
Tu objetivo es ayudar a los jugadores a encontrar dónde jugar y explicar cómo funciona el sistema de ranking.

INFORMACIÓN ACTUAL DE LA PLATAFORMA:
TIENDAS REGISTRADAS:
${storesCtx}

PRÓXIMOS TORNEOS:
${tournamentsCtx}

REGLAS DEL RANKING PWP:
- Los puntos se ganan jugando y ganando en tiendas oficiales.
- El ranking clasifica al Nacional Invitacional (Top 64 o 128).
- Da "Byes" (rondas libres) para los Grand Prix (torneos abiertos).
- Al final de la temporada, hay un "Soft Reset": los jugadores conservan el 50% de sus puntos para el año siguiente.

INSTRUCCIONES:
- Sé amable, entusiasta y "gamer".
- Si te preguntan donde jugar, sugiere las tiendas de la lista.
- Si te preguntan por torneos, menciona los próximos.
- Responde siempre en español.
- Mantén las respuestas concisas y útiles.
`;
    } catch (error) {
        console.error('Error fetching context for AI:', error);
        return 'Eres el asistente oficial de ThePlayer.gg. Ayuda en lo que puedas.';
    }
}

export async function sendMessageToGemini(history: ChatMessage[], userInput: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const systemPrompt = await getPlatformContext();

    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Entendido. Soy el asistente oficial de ThePlayer.gg. ¿En qué puedo ayudarte hoy?" }] },
            ...history
        ],
    });

    const result = await chat.sendMessage(userInput);
    const response = await result.response;
    return response.text();
}
