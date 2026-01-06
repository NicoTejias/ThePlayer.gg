import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface StoreSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPlan?: 'basic' | 'medium' | 'premium';
}

const StoreSubscriptionModal: React.FC<StoreSubscriptionModalProps> = ({ isOpen, onClose, selectedPlan = 'medium' }) => {
    const [formData, setFormData] = useState({
        storeName: '',
        contactName: '',
        email: '',
        phone: '',
        region: '',
        plan: selectedPlan,
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Implement actual subscription logic
            // For now, just save to a "subscription_requests" table
            const { error } = await supabase
                .from('subscription_requests')
                .insert({
                    store_name: formData.storeName,
                    contact_name: formData.contactName,
                    email: formData.email,
                    phone: formData.phone,
                    region: formData.region,
                    plan_type: formData.plan,
                    message: formData.message,
                    status: 'pending'
                });

            if (error) throw error;

            toast.success('¡Solicitud enviada!', {
                description: 'Nos pondremos en contacto contigo pronto.'
            });
            onClose();
        } catch (error) {
            console.error('Error submitting subscription request:', error);
            toast.error('Error al enviar solicitud', {
                description: 'Por favor intenta nuevamente o contáctanos directamente.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const planNames = {
        basic: 'Plan Básico - $25.000/mes',
        medium: 'Plan Medio - $50.000/mes',
        premium: 'Plan Premium - $100.000/mes'
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-700 shadow-2xl my-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Únete a ThePlayer.gg</h2>
                        <p className="text-slate-400">Completa el formulario y nos contactaremos contigo</p>
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Plan Selection */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Plan Seleccionado
                        </label>
                        <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                            className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                        >
                            <option value="basic">{planNames.basic}</option>
                            <option value="medium">{planNames.medium}</option>
                            <option value="premium">{planNames.premium}</option>
                        </select>
                    </div>

                    {/* Store Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Nombre de la Tienda *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.storeName}
                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                            className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                            placeholder="Ej: Magic Store Santiago"
                        />
                    </div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Nombre de Contacto *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Región *
                            </label>
                            <select
                                required
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                            >
                                <option value="">Selecciona región</option>
                                <option value="Arica y Parinacota">Arica y Parinacota</option>
                                <option value="Tarapacá">Tarapacá</option>
                                <option value="Antofagasta">Antofagasta</option>
                                <option value="Atacama">Atacama</option>
                                <option value="Coquimbo">Coquimbo</option>
                                <option value="Valparaíso">Valparaíso</option>
                                <option value="Metropolitana">Metropolitana</option>
                                <option value="O'Higgins">O'Higgins</option>
                                <option value="Maule">Maule</option>
                                <option value="Ñuble">Ñuble</option>
                                <option value="Biobío">Biobío</option>
                                <option value="La Araucanía">La Araucanía</option>
                                <option value="Los Ríos">Los Ríos</option>
                                <option value="Los Lagos">Los Lagos</option>
                                <option value="Aysén">Aysén</option>
                                <option value="Magallanes">Magallanes</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                                placeholder="tienda@ejemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">
                                Teléfono *
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none"
                                placeholder="+56 9 1234 5678"
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                            Mensaje (Opcional)
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 border border-slate-700 focus:border-sky-500 focus:outline-none resize-none"
                            placeholder="Cuéntanos sobre tu tienda y qué te gustaría lograr con ThePlayer.gg"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-6 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 p-4 bg-sky-900/20 border border-sky-700/50 rounded-lg">
                    <p className="text-sm text-slate-300">
                        <strong className="text-sky-400">💡 Nota:</strong> Una vez recibida tu solicitud, nuestro equipo se pondrá en contacto contigo en un plazo de 24-48 horas para coordinar el proceso de suscripción y pago.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StoreSubscriptionModal;
