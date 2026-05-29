// Supabase Edge Function: create-subscription
// Deploy: supabase functions deploy create-subscription

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

interface SubscriptionRequest {
    plan_type: 'monthly' | 'quarterly' | 'annual'
}

const PLAN_PRICES = {
    monthly: 5000,
    quarterly: 13500,
    annual: 48000,
}

const PLAN_FREQUENCIES = {
    monthly: { frequency: 1, frequency_type: 'months' },
    quarterly: { frequency: 3, frequency_type: 'months' },
    annual: { frequency: 1, frequency_type: 'years' },
}

serve(async (req) => {
    const origin = req.headers.get('origin')
    const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders(origin) })
    }

    try {
        // 1) Autenticación: el usuario debe presentar un JWT válido.
        const authHeader = req.headers.get('Authorization') ?? ''
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } },
        })
        const { data: { user }, error: authError } = await authClient.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers })
        }

        const { plan_type }: SubscriptionRequest = await req.json()
        if (!plan_type || !PLAN_PRICES[plan_type]) {
            return new Response(JSON.stringify({ error: 'Plan inválido' }), { status: 400, headers })
        }

        // El player_id y el email salen del token verificado, NO del body.
        const player_id = user.id
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get player profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', player_id)
            .single()

        if (profileError) throw profileError

        const payer_email = profile.email ?? user.email

        // Create MercadoPago subscription
        const price = PLAN_PRICES[plan_type]
        const frequency = PLAN_FREQUENCIES[plan_type]

        const subscriptionData = {
            reason: `ThePlayer PRO - ${plan_type}`,
            external_reference: player_id,
            payer_email: payer_email,
            auto_recurring: {
                frequency: frequency.frequency,
                frequency_type: frequency.frequency_type,
                transaction_amount: price,
                currency_id: 'CLP',
            },
            back_url: `${req.headers.get('origin')}/subscription/success`,
            status: 'pending',
        }

        const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriptionData),
        })

        if (!mpResponse.ok) {
            const error = await mpResponse.text()
            console.error('MercadoPago error:', error)
            throw new Error('Failed to create subscription in MercadoPago')
        }

        const mpData = await mpResponse.json()

        // Save subscription to database
        const { data: subscription, error: subError } = await supabase
            .from('player_subscriptions')
            .insert({
                player_id: player_id,
                plan_type: plan_type,
                status: 'pending',
                monthly_price: price,
                mp_preapproval_id: mpData.id,
                start_date: new Date().toISOString(),
            })
            .select()
            .single()

        if (subError) throw subError

        return new Response(
            JSON.stringify({
                success: true,
                init_point: mpData.init_point,
                subscription_id: subscription.id,
                mp_preapproval_id: mpData.id,
            }),
            {
                headers,
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers,
                status: 400,
            }
        )
    }
})
