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

interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'player' | 'store' | 'admin' | null;
  userName?: string;
  handleLogout: () => void;
  isLiveSignal?: boolean;
  judgeRole?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  userRole,
  userName = 'Jugador',
  handleLogout,
  isLiveSignal = false,
  judgeRole = null
}) => {
  const { currentGame } = useGame();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

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
      <header className="bg-slate-800 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-700/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section: Menu Button + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Abrir menú"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link to="/" className="flex items-center">
                <img
                  src="/logotheplayer.png"
                  alt="ThePlayer.gg"
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            {/* Center Section: Game Logo + Name + Format Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Game Logo + Name - More Prominent, No Background */}
              <div className="flex items-center gap-4">
                {/* Logo - Much Larger size (112px) */}
                <div className="w-28 h-28 flex items-center justify-center">
                  <img
                    src={GAME_LOGOS[currentGame].src}
                    alt={GAME_LABELS[currentGame]}
                    className="w-full h-full object-contain drop-shadow-2xl"
                    onError={(e) => {
                      // Fallback to emoji if image fails to load
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                      }
                    }}
                  />
                  <span
                    className="text-7xl hidden drop-shadow-2xl"
                    style={{ display: GAME_LOGOS[currentGame].src ? 'none' : 'block' }}
                  >
                    {GAME_LOGOS[currentGame].emoji}
                  </span>
                </div>
                {/* Game Name - Much Larger text */}
                <span className="text-white font-bold text-2xl whitespace-nowrap">
                  {GAME_LABELS[currentGame]}
                </span>
              </div>

              {/* Separator */}
              {GAME_FORMATS[currentGame].length > 0 && (
                <div className="h-8 w-px bg-slate-600"></div>
              )}

              {/* Format Buttons */}
              {GAME_FORMATS[currentGame].length > 0 && (
                <div className="flex items-center gap-2">
                  {GAME_FORMATS[currentGame].map((format) => (
                    <Link
                      key={format.id}
                      to={format.path}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${location.pathname === format.path
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white border border-slate-600/50'
                        }`}
                    >
                      {format.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Section: Quick Actions + Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Live Signal Indicator */}
              {isLiveSignal && (
                <Link
                  to="/envivo"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full animate-pulse"
                >
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  EN VIVO
                </Link>
              )}

              {/* Quick Action Buttons (only visible on desktop) */}
              {isLoggedIn && userRole === 'admin' && (
                <Link
                  to="/admin"
                  className="hidden md:block px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-xs"
                >
                  Admin
                </Link>
              )}

              {isLoggedIn && (judgeRole === 'judge' || judgeRole === 'head_judge') && (
                <Link
                  to="/jueces"
                  className="hidden md:block px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors text-xs"
                >
                  Juez
                </Link>
              )}

              {/* Notification Bell */}
              {isLoggedIn && <NotificationBell />}

              {/* User Profile / Login */}
              {isLoggedIn ? (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 bg-slate-700/50 p-1.5 pr-3 rounded-full hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-500"
                  >
                    <UserCircleIcon className="w-8 h-8 text-sky-400" />
                    <span className="text-white font-semibold text-sm hidden sm:block max-w-[100px] truncate">{userName}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-slate-800 ring-1 ring-black ring-opacity-5 border border-slate-700/50 divide-y divide-slate-700/50 animate-in fade-in slide-in-from-top-2 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 sm:hidden border-b border-slate-700/50 mb-2">
                          <p className="text-xs text-slate-400">Logueado como</p>
                          <p className="text-white font-bold truncate">{userName}</p>
                        </div>
                        <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <ShieldCheckIcon className="w-5 h-5 text-sky-400" />
                          Mi Panel
                        </Link>
                        <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Favoritos
                        </Link>
                        <Link to="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Notificaciones
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <CogIcon className="w-5 h-5 text-slate-400" />
                          Configuración
                        </Link>
                      </div>
                      <div className="py-2">
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-300 hover:bg-red-900/20 transition-colors" role="menuitem">
                          <LogoutIcon className="w-5 h-5" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-slate-300 hover:text-white text-sm font-medium px-3 py-2 transition-colors"
                  >
                    Acceder
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-2 px-4 rounded-full hover:from-sky-500 hover:to-blue-500 transition-all shadow-lg shadow-sky-900/20 text-sm whitespace-nowrap"
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Component */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        judgeRole={judgeRole}
      />
    </>
  );
};

export default Header;