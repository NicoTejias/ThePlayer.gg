import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Trophy, Users, Search, Filter } from 'lucide-react';

interface PublicLeague {
    id: string;
    name: string;
    format: string;
    store_id: string;
    created_at: string;
    store?: {
        username: string;
    };
}

const CommunityLeaguesPage = () => {
    const [leagues, setLeagues] = useState<PublicLeague[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterFormat, setFilterFormat] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPublicLeagues();
    }, []);

    const fetchPublicLeagues = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('store_leagues')
                .select('*, store:profiles!store_leagues_store_id_fkey(username, id)')
                .eq('is_private', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Manual check/fix if join fails (supa relationships can be tricky if not set up perfectly)
            // But let's assume it works based on previous patterns, or handle basic display.

            setLeagues(data || []);
        } catch (error) {
            console.error('Error fetching public leagues:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeagues = leagues.filter(league => {
        const matchesFormat = filterFormat === 'All' || league.format === filterFormat;
        const matchesSearch = league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (league.store?.username || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFormat && matchesSearch;
    });

    const formats = ['All', 'Pauper', 'Modern', 'Standard', 'Legacy', 'Commander', 'Premodern'];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                    Ligas de la Comunidad
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    Descubre ligas organizadas por tiendas locales, revisa sus rankings y participa en tus formatos favoritos.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por liga o tienda..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-500"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    {formats.map(format => (
                        <button
                            key={format}
                            onClick={() => setFilterFormat(format)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterFormat === format
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            {format === 'All' ? 'Todos' : format}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-slate-800/50 rounded-xl h-48 animate-pulse"></div>
                    ))}
                </div>
            ) : filteredLeagues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLeagues.map((league) => (
                        <Link
                            to={`/leagues/${league.id}`}
                            key={league.id}
                            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-sky-500/50 transition-all hover:-translate-y-1 group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-block px-2 py-0.5 bg-slate-700 rounded text-xs font-bold text-slate-300">
                                        {league.format}
                                    </span>
                                    {/* Placeholder for status or icon */}
                                    <Trophy className="w-5 h-5 text-slate-500 group-hover:text-yellow-500 transition-colors" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">
                                    {league.name}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                                    <Users className="w-4 h-4" />
                                    <span>Organizado por <span className="text-slate-200">{league.store?.username || 'Tienda'}</span></span>
                                </div>

                                <div className="flex items-center text-xs font-medium text-sky-500 group-hover:underline">
                                    Ver Ranking de la Liga →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                    <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron ligas</h3>
                    <p className="text-slate-400">Intenta ajustar los filtros de búsqueda.</p>
                </div>
            )}
        </div>
    );
};

export default CommunityLeaguesPage;
