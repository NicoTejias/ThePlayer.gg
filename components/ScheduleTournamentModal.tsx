import React, { useState } from 'react';

interface ScheduleTournamentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (eventData: any) => void;
}

const ScheduleTournamentModal: React.FC<ScheduleTournamentModalProps> = ({ isOpen, onClose, onSchedule }) => {
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: '19:00',
        format: 'Standard',
        storeName: '',
        maxPlayers: 64,
        recurring: false,
        recurrenceType: 'weekly',
        recurrenceEnd: '',
        description: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSchedule(formData);
        onClose();
        // Reset form
        setFormData({
            title: '',
            date: '',
            time: '19:00',
            format: 'Standard',
            storeName: '',
            maxPlayers: 64,
            recurring: false,
            recurrenceType: 'weekly',
            recurrenceEnd: '',
            description: ''
        });
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nombre del Torneo *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ej: FNM Standard - Viernes"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Fecha *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Hora *
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Formato */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Formato *
                        </label>
                        <select
                            value={formData.format}
                            onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="Standard">Standard</option>
                            <option value="Modern">Modern</option>
                            <option value="Pioneer">Pioneer</option>
                            <option value="Legacy">Legacy</option>
                            <option value="Pauper">Pauper</option>
                            <option value="Commander">Commander</option>
                            <option value="Draft">Draft</option>
                            <option value="Sealed">Sealed</option>
                        </select>
                    </div>

                    {/* Tienda */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tienda *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.storeName}
                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                            placeholder="Nombre de tu tienda"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    {/* Máximo de Jugadores */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Máximo de Jugadores
                        </label>
                        <input
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Frecuencia
                                    </label>
                                    <select
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Repetir hasta
                                    </label>
                                    <input
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
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
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors shadow-lg"
                        >
                            Agendar Torneo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleTournamentModal;
