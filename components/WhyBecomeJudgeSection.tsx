import React from 'react';
import { judgeBenefits } from '../utils/judge-resources';

const WhyBecomeJudgeSection: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-6 py-16" id="benefits">
            {/* Section Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/50 rounded-full px-4 py-2 mb-4">
                    <span className="text-2xl">✨</span>
                    <span className="text-sm font-semibold text-pink-300">Beneficios</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    ¿Por qué ser Juez Certificado?
                </h2>
                <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                    Convertirte en juez certificado de ThePlayer.gg te abre las puertas a una comunidad
                    profesional y te brinda oportunidades únicas en el mundo de los TCG.
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {judgeBenefits.map((benefit, index) => (
                    <div
                        key={index}
                        className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition-all group"
                    >
                        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                            {benefit.icon}
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                            {benefit.title}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {benefit.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Certification Badge Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left: Badge Visual */}
                    <div className="flex justify-center">
                        <div className="relative">
                            {/* Badge Background */}
                            <div className="w-64 h-80 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-800 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-between">
                                {/* Logo/Icon */}
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg">
                                    ⚖️
                                </div>

                                {/* Badge Content */}
                                <div className="text-center text-white">
                                    <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">
                                        Juez Certificado
                                    </div>
                                    <div className="text-2xl font-bold mb-1">
                                        ThePlayer.gg
                                    </div>
                                    <div className="text-sm opacity-75">
                                        Nivel 2
                                    </div>
                                </div>

                                {/* Badge Footer */}
                                <div className="text-center text-white text-xs opacity-75">
                                    <div>ID: #JP-2024-001</div>
                                    <div>Válido desde 2024</div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute top-4 right-4 w-8 h-8 border-2 border-white/30 rounded-full" />
                                <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-white/30 rounded-full" />
                            </div>

                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-50 -z-10" />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-4">
                            Credencial Digital Oficial
                        </h3>
                        <p className="text-slate-300 mb-6">
                            Al completar tu certificación, recibirás una credencial digital oficial que te identifica
                            como juez certificado de ThePlayer.gg. Esta credencial incluye:
                        </p>
                        <ul className="space-y-3 mb-6">
                            {[
                                'Número de identificación único',
                                'Nivel de certificación actual',
                                'Especialidades en juegos específicos',
                                'Código QR para verificación',
                                'Válida en todos los eventos de ThePlayer.gg'
                            ].map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center mt-0.5">
                                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-slate-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-lg hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg">
                            Comenzar Aplicación
                        </button>
                    </div>
                </div>
            </div>

            {/* Testimonials (Optional - can be added later with real data) */}
            <div className="mt-16">
                <h3 className="text-2xl font-bold text-white text-center mb-8">
                    Lo que dicen nuestros jueces
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            name: 'Nicolás Tejías',
                            role: 'Head Judge',
                            quote: 'Ser parte del programa de jueces me ha permitido crecer profesionalmente y contribuir a la comunidad TCG de Chile.'
                        },
                        {
                            name: 'Juez Certificado',
                            role: 'Nivel 2',
                            quote: 'La formación continua y el apoyo del equipo hacen que ser juez sea una experiencia enriquecedora.'
                        },
                        {
                            name: 'Juez Comunitario',
                            role: 'Nivel 1',
                            quote: 'Empecé como jugador y ahora ayudo a que los torneos sean justos y divertidos para todos.'
                        }
                    ].map((testimonial, index) => (
                        <div
                            key={index}
                            className="bg-slate-800 border border-slate-700 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                    {testimonial.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{testimonial.name}</div>
                                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                                </div>
                            </div>
                            <p className="text-slate-300 italic">"{testimonial.quote}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WhyBecomeJudgeSection;
