import React from 'react';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';

interface GameRules {
    title: string;
    sections: {
        title: string;
        content: string[];
    }[];
}

const GAME_RULES: Record<GameType, GameRules> = {
    mtg: {
        title: 'Reglamento Magic: The Gathering',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Magic: The Gathering establecidas por Wizards of the Coast.',
                    'Todos los jugadores deben presentar una lista de mazo válida antes del inicio del torneo.',
                    'El tiempo límite por ronda es de 50 minutos.',
                    'Se permite el uso de proxies solo en formatos casuales y con autorización previa del organizador.',
                ]
            },
            {
                title: 'Formatos Permitidos',
                content: [
                    'Standard: Solo cartas de los últimos sets legales.',
                    'Modern: Cartas desde 8th Edition en adelante.',
                    'Pioneer: Cartas desde Return to Ravnica en adelante.',
                    'Commander: 100 cartas singleton con comandante.',
                    'Pauper: Solo cartas comunes.',
                    'Limited (Draft/Sealed): Según el producto disponible.',
                ]
            },
            {
                title: 'Conducta y Fair Play',
                content: [
                    'Se espera un comportamiento respetuoso hacia todos los participantes.',
                    'Está prohibido el uso de lenguaje ofensivo o comportamiento antideportivo.',
                    'Los jugadores deben mantener limpia su área de juego.',
                    'Cualquier disputa debe ser resuelta por el juez o organizador del evento.',
                ]
            },
        ]
    },
    pokemon: {
        title: 'Reglamento Pokémon TCG',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales del Pokémon TCG establecidas por The Pokémon Company.',
                    'Todos los mazos deben contener exactamente 60 cartas.',
                    'El tiempo límite por ronda es de 50 minutos más 3 turnos adicionales.',
                    'Las cartas deben estar en fundas opacas del mismo color y tamaño.',
                ]
            },
            {
                title: 'Formatos Permitidos',
                content: [
                    'Standard: Solo cartas de los últimos sets legales (rotación anual).',
                    'Expanded: Cartas desde Black & White en adelante.',
                    'Unlimited: Todas las cartas son permitidas.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    'Máximo 4 copias de cualquier carta (excepto Energías Básicas).',
                    'El mazo debe contener al menos 1 Pokémon Básico.',
                    'Las cartas deben ser originales o proxies autorizados para eventos casuales.',
                ]
            },
        ]
    },
    one_piece: {
        title: 'Reglamento One Piece Card Game',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Bandai.',
                    'Todos los mazos deben contener exactamente 50 cartas más 1 carta de Líder.',
                    'El tiempo límite por ronda es de 40 minutos.',
                    'Las cartas deben estar en fundas opacas.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    'Exactamente 50 cartas en el mazo principal.',
                    '1 carta de Líder obligatoria.',
                    'Máximo 4 copias de cualquier carta con el mismo número de carta.',
                    'Todas las cartas deben coincidir con los colores del Líder.',
                ]
            },
            {
                title: 'Conducta',
                content: [
                    'Comportamiento respetuoso obligatorio.',
                    'Prohibido el uso de lenguaje ofensivo.',
                    'Las disputas se resuelven con el juez del evento.',
                ]
            },
        ]
    },
    lorcana: {
        title: 'Reglamento Disney Lorcana',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Ravensburger.',
                    'Todos los mazos deben contener exactamente 60 cartas.',
                    'El tiempo límite por ronda es de 50 minutos.',
                    'Las cartas deben estar en fundas protectoras.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    'Exactamente 60 cartas en el mazo.',
                    'Máximo 4 copias de cualquier carta con el mismo nombre.',
                    'Puedes usar hasta 2 colores de tinta en tu mazo.',
                ]
            },
        ]
    },
    yugioh: {
        title: 'Reglamento Yu-Gi-Oh!',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Konami.',
                    'El mazo principal debe contener entre 40 y 60 cartas.',
                    'El Extra Deck puede contener hasta 15 cartas.',
                    'El Side Deck puede contener hasta 15 cartas.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    'Mazo Principal: 40-60 cartas.',
                    'Extra Deck: 0-15 cartas (Fusion, Synchro, Xyz, Link).',
                    'Side Deck: 0-15 cartas para cambios entre duelos.',
                    'Máximo 3 copias de cualquier carta (salvo cartas limitadas/prohibidas).',
                ]
            },
        ]
    },
    flesh_and_blood: {
        title: 'Reglamento Flesh and Blood',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Legend Story Studios.',
                    'Cada jugador debe tener una carta de Héroe, arma(s) y equipo.',
                    'El mazo debe contener exactamente 60 cartas.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    '1 carta de Héroe (define la clase).',
                    'Armas y Equipo según el héroe.',
                    'Exactamente 60 cartas en el mazo.',
                    'Máximo 3 copias de cualquier carta.',
                ]
            },
        ]
    },
    star_wars: {
        title: 'Reglamento Star Wars Unlimited',
        sections: [
            {
                title: 'Reglas Generales de Torneo',
                content: [
                    'Los torneos siguen las reglas oficiales de Fantasy Flight Games.',
                    'Cada jugador debe tener una carta de Líder y una Base.',
                    'El mazo debe contener entre 50 y 60 cartas.',
                ]
            },
            {
                title: 'Construcción de Mazo',
                content: [
                    '1 carta de Líder.',
                    '1 carta de Base.',
                    '50-60 cartas en el mazo.',
                    'Máximo 3 copias de cualquier carta.',
                ]
            },
        ]
    },
    board_game: {
        title: 'Reglamento Juegos de Mesa',
        sections: [
            {
                title: 'Reglas Generales',
                content: [
                    'Cada juego de mesa tiene sus propias reglas específicas.',
                    'Consulta con el organizador del evento para reglas particulares.',
                    'Se espera fair play y respeto entre jugadores.',
                ]
            },
        ]
    },
    rpg: {
        title: 'Reglamento Juegos de Rol',
        sections: [
            {
                title: 'Reglas Generales',
                content: [
                    'Cada sistema de RPG tiene sus propias reglas.',
                    'El Game Master tiene la última palabra en decisiones de juego.',
                    'Se espera colaboración y respeto entre jugadores.',
                ]
            },
        ]
    },
    warhammer: {
        title: 'Reglamento Warhammer / Wargames',
        sections: [
            {
                title: 'Reglas Generales',
                content: [
                    'Los torneos siguen las reglas oficiales de Games Workshop.',
                    'Las listas de ejército deben ser presentadas antes del torneo.',
                    'Las miniaturas deben estar pintadas (según requisitos del evento).',
                ]
            },
        ]
    },
    other: {
        title: 'Reglamento General',
        sections: [
            {
                title: 'Reglas Generales',
                content: [
                    'Consulta con el organizador del evento para reglas específicas.',
                    'Se espera comportamiento respetuoso y deportivo.',
                ]
            },
        ]
    },
};

