// Supabase Edge Function: gemini-chat
// Mantiene la API key de Gemini en el servidor (NUNCA en el cliente).
// Deploy:  supabase functions deploy gemini-chat
// Secret:  supabase secrets set GEMINI_API_KEY=tu_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Restringe el origen a los dominios propios. Ajusta si usas otro dominio/preview.
const ALLOWED_ORIGINS = [
    'https://theplayer.gg',
    'https://www.theplayer.gg',
    'http://localhost:3000',
    'http://localhost:3001',
]

function corsHeaders(origin: string | null) {
    const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Vary': 'Origin',
    }
}

interface ChatMessage {
    role: 'user' | 'model'
    parts: { text: string }[]
}

async function getPlatformContext(): Promise<string> {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

        const { data: stores } = await supabase
            .from('profiles')
            .select('username, city, bio')
            .eq('role', 'store')

        const { data: tournaments } = await supabase
            .from('community_events')
            .select('title, event_date, description, store_name')
            .gte('event_date', new Date().toISOString())
            .order('event_date', { ascending: true })
            .limit(10)

        const storesCtx = stores?.map((s: any) => `- ${s.username} en ${s.city || 'Chile'}: ${s.bio || ''}`).join('\n') || 'No hay tiendas registradas aún.'
        const tournamentsCtx = tournaments?.map((t: any) => `- ${t.title} el ${new Date(t.event_date).toLocaleDateString()}: Organizado por ${t.store_name}`).join('\n') || 'No hay torneos próximos programados.'

        return `
Eres el asistente oficial de ThePlayer.gg (La mayor plataforma de TCG de Chile).
Tu objetivo es ayudar a los jugadores a encontrar dónde jugar y explicar cómo funciona el sistema de ranking.

INFORMACIÓN ACTUAL DE LA PLATAFORMA:
TIENDAS REGISTRADAS:
${storesCtx}

PRÓXIMOS TORNEOS:
${tournamentsCtx}

REGLAS DEL RANKING (Player Points):
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
`
    } catch (_e) {
        return 'Eres el asistente oficial de ThePlayer.gg. Ayuda en lo que puedas.'
    }
}

serve(async (req) => {
    const origin = req.headers.get('origin')
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders(origin) })
    }

    try {
        const { history, message } = await req.json() as { history: ChatMessage[]; message: string }

        if (!message || typeof message !== 'string' || message.length > 4000) {
            return new Response(JSON.stringify({ error: 'Mensaje inválido' }), { status: 400, headers })
        }

        const systemPrompt = await getPlatformContext()
        const safeHistory = Array.isArray(history) ? history.slice(-20) : []

        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido. Soy el asistente oficial de ThePlayer.gg. ¿En qué puedo ayudarte hoy?' }] },
            ...safeHistory,
            { role: 'user', parts: [{ text: message }] },
        ]

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
            }
        )

        if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            console.error('Gemini API error:', errText)
            return new Response(JSON.stringify({ error: 'Error del asistente' }), { status: 502, headers })
        }

        const data = await geminiRes.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            ?? 'Lo siento, no pude generar una respuesta.'

        return new Response(JSON.stringify({ text }), { status: 200, headers })
    } catch (error) {
        console.error('gemini-chat error:', error)
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers })
    }
})
