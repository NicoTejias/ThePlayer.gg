const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error("Could not find .env file");
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
        env[key] = value;
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRPC() {
    console.log("Supabase URL:", supabaseUrl);
    
    // Generar un ID temporal
    const tempId = '00000000-0000-0000-0000-000000000000';

    console.log("\n--- Probando create_tournament_via_rpc con 'mtg' ---");
    const { error: errorMtg } = await supabase.rpc('create_tournament_via_rpc', {
        p_id: tempId,
        p_name: "Test MTG",
        p_date: "2026-06-09",
        p_store_name: "Tienda Test",
        p_format: "Standard",
        p_player_count: 8,
        p_game_type: "mtg",
        p_league_id: null
    });
    
    if (errorMtg) {
        console.error("❌ Falló con 'mtg':", errorMtg.message, errorMtg);
    } else {
        console.log("✅ Éxito o ya existe con 'mtg'.");
    }

    console.log("\n--- Probando create_tournament_via_rpc con 'flesh_blood' ---");
    const { error: errorFab } = await supabase.rpc('create_tournament_via_rpc', {
        p_id: tempId,
        p_name: "Test FAB",
        p_date: "2026-06-09",
        p_store_name: "Tienda Test",
        p_format: "Classic Constructed",
        p_player_count: 8,
        p_game_type: "flesh_blood",
        p_league_id: null
    });

    if (errorFab) {
        console.error("❌ Falló con 'flesh_blood':", errorFab.message, errorFab);
    } else {
        console.log("✅ Éxito con 'flesh_blood'.");
    }

    console.log("\n--- Probando create_tournament_via_rpc con 'digimon' ---");
    const { error: errorDigimon } = await supabase.rpc('create_tournament_via_rpc', {
        p_id: tempId,
        p_name: "Test Digimon",
        p_date: "2026-06-09",
        p_store_name: "Tienda Test",
        p_format: "Standard",
        p_player_count: 8,
        p_game_type: "digimon",
        p_league_id: null
    });

    if (errorDigimon) {
        console.error("❌ Falló con 'digimon':", errorDigimon.message, errorDigimon);
    } else {
        console.log("✅ Éxito con 'digimon'.");
    }
}

testRPC().catch(err => console.error(err));
