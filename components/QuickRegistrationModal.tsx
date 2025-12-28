import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface QuickRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        id: string;
        title: string;
        date: string;
        storeName: string;
        format: string;
    };
    userId: string;
    onSuccess: () => void;
}

const QuickRegistrationModal: React.FC<QuickRegistrationModalProps> = ({
    isOpen,
    onClose,
    event,
    userId,
    onSuccess
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleRegister = async () => {
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('tournament_registrations')
                .insert({
                    tournament_id: event.id,
                    player_id: userId,
                    registered_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('¡Inscripción exitosa!', {
                description: `Te has inscrito a ${event.title}`
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error registering:', error);
            toast.error('Error al inscribirse', {
                description: error.message || 'Intenta nuevamente'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Confirmar Inscripción</h2>

                <div className="space-y-3 mb-6">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
                        <div className="space-y-1 text-sm text-slate-400">
                            <p>📅 {new Date(event.date).toLocaleDateString('es-CL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                            <p>📍 {event.storeName}</p>
                            <p>🎮 {event.format}</p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-sm text-blue-300">
                            ℹ️ Recibirás una confirmación por correo electrónico
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleRegister}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSubmitting ? 'Inscribiendo...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickRegistrationModal;
