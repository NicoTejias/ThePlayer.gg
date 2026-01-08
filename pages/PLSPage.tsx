import React from 'react';

// Reusing the TierCard component logic but inline for simplicity or separated if preferred.
// For now, I'll keep it in the file as it was, but integrated into the new flow.

const TierCard: React.FC<{
    multiplier: string;
    color: string;
    events: string[];
    description?: string
}> = ({ multiplier, color, events }) => (
    <div className={`relative overflow-hidden rounded-xl border-2 ${color} bg-slate-800/80 p-6 flex flex-col items-center text-center transform hover:scale-105 transition-all duration-300 shadow-2xl group h-full`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <span className="text-6xl font-black">{multiplier}</span>
        </div>

        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-4 ${color.replace('border-', 'bg-')} text-slate-900 shadow-lg`}>
            {multiplier}
        </div>

        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">Nivel {multiplier}</h3>

        <ul className="space-y-2 w-full">
            {events.map((event, idx) => (
                <li key={idx} className="bg-slate-700/50 py-2 px-4 rounded-lg text-slate-200 font-medium text-sm border border-slate-600/50">
                    {event}
                </li>
            ))}
        </ul>
    </div>
);

const SectionTitle: React.FC<{ number: string; title: string; subtitle?: string }> = ({ number, title, subtitle }) => (
    <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4 flex items-center justify-center gap-4">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-lg shadow-sky-900/50">
                {number}
            </span>
            {title}
        </h2>
        {subtitle && <p className="text-lg text-slate-400 max-w-2xl mx-auto">{subtitle}</p>}
    </div>
);

const PLSPage: React.FC = () => {
    return (
        <div className="min-h-screen pb-20 animate-fade-in text-slate-200">

            {/* 1. HERO SECTION */}
            <div className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950"></div>

                <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
                    <div className="inline-block px-4 py-1 rounded-full bg-sky-900/50 border border-sky-500/30 text-sky-400 font-bold text-sm tracking-widest uppercase mb-4 animate-bounce-slow">
                        Temporada 2026
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-violet-400 to-sky-400 animate-gradient-x tracking-tighter uppercase drop-shadow-2xl">
                        Player Latam Series
                    </h1>
                    <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed font-light">
                        El circuito competitivo más prestigioso de Latinoamérica. <br />
                        <span className="text-white font-semibold">Juega. Suma Puntos. Conviértete en Leyenda.</span>
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 space-y-32">

                {/* 2. HOW IT WORKS (BASE POINTS) */}
                <section id="puntos">
                    <SectionTitle
                        number="1"
                        title="Cómo Obtener Puntos"
                        subtitle="La base de todo tu progreso. Cada partida cuenta, cada resultado suma."
                    />

                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                            {/* Win */}
                            <div className="bg-slate-900/80 p-8 rounded-2xl border border-green-500/30 text-center transform hover:-translate-y-2 transition-all duration-300 group">
                                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🥇</div>
                                <div className="text-6xl font-black text-green-400 mb-2">3</div>
                                <div className="text-sm font-bold uppercase tracking-wider text-green-200">Puntos por Victoria</div>
                                <p className="text-xs text-slate-500 mt-4">La máxima recompensa por tu habilidad.</p>
                            </div>

                            {/* Draw */}
                            <div className="bg-slate-900/80 p-8 rounded-2xl border border-yellow-500/30 text-center transform hover:-translate-y-2 transition-all duration-300 group">
                                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                                <div className="text-6xl font-black text-yellow-400 mb-2">1</div>
                                <div className="text-sm font-bold uppercase tracking-wider text-yellow-200">Punto por Empate</div>
                                <p className="text-xs text-slate-500 mt-4">Cada punto cuenta en la carrera final.</p>
                            </div>

                            {/* Participation */}
                            <div className="bg-slate-900/80 p-8 rounded-2xl border border-red-500/30 text-center transform hover:-translate-y-2 transition-all duration-300 group">
                                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform">⚔️</div>
                                <div className="text-6xl font-black text-slate-400 mb-2">1</div>
                                <div className="text-sm font-bold uppercase tracking-wider text-slate-300">Punto por Participar</div>
                                <p className="text-xs text-slate-500 mt-4">La constancia es clave para el éxito.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. MULTIPLIERS */}
                <section id="multiplicadores">
                    <SectionTitle
                        number="2"
                        title="Multiplicadores de Eventos"
                        subtitle="No todos los torneos son iguales. Escala más rápido compitiendo en eventos de mayor nivel."
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        <TierCard
                            multiplier="x1"
                            color="border-orange-500"
                            events={['FNM', 'Torneos Semanales', 'Ligas Locales']}
                        />
                        <TierCard
                            multiplier="x2"
                            color="border-slate-400"
                            events={['Showdown', 'Store Championship', 'Eventos Mensuales']}
                        />
                        <TierCard
                            multiplier="x3"
                            color="border-yellow-400"
                            events={['Prerelease', 'Open House', 'Eventos Especiales']}
                        />
                        <TierCard
                            multiplier="x4"
                            color="border-red-500"
                            events={['RCQ', 'Regional Championship', 'National Qualifiers']}
                        />
                    </div>
                </section>

                {/* 4. THE PATH (CLASSIFICATION) */}
                <section id="clasificacion">
                    <SectionTitle
                        number="3"
                        title="El Camino a la Gloria"
                        subtitle="Tu objetivo final: Clasificar a los eventos más importantes del año."
                    />

                    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* NACIONAL */}
                        <div className="relative group rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 to-slate-900 z-10"></div>
                            <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop" alt="The National" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />

                            <div className="relative z-20 p-10 h-full flex flex-col items-start justify-end min-h-[400px]">
                                <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">Evento Invitacional</div>
                                <h3 className="text-4xl font-black text-white mb-2">THE NATIONAL</h3>
                                <p className="text-purple-200 text-lg mb-6">La culminación de la temporada. Solo los mejores llegan aquí.</p>

                                <div className="space-y-3 bg-slate-900/60 p-6 rounded-2xl backdrop-blur-md w-full border border-purple-500/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">1</div>
                                        <p className="text-sm font-medium">Top 64 del Ranking PLS anual</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">2</div>
                                        <p className="text-sm font-medium">Campeones de Store Championships</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold">3</div>
                                        <p className="text-sm font-medium">Ganadores de Last Chance Qualifiers</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GRAND PRIX */}
                        <div className="relative group rounded-3xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-red-900/80 to-slate-900 z-10"></div>
                            <img src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1949&auto=format&fit=crop" alt="Grand Prix" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" />

                            <div className="relative z-20 p-10 h-full flex flex-col items-start justify-end min-h-[400px]">
                                <div className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">Evento Abierto</div>
                                <h3 className="text-4xl font-black text-white mb-2">GRAND PRIX</h3>
                                <p className="text-red-200 text-lg mb-6">El festival de juego más grande. Abierto para todos.</p>

                                <div className="space-y-3 bg-slate-900/60 p-6 rounded-2xl backdrop-blur-md w-full border border-red-500/30">
                                    <p className="text-sm leading-relaxed">
                                        Un fin de semana masivo de competencia sin restricciones de entrada.
                                        Enfrenta a cientos de jugadores, gana premios en efectivo y asegura tu lugar en la historia.
                                    </p>
                                    <ul className="text-sm list-disc list-inside text-red-200 mt-2 space-y-1">
                                        <li>Torneo Principal con premios en efectivo</li>
                                        <li>Side Events constantes (On-Demand)</li>
                                        <li>Comerciantes y Artistas invitados</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. PRIZES */}
                <section id="premios">
                    <SectionTitle
                        number="4"
                        title="Premios y Recompensas"
                        subtitle="El esfuerzo tiene su recompensa. Esto es por lo que juegas."
                    />

                    <div className="max-w-4xl mx-auto bg-slate-800 rounded-3xl p-1 overflow-hidden">
                        <div className="bg-slate-900 p-8 sm:p-12 rounded-[22px] flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">✈️</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Viajes Internacionales</h3>
                                        <p className="text-slate-400 text-sm">Los campeones del Nacional recibirán pasajes y estadía para representar a la región en el Pro Tour o Mundial correspondiente.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">💰</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Pozo de Premios en Efectivo</h3>
                                        <p className="text-slate-400 text-sm">Miles de dólares a repartir entre el Top 8 del Nacional y Grand Prix.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">📦</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Producto Sellado Exclusivo</h3>
                                        <p className="text-slate-400 text-sm">Cartas promocionales, playmats exclusivos de finalista y producto sellado por participación.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-1/3 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-2xl p-6 text-center shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-300">
                                <p className="text-yellow-200 text-sm uppercase font-bold mb-2">Pozo Estimado Anual</p>
                                <p className="text-5xl font-black text-white mb-2">$50k+</p>
                                <p className="text-xs text-yellow-200 opacity-75">USD en premios y viajes</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. FAIR PLAY & SANCTIONS (CRITICAL) */}
                <section id="integridad" className="max-w-4xl mx-auto">
                    <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-white">Integridad Competitiva y Sanciones</h2>
                        </div>

                        <div className="space-y-4 text-red-100/80 leading-relaxed text-sm md:text-base">
                            <p>
                                <strong className="text-red-400">Juego Limpio:</strong> ThePlayer.gg se rige por los más altos estándares de integridad. Todos los participantes deben adherirse a los Términos y Condiciones y al Reglamento de Torneos.
                            </p>
                            <p>
                                <strong className="text-red-400">Tolerancia Cero:</strong> Cualquier intento de manipulación de resultados, colusión, fraude en el reporte de partidas o conducta antideportiva será investigado rigurosamente.
                            </p>
                            <p>
                                <strong className="text-red-400">Sanciones:</strong> Las infracciones confirmadas resultarán en:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4 text-red-200">
                                <li>Descalificación inmediata del torneo y del ranking PLS actual.</li>
                                <li>Suspensión temporal o permanente de la plataforma ThePlayer.gg.</li>
                                <li>Reporte a las entidades oficiales del juego correspondiente (Wizards, The Pokémon Company, etc.).</li>
                            </ul>
                            <div className="mt-6 pt-6 border-t border-red-900/30">
                                <a href="#" className="inline-flex items-center text-red-400 hover:text-red-300 font-bold transition-colors">
                                    Leer Términos y Condiciones Completos <span className="ml-2">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default PLSPage;
