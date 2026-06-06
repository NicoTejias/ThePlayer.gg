// Supabase Edge Function: gemini-flyer
// Genera el flyer del torneo con el modelo de imágenes de Gemini ("nano banana").
// Mantiene la API key en el servidor. Cachea una imagen por torneo en Storage:
// si el torneo es recurrente (mismo título+formato+tienda) reusa el mismo archivo.
//
// Deploy:  supabase functions deploy gemini-flyer
// Secret:  supabase secrets set GEMINI_API_KEY=tu_key   (la misma de gemini-chat)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BUCKET = 'event-flyers'
// Modelo de generación de imágenes de Gemini (alias "nano banana").
const IMAGE_MODEL = 'gemini-2.5-flash-image'

const ALLOWED_ORIGINS = [
    'https://theplayer.gg',
    'https://www.theplayer.gg',
    'https://theplayer.cl',
    'https://www.theplayer.cl',
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

interface FlyerRequest {
    title: string
    format: string
    storeName: string
    gameType?: string
}

// Hash estable (FNV-1a) → mismo torneo reusa la misma imagen.
async function hashKey(input: string): Promise<string> {
    const data = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
        .slice(0, 16)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

function buildPrompt({ title, format, storeName, gameType }: FlyerRequest): string {
    const game = (gameType || 'mtg').toLowerCase()
    let gameDesc = 'trading card game'
    if (game === 'mtg') gameDesc = 'Magic: The Gathering'
    else if (game === 'pokemon') gameDesc = 'Pokémon Trading Card Game'
    else if (game === 'yugioh') gameDesc = 'Yu-Gi-Oh!'
    else if (game === 'one_piece') gameDesc = 'One Piece Card Game'
    else if (game === 'lorcana') gameDesc = 'Disney Lorcana'
    else if (game === 'flesh_blood') gameDesc = 'Flesh and Blood'

    return `Create a vertical 1:1 epic competitive tournament poster artwork for a ${gameDesc} event. ` +
        `Tournament name: "${title}". Format: ${format}. Hosted at the game store "${storeName}". ` +
        `Style: dramatic cinematic fantasy illustration, dark mystical atmosphere, glowing magical energy and arcane effects, ` +
        `vibrant saturated colors, championship trophy, competitive gaming arena, professional esports key art. ` +
        `No text, no letters, no words in the image — only illustration. High detail, dynamic composition.`
}

serve(async (req) => {
    const origin = req.headers.get('origin')
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders(origin) })
    }

    try {
        const body = await req.json() as FlyerRequest
        if (!body?.title || !body?.format || !body?.storeName) {
            return new Response(JSON.stringify({ error: 'Faltan datos del torneo' }), { status: 400, headers })
        }

        const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

        // Clave de caché: mismo torneo (título+formato+tienda) → misma imagen.
        const key = await hashKey(`${body.title}|${body.format}|${body.storeName}|${body.gameType || 'mtg'}`)
        const path = `${key}.png`

        // ¿Ya existe? → devolver la URL cacheada (caso recurrente).
        const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: path })
        if (existing && existing.some((f) => f.name === path)) {
            const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
            return new Response(JSON.stringify({ url: pub.publicUrl, cached: true }), { status: 200, headers })
        }

        // Generar con Gemini.
        const prompt = buildPrompt(body)
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { responseModalities: ['IMAGE'] },
                }),
            }
        )

        if (!geminiRes.ok) {
            const errText = await geminiRes.text()
            console.error('Gemini image API error:', errText)
            return new Response(JSON.stringify({ error: 'No se pudo generar la imagen', detail: errText }), { status: 502, headers })
        }

        const data = await geminiRes.json()
        const parts = data?.candidates?.[0]?.content?.parts ?? []
        const imagePart = parts.find((p: any) => p?.inlineData?.data)
        if (!imagePart) {
            console.error('Gemini sin imagen en la respuesta:', JSON.stringify(data).slice(0, 500))
            return new Response(JSON.stringify({ error: 'La IA no devolvió una imagen' }), { status: 502, headers })
        }

        // base64 → bytes
        const b64 = imagePart.inlineData.data as string
        const mime = imagePart.inlineData.mimeType || 'image/png'
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

        // Subir a Storage (cachea para los recurrentes).
        const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, bytes, { contentType: mime, upsert: true })
        if (upErr) {
            console.error('Error subiendo flyer a storage:', upErr)
            // Aun si falla la subida, devolvemos la imagen inline como fallback.
            return new Response(JSON.stringify({ dataUrl: `data:${mime};base64,${b64}` }), { status: 200, headers })
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
        return new Response(JSON.stringify({ url: pub.publicUrl, cached: false }), { status: 200, headers })
    } catch (error) {
        console.error('gemini-flyer error:', error)
        return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500, headers })
    }
})
