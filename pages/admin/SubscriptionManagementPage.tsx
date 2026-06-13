import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';

interface SubscriptionRequest {
    id: string;
    store_name: string;
    contact_name: string;
    email: string;
    phone: string;
    region: string;
    plan_type: 'basic' | 'premium';
    message: string;
    status: 'pending' | 'approved' | 'rejected' | 'contacted';
    created_at: string;
}

const SubscriptionManagementPage: React.FC = () => {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('subscription_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const updateRequestStatus = async (requestId: string, newStatus: 'approved' | 'rejected' | 'contacted') => {
        try {
            const { error } = await supabase
                .from('subscription_requests')
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;

            toast.success(`Solicitud ${newStatus === 'approved' ? 'aprobada' : newStatus === 'rejected' ? 'rechazada' : 'marcada como contactada'}`);
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
            toast.error('Error al actualizar solicitud');
        }
    };

    const planNames = {
        basic: 'Básico ($15.000)',
        premium: 'Pro/Premium ($35.000)'
    };

    const statusColors = {
        pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
        approved: 'bg-green-900/30 text-green-400 border-green-700',
        rejected: 'bg-red-900/30 text-red-400 border-red-700',
        contacted: 'bg-blue-900/30 text-blue-400 border-blue-700'
    };

    const statusLabels = {
        pending: 'Pendiente',
        approved: 'Aprobada',
        rejected: 'Rechazada',
        contacted: 'Contactada'
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Gestión de Suscripciones</h1>
                    <p className="text-slate-400">Administra las solicitudes de suscripción de tiendas</p>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${filter === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${filter === 'pending' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Pendientes
                    </button>
                    <button
                        onClick={() => setFilter('approved')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${filter === 'approved' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Aprobadas
                    </button>
                    <button
                        onClick={() => setFilter('rejected')}
                        className={`px-4 py-2 rounded-lg font-bold transition-colors ${filter === 'rejected' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        Rechazadas
                    </button>
                </div>

                {/* Requests List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">No hay solicitudes {filter !== 'all' ? statusLabels[filter].toLowerCase() : ''}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {requests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-sky-500/50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{request.store_name}</h3>
                                        <p className="text-slate-400">{request.contact_name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${statusColors[request.status]}`}>
                                            {statusLabels[request.status]}
                                        </span>
                                        <span className="px-3 py-1 bg-sky-900/30 text-sky-400 rounded-full text-sm font-bold border border-sky-700">
                                            {planNames[request.plan_type]}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-slate-500 text-sm mb-1">Email</p>
                                        <p className="text-white">{request.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm mb-1">Teléfono</p>
                                        <p className="text-white">{request.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm mb-1">Región</p>
                                        <p className="text-white">{request.region}</p>
                                    </div>
                                </div>

                                {request.message && (
                                    <div className="mb-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                        <p className="text-slate-500 text-sm mb-2">Mensaje</p>
                                        <p className="text-slate-300">{request.message}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                    <p className="text-slate-500 text-sm">
                                        Recibida: {new Date(request.created_at).toLocaleDateString('es-CL', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>

                                    {request.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateRequestStatus(request.id, 'contacted')}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                                            >
                                                Marcar Contactada
                                            </button>
                                            <button
                                                onClick={() => updateRequestStatus(request.id, 'approved')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriptionManagementPage;
