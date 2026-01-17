import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { GAME_LABELS } from '../types';
import { supabase } from '../supabaseClient';

interface ScheduleTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (eventData: any) => void;
}

const ScheduleTournamentModal: React.FC<ScheduleTournamentModalProps> = ({ isOpen, onClose, onSchedule }) => {
    // Game options with their formats
    const GAME_FORMAT_OPTIONS: Record<string, string[]> = {
        mtg: ['Standard', 'Modern', 'Pioneer', 'Legacy', 'Pauper', 'Premodern', 'Commander', 'Draft', 'Sealed', 'Store Championship', 'RCQ'],
        pokemon: ['Standard', 'Expanded', 'Unlimited', 'VGC', 'Gym Leader Challenge'],
        one_piece: ['Standard', 'Sealed', 'Team Battle', 'Flagship'],
        lorcana: ['Core', 'Draft', 'Sealed'],
        flesh_blood: ['Classic Constructed', 'Blitz', 'Draft', 'Sealed'],
        yugioh: ['Advanced', 'Speed Duel', 'Time Wizard'],
        star_wars: ['Standard', 'Draft', 'Sealed', 'Twin Suns'],
        digimon: ['Standard', 'Sealed', 'Ultimate Cup'],
        other: ['Standard', 'Tournament']
    };

    const { currentGame } = useGame();
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '19:00',
        format: 'Standard',
        storeName: '',
        storeId: '', // Added to store the ID
        maxPlayers: 64,
        recurring: false,
        recurrenceType: 'weekly',
        recurrenceEnd: '',
        description: '',
        entry_fee: '', // Added entry_fee
        game_type: currentGame
    });

    // Fetch user profile on mount or open
    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (data) {
                    setUserProfile(data);
                    // If user is a store, auto-fill and lock store name
                    if (data.role === 'store') {
                        setFormData(prev => ({
                            ...prev,
                            storeName: data.name || data.username || '', // FIXED: Use username if name is missing
                            storeId: data.id
                        }));
                    }
                }
            }
        };
        if (isOpen) fetchProfile();
    }, [isOpen]);


    // Update game_type when modal opens or context changes (only if it matches the current game)
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, game_type: currentGame }));
        }
    }, [currentGame, isOpen]);

    // Update format when game_type changes to a valid default for that game
    useEffect(() => {
        const formats = GAME_FORMAT_OPTIONS[formData.game_type as string] || GAME_FORMAT_OPTIONS.other;
        if (!formats.includes(formData.format)) {
            setFormData(prev => ({ ...prev, format: formats[0] }));
        }
    }, [formData.game_type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSchedule(formData);
            onClose();
            // Reset form
            setFormData({
                title: '',
                date: '',
                time: '19:00',
                format: 'Standard',
                storeName: userProfile?.role === 'store' ? (userProfile.name || userProfile.username) : '',
                storeId: userProfile?.role === 'store' ? userProfile.id : '',
                maxPlayers: 64,
                recurring: false,
                recurrenceType: 'weekly',
                recurrenceEnd: '',
                description: '',
                entry_fee: '',
                game_type: currentGame
            });
        } catch (error) {
            console.error('Error scheduling tournament:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-2xl font-bold text-white">Agendar Torneo</h2>
                    <button
                        onClick={onClose}
                        title="Cerrar"
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nombre del Torneo */}
                    <div>
                        <label htmlFor="tournamentTitle" className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre del Torneo *
                        </label>
                        <input
                            id="tournamentTitle"
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: FNM Standard - Viernes"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Juego y Formato */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="gameType" className="block text-sm font-medium text-slate-300 mb-2">
                                Juego *
                            </label>
                            <select
                                id="gameType"
                                value={formData.game_type}
                                onChange={(e) => setFormData({ ...formData, game_type: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {Object.entries(GAME_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tournamentFormat" className="block text-sm font-medium text-slate-300 mb-2">
                                Formato *
                            </label>
                            <select
                                id="tournamentFormat"
                                value={formData.format}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {(GAME_FORMAT_OPTIONS[formData.game_type as string] || GAME_FORMAT_OPTIONS.other).map(fmt => (
                                    <option key={fmt} value={fmt}>{fmt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tournamentDate" className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha *
                            </label>
                            <input
                                id="tournamentDate"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="tournamentTime" className="block text-sm font-medium text-slate-300 mb-2">
                                Hora *
                            </label>
                            <input
                                id="tournamentTime"
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Costo */}
                    <div>
                        <label htmlFor="entryFee" className="block text-sm font-medium text-slate-300 mb-2">
                            Inscripción (CLP) *
                        </label>
                        <input
                            id="entryFee"
                            type="text"
                            required
                            value={formData.entry_fee}
                            onChange={(e) => setFormData({ ...formData, entry_fee: e.target.value })}
                            placeholder="Ej: 5000"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Tienda */}
                    <div>
                        <label htmlFor="storeName" className="block text-sm font-medium text-slate-300 mb-2">
                            Tienda *
                        </label>
                        <input
                            id="storeName"
                            type="text"
                            required
                            value={formData.storeName}
                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                            placeholder="Nombre de tu tienda"
                            disabled={userProfile?.role === 'store'} // Disable if user is a store
                            className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 ${userProfile?.role === 'store' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        {userProfile?.role === 'store' && (
                            <p className="text-xs text-slate-500 mt-1">
                                La tienda se asigna automáticamente a tu usuario.
                            </p>
                        )}
                    </div>

                    {/* Máximo de Jugadores */}
                    <div>
                        <label htmlFor="maxPlayers" className="block text-sm font-medium text-slate-300 mb-2">
                            Máximo de Jugadores
                        </label>
                        <input
                            id="maxPlayers"
                            type="number"
                            min="4"
                            max="256"
                            value={formData.maxPlayers}
                            onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Evento Recurrente */}
                    <div className="border-t border-slate-700 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <input
                                type="checkbox"
                                id="recurring"
                                checked={formData.recurring}
                                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                className="w-5 h-5 bg-slate-900 border-slate-700 rounded text-green-600 focus:ring-2 focus:ring-green-500"
                            />
                            <label htmlFor="recurring" className="text-sm font-medium text-slate-300">
                                Este es un evento recurrente
                            </label>
                        </div>

                        {formData.recurring && (
                            <div className="space-y-4 pl-8">
                                <div>
                                    <label htmlFor="recurrenceType" className="block text-sm font-medium text-slate-300 mb-2">
                                        Frecuencia
                                    </label>
                                    <select
                                        id="recurrenceType"
                                        value={formData.recurrenceType}
                                        onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="weekly">Semanal (mismo día de la semana)</option>
                                        <option value="biweekly">Quincenal</option>
                                        <option value="monthly">Mensual (mismo día del mes)</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="recurrenceEnd" className="block text-sm font-medium text-slate-300 mb-2">
                                        Repetir hasta
                                    </label>
                                    <input
                                        id="recurrenceEnd"
                                        type="date"
                                        value={formData.recurrenceEnd}
                                        onChange={(e) => setFormData({ ...formData, recurrenceEnd: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Deja vacío para que se repita indefinidamente
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Información adicional sobre el torneo..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Agendando...' : 'Agendar Torneo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleTournamentModal;
