// Supabase Edge Function: webhook-handler
// Deploy: supabase functions deploy webhook-handler

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse webhook data
        const body = await req.json()
        console.log('Webhook received:', body)

        const { type, data } = body

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
