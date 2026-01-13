
import React from 'react';
import PartnersSection from './PartnersSection';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      {/* Partners Section */}
      <PartnersSection />

      {/* Navigation Links */}
      <div className="container mx-auto py-6 px-4 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-400">
        <a href="/quienes-somos" className="hover:text-sky-400 transition-colors">Quiénes Somos</a>
        <a href="/hall-of-fame" className="hover:text-sky-400 transition-colors font-bold text-yellow-500/80">Salón de la Fama</a>
        <a href="/soporte" className="hover:text-sky-400 transition-colors font-bold text-sky-400">Soporte y Guías</a>
        <a href="/terminos" className="hover:text-sky-400 transition-colors">Términos y Condiciones</a>
        <a href="mailto:contacto@theplayer.gg" className="hover:text-sky-400 transition-colors">Contacto</a>
      </div>

      {/* Copyright */}
      <div className="container mx-auto py-4 px-4 text-center text-slate-400 border-t border-slate-700/50">
        <p>&copy; {new Date().getFullYear()} ThePlayer.cl - Corporación TCG Chile. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
