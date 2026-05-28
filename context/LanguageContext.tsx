import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LanguageType = 'es' | 'pt' | 'en';

interface LanguageContextType {
    language: LanguageType;
    setLanguage: (lang: LanguageType) => void;
    t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary: Record<string, Record<LanguageType, string>> = {
    // Navigation
    inicio: { es: 'Inicio', pt: 'Início', en: 'Home' },
    pls: { es: 'PLS', pt: 'PLS', en: 'PLS' },
    ranking: { es: 'Ranking', pt: 'Classificação', en: 'Ranking' },
    eventos: { es: 'Eventos', pt: 'Eventos', en: 'Events' },
    torneos: { es: 'Torneos', pt: 'Torneios', en: 'Tournaments' },
    mercado: { es: 'Mercado TCG', pt: 'Mercado TCG', en: 'TCG Marketplace' },
    foro: { es: 'Foro', pt: 'Fórum', en: 'Forum' },
    contenido: { es: 'Contenido', pt: 'Conteúdo', en: 'Content' },
    tiendas: { es: 'Tiendas', pt: 'Lojas', en: 'Stores' },
    ligas: { es: 'Ligas', pt: 'Ligas', en: 'Leagues' },
    envivo: { es: 'Señal Online', pt: 'Sinal Online', en: 'Live Stream' },
    quienes_somos: { es: 'Quiénes Somos', pt: 'Sobre Nós', en: 'About Us' },
    reglamento: { es: 'Reglamento', pt: 'Regulamento', en: 'Rules' },
    favoritos: { es: 'Favoritos', pt: 'Favoritos', en: 'Favorites' },
    notificaciones: { es: 'Notificaciones', pt: 'Notificações', en: 'Notifications' },
    configuracion: { es: 'Configuración', pt: 'Configurações', en: 'Settings' },
    acceder: { es: 'Acceder', pt: 'Acessar', en: 'Login' },
    cerrar_sesion: { es: 'Cerrar Sesión', pt: 'Sair', en: 'Logout' },
    
    // Homepage & Core Actions
    proximos_eventos: { es: 'Próximos Eventos', pt: 'Próximos Eventos', en: 'Upcoming Events' },
    ver_mas: { es: 'Ver más', pt: 'Ver mais', en: 'See more' },
    inscribirse: { es: 'Inscribirse Ahora', pt: 'Inscreva-se Agora', en: 'Register Now' },
    confirmado: { es: 'Confirmado', pt: 'Confirmado', en: 'Confirmed' },
    login_to_go: { es: 'Identificarse para Ir', pt: 'Identificar-se para Ir', en: 'Login to Join' },
    rankings_oficiales: { es: 'Rankings Oficiales', pt: 'Classificações Oficiais', en: 'Official Rankings' },
    ultimas_novedades: { es: 'Últimas Novedades', pt: 'Últimas Novidades', en: 'Latest News' },
    articulos: { es: 'Artículos', pt: 'Artigos', en: 'Articles' },
    videos: { es: 'Videos', pt: 'Vídeos', en: 'Videos' },
    buscar_juegos: { es: 'Buscar juegos...', pt: 'Buscar jogos...', en: 'Search games...' },
    mi_panel: { es: 'Mi Panel', pt: 'Meu Painel', en: 'My Dashboard' },
    panel_tienda: { es: 'Panel Tienda', pt: 'Painel da Loja', en: 'Store Dashboard' },
    panel_creador: { es: 'Panel de Creador', pt: 'Painel do Criador', en: 'Creator Dashboard' },
    siguenos: { es: 'SÍGUENOS', pt: 'SIGA-NOS', en: 'FOLLOW US' },
    idioma: { es: 'Idioma', pt: 'Idioma', en: 'Language' },
    tema: { es: 'Tema', pt: 'Tema', en: 'Theme' },
    oscuro: { es: 'Oscuro', pt: 'Escuro', en: 'Dark' },
    claro: { es: 'Claro', pt: 'Claro', en: 'Light' },
    jugar: { es: 'Jugar Ahora', pt: 'Jogar Agora', en: 'Play Now' },
    detalles: { es: 'Ver Detalles', pt: 'Ver Detalhes', en: 'View Details' },
    en_biblioteca: { es: 'En Biblioteca', pt: 'Na Biblioteca', en: 'In Library' },
    te_podria_gustar: { es: 'También Te Podría Gustar', pt: 'Você Também Pode Gostar', en: 'You Might Also Like' },
    jugadores: { es: 'Jugadores', pt: 'Jogadores', en: 'Players' },
    torneos_jugados: { es: 'Torneos', pt: 'Torneios', en: 'Tournaments' },
    partidas: { es: 'Partidas', pt: 'Partidas', en: 'Matches' },
    puntos: { es: 'Puntos', pt: 'Pontos', en: 'Points' },
    ranking_cta_title: { es: '¡Sube en el Ranking!', pt: 'Suba na Classificação!', en: 'Climb the Ranking!' },
    ranking_cta_desc: { es: 'Inscríbete en torneos oficiales y escala posiciones para ganar beneficios exclusivos.', pt: 'Inscreva-se em torneios oficiais e suba posições para ganhar benefícios exclusivos.', en: 'Register in official tournaments and climb positions to earn exclusive benefits.' },
    buscar_torneos: { es: 'Buscar Torneos', pt: 'Buscar Torneios', en: 'Search Tournaments' },
    exclusivo_title: { es: 'Rankings Exclusivos', pt: 'Classificações Exclusivas', en: 'Exclusive Rankings' },
    exclusivo_desc: { es: 'Inicia sesión o regístrate para ver tu posición en el ranking oficial y descubrir los niveles competitivos de nuestra comunidad.', pt: 'Faça login ou registre-se para ver sua posição na classificação oficial e descobrir os níveis competitivos de nossa comunidade.', en: 'Log in or register to see your position in the official ranking and discover the competitive levels of our community.' },
    unirse_ahora: { es: 'Unirse Ahora', pt: 'Juntar-se Agora', en: 'Join Now' },
    por: { es: 'Por', pt: 'Por', en: 'By' },
    no_noticias: { es: 'No hay noticias recientes.', pt: 'Não há notícias recentes.', en: 'No recent news.' },
    no_videos: { es: 'No hay videos destacados.', pt: 'Não há vídeos em destaque.', en: 'No featured videos.' },
    no_eventos: { es: 'No hay eventos próximos.', pt: 'Não há eventos próximos.', en: 'No upcoming events.' },
    jace_title: { es: 'Jace Beleren, Escultor Mental', pt: 'Jace Beleren, Escultor de Mentes', en: 'Jace Beleren, Mind Sculptor' },
    jace_desc: { es: 'El mago mental más poderoso del multiverso de Magic. Domina la telepatía, controla el grimorio de tus oponentes y reescribe las reglas del campo de batalla.', pt: 'O mago mental mais poderoso do multiverso do Magic. Domine a telepatia, controle o grimório de seus oponentes e reescreva as regras do campo de batalha.', en: 'The most powerful mind mage in the Magic multiverse. Master telepathy, control your opponents\' library, and rewrite the rules of the battlefield.' },
    
    // Additional UI Strings
    buscar: { es: 'Buscar...', pt: 'Buscar...', en: 'Search...' },
    administrador: { es: 'Administrador', pt: 'Administrador', en: 'Administrator' },
    tienda: { es: 'Tienda', pt: 'Loja', en: 'Store' },
    jugador: { es: 'Jugador', pt: 'Jogador', en: 'Player' },
    conectar: { es: 'Conectando...', pt: 'Conectando...', en: 'Connecting...' },
    validar_acceso: { es: 'Validando acceso seguro', pt: 'Validando acesso seguro', en: 'Validating secure access' },
    cambiar_juego: { es: 'Cambiar Juego', pt: 'Mudar de Jogo', en: 'Switch Game' },
    clasificacion_temporada: { es: 'Top 10 Puntos de Temporada', pt: 'Top 10 Pontos de Temporada', en: 'Top 10 Season Points' },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<LanguageType>(() => {
        const saved = localStorage.getItem('app_language');
        return (saved === 'es' || saved === 'pt' || saved === 'en') ? saved : 'es';
    });

    const setLanguage = (lang: LanguageType) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
    };

    const t = (key: string, fallback?: string): string => {
        const entry = dictionary[key];
        if (!entry) return fallback || key;
        return entry[language] || entry['es'] || fallback || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
