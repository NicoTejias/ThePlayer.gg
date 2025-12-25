import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

interface EventPreferencesModalProps {
    onClose: () => void;
    onSave: () => void;
}

const AVAILABLE_FORMATS = [
    'Standard',
    'Modern',
    'Commander',
    'Pioneer',
    'Legacy',
    'Vintage',
    'Pauper',
    'Limited',
    'Draft',
    'Sealed'
];

const AVAILABLE_REGIONS = [
    'Metropolitana',
    'Valparaíso',
    'Biobío',
    'Maule',
    'O\'Higgins',
    'Araucanía',
    'Los Lagos',
    'Coquimbo',
    'Antofagasta',
    'Atacama'
];

const EventPreferencesModal: React.FC<EventPreferencesModalProps> = ({ onClose, onSave }) => {
    const [preferredFormats, setPreferredFormats] = useState<string[]>([]);
    const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
    const [favoriteStores, setFavoriteStores] = useState<string[]>([]);
    const [notifyNewEvents, setNotifyNewEvents] = useState(true);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
        fetchStores();
    }, []);

    const fetchPreferences = async () => {
        try {
            const { data, error } = await supabase.rpc('get_user_event_preferences');
            if (error) throw error;

            if (data && data.length > 0) {
                const prefs = data[0];
                setPreferredFormats(prefs.preferred_formats || []);
                setPreferredRegions(prefs.preferred_regions || []);
                setFavoriteStores(prefs.favorite_stores || []);
                setNotifyNewEvents(prefs.notify_new_events ?? true);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStores = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, region')
                .eq('role', 'store')
                .order('username');

            if (error) throw error;
            setStores(data || []);
        } catch (error) {
            console.error('Error fetching stores:', error);
        }
    };

    const toggleFormat = (format: string) => {
        setPreferredFormats(prev =>
            prev.includes(format)
                ? prev.filter(f => f !== format)
                : [...prev, format]
        );
    };

    const toggleRegion = (region: string) => {
        setPreferredRegions(prev =>
            prev.includes(region)
                ? prev.filter(r => r !== region)
                : [...prev, region]
        );
    };

    const toggleStore = (storeId: string) => {
        setFavoriteStores(prev =>
            prev.includes(storeId)
                ? prev.filter(s => s !== storeId)
                : [...prev, storeId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.rpc('update_event_preferences', {
                p_preferred_formats: preferredFormats,
                p_preferred_regions: preferredRegions,
                p_favorite_stores: favoriteStores,
                p_notify_new_events: notifyNewEvents
            });

            if (error) throw error;

            toast.success('Preferencias guardadas exitosamente');
            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error saving preferences:', error);
            toast.error('Error al guardar preferencias');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
                    <div className="flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-lg p-6 max-w-3xl w-full my-8 border border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Preferencias de Eventos</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Formatos Preferidos */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Formatos Preferidos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {AVAILABLE_FORMATS.map(format => (
                                <button
                                    key={format}
                                    onClick={() => toggleFormat(format)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${preferredFormats.includes(format)
                                            ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Regiones Preferidas */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Regiones Preferidas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {AVAILABLE_REGIONS.map(region => (
                                <button
                                    key={region}
                                    onClick={() => toggleRegion(region)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${preferredRegions.includes(region)
                                            ? 'bg-green-600 text-white ring-2 ring-green-400'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {region}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tiendas Favoritas */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Tiendas Favoritas</h3>
                        <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-900 p-3 rounded-lg">
                            {stores.length === 0 ? (
                                <p className="text-slate-400 text-sm">No hay tiendas disponibles</p>
                            ) : (
                                stores.map(store => (
                                    <button
                                        key={store.id}
                                        onClick={() => toggleStore(store.id)}
                                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all text-left flex justify-between items-center ${favoriteStores.includes(store.id)
                                                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        <span>{store.username}</span>
                                        <span className="text-xs opacity-75">{store.region}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notificaciones */}
                    <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Notificar Nuevos Eventos</h3>
                            <p className="text-sm text-slate-400">Recibe notificaciones cuando se creen eventos que coincidan con tus preferencias</p>
                        </div>
                        <button
                            onClick={() => setNotifyNewEvents(!notifyNewEvents)}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${notifyNewEvents ? 'bg-sky-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${notifyNewEvents ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventPreferencesModal;
