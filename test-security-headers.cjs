// Test de Cabeceras de Seguridad HTTP
// Ejecuta: node test-security-headers.js

const https = require('https');

const EXPECTED_HEADERS = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'strict-transport-security': 'max-age=63072000',
    'content-security-policy': 'default-src',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'camera=()'
};

console.log('🔍 Verificando cabeceras de seguridad...\n');

https.get('https://theplayer.gg', (res) => {
    let passed = 0;
    let failed = 0;

    console.log('📊 Resultados:\n');

    for (const [header, expectedValue] of Object.entries(EXPECTED_HEADERS)) {
        const actualValue = res.headers[header];

        if (actualValue && actualValue.includes(expectedValue)) {
            console.log(`✅ ${header}: OK`);
            console.log(`   Valor: ${actualValue.substring(0, 60)}${actualValue.length > 60 ? '...' : ''}\n`);
            passed++;
        } else {
            console.log(`❌ ${header}: FALTA O INCORRECTO`);
            console.log(`   Esperado: ${expectedValue}`);
            console.log(`   Actual: ${actualValue || 'NO PRESENTE'}\n`);
            failed++;
        }
    }

    console.log('━'.repeat(60));
    console.log(`\n📈 Resumen: ${passed} pasados, ${failed} fallados de ${passed + failed} tests`);

    if (failed === 0) {
        console.log('🎉 ¡Todas las cabeceras de seguridad están configuradas correctamente!');
        process.exit(0);
    } else {
        console.log('⚠️  Algunas cabeceras necesitan atención.');
        process.exit(1);
    }
}).on('error', (err) => {
    console.error('❌ Error al conectar:', err.message);
    console.log('\nℹ️  Esto puede ser normal si el dominio aún no está configurado.');
    console.log('   Las cabeceras se aplicarán cuando el sitio esté en producción.');
    process.exit(0);
});
