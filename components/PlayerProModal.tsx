import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import ProBadge from './ProBadge';

interface PlayerProModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any; // User profile with id and email
}

const PlayerProModal: React.FC<PlayerProModalProps> = ({ isOpen, onClose, profile }) => {
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const plans = {
        monthly: {
            price: 5000,
            period: 'mes',
            discount: null,
            total: 5000
        },
        quarterly: {
            price: 4500,
            period: '3 meses',
            discount: '10%',
            total: 13500
        },
        annual: {
            price: 4000,
            period: 'año',
            discount: '20%',
            total: 48000
        }
    };

    const benefits = [
        { icon: '📊', title: 'Dashboard Avanzado', description: 'Estadísticas detalladas y análisis de rendimiento' },
        { icon: '🏆', title: 'Registro Prioritario', description: 'Acceso anticipado a torneos destacados' },
        { icon: '🎨', title: 'Perfil Personalizado', description: 'Banner custom, bio enriquecida y badge PRO' },
        { icon: '📈', title: 'Análisis de Meta', description: 'Reportes de meta y tendencias del formato' },
        { icon: '💬', title: 'Discord Exclusivo', description: 'Canal privado para miembros PRO' },
        { icon: '🎁', title: 'Contenido Premium', description: 'Artículos, videos y guías exclusivas' },
        { icon: '📋', title: 'Exportar Datos', description: 'Descarga tu historial en PDF/CSV' },
        { icon: '⚡', title: 'Soporte Prioritario', description: 'Respuestas rápidas a tus consultas' }
    ];

    const handleSubscribe = async () => {
        if (!profile?.id || !profile?.email) {
            toast.error('Debes estar logueado para suscribirte');
            return;
        }

        setLoading(true);

        try {
            // Call Supabase Edge Function to create subscription
            const { data, error } = await supabase.functions.invoke('create-subscription', {
                body: {
                    player_id: profile.id,
                    plan_type: selectedPlan,
                    payer_email: profile.email
                }
            });

            if (error) throw error;

            // Redirect to MercadoPago checkout
            if (data?.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('No se recibió el link de pago');
            }
        } catch (err: any) {
            console.error('Error creating subscription:', err);
            toast.error(err.message || 'Error al procesar el pago');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/30 shadow-2xl shadow-purple-900/50">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-900 via-pink-900 to-purple-900 p-8 border-b border-purple-500/30 z-10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="flex justify-center mb-4">
                            <ProBadge size="large" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-2">Únete a ThePlayer PRO</h2>
                        <p className="text-purple-200 text-lg">Lleva tu juego al siguiente nivel con beneficios exclusivos</p>
                    </div>
                </div>

                {/* Pricing Plans */}
                <div className="p-8 bg-slate-800/50">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">Elige tu plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {Object.entries(plans).map(([key, plan]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedPlan(key as any)}
                                className={`p-6 rounded-xl border-2 transition-all ${selectedPlan === key
                                    ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-900/50'
                                    : 'border-slate-700 bg-slate-800 hover:border-purple-500/50'
                                    }`}
                            >
                                {plan.discount && (
                                    <div className="inline-block bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full mb-2">
                                        AHORRA {plan.discount}
                                    </div>
                                )}
                                <div className="text-3xl font-bold text-white mb-1">
                                    ${plan.price.toLocaleString('es-CL')}
                                </div>
                                <div className="text-slate-400 text-sm mb-3">por {plan.period}</div>
                                <div className="text-purple-300 font-bold">
                                    Total: ${plan.total.toLocaleString('es-CL')} CLP
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">Beneficios Incluidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors">
                                <div className="text-3xl">{benefit.icon}</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">{benefit.title}</h4>
                                    <p className="text-slate-400 text-sm">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Footer */}
                <div className="sticky bottom-0 bg-slate-900 p-6 border-t border-purple-500/30">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-bold text-lg">
                                Plan {selectedPlan === 'monthly' ? 'Mensual' : selectedPlan === 'quarterly' ? 'Trimestral' : 'Anual'}
                            </p>
                            <p className="text-purple-300">
                                ${plans[selectedPlan].total.toLocaleString('es-CL')} CLP
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-900/50 ${loading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:from-purple-500 hover:to-pink-500'
                                    }`}
                            >
                                {loading ? 'Procesando...' : 'Suscribirse Ahora'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerProModal;
