import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar API Key del Header de Autorización
    const authHeader = req.headers.get('Authorization')
    const systemApiKey = Deno.env.get('THEPLAYER_API_KEY')

    if (!systemApiKey) {
      return new Response(
        JSON.stringify({ error: 'Configuración del servidor incompleta (THEPLAYER_API_KEY no definida)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authHeader || authHeader !== `Bearer ${systemApiKey}`) {
      return new Response(
        JSON.stringify({ error: 'No autorizado: API Key inválida o ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { tournament, results } = body

    if (!tournament || !results || !Array.isArray(results)) {
      return new Response(
        JSON.stringify({ error: 'Payload inválido: se requieren campos tournament y results' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Inicializar cliente Supabase con el rol de servicio
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Crear torneo en borrador/final usando RPC
    // RPC Firma: create_tournament_via_rpc(p_id, p_name, p_date, p_store_name, p_format, p_player_count, p_game_type, p_league_id)
    const { error: tError } = await supabase.rpc('create_tournament_via_rpc', {
      p_id: tournament.id,
      p_name: tournament.name,
      p_date: tournament.date,
      p_store_name: tournament.store_name || 'Tienda Oficial',
      p_format: tournament.format || 'Standard',
      p_player_count: results.length,
      p_game_type: tournament.game_type || 'mtg',
      p_league_id: null
    })

    if (tError) {
      throw new Error(`Error en create_tournament_via_rpc: ${tError.message}`)
    }

    // 4. Mapear resultados al formato del RPC bulk de standings
    const resultsToUpload = results.map((r: any) => ({
      player_name: r.player_name,
      wins: r.wins ?? 0,
      losses: r.losses ?? 0,
      draws: r.draws ?? 0,
      pwp_earned: r.pwp_earned ?? 0,
      rank: r.rank ?? null
    }))

    // 5. Insertar resultados masivos y aplicar alias matching
    const { error: rpcError } = await supabase.rpc('process_tournament_results_bulk', {
      p_tournament_id: tournament.id,
      p_results: resultsToUpload
    })

    if (rpcError) {
      throw new Error(`Error en process_tournament_results_bulk: ${rpcError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Torneo y resultados sincronizados con éxito' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e.message || 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
