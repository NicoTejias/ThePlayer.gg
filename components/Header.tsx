
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NavLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Ranking', path: '/ranking/pwp' },
  { name: 'Eventos', path: '/eventos' },
  { name: 'Mercado', path: '/mercado' },
  { name: 'Media', path: '/media' },
  { name: 'Jueces', path: '/jueces' },
  { name: 'Tiendas', path: '/tiendas' },
];

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-2 px-3 rounded transition-colors duration-200 ${
      isActive
        ? 'text-white bg-sky-600'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <header className="bg-slate-800/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-white text-2xl font-bold font-rajdhani tracking-wider">
              theplayer<span className="text-sky-400">.gg</span>
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
            <button className="bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition duration-300">
              Login
            </button>
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
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

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NavLinks.map((link) => (
              <NavLink key={link.name} to={link.path} className={navLinkClass} onClick={() => setIsOpen(false)}>
                {link.name}
              </NavLink>
            ))}
            <div className="pt-4">
                <button className="w-full bg-sky-500 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition duration-300">
                    Login
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
