import React, { useState, ChangeEvent } from 'react';
import UploadIcon from '../components/icons/UploadIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import { TournamentParseResult, TournamentResult } from '../types';
import { parseEventLinkPdf } from '../utils/PdfParser';
import { parseEventLinkText } from '../utils/TextParser';
import { parseMeleeCSV } from '../utils/CSVParser';
import { parseEventLinkHtml } from '../utils/HtmlParser';
import { checkTournamentIntegrity, IntegrityWarning, getTournamentFingerprint } from '../utils/IntegrityChecker';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';

interface StoreDashboardPageProps {
    onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => void;
    onDeleteTournament: (tournamentId: string) => Promise<void>;
    userRole: 'player' | 'store' | 'admin' | null;
    tournaments: TournamentResult[]; // Real data from database
    storeStatus?: string;
    storeName?: string; // Nombre de la tienda
}

const StoreDashboardPage: React.FC<StoreDashboardPageProps> = ({ onTournamentUpload, onDeleteTournament, userRole, tournaments, storeStatus, storeName }) => {
    const { currentGame } = useGame();
    const [step, setStep] = useState<'upload' | 'confirm'>('upload');
    const [uploadMethod, setUploadMethod] = useState<'text'>('text');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pastedText, setPastedText] = useState('');
    const [isTextLocked, setIsTextLocked] = useState(false);
    const [tournamentType, setTournamentType] = useState('');
    const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<TournamentParseResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<IntegrityWarning[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // BLOCKED VIEW FOR PENDING STORES
    if (storeStatus === 'pending_approval') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="p-6 bg-yellow-500/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">Cuenta en Revisión</h1>
                <p className="text-xl text-slate-300 max-w-2xl">
                    Tu solicitud de tienda ha sido recibida y está siendo revisada por nuestro equipo de administración.
                </p>
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-lg w-full text-left space-y-4">
                    <p className="text-slate-400 text-sm">
                        Para acelerar el proceso, por favor asegúrate de haber completado tu perfil o enviarnos un correo con:
                    </p>
                    <ul className="list-disc list-inside text-slate-300 space-y-2 text-sm">
                        <li>Nombre de la Tienda</li>
                        <li>Dirección Física</li>
                        <li>Enlace a Redes Sociales o Web</li>
                    </ul>
                    <div className="pt-4 border-t border-slate-700 text-center">
                        <a href="mailto:contacto@theplayer.gg" className="text-sky-400 hover:text-sky-300 font-bold">
                            Contactar Soporte
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const handleDeleteClick = async (tournamentId: string, tournamentName: string) => {
        const confirmMessage = `¿Estás seguro que deseas eliminar el torneo "${tournamentName}"? Esta acción borrará todos los resultados asociados y NO se puede deshacer.\n\nEscribe ELIMINAR para confirmar:`;
        const userInput = window.prompt(confirmMessage);

        if (userInput === 'ELIMINAR') {
            setIsDeleting(tournamentId);
            try {
                await onDeleteTournament(tournamentId);
            } finally {
                setIsDeleting(null);
            }
        } else if (userInput !== null) {
            alert('Cancelado: Debes escribir "ELIMINAR" exactamente para confirmar.');
        }
    };

    const tournamentTypes = [
        { value: 'semanal', label: 'Semanal', multiplier: 1 },
        { value: 'fnm', label: 'FNM', multiplier: 1 },
        { value: 'showdown', label: 'Showdown', multiplier: 2 },
        { value: 'draft', label: 'Draft', multiplier: 3 },
        { value: 'sellado', label: 'Sellado', multiplier: 3 },
        { value: 'prerelease', label: 'Prerelease', multiplier: 3 },
        { value: 'premier', label: 'Premier', multiplier: 4 },
        { value: 'rcq', label: 'RCQ', multiplier: 4 },
    ];

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    };

    const handlePlayerNameChange = (index: number, newName: string) => {
        const updatedData = [...parsedData];
        updatedData[index].playerName = newName;
        setParsedData(updatedData);
    };

    const getParticipationPoints = (playerCount: number) => {
        if (playerCount >= 128) return 5;
        if (playerCount >= 64) return 4;
        if (playerCount >= 32) return 3;
        if (playerCount >= 16) return 2;
        if (playerCount >= 8) return 1;
        return 0;
    };

    const getTournamentMultiplier = (type: string) => {
        const found = tournamentTypes.find(t => t.value === type);
        return found ? found.multiplier : 1;
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPastedText(text);
            setError(null);
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            setError('No se pudo acceder al portapapeles. Asegúrate de copiar el texto primero.');
        }
    };

    const processIntegrity = async (results: TournamentParseResult[], detectedDate?: string) => {
        // Safety timeout for database calls
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10000);

        try {
            // Fetch context for integrity check
            const { data: recentResults, error: recentError } = await supabase
                .from('tournament_results')
                .select('tournament_id, player_name, pwp_earned')
                .order('created_at', { ascending: false })
                .limit(1000)
                .abortSignal(abortController.signal);

            if (recentError) console.error("Integrity context fetch error:", recentError);

            const tournamentGroups: Record<string, any[]> = {};
            recentResults?.forEach(r => {
                if (!tournamentGroups[r.tournament_id]) tournamentGroups[r.tournament_id] = [];
                tournamentGroups[r.tournament_id].push({ playerName: r.player_name, pwpEarned: r.pwp_earned });
            });

            const recentFingerprints = Object.values(tournamentGroups).map(g => getTournamentFingerprint(g as any));

            // 2. Count today's uploads
            const todayStr = new Date().toISOString().split('T')[0];
            const dailyUploadCount = tournaments.filter(t => t.date === todayStr && t.storeName === storeName).length;

            const integrityWarnings = checkTournamentIntegrity(results, results.length, tournamentType, {
                fileDate: detectedDate,
                userDate: tournamentDate,
                currentDate: new Date().toISOString(),
                recentFingerprints,
                dailyUploadCount
            });
            setWarnings(integrityWarnings);
        } catch (err: any) {
            console.error("Integrity check failed or timed out:", err);
            // Non-critical: we still want to allow the upload if integrity check fails
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const handleProcessFile = async () => {
        if (!tournamentType) {
            setError('Por favor selecciona un tipo de torneo.');
            return;
        }

        if (selectedFile) {
            setIsProcessing(true);
            setError(null);
            try {
                let parserResult: any;
                const fileName = selectedFile.name.toLowerCase();

                if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                    parserResult = await parseEventLinkHtml(selectedFile);
                } else if (fileName.endsWith('.pdf')) {
                    parserResult = await parseEventLinkPdf(selectedFile);
                } else if (fileName.endsWith('.csv')) {
                    const text = await selectedFile.text();
                    parserResult = parseMeleeCSV(text);
                } else {
                    throw new Error("Formato de archivo no soportado. Por favor sube un archivo HTML, PDF o CSV.");
                }

                const { results: parsedRows, detectedDate } = parserResult;

                if (parsedRows.length === 0) {
                    throw new Error("No se encontraron jugadores en el archivo. Verifica que sea un export válido.");
                }

                const multiplier = getTournamentMultiplier(tournamentType);
                const participationPoints = getParticipationPoints(parsedRows.length);

                const finalResults: TournamentParseResult[] = parsedRows.map((row: any) => {
                    const estimatedWins = row.wins ?? Math.floor(row.points / 3);
                    const estimatedDraws = row.draws ?? (row.points % 3);
                    const estimatedLosses = row.losses ?? 0;
                    const pwpEarned = ((estimatedWins * 3) + (estimatedDraws * 1) + participationPoints) * multiplier;

                    return {
                        playerName: row.name,
                        matchRecord: `${estimatedWins}-${estimatedLosses}-${estimatedDraws}`,
                        wins: estimatedWins,
                        losses: estimatedLosses,
                        draws: estimatedDraws,
                        pwpEarned: Math.round(pwpEarned)
                    };
                });

                setParsedData(finalResults);
                await processIntegrity(finalResults, detectedDate);
                setStep('confirm');

            } catch (e: any) {
                console.error("Error processing file:", e);
                setError(e.message || "Error al procesar el archivo. Revisa que el formato sea correcto.");
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        if (pastedText.trim()) {
            setIsProcessing(true);
            setError(null);
            try {
                const { results: parsedRows, detectedDate } = parseEventLinkText(pastedText);
                if (parsedRows.length === 0) {
                    throw new Error("No se pudieron leer datos válidos del texto.");
                }
                const multiplier = getTournamentMultiplier(tournamentType);
                const participationPoints = getParticipationPoints(parsedRows.length);
                const finalResults: TournamentParseResult[] = parsedRows.map((row: any) => {
                    const pwpEarned = ((row.wins * 3) + (row.draws * 1) + participationPoints) * multiplier;
                    return {
                        playerName: row.name,
                        matchRecord: `${row.wins}-${row.losses}-${row.draws}`,
                        wins: row.wins,
                        losses: row.losses,
                        draws: row.draws,
                        pwpEarned: Math.round(pwpEarned)
                    };
                });
                setParsedData(finalResults);
                await processIntegrity(finalResults, detectedDate);
                setStep('confirm');
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        setError('Por favor, selecciona un archivo HTML/PDF o pega los resultados.');
    };

    const handleCancel = () => {
        setStep('upload');
        setParsedData([]);
        setSelectedFile(null);
        setPastedText('');
        setIsTextLocked(false);
        setTournamentType('');
        setTournamentDate(new Date().toISOString().split('T')[0]);
        setError(null);
        setWarnings([]);
        const fileInput = document.getElementById('tournament-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleConfirm = async () => {
        if (isUploading) return;

        // Extra final check for duplicate players
        const names = parsedData.map(p => p.playerName.toLowerCase().trim());
        if (new Set(names).size !== names.length) {
            setError("Error: Hay jugadores duplicados en la lista.");
            return;
        }

        setIsUploading(true);
        const typeLabel = tournamentTypes.find(t => t.value === tournamentType)?.label || tournamentType;
        const autoName = `${typeLabel} - ${tournamentDate}`;

        const tournamentData = {
            name: autoName,
            date: tournamentDate,
            storeName: storeName || 'Tienda sin nombre',
            format: tournamentType.charAt(0).toUpperCase() + tournamentType.slice(1),
            playerCount: parsedData.length
        };

        try {
            await onTournamentUpload(tournamentData, parsedData);
            handleCancel();
        } catch (error) {
            console.error("StoreDashboard: Error en upload:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Panel de Tienda</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Reporta los resultados de tus torneos de forma simple y automática.
                </p>
            </div>

            {/* Quick Actions Widget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Store Stats Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-sky-500/10 rounded-lg">
                            <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Tu Tienda</h3>
                            <p className="text-xl font-bold text-white">{storeName || 'Mi Tienda'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
                        <div>
                            <p className="text-2xl font-bold text-sky-400">{tournaments.length}</p>
                            <p className="text-xs text-slate-500 uppercase">Torneos</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-400">{tournaments.reduce((sum, t) => sum + t.playerCount, 0)}</p>
                            <p className="text-xs text-slate-500 uppercase">Jugadores</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Card with Buttons */}
                <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-6 rounded-xl shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 rounded-lg">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-sky-100 uppercase tracking-wider">Acciones Rápidas</h3>
                            <p className="text-xl font-bold text-white">Gestionar Torneos</p>
                        </div>
                    </div>
                    <p className="text-sm text-sky-100/80 leading-relaxed mb-4">
                        Reporta resultados o programa nuevos eventos para tu tienda.
                    </p>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                if (step === 'confirm') {
                                    handleCancel();
                                }
                                const uploadSection = document.getElementById('upload-section');
                                uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all group border border-white/20 hover:border-white/40"
                        >
                            <div className="p-2 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                                <UploadIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white font-medium text-sm text-center">Reportar Torneo</span>
                        </button>

                        <button
                            onClick={() => window.location.href = '/#/eventos'}
                            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all group border border-white/20 hover:border-white/40"
                        >
                            <div className="p-2 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-white font-medium text-sm text-center">Crear Evento</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <section id="upload-section" className="lg:col-span-2">
                    {step === 'upload' && (
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Reportar Nuevo Torneo</h2>
                            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 space-y-6">
                                <div>
                                    <label htmlFor="tournament-type" className="block text-sm font-medium text-slate-300 mb-2">Tipo de Torneo</label>
                                    <select
                                        id="tournament-type"
                                        value={tournamentType}
                                        onChange={e => setTournamentType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none text-white"
                                    >
                                        <option value="">Seleccionar tipo...</option>
                                        {tournamentTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label} (x{type.multiplier})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="tournament-date" className="block text-sm font-medium text-slate-300 mb-2">Fecha del Torneo</label>
                                    <input id="tournament-date" type="date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-white" />
                                </div>

                                <div>
                                    <label htmlFor="tournament-file" className="block text-sm font-medium text-slate-300 mb-2">Archivo de Resultados</label>
                                    <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${selectedFile ? 'border-sky-500 bg-sky-900/20' : 'border-slate-600 hover:border-slate-500 bg-slate-900'}`}>
                                        <input
                                            type="file"
                                            id="tournament-file"
                                            accept=".html,.htm,.pdf,.csv"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="space-y-2 pointer-events-none">
                                            <UploadIcon className={`w-10 h-10 mx-auto ${selectedFile ? 'text-sky-400' : 'text-slate-400'}`} />
                                            {selectedFile ? (
                                                <div className="text-sky-300 font-medium">
                                                    {selectedFile.name}
                                                    <p className="text-xs text-sky-400/70 mt-1">Listo para procesar</p>
                                                </div>
                                            ) : (
                                                <div className="text-slate-400">
                                                    <p className="font-medium text-slate-300">Haz clic o arrastra el archivo aquí</p>
                                                    <p className="text-xs mt-1">Soporta HTML/PDF de EventLink y CSV de Melee</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsTextLocked(!isTextLocked)}
                                        className="text-xs text-slate-400 underline hover:text-slate-300 flex items-center gap-1"
                                    >
                                        <span>¿Problemas con el archivo? Usar copiar y pegar</span>
                                    </button>

                                    {isTextLocked && (
                                        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handlePaste}
                                                    className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition border border-slate-600"
                                                >
                                                    Pegar desde Portapapeles
                                                </button>
                                            </div>
                                            {pastedText && (
                                                <textarea
                                                    value={pastedText}
                                                    readOnly
                                                    aria-label="Texto pegado del portapapeles"
                                                    placeholder="El contenido del texto pegado aparecerá aquí"
                                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono text-xs"
                                                    rows={3}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md animate-pulse">{error}</p>}

                                <div className="space-y-3">
                                    <button
                                        onClick={handleProcessFile}
                                        disabled={isProcessing}
                                        className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed group relative"
                                    >
                                        <span className={isProcessing ? 'opacity-0' : 'opacity-100'}>Verificar Datos</span>
                                        {isProcessing && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span className="ml-2 font-mono text-xs uppercase tracking-tighter">Procesando...</span>
                                            </div>
                                        )}
                                    </button>

                                    {isProcessing && (
                                        <button
                                            onClick={() => setIsProcessing(false)}
                                            className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 underline font-medium"
                                        >
                                            ¿Tardando demasiado? Cancelar y reintentar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Confirmar Resultados</h2>
                            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 space-y-6">
                                <div className="space-y-4 border-b border-slate-700 pb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900 p-3 rounded-lg">
                                            <p className="text-xs text-slate-400">Torneo</p>
                                            <p className="font-bold text-white">{tournamentTypes.find(t => t.value === tournamentType)?.label}</p>
                                        </div>
                                        <div className="bg-slate-900 p-3 rounded-lg">
                                            <p className="text-xs text-slate-400">Fecha</p>
                                            <p className="font-bold text-white">{tournamentDate}</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-slate-300 text-sm">Se encontraron <span className="font-bold text-white">{parsedData.length}</span> jugadores.</p>

                                <div className="max-h-96 overflow-y-auto border border-slate-700 rounded-md">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Jugador</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase">Record</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-300 uppercase">{currentGame === 'mtg' ? 'PWP' : 'Puntos'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {parsedData.map((player, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">
                                                        <input
                                                            type="text"
                                                            value={player.playerName}
                                                            aria-label={`Nombre del jugador ${index + 1}`}
                                                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                                            readOnly={userRole !== 'admin'}
                                                            className={`w-full bg-slate-900 text-white rounded p-1 border border-slate-700 ${userRole !== 'admin' ? 'cursor-default' : ''}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-slate-300 font-mono">{player.matchRecord}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-bold text-sky-400">{player.pwpEarned}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {warnings.length > 0 && (
                                    <div className="p-4 bg-yellow-900/50 border border-yellow-700/50 rounded-lg space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="text-yellow-400 flex-shrink-0">⚠️</div>
                                            <div className="space-y-1">
                                                <p className="text-yellow-200 font-medium text-sm">Alertas de Seguridad</p>
                                                <ul className="list-disc list-inside text-xs text-yellow-300/80 space-y-1">
                                                    {warnings.map((w, i) => (
                                                        <li key={i}>{w.message}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}

                                <div className="flex gap-4 pt-4">
                                    <button onClick={handleCancel} disabled={isUploading} className="w-full py-3 px-4 font-bold rounded-lg bg-slate-600 text-white hover:bg-slate-700">
                                        Cancelar
                                    </button>
                                    <button onClick={handleConfirm} disabled={isUploading} className="w-full py-3 px-4 font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2">
                                        {isUploading ? 'Subiendo...' : 'Confirmar y Subir'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                <section className="lg:col-span-3">
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Historial de Torneos</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Torneo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase">Players</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {tournaments.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-700/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{t.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{t.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{t.playerCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button
                                                onClick={() => handleDeleteClick(t.id, t.name)}
                                                disabled={isDeleting === t.id}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tournaments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Sin torneos aún.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StoreDashboardPage;
