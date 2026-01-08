import React from 'react';

// Note: Framer Motion would be great here, but sticking to standard CSS/Tailwind animations for now 
// to avoid adding dependencies if not already present. I'll use standard className animations.

const TierCard: React.FC<{
    multiplier: string;
    color: string;
    events: string[];
    description?: string
}> = ({ multiplier, color, events }) => (
    <div className={`relative overflow-hidden rounded-xl border-2 ${color} bg-slate-800/80 p-6 flex flex-col items-center text-center transform hover:scale-105 transition-all duration-300 shadow-2xl group`}>
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

const PLSPage: React.FC = () => {
    return (
        <div className="space-y-20 pb-20 animate-fade-in-up">

            {/* Hero Section */}
            <div className="text-center space-y-6 pt-10">
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-violet-400 to-sky-400 animate-gradient-x tracking-tighter uppercase">
                    Player Latam Series
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                    La estructura competitiva definitiva. Acumula puntos en tus tiendas locales, escala en el ranking y clasifica al gran evento Nacional.
                </p>
            </div>

            {/* The Finals Section (Nacional & GP) */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                {/* Nacional Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 ring-1 ring-slate-700/50 rounded-2xl p-8 h-full flex flex-col items-center text-center">
                        <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white px-6 py-2 rounded-full font-black text-xl mb-6 shadow-lg shadow-purple-900/50 uppercase tracking-widest">
                            El Nacional
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">La Gran Final</h2>
                        <div className="space-y-4 text-slate-300 flex-grow">
                            <p className="text-lg">
                                Exclusivo para los <span className="text-fuchsia-400 font-bold">64/128 mejores jugadores</span> del ranking.
                            </p>
                            <div className="h-px bg-slate-700/50 w-1/2 mx-auto my-4"></div>
                            <p>
                                🏆 <span className="font-semibold text-white">Premios en Pasajes</span>
                            </p>
                            <p>
                                💰 <span className="font-semibold text-white">Pozo a repartir</span> entre el Top
                            </p>
                        </div>
                    </div>
                </div>

                {/* GP Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 ring-1 ring-slate-700/50 rounded-2xl p-8 h-full flex flex-col items-center text-center">
                        <div className="bg-gradient-to-br from-red-500 to-orange-600 text-white px-6 py-2 rounded-full font-black text-xl mb-6 shadow-lg shadow-red-900/50 uppercase tracking-widest">
                            Grand Prix
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">Evento Abierto</h2>
                        <div className="space-y-4 text-slate-300 flex-grow">
                            <p className="text-lg">
                                Torneo abierto para <span className="text-red-400 font-bold">todos los jugadores</span>.
                            </p>
                            <div className="h-px bg-slate-700/50 w-1/2 mx-auto my-4"></div>
                            <p>
                                ⚔️ <span className="font-semibold text-white">Side Events</span> masivos
                            </p>
                            <p>
                                🌟 Oportunidad de gloria para todos
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Base Points System */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <span className="text-9xl">🏆</span>
                    </div>

                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 text-xl">
                                1
                            </span>
                            Sistema de Puntos Base
                        </h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Comienza sumando puntos en cada torneo oficial. Estos puntos base se multiplican según el nivel del evento.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-green-500/30 text-center transform hover:scale-105 transition-all">
                            <div className="text-5xl font-black text-green-400 mb-2">3</div>
                            <div className="text-sm font-bold uppercase tracking-wider text-green-200">Puntos por Victoria</div>
                        </div>
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-yellow-500/30 text-center transform hover:scale-105 transition-all">
                            <div className="text-5xl font-black text-yellow-400 mb-2">1</div>
                            <div className="text-sm font-bold uppercase tracking-wider text-yellow-200">Punto por Empate</div>
                        </div>
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-red-500/30 text-center transform hover:scale-105 transition-all">
                            <div className="text-5xl font-black text-slate-400 mb-2">1</div>
                            <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Punto por participar</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Multipliers Layout */}
            <div className="space-y-12">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-2">Sistema de Multiplicadores</h2>
                    <p className="text-slate-400">Cada tipo de evento te otorga puntos multiplicados para el ranking.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
                    <TierCard
                        multiplier="x1"
                        color="border-orange-500"
                        events={['FNM', 'Torneos Semanales']}
                    />
                    <TierCard
                        multiplier="x2"
                        color="border-slate-400"
                        events={['Showdown']}
                    />
                    <TierCard
                        multiplier="x3"
                        color="border-yellow-400"
                        events={['Draft / Sellado', 'Prerelease']}
                    />
                    <TierCard
                        multiplier="x4"
                        color="border-red-500"
                        events={['Premier Events', 'RCQ']}
                    />
                </div>
            </div>

            {/* Formats Footer */}
            <div className="bg-slate-800/50 rounded-2xl p-8 max-w-4xl mx-auto text-center border border-slate-700">
                <h3 className="text-xl text-slate-400 mb-4 uppercase tracking-widest font-semibold">Formatos Válidos</h3>
                <div className="flex flex-wrap justify-center gap-4">
                    {['Standard', 'Pioneer', 'Modern', 'Draft', 'Sellado'].map((format) => (
                        <span key={format} className="px-6 py-2 bg-slate-900 rounded-full text-white font-bold border border-slate-700 shadow-md hover:border-sky-500 transition-colors cursor-default">
                            {format}
                        </span>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default PLSPage;
