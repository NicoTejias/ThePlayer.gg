import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
    userRole: 'player' | 'store' | 'admin' | null;
}

// Navigation structure
const mainNavItems = [
    { name: 'Inicio', path: '/', icon: '🏠' },
    { name: 'PLS', path: '/pls', icon: '🏆' },
    { name: 'Ranking', path: '/ranking/pwp', icon: '📊' },
    { name: 'Eventos', path: '/eventos', icon: '📅' },
    { name: 'Torneos', path: '/torneos', icon: '🎮' },
    { name: 'Mercado TCG', path: '/mercado', icon: '🛒' },
];

const communityItems = [
    { name: 'Creadores', path: '/creadores', icon: '🎬' },
    { name: 'Tiendas', path: '/tiendas', icon: '🏪' },
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

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isLoggedIn, userRole }) => {
    const { currentGame, setGame } = useGame();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));
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
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const NavItem: React.FC<{ item: { name: string; path: string; icon: string } }> = ({ item }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? 'bg-sky-600/20 text-sky-300 border-l-4 border-sky-500'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border-l-4 border-transparent'
                }`
            }
        >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
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
                className={`w-4 h-4 transition-transform duration-200 ${expandedSections.has(section) ? 'rotate-180' : ''}`}
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
                    <Link to="/" className="flex items-center gap-2" onClick={onClose}>
                        <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-8" />
                    </Link>
                    <button
                        onClick={onClose}
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
                    {/* Main Navigation */}
                    <div className="p-2">
                        <SectionHeader title="Navegación" section="main" icon="🧭" />
                        {expandedSections.has('main') && (
                            <div className="space-y-1 mt-1">
                                {mainNavItems.map((item) => (
                                    <NavItem key={item.path} item={item} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Media Section */}
                    <div className="p-2 border-t border-slate-800">
                        <SectionHeader title="Media" section="media" icon="📱" />
                        {expandedSections.has('media') && (
                            <div className="space-y-1 mt-1">
                                {mediaItems.map((item) => (
                                    <NavItem key={item.path} item={item} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Community Section */}
                    <div className="p-2 border-t border-slate-800">
                        <SectionHeader title="Comunidad" section="community" icon="👥" />
                        {expandedSections.has('community') && (
                            <div className="space-y-1 mt-1">
                                {communityItems.map((item) => (
                                    <NavItem key={item.path} item={item} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MTG Formats (only show when MTG is selected) */}
                    {currentGame === 'mtg' && (
                        <div className="p-2 border-t border-slate-800">
                            <SectionHeader title="Formatos MTG" section="mtg" icon="🃏" />
                            {expandedSections.has('mtg') && (
                                <div className="space-y-1 mt-1">
                                    {mtgFormats.map((item) => (
                                        <NavItem key={item.path} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Admin/User Sections */}
                    {isLoggedIn && (
                        <div className="p-2 border-t border-slate-800">
                            <SectionHeader title="Mi Cuenta" section="account" icon="👤" />
                            {expandedSections.has('account') && (
                                <div className="space-y-1 mt-1">
                                    {userRole === 'admin' && (
                                        <NavItem item={{ name: 'Panel Admin', path: '/admin', icon: '🛡️' }} />
                                    )}
                                    {userRole === 'store' && (
                                        <NavItem item={{ name: 'Mi Tienda', path: '/dashboard/tienda', icon: '🏪' }} />
                                    )}
                                    {userRole === 'player' && (
                                        <NavItem item={{ name: 'Mi Panel', path: '/dashboard/jugador', icon: '🎮' }} />
                                    )}

                                    <NavItem item={{ name: 'Favoritos', path: '/favorites', icon: '❤️' }} />
                                    <NavItem item={{ name: 'Notificaciones', path: '/notifications', icon: '🔔' }} />
                                    <NavItem item={{ name: 'Estadísticas', path: '/stats', icon: '📈' }} />
                                    <NavItem item={{ name: 'Configuración', path: '/settings', icon: '⚙️' }} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
