import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    metadata: any;
    created_at: string;
}

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: 100,
                p_unread_only: filter === 'unread'
            });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            toast.error('Error al cargar notificaciones');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await supabase.rpc('mark_notification_read', {
                p_notification_id: notificationId
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data, error } = await supabase.rpc('mark_all_notifications_read');
            if (error) throw error;
            toast.success(`${data} notificaciones marcadas como leídas`);
            fetchNotifications();
        } catch (error: any) {
            console.error('Error marking all as read:', error);
            toast.error('Error al marcar como leídas');
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            await supabase.rpc('delete_notification', {
                p_notification_id: notificationId
            });
            toast.success('Notificación eliminada');
            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Error al eliminar');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            window.location.hash = notification.link;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'tournament':
                return '🏆';
            case 'result':
                return '📊';
            case 'claim':
                return '✅';
            case 'marketplace':
                return '💰';
            case 'system':
                return '⚙️';
            default:
                return '📢';
        }
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            tournament: 'bg-purple-900/40 text-purple-300',
            result: 'bg-blue-900/40 text-blue-300',
            claim: 'bg-green-900/40 text-green-300',
            marketplace: 'bg-yellow-900/40 text-yellow-300',
            system: 'bg-slate-700 text-slate-300'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[type] || colors.system}`}>
                {type}
            </span>
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Notificaciones</h1>
                    <p className="text-slate-400 mt-2 text-sm">
                        {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors"
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                >
                    Todas ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'unread'
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                >
                    No leídas ({unreadCount})
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 mt-4">Cargando notificaciones...</p>
                </div>
            )}

            {/* Notifications List */}
            {!loading && notifications.length > 0 && (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`bg-slate-800 rounded-lg border border-slate-700 p-4 transition-all ${!notification.read ? 'border-l-4 border-l-sky-500' : ''
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <span className="text-3xl">{getTypeIcon(notification.type)}</span>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-lg">{notification.title}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{notification.message}</p>
                                        </div>
                                        {getTypeBadge(notification.type)}
                                    </div>

                                    <div className="flex items-center gap-4 mt-3">
                                        <span className="text-slate-500 text-xs">
                                            {new Date(notification.created_at).toLocaleString('es-CL')}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {notification.link && (
                                                <button
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                                                >
                                                    Ver detalles →
                                                </button>
                                            )}

                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-slate-400 hover:text-white text-xs font-medium"
                                                >
                                                    Marcar como leída
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteNotification(notification.id)}
                                                className="text-red-400 hover:text-red-300 text-xs font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && notifications.length === 0 && (
                <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-slate-400 text-lg">No hay notificaciones</p>
                    <p className="text-slate-500 text-sm mt-2">
                        {filter === 'unread' ? 'Todas tus notificaciones están leídas' : 'Las notificaciones aparecerán aquí'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
