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
    flesh_and_blood: {
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
    other: { url: '#', label: 'Reglamento General' }
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

                <div className="grid gap-12">

                    {/* Section 1: PLS System */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <span className="text-9xl">🏆</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                            <span className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                                1
                            </span>
                            Sistema de Puntos (PLS)
                        </h2>

                        <div className="space-y-6 text-lg text-slate-300 leading-relaxed">
                            <p>
                                El <strong className="text-sky-400">Player Latam Series (PLS)</strong> es el sistema oficial de clasificación de
                                <span className="font-bold text-white"> ThePlayer.gg</span>.
                            </p>
                            <p>
                                Los puntos se otorgan basándose estrictamente en el rendimiento durante los torneos sancionados.
                                Acumula puntos para subir en el ranking regional y nacional de cada juego (PLS {GAME_LABELS[currentGame]}).
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                                <div className="bg-slate-900/80 p-6 rounded-2xl border border-green-500/30 text-center">
                                    <div className="text-4xl font-black text-green-400 mb-2">3</div>
                                    <div className="text-sm font-bold uppercase tracking-wider text-green-200">Puntos por Victoria</div>
                                </div>
                                <div className="bg-slate-900/80 p-6 rounded-2xl border border-yellow-500/30 text-center">
                                    <div className="text-4xl font-black text-yellow-400 mb-2">1</div>
                                    <div className="text-sm font-bold uppercase tracking-wider text-yellow-200">Punto por Empate</div>
                                </div>
                                <div className="bg-slate-900/80 p-6 rounded-2xl border border-red-500/30 text-center">
                                    <div className="text-4xl font-black text-slate-500 mb-2">1</div>
                                    <div className="text-sm font-bold uppercase tracking-wider text-slate-400">Punto por participar</div>
                                </div>
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
