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
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

interface StoreDashboardPageProps {
    onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => void;
    onDeleteTournament: (tournamentId: string) => Promise<void>;
    userRole: 'player' | 'store' | 'admin' | null;
    tournaments: TournamentResult[]; // Real data from database
    storeStatus?: string;
    storeName?: string; // Nombre de la tienda
    storeLogo?: string;
}

const StoreDashboardPage: React.FC<StoreDashboardPageProps> = ({ onTournamentUpload, onDeleteTournament, userRole, tournaments, storeStatus, storeName, storeLogo }) => {
    const { currentGame } = useGame();
    const [step, setStep] = useState<'upload' | 'confirm'>('upload');
    const [uploadMethod, setUploadMethod] = useState<'text'>('text');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pastedText, setPastedText] = useState('');
    const [isTextLocked, setIsTextLocked] = useState(false);
    const [tournamentType, setTournamentType] = useState('');
    const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
    const [totalRounds, setTotalRounds] = useState<number>(3); // Default rounds
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<TournamentParseResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<IntegrityWarning[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // League State
    const [leagues, setLeagues] = useState<any[]>([]);
    const [view, setView] = useState<'tournaments' | 'leagues'>('tournaments');
    const [isCreatingLeague, setIsCreatingLeague] = useState(false);
    const [newLeagueData, setNewLeagueData] = useState({ name: '', format: 'Pauper', is_private: false });
    const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
    const [editingLeague, setEditingLeague] = useState<any>(null); // State for editing

    React.useEffect(() => {
        // Fetch leagues on mount to populate selector and view
        fetchLeagues();

        // Listen for FAB event to switch view
        const handleSwitchView = () => {
            setView('tournaments');
            // Small delay to allow view update before scrolling (if handled elsewhere) or just to ensure it's visible
            setTimeout(() => {
                const uploadSection = document.getElementById('upload-section');
                uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        };

        window.addEventListener('switchToTournaments', handleSwitchView);
        return () => window.removeEventListener('switchToTournaments', handleSwitchView);
    }, []);

    const fetchLeagues = async () => {
        const { data } = await supabase
            .from('store_leagues')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setLeagues(data);
    };

    const handleUpdateLeague = async () => {
        if (!editingLeague) return;
        try {
            const { error } = await supabase
                .from('store_leagues')
                .update({
                    name: editingLeague.name,
                    format: editingLeague.format,
                    is_private: editingLeague.is_private,
                    status: editingLeague.status
                })
                .eq('id', editingLeague.id);

            if (error) throw error;
            toast.success('Liga actualizada correctamente');
            setEditingLeague(null);
            fetchLeagues();
        } catch (error: any) {
            toast.error('Error al actualizar: ' + error.message);
        }
    };

    const handleDeleteLeague = async (leagueId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta liga? Se conservarán los torneos pero se desvincularán de esta liga.")) return;
        try {
            // First unlink tournaments
            await supabase.from('tournaments').update({ league_id: null }).eq('league_id', leagueId);
            // Then delete league
            const { error } = await supabase.from('store_leagues').delete().eq('id', leagueId);

            if (error) throw error;
            toast.success('Liga eliminada');
            setEditingLeague(null);
            fetchLeagues();
        } catch (error: any) {
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const handleCreateLeague = async () => {
        try {
            const { error } = await supabase
                .from('store_leagues')
                .insert({
                    name: newLeagueData.name,
                    format: newLeagueData.format,
                    is_private: newLeagueData.is_private,
                    store_id: (await supabase.auth.getUser()).data.user?.id
                });

            if (error) throw error;
            toast.success('Liga creada correctamente');
            setIsCreatingLeague(false);
            setNewLeagueData({ name: '', format: 'Pauper', is_private: false });
            fetchLeagues();
        } catch (error: any) {
            toast.error('Error al crear la liga: ' + error.message);
        }
    };

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
                    // Estimate losses if total rounds is provided and we are inferring from points
                    let estimatedLosses = row.losses ?? 0;
                    if (row.losses === undefined && totalRounds > 0) {
                        const played = estimatedWins + estimatedDraws;
                        estimatedLosses = Math.max(0, totalRounds - played);
                    }

                    const pwpEarned = ((estimatedWins * 3) + (estimatedDraws * 1) + participationPoints) * multiplier;

                    return {
                        rank: row.rank,
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
            playerCount: parsedData.length,
            leagueId: selectedLeagueId || undefined // Pass league ID
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-10 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl p-2 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {storeLogo ? (
                                <img src={storeLogo} alt={storeName} className="w-full h-full object-contain rounded-2xl relative z-10" />
                            ) : (
                                <svg className="w-10 h-10 text-sky-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85]">{storeName || 'Mi Tienda'}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                    Tienda Verificada
                                </span>
                                <span className="px-3 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    Socio Oficial
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="glass-premium px-8 py-5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group min-w-[160px]">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-white/10 transition-colors"></div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 relative z-10">Total Torneos</p>
                        <p className="text-4xl font-black text-white leading-none tracking-tighter relative z-10">{tournaments.length}</p>
                    </div>
                    <div className="glass-premium px-8 py-5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group min-w-[160px]">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 blur-2xl rounded-full -translate-x-1/2 -translate-y-1/2 group-hover:bg-sky-500/10 transition-colors"></div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 relative z-10">Ligas Activas</p>
                        <p className="text-4xl font-black text-sky-400 leading-none tracking-tighter relative z-10 text-glow-blue">{leagues.length}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Portal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Managed Ligas Card */}
                <div className="glass-premium glass-card-hover p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-violet-600/20 transition-all duration-700"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6 group-hover:border-violet-500/30 group-hover:bg-violet-500/5 duration-500 shadow-violet-900/10">
                            <Trophy className="w-8 h-8 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Ligas</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">Temporadas personalizadas y rankings de tienda.</p>
                        </div>
                        <div className="space-y-3">
                            {view === 'leagues' ? (
                                <button
                                    onClick={() => setView('tournaments')}
                                    className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all active:scale-95"
                                >
                                    Volver a Torneos
                                </button>
                            ) : (
                                <button
                                    onClick={() => setView('leagues')}
                                    className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-violet-900/40 transition-all active:scale-95"
                                >
                                    Abrir Panel
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Report Tournament Portal */}
                <div className="glass-premium glass-card-hover p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-sky-600/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-sky-600/20 transition-all duration-700"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:-rotate-6 group-hover:border-sky-500/30 group-hover:bg-sky-500/5 duration-500 shadow-sky-900/10">
                            <UploadIcon className="w-8 h-8 text-sky-400" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Reportes</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">Sube resultados oficiales para sumar puntos PWP.</p>
                        </div>
                        <button
                            onClick={() => {
                                setView('tournaments');
                                setTimeout(() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                            }}
                            className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95"
                        >
                            Comenzar Reporte
                        </button>
                    </div>
                </div>

                {/* Resources Portal */}
                <div className="glass-premium glass-card-hover p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-600/20 transition-all duration-700"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl transition-all group-hover:scale-110 group-hover:rotate-6 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 duration-500 shadow-emerald-900/10">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Soporte</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">Guías oficiales y contacto directo con staff.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => window.open('/#/soporte')} className="py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10 transition-all active:scale-95">Manuales</button>
                            <a href="mailto:soporte@theplayer.gg" className="py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/10 transition-all text-center flex items-center justify-center active:scale-95">Staff</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEAGUES VIEW */}
            {view === 'leagues' && (
                <div className="space-y-8">
                    {isCreatingLeague && (
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-top-4">
                            <h3 className="text-xl font-bold text-white mb-4">Nueva Liga Personalizada</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Liga</label>
                                    <input
                                        type="text"
                                        value={newLeagueData.name}
                                        onChange={e => setNewLeagueData({ ...newLeagueData, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                        placeholder="Ej: Liga Pauper Verano 2026"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Formato</label>
                                    <select
                                        aria-label="Seleccionar Formato"
                                        value={newLeagueData.format}
                                        onChange={e => setNewLeagueData({ ...newLeagueData, format: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                    >
                                        <option value="Pauper">Pauper</option>
                                        <option value="Modern">Modern</option>
                                        <option value="Standard">Standard</option>
                                        <option value="Legacy">Legacy</option>
                                        <option value="Commander">Commander</option>
                                        <option value="Premodern">Premodern</option>
                                        <option value="Custom">Formato Personalizado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newLeagueData.is_private}
                                        onChange={e => setNewLeagueData({ ...newLeagueData, is_private: e.target.checked })}
                                        className="rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-slate-300 text-sm">Liga Privada (Visible solo con enlace)</span>
                                </label>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreatingLeague(false)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateLeague}
                                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 font-bold"
                                >
                                    Crear Liga
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leagues.map((league) => (
                            <div key={league.id} className="glass-premium rounded-3xl border border-white/5 overflow-hidden hover:border-violet-500/50 transition-all duration-500 group relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-8 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-white/10">
                                            <Trophy className="w-6 h-6 text-violet-400" />
                                        </div>
                                        {league.is_private ? (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-slate-500 px-3 py-1 rounded-full border border-slate-700">Privada</span>
                                        ) : (
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">Pública</span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tighter group-hover:text-violet-400 transition-colors">{league.name}</h3>
                                        <div className="bg-white/5 rounded-lg px-2 py-0.5 inline-block text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{league.format}</div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => window.open(`/#/leagues/${league.id}`, '_blank')}
                                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all">
                                            Resultados
                                        </button>
                                        <button
                                            onClick={() => setEditingLeague(league)}
                                            className="px-4 py-3 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-violet-500/20 transition-all">
                                            Config
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {leagues.length === 0 && !isCreatingLeague && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-700 rounded-xl">
                                <p className="text-slate-400 mb-4">No has creado ninguna liga personalizada aún.</p>
                                <button
                                    onClick={() => setIsCreatingLeague(true)}
                                    className="text-sky-400 hover:text-sky-300 font-bold underline"
                                >
                                    Crear mi primera liga
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EDIT LEAGUE MODAL */}
            {editingLeague && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Configurar Liga</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    aria-label="Nombre de la liga"
                                    value={editingLeague.name}
                                    onChange={e => setEditingLeague({ ...editingLeague, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Formato</label>
                                <select
                                    value={editingLeague.format}
                                    onChange={e => setEditingLeague({ ...editingLeague, format: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                                    aria-label="Editar Formato"
                                >
                                    <option value="Pauper">Pauper</option>
                                    <option value="Modern">Modern</option>
                                    <option value="Standard">Standard</option>
                                    <option value="Legacy">Legacy</option>
                                    <option value="Commander">Commander</option>
                                    <option value="Premodern">Premodern</option>
                                    <option value="Custom">Formato Personalizado</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingLeague.is_private}
                                        onChange={e => setEditingLeague({ ...editingLeague, is_private: e.target.checked })}
                                        className="rounded bg-slate-800 border-slate-700 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span className="text-slate-300 text-sm">Privada</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <select
                                        value={editingLeague.status || 'active'}
                                        onChange={e => setEditingLeague({ ...editingLeague, status: e.target.value })}
                                        className="bg-slate-800 border border-slate-700 rounded text-xs px-2 py-1 text-white"
                                        aria-label="Estado de la liga"
                                    >
                                        <option value="active">Activa</option>
                                        <option value="finished">Finalizada</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => handleDeleteLeague(editingLeague.id)}
                                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900/50 rounded-lg hover:bg-red-900/50 text-sm font-medium"
                            >
                                Eliminar
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={() => setEditingLeague(null)}
                                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateLeague}
                                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 font-bold"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`grid grid-cols-1 lg:grid-cols-5 gap-12 ${view === 'leagues' ? 'hidden' : ''}`}>
                <section id="upload-section" className="lg:col-span-2 space-y-6">
                    {step === 'upload' && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span> Sistema de Reporte
                            </h2>
                            <div className="glass-premium p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full"></div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <label htmlFor="tournament-type" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo de Torneo</label>
                                        <select
                                            id="tournament-type"
                                            value={tournamentType}
                                            onChange={e => setTournamentType(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                                        >
                                            <option value="">Seleccionar tipo...</option>
                                            {tournamentTypes.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label} (x{type.multiplier})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {leagues.length > 0 && (
                                        <div>
                                            <label htmlFor="league-select" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Asignar a Liga (Opcional)</label>
                                            <select
                                                id="league-select"
                                                value={selectedLeagueId}
                                                onChange={e => setSelectedLeagueId(e.target.value)}
                                                className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                                            >
                                                <option value="">Ninguna (Torneo Normal)</option>
                                                {leagues.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="tournament-date" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Fecha</label>
                                            <input id="tournament-date" type="date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold shadow-inner" />
                                        </div>
                                        <div>
                                            <label htmlFor="total-rounds" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Rondas</label>
                                            <input
                                                id="total-rounds"
                                                type="number"
                                                min="1"
                                                max="15"
                                                value={totalRounds}
                                                onChange={e => setTotalRounds(parseInt(e.target.value))}
                                                className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Archivo de Resultados</label>
                                        <div className={`relative border-2 border-dashed rounded-[2rem] p-10 text-center transition-all duration-500 ${selectedFile ? 'border-sky-500 bg-sky-500/5 shadow-lg shadow-sky-500/10' : 'border-white/10 hover:border-white/20 bg-slate-900 group-hover:bg-slate-900/50'}`}>
                                            <input
                                                type="file"
                                                id="tournament-file"
                                                accept=".html,.htm,.pdf,.csv"
                                                onChange={handleFileChange}
                                                title="Subir archivo de resultados de torneo"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="space-y-3 pointer-events-none">
                                                <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center transition-all ${selectedFile ? 'bg-sky-500 text-white shadow-xl rotate-12' : 'bg-slate-800 text-slate-500'}`}>
                                                    <UploadIcon className="w-8 h-8" />
                                                </div>
                                                {selectedFile ? (
                                                    <div className="text-sky-400 font-black text-sm uppercase tracking-widest">
                                                        {selectedFile.name}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <p className="font-black text-white uppercase text-xs tracking-widest">Sube tu Archivo</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">HTML, PDF o Melee CSV</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
                                            <p className="text-xs text-red-400 font-black uppercase tracking-widest text-center">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleProcessFile}
                                        disabled={isProcessing}
                                        className="w-full py-5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-sky-900/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                <span>Procesando...</span>
                                            </>
                                        ) : (
                                            <span>Verificar Datos</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] inline-flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Confirmación Final
                            </h2>
                            <div className="glass-premium p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="space-y-8 relative z-10">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Tipo</p>
                                            <p className="text-white font-black text-lg truncate">{tournamentTypes.find(t => t.value === tournamentType)?.label}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fecha</p>
                                            <p className="text-white font-black text-lg">{tournamentDate}</p>
                                        </div>
                                    </div>

                                    <div className="glass bg-slate-950/50 rounded-[2rem] border border-white/5 overflow-hidden">
                                        <div className="max-h-80 overflow-y-auto px-2">
                                            <table className="min-w-full text-left">
                                                <thead className="sticky top-0 bg-slate-900 relative z-20">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                                                        <th className="px-6 py-4 text-right text-[9px] font-black font-sky-500 uppercase tracking-widest">Pts</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {parsedData.map((player, index) => (
                                                        <tr key={index} className="group">
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="text"
                                                                    value={player.playerName}
                                                                    title={`Editar nombre del jugador ${index + 1}`}
                                                                    placeholder="Nombre del jugador"
                                                                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                                                    className="bg-transparent text-white font-black text-sm w-full focus:outline-none focus:text-sky-400 transition-colors"
                                                                />
                                                                <p className="text-[10px] text-slate-500 font-bold font-mono">{player.matchRecord}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-xl font-black text-sky-400">+{player.pwpEarned}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {warnings.length > 0 && (
                                        <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-3">
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                                ⚠️ Protocolo de Integridad
                                            </p>
                                            <ul className="space-y-2">
                                                {warnings.map((w, i) => (
                                                    <li key={i} className="text-[11px] text-amber-200/70 font-medium leading-relaxed">• {w.message}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={handleCancel} disabled={isUploading} className="py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all">
                                            Cancelar
                                        </button>
                                        <button onClick={handleConfirm} disabled={isUploading} className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/30 transition-all active:scale-95">
                                            {isUploading ? 'Sincronizando...' : 'Publicar Ahora'}
                                        </button>
                                    </div>
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
            </div >
        </div >
    );
};

export default StoreDashboardPage;
