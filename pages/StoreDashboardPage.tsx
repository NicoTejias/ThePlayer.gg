
import React, { useState, ChangeEvent } from 'react';
import UploadIcon from '../components/icons/UploadIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import { TournamentParseResult, TournamentResult } from '../types';

// Mock data for reported tournaments
const mockReportedTournaments = [
    { id: 't1', name: 'FNM Modern Julio', date: '2024-07-26', format: 'Modern', players: 24, status: 'Procesado' },
    { id: 't2', name: 'Pioneer Showdown', date: '2024-07-19', format: 'Pioneer', players: 18, status: 'Procesado' },
    { id: 't3', name: 'Draft de Outlaws', date: '2024-07-12', format: 'Draft', players: 16, status: 'Procesado' },
];

interface StoreDashboardPageProps {
  onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => void;
}

const mockParsedPlayers: Omit<TournamentParseResult, 'pwpEarned'>[] = [
    { playerName: 'Player 1', matchRecord: '3-0-0', wins: 3, losses: 0, draws: 0 },
    { playerName: 'Player 2', matchRecord: '2-1-0', wins: 2, losses: 1, draws: 0 },
    { playerName: 'Player 3', matchRecord: '2-1-0', wins: 2, losses: 1, draws: 0 },
    { playerName: 'Player 4', matchRecord: '1-2-0', wins: 1, losses: 2, draws: 0 },
    { playerName: 'Player 5', matchRecord: '1-2-0', wins: 1, losses: 2, draws: 0 },
    { playerName: 'Player 6', matchRecord: '0-3-0', wins: 0, losses: 3, draws: 0 },
    { playerName: 'Player 7', matchRecord: '3-0-0', wins: 3, losses: 0, draws: 0 },
    { playerName: 'Player 8', matchRecord: '2-1-0', wins: 2, losses: 1, draws: 0 },
];

const StoreDashboardPage: React.FC<StoreDashboardPageProps> = ({ onTournamentUpload }) => {
    const [step, setStep] = useState<'upload' | 'confirm'>('upload');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [tournamentName, setTournamentName] = useState('');
    const [tournamentType, setTournamentType] = useState('');
    const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<TournamentParseResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [reportedTournaments, setReportedTournaments] = useState(mockReportedTournaments);

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

    const handleProcessFile = async () => {
        if (!selectedFile || !tournamentType || !tournamentDate || !tournamentName) {
            setError('Por favor, completa todos los campos y selecciona un archivo.');
            return;
        }
        setIsProcessing(true);
        setError(null);

        // Simulate backend processing
        setTimeout(() => {
            try {
                const multiplier = getTournamentMultiplier(tournamentType);
                const participationPoints = getParticipationPoints(mockParsedPlayers.length);

                const results: TournamentParseResult[] = mockParsedPlayers.map(player => {
                    const pwpEarned = ((player.wins * 3) + (player.draws * 1) + participationPoints) * multiplier;
                    return { ...player, pwpEarned: Math.round(pwpEarned) };
                });
                
                setParsedData(results);
                setStep('confirm');

            } catch (e: any) {
                setError("Ocurrió un error inesperado durante la simulación.");
            } finally {
                setIsProcessing(false);
            }
        }, 1500); // Simulate network and processing delay
    };
    
    const handleCancel = () => {
        setStep('upload');
        setParsedData([]);
        setSelectedFile(null);
        setTournamentName('');
        setTournamentType('');
        setTournamentDate(new Date().toISOString().split('T')[0]);
        setError(null);
        const fileInput = document.getElementById('tournament-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleConfirm = () => {
        const tournamentData = {
            name: tournamentName,
            date: new Date(tournamentDate).toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            storeName: 'Mi Tienda', // This would come from the logged-in user's data
            format: tournamentType.charAt(0).toUpperCase() + tournamentType.slice(1),
            playerCount: parsedData.length
        };

        onTournamentUpload(tournamentData, parsedData);
        
        // Add to local history for display
        setReportedTournaments(prev => [{
            id: `t${Date.now()}`,
            name: tournamentData.name,
            date: tournamentData.date,
            format: tournamentData.format,
            players: tournamentData.playerCount,
            status: 'Procesado'
        }, ...prev]);

        alert('¡Torneo subido con éxito!');
        handleCancel();
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
                                <div>
                                    <label htmlFor="tournament-name" className="block text-sm font-medium text-slate-300 mb-2">Nombre del Torneo</label>
                                    <input type="text" name="tournament-name" id="tournament-name" value={tournamentName} onChange={e => setTournamentName(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Ej: FNM de Enero" />
                                </div>
                                <div>
                                    <label htmlFor="tournament-file" className="block text-sm font-medium text-slate-300 mb-2">Archivo de Torneo (.html)</label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
                                            <div className="flex text-sm text-slate-400">
                                                <label htmlFor="tournament-file" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-sky-500 px-2">
                                                    <span>Selecciona un archivo</span>
                                                    <input id="tournament-file" name="tournament-file" type="file" className="sr-only" accept=".html" onChange={handleFileChange} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-500">Soporta archivos de Melee.gg y EventLink</p>
                                        </div>
                                    </div>
                                    {selectedFile && <p className="text-sm text-slate-400 mt-2">Archivo seleccionado: <span className="font-medium text-white">{selectedFile.name}</span></p>}
                                </div>
                                <div>
                                    <label htmlFor="tournament-date" className="block text-sm font-medium text-slate-300 mb-2">Fecha del Torneo</label>
                                    <input type="date" name="tournament-date" id="tournament-date" value={tournamentDate} onChange={e => setTournamentDate(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                </div>
                                <div>
                                    <label htmlFor="tournament-type" className="block text-sm font-medium text-slate-300 mb-2">Tipo de Torneo</label>
                                    <select id="tournament-type" name="tournament-type" value={tournamentType} onChange={e => setTournamentType(e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none">
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="fnm">FNM</option>
                                        <option value="draft">Draft</option>
                                        <option value="prerelease">Prerelease</option>
                                        <option value="sellado">Sellado</option>
                                        <option value="premier">Premier</option>
                                    </select>
                                </div>
                                
                                {error && <p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                                
                                <button onClick={handleProcessFile} disabled={isProcessing} className="w-full py-3 px-4 font-bold rounded-lg transition duration-300 bg-sky-600 text-white hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                    {isProcessing ? 'Procesando en servidor...' : 'Procesar y Subir Resultados'}
                                </button>
                            </div>
                        </div>
                    )}
                    {step === 'confirm' && (
                         <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Confirmar Resultados</h2>
                            <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 space-y-6">
                                <p className="text-slate-300">Respuesta del servidor: Se encontraron <span className="font-bold text-white">{parsedData.length}</span> jugadores. Corrige los nombres si es necesario para que coincidan con los de la plataforma.</p>
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
                                                            className="w-full bg-slate-700 text-white rounded-md p-2 border border-slate-600 focus:ring-sky-500 focus:border-sky-500 text-sm"
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
                                {reportedTournaments.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-700/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{t.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{t.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{t.players}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md bg-green-600/30 text-green-300">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                {t.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StoreDashboardPage;
