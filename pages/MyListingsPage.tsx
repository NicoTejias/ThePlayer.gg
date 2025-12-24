import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import CreateListingModal from '../components/CreateListingModal';

interface MyListing {
    id: string;
    title: string;
    listing_type: string;
    price: number;
    game: string;
    status: string;
    created_at: string;
    images: string[];
    message_count: number;
}

const getStatusStyles = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-900/40 text-green-300 ring-1 ring-green-500/50';
        case 'sold': return 'bg-blue-900/40 text-blue-300 ring-1 ring-blue-500/50';
        case 'cancelled': return 'bg-slate-700 text-slate-400 ring-1 ring-slate-600';
        default: return 'bg-slate-700 text-slate-300';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'active': return 'Activo';
        case 'sold': return 'Vendido';
        case 'cancelled': return 'Cancelado';
        default: return status;
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

const MyListingsPage: React.FC = () => {
    const [listings, setListings] = useState<MyListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');

    useEffect(() => {
        fetchMyListings();
    }, [filterStatus]);

    const fetchMyListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_my_listings', {
                p_status: filterStatus || null
            });

            if (error) throw error;
            setListings(data || []);
        } catch (error) {
            console.error('Error fetching my listings:', error);
            toast.error('Error al cargar tus anuncios');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkSold = async (listingId: string) => {
        try {
            const { error } = await supabase.rpc('mark_listing_sold', {
                p_listing_id: listingId
            });

            if (error) throw error;
            toast.success('Anuncio marcado como vendido');
            fetchMyListings();
        } catch (error: any) {
            console.error('Error marking as sold:', error);
            toast.error('Error: ' + error.message);
        }
    };

    const handleCancel = async (listingId: string) => {
        if (!confirm('¿Estás seguro de cancelar este anuncio?')) return;

        try {
            const { error } = await supabase.rpc('cancel_listing', {
                p_listing_id: listingId
            });

            if (error) throw error;
            toast.success('Anuncio cancelado');
            fetchMyListings();
        } catch (error: any) {
            console.error('Error cancelling listing:', error);
            toast.error('Error: ' + error.message);
        }
    };

    const handleDelete = async (listingId: string) => {
        if (!confirm('¿Estás seguro de eliminar este anuncio? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase
                .from('marketplace_listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;
            toast.success('Anuncio eliminado');
            fetchMyListings();
        } catch (error: any) {
            console.error('Error deleting listing:', error);
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Mis Anuncios</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        Gestiona tus publicaciones en el mercado
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg shadow-sky-900/20 text-sm"
                >
                    + Nuevo Anuncio
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-900/60 text-white rounded px-3 py-2 focus:outline-none border border-slate-700 text-sm"
                >
                    <option value="">Todos los Estados</option>
                    <option value="active">Activos</option>
                    <option value="sold">Vendidos</option>
                    <option value="cancelled">Cancelados</option>
                </select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando anuncios...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && listings.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-400 text-lg">No tienes anuncios</p>
                    <p className="text-slate-500 text-sm mt-2">Crea tu primer anuncio para empezar a vender</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-full transition-all"
                    >
                        + Crear Anuncio
                    </button>
                </div>
            )}

            {/* Listings Table */}
            {!loading && listings.length > 0 && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50 border-b border-slate-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Anuncio</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Precio</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mensajes</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {listings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {listing.images && listing.images.length > 0 ? (
                                                    <img
                                                        src={listing.images[0]}
                                                        alt={listing.title}
                                                        className="w-12 h-12 object-cover rounded border border-slate-600"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-slate-900 rounded border border-slate-600 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">{listing.title}</p>
                                                    <p className="text-slate-500 text-xs">{listing.game}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-300">{getTypeLabel(listing.listing_type)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {listing.price ? (
                                                <span className="text-green-400 font-bold">
                                                    {listing.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusStyles(listing.status)}`}>
                                                {getStatusLabel(listing.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-300">{listing.message_count || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400 text-sm">
                                                {new Date(listing.created_at).toLocaleDateString('es-CL')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {listing.status === 'active' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkSold(listing.id)}
                                                            className="px-3 py-1.5 bg-blue-900/50 hover:bg-blue-800 text-blue-300 rounded text-xs font-medium transition-colors"
                                                            title="Marcar como vendido"
                                                        >
                                                            Vendido
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(listing.id)}
                                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors"
                                                            title="Cancelar anuncio"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(listing.id)}
                                                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition-colors"
                                                    title="Eliminar anuncio"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <CreateListingModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    setShowCreateModal(false);
                    fetchMyListings();
                }}
            />
        </div>
    );
};

export default MyListingsPage;
