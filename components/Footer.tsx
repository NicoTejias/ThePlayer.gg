import React from 'react';
import PartnersSection from './PartnersSection';

const Footer: React.FC = () => {
  const socialLinks = {
    email: 'contacto@theplayer.cl'
  };

  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      {/* Partners Section */}
      <PartnersSection />

      {/* Navigation & Contact */}
      <div className="container mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-slate-700/50">

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-slate-400">
          <a href="/quienes-somos" className="hover:text-sky-400 transition-colors">Nosotros</a>
          <a href="/hall-of-fame" className="hover:text-sky-400 transition-colors">Hall of Fame</a>
          <a href="/soporte" className="hover:text-sky-400 transition-colors">Soporte</a>
          <a href="/terminos" className="hover:text-sky-400 transition-colors">Legales</a>
        </div>

        {/* Contact Info Quick */}
        <div className="text-center md:text-right">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Contacto Oficial</p>
          <a href={`mailto:${socialLinks.email}`} className="text-sm font-bold text-white hover:text-sky-400 transition-colors">
            {socialLinks.email}
          </a>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto py-6 px-4 text-center text-slate-400">
        <p className="text-xs uppercase tracking-widest font-medium opacity-60">
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">ThePlayer.cl</span> - Corporación TCG Chile. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
