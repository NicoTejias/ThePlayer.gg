// Supabase Edge Function: create-subscription
// Deploy: supabase functions deploy create-subscription

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionRequest {
    player_id: string
    plan_type: 'monthly' | 'quarterly' | 'annual'
    payer_email: string
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
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { player_id, plan_type, payer_email }: SubscriptionRequest = await req.json()

        // Validate input
        if (!player_id || !plan_type || !payer_email) {
            throw new Error('Missing required fields')
        }

        // Get player profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', player_id)
            .single()

        if (profileError) throw profileError

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
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
