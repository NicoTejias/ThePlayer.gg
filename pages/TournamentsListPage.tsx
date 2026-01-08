
import React from 'react';
import { Link } from 'react-router-dom';
import type { TournamentResult } from '../types';
import ListBulletIcon from '../components/icons/ListBulletIcon';

interface TournamentsListPageProps {
    tournaments: TournamentResult[];
}

const TournamentsListPage: React.FC<TournamentsListPageProps> = ({ tournaments }) => {
    // State for filters
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterDate, setFilterDate] = React.useState('');
    const [filterStore, setFilterStore] = React.useState('Todas las Tiendas');
    const [filterType, setFilterType] = React.useState('Todos los Tipos'); // "Types" here are actually Formats (Standard, Modern, etc.) as per user request

    // Distinct lists for filters
    const uniqueStores = React.useMemo(() => {
        const stores = tournaments.map(t => t.storeName).filter(Boolean);
        return Array.from(new Set(stores)).sort();
    }, [tournaments]);

    const uniqueFormats = React.useMemo(() => {
        const formats = tournaments.map(t => t.format).filter(Boolean);
        return Array.from(new Set(formats)).sort();
    }, [tournaments]);

    // Helper to get tournament tier/type details (Semanal, RCQ, etc.)
    const getTournamentTier = (t: TournamentResult) => {
        const titleLower = t.name.toLowerCase();
        const formatLower = (t.format || '').toLowerCase();

        if (titleLower.includes('rcq') || titleLower.includes('premier') || titleLower.includes('regional')) {
            return { type: 'Premier / RCQ', color: 'bg-red-600', textColor: 'text-red-100' };
        }
        if (titleLower.includes('prerelease') || titleLower.includes('sellado') || formatLower === 'sealed' || formatLower === 'draft') {
            return { type: 'Limited / Prerelease', color: 'bg-yellow-500', textColor: 'text-slate-900' };
        }
        if (titleLower.includes('showdown')) {
            return { type: 'Showdown', color: 'bg-slate-400', textColor: 'text-slate-900' };
        }
        // Default
        return { type: 'Semanal / FNM', color: 'bg-orange-500', textColor: 'text-white' };
    };

    // Filter logic
    const filteredTournaments = tournaments.filter(t => {
        // Text Search (Name or Store)
        const matchesSearch = searchTerm === '' ||
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.storeName.toLowerCase().includes(searchTerm.toLowerCase());

        // Date Filter
        const matchesDate = filterDate === '' || t.date === filterDate;

        // Store Filter
        const matchesStore = filterStore === 'Todas las Tiendas' || t.storeName === filterStore;

        // Type Filter (actually filtering by Format based on user instructions: "los tipos de torneo son del filtro Torneo... tipos son los formatos de magic")
        // The column header is "Torneo", so this filter corresponds to that column.
        const matchesType = filterType === 'Todos los Tipos' || t.format === filterType;

        return matchesSearch && matchesDate && matchesStore && matchesType;
    });

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Repositorio de Torneos</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Explora el historial de todos los torneos reportados. Consulta los resultados y standings de cada evento.
                </p>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="relative flex-grow md:col-span-2">
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Buscar torneos"
                        placeholder="Buscar por nombre o tienda..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        aria-label="Filtrar por fecha"
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterStore}
                        onChange={(e) => setFilterStore(e.target.value)}
                        aria-label="Filtrar por tienda"
                        className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    >
                        <option>Todas las Tiendas</option>
                        {uniqueStores.map(store => (
                            <option key={store} value={store}>{store}</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        aria-label="Filtrar por tipo de torneo" // User refers to Format as "Torneo/Tipo"
                        className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    >
                        <option>Todos los Tipos</option>
                        {uniqueFormats.map(fmt => (
                            <option key={fmt} value={fmt}>{fmt}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tournaments Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Evento</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tienda</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Torneo</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Jugadores</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filteredTournaments.length > 0 ? (
                            filteredTournaments.map((t) => {
                                const tier = getTournamentTier(t);
                                return (
                                    <tr key={t.id} className="hover:bg-slate-700/40 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{t.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                            <div>{t.name}</div>
                                            <div className={`text-[10px] inline-block px-1.5 py-0.5 rounded mt-1 font-bold ${tier.color} ${tier.textColor}`}>
                                                {tier.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{t.storeName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-800 text-sky-200">{t.format}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{t.playerCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Link to={`/torneos/${t.id}`} className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                                                <ListBulletIcon className="w-4 h-4" />
                                                Ver Standings
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                    No se encontraron torneos con los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TournamentsListPage;
