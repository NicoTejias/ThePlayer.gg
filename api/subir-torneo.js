// --- Importamos las "Herramientas" ---
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

// --- 1. CONECTARNOS A LA BASE DE DATOS ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --- 2. LA FUNCIÓN DEL "MOTOR" (Handler Principal) ---
export default async function handler(request, response) {
  
  console.log("--- Ejecutando Motor v5 (Sintaxis Corregida) ---");

  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Método no permitido.' });
  }

  try {
    // --- 3. LEER LOS DATOS DEL FORMULARIO ---
    const datos = request.body;
    const { formato, multiplicador_pwp, nro_jugadores, contenidoHTML } = datos;

    if (!contenidoHTML || !formato || !multiplicador_pwp || !nro_jugadores) {
      return response.status(400).json({ message: 'Faltan datos en el formulario.' });
    }

    // --- 4. DECIDIR QUÉ PARSER USAR ---
    let listaResultados;
    if (contenidoHTML.includes("eventlink.wizards.com")) {
      console.log("Detectado: Eventlink. Usando parser de Eventlink...");
      listaResultados = parsearEventlink(contenidoHTML);
    } else if (contenidoHTML.includes("melee.gg")) {
      console.log("Detectado: Melee.gg. Usando parser de Melee...");
      listaResultados = parsearMelee(contenidoHTML);
    } else {
      return response.status(400).json({ message: 'Formato de archivo HTML no reconocido.' });
    }

    if (!listaResultados || listaResultados.length === 0) {
      console.warn("El parser no encontró jugadores. El HTML podría haber cambiado.");
      return response.status(400).json({ message: 'No se pudieron extraer jugadores del archivo. ¿Es el HTML de Posiciones (Standings)?' });
    }
    
    console.log(`Parser encontró ${listaResultados.length} jugadores.`);

    // --- 5. GUARDAR TODO EN LA BASE DE DATOS ---
    const TIENDA_ID_DE_PRUEBA = 1; 
    const resultadoGuardado = await guardarResultados(
      listaResultados,
      datos,
      TIENDA_ID_DE_PRUEBA
    );

    // --- 6. RESPONDER CON ÉXITO ---
    return response.status(200).json({
      message: `¡Éxito! Torneo procesado y ${resultadoGuardado.count} jugadores guardados en el ranking.`,
      torneoID: resultadoGuardado.torneoID
    });

  } catch (error) {
    console.error('Error fatal en el motor:', error);
    return response.status(500).json({ message: 'Error interno en el servidor.', error: error.message });
  }
} // <-- El handler termina aquí


// --- ------------------------------- ---
// --- FUNCIONES DEL PARSER (El Cerebro) ---
// --- ------------------------------- ---

function parsearEventlink(html) {
  const $ = cheerio.load(html);
  const jugadores = [];
  
  $('table.standings tr').each((i, fila) => {
    try {
      const nombre = $(fila).find('td.standings__cell.name').text().trim();
      const wld_string = $(fila).find('td.standings__cell.wldb').text().trim();
      
      if (nombre && wld_string && nombre.length > 0) {
        const partes = wld_string.split('/');
        const ganados = parseInt(partes[0]) || 0;
        const perdidos = parseInt(partes[1]) || 0;
        const empatados = parseInt(partes[2]) || 0;
        jugadores.push({ nombre, ganados, perdidos, empatados });
      }
    } catch (e) {
      console.warn("Error parseando una fila de Eventlink:", e.message);
    }
  });
  return jugadores; 
}

function parsearMelee(html) {
  const $ = cheerio.load(html);
  const jugadores = [];

  $('table#tournament-standings-table tbody > tr').each((i, fila) => {
    try {
      const nombre = $(fila).find('td.Player-column a').text().trim();
      const wld_string = $(fila).find('td.MatchRecord-column').text().trim();

      if (nombre && wld_string && nombre.length > 0) {
        const partes = wld_string.split('-');
        const ganados = parseInt(partes[0]) || 0;
        const perdidos = parseInt(partes[1]) || 0;
        const empatados = parseInt(partes[2]) || 0;
        jugadores.push({ nombre, ganados, perdidos, empatados });
      }
    } catch (e) {
      console.warn("Error parseando una fila de Melee:", e.message);
    }
  });
  return jugadores;
}


