import React from 'react';
import type { CommunityEvent } from '../types';
import Card from '../components/Card';
import CalendarIcon from '../components/icons/CalendarIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import TagIcon from '../components/icons/TagIcon';

interface EventsPageProps {
    events: CommunityEvent[];
}

const getTournamentTypeDetails = (event: CommunityEvent) => {
    const titleLower = event.title.toLowerCase();
    const formatLower = event.format.toLowerCase();

    if (titleLower.includes('rcq') || titleLower.includes('premier') || titleLower.includes('regional')) {
        return { type: 'Premier / RCQ', color: 'bg-red-600', multiplier: 'x4' };
    }
    if (titleLower.includes('prerelease') || titleLower.includes('sellado') || formatLower === 'sealed' || formatLower === 'draft') {
        return { type: 'Limited / Prerelease', color: 'bg-yellow-500 text-slate-900', multiplier: 'x3' };
    }
    if (titleLower.includes('showdown')) {
        return { type: 'Showdown', color: 'bg-slate-400 text-slate-900', multiplier: 'x2' };
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

const EventsPage: React.FC<EventsPageProps> = ({ events }) => {
    // State for expanded past tournament view
    const [expandedEventId, setExpandedEventId] = React.useState<string | null>(null);

    // Calendar Logic (Dynamic Current Month)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed

    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentDate);

    // Calculate start of calendar grid (Monday-based)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // 0=Mon, ... 6=Sun

    // Start date for the grid (previous month's padding if needed)
    const gridStartDate = new Date(currentYear, currentMonth, 1 - startDayIndex);

    const renderCalendarDay = (date: Date) => {
        const isCurrentMonth = date.getMonth() === currentMonth;
        const dayNum = date.getDate();

        // Find events for this day
        const dayEvents = events.filter(e => {
            const [y, m, d] = e.date.split('-').map(Number);
            return d === dayNum && (m - 1) === currentMonth && y === currentYear;
        });

        if (!isCurrentMonth) {
            return <div className="h-32 bg-slate-800/30 border border-slate-700/30 p-2 opacity-50 flex flex-col justify-between"><span className="text-slate-600 text-sm font-medium">{dayNum}</span></div>;
        }

        return (
            <div className="h-32 bg-slate-800 border border-slate-700 p-2 overflow-hidden transition-colors hover:bg-slate-700/50 relative group">
                <span className={`text-sm font-bold ${dayEvents.length > 0 ? 'text-white' : 'text-slate-500'}`}>{dayNum}</span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] scrollbar-thin scrollbar-thumb-slate-600">
                    {dayEvents.map(e => {
                        const { color } = getTournamentTypeDetails(e);
                        return (
                            <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${color} ${color.includes('text-slate-900') ? '' : 'text-white'} shadow-sm`}>
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

    const pastEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
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
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-sky-900/30 rounded-lg text-sky-400"><CalendarIcon className="w-5 h-5" /></div>
                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Eventos Activos</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{totalEvents}</div>
                        <div className="text-xs text-sky-400 mt-1 font-medium">+2 esta semana</div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-900/30 rounded-lg text-green-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                            </div>
                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Ocupación</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{occupancyRate}%</div>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400"><TagIcon className="w-5 h-5" /></div>
                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Formato Top</span>
                        </div>
                        <div className="text-xl font-bold text-white truncate" title={topFormat}>{topFormat}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">Más jugado</div>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-900/30 rounded-lg text-orange-400"><MapPinIcon className="w-5 h-5" /></div>
                            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Tienda Top</span>
                        </div>
                        <div className="text-xl font-bold text-white truncate" title={topStore}>{topStore}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">Más activa</div>
                    </div>
                </div>

                {/* Format Distribution Chart */}
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Distribución de Formatos</h3>
                    <div className="space-y-3">
                        {sortedFormats.slice(0, 4).map(([fmt, count]) => (
                            <div key={fmt}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300 font-medium">{fmt}</span>
                                    <span className="text-slate-500">{count}</span>
                                </div>
                                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-sky-500 h-full rounded-full"
                                        style={{ width: `${((count as number) / totalEvents) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="relative flex-grow">
                    <input
                        type="search"
                        placeholder="Buscar por nombre o tienda..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <input
                        type="date"
                        className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Todos los Formatos</option>
                        <option>Standard</option>
                        <option>Modern</option>
                        <option>Pioneer</option>
                        <option>Legacy</option>
                        <option>Pauper</option>
                        <option>Commander</option>
                        <option>Draft</option>
                        <option>Sealed</option>
                    </select>
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Todas las Regiones</option>
                        <option>Arica y Parinacota</option>
                        <option>Tarapacá</option>
                        <option>Antofagasta</option>
                        <option>Atacama</option>
                        <option>Coquimbo</option>
                        <option>Valparaíso</option>
                        <option>Metropolitana</option>
                        <option>O'Higgins</option>
                        <option>Maule</option>
                        <option>Ñuble</option>
                        <option>Biobío</option>
                        <option>La Araucanía</option>
                        <option>Los Ríos</option>
                        <option>Los Lagos</option>
                        <option>Aysén</option>
                        <option>Magallanes</option>
                    </select>
                </div>
            </div>

            {/* Upcoming Tournaments Table */}
            <div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide mb-6">Próximos Torneos</h2>
                <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider sticky left-0 bg-slate-800 z-20 border-r border-slate-700/50">Fecha</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Hora</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Evento</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Formato</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Lugar</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">Multi</th>
                                <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-300 uppercase tracking-wider">Inscritos</th>
                                <th scope="col" className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {events.map((event) => {
                                const details = getTournamentTypeDetails(event);
                                const mockTime = "19:00"; // Mock time
                                const mockLimit = 64; // Mock limit
                                const registered = event.playerCount || 0;
                                const isFull = registered >= mockLimit;

                                return (
                                    <tr key={event.id} className="group hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium sticky left-0 bg-slate-800 group-hover:bg-slate-700 transition-colors z-10 border-r border-slate-700/50">
                                            {event.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                            {mockTime}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold text-base">{event.title}</span>
                                                <span className={`text-[10px] inline-block px-1.5 py-0.5 rounded w-fit mt-1 font-bold ${details.color} ${details.color.includes('text-slate-900') ? '' : 'text-white'}`}>
                                                    {details.type}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-sky-400 font-medium">{event.format}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                            {event.storeName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${details.multiplier === 'x4' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' :
                                                details.multiplier === 'x3' ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-900/50' :
                                                    details.multiplier === 'x2' ? 'bg-slate-400 text-slate-900' :
                                                        'bg-orange-500 text-white'
                                                }`}>
                                                {details.multiplier}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-bold ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                                                    {registered}/{mockLimit}
                                                </span>
                                                <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                                                        style={{ width: `${Math.min((registered / mockLimit) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-sky-400 hover:text-sky-300 font-bold border border-sky-600/50 hover:border-sky-500 px-4 py-2 rounded-md hover:bg-sky-900/20 transition-all">
                                                Inscribirse
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Calendar Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wide capitalize">{monthName}</h2>
                    <div className="flex gap-2 text-sm">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span> x1</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400"></span> x2</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> x3</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600"></span> x4</span>
                    </div>
                </div>

                <div className="flex bg-slate-700 rounded-lg overflow-hidden shadow-2xl border border-slate-700">
                    {/* Week Numbers Sidebar */}
                    <div className="flex flex-col gap-px w-10 bg-slate-700 border-r border-slate-700 z-10">
                        {/* Header Spacer */}
                        <div className="bg-slate-800 p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider h-[33px] flex items-center justify-center">
                            #
                        </div>
                        {/* Week Rows */}
                        {weeks.map((w, i) => (
                            <div key={i} className="h-32 bg-slate-800/80 flex items-center justify-center text-xs text-slate-500 font-bold">
                                {w.weekNumber}
                            </div>
                        ))}
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-7 flex-1 gap-px bg-slate-700">
                        {/* Headers */}
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                            <div key={day} className="bg-slate-800 p-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}

                        {/* Days Grid */}
                        {weeks.flatMap(w => w.days).map((day, i) => (
                            <React.Fragment key={i}>
                                {renderCalendarDay(day)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Past Tournaments Table Section */}
            <div>
                <h2 className="text-2xl font-bold text-slate-500 uppercase tracking-wide mb-6">Torneos Finalizados</h2>
                <div className="overflow-x-auto bg-slate-900/50 rounded-lg border border-slate-800">
                    <table className="min-w-full divide-y divide-slate-800">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-900 z-20 border-r border-slate-800">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Evento</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Formato</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lugar</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {pastEvents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-600">No hay torneos pasados.</td></tr>
                            ) : (
                                pastEvents.map((event) => {
                                    const details = getTournamentTypeDetails(event);
                                    const isExpanded = expandedEventId === event.id;
                                    const showDecklists = details.type.includes('Premier') || details.type.includes('RCQ');

                                    return (
                                        <React.Fragment key={event.id}>
                                            <tr
                                                className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}
                                                onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                                            >
                                                <td className="px-6 py-4 text-sm text-slate-500 sticky left-0 bg-slate-900 group-hover:bg-slate-800 z-10 border-r border-slate-800 transition-colors">{event.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-400 font-bold">{event.title}</span>
                                                        <span className="text-[10px] text-slate-600 mt-0.5">{details.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{event.format}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">{event.storeName}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700">
                                                        Finalizado
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-sky-500 hover:text-sky-400 font-bold text-lg">
                                                        {isExpanded ? '−' : '+'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-900/40 border-b border-slate-800 animate-in fade-in slide-in-from-top-2">
                                                    <td colSpan={6} className="p-4 sm:p-6">
                                                        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-inner">
                                                            <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                                                                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                                                    Resultados y Posiciones
                                                                </h4>
                                                                <div className="flex items-center gap-4">
                                                                    {showDecklists && (
                                                                        <button className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded transition-colors font-medium shadow-sm">
                                                                            Ver Decklists
                                                                        </button>
                                                                    )}
                                                                    <span className="text-xs text-slate-500">Top 8 Mostrado</span>
                                                                </div>
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm text-left">
                                                                    <thead className="text-xs text-slate-400 uppercase bg-slate-700/30">
                                                                        <tr>
                                                                            <th className="px-4 py-3 font-medium">Posición</th>
                                                                            <th className="px-4 py-3 font-medium">Jugador</th>
                                                                            <th className="px-4 py-3 font-medium text-center">Puntos PWP</th>
                                                                            <th className="px-4 py-3 font-medium text-right">Record</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-700/30">
                                                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                                                                            <tr key={pos} className="hover:bg-slate-700/20 transition-colors">
                                                                                <td className="px-4 py-2.5">
                                                                                    <span className={`font-bold ${pos === 1 ? 'text-yellow-400' : pos <= 3 ? 'text-slate-200' : 'text-slate-500'}`}>
                                                                                        #{pos}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-2.5 text-slate-300 font-medium">Jugador Ejemplo {pos}</td>
                                                                                <td className="px-4 py-2.5 text-center text-sky-400 font-bold">+{Math.max(10 - pos, 1) * 3}</td>
                                                                                <td className="px-4 py-2.5 text-right text-slate-400 text-xs font-mono">{4 - Math.floor(pos / 3)}-{Math.floor(pos / 3)}-0</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            <div className="px-4 py-2 bg-slate-900/30 border-t border-slate-700 text-center">
                                                                <button className="text-xs text-sky-500 hover:text-sky-400 font-medium hover:underline">
                                                                    Ver tabla completa detallada →
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
