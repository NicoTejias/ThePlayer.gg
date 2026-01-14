
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import RefreshCwIcon from '../../components/icons/RefreshCwIcon';

interface PreviewRow {
    username: string;
    current_points: number;
    after_points: number;
}

const AdminSeasonPage: React.FC = () => {
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [seasonName, setSeasonName] = useState(`Temporada ${new Date().getFullYear()}`);
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        fetchPreview();
    }, []);

    const fetchPreview = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('preview_season_reset');
            if (error) throw error;
            setPreview(data || []);
        } catch (err) {
            console.error('Error fetching preview:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteReset = async () => {
        if (!window.confirm(`¿ESTÁS SEGURO? Esta acción archivará los puntos actuales bajo "${seasonName}" y los reducirá al 50% para todos los jugadores. ESTA ACCIÓN NO SE PUEDE DESHACER.`)) {
            return;
        }

        setIsExecuting(true);
        try {
            const { error } = await supabase.rpc('execute_season_reset', { p_season_name: seasonName });
            if (error) throw error;
            alert('¡Cierre de temporada ejecutado con éxito!');
            fetchPreview();
        } catch (err: any) {
            alert('Error al ejecutar reset: ' + err.message);
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">Gestión de Temporadas</h1>
                    <p className="text-slate-400">Control de reset de puntos (Carry-over 50%)</p>
                </div>
                <button
                    onClick={fetchPreview}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Actualizar previsualización"
                >
                    <RefreshCwIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Control Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span>⚙️</span> Configuración
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nombre de la Temporada a Cerrar</label>
                                <input
                                    type="text"
                                    value={seasonName}
                                    onChange={(e) => setSeasonName(e.target.value)}
                                    title="Nombre de la temporada"
                                    placeholder="Nombre de la temporada (ej: Temporada 2026)"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold italic">Este nombre se usará en el Salón de la Fama</p>
                            </div>

                            <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                                <h3 className="text-orange-300 font-bold text-sm mb-2">REGLA APLICADA:</h3>
                                <p className="text-xs text-orange-200/80 leading-relaxed">
                                    Todos los jugadores mantendrán el 50% de sus <strong>Player Points</strong> actuales. El resto se pierde, pero el total actual se guarda en el historial.
                                </p>
                            </div>

                            <button
                                onClick={handleExecuteReset}
                                disabled={isExecuting || preview.length === 0}
                                className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg transition-all transform active:scale-95 uppercase tracking-widest"
                            >
                                {isExecuting ? 'PROCESANDO...' : 'CERRAR TEMPORADA AHORA'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Table */}
                <div className="lg:col-span-2">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Previsualización de Impacto</h2>
                            <span className="text-xs font-bold text-slate-500 uppercase">{preview.length} Jugadores afectados</span>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-slate-800 shadow-sm">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700">
                                        <th className="px-6 py-3">Jugador</th>
                                        <th className="px-6 py-3 text-right">Puntos Actuales</th>
                                        <th className="px-6 py-3 text-right">Puntos Post-Reset</th>
                                        <th className="px-6 py-3 text-right text-orange-400">Pérdida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {preview.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-200">{row.username}</td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-mono">{row.current_points.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-green-400 font-black font-mono">{row.after_points.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-red-400/60 text-xs font-mono">-{(row.current_points - row.after_points).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {preview.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay jugadores registrados con puntos</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSeasonPage;
