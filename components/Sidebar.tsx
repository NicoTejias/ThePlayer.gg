import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';
import { Facebook, Instagram, MessageCircle, Mail } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
    userRole: 'player' | 'store' | 'admin' | null;
    isContentCreator?: boolean;
}

// Navigation structure
const mainNavItems = [
    { name: 'Inicio', path: '/', icon: '🏠' },
    { name: 'PLS', path: '/pls', icon: '🏆' },
    { name: 'Ranking', path: '/ranking', icon: '📊' },
    { name: 'Eventos', path: '/eventos', icon: '📅' },
    { name: 'Torneos', path: '/torneos', icon: '🎮' },
    { name: 'Mercado TCG', path: '/mercado', icon: '🛒' },
];

const communityItems = [
    { name: 'Creadores', path: '/creadores', icon: '🎬' },
    { name: 'Tiendas', path: '/tiendas', icon: '🏪' },
    { name: 'Ligas', path: '/ligas', icon: '🏆' },
    { name: 'Señal Online', path: '/envivo', icon: '📺' },
];

const mediaItems = [
    { name: 'Portada Media', path: '/media', icon: '📰' },
    { name: 'Artículos', path: '/media/articulos', icon: '📝' },
    { name: 'Videos', path: '/media/videos', icon: '🎥' },
];

