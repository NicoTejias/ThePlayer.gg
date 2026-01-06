
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CreateListingModal from '../components/CreateListingModal';

interface Listing {
    id: string;
    seller_id: string;
    seller_name: string;
    seller_region: string;
    title: string;
    description: string;
    listing_type: 'sale' | 'buy' | 'trade';
    price: number;
    game: string;
    format: string;
    condition: string;
    quantity: number;
    created_at: string;
    images: string[];
}

const getTypeStyles = (type: string) => {
    switch (type) {
        case 'sale': return 'bg-red-900/40 text-red-300 ring-1 ring-red-500/50';
        case 'buy': return 'bg-green-900/40 text-green-300 ring-1 ring-green-500/50';
        case 'trade': return 'bg-blue-900/40 text-blue-300 ring-1 ring-blue-500/50';
        default: return 'bg-slate-700 text-slate-300';
    }
};

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'sale': return 'Venta';
        case 'buy': return 'Compra';
        case 'trade': return 'Cambio';
        default: return type;
    }
};

const MarketplacePage: React.FC = () => {
    const { currentGame } = useGame();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState('recent');

    useEffect(() => {
        fetchListings();
    }, [searchQuery, filterType, currentGame, sortBy]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('search_marketplace_listings', {
                p_query: searchQuery || null,
                p_type: filterType || null,
                p_game_type: currentGame, // USAR CONTEXT
                p_sort: sortBy
            });

            if (error) throw error;
            setListings(data || []);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        fetchListings();
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Mercado TCG</h1>
                <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm">
                    Compra, vende o cambia cartas. Transacciones directas entre jugadores.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg shadow-sky-900/20 text-sm"
                    >
                        + Nuevo Anuncio
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <input
                    type="search"
                    placeholder="Buscar cartas..."
                    aria-label="Buscar cartas"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900/60 text-white placeholder-slate-500 rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-sky-500 border border-slate-700 text-sm"
                />
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    title="Filtrar por tipo"
                    aria-label="Filtrar por tipo"
                    className="bg-slate-900/60 text-white rounded px-3 py-2 focus:outline-none border border-slate-700 text-sm"
                >
                    <option value="">Todos los Tipos</option>
                    <option value="sale">Venta</option>
                    <option value="buy">Compra</option>
                    <option value="trade">Cambio</option>
                </select>
                {/* Game Filter removed - controlled globally */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    title="Ordenar por"
                    aria-label="Ordenar por"
                    className="bg-slate-900/60 text-white rounded px-3 py-2 focus:outline-none border border-slate-700 text-sm"
                >
                    <option value="recent">Más Recientes</option>
                    <option value="price_asc">Precio: Menor a Mayor</option>
                    <option value="price_desc">Precio: Mayor a Menor</option>
                </select>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando anuncios...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && listings.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-lg">No se encontraron anuncios</p>
                    <p className="text-slate-500 text-sm mt-2">Intenta ajustar los filtros o crea el primer anuncio</p>
                </div>
            )}

            {/* Marketplace Grid */}
            {!loading && listings.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {listings.map((listing) => {
                        const images = listing.images?.slice(0, 4) || [];
                        const hasMore = (listing.images?.length || 0) > 4;

                        return (
                            <Link to={`/mercado/${listing.id}`} key={listing.id} className="group bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 hover:border-slate-500 transition-all hover:translate-y-[-2px] flex flex-col">
                                {/* Image Gallery Grid */}
                                <div className="aspect-[4/3] bg-slate-900 relative p-1 grid grid-cols-2 gap-0.5">
                                    {images.length === 0 ? (
                                        <div className="col-span-2 row-span-2 w-full h-full flex items-center justify-center text-slate-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    ) : images.length === 1 ? (
                                        <img src={images[0]} alt={listing.title} className="col-span-2 row-span-2 w-full h-full object-cover rounded-sm" />
                                    ) : (
                                        images.map((img, idx) => (
                                            <div key={idx} className="relative w-full h-full overflow-hidden rounded-sm">
                                                <img src={img} alt="card" className="w-full h-full object-cover" />
                                                {idx === 3 && hasMore && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                                                        +{listing.images!.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                    {/* Type Tag Overlay */}
                                    <div className="absolute top-2 right-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm ${getTypeStyles(listing.listing_type)}`}>
                                            {getTypeLabel(listing.listing_type)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 flex flex-col flex-grow">
                                    <h3 className="font-bold text-sm text-white leading-tight mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors">
                                        {listing.title}
                                    </h3>

                                    <div className="mt-auto space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                                <UserIcon className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{listing.seller_name}</span>
                                            </div>
                                            {listing.seller_region && (
                                                <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                                    <MapPinIcon className="w-3 h-3" />
                                                    <span>{listing.seller_region}</span>
                                                </div>
                                            )}
                                        </div>

                                        {listing.price && (
                                            <div className="font-bold text-green-400 text-sm">
                                                {listing.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Create Listing Modal */}
            <CreateListingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
};

export default MarketplacePage;
