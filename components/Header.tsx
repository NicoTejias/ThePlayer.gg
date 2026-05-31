import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserCircleIcon from './icons/UserCircleIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import NotificationBell from './NotificationBell';
import Sidebar from './Sidebar';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GAME_LOGOS, GAME_FORMATS } from '../types';
import { useTranslation } from '../context/LanguageContext';
import { useAppTheme } from '../context/ThemeContext';

interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'player' | 'store' | 'admin' | null;
  userName?: string;
  userProfile?: any;
  handleLogout: () => void;
  isLiveSignal?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  userRole,
  userName = 'Jugador',
  userProfile,
  handleLogout,
  isLiveSignal = false
}) => {
  const { currentGame } = useGame();
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useAppTheme();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => { setImgError(false); }, [currentGame]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setProfileMenuOpen(false); }, [location.pathname]);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'store': return '/dashboard/tienda';
      default: return '/dashboard/jugador';
    }
  };

  return (
    <>
      {/* Top accent line — game theme color */}
      <div className="game-indicator-bar" />

      <header className="header-glass sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[60px]">

            {/* LEFT: Hamburger (mobile) + Game selector (desktop) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-white transition-colors lg:hidden"
                aria-label="Abrir menú"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Mobile logo */}
              <Link to="/home" className="flex items-center lg:hidden">
                <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-8 w-auto" />
              </Link>

              {/* Desktop: game switcher pill */}
              <Link
                to="/universe-selection"
                className="hidden lg:flex items-center gap-2.5 game-pill px-3.5 py-2 rounded-xl group"
              >
                <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                  {GAME_LOGOS[currentGame]?.src && !imgError ? (
                    <img
                      src={GAME_LOGOS[currentGame].src}
                      alt={GAME_LABELS[currentGame]}
                      className="w-full h-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-xl leading-none">{GAME_LOGOS[currentGame]?.emoji || '🎮'}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {t('cambiar_juego')}
                  </span>
                  <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-accent)', letterSpacing: '0.04em' }}>
                    {GAME_LABELS[currentGame]}
                  </span>
                </div>
                <svg className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>

            {/* CENTER: Site logo (desktop only) */}
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center">
              <Link to="/home" className="flex items-center gap-2 group">
                <img src="/logotheplayer.png" alt="ThePlayer.gg" className="h-9 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            {/* RIGHT: Controls + Profile */}
            <div className="flex items-center gap-2">
              {isLiveSignal && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.6rem', textTransform: 'uppercase', color: '#f87171' }}>
                    Live
                  </span>
                </div>
              )}

              {/* Language selector */}
              <div className="hidden md:flex items-center game-pill p-1 rounded-xl gap-0.5">
                {(['es', 'pt', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    style={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      background: language === lang ? 'var(--color-accent)' : 'transparent',
                      color: language === lang ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={t('tema')}
                className="hidden md:flex w-9 h-9 items-center justify-center game-pill rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer text-sm"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              {/* Notification bell */}
              {isLoggedIn && <NotificationBell />}

              {/* Profile / Login */}
              {isLoggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    style={{
                      background: isProfileMenuOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                    aria-label="Menú de usuario"
                  >
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt={userName} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--color-accent)', color: '#fff', fontFamily: 'Cinzel, serif' }}
                      >
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-white font-semibold text-sm hidden sm:block truncate max-w-[90px]" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.03em' }}>
                      {userName}
                    </span>
                    <svg className="w-3 h-3 text-slate-500 hidden sm:block flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl z-50 overflow-hidden animate-scale-in"
                      style={{
                        background: 'rgba(15,7,20,0.95)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                      }}
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/6">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-0.5" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                          {userRole === 'admin' ? 'Administrador' : userRole === 'store' ? 'Tienda' : 'Jugador'}
                        </p>
                        <p className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.04em' }}>
                          {userName}
                        </p>
                      </div>

                      <div className="py-1.5">
                        <Link
                          to={getDashboardPath()}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}
                        >
                          <span style={{ color: 'var(--color-accent)', display: 'flex', flexShrink: 0 }}><ShieldCheckIcon className="w-4 h-4" /></span>
                          {t('mi_panel')}
                        </Link>
                        {userRole === 'admin' && (
                          <Link
                            to="/dashboard/tienda"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}
                          >
                            <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {t('panel_tienda')}
                          </Link>
                        )}
                        <Link
                          to="/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}
                        >
                          <CogIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          {t('configuracion')}
                        </Link>
                      </div>

                      <div className="border-t border-white/6 py-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/15 transition-colors cursor-pointer"
                          style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}
                        >
                          <LogoutIcon className="w-4 h-4 flex-shrink-0" />
                          {t('cerrar_sesion')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-accent px-5 py-2 rounded-xl text-xs"
                >
                  {t('acceder')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        isContentCreator={userProfile?.is_content_creator || userProfile?.role === 'content_creator'}
      />
    </>
  );
};

export default Header;
