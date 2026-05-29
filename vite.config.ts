import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
            dest: 'pdf-worker'
          }
        ]
      })
    ],
    // Elimina console.* y debugger del bundle de producción.
    // (La API key de Gemini ya NO se inyecta en el cliente: vive en la Edge Function "gemini-chat").
    esbuild: isProd ? { drop: ['console', 'debugger'] } : {},
    build: {
      rollupOptions: {
        output: {
          // Separa las librerías pesadas en chunks propios para que se cacheen
          // de forma independiente y no inflen el bundle de cada página.
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['pdfjs-dist', 'pdf-parse'],
            'vendor-markdown': ['react-markdown'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-particles': ['react-tsparticles', 'tsparticles-slim'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
