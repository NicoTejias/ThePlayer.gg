import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface JudgeApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: any;
}

const JudgeApplicationModal: React.FC<JudgeApplicationModalProps> = ({ isOpen, onClose, userProfile }) => {
    const [formData, setFormData] = useState({
        game_type: 'mtg',
        requested_level: 'level_1',
        experience_years: 0,
        previous_certifications: '',
        motivation: '',
        referee_contacts: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Verificar si ya tiene una aplicación pendiente
            const { data: existingApp } = await supabase
                .from('judge_applications')
                .select('*')
                .eq('applicant_id', userProfile.id)
                .eq('status', 'pending')
                .single();

            if (existingApp) {
                toast.error('Ya tienes una aplicación pendiente');
                setLoading(false);
                return;
            }

            // Crear aplicación
            const { error } = await supabase
                .from('judge_applications')
                .insert({
                    applicant_id: userProfile.id,
                    ...formData
                });

            if (error) throw error;

            // Actualizar perfil como applicant
            await supabase
                .from('profiles')
                .update({
                    judge_role: 'applicant',
                    judge_status: 'pending'
                })
                .eq('id', userProfile.id);

            toast.success('¡Aplicación enviada! Recibirás una respuesta pronto.');
            onClose();
        } catch (error: any) {
            console.error('Error submitting application:', error);
            toast.error(error.message || 'Error al enviar aplicación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-500/50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Aplicar para ser Juez</h2>
                            <p className="text-purple-300 text-sm mt-1">Completa el formulario para postular</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Game Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Juego Principal *
                        </label>
                        <select
                            value={formData.game_type}
                            onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="mtg">Magic: The Gathering</option>
                            <option value="pokemon">Pokémon TCG</option>
                            <option value="lorcana">Lorcana</option>
                            <option value="onepiece">One Piece</option>
                        </select>
                    </div>

                    {/* Requested Level */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Nivel Solicitado *
                        </label>
                        <select
                            value={formData.requested_level}
                            onChange={(e) => setFormData({ ...formData, requested_level: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            {formData.game_type === 'mtg' ? (
                                <>
                                    <option value="level_1">Level 1 - Juez de Tienda</option>
                                    <option value="level_2">Level 2 - Juez Competitivo</option>
                                    <option value="level_3">Level 3 - Juez Profesional</option>
                                </>
                            ) : formData.game_type === 'pokemon' ? (
                                <>
                                    <option value="professor">Professor</option>
                                    <option value="senior_professor">Senior Professor</option>
                                    <option value="master_professor">Master Professor</option>
                                </>
                            ) : (
                                <>
                                    <option value="certified">Certificado</option>
                                    <option value="advanced">Avanzado</option>
                                    <option value="expert">Experto</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Experience Years */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Años de Experiencia Jugando *
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.experience_years}
                            onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            required
                        />
                    </div>

                    {/* Previous Certifications */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Certificaciones Previas (opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.previous_certifications}
                            onChange={(e) => setFormData({ ...formData, previous_certifications: e.target.value })}
                            placeholder="Ej: Judge Academy Level 1, WPN Store Judge"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Motivation */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            ¿Por qué quieres ser juez? *
                        </label>
                        <textarea
                            value={formData.motivation}
                            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                            placeholder="Cuéntanos tu motivación para ser juez certificado..."
                            rows={4}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                            required
                            minLength={50}
                        />
                        <p className="text-xs text-slate-500 mt-1">Mínimo 50 caracteres</p>
                    </div>

                    {/* References */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Referencias (opcional)
                        </label>
                        <textarea
                            value={formData.referee_contacts}
                            onChange={(e) => setFormData({ ...formData, referee_contacts: e.target.value })}
                            placeholder="Nombres y contactos de jueces o TO que puedan dar referencias..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-all"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Enviando...' : 'Enviar Aplicación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JudgeApplicationModal;
