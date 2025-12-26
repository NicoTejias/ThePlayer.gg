import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import EventPreferencesModal from '../components/EventPreferencesModal';
import { useGame } from '../context/GameContext';
import { GAME_LABELS } from '../types';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    event_time: string;
    store_name: string;
    format: string;
    registration_count: number;
    max_players: number;
    is_user_registered: boolean;
    match_score?: number;
}

const CalendarPage: React.FC = () => {
    const { currentGame } = useGame();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [recommendedEvents, setRecommendedEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPreferences, setShowPreferences] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        fetchEventsForMonth();
        fetchRecommendedEvents();
    }, [currentDate, currentGame]);

    const fetchEventsForMonth = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_scheduled_events_with_registrations', {
                p_game_type: currentGame
            });

            if (error) throw error;

            // Filter events for current month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const filteredEvents = (data || []).filter((event: any) => {
                const eventDate = new Date(event.date);
                return eventDate.getFullYear() === year && eventDate.getMonth() === month;
            });

            setEvents(filteredEvents.map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                event_time: e.event_time,
                store_name: e.store_name,
                format: e.format,
                registration_count: e.registration_count,
                max_players: e.max_players,
                is_user_registered: e.is_user_registered
            })));
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Error al cargar eventos');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendedEvents = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setRecommendedEvents([]);
                return;
            }

            // Get all upcoming events for current game
            const { data, error } = await supabase.rpc('get_scheduled_events_with_registrations', {
                p_game_type: currentGame
            });

            if (error) throw error;

            // Filter to upcoming events only and limit to 10
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = (data || []).filter((event: any) => {
                const eventDate = new Date(event.date);
                return eventDate >= today;
            }).slice(0, 10);

            setRecommendedEvents(upcoming.map((e: any) => ({
                id: e.id,
                title: e.title,
                date: e.date,
                event_time: e.event_time,
                store_name: e.store_name,
                format: e.format,
                registration_count: e.registration_count,
                max_players: e.max_players,
                is_user_registered: e.is_user_registered
            })));
        } catch (error) {
            console.error('Error fetching recommended events:', error);
        }
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Días vacíos al inicio
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getEventsForDay = (date: Date | null) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(event => event.date === dateStr);
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handlePreferencesSaved = () => {
        fetchRecommendedEvents();
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const days = getDaysInMonth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Calendario de Eventos</h1>
                        <p className="text-slate-400">Encuentra torneos y eventos de {GAME_LABELS[currentGame]}</p>
                    </div>
                    <button
                        onClick={() => setShowPreferences(true)}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-bold transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Preferencias
                    </button>
                </div>

                {/* Recommended Events */}
                {recommendedEvents.length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-sky-900/30 to-purple-900/30 border border-sky-700/50 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span>⭐</span>
                            Eventos Recomendados para Ti
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedEvents.slice(0, 6).map(event => (
                                <div
                                    key={event.id}
                                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-sky-500 transition-colors cursor-pointer"
                                    onClick={() => setSelectedEvent(event)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white">{event.title}</h3>
                                        {event.match_score && event.match_score > 0 && (
                                            <span className="px-2 py-1 bg-yellow-600 text-xs rounded-full">
                                                {event.match_score} pts
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400 mb-2">{event.store_name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{event.format}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar Navigation */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={handlePreviousMonth}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            ← Anterior
                        </button>
                        <h2 className="text-2xl font-bold">
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <button
                            onClick={handleNextMonth}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            Siguiente →
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {/* Day Headers */}
                            {dayNames.map(day => (
                                <div key={day} className="text-center font-bold text-slate-400 py-2">
                                    {day}
                                </div>
                            ))}

                            {/* Calendar Days */}
                            {days.map((date, index) => {
                                const dayEvents = getEventsForDay(date);
                                const today = isToday(date);

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-24 p-2 rounded-lg border transition-colors ${date
                                            ? today
                                                ? 'bg-sky-900/30 border-sky-500'
                                                : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                                            : 'bg-transparent border-transparent'
                                            }`}
                                    >
                                        {date && (
                                            <>
                                                <div className={`text-sm font-bold mb-1 ${today ? 'text-sky-400' : 'text-slate-300'}`}>
                                                    {date.getDate()}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayEvents.map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            className="text-xs bg-sky-600/80 hover:bg-sky-500 px-2 py-1 rounded cursor-pointer truncate"
                                                            title={event.title}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold text-white">{selectedEvent.title}</h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-3 text-slate-300">
                            <div>
                                <span className="text-slate-500">Tienda:</span> {selectedEvent.store_name}
                            </div>
                            <div>
                                <span className="text-slate-500">Fecha:</span> {new Date(selectedEvent.date).toLocaleDateString()}
                            </div>
                            <div>
                                <span className="text-slate-500">Hora:</span> {selectedEvent.event_time}
                            </div>
                            <div>
                                <span className="text-slate-500">Formato:</span> {selectedEvent.format}
                            </div>
                            <div>
                                <span className="text-slate-500">Jugadores:</span> {selectedEvent.registration_count}/{selectedEvent.max_players}
                            </div>
                            {selectedEvent.is_user_registered && (
                                <div className="px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
                                    ✓ Estás inscrito en este evento
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Modal */}
            {showPreferences && (
                <EventPreferencesModal
                    onClose={() => setShowPreferences(false)}
                    onSave={handlePreferencesSaved}
                />
            )}
        </div>
    );
};

export default CalendarPage;
