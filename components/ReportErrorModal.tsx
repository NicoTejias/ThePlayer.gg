import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface ReportErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUrl?: string; // Automatically capture where the error happened
}

const ReportErrorModal: React.FC<ReportErrorModalProps> = ({ isOpen, onClose, currentUrl }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('Por favor describe el error');
            return;
        }

        setIsSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('error_reports')
                .insert([{
                    user_id: user?.id || null, // Can be anonymous
                    description: description,
                    url: currentUrl || window.location.href,
                    user_agent: navigator.userAgent,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }]);

            // Note: If 'error_reports' table does not exist, this will fail.
            // Failing gracefully if table doesn't exist
            if (error) {
                // Fallback: Just log to console and pretend success if table missing, 
                // BUT better to alert user if it failed or maybe send to a different support channel?
                // For this task, we assume the table exists or we will use a workaround.
                // Actually, let's treat it as a task to be handled by the backend.
                console.error("Error reporting error:", error);
                if (error.code === '42P01') { // undefined_table
                    toast.error("Error del sistema: La tabla de reportes no está configurada.");
                } else {
                    throw error;
                }
            } else {
                toast.success('¡Reporte enviado! Gracias por ayudarnos a mejorar.');
                setDescription('');
                onClose();
            }

        } catch (err: any) {
            console.error('Error submitting report:', err);
            toast.error('No se pudo enviar el reporte. Inténtalo más tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span> Reportar un Error
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    ¿Encontraste un bug? Descríbelo abajo para que nuestro equipo lo solucione.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-slate-300 text-sm font-bold mb-2">
                            Descripción del problema
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder-slate-600"
                            placeholder="Ej: Al hacer clic en el botón 'Videos', la página se queda cargando..."
                            required
                        />
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-500 font-mono break-all">
                            URL: {currentUrl || window.location.href}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportErrorModal;
