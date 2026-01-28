
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Configuración manual (ya que no leemos el .env del proyecto directamente en este contexto de ejecución aislado a veces)
// Usaré los valores que vi en supabaseClient.ts si es posible, o pediré que se configuren.
// Nota: Como estoy ejecutando en el entorno del usuario, intentaré leer las variables de entorno si existen,
// o usaré las que pueda encontrar.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ffxlpqblmvczlczkdnzf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
    console.error("❌ Error: No se encontró VITE_SUPABASE_ANON_KEY. Asegúrate de tener un archivo .env o configurar la variable.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_FILE_PATH = path.join(__dirname, 'ranking_data.csv');

interface ParsedRow {
    rank: number;
    name: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
}

// Función simple para parsear CSV (basada en utils/CSVParser.ts)
const parseCSV = (csvText: string): ParsedRow[] => {
    const rows: ParsedRow[] = [];
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 0) return rows;

    // Header parsing
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

    // Column Mappings based on the file content seen
    // "Rank", "TeamPlayers1Name", "MatchRecord", "Points"
    const rankIdx = header.findIndex(h => h === 'Rank');
    const nameIdx = header.findIndex(h => h === 'TeamPlayers1Name'); // "Roman, Patricio" format
    const matchRecordIdx = header.findIndex(h => h === 'MatchRecord'); // "7-1-1"
    const pointsIdx = header.findIndex(h => h === 'Points');

    console.log(`Columnas detectadas: Rank=${rankIdx}, Name=${nameIdx}, Record=${matchRecordIdx}, Points=${pointsIdx}`);

    for (let i = 1; i < lines.length; i++) {
        // Simple CSV split handling quotes somewhat roughly but effective for this specific file structure
        // The file has standard CSV structure.
        const line = lines[i];

        // Custom split to handle quotes
        const parts: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());

        if (parts.length < 5) continue;

        const rank = parseInt(parts[rankIdx]);
        let nameRaw = parts[nameIdx].replace(/"/g, ''); // "Roman, Patricio"
        const points = parseInt(parts[pointsIdx]);
        const record = parts[matchRecordIdx].replace(/"/g, ''); // "7-1-1"

        // Fix name format: "Roman, Patricio" -> "Patricio Roman"
        let name = nameRaw;
        if (nameRaw.includes(',')) {
            const [last, first] = nameRaw.split(',').map(s => s.trim());
            name = `${first} ${last}`;
        }

        // Parse Record
        let wins = 0, losses = 0, draws = 0;
        const recordMatch = record.match(/^(\d+)-(\d+)-(\d+)$/);
        if (recordMatch) {
            wins = parseInt(recordMatch[1]);
            losses = parseInt(recordMatch[2]);
            draws = parseInt(recordMatch[3]);
        }

        rows.push({ rank, name, points, wins, losses, draws });
    }

    return rows;
};

const run = async () => {
    console.log("🚀 Iniciando proceso de importación...");

    try {
        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
        const results = parseCSV(fileContent);

        console.log(`✅ Parseo completado. ${results.length} registros encontrados.`);
        if (results.length > 0) {
            console.log("Muestra del primer registro:", results[0]);
        }

        // 1. Crear Torneo
        const tournamentData = {
            name: "Torneo Importado Melee (Standard)",
            date: new Date().toISOString(), // Usamos fecha de hoy para la importación
            format: "Standard",
            player_count: results.length,
            status: "finished"
        };

        const { data: tournament, error: tError } = await supabase
            .from('tournaments')
            .insert(tournamentData)
            .select()
            .single();

        if (tError) throw new Error(`Error creando torneo: ${tError.message}`);

        console.log(`🏆 Torneo creado: ${tournament.name} (ID: ${tournament.id})`);

        // 2. Insertar Resultados
        const resultsToInsert = results.map(r => ({
            tournament_id: tournament.id,
            player_name: r.name,
            rank: r.rank,
            wins: r.wins,
            losses: r.losses,
            draws: r.draws,
            points_earned: r.points // Usamos los puntos del torneo como base por ahora
        }));

        const { error: rError } = await supabase
            .from('tournament_results')
            .insert(resultsToInsert);

        if (rError) throw new Error(`Error insertando resultados: ${rError.message}`);

        console.log("✅ Resultados insertados correctamente en Supabase.");
        console.log("🎉 Proceso finalizado con éxito.");

    } catch (error) {
        console.error("❌ Error:", error);
    }
};

run();
