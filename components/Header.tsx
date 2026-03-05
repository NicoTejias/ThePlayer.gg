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
              <Link to="/home" className="flex items-center">
                <img
                  src="/logotheplayer.png"
                  alt="ThePlayer.cl"
                  className="h-8 sm:h-10 w-auto"
                />
              </Link>
            </div>

            {/* Center Section: Game Logo only */}
            <div className="hidden md:flex items-center ml-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <img
                  src={GAME_LOGOS[currentGame].src}
                  alt={GAME_LABELS[currentGame]}
                  className={`w-full h-full object-contain ${imgError ? 'hidden' : 'block'}`}
                  onError={() => setImgError(true)}
                />
                <span className={`text-5xl ${!imgError && GAME_LOGOS[currentGame].src ? 'hidden' : 'block'}`}>
                  {GAME_LOGOS[currentGame].emoji}
                </span>
              </div>
            </div>

            {/* Right Section: Access / Profile only */}
            <div className="flex items-center">
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
                          Mi Panel
                        </Link>
                        <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
                          <CogIcon className="w-5 h-5 text-slate-400" />
                          Configuración
                        </Link>
                      </div>
                      <div className="py-2">
                        <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-300 hover:bg-red-900/20 transition-colors">
                          <LogoutIcon className="w-5 h-5" />
                          Cerrar Sesión
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
                  Acceder
                </Link>
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
        isContentCreator={userProfile?.is_content_creator || userProfile?.role === 'content_creator'}
      />
    </>
  );
};

export default Header;