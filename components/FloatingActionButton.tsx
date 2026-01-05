import React, { useState } from 'react';
import UploadIcon from './icons/UploadIcon';
import ScheduleTournamentModal from './ScheduleTournamentModal';

interface FloatingActionButtonProps {
    userRole: 'player' | 'store' | 'admin' | null;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ userRole }) => {
    const [showFabMenu, setShowFabMenu] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    // Only show for stores
    if (userRole !== 'store') return null;

    const handleReportTournament = () => {
        setShowFabMenu(false);
        // Navigate to store dashboard
        window.location.href = '/#/tienda/dashboard';
        // Wait for navigation then scroll
        setTimeout(() => {
            const uploadSection = document.getElementById('upload-section');
            uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    };

    const handleCreateEvent = () => {
        setShowFabMenu(false);
        setShowScheduleModal(true);
    };

    return (
        <>
            {/* Floating Action Button (FAB) with Menu */}
            <div className="fixed bottom-6 right-6 z-50">
                {/* Menu Options */}
                {showFabMenu && (
                    <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-2">
                        {/* Reportar Torneo Option */}
                        <button
                            onClick={handleReportTournament}
                            className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                        >
                            <span className="font-medium text-sm whitespace-nowrap">Reportar Torneo</span>
                            <div className="p-2 bg-sky-500 rounded-full group-hover:bg-sky-600 transition-colors">
                                <UploadIcon className="w-4 h-4 text-white" />
                            </div>
                        </button>

                        {/* Crear Evento Option */}
                        <button
                            onClick={handleCreateEvent}
                            className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                        >
                            <span className="font-medium text-sm whitespace-nowrap">Crear Evento</span>
                            <div className="p-2 bg-purple-500 rounded-full group-hover:bg-purple-600 transition-colors">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}

                {/* Main FAB Button */}
                <button
                    onClick={() => setShowFabMenu(!showFabMenu)}
                    className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${showFabMenu
                            ? 'bg-slate-700 rotate-45'
                            : 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 hover:scale-110'
                        }`}
                    aria-label="Acciones rápidas"
                >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Schedule Tournament Modal */}
            <ScheduleTournamentModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSchedule={async (eventData) => {
                    console.log('Event scheduled:', eventData);
                    setShowScheduleModal(false);
                }}
            />
        </>
    );
};

export default FloatingActionButton;
