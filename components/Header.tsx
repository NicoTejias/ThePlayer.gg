import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import UserCircleIcon from './icons/UserCircleIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

// Define the structure for navigation items
type NavLinkType = {
  name: string;
  path: string;
  subItems?: { name: string; path: string }[];
  isLive?: boolean; // Optional property to mark the live link
};

const NavLinks: NavLinkType[] = [
  { name: 'Inicio', path: '/' },
  { name: 'PLS', path: '/pls' },
  { name: 'Ranking', path: '/ranking/pwp' },
  { name: 'Eventos', path: '/eventos' },
  { name: 'Commander', path: '/commander' },
  { name: 'Mercado TCG', path: '/mercado' },
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
  { name: 'Tiendas', path: '/tiendas' },
  { name: 'Señal Online', path: '/envivo', isLive: true },
];

interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'player' | 'store' | 'admin' | null;
  userName?: string; // New prop
  handleLogout: () => void;
  isLiveSignal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userRole, userName = 'Jugador', handleLogout, isLiveSignal = false }) => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
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
    <header className="bg-slate-800/90 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-slate-700/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 mr-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tighter font-['Rajdhani'] uppercase bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
                ThePlayer.gg
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {/* md:overflow-visible allows dropdowns to display over the content on desktop */}
          <div className="flex-grow overflow-x-auto md:overflow-visible no-scrollbar mx-2">
            <div className="flex items-center gap-1 sm:gap-2 px-2 w-fit mx-auto">
              {NavLinks.map((link) => (
                <div key={link.name} className="relative group">
                  {link.subItems ? (
                    // Dropdown logic for Media
                    <>
                      <NavLink
                        to={link.path}
                        className={({ isActive }) =>
                          `${baseLinkClass} flex items-center gap-1 ${isActive ? activeClass : inactiveClass}`
                        }
                      >
                        {link.name}
                        <svg className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </NavLink>

                      {/* Invisible bridge to prevent mouse gap issues */}
                      <div className="absolute top-full left-0 w-full h-2 bg-transparent hidden group-hover:block" />

                      {/* Dropdown Menu */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50 pt-2">
                        <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700/50 overflow-hidden ring-1 ring-black ring-opacity-10 py-1">
                          {link.subItems.map((subItem) => (
                            <NavLink
                              key={subItem.name}
                              to={subItem.path}
                              end={subItem.path === link.path}
                              className={({ isActive }) =>
                                `block px-4 py-2.5 text-sm transition-colors hover:bg-slate-700/80 ${isActive ? 'text-sky-400 font-semibold bg-slate-700/30' : 'text-slate-300'
                                }`
                              }
                            >
                              {subItem.name}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    // Standard Link
                    <NavLink
                      to={link.path}
                      className={({ isActive }) =>
                        `${baseLinkClass} ${isActive ? activeClass : inactiveClass} ${link.isLive && isLiveSignal ? 'text-red-400 hover:text-red-300' : ''}`
                      }
                    >
                      <span className="flex items-center gap-2">
                        {link.name}
                        {link.isLive && isLiveSignal && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                          </span>
                        )}
                      </span>
                    </NavLink>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User / Login Section */}
          <div className="flex-shrink-0 ml-4">
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
                        Mi Panel
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
              <Link to="/login" className="bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold py-2 px-6 rounded-full hover:from-sky-500 hover:to-blue-500 transition-all shadow-lg shadow-sky-900/20 text-sm whitespace-nowrap">
                Acceder
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;