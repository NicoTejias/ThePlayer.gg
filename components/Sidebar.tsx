import React, { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';
import { Facebook, Instagram, MessageCircle, Mail } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
    userRole: 'player' | 'store' | 'admin' | null;
    isContentCreator?: boolean;
    isInline?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isLoggedIn, userRole, isContentCreator, isInline = false }) => {
    const { currentGame } = useGame();
    const { t } = useTranslation();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Body scroll lock when open
    useEffect(() => {
        if (isOpen && !isInline) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, isInline]);

    // Close sidebar on route change (exclude onClose from deps to avoid closing on every render)
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    useEffect(() => {
        if (!isInline) {
            onCloseRef.current();
        }
    }, [location.pathname, isInline]);

    const NavItem: React.FC<{ item: { name: string; path: string; icon: string; isSpecial?: boolean } }> = ({ item }) => (
        <NavLink
            to={item.path}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                    ? 'bg-sky-600/20 text-sky-300 border-l-4 border-sky-500'
                    : item.isSpecial
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-l-4 border-amber-500/50 hover:text-amber-300'
                        : 'text-slate-300 hover:bg-slate-750 hover:text-white border-l-4 border-transparent'
                }`
            }
        >
            <span className="text-lg">{item.icon}</span>
            <span className="font-semibold flex items-center gap-2">
                {item.name}
            </span>
        </NavLink>
    );

    const sidebarInnerContent = (
        <div className="flex flex-col h-full justify-between">
            {/* Header */}
            {!isInline && (
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <Link to="/home" className="flex items-center gap-2" onClick={onClose}>
                        <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-8" />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 rounded-xl transition-colors touch-manipulation"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {isInline && (
                <div className="p-6 border-b border-slate-800/40 flex items-center justify-center">
                    <Link to="/home" className="flex flex-col items-center gap-1">
                        <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-10 hover:scale-105 transition-transform duration-300" />
                        <span className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">TCG Platform</span>
                    </Link>
                </div>
            )}

            {/* Navigation - Scrollable area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div className="space-y-1">
                    <NavItem item={{ name: t('inicio'), path: '/home', icon: '🏠' }} />
                    <NavItem item={{ name: t('ranking'), path: '/ranking', icon: '📊' }} />
                    <NavItem item={{ name: t('eventos'), path: '/eventos', icon: '📅' }} />
                    <NavItem item={{ name: t('tiendas'), path: '/tiendas', icon: '🏪' }} />
                    <NavItem item={{ name: t('foro'), path: '/foro', icon: '💬' }} />
                    <NavItem item={{ name: t('contenido'), path: '/contenido', icon: '📱' }} />
                </div>

                {/* Mi Perfil (Solo Logueados) */}
                {isLoggedIn && (
                    <div className="pt-4 border-t border-slate-850 space-y-1">
                        {userRole === 'admin' && (
                            <>
                                <NavItem item={{ name: t('panel_admin'), path: '/admin', icon: '🛡️' }} />
                                <NavItem item={{ name: t('panel_tienda'), path: '/dashboard/tienda', icon: '🏪' }} />
                            </>
                        )}
                        {userRole === 'store' && (
                            <NavItem item={{ name: t('panel_tienda'), path: '/dashboard/tienda', icon: '🏪' }} />
                        )}
                        {userRole === 'player' && (
                            <NavItem item={{ name: t('mi_panel'), path: '/dashboard/jugador', icon: '🎮' }} />
                        )}
                        {isContentCreator && (
                            <NavItem item={{ name: t('panel_creador'), path: '/dashboard/creador', icon: '🎬' }} />
                        )}
                        <NavItem item={{ name: t('favoritos'), path: '/favorites', icon: '❤️' }} />
                        <NavItem item={{ name: t('notificaciones'), path: '/notifications', icon: '🔔' }} />
                        <NavItem item={{ name: t('configuracion'), path: '/settings', icon: '⚙️' }} />
                    </div>
                )}

                {/* Información */}
                <div className="pt-4 border-t border-slate-850 space-y-1">
                    <NavItem item={{ name: t('quienes_somos'), path: '/quienes-somos', icon: '🤝' }} />
                    <NavItem item={{ name: t('reglamento'), path: '/reglamento', icon: '📜' }} />
                </div>
            </div>

            {/* Redes Sociales - Sidebar Bottom */}
            <div className="p-4 border-t border-slate-850">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">{t('siguenos')}</p>
                <div className="flex justify-center gap-3">
                    <a href="https://web.facebook.com/theplayercl" target="_blank" rel="noopener noreferrer" title="Facebook" className="p-1.5 bg-slate-800/40 border border-slate-805 hover:border-slate-700 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-700/20 transition-all">
                        <Facebook className="w-4 h-4" />
                    </a>
                    <a href="https://www.instagram.com/theplayer_cl/" target="_blank" rel="noopener noreferrer" title="Instagram" className="p-1.5 bg-slate-800/40 border border-slate-805 hover:border-slate-700 rounded-lg text-slate-400 hover:text-pink-500 hover:bg-slate-700/20 transition-all">
                        <Instagram className="w-4 h-4" />
                    </a>
                    <a href="https://wa.me/56992274852" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="p-1.5 bg-slate-800/40 border border-slate-805 hover:border-slate-700 rounded-lg text-slate-400 hover:text-green-500 hover:bg-slate-700/20 transition-all">
                        <MessageCircle className="w-4 h-4" />
                    </a>
                    <a href="mailto:contacto@theplayer.cl" title="Email" className="p-1.5 bg-slate-800/40 border border-slate-805 hover:border-slate-700 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/20 transition-all">
                        <Mail className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );

    if (isInline) {
        return (
            <div className="h-full w-full flex flex-col bg-slate-950/10">
                {sidebarInnerContent}
            </div>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                onTouchEnd={onClose}
                aria-hidden="true"
            />

            {/* Sidebar drawer */}
            <div
                ref={sidebarRef}
                className={`fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-700/50 z-[201] transform transition-transform duration-300 ease-out overscroll-contain ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {sidebarInnerContent}
            </div>
        </>
    );
};

export default Sidebar;
