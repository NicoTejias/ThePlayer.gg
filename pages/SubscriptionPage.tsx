import React, { useState } from 'react';
import { Check, Star, Zap, Trophy, Store, BarChart3, Shield, MapPin, Users } from 'lucide-react';
import StoreSubscriptionModal from '../components/StoreSubscriptionModal';

const SubscriptionPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const handleOpenModal = (plan: 'basic' | 'premium') => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const benefits = [
        {
            icon: <Store className="w-6 h-6 text-sky-400" />,
            title: "Gestión de Torneos",
            description: "Habilita a tu tienda para subir reportes de torneos y ligas directamente a la base de datos nacional."
        },
        {
            icon: <Trophy className="w-6 h-6 text-yellow-400" />,
            title: "Puntos de Ranking",
            description: "Los torneos realizados en tu tienda otorgarán puntos oficiales para el ranking nacional de jugadores de ThePlayer."
        },
        {
            icon: <MapPin className="w-6 h-6 text-emerald-400" />,
            title: "Directorio e Interactivo",
            description: "Presencia destacada en nuestro mapa interactivo de tiendas de TCG para que nuevos jugadores te encuentren fácilmente."
        },
        {
            icon: <Zap className="w-6 h-6 text-purple-400" />,
            title: "Multiplicadores de Puntos",
            description: "Potencia el atractivo de tus torneos ofreciendo multiplicadores de puntos de ranking para tus jugadores (Plan Pro)."
        },
        {
            icon: <Users className="w-6 h-6 text-pink-400" />,
            title: "Anuncios y Notificaciones",
            description: "Notifica automáticamente a los jugadores de tu región sobre tus nuevos eventos y torneos agendados (Plan Pro)."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
            title: "Estadísticas Avanzadas",
            description: "Accede a reportes detallados de asistencia, retención de comunidad y métricas de crecimiento de tu tienda."
        }
    ];

    const plans = [
        {
            id: 'basic' as const,
            name: "Plan Básico",
            price: billingCycle === 'monthly' ? "$15.000" : "$150.000",
            period: billingCycle === 'monthly' ? "/mes" : "/año",
            save: billingCycle === 'annual' ? "Ahorra $30.000 CLP al año" : null,
            features: [
                "Gestión de hasta 4 torneos/ligas al mes",
                "Tus torneos suman puntos estándar al ranking nacional",
                "Presencia en el mapa y directorio público de tiendas",
                "Soporte estándar por correo electrónico"
            ],
            recommended: false,
            buttonText: "Elegir Plan Básico"
        },
        {
            id: 'premium' as const,
            name: "Plan Pro (Premium)",
            price: billingCycle === 'monthly' ? "$35.000" : "$350.000",
            period: billingCycle === 'monthly' ? "/mes" : "/año",
            save: billingCycle === 'annual' ? "Ahorra $70.000 CLP al año" : null,
            badge: "Recomendado",
            features: [
                "Creación ilimitada de eventos, torneos y ligas",
                "Tus torneos otorgan multiplicador de puntos para el ranking",
                "Notificaciones automáticas a jugadores de la región",
                "Sección de anuncios destacados en la plataforma",
                "Métricas avanzadas de asistencia y comunidad",
                "Soporte prioritario 24/7"
            ],
            recommended: true,
            buttonText: "Elegir Plan Pro"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 animate-fade-in relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-20">

                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-xs uppercase tracking-wider mb-6 animate-bounce-slow">
                        <Shield className="w-3.5 h-3.5" />
                        ThePlayer.gg para Tiendas
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">
                        Potencia tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Tienda de TCG</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
                        Conecta con la comunidad más grande de TCG en Chile. Automatiza la carga de torneos, suma puntos al ranking oficial y destaca ante miles de jugadores locales.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50">
                            <div className="bg-slate-900/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                            <p className="text-slate-450 leading-relaxed font-light text-sm">{benefit.description}</p>
                        </div>
                    ))}
                </div>

                {/* Billing Cycle Selector */}
                <div className="flex justify-center mb-10">
                    <div className="bg-slate-950/40 p-1.5 rounded-full border border-slate-800 inline-flex relative min-w-[280px]">
                        <div
                            className={`absolute top-1.5 bottom-1.5 bg-sky-600 rounded-full transition-all duration-300 ease-in-out w-[calc(50%-6px)] ${billingCycle === 'annual' ? 'left-[calc(50%+3px)]' : 'left-1.5'}`}
                        ></div>

                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`relative z-10 w-1/2 px-6 py-2 rounded-full text-xs font-black uppercase transition-colors cursor-pointer text-center ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Facturación Mensual
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`relative z-10 w-1/2 px-6 py-2 rounded-full text-xs font-black uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${billingCycle === 'annual' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Facturación Anual
                            <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">Ahorra ~17%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="max-w-4xl mx-auto mb-20">
                    <div className="grid md:grid-cols-2 gap-8 items-stretch">
                        {plans.map((plan, index) => (
                            <div key={index} className={`relative bg-slate-800/80 backdrop-blur-sm rounded-3xl p-8 border flex flex-col justify-between ${plan.recommended ? 'border-sky-500 shadow-2xl shadow-sky-950/20 scale-105 z-10' : 'border-slate-700'}`}>
                                {plan.badge && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider shadow-lg">
                                        {plan.badge}
                                    </div>
                                )}
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{plan.name}</h3>
                                        <div className="flex items-end justify-center gap-1">
                                            <span className="text-5xl font-black text-white">{plan.price}</span>
                                            <span className="text-slate-500 font-medium mb-1">{plan.period}</span>
                                        </div>
                                        {plan.save && <p className="text-emerald-400 text-xs font-bold mt-2">{plan.save}</p>}
                                    </div>
                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-300">
                                                <Check className="w-5 h-5 text-sky-400 flex-shrink-0" />
                                                <span className="text-sm leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button 
                                    onClick={() => handleOpenModal(plan.id)}
                                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all cursor-pointer ${plan.recommended ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto p-8 bg-slate-800/30 border border-slate-700/50 rounded-3xl">
                    <h3 className="text-xl font-black text-white mb-4 uppercase tracking-wider text-center">Preguntas Frecuentes</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-white text-base mb-1">¿Cómo se realiza el pago?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Tras enviar la solicitud mediante el formulario, nos pondremos en contacto contigo para concretar el pago mediante transferencia bancaria (con opción de facturación mensual/anual). Estamos trabajando para integrar Webpay/Khipu directamente en el corto plazo.
                            </p>
                        </div>
                        <div className="pt-4 border-t border-slate-800">
                            <h4 className="font-bold text-white text-base mb-1">¿Puedo cambiar de plan más adelante?</h4>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Sí, puedes mejorar tu plan de Básico a Pro o cancelar tu suscripción en cualquier momento poniéndote en contacto con nuestro soporte. Los cambios se aplicarán en tu siguiente ciclo de facturación.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Request Modal */}
            <StoreSubscriptionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
            />
        </div>
    );
};

export default SubscriptionPage;
