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

  // Reset image error when game changes
  useEffect(() => {
    setImgError(false);
  }, [currentGame]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close profile menu on route change
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'store': return '/dashboard/tienda';
      case 'player': return '/dashboard/jugador';
      default: return '/dashboard/jugador';
    }
  };

  return (
    <>
      <header className="bg-slate-800/85 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-700/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section: Menu Button + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button (visible on mobile only since desktop has inline sidebar) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors lg:hidden"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo (visible on mobile, hidden on desktop since inline sidebar has it) */}
              <Link to="/home" className="flex items-center lg:hidden">
                <img
                  src="/logotheplayer.png"
                  alt="ThePlayer.cl"
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
              
              {/* Desktop Active Game Display */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-900/30 border border-slate-850 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('cambiar_juego')}:</span>
                <Link to="/universe-selection" className="text-xs font-black text-sky-400 hover:text-sky-350 transition-colors uppercase tracking-wider flex items-center gap-1">
                  <span>{GAME_LABELS[currentGame]}</span>
                  <span>{GAME_LOGOS[currentGame]?.emoji}</span>
                </Link>
              </div>
            </div>

            {/* Center Section: Game Logo (centered on mobile, normal position on desktop) */}
            <div className="flex items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                {GAME_LOGOS[currentGame]?.src ? (
                  <img
                    src={GAME_LOGOS[currentGame].src}
                    alt={GAME_LABELS[currentGame]}
                    className={`w-full h-full object-contain ${imgError ? 'hidden' : 'block'}`}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-4xl">{GAME_LOGOS[currentGame]?.emoji || '🎮'}</span>
                )}
                {imgError && GAME_LOGOS[currentGame]?.src && (
                  <span className="text-4xl">
                    {GAME_LOGOS[currentGame].emoji}
                  </span>
                )}
              </div>
            </div>

            {/* Right Section: Access / Profile only */}
            <div className="flex items-center gap-4">
              {/* Language Selector (desktop only, sidebar handles mobile) */}
              <div className="hidden md:flex items-center gap-1 bg-slate-900/30 border border-slate-850 p-1 rounded-xl">
                {(['es', 'pt', 'en'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${language === lang ? 'bg-sky-600/30 text-sky-400 border border-sky-500/50 shadow-sm' : 'text-slate-450 hover:text-slate-200 border border-transparent'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              {/* Theme Toggle Button (desktop only, sidebar handles mobile) */}
              <button
                onClick={toggleTheme}
                title={t('tema')}
                className="hidden md:flex p-2 bg-slate-900/30 hover:bg-slate-700/30 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>

              {isLoggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 bg-slate-700/50 p-1 px-3 rounded-full hover:bg-slate-700 transition-all border border-slate-600"
                    aria-label="Menú de usuario"
                  >
                    <UserCircleIcon className="w-8 h-8 text-sky-400" />
                    <span className="text-white font-semibold text-sm hidden sm:block truncate max-w-[100px]">{userName}</span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-slate-800 border border-slate-700/50 divide-y divide-slate-700/50 z-50">
                      <div className="py-2">
                        <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
                          <ShieldCheckIcon className="w-5 h-5 text-sky-400" />
                          {t('mi_panel')}
                        </Link>
                        {userRole === 'admin' && (
                          <Link to="/dashboard/tienda" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
                            <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {t('panel_tienda')}
                          </Link>
                        )}
                        <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
                          <CogIcon className="w-5 h-5 text-slate-450" />
                          {t('configuracion')}
                        </Link>
                      </div>
                      <div className="py-2">
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-305 hover:bg-red-900/20 transition-colors cursor-pointer">
                          <LogoutIcon className="w-5 h-5" />
                          {t('cerrar_sesion')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-6 rounded-full transition-all text-sm shadow-lg shadow-sky-900/20"
                >
                  {t('acceder')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Component (Mobile only drawer, closed by default) */}
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