import React from 'react';
import { Link } from 'react-router-dom';

interface FloatingActionButtonProps {
    userRole: 'player' | 'store' | 'admin' | 'judge' | 'head_judge' | null;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ userRole }) => {
    // Only show for stores
    if (userRole !== 'store') return null;

    return (
        <Link
            to="/tienda/crear-torneo"
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 group"
            aria-label="Crear Torneo"
        >
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-60 group-hover:opacity-80 animate-pulse"></div>

                {/* Button */}
                <button className="relative px-4 py-4 md:px-6 md:py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-110 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden md:inline">Crear Torneo</span>
                </button>
            </div>
        </Link>
    );
};

export default FloatingActionButton;
