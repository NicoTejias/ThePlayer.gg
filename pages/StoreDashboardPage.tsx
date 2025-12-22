import React, { useState, ChangeEvent } from 'react';
import UploadIcon from '../components/icons/UploadIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import { TournamentParseResult, TournamentResult } from '../types';
import { parseEventLinkPdf } from '../utils/PdfParser';
import { parseEventLinkText } from '../utils/TextParser';
import { parseMeleeCSV } from '../utils/CSVParser';
import { parseEventLinkHtml } from '../utils/HtmlParser';

interface StoreDashboardPageProps {
    onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => void;
    userRole: 'player' | 'store' | 'admin' | null;
    tournaments: TournamentResult[]; // Real data from database
    storeStatus?: string;
}

const StoreDashboardPage: React.FC<StoreDashboardPageProps> = ({ onTournamentUpload, userRole, tournaments, storeStatus }) => {
    const [step, setStep] = useState<'upload' | 'confirm'>('upload');
    // ... existing state ...
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

    // ... rest of logic

    // Arrays and handlers...
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
            case 'premier':
            case 'rcq': return 4;
            case 'prerelease':
            case 'sellado':
            case 'draft': return 3;
            case 'showdown': return 2;
            case 'semanal':
            case 'fnm':
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
        // Prioritize file upload
        if (selectedFile) {
            setIsProcessing(true);
            setError(null);
            try {
                let parsedRows: any[] = [];
                const fileName = selectedFile.name.toLowerCase();

                if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
                    parsedRows = await parseEventLinkHtml(selectedFile);
                } else if (fileName.endsWith('.pdf')) {
                    parsedRows = await parseEventLinkPdf(selectedFile);
                } else if (fileName.endsWith('.csv')) {
                    // Read CSV file
                    const text = await selectedFile.text();
                    parsedRows = parseMeleeCSV(text);
                } else {
                    throw new Error("Formato de archivo no soportado. Por favor sube un archivo HTML, PDF o CSV.");
                }

                if (parsedRows.length === 0) {
                    throw new Error("No se encontraron jugadores en el archivo. Verifica que sea un export válido.");
                }

                const multiplier = getTournamentMultiplier(tournamentType);
                const participationPoints = getParticipationPoints(parsedRows.length);

                const results: TournamentParseResult[] = parsedRows.map(row => {
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

                setParsedData(results);
                setStep('confirm');

            } catch (e: any) {
                console.error(e);
                setError(e.message || "Error al procesar el archivo.");
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Fallback to text if valid
        if (pastedText.trim()) {
            setIsProcessing(true);
            setError(null);
            try {
                const parsedRows = parseEventLinkText(pastedText);
                if (parsedRows.length === 0) {
                    throw new Error("No se pudieron leer datos válidos del texto.");
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
        const fileInput = document.getElementById('tournament-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleConfirm = async () => {
        if (isUploading) {
            console.log("⚠️ Upload already in progress, ignoring duplicate call");
            return;
        }

        // Validation: Check for duplicates or invalid names
        const nameCounts: { [key: string]: number } = {};
        for (const player of parsedData) {
            const name = player.playerName.trim();
            if (!name) continue;
            nameCounts[name] = (nameCounts[name] || 0) + 1;
        }

        const duplicates = Object.keys(nameCounts).filter(name => nameCounts[name] > 1);
        if (duplicates.length > 0) {
            setError(`Error de validación: Se han detectado nombres duplicados (${duplicates[0]}). Esto suele indicar que el archivo no se leyó correctamente. Revisa la columna de nombres.`);
            return;
        }

        setIsUploading(true);
        const typeLabel = tournamentTypes.find(t => t.value === tournamentType)?.label || tournamentType;
        const autoName = `${typeLabel} - ${tournamentDate}`;

        const tournamentData = {
            name: autoName,
            date: tournamentDate,
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

                                {/* File Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Archivo de Resultados</label>
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

                                {/* Legacy Paste (Collapsed/Secondary) */}
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
                                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 font-mono text-xs"
                                                    rows={3}
                                                />
                                            )}
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

                                {error && (
                                    <div className="p-4 bg-red-900/50 border border-red-700/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div className="space-y-1">
                                            <p className="text-red-200 font-medium">Validación Fallida</p>
                                            <p className="text-sm text-red-300/80">{error}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button onClick={handleCancel} disabled={isUploading} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        Cancelar
                                    </button>
                                    <button onClick={handleConfirm} disabled={isUploading} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {isUploading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Subiendo...
                                            </>
                                        ) : (
                                            'Confirmar y Subir Resultados'
                                        )}
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
