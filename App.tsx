
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Future routes will be added here */}
            <Route path="/ranking/pwp" element={<div className="text-center text-4xl mt-20">Página Ranking The Player (En Construcción)</div>} />
            <Route path="/ranking/maestros" element={<div className="text-center text-4xl mt-20">Página Ranking Maestros (En Construcción)</div>} />
            <Route path="/eventos" element={<div className="text-center text-4xl mt-20">Página de Eventos (En Construcción)</div>} />
            <Route path="/mercado" element={<div className="text-center text-4xl mt-20">Página de Mercado (En Construcción)</div>} />
            <Route path="/media" element={<div className="text-center text-4xl mt-20">Página de Media (En Construcción)</div>} />
            <Route path="/jueces" element={<div className="text-center text-4xl mt-20">Academia de Jueces (En Construcción)</div>} />
            <Route path="/tiendas" element={<div className="text-center text-4xl mt-20">Directorio de Tiendas (En Construcción)</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
