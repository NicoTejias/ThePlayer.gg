// Utility file for judge certification resources and documentation

export interface CertificationLevel {
    level: number;
    name: string;
    description: string;
    requirements: string[];
    icon: string;
    color: string;
}

export interface DocumentResource {
    title: string;
    description: string;
    url?: string;
    category: 'rules' | 'policies' | 'training' | 'forms';
    game?: string;
    downloadable?: boolean;
}

export const certificationLevels: CertificationLevel[] = [
    {
        level: 1,
        name: 'Juez Comunitario',
        description: 'Nivel inicial para árbitros que desean comenzar su carrera en torneos locales',
        icon: '🌱',
        color: 'from-green-500 to-emerald-500',
        requirements: [
            'Conocimiento básico de reglas del juego',
            'Asistir a 3 torneos como observador',
            'Aprobar examen teórico básico (70% mínimo)',
            'Carta de recomendación de un Head Judge o Juez Nivel 2+',
            'Completar formulario de aplicación'
        ]
    },
    {
        level: 2,
        name: 'Juez Certificado',
        description: 'Árbitros con experiencia que pueden liderar torneos competitivos',
        icon: '⚖️',
        color: 'from-blue-500 to-cyan-500',
        requirements: [
            'Ser Juez Nivel 1 por al menos 6 meses',
            'Arbitrar 10+ torneos oficiales',
            'Aprobar examen avanzado (80% mínimo)',
            'Demostrar conocimiento de políticas de torneo',
            'Evaluación práctica por un Head Judge',
            'Participar en programa de mentoría'
        ]
    },
    {
        level: 3,
        name: 'Juez Senior',
        description: 'Árbitros expertos con capacidad de entrenar y liderar el programa de jueces',
        icon: '👑',
        color: 'from-purple-500 to-pink-500',
        requirements: [
            'Ser Juez Nivel 2 por al menos 1 año',
            'Arbitrar 25+ torneos oficiales, incluyendo eventos competitivos',
            'Aprobar examen experto (85% mínimo)',
            'Capacidad de entrenar y mentorear otros jueces',
            'Aprobación del comité de Head Judges',
            'Contribuir al desarrollo del programa de jueces'
        ]
    }
];

export const judgeDocuments: DocumentResource[] = [
    // Rules
    {
        title: 'Comprehensive Rules - Magic: The Gathering',
        description: 'Reglas completas oficiales de MTG actualizadas',
        url: 'https://magic.wizards.com/en/rules',
        category: 'rules',
        game: 'mtg'
    },
    {
        title: 'Pokémon TCG Rules & Resources',
        description: 'Reglas oficiales y recursos para jueces de Pokémon',
        url: 'https://www.pokemon.com/us/pokemon-tcg/rules-formats',
        category: 'rules',
        game: 'pokemon'
    },
    {
        title: 'Lorcana Comprehensive Rules',
        description: 'Reglas completas de Disney Lorcana',
        url: 'https://www.disneylorcana.com/en-US/rules',
        category: 'rules',
        game: 'lorcana'
    },
    {
        title: 'One Piece Card Game Official Rules',
        description: 'Reglas oficiales del juego de cartas de One Piece',
        url: 'https://en.onepiece-cardgame.com/rule/',
        category: 'rules',
        game: 'onepiece'
    },

    // Policies
    {
        title: 'Política de Torneos ThePlayer.gg',
        description: 'Políticas oficiales para torneos organizados en nuestra plataforma',
        category: 'policies',
        downloadable: true
    },
    {
        title: 'Código de Conducta para Jueces',
        description: 'Estándares de comportamiento y ética para jueces certificados',
        category: 'policies',
        downloadable: true
    },
    {
        title: 'Procedimientos de Penalización',
        description: 'Guía de infracciones y penalizaciones en torneos',
        category: 'policies',
        downloadable: true
    },

    // Training
    {
        title: 'Manual de Entrenamiento Nivel 1',
        description: 'Material de estudio para aspirantes a Juez Nivel 1',
        category: 'training',
        downloadable: true
    },
    {
        title: 'Manual de Entrenamiento Nivel 2',
        description: 'Material avanzado para Jueces Nivel 2',
        category: 'training',
        downloadable: true
    },
    {
        title: 'Guía de Mentoría para Jueces Senior',
        description: 'Recursos para jueces que entrenan a otros árbitros',
        category: 'training',
        downloadable: true
    },

    // Forms
    {
        title: 'Formulario de Aplicación - Nivel 1',
        description: 'Solicitud para certificación de Juez Nivel 1',
        category: 'forms',
        downloadable: true
    },
    {
        title: 'Formulario de Aplicación - Nivel 2',
        description: 'Solicitud para certificación de Juez Nivel 2',
        category: 'forms',
        downloadable: true
    },
    {
        title: 'Formulario de Aplicación - Nivel 3',
        description: 'Solicitud para certificación de Juez Nivel 3',
        category: 'forms',
        downloadable: true
    },
    {
        title: 'Reporte de Torneo',
        description: 'Formulario para reportar incidentes en torneos',
        category: 'forms',
        downloadable: true
    }
];

export const judgeBenefits = [
    {
        icon: '🎓',
        title: 'Certificación Oficial',
        description: 'Reconocimiento formal como juez certificado de ThePlayer.gg con credencial digital'
    },
    {
        icon: '🏆',
        title: 'Acceso Prioritario',
        description: 'Prioridad para participar en eventos premium y torneos de alto nivel'
    },
    {
        icon: '💼',
        title: 'Oportunidades Laborales',
        description: 'Posibilidad de arbitrar eventos pagados y torneos profesionales'
    },
    {
        icon: '📚',
        title: 'Formación Continua',
        description: 'Acceso a materiales de entrenamiento, webinars y talleres exclusivos'
    },
    {
        icon: '🤝',
        title: 'Comunidad de Jueces',
        description: 'Únete a una red de árbitros profesionales y comparte experiencias'
    },
    {
        icon: '⭐',
        title: 'Reconocimiento Público',
        description: 'Perfil destacado en nuestra plataforma y redes sociales'
    },
    {
        icon: '🎁',
        title: 'Beneficios Exclusivos',
        description: 'Descuentos en productos, entrada gratuita a eventos y merchandise oficial'
    },
    {
        icon: '📈',
        title: 'Desarrollo Profesional',
        description: 'Mejora tus habilidades de liderazgo, resolución de conflictos y comunicación'
    }
];

export const categoryLabels = {
    rules: 'Reglas Oficiales',
    policies: 'Políticas y Procedimientos',
    training: 'Material de Entrenamiento',
    forms: 'Formularios'
};

export const categoryIcons = {
    rules: '📖',
    policies: '⚖️',
    training: '🎓',
    forms: '📝'
};
