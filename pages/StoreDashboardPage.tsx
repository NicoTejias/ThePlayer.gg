import React, { useState, ChangeEvent } from 'react';
import UploadIcon from '../components/icons/UploadIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import { TournamentParseResult, TournamentResult } from '../types';
import { parseEventLinkPdf } from '../utils/PdfParser';
import { parseEventLinkText } from '../utils/TextParser';

interface StoreDashboardPageProps {
    onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => void;
    userRole: 'player' | 'store' | 'admin' | null;
    tournaments: TournamentResult[]; // Real data from database
}

const StoreDashboardPage: React.FC<StoreDashboardPageProps> = ({ onTournamentUpload, userRole, tournaments }) => {
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
    const [isUploading, setIsUploading] = useState(false);

    const tournamentTypes = [
        { value: 'semanal', label: 'Semanal', multiplier: 1 },
        { value: 'fnm', label: 'FNM', multiplier: 1 },
        { value: 'draft', label: 'Draft', multiplier: 1 },
        { value: 'prerelease', label: 'Prerelease', multiplier: 3 },
        { value: 'sellado', label: 'Sellado', multiplier: 3 },
        { value: 'premier', label: 'Premier', multiplier: 5 },
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

    const getParticipationPoints = (playerCount: number): number => {
        if (playerCount >= 128) return 5;
        if (playerCount >= 64) return 4;
        if (playerCount >= 32) return 3;
        if (playerCount >= 16) return 2;
        if (playerCount >= 8) return 1;
        return 0;
    };

    const getTournamentMultiplier = (type: string): number => {
        switch (type) {
            case 'premier': return 5;
            case 'prerelease':
            case 'sellado': return 3;
            case 'semanal':
            case 'fnm':
            case 'draft':
            default: return 1;
        }
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

    const handleProcessFile = async () => {
        if (!pastedText.trim()) {
            setError('Por favor, pega el texto de los resultados.');
            return;
        }
        if (!tournamentType || !tournamentDate) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Parse pasted text - strictly text now
            const parsedRows = parseEventLinkText(pastedText);

            if (parsedRows.length === 0) {
                throw new Error("No se pudieron leer datos válidos del texto. Asegúrate de copiar la tabla completa desde EventLink.");
            }

            const multiplier = getTournamentMultiplier(tournamentType);
            const participationPoints = getParticipationPoints(parsedRows.length);

            const results: TournamentParseResult[] = parsedRows.map(row => {
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

            setParsedData(results);
            setStep('confirm');

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Ocurrió un error al procesar los datos.");
        } finally {
            setIsProcessing(false);
        }
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
        const fileInput = document.getElementById('tournament-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleConfirm = async () => {
        if (isUploading) {
            console.log("⚠️ Upload already in progress, ignoring duplicate call");
            return;
        }

        setIsUploading(true);
        const typeLabel = tournamentTypes.find(t => t.value === tournamentType)?.label || tournamentType;
        const autoName = `${typeLabel} - ${tournamentDate}`;

        const tournamentData = {
            name: autoName,
            date: new Date(tournamentDate).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            storeName: 'Mi Tienda',
            format: tournamentType.charAt(0).toUpperCase() + tournamentType.slice(1),
            playerCount: parsedData.length
        };

        console.log("StoreDashboard: Llamando a onTournamentUpload...");
        try {
            await onTournamentUpload(tournamentData, parsedData);
            console.log("StoreDashboard: Upload completado, limpiando formulario...");
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

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                <section className="lg:col-span-2">
                    {step === 'upload' && (
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Reportar Nuevo Torneo</h2>
                            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 space-y-6">
                                {/* Tournament Type */}
                                <div>
                                    <label htmlFor="tournament-type" className="block text-sm font-medium text-slate-300 mb-2">Tipo de Torneo</label>
                                    <select
                                        id="tournament-type"
                                        name="tournament-type"
                                        value={tournamentType}
                                        onChange={e => setTournamentType(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
                                    >
                                        <option value="">Seleccionar tipo...</option>
                                        {tournamentTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label} (x{type.multiplier})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tournament Date */}
                                <div>
                                    <label htmlFor="tournament-date" className="block text-sm font-medium text-slate-300 mb-2">Fecha del Torneo</label>
                                    <input type="date" name="tournament-date" id="tournament-date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>

                                {/* Paste Button */}
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handlePaste}
                                            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                            </svg>
                                            Pegar desde Portapapeles
                                        </button>
                                    </div>

                                    {pastedText && (
                                        <div className="relative">
                                            <textarea
                                                value={pastedText}
                                                readOnly
                                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono text-xs cursor-not-allowed opacity-80"
                                                rows={5}
                                            />
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-slate-800 text-xs text-slate-400 px-2 py-1 rounded border border-slate-700">Solo Lectura</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}

                                <button onClick={handleProcessFile} disabled={isProcessing} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                    {isProcessing ? 'Procesando...' : 'Verificar Datos'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'confirm' && (
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Confirmar Resultados</h2>
                            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 space-y-6">
                                {/* Summary Section */}
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
                                    <div className="bg-slate-900 p-3 rounded-lg">
                                        <p className="text-xs text-slate-400 mb-1">Datos Raw (Solo Lectura)</p>
                                        <pre className="text-xs text-slate-500 max-h-20 overflow-auto font-mono">{pastedText}</pre>
                                    </div>
                                </div>

                                <p className="text-slate-300 text-sm">Se encontraron <span className="font-bold text-white">{parsedData.length}</span> jugadores. <span className="opacity-70">Verifica que los datos sean correctos.</span></p>

                                <div className="max-h-96 overflow-y-auto border border-slate-700 rounded-md">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700/50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-300 uppercase">Jugador (Editable)</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-slate-300 uppercase">Record</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-300 uppercase">PWP Calculados</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {parsedData.map((player, index) => (
                                                <tr key={index}>
                                                    <td className="px-2 py-1 whitespace-nowrap">
                                                        <input
                                                            type="text"
                                                            value={player.playerName}
                                                            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                                                            readOnly={userRole !== 'admin'}
                                                            className={`w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-sm ${userRole !== 'admin' ? 'opacity-75 cursor-not-allowed select-none' : ''}`}
                                                            title={userRole !== 'admin' ? "Solo administradores pueden editar nombres" : "Editar nombre"}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-slate-300 font-mono">{player.matchRecord}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-bold text-sky-400">{player.pwpEarned}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={handleCancel} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-slate-600 text-white hover:bg-slate-700">
                                        Cancelar
                                    </button>
                                    <button onClick={handleConfirm} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-green-600 text-white hover:bg-green-700">
                                        Confirmar y Subir Resultados
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* History Section */}
                <section className="lg:col-span-3">
                    <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Historial de Torneos Reportados</h2>
                    <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre del Torneo</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Jugadores</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {tournaments.length > 0 ? (
                                    tournaments.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{t.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{t.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{t.playerCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md bg-green-600/30 text-green-300">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                    Procesado
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                                            No hay torneos reportados aún.
                                        </td>
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
