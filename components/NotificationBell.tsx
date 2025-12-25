import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    read: boolean;
    created_at: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUnreadCount();
        fetchRecentNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
            if (showDropdown) {
                fetchRecentNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [showDropdown]);

    const fetchUnreadCount = async () => {
        try {
            const { data, error } = await supabase.rpc('get_unread_count');
            if (error) throw error;
            setUnreadCount(data || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchRecentNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_notifications', {
                p_limit: 5,
                p_unread_only: false
            });
            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await supabase.rpc('mark_notification_read', {
                p_notification_id: notificationId
            });
            fetchUnreadCount();
            fetchRecentNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            window.location.hash = notification.link;
        }
        setShowDropdown(false);
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

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Ahora';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return date.toLocaleDateString('es-CL');
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-2xl border border-slate-700 z-50 max-h-96 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="text-white font-bold">Notificaciones</h3>
                            <a
                                href="#/notifications"
                                className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                                onClick={() => setShowDropdown(false)}
                            >
                                Ver todas
                            </a>
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p className="text-slate-400 text-sm">No hay notificaciones</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors text-left ${!notification.read ? 'bg-slate-700/30' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <p className="text-white font-medium text-sm truncate">
                                                        {notification.title}
                                                    </p>
                                                    <span className="text-slate-500 text-xs whitespace-nowrap">
                                                        {getTimeAgo(notification.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-slate-400 text-xs line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                {!notification.read && (
                                                    <span className="inline-block mt-2 w-2 h-2 bg-sky-500 rounded-full"></span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