const ReglamentoPage: React.FC = () => {
    const { currentGame } = useGame();
    const rules = GAME_RULES[currentGame];

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-600 mb-4 drop-shadow-lg">
                        {rules.title}
                    </h1>
                    <p className="text-lg text-slate-400">
                        Reglas oficiales para torneos de {GAME_LABELS[currentGame]}
                    </p>
                </div>

                {/* Rules Sections */}
                <div className="space-y-8">
                    {rules.sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:bg-slate-800/70 transition-all"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-sky-600/20 rounded-lg flex items-center justify-center text-sky-400 font-black">
                                    {index + 1}
                                </span>
                                {section.title}
                            </h2>
                            <ul className="space-y-4">
                                {section.content.map((rule, ruleIndex) => (
                                    <li key={ruleIndex} className="flex items-start gap-3 text-slate-300">
                                        <span className="text-sky-400 mt-1 flex-shrink-0">▸</span>
                                        <span className="leading-relaxed">{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Footer Note */}
                <div className="mt-12 p-6 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                    <p className="text-sm text-slate-300 text-center">
                        <strong className="text-blue-400">Nota:</strong> Estas reglas son una guía general.
                        Cada evento puede tener reglas adicionales específicas. Consulta con el organizador para más detalles.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReglamentoPage;
