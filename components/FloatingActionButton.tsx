import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import UploadIcon from './icons/UploadIcon';
import ScheduleTournamentModal from './ScheduleTournamentModal';

interface FloatingActionButtonProps {
    userRole: 'player' | 'store' | 'admin' | null;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ userRole }) => {
    const [activeMenu, setActiveMenu] = useState<'reports' | 'events' | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const navigate = useNavigate();

    // Only show for stores
    if (userRole !== 'store') return null;

    const handleReportTournament = () => {
        setActiveMenu(null);
        // Navigate to store dashboard
        navigate('/dashboard/tienda');

        // Dispatch event in case we are already there
        window.dispatchEvent(new CustomEvent('switchToTournaments'));

        // Wait for navigation then scroll
        setTimeout(() => {
            const uploadSection = document.getElementById('upload-section');
            uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    };

    const handleCreateEvent = () => {
        setActiveMenu(null);
        setShowScheduleModal(true);
    };

    const toggleMenu = (menu: 'reports' | 'events') => {
        if (activeMenu === menu) {
            setActiveMenu(null);
        } else {
            setActiveMenu(menu);
        }
    };

    return (
        <>
            {/* Dual FAB Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-4 items-end">

                {/* BUTTON 1: REPORTS (BOTTOM) */}
                <div className="relative flex items-center">
                    {/* Menu Reports */}
                    {activeMenu === 'reports' && (
                        <div className="absolute bottom-0 right-20 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                            <button
                                onClick={handleReportTournament}
                                className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap group"
                            >
                                <div className="p-2 bg-sky-500 rounded-lg text-white group-hover:bg-sky-600 transition-colors">
                                    <UploadIcon className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase">Reportar Torneo</p>
                                    <p className="text-[10px] text-slate-500">Sube resultados EventLink/Melee</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { navigate('/dashboard/tienda'); setActiveMenu(null); }}
                                className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap group"
                            >
                                <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase">Ver Historial</p>
                                    <p className="text-[10px] text-slate-500">Gestiona torneos pasados</p>
                                </div>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => toggleMenu('reports')}
                        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-2 ${activeMenu === 'reports'
                            ? 'bg-sky-500 border-white scale-125 z-10'
                            : activeMenu === 'events'
                                ? 'bg-slate-800 border-slate-700 scale-90 opacity-50'
                                : 'bg-gradient-to-br from-sky-500 to-blue-600 border-transparent hover:scale-110'
                            }`}
                        title="Gestión de Torneos"
                    >
                        <UploadIcon className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* BUTTON 2: EVENTS (TOP) */}
                <div className="relative flex items-center">
                    {/* Menu Events */}
                    {activeMenu === 'events' && (
                        <div className="absolute bottom-0 right-20 flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                            <button
                                onClick={handleCreateEvent}
                                className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap group"
                            >
                                <div className="p-2 bg-purple-500 rounded-lg text-white group-hover:bg-purple-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase">Agendar Torneo</p>
                                    <p className="text-[10px] text-slate-500">Crea un evento en el calendario</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { navigate('/calendario'); setActiveMenu(null); }}
                                className="flex items-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl hover:bg-slate-50 transition-all border border-slate-200 whitespace-nowrap group"
                            >
                                <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-xs uppercase">Ver Calendario</p>
                                    <p className="text-[10px] text-slate-500">Explora todos los eventos</p>
                                </div>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => toggleMenu('events')}
                        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-2 ${activeMenu === 'events'
                            ? 'bg-purple-500 border-white scale-125 z-10'
                            : activeMenu === 'reports'
                                ? 'bg-slate-800 border-slate-700 scale-90 opacity-50'
                                : 'bg-gradient-to-br from-purple-500 to-indigo-600 border-transparent hover:scale-110'
                            }`}
                        title="Gestión de Calendario"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>

            </div>

            {/* Schedule Tournament Modal */}
            <ScheduleTournamentModal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                onSchedule={async (eventData) => {
                    try {
                        const eventsToCreate: any[] = [];

                        if (eventData.recurring) {
                            // Generar eventos recurrentes
                            const startDate = new Date(eventData.date);
                            const endDate = eventData.recurrenceEnd ? new Date(eventData.recurrenceEnd) : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

                            let currentDate = new Date(startDate);

                            while (currentDate <= endDate) {
                                eventsToCreate.push({
                                    title: eventData.title,
                                    date: currentDate.toISOString().split('T')[0],
                                    time: eventData.time,
                                    format: eventData.format,
                                    store_name: eventData.storeName,
                                    max_players: eventData.maxPlayers,
                                    description: eventData.description || null,
                                    game_type: eventData.game_type || 'mtg',
                                    created_by: userRole === 'store' ? (await supabase.auth.getUser()).data.user?.id : null
                                });

                                // Calcular siguiente fecha según tipo de recurrencia
                                if (eventData.recurrenceType === 'weekly') {
                                    currentDate.setDate(currentDate.getDate() + 7);
                                } else if (eventData.recurrenceType === 'biweekly') {
                                    currentDate.setDate(currentDate.getDate() + 14);
                                } else if (eventData.recurrenceType === 'monthly') {
                                    currentDate.setMonth(currentDate.getMonth() + 1);
                                }
                            }
                        } else {
                            // Evento único
                            eventsToCreate.push({
                                title: eventData.title,
                                date: eventData.date,
                                time: eventData.time,
                                format: eventData.format,
                                store_name: eventData.storeName,
                                max_players: eventData.maxPlayers,
                                description: eventData.description || null,
                                game_type: eventData.game_type || 'mtg',
                                created_by: userRole === 'store' ? (await supabase.auth.getUser()).data.user?.id : null
                            });
                        }

                        // Guardar en Supabase
                        const { error } = await supabase
                            .from('scheduled_events')
                            .insert(eventsToCreate);

                        if (error) {
                            console.error('Error al guardar eventos:', error);
                            alert('Error al agendar torneo: ' + error.message);
                            return;
                        }

                        // Éxito
                        alert(`¡Torneo agendado! Se ${eventsToCreate.length === 1 ? 'agendó 1 evento' : `agendaron ${eventsToCreate.length} eventos`} correctamente.`);

                        setShowScheduleModal(false);
                        window.location.reload();

                    } catch (error: any) {
                        console.error('Error al agendar torneo:', error);
                        alert('Error inesperado: ' + (error.message || 'No se pudo agendar el torneo'));
                    }
                }}
            />
        </>
    );
};

export default FloatingActionButton;
