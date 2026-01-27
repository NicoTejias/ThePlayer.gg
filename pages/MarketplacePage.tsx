
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

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newFavs = new Set(favorites);
        if (newFavs.has(id)) newFavs.delete(id);
        else newFavs.add(id);
        setFavorites(newFavs);
    };

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

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 space-y-6 shrink-0">
                    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 sticky top-24 shadow-xl">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Filtros</h2>

                        <div className="space-y-6">
                            {/* Search */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Buscar</label>
                                <input
                                    type="search"
                                    placeholder="Carta o vendedor..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-sky-500 transition-all outline-none"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tipo</label>
                                <div className="space-y-2">
                                    {['sale', 'buy', 'trade'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(filterType === type ? '' : type)}
                                            className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === type ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40' : 'bg-slate-900/50 text-slate-400 hover:text-white border border-slate-700/50'}`}
                                        >
                                            {getTypeLabel(type)}
                                            {filterType === type && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conditions */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado</label>
                                <div className="flex flex-wrap gap-2">
                                    {['NM', 'LP', 'MP', 'HP', 'DMG'].map(cond => (
                                        <button
                                            key={cond}
                                            onClick={() => {
                                                const newConds = selectedConditions.includes(cond) ? selectedConditions.filter(c => c !== cond) : [...selectedConditions, cond];
                                                setSelectedConditions(newConds);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all border ${selectedConditions.includes(cond) ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Ordenar por</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    title="Selecciona el orden de los anuncios"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none appearance-none cursor-pointer"
                                >
                                    <option value="recent">Más Recientes</option>
                                    <option value="price_asc">Precio: Bajo a Alto</option>
                                    <option value="price_desc">Precio: Alto a Bajo</option>
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFilterType('');
                                    setSortBy('recent');
                                    setSelectedConditions([]);
                                }}
                                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Cargando Mercado...</span>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && listings.length === 0 && (
                        <div className="text-center py-24 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                            <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-xl font-bold text-slate-400 mb-2">No se encontraron anuncios</h3>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm">Prueba ajustando los filtros o busca algo diferente.</p>
                        </div>
                    )}

                    {!loading && listings.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            {listings.map((listing) => {
                                const images = listing.images?.slice(0, 1) || [];
                                const isFavorite = favorites.has(listing.id);

                                return (
                                    <Link to={`/mercado/${listing.id}`} key={listing.id} className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-sky-500/50 transition-all duration-500 hover:-translate-y-2 flex flex-col shadow-lg hover:shadow-sky-900/20">
                                        {/* Thumbnail Area */}
                                        <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                                            {images.length === 0 ? (
                                                <div className="w-full h-full flex items-center justify-center text-slate-800">
                                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                </div>
                                            ) : (
                                                <img
                                                    src={images[0]}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            )}

                                            {/* Overlays */}
                                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest backdrop-blur-md shadow-xl ${getTypeStyles(listing.listing_type)}`}>
                                                    {getTypeLabel(listing.listing_type)}
                                                </span>
                                                {listing.condition && (
                                                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-xl border border-white/10">
                                                        {listing.condition}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => toggleFavorite(listing.id, e)}
                                                title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                                                className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all duration-300 ${isFavorite ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110' : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`}
                                            >
                                                <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            </button>

                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                {listing.price && (
                                                    <div className="text-xl font-black text-white dropshadow-md">
                                                        {listing.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info Area */}
                                        <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-slate-800/50 to-slate-900/50 group-hover:from-slate-700/50 transition-colors">
                                            <h3 className="font-bold text-sm text-slate-100 leading-tight mb-4 line-clamp-2 h-10 group-hover:text-sky-400 transition-colors">
                                                {listing.title}
                                            </h3>

                                            <div className="mt-auto flex items-center justify-between border-t border-slate-700/50 pt-4">
                                                <div className="flex items-center gap-2 group/user overflow-hidden">
                                                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 flex-shrink-0 group-hover/user:bg-sky-500 group-hover/user:text-white transition-all">
                                                        <UserIcon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-400 truncate">{listing.seller_name}</span>
                                                </div>

                                                <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded-md">
                                                    <MapPinIcon className="w-3 h-3 text-sky-500" />
                                                    {listing.seller_region || 'Sgo'}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
