// Listing import removed
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
// MarketplacePage defined Listing locally, I should check types.ts.
// But to be safe I will define a local interface similar to MarketplacePage if I can't find it.
// I'll check types.ts first in my head, but I don't want to waste a tool call. 
// I'll define it locally to be safe and self-contained or import if I see it used widely.
// Looking at App.tsx imports: import type { TournamentResult... } from './types';
// I'll check types.ts quickly to see if I can reuse it.
// Actually, I'll just define it locally to match what I saw in MarketplacePage to avoid import errors if it's not exported.

interface MarketListing {
    id: string;
    seller_id: string;
    seller_name: string;
    title: string;
    description: string;
    listing_type: 'sale' | 'buy' | 'trade';
    price: number;
    game: string;
    created_at: string;
    is_sold?: boolean; // Maybe useful
}

const MarketplaceAdminPage: React.FC = () => {
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [gameFilter, setGameFilter] = useState('');

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        setLoading(true);
        try {
            // Using the RPC as it already joins with profiles and Formats data
            const { data, error } = await supabase.rpc('search_marketplace_listings', {
                p_query: searchQuery || null,
                p_type: null,
                p_game_type: gameFilter || null,
                p_sort: 'recent'
            });

            if (error) throw error;
            setListings(data || []);
        } catch (error: any) {
            console.error('Error fetching listings:', error);
            toast.error('Error al cargar publicaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Publicación eliminada correctamente');
            fetchListings();
        } catch (error: any) {
            console.error('Error deleting listing:', error);
            toast.error('Error al eliminar: ' + error.message);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchListings();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Gestión de Mercado</h1>
                <p className="text-slate-400 mt-2 text-sm">Administra las publicaciones del mercado</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input
                        type="search"
                        placeholder="Buscar por título, vendedor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500"
                    >
                        Buscar
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => { setSearchQuery(''); setTimeout(fetchListings, 0); }}
                            className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                        >
                            Limpiar
                        </button>
                    )}
                </form>
                <select
                    value={gameFilter}
                    onChange={(e) => { setGameFilter(e.target.value); setTimeout(() => fetchListings(), 0); }} // Quick hack to trigger refetch, normally useEffect dep, but I didn't put it in dep array to avoid double fetch on mount? Actually I did not put fetchListings in dep array of useEffect.
                    // Let's refine the strategy: I'll make useEffect depend on gameFilter but NOT searchQuery (to avoid fetch on every typing), search is manual.
                    className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white"
                >
                    <option value="">Todos los Juegos</option>
                    <option value="mtg">Magic</option>
                    <option value="pokemon">Pokémon</option>
                    <option value="onepiece">One Piece</option>
                    <option value="lorcana">Lorcana</option>
                    <option value="starwars">Star Wars</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-700/50 text-slate-300 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4">Título</th>
                                <th className="p-4">Vendedor</th>
                                <th className="p-4">Precio</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Juego</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        Cargando...
                                    </td>
                                </tr>
                            ) : listings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        No se encontraron publicaciones.
                                    </td>
                                </tr>
                            ) : (
                                listings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-slate-700/30 text-sm">
                                        <td className="p-4 font-medium text-white max-w-xs truncate" title={listing.title}>
                                            {listing.title}
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {new Date(listing.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-300">
                                            {listing.seller_name}
                                        </td>
                                        <td className="p-4 text-green-400 font-mono">
                                            {listing.price > 0
                                                ? listing.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
                                                : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                ${listing.listing_type === 'sale' ? 'bg-red-900/40 text-red-300' :
                                                    listing.listing_type === 'buy' ? 'bg-green-900/40 text-green-300' :
                                                        'bg-blue-900/40 text-blue-300'}`}>
                                                {listing.listing_type === 'sale' ? 'Venta' :
                                                    listing.listing_type === 'buy' ? 'Compra' : 'Cambio'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-400 capitalize">
                                            {listing.game}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(listing.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1.5 rounded transition-colors"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceAdminPage;
