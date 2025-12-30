import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import UserCircleIcon from './icons/UserCircleIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import NotificationBell from './NotificationBell';
import { useGame } from '../context/GameContext';
import { GAME_LABELS, GameType } from '../types';

// Define the structure for navigation items
type NavLinkType = {
  name: string;
  path: string;
  subItems?: NavLinkType[]; // Recursive definition
  isLive?: boolean;
};

const NavLinks: NavLinkType[] = [
  { name: 'Inicio', path: '/' },
  { name: 'PLS', path: '/pls' },
  { name: 'Ranking', path: '/ranking/pwp' },
  { name: 'Eventos', path: '/eventos' },
  { name: 'Mercado TCG', path: '/mercado' },
  {
    name: 'Comunidad',
    path: '#',
    subItems: [
      {
        name: 'Media',
        path: '/media',
        subItems: [
          { name: 'Portada', path: '/media' },
          { name: 'Artículos', path: '/media/articulos' },
          { name: 'Videos', path: '/media/videos' },
        ]
      },
      { name: 'Jueces', path: '/jueces' },
      { name: 'Creadores', path: '/creadores' },
      { name: 'Tiendas', path: '/tiendas' },
      { name: 'Señal Online', path: '/envivo', isLive: true },
    ]
  },
];

// Recursive Menu Item Component for arbitrary depth
const MenuItem: React.FC<{ item: NavLinkType; depth?: number; isLiveSignal?: boolean }> = ({ item, depth = 0, isLiveSignal = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isTopLevel = depth === 0;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    console.log(`[MenuItem] Mouse ENTER on "${item.name}" (depth: ${depth})`);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    console.log(`[MenuItem] Mouse LEAVE on "${item.name}" (depth: ${depth})`);
    // Add delay to allow mouse to move to submenu
    timeoutRef.current = setTimeout(() => {
      console.log(`[MenuItem] Closing "${item.name}" after delay`);
      setIsOpen(false);
    }, 150);
  };

  const baseLinkClass = "block rounded transition-colors duration-200 whitespace-nowrap cursor-pointer select-none text-sm font-medium";
  const topLevelClass = "py-2 px-3 text-slate-300 hover:bg-slate-700 hover:text-white";
  const subLevelClass = "px-4 py-2.5 text-slate-300 hover:bg-slate-700/80 hover:text-sky-300 flex items-center justify-between";

  return (
    <div
      className={`relative ${isTopLevel ? 'h-full flex items-center' : 'w-full'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Link for this Item */}
      {hasSubItems ? (
        <div
          className={`${isTopLevel ? topLevelClass : subLevelClass} flex items-center gap-1 ${isOpen ? 'text-white' : ''}`}
          data-name={item.name}
        >
          {item.name}
          <svg className={`w-3 h-3 transition-transform duration-200 opacity-70 ${isOpen ? (isTopLevel ? 'rotate-180' : 'rotate-0') : (isTopLevel ? '' : '-rotate-90')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ) : (
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `${baseLinkClass} ${isTopLevel ? 'py-2 px-3 text-slate-300 hover:bg-slate-700 hover:text-white' : 'block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-sky-300'} 
                        ${isActive ? 'text-white bg-sky-600 shadow-md shadow-sky-900/20' : ''}`
          }
        >
          {item.name}
        </NavLink>
      )}

      {/* Render SubMenu if it has children */}
      {hasSubItems && (
        <div
          className={`absolute ${isTopLevel ? 'top-full left-0 pt-2' : 'top-0 left-full ml-2'} w-48 transition-all duration-200 ease-in-out ${isOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'} ${depth === 0 ? 'z-[100]' : depth === 1 ? 'z-[110]' : 'z-[120]'}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ border: depth > 0 ? '2px solid red' : 'none' }}
          ref={(el) => {
            if (el && depth > 0) {
              console.log(`[Submenu] "${item.name}" submenu div rendered, isOpen: ${isOpen}, depth: ${depth}`);
            }
          }}
        >
          <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 overflow-hidden ring-1 ring-black ring-opacity-10 py-1">
            {item.subItems!.map((subItem) => (
              <MenuItem key={subItem.name} item={subItem} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'player' | 'store' | 'admin' | null;
  userName?: string; // New prop
  handleLogout: () => void;
  isLiveSignal?: boolean;
  judgeRole?: string | null;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userRole, userName = 'Jugador', handleLogout, isLiveSignal = false, judgeRole = null }) => {
  const { currentGame, setGame } = useGame();
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMagicHovered, setIsMagicHovered] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const magicTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      // Clean up magic timeout on unmount
      if (magicTimeoutRef.current) {
        clearTimeout(magicTimeoutRef.current);
      }
    };
  }, []);

  const getDashboardPath = () => {
    switch (userRole) {
      case 'admin': return '/admin';
      case 'store': return '/dashboard/tienda';
      case 'player': return '/dashboard/jugador';
      default: return '/dashboard/jugador';
    }
  }

  const baseLinkClass = "block py-2 px-3 rounded transition-colors duration-200 whitespace-nowrap cursor-pointer select-none text-sm font-medium";
  const activeClass = "text-white bg-sky-600 shadow-md shadow-sky-900/20";
  const inactiveClass = "text-slate-300 hover:bg-slate-700 hover:text-white";

  return (
    <header className="bg-slate-800 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 mr-4">
            <Link to="/" className="block">
              <img
                src="/logotheplayer.png"
                alt="ThePlayer.gg"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation */}
          {/* md:overflow-visible allows dropdowns to display over the content on desktop */}
          <div className="flex-grow overflow-x-auto md:overflow-visible no-scrollbar mx-2">
            <div className="flex items-center gap-1 sm:gap-2 px-2 w-fit mx-auto">
              {NavLinks.map((link) => (
                <MenuItem key={link.name} item={link} isLiveSignal={isLiveSignal} />
              ))}
            </div>
          </div>

          {/* Right Side: Game Selector + Auth/Profile */}
          <div className="flex items-center gap-3">
            {/* Game Selector */}
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-colors bg-slate-800/95 px-3 py-2 rounded-full border border-slate-700 hover:border-sky-500/50 hover:bg-slate-700/80 hover:shadow-lg hover:shadow-sky-900/20 backdrop-blur-sm">
                <span className="text-[10px] text-slate-500">Mundo:</span>
                <span className="text-sky-400">{GAME_LABELS[currentGame]}</span>
                <svg className="w-3 h-3 ml-1 opacity-50 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2">Selecciona Universo</div>
                  {(Object.keys(GAME_LABELS) as GameType[]).map((game) => {
                    const isMagic = game === 'mtg';

                    return (
                      <div
                        key={game}
                        className="relative"
                        onMouseEnter={() => {
                          if (isMagic) {
                            // Clear any pending timeout
                            if (magicTimeoutRef.current) {
                              clearTimeout(magicTimeoutRef.current);
                            }
                            setIsMagicHovered(true);
                          }
                        }}
                        onMouseLeave={() => {
                          if (isMagic) {
                            // Clear any existing timeout
                            if (magicTimeoutRef.current) {
                              clearTimeout(magicTimeoutRef.current);
                            }
                            // Add delay before hiding to allow mouse to move to submenu
                            magicTimeoutRef.current = setTimeout(() => setIsMagicHovered(false), 150);
                          }
                        }}
                      >
                        <button
                          onClick={() => setGame(game)}
                          className={`flex items-center justify-between w-full text-left px-3 py-2 text-sm rounded-lg transition-colors mb-0.5 ${currentGame === game ? 'bg-sky-600/20 text-sky-300 border border-sky-600/30' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}
                        >
                          <span className="flex items-center">
                            {currentGame === game && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mr-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>}
                            <span className={currentGame === game ? 'font-semibold' : ''}>{GAME_LABELS[game]}</span>
                          </span>
                          {isMagic && (
                            <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>

                        {/* Magic Submenu */}
                        {isMagic && isMagicHovered && (
                          <div
                            className="absolute top-0 right-full mr-2 w-44 bg-slate-800 rounded-xl shadow-2xl border border-purple-500/30 z-[100]"
                            onMouseEnter={() => {
                              // Clear any pending timeout when entering submenu
                              if (magicTimeoutRef.current) {
                                clearTimeout(magicTimeoutRef.current);
                              }
                              setIsMagicHovered(true);
                            }}
                            onMouseLeave={() => {
                              // Clear any existing timeout
                              if (magicTimeoutRef.current) {
                                clearTimeout(magicTimeoutRef.current);
                              }
                              magicTimeoutRef.current = setTimeout(() => setIsMagicHovered(false), 100);
                            }}
                          >
                            <div className="p-1">
                              <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                Formatos MTG
                              </div>
                              <Link to="/commander" className="block px-3 py-2 text-sm text-slate-300 hover:bg-purple-600/20 hover:text-purple-300 rounded-lg transition-colors">
                                🏰 Commander
                              </Link>
                              <Link to="/pauper" className="block px-3 py-2 text-sm text-slate-300 hover:bg-purple-600/20 hover:text-purple-300 rounded-lg transition-colors">
                                💎 Pauper
                              </Link>
                              <Link to="/premodern" className="block px-3 py-2 text-sm text-slate-300 hover:bg-purple-600/20 hover:text-purple-300 rounded-lg transition-colors">
                                📜 Premodern
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Contextual CTA Button */}
            {!isLoggedIn && (
              <Link
                to="/auth?mode=register"
                className="hidden md:block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 text-sm shadow-lg shadow-blue-500/30"
              >
                Registrarse
              </Link>
            )}
            {isLoggedIn && userRole === 'player' && (
              <Link
                to="/eventos"
                className="hidden md:block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Buscar Eventos
              </Link>
            )}
            {isLoggedIn && userRole === 'store' && (
              <Link
                to="/tienda/crear-torneo"
                className="hidden md:block px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Crear Torneo
              </Link>
            )}
            {isLoggedIn && (judgeRole === 'judge' || judgeRole === 'head_judge') && (
              <Link
                to="/jueces"
                className="hidden md:block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Panel de Juez
              </Link>
            )}
            {isLoggedIn && userRole === 'admin' && (
              <Link
                to="/admin"
                className="hidden md:block px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Panel Admin
              </Link>
            )}
            {isLoggedIn && <NotificationBell />}
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 bg-slate-700/50 p-1.5 pr-3 rounded-full hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-500"
                >
                  <UserCircleIcon className="w-8 h-8 text-sky-400" />
                  <span className="text-white font-semibold text-sm hidden sm:block">{userName}</span>
                  <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-slate-800 ring-1 ring-black ring-opacity-5 border border-slate-700/50 divide-y divide-slate-700/50 animate-in fade-in slide-in-from-top-2">
                    <div className="py-2">
                      <div className="px-4 py-2 sm:hidden border-b border-slate-700/50 mb-2">
                        <p className="text-xs text-slate-400">Logueado como</p>
                        <p className="text-white font-bold truncate">{userName}</p>
                      </div>
                      <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                        <ShieldCheckIcon className="w-5 h-5 text-sky-400" />
                        Mi Panel ({userRole === 'admin' ? 'Admin' : userRole === 'store' ? 'Tienda' : 'Jugador'})
                      </Link>
                      {userRole === 'admin' && (
                        <Link to="/dashboard/tienda" className="flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                          Panel Tienda (Test)
                        </Link>
                      )}
                      {judgeRole === 'head_judge' && (
                        <Link to="/dashboard/head-judge" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Dashboard de Jueces 👑
                        </Link>
                      )}
                      <Link to="/favorites" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>Mis Favoritos</span>
                      </Link>
                      <Link to="/notifications" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Notificaciones</span>
                      </Link>
                      {userRole === 'player' && (
                        <Link to="/stats" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Estadísticas</span>
                        </Link>
                      )}
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors" role="menuitem">
                        <CogIcon className="w-5 h-5 text-slate-400" />
                        <span>Configuración</span>
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
              <Link to="/login" className="bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-2 px-6 rounded-full hover:from-sky-500 hover:to-blue-500 transition-all shadow-lg shadow-sky-900/20 text-sm whitespace-nowrap">
                Acceder
              </Link>
            )}
          </div>
        </div>
      </div>
    </header >
  );
};

export default Header;