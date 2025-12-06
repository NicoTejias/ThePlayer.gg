
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 border-t border-slate-700">
      <div className="container mx-auto py-4 px-4 text-center text-slate-400">
        <p>&copy; {new Date().getFullYear()} theplayer.gg - Corporación TCG Chile. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
