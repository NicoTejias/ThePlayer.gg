import React from 'react';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';

interface ExternalRuleLink {
    url: string;
    label: string;
}

const OFFICIAL_RULES: Record<GameType, ExternalRuleLink> = {
    mtg: {
        url: 'https://magic.wizards.com/es/rules',
        label: 'Reglamento Oficial Magic: The Gathering'
    },
    pokemon: {
        url: 'https://www.pokemon.com/el/jcc-pokemon/reglas-y-recursos',
        label: 'Reglamento Oficial Pokémon TCG'
    },
    one_piece: {
        url: 'https://en.onepiece-cardgame.com/rules/',
        label: 'Reglamento Oficial One Piece Card Game'
    },
    lorcana: {
        url: 'https://www.disneylorcana.com/en-US/how-to-play',
        label: 'Reglamento Oficial Disney Lorcana'
    },
    yugioh: {
        url: 'https://www.yugioh-card.com/lat-am/play/game-play-rules/',
        label: 'Reglamento Oficial Yu-Gi-Oh!'
    },
    flesh_blood: {
        url: 'https://fabtcg.com/resources/rules-and-policy-center/',
        label: 'Reglamento Oficial Flesh and Blood'
    },
    star_wars: {
        url: 'https://starwarsunlimited.com/how-to-play',
        label: 'Reglamento Oficial Star Wars: Unlimited'
    },
    // Fallbacks
    board_game: { url: '#', label: 'Reglamentos Varios' },
    rpg: { url: '#', label: 'Sistemas de Rol' },
    warhammer: { url: 'https://www.warhammer-community.com/en-gb/downloads/', label: 'Reglamentos Warhammer' },
    other: { url: '#', label: 'Reglamento General' },
    digimon: { url: 'https://world.digimoncard.com/rule/', label: 'Reglamento Oficial Digimon Card Game' }
};

const ReglamentoPage: React.FC = () => {
    const { currentGame } = useGame();
    const ruleLink = OFFICIAL_RULES[currentGame];

    return (
        <div className="min-h-screen py-12 animate-fade-in">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-600 mb-6 drop-shadow-2xl">
                        REGLAMENTO & PUNTOS
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Entiende cómo funciona el sistema de clasificación y accede a las reglas oficiales.
                    </p>
                </div>

                <div className="grid gap-12 max-w-2xl mx-auto">

                    {/* Section 1: Player Points System */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <span className="text-9xl font-black">PLAYER POINTS</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-6 uppercase italic">
                            ¿Cómo funcionan los Player Points?
                        </h2>

                        <div className="space-y-6 text-slate-300">
                            <p className="leading-relaxed">
                                Los <span className="text-sky-400 font-bold">Player Points</span> son la medida oficial de tu desempeño y constancia en la liga. No solo miden cuánto ganas, sino cuánto participas en la comunidad.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-sky-400 font-bold mb-2 uppercase text-sm tracking-widest">Suma de Puntos</h3>
                                    <p className="text-sm">Por cada victoria en un torneo oficial sumas puntos fijos. Participar en eventos especiales de "Tiendas Premium" puede otorgar multiplicadores de puntos.</p>
                                </div>
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-yellow-500 font-bold mb-2 uppercase text-sm tracking-widest">Reset de Temporada</h3>
                                    <p className="text-sm">Al finalizar el año calendario, se realiza el <span className="italic">Season Reset</span>. Conservas el <span className="text-white font-bold text-lg">50%</span> de tus puntos para la nueva temporada.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                                <p className="text-sm italic text-blue-300">
                                    <strong>Nota:</strong> El reset del 50% asegura que los veteranos mantengan su prestigio, mientras que los nuevos jugadores tienen una oportunidad real de alcanzar el Top 10 cada año.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Official Rules */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 p-8 opacity-5 pointer-events-none">
                            <span className="text-9xl">📜</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-6">
                            Reglamento Oficial de {GAME_LABELS[currentGame]}
                        </h2>

                        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                            Para dudas específicas sobre interacciones, fases y legalidad de cartas, consulta siempre el reglamento oficial actualizado.
                        </p>

                        <a
                            href={ruleLink.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold text-lg rounded-full transition-all hover:scale-105 shadow-lg shadow-sky-900/50"
                        >
                            <span>Leer Reglamento Oficial</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>

                        {currentGame === 'mtg' && (
                            <p className="mt-6 text-xs text-slate-500">
                                Enlace dirige a la web oficial de Wizards of the Coast.
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReglamentoPage;
