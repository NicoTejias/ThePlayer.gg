// Supabase Edge Function: webhook-handler
// Deploy: supabase functions deploy webhook-handler

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Secreto de la firma del webhook (MercadoPago > Notificaciones webhook).
// Configurar con: supabase secrets set MERCADOPAGO_WEBHOOK_SECRET=...
const MERCADOPAGO_WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')

/**
 * Verifica la firma HMAC-SHA256 de MercadoPago.
 * Plantilla firmada: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 */
async function isValidSignature(req: Request, dataId: string): Promise<boolean> {
    // Si no hay secreto configurado, no podemos validar: rechazamos por seguridad.
    if (!MERCADOPAGO_WEBHOOK_SECRET) {
        console.error('MERCADOPAGO_WEBHOOK_SECRET no configurado: webhook rechazado.')
        return false
    }

    const xSignature = req.headers.get('x-signature')
    const xRequestId = req.headers.get('x-request-id')
    if (!xSignature || !xRequestId) return false

    // x-signature: "ts=...,v1=..."
    const parts = Object.fromEntries(
        xSignature.split(',').map((kv) => kv.split('=').map((s) => s.trim()) as [string, string])
    )
    const ts = parts['ts']
    const v1 = parts['v1']
    if (!ts || !v1) return false

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(MERCADOPAGO_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
    const computed = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, '0')).join('')

    // Comparación en tiempo (razonablemente) constante.
    if (computed.length !== v1.length) return false
    let diff = 0
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i)
    return diff === 0
}

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse webhook data
        const body = await req.json()

        const { type, data } = body

        // Validar la firma ANTES de procesar nada.
        const dataId = String(data?.id ?? '')
        if (!(await isValidSignature(req, dataId))) {
            return new Response('Invalid signature', { status: 401 })
        }

        // Handle different webhook events
        if (type === 'payment') {
            const paymentId = data.id

            // Get payment details from MercadoPago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                },
            })

            if (!mpResponse.ok) {
                throw new Error('Failed to fetch payment from MercadoPago')
            }

            const payment = await mpResponse.json()

            // Find subscription by preapproval_id
            const { data: subscription } = await supabase
                .from('player_subscriptions')
                .select('*')
                .eq('mp_preapproval_id', payment.preapproval_id)
                .single()

            if (!subscription) {
                console.log('Subscription not found for payment:', payment.id)
                return new Response('Subscription not found', { status: 404 })
            }

            // Save payment to history
            await supabase.from('payment_history').insert({
                subscription_id: subscription.id,
                mp_payment_id: payment.id.toString(),
                amount: payment.transaction_amount,
                currency: payment.currency_id,
                status: payment.status,
                status_detail: payment.status_detail,
                payment_type: payment.payment_type_id,
                payment_method_id: payment.payment_method_id,
                payment_date: payment.date_approved || new Date().toISOString(),
            })

            // If payment approved, trigger will update subscription and profile
            console.log('Payment processed:', payment.id, 'Status:', payment.status)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