const mtgFormats = [
    { name: 'Commander', path: '/commander', icon: '🏰' },
    { name: 'Pauper', path: '/pauper', icon: '💎' },
    { name: 'Premodern', path: '/premodern', icon: '📜' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isLoggedIn, userRole, isContentCreator }) => {
    const { currentGame, setGame } = useGame();
    const [expandedSection, setExpandedSection] = useState<string | null>('community');
    const sidebarRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Close sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Prevent body scroll when sidebar is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Close sidebar on route change
    useEffect(() => {
        onClose();
    }, [location.pathname]);

    const toggleSection = (section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const NavItem: React.FC<{ item: { name: string; path: string; icon: string; isSpecial?: boolean } }> = ({ item }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-sky-600/20 text-sky-300 border-l-4 border-sky-500'
                    : item.isSpecial
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-l-4 border-amber-500/50 hover:text-amber-300'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-l-4 border-transparent'
                }`
            }
        >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium flex items-center gap-2">
                {item.name}
            </span>
        </NavLink>
    );

    const SectionHeader: React.FC<{ title: string; section: string; icon: string }> = ({ title, section, icon }) => (
        <button
            onClick={() => toggleSection(section)}
            className="flex items-center justify-between w-full px-4 py-3 text-left text-slate-400 hover:text-white transition-colors"
        >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <span>{icon}</span>
                {title}
            </span>
            <svg
                className={`w-4 h-4 transition-transform duration-200 ${expandedSection === section ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </button>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={`fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-700/50 z-[201] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <Link to="/home" className="flex items-center gap-2" onClick={onClose}>
                        <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-8" />
                    </Link>
                    <button
                        onClick={onClose}
                        title="Cerrar menú"
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Game Selector */}
                <div className="p-4 border-b border-slate-700/50">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-bold">Universo Actual</p>
                    <div className="relative">
                        <select
                            value={currentGame}
                            onChange={(e) => setGame(e.target.value as GameType)}
                            title="Universo Actual"
                            aria-label="Seleccionar universo de juego"
                            className="w-full appearance-none bg-slate-800 text-sky-400 font-bold px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent cursor-pointer"
                        >
                            {(Object.keys(GAME_LABELS) as GameType[]).map((game) => (
                                <option key={game} value={game}>
                                    {GAME_LABELS[game]}
                                </option>
                            ))}
                        </select>
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Navigation */}
                <div className="overflow-y-auto h-[calc(100%-180px)] custom-scrollbar">
                    {/* Sección Competencia */}
                    <div className="p-2">
                        <SectionHeader title="Competencia" section="competition" icon="🏆" />
                        {expandedSection === 'competition' && (
                            <div className="space-y-1 mt-1">
                                <NavItem item={{ name: 'PLS', path: '/pls', icon: '🌟', isSpecial: true }} />
                                <NavItem item={{ name: 'Ranking', path: '/ranking', icon: '📊' }} />
                                <NavItem item={{ name: 'Torneos', path: '/torneos', icon: '⚔️' }} />
                                <NavItem item={{ name: 'Eventos', path: '/eventos', icon: '📅' }} />
                                {currentGame === 'mtg' && (
                                    <>
                                        <NavItem item={{ name: 'Commander', path: '/commander', icon: '🏰' }} />
                                        <NavItem item={{ name: 'Pauper', path: '/pauper', icon: '💎' }} />
                                        <NavItem item={{ name: 'Premodern', path: '/premodern', icon: '📜' }} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>


                    {/* Sección Comunidad */}
                    <div className="p-2 border-t border-slate-800">
                        <SectionHeader title="Comunidad" section="community" icon="👥" />
                        {expandedSection === 'community' && (
                            <div className="space-y-1 mt-1">
                                <NavItem item={{ name: 'Mercado TCG', path: '/mercado', icon: '🛒' }} />
                                <NavItem item={{ name: 'Tiendas', path: '/tiendas', icon: '🏪' }} />
                                <NavItem item={{ name: 'Foro', path: '/foro', icon: '💬' }} />
                                <NavItem item={{ name: 'Señal Online', path: '/envivo', icon: '📺' }} />
                                <NavItem item={{ name: 'Contenido', path: '/contenido', icon: '📱' }} />
                            </div>
                        )}
                    </div>

                    {/* Sección Mi Perfil (Solo Logueados) */}
                    {isLoggedIn && (
                        <div className="p-2 border-t border-slate-800">
                            <SectionHeader title="Mi Perfil" section="profile" icon="👤" />
                            {expandedSection === 'profile' && (
                                <div className="space-y-1 mt-1">
                                    {userRole === 'admin' && (
                                        <NavItem item={{ name: 'Panel Admin', path: '/admin', icon: '🛡️' }} />
                                    )}
                                    {userRole === 'store' && (
                                        <NavItem item={{ name: 'Panel Tienda', path: '/dashboard/tienda', icon: '🏪' }} />
                                    )}
                                    {userRole === 'player' && (
                                        <NavItem item={{ name: 'Mi Dashboard', path: '/dashboard/jugador', icon: '🎮' }} />
                                    )}
                                    {isContentCreator && (
                                        <NavItem item={{ name: 'Panel de Creador', path: '/dashboard/creador', icon: '🎬' }} />
                                    )}
                                    <NavItem item={{ name: 'Mis Anuncios', path: '/mis-anuncios', icon: '🏷️' }} />
                                    <NavItem item={{ name: 'Favoritos', path: '/favorites', icon: '❤️' }} />
                                    <NavItem item={{ name: 'Notificaciones', path: '/notifications', icon: '🔔' }} />
                                    <NavItem item={{ name: 'Configuración', path: '/settings', icon: '⚙️' }} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sección Información */}
                    <div className="p-2 border-t border-slate-800">
                        <SectionHeader title="Información" section="info" icon="ℹ️" />
                        {expandedSection === 'info' && (
                            <div className="space-y-1 mt-1">
                                <NavItem item={{ name: 'Quiénes Somos', path: '/quienes-somos', icon: '🤝' }} />
                                <NavItem item={{ name: 'Reglamento', path: '/reglamento', icon: '📜' }} />
                            </div>
                        )}
                    </div>

                    {/* Redes Sociales - Sidebar Bottom */}
                    <div className="p-6 border-t border-slate-800">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">SÍGUENOS</p>
                        <div className="flex justify-center gap-4">
                            <a href="https://web.facebook.com/theplayercl" target="_blank" rel="noopener noreferrer" title="Facebook" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-700 transition-all">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://www.instagram.com/theplayer_cl/" target="_blank" rel="noopener noreferrer" title="Instagram" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-slate-700 transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/56992274852" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-green-500 hover:bg-slate-700 transition-all">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a href="mailto:contacto@theplayer.cl" title="Email" className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-all">
                                <Mail className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
