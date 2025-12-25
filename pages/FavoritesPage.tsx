import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface Favorite {
    favorite_id: string;
    listing_id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    card_name: string;
    card_set: string;
    quantity: number;
    seller_id: string;
    seller_name: string;
    images: string[];
    status: string;
    created_at: string;
    favorited_at: string;
}

const FavoritesPage: React.FC = () => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_favorites', {
                p_limit: 100
            });

            if (error) throw error;
            setFavorites(data || []);
        } catch (error: any) {
            console.error('Error fetching favorites:', error);
            toast.error('Error al cargar favoritos');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (listingId: string) => {
        try {
            await supabase.rpc('toggle_favorite', {
                p_listing_id: listingId
            });
            toast.success('Eliminado de favoritos');
            fetchFavorites();
        } catch (error) {
            console.error('Error removing favorite:', error);
            toast.error('Error al eliminar');
        }
    };

    const getConditionBadge = (condition: string) => {
        const colors: Record<string, string> = {
            'Mint': 'bg-green-900/40 text-green-300',
            'Near Mint': 'bg-blue-900/40 text-blue-300',
            'Excellent': 'bg-sky-900/40 text-sky-300',
            'Good': 'bg-yellow-900/40 text-yellow-300',
            'Light Played': 'bg-orange-900/40 text-orange-300',
            'Played': 'bg-red-900/40 text-red-300',
            'Poor': 'bg-slate-700 text-slate-300'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[condition] || colors.Good}`}>
                {condition}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Mis Favoritos</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {favorites.length} {favorites.length === 1 ? 'favorito' : 'favoritos'}
                    </p>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando favoritos...</p>
                </div>
            )}

            {/* Favorites Grid */}
            {!loading && favorites.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((favorite) => (
                        <div
                            key={favorite.favorite_id}
                            className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-sky-500 transition-all group"
                        >
                            {/* Image */}
                            <div className="relative aspect-video bg-slate-900">
                                {favorite.images && favorite.images.length > 0 ? (
                                    <img
                                        src={favorite.images[0]}
                                        alt={favorite.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFavorite(favorite.listing_id)}
                                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    title="Eliminar de favoritos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-white font-bold text-lg line-clamp-1">{favorite.title}</h3>
                                    <span className="text-sky-400 font-bold text-xl whitespace-nowrap ml-2">
                                        ${favorite.price.toLocaleString('es-CL')}
                                    </span>
                                </div>

                                <p className="text-slate-400 text-sm line-clamp-2 mb-3">{favorite.description}</p>

                                <div className="flex items-center gap-2 mb-3">
                                    {getConditionBadge(favorite.condition)}
                                    <span className="text-slate-500 text-xs">
                                        Cantidad: {favorite.quantity}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                                    <div className="text-slate-400 text-xs">
                                        <p className="font-medium">Vendedor:</p>
                                        <p className="text-white">{favorite.seller_name}</p>
                                    </div>
                                    <a
                                        href={`#/marketplace/${favorite.listing_id}`}
                                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors text-sm"
                                    >
                                        Ver detalles
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && favorites.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-slate-400 text-lg">No tienes favoritos guardados</p>
                    <p className="text-slate-500 text-sm mt-2">Explora el marketplace y guarda tus cartas favoritas</p>
                    <a
                        href="#/marketplace"
                        className="inline-block mt-4 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors"
                    >
                        Ir al Marketplace
                    </a>
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
