import React from 'react';
import PartnersSection from './PartnersSection';
import { Facebook, Instagram, MessageCircle, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  // Estos links han sido configurados con los datos reales de ThePlayer.cl
  const socialLinks = {
    facebook: 'https://web.facebook.com/theplayercl',
    instagram: 'https://www.instagram.com/theplayer_cl/',
    whatsapp: 'https://wa.me/56992274852',
    email: 'contacto@theplayer.cl'
  };

  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      {/* Partners Section */}
      <PartnersSection />

      {/* Social Media & Navigation */}
      <div className="container mx-auto py-10 px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center border-b border-slate-700/50">

        {/* Social Icons */}
        <div className="flex justify-center md:justify-start gap-4">
          <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" title="Síguenos en Facebook" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all">
            <Facebook className="w-5 h-5" />
          </a>
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" title="Síguenos en Instagram" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500/50 transition-all">
            <Instagram className="w-5 h-5" />
          </a>
          <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" title="Contáctanos por WhatsApp" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-green-500 hover:border-green-500/50 transition-all">
            <MessageCircle className="w-5 h-5" />
          </a>
          <a href={`mailto:${socialLinks.email}`} title="Contáctanos por Email" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-400/50 transition-all">
            <Mail className="w-5 h-5" />
          </a>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-400">
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
