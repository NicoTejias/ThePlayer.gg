import React from 'react';
import type { CommunityEvent, TournamentResult } from '../types';
import Card from '../components/Card';
import CalendarIcon from '../components/icons/CalendarIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import TagIcon from '../components/icons/TagIcon';
import { useNavigate } from 'react-router-dom';
import ScheduleTournamentModal from '../components/ScheduleTournamentModal';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { Edit, Trash2 } from 'lucide-react';
import ShareEventModal, { getEventImageUrl } from '../components/ShareEventModal';

interface EventsPageProps {
    events: CommunityEvent[];
    finishedTournaments?: TournamentResult[]; // Torneos subidos desde el panel de tienda
    userRole?: 'player' | 'store' | 'admin' | null;
    userId?: string; // ID del usuario actual
}

const EVENT_TYPES_CONFIG = [
    {
        keywords: ['rcq', 'premier', 'regional'],
        type: 'Premier / RCQ',
        color: 'bg-red-600',
        multiplier: 'x4'
    },
    {
        keywords: ['prerelease', 'sellado'],
        formats: ['sealed', 'draft'],
        type: 'Limited / Prerelease',
        color: 'bg-yellow-500 text-slate-900',
        multiplier: 'x3'
    },
    {
        keywords: ['showdown'],
        type: 'Showdown',
        color: 'bg-slate-400 text-slate-900',
        multiplier: 'x2'
    }
];

const getTournamentTypeDetails = (event: CommunityEvent) => {
    const titleLower = event.title.toLowerCase();
    const formatLower = event.format.toLowerCase();

    for (const config of EVENT_TYPES_CONFIG) {
        const matchesKeyword = config.keywords.some(kw => titleLower.includes(kw));
        const matchesFormat = config.formats?.some(fmt => formatLower === fmt);

        if (matchesKeyword || matchesFormat) {
            return { type: config.type, color: config.color, multiplier: config.multiplier };
        }
    }

    // Default to Semanal/FNM
    return { type: 'Semanal / FNM', color: 'bg-orange-500', multiplier: 'x1' };
};

const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};