// --- ------------------------------------ ---
// --- FUNCIONES DE CÁLCULO Y BASE DE DATOS ---
// --- ------------------------------------ ---

function calcularPuntosPWP(ganados, empatados, nro_jugadores, multiplicador_pwp) {
  const puntosPorMatch = (ganados * 3) + (empatados * 1);
  const puntosPorParticipacion = buscarPuntosPorTabla(nro_jugadores);
  const puntosTotales = (puntosPorMatch + puntosPorParticipacion) * multiplicador_pwp;
  return puntosTotales;
}

function buscarPuntosPorTabla(nro_jugadores) {
  const num = parseInt(nro_jugadores) || 0;
  if (num <= 15) return 1;
  if (num <= 31) return 2;
  if (num <= 63) return 3;
  if (num <= 127) return 4;
  if (num <= 255) return 5;
  if (num <= 511) return 6;
  if (num <= 1023) return 7;
  if (num <= 2047) return 8;
  return 9; // 2048+
}

async function guardarResultados(listaResultados, datosTorneo, tiendaID) {
  
  // 1. Crear el torneo en la BD
  const { data: torneoData, error: torneoError } = await supabase
    .from('torneos')
    .insert({
      tienda_id: tiendaID,
      formato: datosTorneo.formato,
      multiplicador_pwp: parseInt(datosTorneo.multiplicador_pwp) || 1,
      nro_jugadores: parseInt(datosTorneo.nro_jugadores) || 0
    })
    .select() 
    .single(); 

  if (torneoError) {
    console.error("Error al crear torneo:", torneoError);
    throw new Error(`Error en Supabase al crear torneo: ${torneoError.message}`);
  }

  const nuevoTorneoID = torneoData.id;
  const filasParaGuardar = [];
  
  for (const jugador of listaResultados) {
    
    // 3. Buscar el ID del jugador en la tabla 'perfiles'
    let { data: perfil } = await supabase
      .from('perfiles')
      .select('id')
      .ilike('nombre_usuario', jugador.nombre)
      .single();

    let jugadorID;

    if (!perfil) {
      // Si el jugador NO existe, lo creamos
      const { data: nuevoPerfil, error: nuevoPerfilError } = await supabase
        .from('perfiles')
        .insert({ nombre_usuario: jugador.nombre, rol: 'jugador' })
        .select('id')
        .single();
        
      if (nuevoPerfilError) {
        console.warn(`No se pudo crear el perfil para ${jugador.nombre}: ${nuevoPerfilError.message}`);
        continue; 
      }
      jugadorID = nuevoPerfil.id;
    } else {
      jugadorID = perfil.id;
    }

    // 4. Calcular los puntos PWP
    const puntosCalculados = calcularPuntosPWP(
      jugador.ganados,
      jugador.empatados,
      datosTorneo.nro_jugadores,
      datosTorneo.multiplicador_pwp
    );

    // 5. Agregar este jugador a la lista de "filas"
    filasParaGuardar.push({
      torneo_id: nuevoTorneoID,
      player_id: jugadorID,
      matches_ganados: jugador.ganados,
      matches_perdidos: jugador.perdidos,
      matches_empatados: jugador.empatados,
      puntos_pwp_calculados: puntosCalculados
    });
  } // Fin del loop 'for'

  // 6. Guardar TODOS los resultados
  const { data: resultadosData, error: resultadosError } = await supabase
    .from('resultados_jugador')
    .insert(filasParaGuardar)
    .select();

  if (resultadosError) {
    console.error("Error al guardar resultados:", resultadosError);
    throw new Error(`Error en Supabase al guardar resultados: ${resultadosError.message}`);
  }

  return { count: filasParaGuardar.length, torneoID: nuevoTorneoID };
} // Fin de guardarResultados
