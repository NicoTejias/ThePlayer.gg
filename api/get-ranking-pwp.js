// --- Importamos la "Herramienta" ---
import { createClient } from '@supabase/supabase-js';

// --- 1. CONECTARNOS A LA BASE DE DATOS ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- 2. EL "MOTOR" (Handler Principal) ---
export default async function handler(request, response) {
  
  // Solo permitimos que "VEAN" (GET) datos, no que envíen (POST)
  if (request.method !== 'GET') {
    return response.status(405).json({ message: 'Método no permitido.' });
  }

  try {
    // --- 3. LLAMAR A LA FUNCIÓN DE SUPABASE ---
    // Llamamos a la "receta" que creamos en el PASO 1
    const { data, error } = await supabase.rpc('get_ranking_pwp');

    if (error) {
      console.error('Error llamando a la función RPC de Supabase:', error);
      throw error;
    }

    // --- 4. DEVOLVER EL RANKING ---
    // Enviamos la lista de jugadores (los datos) al frontend
    return response.status(200).json(data);

  } catch (error) {
    console.error('Error en get-ranking-pwp:', error);
    return response.status(500).json({ message: 'Error al obtener el ranking.', error: error.message });
  }
}
