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

const main = async () => {
    const userId = 'ec7682a3-4805-48d0-82cb-05c074766ab6'; // NicoTejias (nicolas.tejias@gmail.com)
    
    // Get current profile
    const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
        
    if (fetchError) {
        console.error("Error al obtener perfil:", fetchError.message);
        process.exit(1);
    }
    
    const currentRole = profile.role;
    const newRole = currentRole === 'admin' ? 'store' : 'admin';
    
    console.log(`Usuario: "${profile.username}"`);
    console.log(`Rol actual: "${currentRole}"`);
    console.log(`Cambiando a: "${newRole}"...`);
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
    if (updateError) {
        console.error("Error al actualizar:", updateError.message);
        process.exit(1);
    }
    
    console.log(`✅ ¡Rol actualizado con éxito! Nuevo rol: "${newRole}".`);
    console.log("Por favor refresca la aplicación o reinicia sesión para ver los cambios.");
};

main();
