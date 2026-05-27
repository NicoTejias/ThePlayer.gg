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
    const { data: admins, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

    if (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }

    console.log("=== Admins in Profiles ===");
    console.log(admins);
};

main();
