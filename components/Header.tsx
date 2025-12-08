import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import UserCircleIcon from './icons/UserCircleIcon';
import CogIcon from './icons/CogIcon';
import LogoutIcon from './icons/LogoutIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

const NavLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Ranking', path: '/ranking/pwp' },
  { name: 'Eventos', path: '/eventos' },
  { name: 'Torneos', path: '/torneos' },
  { name: 'Mercado', path: '/mercado' },
  { name: 'Media', path: '/media' },
  { name: 'Jueces', path: '/jueces' },
  { name: 'Tiendas', path: '/tiendas' },
];

interface HeaderProps {
  isLoggedIn: boolean;
  userRole: 'player' | 'store' | 'admin' | null;
  handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userRole, handleLogout }) => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-2 px-3 rounded transition-colors duration-200 ${isActive
      ? 'text-white bg-sky-600'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

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
      default: return '/dashboard/jugador'; // Fallback to player dashboard
    }
  }

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-3xl font-bold text-white tracking-tighter font-['Rajdhani']">ThePlayer.gg</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {NavLinks.map((link) => (
                <NavLink key={link.name} to={link.path} className={navLinkClass}>
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            {isLoggedIn ? (
              <div className="relative ml-4" ref={profileMenuRef}>
                <button onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center space-x-2 bg-slate-700 p-2 rounded-full hover:bg-slate-600 transition-colors">
                  <UserCircleIcon className="w-8 h-8 text-slate-300" />
                  <span className="text-white font-semibold">MageSlayer92</span>
                  <svg className={`w-4 h-4 text-slate-300 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 border border-slate-700">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <Link to={getDashboardPath()} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" role="menuitem">
                        <ShieldCheckIcon className="w-5 h-5" />
                        Mi Panel
                      </Link>
                      <Link to="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" role="menuitem">
                        <CogIcon className="w-5 h-5" />
                        Configuración
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" role="menuitem">
                        <LogoutIcon className="w-5 h-5" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition duration-300">
                Login
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NavLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                {link.name}
              </NavLink>
            ))}
            <div className="pt-4">
              {isLoggedIn ? (
                <div className="space-y-1">
                  <Link to={getDashboardPath()} onClick={() => setMobileMenuOpen(false)} className="w-full text-left block text-slate-300 hover:bg-slate-700 hover:text-white py-2 px-3 rounded-md">Mi Panel</Link>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="w-full text-left block text-slate-300 hover:bg-slate-700 hover:text-white py-2 px-3 rounded-md">Configuración</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left block text-slate-300 hover:bg-slate-700 hover:text-white py-2 px-3 rounded-md">Cerrar Sesión</button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center block bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition duration-300">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;