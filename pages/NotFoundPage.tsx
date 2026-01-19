import React from 'react';
import { Link } from 'react-router-dom';


import ReportErrorModal from '../components/ReportErrorModal';

const NotFoundPage: React.FC = () => {
    const [showReportModal, setShowReportModal] = React.useState(false);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <ReportErrorModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
            />

            {/* 404 Glitch Effect Container */}
            <div className="relative mb-8">
                <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-800 select-none blur-sm absolute top-0 left-0 w-full animate-pulse-glow">
                    404
                </h1>
                <h1 className="text-9xl font-black text-white relative z-10 animate-scale-in">
                    404
                </h1>
            </div>

            <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-4">
                Zona Fuera de Límites
            </h2>

            <p className="text-slate-400 max-w-md mb-10 text-lg leading-relaxed">
                Parece que has intentado jugar una carta que no está en tu mazo. Esta página no existe o ha sido removida del campo de batalla.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    to="/home"
                    className="px-8 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-900/40 hover:scale-105 uppercase tracking-wide"
                >
                    Volver al Inicio
                </Link>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600 uppercase tracking-wide"
                >
                    Reportar Error
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
