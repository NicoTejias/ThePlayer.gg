const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '..', '.env'); // D:\Proyectos\ThePlayer.gg\.env
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error("Could not find .env file at " + envPath);
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env file.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const main = async () => {
    console.log("=== Utilitario para Asignar Rol de Tienda (TO) ===");
    
    // Fetch last 15 registered profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, role, status, first_name, last_name')
        .order('created_at', { ascending: false })
        .limit(15);
        
    if (error) {
        console.error("Error al obtener perfiles:", error.message);
        process.exit(1);
    }

    if (!profiles || profiles.length === 0) {
        console.log("No se encontraron perfiles registrados en la base de datos.");
        process.exit(0);
    }

    console.log("\nPerfiles recientes en la base de datos:");
    profiles.forEach((p, idx) => {
        const name = p.username || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin Nombre';
        console.log(`[${idx + 1}] Nombre: "${name}" | Rol actual: "${p.role}" | Status: "${p.status}" | ID: ${p.id}`);
    });

    const targetIndex = process.argv[2] ? parseInt(process.argv[2]) - 1 : -1;
    
    if (targetIndex < 0 || targetIndex >= profiles.length) {
        console.log(`\nUsa: node scratch/make_store.cjs <número_de_la_lista>`);
        console.log(`Ejemplo para el primer perfil de la lista: node scratch/make_store.cjs 1`);
        process.exit(0);
    }

    const targetUser = profiles[targetIndex];
    const targetName = targetUser.username || `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() || 'Sin Nombre';
    
    console.log(`\nActualizando perfil "${targetName}"...`);
    
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({
            role: 'store',
            status: 'active'
        })
        .eq('id', targetUser.id)
        .select();

    if (updateError) {
        console.error("❌ Error al actualizar el rol:", updateError.message);
        process.exit(1);
    }

    console.log(`\n✅ ¡Éxito! El perfil de "${targetName}" ahora es una TIENDA (store) activa.`);
    console.log(`Por favor reinicia sesión o refresca la página de la aplicación.`);
};

main();
