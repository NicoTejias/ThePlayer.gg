
import React from 'react';
import PartnersSection from './PartnersSection';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      {/* Partners Section */}
      <PartnersSection />

      {/* Navigation Links */}
      <div className="container mx-auto py-6 px-4 flex justify-center gap-8 text-sm font-medium text-slate-400">
        <a href="/#/quienes-somos" className="hover:text-sky-400 transition-colors">Quiénes Somos</a>
        <a href="/#/terminos" className="hover:text-sky-400 transition-colors">Términos y Condiciones</a>
        <a href="mailto:contacto@theplayer.gg" className="hover:text-sky-400 transition-colors">Contacto</a>
      </div>

      {/* Copyright */}
      <div className="container mx-auto py-4 px-4 text-center text-slate-400 border-t border-slate-700/50">
        <p>&copy; {new Date().getFullYear()} theplayer.gg - Corporación TCG Chile. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
