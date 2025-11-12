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
  
  console.log("--- Ejecutando Motor v4 (con corrección de BD) ---");

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
    // Usamos la "Tienda de Prueba" (ID 1) que creamos con el SQL
    const TIENDA_ID_DE_PRUEBA = 1; 

    const resultadoGuardado = await guardarResultados(
      listaResultados,
      datos, // Pasamos todos los datos del formulario
      TIENDA_ID_DE_PRUEBA
    );

    // --- 6. RESPONDER CON ÉXITO ---
    response.status(200).json({
      message: `¡Éxito! Torneo procesado y ${resultadoGuardado.count} jugadores guardados en el ranking.`,
      torneoID: resultadoGuardado.torneoID
    });

  } catch (error) {
    console.error('Error fatal en el motor:', error);
    response.status(500).json({ message: 'Error interno en el servidor.', error: error.message });
  }
}


// --- ------------------------------- ---
// --- FUNCIONES DEL PARSER (El Cerebro) ---
// --- ------------------------------- ---

// Parser para Eventlink (VERSIÓN MEJORADA)
function parsearEventlink(html) {
  const $ = cheerio.load(html);
  const jugadores = [];
  
  // Selector más robusto: busca todas las filas (tr) dentro de la tabla.
  // Se saltará la fila del encabezado (th) porque no encontrará los 'td'
  $('table.standings tr').each((i, fila) => {
    try {
      const nombre = $(fila).find('td.standings__cell.name').text().trim();
      const wld_string = $(fila).find('td.standings__cell.wldb').text().trim(); // Ej: "2/0/1"
      
      // Si encontramos un nombre y un W-L-D, es una fila de jugador
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

// Parser para Melee.gg (Sin cambios)
function parsearMelee(html) {
  const $ = cheerio.load(html);
  const jugadores = [];

  $('table#tournament-standings-table tbody > tr').each((i, fila) => {
    try {
      const nombre = $(fila).find('td.Player-column a').text().trim();
      const wld_string = $(fila).find('td.MatchRecord-column').text().trim(); // Ej: "7-1-1"

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

// Nuestra lógica de puntos PWP
function calcularPuntosPWP(ganados, empatados, nro_jugadores, multiplicador_pwp) {
  const puntosPorMatch = (ganados * 3) + (empatados * 1);
  const puntosPorParticipacion = buscarPuntosPorTabla(nro_jugadores);
  
  const puntosTotales = (puntosPorMatch + puntosPorParticipacion) * multiplicador_pwp;
  return puntosTotales;
}

// La tabla de puntos por participación que definimos
function buscarPuntosPorTabla(nro_jugadores) {
  if (nro_jugadores <= 15) return 1;
  if (nro_jugadores <= 31) return 2;
  if (nro_jugadores <= 63) return 3;
  if (nro_jugadores <= 127) return 4;
  if (nro_jugadores <= 255) return 5;
  if (nro_jugadores <= 511) return 6;
  if (nro_jugadores <= 1023) return 7;
  if (nro_jugadores <= 2047) return 8;
  return 9; // 2048+
}

// Función final para guardar todo en Supabase (CORREGIDA)
async function guardarResultados(listaResultados, datosTorneo, tiendaID) {
  
  // 1. Crear el torneo en la BD
  const { data: torneoData, error: torneoError } = await supabase
    .from('torneos')
    .insert({
      tienda_id: tiendaID, // Usamos el ID de la tienda
      formato: datosTorneo.formato,
      multiplicador_pwp: datosTorneo.multiplicador_pwp,
      nro_jugadores: datosTorneo.nro_jugadores
    })
    .select() 
    .single(); 

  if (torneoError) {
    console.error("Error al crear torneo:", torneoError);
    throw new Error(`Error en Supabase al crear torneo: ${torneoError.message}`);
  }

  const nuevoTorneoID = torneoData.id;

  // 2. Preparar la lista de jugadores para la BD
  const filasParaGuardar = [];
  
  for (const jugador of listaResultados) {
    // 3. Buscar el ID del jugador en la tabla 'perfiles'
    let { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('id')
      .ilike('nombre_usuario', jugador.nombre)
      .single();

    let jugadorID;

    if (!perfil) {
      // Si el jugador NO existe, lo creamos
      // ¡Ya no fallará, porque el 'id' se genera solo!
      const { data: nuevoPerfil, error: nuevoPerfilError } = await supabase
        .from('perfiles')
        .insert({ nombre_usuario: jugador.nombre, rol: 'jugador' })
        .select('id') // Solo necesitamos el nuevo ID
        .single();
        
      if (nuevoPerfilError) {
        console.warn(`No se pudo crear el perfil para ${jugador.nombre}: ${nuevoPerfilError.message}`);
        continue; // Saltar al siguiente jugador
      }
      jugadorID = nuevoPerfil.id;
    } else {
      jugadorID = perfil.id;
    }

    // 4. Calcular los puntos PWP para este jugador
    const puntosCalculados = calcularPuntosPWP(
      jugador.ganados,
      jugador.empatados,
      datosTorneo.nro_jugadores,
      datosTorneo.multi
