import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface SellerProfile {
    id: string;
    username: string;
    email: string;
    region: string;
    avg_rating: number | null;
    total_ratings: number;
}

interface Rating {
    rating_id: string;
    buyer_name: string;
    listing_title: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface Listing {
    id: string;
    title: string;
    price: number;
    condition: string;
    images: string[];
    status: string;
}

const SellerProfilePage: React.FC = () => {
    const { sellerId } = useParams<{ sellerId: string }>();
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sellerId) {
            fetchSellerData();
        }
    }, [sellerId]);

    const fetchSellerData = async () => {
        setLoading(true);
        try {
            // Fetch seller profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, email, region, avg_rating, total_ratings')
                .eq('id', sellerId)
                .single();

            if (profileError) throw profileError;
            setSeller(profileData);

            // Fetch ratings
            const { data: ratingsData, error: ratingsError } = await supabase.rpc('get_seller_ratings', {
                p_seller_id: sellerId,
                p_limit: 50
            });

            if (ratingsError) throw ratingsError;
            setRatings(ratingsData || []);

            // Fetch active listings
            const { data: listingsData, error: listingsError } = await supabase
                .from('marketplace_listings')
                .select('id, title, price, condition, images, status')
                .eq('seller_id', sellerId)
                .eq('status', 'active')
                .limit(6);

            if (listingsError) throw listingsError;
            setListings(listingsData || []);

        } catch (error: any) {
            console.error('Error fetching seller data:', error);
            toast.error('Error al cargar perfil del vendedor');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
        const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        className={sizeClass}
                        fill={star <= rating ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: star <= rating ? '#fbbf24' : '#64748b' }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                    </svg>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 mt-4">Cargando perfil...</p>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400 text-lg">Vendedor no encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Seller Header */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tighter uppercase mb-2">
                            {seller.username}
                        </h1>
                        <p className="text-slate-400 text-sm mb-4">
                            📍 {seller.region || 'Región no especificada'}
                        </p>

                        {/* Rating Summary */}
                        <div className="flex items-center gap-4">
                            {seller.avg_rating ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        {renderStars(Math.round(seller.avg_rating), 'lg')}
                                        <span className="text-2xl font-bold text-white">
                                            {seller.avg_rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <span className="text-slate-400 text-sm">
                                        ({seller.total_ratings} {seller.total_ratings === 1 ? 'calificación' : 'calificaciones'})
                                    </span>
                                </>
                            ) : (
                                <span className="text-slate-400">Sin calificaciones aún</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Listings */}
            {listings.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Publicaciones Activas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listings.map((listing) => (
                            <a
                                key={listing.id}
                                href={`#/marketplace/${listing.id}`}
                                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-sky-500 transition-all group"
                            >
                                <div className="aspect-video bg-slate-900">
                                    {listing.images && listing.images.length > 0 ? (
                                        <img
                                            src={listing.images[0]}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-white font-bold line-clamp-1 mb-2">{listing.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sky-400 font-bold text-lg">
                                            ${listing.price.toLocaleString('es-CL')}
                                        </span>
                                        <span className="text-slate-400 text-xs">{listing.condition}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Ratings */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                    Calificaciones ({ratings.length})
                </h2>

                {ratings.length > 0 ? (
                    <div className="space-y-4">
                        {ratings.map((rating) => (
                            <div
                                key={rating.rating_id}
                                className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-white font-medium">{rating.buyer_name}</p>
                                        {rating.listing_title && (
                                            <p className="text-slate-400 text-sm">
                                                Producto: {rating.listing_title}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {renderStars(rating.rating)}
                                        <span className="text-slate-500 text-xs">
                                            {new Date(rating.created_at).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>
                                </div>
                                {rating.comment && (
                                    <p className="text-slate-300 text-sm mt-2">{rating.comment}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-slate-400">Este vendedor aún no tiene calificaciones</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerProfilePage;