const EventsPage: React.FC<EventsPageProps> = ({ events, finishedTournaments = [], userRole, userId }) => {
    const navigate = useNavigate();
    // State for expanded past tournament view
    const [expandedEventId, setExpandedEventId] = React.useState<string | null>(null);
    // State for schedule tournament modal
    const [showScheduleModal, setShowScheduleModal] = React.useState(false);
    // State for registration confirmation modal
    const [showRegisterModal, setShowRegisterModal] = React.useState(false);
    const [selectedEvent, setSelectedEvent] = React.useState<CommunityEvent | null>(null);
    // State for event details modal (from calendar)
    const [showEventDetailsModal, setShowEventDetailsModal] = React.useState(false);
    const [selectedCalendarEvent, setSelectedCalendarEvent] = React.useState<CommunityEvent | null>(null);
    // State for loading actions
    const [processingEventId, setProcessingEventId] = React.useState<string | null>(null);
    // State for editing and sharing events
    const [editingEvent, setEditingEvent] = React.useState<any>(null);
    const [shareModalEvent, setShareModalEvent] = React.useState<any>(null);

    // State for filtering
    const [selectedFormat, setSelectedFormat] = React.useState('Todos los Formatos');
    const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');

    const addToGoogleCalendar = (event: CommunityEvent) => {
        const title = encodeURIComponent(event.title);
        const details = encodeURIComponent(`Torneo de ${event.format} en ${event.storeName}. Organizado via ThePlayer.gg`);
        const location = encodeURIComponent(event.storeName);

        // Ensure date is properly formatted for Google Calendar (YYYYMMDDTHHMMSSZ)
        const dateParts = event.date.split('-');
        const year = dateParts[0];
        const month = dateParts[1];
        const day = dateParts[2];
        const time = (event.time || "19:00").replace(':', '');

        const startDate = `${year}${month}${day}T${time}00`;
        const endDate = `${year}${month}${day}T${(parseInt(time.substring(0, 2)) + 4).toString().padStart(2, '0')}${time.substring(2, 4)}00`; // Default 4h duration

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
        window.open(url, '_blank');
    };

    // Derived filtered events
    const filteredEvents = React.useMemo(() => {
        if (selectedFormat === 'Todos los Formatos') return events;

        if (selectedFormat === 'Competitivo') {
            const competitiveFormats = ['Standard', 'Pioneer', 'Modern', 'Sealed', 'Draft', 'Prerelease', 'Sellado', 'Limited'];
            return events.filter(e =>
                competitiveFormats.some(fmt =>
                    e.format.toLowerCase().includes(fmt.toLowerCase()) ||
                    e.title.toLowerCase().includes(fmt.toLowerCase())
                )
            );
        }

        return events.filter(e => e.format === selectedFormat);
    }, [events, selectedFormat]);

    // State for calendar navigation
    const today = new Date();
    const [calendarYear, setCalendarYear] = React.useState(today.getFullYear());
    const [calendarMonth, setCalendarMonth] = React.useState(today.getMonth());

    // Calendar Logic (Dynamic Month based on navigation)
    const calendarDate = new Date(calendarYear, calendarMonth, 1);
    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(calendarDate);

    // Navigation functions
    const goToPreviousMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(calendarYear - 1);
        } else {
            setCalendarMonth(calendarMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(calendarYear + 1);
        } else {
            setCalendarMonth(calendarMonth + 1);
        }
    };

    const goToToday = () => {
        setCalendarYear(today.getFullYear());
        setCalendarMonth(today.getMonth());
    };

    // Calculate start of calendar grid (Monday-based)
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon, ... 6=Sun



    // Start date for the grid (previous month's padding if needed)
    const gridStartDate = new Date(calendarYear, calendarMonth, 1 - startDayIndex);

    const renderCalendarDay = (date: Date) => {
        const isCurrentMonth = date.getMonth() === calendarMonth;
        const dayNum = date.getDate();

        // Find events for this day
        const dayEvents = filteredEvents.filter(e => {
            const [y, m, d] = e.date.split('-').map(Number);
            return d === dayNum && (m - 1) === calendarMonth && y === calendarYear;
        });

        if (!isCurrentMonth) {
            return <div className="h-32 bg-slate-800/30 border border-slate-700/30 p-2 opacity-50 flex flex-col justify-between"><span className="text-slate-600 text-sm font-medium">{dayNum}</span></div>;
        }

        const handleEventClick = (event: CommunityEvent) => {
            setSelectedCalendarEvent(event);
            setShowEventDetailsModal(true);
        };

        return (
            <div className="h-32 bg-slate-800 border border-slate-700 p-2 overflow-hidden transition-colors hover:bg-slate-700/50 relative group">
                <span className={`text-sm font-bold ${dayEvents.length > 0 ? 'text-white' : 'text-slate-500'}`}>{dayNum}</span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-thin scrollbar-thumb-slate-600">
                    {dayEvents.map(e => {
                        const { color } = getTournamentTypeDetails(e);
                        return (
                            <div
                                key={e.id}
                                onClick={() => handleEventClick(e)}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${color} ${color.includes('text-slate-900') ? '' : 'text-white'} shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                            >
                                {e.title}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Pre-calculate Weeks for Layout
    const weeks: { weekNumber: number; days: Date[] }[] = [];
    const currentGridDate = new Date(gridStartDate);

    // 6 weeks covers any month (max 42 days needed)
    for (let i = 0; i < 6; i++) {
        const weekDays: Date[] = [];
        const weekNum = getWeekNumber(currentGridDate);

        for (let j = 0; j < 7; j++) {
            weekDays.push(new Date(currentGridDate));
            currentGridDate.setDate(currentGridDate.getDate() + 1);
        }
        weeks.push({ weekNumber: weekNum, days: weekDays });
    }

    // Metrics Calculations
    const totalEvents = events.length;
    const totalRegistered = events.reduce((acc, e) => acc + (e.playerCount || 0), 0);
    const totalCapacity = events.length * 64;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;

    const formatCounts = events.reduce((acc, e) => {
        acc[e.format] = (acc[e.format] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const sortedFormats = Object.entries(formatCounts).sort((a, b) => (b[1] as number) - (a[1] as number));
    const topFormat = sortedFormats.length > 0 ? sortedFormats[0][0] : 'N/A';

    const storeCounts = events.reduce((acc, e) => {
        acc[e.storeName] = (acc[e.storeName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topStoreEntry = Object.entries(storeCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    const topStore = topStoreEntry ? topStoreEntry[0] : 'N/A';


    // State for upcoming events pagination
    const [upcomingPage, setUpcomingPage] = React.useState(0);
    const EVENTS_PER_PAGE = 5;

    // Filter upcoming events (incluye eventos de hoy que no han pasado)
    const now = new Date();
    console.log('Current time:', now);

    const allUpcomingEvents = filteredEvents
        .filter(e => {
            // Parsear fecha correctamente (evitar problemas de zona horaria)
            const [year, month, day] = e.date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day); // month es 0-indexed

            // Si el evento tiene hora, crear fecha+hora completa
            if (e.time) {
                const [hours, minutes] = e.time.split(':').map(Number);
                const eventDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

                const shouldInclude = eventDateTime >= now;
                console.log(`Event "${e.title}" (${e.date} ${e.time}):`, {
                    eventDateTime,
                    now,
                    shouldInclude
                });

                // Incluir si la fecha+hora es futura
                return shouldInclude;
            }

            // Si no tiene hora, incluir si es hoy o futuro
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);
            eventDate.setHours(0, 0, 0, 0);

            return eventDate >= todayStart;
        })
        .sort((a, b) => {
            // Ordenar por fecha y luego por hora
            const [yearA, monthA, dayA] = a.date.split('-').map(Number);
            const [yearB, monthB, dayB] = b.date.split('-').map(Number);
            const dateA = new Date(yearA, monthA - 1, dayA);
            const dateB = new Date(yearB, monthB - 1, dayB);

            const dateCompare = dateA.getTime() - dateB.getTime();
            if (dateCompare !== 0) return dateCompare;

            // Si tienen la misma fecha, ordenar por hora
            if (a.time && b.time) {
                return a.time.localeCompare(b.time);
            }
            return 0;
        });

    console.log('All upcoming events after filter:', allUpcomingEvents);

    // Paginate upcoming events
    const totalUpcomingPages = Math.ceil(allUpcomingEvents.length / EVENTS_PER_PAGE);
    const upcomingEvents = allUpcomingEvents.slice(
        upcomingPage * EVENTS_PER_PAGE,
        (upcomingPage + 1) * EVENTS_PER_PAGE
    );

    const goToPreviousEvents = () => {
        if (upcomingPage > 0) {
            setUpcomingPage(upcomingPage - 1);
        }
    };

    const goToNextEvents = () => {
        if (upcomingPage < totalUpcomingPages - 1) {
            setUpcomingPage(upcomingPage + 1);
        }
    };

    // Handler para agendar torneo
    const handleScheduleTournament = async (eventData: any) => {
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
                        entry_fee: eventData.entry_fee || null,
                        created_by: userId,
                        image_url: eventData.image_url || null
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
                    entry_fee: eventData.entry_fee || null,
                    created_by: userId,
                    image_url: eventData.image_url || null
                });
            }

            // Guardar en Supabase
            const { data, error } = await supabase
                .from('scheduled_events')
                .insert(eventsToCreate)
                .select();

            if (error) {
                console.error('Error al guardar eventos:', error);
                toast.error('Error al agendar torneo', {
                    description: error.message
                });
                return;
            }

            // Éxito
            toast.success('¡Torneo agendado!', {
                description: `Se ${eventsToCreate.length === 1 ? 'agendó 1 evento' : `agendaron ${eventsToCreate.length} eventos`} correctamente`
            });

            // Set share modal event
            if (data && data.length > 0) {
                const createdEvent = data[0];
                setShareModalEvent({
                    id: createdEvent.id,
                    title: createdEvent.title,
                    date: createdEvent.date,
                    time: createdEvent.time,
                    format: createdEvent.format,
                    storeName: createdEvent.store_name,
                    maxPlayers: createdEvent.max_players,
                    entry_fee: createdEvent.entry_fee,
                    description: createdEvent.description,
                    imageUrl: createdEvent.image_url,
                    game_type: createdEvent.game_type
                });
            } else {
                window.location.reload();
            }

        } catch (error: any) {
            console.error('Error al agendar torneo:', error);
            toast.error('Error inesperado', {
                description: error.message || 'No se pudo agendar el torneo'
            });
        }
    };

    // Handler para editar/actualizar torneo
    const handleUpdateTournament = async (eventId: string, eventData: any) => {
        try {
            const { error } = await supabase
                .from('scheduled_events')
                .update({
                    title: eventData.title,
                    date: eventData.date,
                    time: eventData.time,
                    format: eventData.format,
                    store_name: eventData.storeName,
                    max_players: eventData.maxPlayers,
                    description: eventData.description || null,
                    game_type: eventData.game_type || 'mtg',
                    entry_fee: eventData.entry_fee || null,
                    image_url: eventData.image_url || null
                })
                .eq('id', eventId);

            if (error) {
                console.error('Error al actualizar evento:', error);
                toast.error('Error al actualizar torneo', {
                    description: error.message
                });
                return;
            }

            toast.success('¡Torneo actualizado!');

            setShareModalEvent({
                id: eventId,
                title: eventData.title,
                date: eventData.date,
                time: eventData.time,
                format: eventData.format,
                storeName: eventData.storeName,
                maxPlayers: eventData.maxPlayers,
                entry_fee: eventData.entry_fee,
                description: eventData.description,
                imageUrl: eventData.image_url,
                game_type: eventData.game_type
            });

        } catch (error: any) {
            console.error('Error al actualizar torneo:', error);
            toast.error('Error inesperado', {
                description: error.message || 'No se pudo actualizar el torneo'
            });
        }
    };

    // Handler para eliminar evento
    const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar el evento "${eventTitle}"?`)) {
            return;
        }

        setProcessingEventId(eventId);

        try {
            // 1. Eliminar primero las inscripciones para evitar errores de llave foránea
            await supabase
                .from('event_registrations')
                .delete()
                .eq('event_id', eventId);

            // 2. Eliminar el evento
            const { error } = await supabase
                .from('scheduled_events')
                .delete()
                .eq('id', eventId);

            if (error) {
                console.error('Error al eliminar evento:', error);
                toast.error('Error al eliminar evento', {
                    description: error.message
                });
                return;
            }

            toast.success('Evento eliminado', {
                description: `El evento "${eventTitle}" fue eliminado correctamente`
            });

            // Recargar la página
            window.location.reload();

        } catch (error: any) {
            console.error('Error al eliminar evento:', error);
            toast.error('Error inesperado', {
                description: error.message || 'No se pudo eliminar el evento'
            });
        } finally {
            setProcessingEventId(null);
        }
    };

    // Handler para abrir modal de inscripción
    const handleRegisterClick = (event: CommunityEvent) => {
        if (!userId) {
            toast.error('Debes iniciar sesión', {
                description: 'Inicia sesión para inscribirte a eventos'
            });
            return;
        }
        setSelectedEvent(event);
        setShowRegisterModal(true);
    };

    // Handler para confirmar inscripción
    const handleConfirmRegistration = async () => {
        if (!selectedEvent) return;

        setProcessingEventId(selectedEvent.id);

        try {
            const { data, error } = await supabase
                .rpc('register_to_event', { p_event_id: selectedEvent.id });

            if (error) {
                console.error('Error al inscribirse:', error);

                // Mensaje amigable si la función no existe
                const errorMsg = error.message?.includes('function')
                    ? 'Error técnico: Falta configurar la base de datos (RPC).'
                    : error.message;

                toast.error('Error al inscribirse', {
                    description: errorMsg
                });
                setProcessingEventId(null);
                return;
            }

            toast.success('¡Inscripción exitosa!', {
                description: `Te has inscrito a "${selectedEvent.title}"`
            });

            setShowRegisterModal(false);
            setSelectedEvent(null);

            // Recargar para actualizar el contador
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error: any) {
            console.error('Error al inscribirse:', error);
            toast.error('Error inesperado', {
                description: error.message || 'No se pudo completar la inscripción. Verifica tu conexión.'
            });
            setProcessingEventId(null);
        }
    };

    // Handler para cancelar inscripción
    const handleCancelRegistration = async (event: CommunityEvent) => {
        if (!confirm(`¿Estás seguro de que quieres cancelar tu inscripción a "${event.title}"?`)) {
            return;
        }

        setProcessingEventId(event.id);

        try {
            const { data, error } = await supabase
                .rpc('cancel_event_registration', { p_event_id: event.id });

            if (error) {
                console.error('Error al cancelar inscripción:', error);
                toast.error('Error al cancelar', {
                    description: error.message || 'Hubo un error en la base de datos.'
                });
                setProcessingEventId(null);
                return;
            }

            toast.success('Inscripción cancelada', {
                description: `Tu inscripción a "${event.title}" fue cancelada`
            });

            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error: any) {
            console.error('Error al cancelar inscripción:', error);
            toast.error('Error inesperado', {
                description: error.message || 'No se pudo cancelar la inscripción'
            });
            setProcessingEventId(null);
        } finally {
            // Un segundo seguro por si fallan los returns anteriores
            setProcessingEventId(null);
        }
    };

    const pastEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
            <SEO
                title="Calendario de Eventos TCG"
                description="Encuentra los próximos torneos de Magic, Pokémon y Yu-Gi-Oh! en Chile. Inscríbete y participa en eventos regionales y locales."
            />
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Calendario de Eventos</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Encuentra los próximos torneos de tiendas asociadas y eventos Premier. ¡Inscríbete y compite!
                </p>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* KPI Cards */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                                <CalendarIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-0.5">Total Eventos</span>
                                <div className="text-3xl font-black text-white">{totalEvents}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                            </div>
                            <div className="min-w-0">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-0.5">Ocupación</span>
                                <div className="text-3xl font-black text-white">{occupancyRate}%</div>
                            </div>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full mt-2 overflow-hidden border border-slate-700/30">
                            <div
                                className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${occupancyRate}%` }}
                                role="progressbar"
                                aria-valuenow={occupancyRate}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Tasa de ocupación"
                            ></div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                                <TagIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-0.5">Formato Top</span>
                                <div className="text-xl font-black text-white truncate" title={topFormat}>{topFormat}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400 group-hover:scale-110 transition-transform">
                                <MapPinIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest block mb-0.5">Tienda Top</span>
                                <div className="text-xl font-black text-white truncate" title={topStore}>{topStore}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Format Distribution Chart */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Distribución de Formatos</h3>
                    <div className="space-y-3">
                        {sortedFormats.slice(0, 4).map(([fmt, count]) => {
                            const fmtPercentage = Math.round(((count as number) / totalEvents) * 100);
                            return (
                                <div key={fmt}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 font-medium">{fmt}</span>
                                        <span className="text-slate-500">{count}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-sky-500 h-full rounded-full transition-all duration-500 progress-bar-fill"
                                            style={{ '--progress-width': `${fmtPercentage}%` } as any}
                                            role="progressbar"
                                            aria-valuenow={fmtPercentage}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`Distribución de ${fmt}`}
                                            title={`${fmt}: ${count} eventos (${fmtPercentage}%)`}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* View Switcher */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex w-full max-w-sm">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        Lista
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendario
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-8 animate-fade-in">
                    {/* Toolbar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="relative flex-grow">
                            <input
                                type="search"
                                placeholder="Buscar por nombre o tienda..."
                                aria-label="Buscar eventos por nombre o tienda"
                                className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                            />
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                aria-label="Filtrar por fecha"
                                className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                            />
                        </div>
                        <div className="relative">
                            <select
                                aria-label="Filtrar por formato"
                                value={selectedFormat}
                                onChange={(e) => {
                                    setSelectedFormat(e.target.value);
                                    setUpcomingPage(0); // Reset pagination on filter change
                                }}
                                className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                            >
                                <option>Todos los Formatos</option>
                                <option>Competitivo</option>
                                <option>Commander</option>
                                <option>Pauper</option>
                                <option>Premodern</option>
                                <option>Legacy</option>
                            </select>
                        </div>
                        <div className="relative">
                            <select
                                aria-label="Filtrar por región"
                                className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                            >
                                <option>Todas las Regiones</option>
                                <option>Metropolitana</option>
                                <option>Valparaíso</option>
                                <option>Biobío</option>
                                <option>La Araucanía</option>
                            </select>
                        </div>
                    </div>

                    {/* Upcoming Tournaments Grid */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">Próximos Torneos</h2>
                                {allUpcomingEvents.length > EVENTS_PER_PAGE && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={goToPreviousEvents}
                                            disabled={upcomingPage === 0}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Anterior"
                                            title="Página Anterior"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className="text-sm text-slate-400 font-medium">{upcomingPage + 1} / {totalUpcomingPages}</span>
                                        <button
                                            onClick={goToNextEvents}
                                            disabled={upcomingPage >= totalUpcomingPages - 1}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Siguiente"
                                            title="Siguiente Página"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {(userRole === 'store' || userRole === 'admin') && (
                                <button
                                    onClick={() => setShowScheduleModal(true)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Agendar Torneo
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {upcomingEvents.length === 0 ? (
                                <div className="col-span-full py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed text-center">
                                    <p className="text-slate-500 text-lg">No hay torneos próximos agendados.</p>
                                </div>
                            ) : (
                                upcomingEvents.map((event) => {
                                    const details = getTournamentTypeDetails(event);
                                    const isFull = (event.playerCount || 0) >= (event.maxPlayers || 64);
                                    return (
                                        <div key={event.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-sky-500/50 transition-all duration-300 group flex flex-col relative">
                                            {/* Header Image */}
                                            <div className="h-36 w-full relative overflow-hidden border-b border-slate-700/50 bg-slate-950">
                                                <img 
                                                    src={getEventImageUrl(event)} 
                                                    alt={event.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
                                                <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${details.multiplier === 'x4' ? 'bg-red-500 text-white' : details.multiplier === 'x3' ? 'bg-yellow-500 text-slate-950' : 'bg-sky-500 text-white'}`}>
                                                    Points {details.multiplier}
                                                </div>

                                                {/* Edit/Delete Admin/Owner controls */}
                                                {(userRole === 'admin' || (userRole === 'store' && event.createdBy === userId)) && (
                                                    <div className="absolute top-4 left-4 flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingEvent(event);
                                                            }}
                                                            title="Editar Evento"
                                                            className="p-2 bg-slate-900/80 hover:bg-sky-600 text-white hover:text-white rounded-lg backdrop-blur-sm transition-all"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteEvent(event.id, event.title);
                                                            }}
                                                            disabled={processingEventId === event.id}
                                                            title="Eliminar Evento"
                                                            className="p-2 bg-slate-900/80 hover:bg-red-600 text-white hover:text-white rounded-lg backdrop-blur-sm transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6 flex flex-col h-full space-y-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-sky-400">
                                                        <span>{event.format}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                        <span className="text-slate-500">{details.type}</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors truncate">{event.title}</h3>
                                                </div>
                                                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50 space-y-2">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2 text-slate-300 font-bold">
                                                            <CalendarIcon className="w-4 h-4 text-slate-500" />
                                                            {event.date}
                                                        </div>
                                                        <span className="text-slate-400">{event.time || "19:00"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                        <MapPinIcon className="w-4 h-4 text-slate-500" />
                                                        <span className="truncate">{event.storeName}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-4 mt-auto border-t border-slate-700/50 flex items-center justify-between">
                                                    <span className={`text-xs font-black uppercase ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                                                        {event.playerCount || 0}/{event.maxPlayers || 64} JUGADORES
                                                    </span>
                                                    <button
                                                        onClick={() => handleRegisterClick(event)}
                                                        disabled={isFull || event.isUserRegistered}
                                                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${event.isUserRegistered ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}
                                                    >
                                                        {event.isUserRegistered ? 'Inscrito' : isFull ? 'Completo' : 'Inscribirse'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in space-y-8">
                    <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wide capitalize">{monthName}</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={goToPreviousMonth} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600" aria-label="Mes anterior" title="Mes Anterior"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                <button onClick={goToToday} className="px-4 py-2 bg-sky-700 hover:bg-sky-600 text-white text-sm font-bold rounded-lg shadow-lg">Hoy</button>
                                <button onClick={goToNextMonth} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg border border-slate-600" aria-label="Mes siguiente" title="Mes Siguiente"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                        </div>
                        <div className="hidden md:flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> x1</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> x2</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> x3</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> x4</span>
                        </div>
                    </div>
                    <div className="flex bg-slate-700 rounded-2xl overflow-hidden shadow-2xl border border-slate-600">
                        <div className="hidden sm:flex flex-col gap-px w-12 bg-slate-700 border-r border-slate-600 z-10">
                            <div className="bg-slate-800 p-2 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest h-[41px] flex items-center justify-center">Sem</div>
                            {weeks.map((w, i) => (
                                <div key={i} className="h-32 bg-slate-900 flex items-center justify-center text-[10px] text-slate-600 font-black border-b border-slate-800/50">{w.weekNumber}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 flex-1 gap-px bg-slate-600 overflow-x-auto">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                                <div key={day} className="bg-slate-800 p-3 text-center text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-700">{day}</div>
                            ))}
                            {weeks.flatMap(w => w.days).map((day, i) => (
                                <React.Fragment key={i}>{renderCalendarDay(day)}</React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Finished Tournaments */}
            <div>
                <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-wide mb-6">Torneos Finalizados</h2>
                <div className="overflow-x-auto bg-slate-900/50 rounded-2xl border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-800">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Evento</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Formato</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Tienda</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Jugadores</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {finishedTournaments.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-medium">No hay registros de torneos finalizados.</td></tr>
                            ) : (
                                finishedTournaments.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 border-r border-slate-800">{new Date(t.date).toLocaleDateString('es-CL')}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-300">{t.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t.format}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{t.storeName}</td>
                                        <td className="px-6 py-4 text-center text-sm font-mono font-bold text-sky-400">{t.playerCount}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <ScheduleTournamentModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} onSchedule={handleScheduleTournament} />

            {showRegisterModal && selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4"><h2 className="text-xl font-bold text-white">Confirmar Inscripción</h2></div>
                        <div className="p-6">
                            <p className="text-slate-300 mb-4">Confirmas tu asistencia al torneo:</p>
                            <div className="bg-slate-900 rounded-xl p-4 mb-6 border border-slate-700">
                                <h3 className="font-bold text-white mb-2">{selectedEvent.title}</h3>
                                <div className="text-xs text-slate-400 space-y-1">
                                    <p>📅 {selectedEvent.date}</p>
                                    <p>🎮 {selectedEvent.format}</p>
                                    <p>🏪 {selectedEvent.storeName}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowRegisterModal(false)} className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-bold">Cancelar</button>
                                <button onClick={handleConfirmRegistration} className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold">Inscribirme</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEventDetailsModal && selectedCalendarEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white truncate mr-4">{selectedCalendarEvent.title}</h2>
                            <button onClick={() => setShowEventDetailsModal(false)} className="text-white hover:text-slate-200" aria-label="Cerrar detalles" title="Cerrar"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Visual Image Header */}
                            <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-700 relative">
                                <img 
                                    src={getEventImageUrl(selectedCalendarEvent)} 
                                    alt={selectedCalendarEvent.title} 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Fecha y Hora</p>
                                    <p className="text-sm font-bold text-white">{selectedCalendarEvent.date} {selectedCalendarEvent.time || "19:00"}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Formato</p>
                                    <p className="text-sm font-bold text-white">{selectedCalendarEvent.format}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 col-span-full">
                                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Tienda</p>
                                    <p className="text-sm font-bold text-white">{selectedCalendarEvent.storeName}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={() => addToGoogleCalendar(selectedCalendarEvent)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19,4H18V2H16V4H8V2H6V4H5C3.89,4 3,4.9 3,6V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V6A2,2 0 0,0 19,4M19,19H5V8H19V19M9,13H7V11H9V13M13,13H11V11H13V13M17,13H15V11H17V13M9,17H7V15H9V17M13,17H11V15H13V17M17,17H15V15H17V17Z" /></svg>
                                    Google Calendar
                                </button>
                                {selectedCalendarEvent.isUserRegistered ? (
                                    <button onClick={() => handleCancelRegistration(selectedCalendarEvent)} className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg">Cancelar</button>
                                ) : (
                                    <button onClick={() => handleRegisterClick(selectedCalendarEvent)} className="flex-1 px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg">Inscribirse</button>
                                )}
                            </div>

                            {/* Admin/Owner controls in calendar modal */}
                            {(userRole === 'admin' || (userRole === 'store' && selectedCalendarEvent.createdBy === userId)) && (
                                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                                    <button
                                        onClick={() => {
                                            setShowEventDetailsModal(false);
                                            setEditingEvent(selectedCalendarEvent);
                                        }}
                                        className="flex-1 py-3 px-4 bg-sky-600/10 border border-sky-500/20 hover:bg-sky-600 hover:text-white rounded-xl text-sky-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar Evento
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowEventDetailsModal(false);
                                            handleDeleteEvent(selectedCalendarEvent.id, selectedCalendarEvent.title);
                                        }}
                                        disabled={processingEventId === selectedCalendarEvent.id}
                                        className="flex-1 py-3 px-4 bg-red-600/10 border border-red-500/20 hover:bg-red-600 hover:text-white rounded-xl text-red-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar Evento
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Event Modal */}
            {editingEvent && (
                <ScheduleTournamentModal 
                    isOpen={!!editingEvent} 
                    onClose={() => setEditingEvent(null)} 
                    onSchedule={handleScheduleTournament} 
                    editingEvent={editingEvent}
                    onUpdate={handleUpdateTournament}
                />
            )}

            {/* Social Share Event Modal */}
            {shareModalEvent && (
                <ShareEventModal 
                    isOpen={!!shareModalEvent} 
                    onClose={() => {
                        setShareModalEvent(null);
                        window.location.reload();
                    }} 
                    event={shareModalEvent}
                    storeLogoUrl={userRole === 'store' ? undefined : undefined} // Handled dynamically if needed or resolved
                />
            )}
        </div>
    );
};

export default EventsPage;

