import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import RatingModal from '../components/RatingModal';

interface ListingDetail {
    id: string;
    seller_id: string;
    seller_name: string;
    seller_region: string;
    seller_email: string;
    title: string;
    description: string;
    listing_type: 'sale' | 'buy' | 'trade';
    price: number;
    game: string;
    format: string;
    condition: string;
    quantity: number;
    status: string;
    created_at: string;
    updated_at: string;
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

const MarketplaceDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [listing, setListing] = useState<ListingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [canRate, setCanRate] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [sellerRating, setSellerRating] = useState<{ avg_rating: number | null, total_ratings: number } | null>(null);

    useEffect(() => {
        fetchListing();
        fetchCurrentUser();
        checkIfFavorite();
    }, [id]);

    // Check if can rate after listing is loaded
    useEffect(() => {
        if (listing) {
            checkIfCanRate();
        }
    }, [listing]);

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
    };

    const fetchListing = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_listing_details', {
                p_listing_id: id
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setListing(data[0]);
                // Fetch seller rating
                fetchSellerRating(data[0].seller_id);
            } else {
                setListing(null);
            }
        } catch (error) {
            console.error('Error fetching listing:', error);
            toast.error('Error al cargar el anuncio');
        } finally {
            setLoading(false);
        }
    };

    const checkIfFavorite = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase.rpc('is_favorite', {
                p_listing_id: id
            });
            if (error) throw error;
            setIsFavorite(data || false);
        } catch (error) {
            console.error('Error checking favorite:', error);
        }
    };

    const toggleFavorite = async () => {
        if (!id) return;
        setFavoriteLoading(true);
        try {
            const { data, error } = await supabase.rpc('toggle_favorite', {
                p_listing_id: id
            });
            if (error) throw error;
            setIsFavorite(data.is_favorite);
            toast.success(data.action === 'added' ? 'Agregado a favoritos ❤️' : 'Eliminado de favoritos');
        } catch (error: any) {
            console.error('Error toggling favorite:', error);
            toast.error('Error: ' + error.message);
        } finally {
            setFavoriteLoading(false);
        }
    };

    const fetchSellerRating = async (sellerId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('avg_rating, total_ratings')
                .eq('id', sellerId)
                .single();

            if (error) throw error;
            setSellerRating(data);
        } catch (error) {
            console.error('Error fetching seller rating:', error);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-slate-500'}`}
                        fill={star <= rating ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                    </svg>
                ))
                }
            </div >
        );
    };

    const checkIfCanRate = async () => {
        if (!id || !listing) return;
        try {
            const { data: canRateData } = await supabase.rpc('can_rate_listing', {
                p_listing_id: id
            });
            setCanRate(canRateData || false);

            const { data: ratingData } = await supabase.rpc('get_user_rating_for_listing', {
                p_listing_id: id
            });
            setHasRated(ratingData && ratingData.length > 0);
        } catch (error) {
            console.error('Error checking rating status:', error);
        }
    };

    const handleRatingSubmitted = () => {
        if (listing) {
            fetchSellerRating(listing.seller_id);
            checkIfCanRate();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 mt-4">Cargando anuncio...</p>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300">
                <h2 className="text-2xl font-bold mb-4">Publicación no encontrada</h2>
                <Link to="/mercado" className="text-sky-500 hover:underline">Volver al Mercado TCG</Link>
            </div>
        );
    }

    const isOwner = currentUser?.id === listing.seller_id;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb */}
            <div>
                <Link to="/mercado" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Mercado TCG
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-2xl">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <h1 className="text-3xl font-bold text-white uppercase tracking-tight">{listing.title}</h1>
                            <div className="flex items-center gap-3">
                                {!isOwner && (
                                    <button
                                        onClick={toggleFavorite}
                                        disabled={favoriteLoading}
                                        className={`p-2 rounded-full transition-all ${isFavorite
                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                                            } disabled:opacity-50`}
                                        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                )}
                                <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wider uppercase ${getTypeStyles(listing.listing_type)}`}>
                                    {getTypeLabel(listing.listing_type)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-slate-300 mb-6 text-sm">
                            <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                <UserIcon className="w-4 h-4 text-sky-400" />
                                <a
                                    href={`#/seller/${listing.seller_id}`}
                                    className="font-semibold text-white hover:text-sky-400 transition-colors"
                                >
                                    {listing.seller_name}
                                </a>
                                {sellerRating && sellerRating.avg_rating && (
                                    <div className="flex items-center gap-1 ml-2">
                                        {renderStars(Math.round(sellerRating.avg_rating))}
                                        <span className="text-yellow-400 text-xs font-bold ml-1">
                                            {sellerRating.avg_rating.toFixed(1)}
                                        </span>
                                        <span className="text-slate-500 text-xs">
                                            ({sellerRating.total_ratings})
                                        </span>
                                    </div>
                                )}
                            </div>
                            {listing.seller_region && (
                                <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                    <MapPinIcon className="w-4 h-4 text-orange-400" />
                                    <span>{listing.seller_region}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                <span className="text-slate-400">
                                    {new Date(listing.created_at).toLocaleDateString('es-CL')}
                                </span>
                            </div>
                        </div>

                        {/* Game & Format Info */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-full text-xs font-bold">
                                {listing.game}
                            </span>
                            {listing.format && (
                                <span className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-xs font-bold">
                                    {listing.format}
                                </span>
                            )}
                            {listing.condition && (
                                <span className="px-3 py-1 bg-yellow-900/40 text-yellow-300 rounded-full text-xs font-bold">
                                    {listing.condition}
                                </span>
                            )}
                            <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">
                                Cantidad: {listing.quantity}
                            </span>
                        </div>

                        {listing.description && (
                            <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700/50 mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción</h3>
                                <p className="text-slate-300">{listing.description}</p>
                            </div>
                        )}

                        {/* Images Gallery */}
                        {listing.images && listing.images.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                    Cartas ({listing.images.length})
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {listing.images.map((imageUrl, index) => (
                                        <div key={index} className="group relative">
                                            <img
                                                src={imageUrl}
                                                alt={`Card ${index + 1}`}
                                                className="w-full rounded border border-slate-600 group-hover:border-sky-500 transition-colors shadow-lg"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Action */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl sticky top-24">
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">
                            Detalles de la Transacción
                        </h3>

                        {listing.price && (
                            <div className="mb-6">
                                <span className="block text-slate-500 text-xs uppercase font-bold mb-1">Precio Total</span>
                                <div className="text-4xl font-bold text-white flex items-center gap-1">
                                    <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                                    {listing.price.toLocaleString('es-CL')}
                                </div>
                                <span className="text-slate-500 text-xs">CLP</span>
                            </div>
                        )}

                        {isOwner ? (
                            <div className="space-y-3">
                                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-center">
                                    <p className="text-blue-300 text-sm font-bold">Este es tu anuncio</p>
                                </div>
                                <Link
                                    to="/mis-anuncios"
                                    className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-md text-center transition-all"
                                >
                                    Gestionar Anuncio
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={() => toast.info('Sistema de mensajería próximamente')}
                                    className="block w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-md text-center transition-all shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    Contactar Vendedor
                                </button>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                            <p className="text-xs text-slate-500 mb-2">
                                ThePlayer.gg no es intermediario en pagos ni envíos.
                            </p>
                            <p className="text-xs text-slate-400">
                                Coordina directamente con el vendedor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceDetailPage;
