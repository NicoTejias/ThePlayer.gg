// --- Importamos las "Herramientas" que instalamos ---
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// --- 1. CONECTARNOS A LA BASE DE DATOS ---
// Vercel nos da las llaves que guardamos en el PASO 2
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- 2. ESTA ES LA FUNCIÓN DEL "MOTOR" ---
// Se activa cada vez que alguien llama a ".../api/subir-torneo"
export default async function handler(request, response) {

  // --- 3. REVISAR SI ES UN ENVÍO DE DATOS (POST) ---
  if (request.method !== 'POST') {
    // Si no es POST, rechazarlo.
    return response.status(405).json({ message: 'Método no permitido. Solo se acepta POST.' });
  }

  try {
    // --- 4. LEER LOS DATOS DEL FORMULARIO ---
    // El frontend nos enviará un JSON con los datos
    const datos = request.body;

    // TODO: PASO FUTURO
    // Aquí es donde pondremos la lógica del PARSER
    // 1. Leer datos.contenidoHTML con 'cheerio'
    // 2. Identificar si es Eventlink o Melee
    // 3. Extraer los [nombre, ganados, perdidos, empatados]
    // 4. Calcular los puntos PWP con la fórmula
    // 5. Guardar en Supabase: await supabase.from('torneos').insert(...)

    console.log("¡El motor (backend) recibió estos datos!", datos);

    // --- 5. RESPONDER A LA PÁGINA (FRONTEND) ---
    // Por ahora, solo respondemos que recibimos los datos
    response.status(200).json({
      message: '¡Backend conectado! Recibimos tus datos. (Aún no estamos procesando el archivo).',
      datosRecibidos: datos
    });

  } catch (error) {
    console.error('Error en el motor:', error);
    response.status(500).json({ message: 'Error interno en el servidor.', error: error.message });
  }
}
