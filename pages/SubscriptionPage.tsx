import React from 'react';
import { Check, Star, Zap, Trophy, Store, BarChart3, ShoppingBag, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: <Store className="w-6 h-6 text-orange-400" />,
            title: "Beneficios en Tiendas",
            description: "Bebida/Snack de cortesía en torneos y descuentos exclusivos en singles y accesorios en tiendas asociadas."
        },
        {
            icon: <Trophy className="w-6 h-6 text-yellow-400" />,
            title: "Estatus PRO",
            description: "Insignia distintiva en tu perfil y rankings, marco de avatar animado y fondo personalizado."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
            title: "Estadísticas Avanzadas",
            description: "Reportes detallados de torneos, análisis de metagame y comparativa histórica con rivales."
        },
        {
            icon: <ShoppingBag className="w-6 h-6 text-pink-400" />,
            title: "Ventajas de Mercado",
            description: "Publicaciones destacadas, acceso anticipado (Early Access) a ofertas y verificación prioritaria."
        },
        {
            icon: <Zap className="w-6 h-6 text-purple-400" />,
            title: "Contenido Exclusivo",
            description: "Guías de estrategia 'Deep Dive', guías de banquillo y artículos escritos por profesionales."
        },
        {
            icon: <Star className="w-6 h-6 text-green-400" />,
            title: "Sorteos Mensuales",
            description: "Participación automática en rifas de productos sellados, playmats y merch oficial."
        }
    ];

    const plans = [
        {
            name: "Mensual",
            price: "$3.990",
            period: "/mes",
            features: ["Todos los beneficios PRO", "Cancelación en cualquier momento", "Apoya a la comunidad"],
            recommended: false
        },
        {
            name: "Anual",
            price: "$39.990",
            period: "/año",
            save: "Ahorra 2 meses",
            features: ["Todos los beneficios PRO", "Insignia 'Fundador' (Limitada)", "Merch de regalo (Polera)"],
            recommended: true
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
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold text-xs uppercase tracking-wider mb-6 animate-bounce-slow">
                        <Star className="w-3 h-3" strokeWidth={3} />
                        ThePlayer Premium
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter leading-tight">
                        Eleva tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Juego</span>
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        Desbloquea beneficios exclusivos en tus tiendas favoritas, destaca en la comunidad y accede a herramientas profesionales.
                    </p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800 transition-all group hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50">
                            <div className="bg-slate-900/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                            <p className="text-slate-400 leading-relaxed font-light">{benefit.description}</p>
                        </div>
                    ))}
                </div>

                {/* Pricing Section */}
                <div className="max-w-4xl mx-auto mb-24">
                    <h2 className="text-3xl font-bold text-center text-white mb-12 uppercase tracking-wide">Elige tu Plan</h2>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        {plans.map((plan, index) => (
                            <div key={index} className={`relative bg-slate-800 rounded-3xl p-8 border ${plan.recommended ? 'border-yellow-500 shadow-2xl shadow-yellow-900/20 scale-105 z-10' : 'border-slate-700'}`}>
                                {plan.recommended && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg">
                                        Recomendado
                                    </div>
                                )}
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-bold text-slate-300 mb-2">{plan.name}</h3>
                                    <div className="flex items-end justify-center gap-1">
                                        <span className="text-5xl font-black text-white">{plan.price}</span>
                                        <span className="text-slate-500 font-medium mb-1">{plan.period}</span>
                                    </div>
                                    {plan.save && <p className="text-green-400 text-sm font-bold mt-2">{plan.save}</p>}
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                            <Check className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all ${plan.recommended ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black shadow-lg' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
                                    Suscribirme Ahora
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Partner Stores Preview */}
                <div className="text-center">
                    <h3 className="text-slate-500 uppercase tracking-widest text-sm font-bold mb-8">Disponible próximamente en</h3>
                    <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder logos - replace with real store logos later */}
                        <div className="h-10 text-2xl font-black text-slate-300">BLOODMOON</div>
                        <div className="h-10 text-2xl font-black text-slate-300">MAGIC SUR</div>
                        <div className="h-10 text-2xl font-black text-slate-300">LA COMARCA</div>
                        <div className="h-10 text-2xl font-black text-slate-300">ENTRE JUEGOS</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SubscriptionPage;
