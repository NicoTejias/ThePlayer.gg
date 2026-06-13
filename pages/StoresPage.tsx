import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import type { Store } from '../types';
import MapPinIcon from '../components/icons/MapPinIcon';
import GlobeAltIcon from '../components/icons/GlobeAltIcon';
import PricingCard from '../components/PricingCard';
import StoreSubscriptionModal from '../components/StoreSubscriptionModal';
import SubscriptionBadge from '../components/SubscriptionBadge';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { useTranslation } from '../context/LanguageContext';

const HeartIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const StoresPage: React.FC = () => {
    const { t } = useTranslation();
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [followedStores, setFollowedStores] = React.useState<string[]>([]);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [searchTerm, setSearchTerm] = useState('');
    const [regionFilter, setRegionFilter] = useState('Todas las Regiones');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
        const fetchStores = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('role', 'store')
                    .eq('status', 'Aprobada') // Solo tiendas aprobadas
                    .order('subscription_tier', { ascending: false });

                if (error) throw error;
                setStores(data || []);
            } catch (error) {
                console.error('Error fetching stores:', error);
                toast.error('Error al cargar las tiendas');
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, []);

    const toggleFollow = (storeId: string) => {
        setFollowedStores(prev =>
            prev.includes(storeId)
                ? prev.filter(id => id !== storeId)
                : [...prev, storeId]
        );
    };

    const handleSubscribe = (plan: 'basic' | 'premium') => {
        setSelectedPlan(plan);
        setShowSubscriptionModal(true);
    };

    const filteredStores = stores.filter(store => {
        const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (store.address || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRegion = regionFilter === 'Todas las Regiones' || regionFilter === 'All Regions' || store.region === regionFilter;
        return matchesSearch && matchesRegion;
    });

    // Dynamic Leaflet Map loading and initialization
    useEffect(() => {
        let isMounted = true;
        let leafletMap: any = null;

        const initMap = () => {
            const L = (window as any).L;
            if (!mapContainerRef.current || !L) return;

            // Remove existing map if any
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            // Center on Chile
            leafletMap = L.map(mapContainerRef.current, {
                scrollWheelZoom: false
            }).setView([-33.4489, -70.6693], 5);
            mapRef.current = leafletMap;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(leafletMap);

            // Coordinates for Chilean cities/regions
            const CITY_COORDS: Record<string, [number, number]> = {
                "Santiago": [-33.4489, -70.6693],
                "Valparaíso": [-33.0472, -71.6127],
                "Concepción": [-36.8201, -73.0444],
                "La Serena": [-29.9027, -71.2519],
                "Antofagasta": [-23.6509, -70.3975],
                "Temuco": [-38.7359, -72.5904],
                "Puerto Montt": [-41.4693, -72.9424],
                "Iquique": [-20.2133, -70.1436],
                "Rancagua": [-34.1708, -70.7444],
                "Talca": [-35.4264, -71.6554],
                "Arica": [-18.4781, -70.3125],
                "Chillán": [-36.6066, -72.1034],
                "Osorno": [-40.5739, -73.1253],
                "Valdivia": [-39.8142, -73.2459]
            };

            filteredStores.forEach(store => {
                const city = store.city || store.region || '';
                let coords = CITY_COORDS[city];
                
                if (!coords) {
                    // Try to match city from address
                    const matchedCity = Object.keys(CITY_COORDS).find(c => 
                        store.address?.toLowerCase().includes(c.toLowerCase())
                    );
                    coords = matchedCity ? CITY_COORDS[matchedCity] : [-33.4489, -70.6693];
                }

                // Add tiny jitter to avoid overlapping markers in same city
                const jitterLat = (Math.random() - 0.5) * 0.05;
                const jitterLng = (Math.random() - 0.5) * 0.05;

                const marker = L.marker([coords[0] + jitterLat, coords[1] + jitterLng]).addTo(leafletMap);
                
                marker.bindPopup(`
                    <div style="color: #0f172a; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
                        <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px; text-transform: uppercase;">${store.name}</h4>
                        <p style="margin: 0 0 6px 0; font-size: 11px; color: #475569;">📍 ${store.address || city}</p>
                        ${store.website ? `<a href="${store.website}" target="_blank" rel="noopener noreferrer" style="display: inline-block; font-size: 11px; font-weight: bold; color: #0284c7; text-decoration: underline;">Sitio Web</a>` : ''}
                    </div>
                `);
            });
        };

        // Load Leaflet assets dynamically if not present
        const L = (window as any).L;
        if (!L) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                if (isMounted) initMap();
            };
            document.head.appendChild(script);
        } else {
            initMap();
        }

        return () => {
            isMounted = false;
        };
    }, [filteredStores]);

    return (
        <div className="space-y-16">
            <SEO
                title={t('directorio_tiendas')}
                description="Listado oficial de tiendas asociadas a ThePlayer.gg en Chile. Encuentra tu tienda local de TCG más cercana."
            />
            {/* Hero Section - Join ThePlayer */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/30 border border-white/5 p-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAtOHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

                <div className="relative z-10 text-center mb-12">
                    <h2 className="text-4xl font-bold text-white mb-4 uppercase tracking-tight">{t('tienes_tienda')}</h2>
                    <p className="text-lg text-slate-350 max-w-3xl mx-auto leading-relaxed">
                        {t('tienes_tienda_desc')}
                    </p>
                </div>

                <div className="flex justify-center mb-10 relative z-10">
                    <div className="bg-slate-950/40 p-1 rounded-full border border-slate-800 inline-flex relative min-w-[280px]">
                        <div
                            className={`absolute top-1 bottom-1 bg-sky-650 rounded-full transition-all duration-300 ease-in-out w-[calc(50%-4px)] ${billingCycle === 'annual' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                        ></div>

                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`relative z-10 w-1/2 px-6 py-2 rounded-full text-xs font-black uppercase transition-colors cursor-pointer ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                            {t('mensual')}
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`relative z-10 w-1/2 px-6 py-2 rounded-full text-xs font-black uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer ${billingCycle === 'annual' ? 'text-white' : 'text-slate-500 hover:text-slate-350'}`}
                        >
                            {t('anual')}
                            <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">{t('ahorra_17')}</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
                    <PricingCard
                        title={t('plan_basico')}
                        price={billingCycle === 'monthly' ? "15.000" : "150.000"}
                        period={billingCycle === 'monthly' ? "/mes" : "/año"}
                        features={[
                            'Gestión de hasta 4 torneos/ligas al mes',
                            'Tus torneos suman puntos estándar al ranking nacional',
                            'Presencia en el mapa y directorio público de tiendas',
                            'Perfil de tienda completo y soporte estándar'
                        ]}
                        ctaText={t('elegir_plan')}
                        onCTAClick={() => handleSubscribe('basic')}
                    />

                    <PricingCard
                        title="Plan Pro (Premium)"
                        price={billingCycle === 'monthly' ? "35.000" : "350.000"}
                        period={billingCycle === 'monthly' ? "/mes" : "/año"}
                        badge="Recomendado"
                        highlighted={true}
                        features={[
                            'Creación ilimitada de eventos, torneos y ligas',
                            'Tus torneos otorgan multiplicador de puntos de ranking',
                            'Notificaciones automáticas a jugadores locales',
                            'Sección de anuncios destacados en la plataforma',
                            'Estadísticas avanzadas de asistencia y retención',
                            'Badge "Tienda Premium/Partner" y co-branding'
                        ]}
                        ctaText={t('elegir_plan')}
                        onCTAClick={() => handleSubscribe('premium')}
                    />
                </div>

                <div className="text-center mt-12 relative z-10">
                    <p className="text-slate-500 text-xs font-semibold">
                        💡 Todos los precios son en CLP (Pesos Chilenos). {billingCycle === 'annual' ? '¡Disfruta de 2 meses gratis con el plan anual!' : 'Sin permanencia mínima.'}
                    </p>
                </div>
            </div>

            {/* Map Section */}
            <div className="bg-slate-900/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative z-10">
                <div className="p-5 bg-slate-950/20 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <MapPinIcon className="w-5 h-5 text-sky-400" />
                        {t('mapa_tiendas')}
                    </h3>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('mostrando_tiendas')}</span>
                </div>
                <div className="w-full h-96 bg-slate-950 relative">
                    <div ref={mapContainerRef} className="w-full h-full opacity-85 hover:opacity-100 transition-opacity z-10" />
                    <div className="absolute bottom-4 right-4 bg-slate-900/90 px-3 py-1 rounded text-[10px] uppercase font-black tracking-widest text-slate-400 pointer-events-none border border-slate-700/50 z-20">
                        Solo referencial
                    </div>
                </div>
            </div>

            {/* Stores Directory Section */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">{t('directorio_tiendas')}</h1>
                <p className="text-slate-400 text-base max-w-4xl mx-auto">
                    {t('directorio_tiendas_desc')}
                </p>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 p-4 rounded-2xl border border-white/5 items-center">
                <div className="relative flex-grow md:col-span-2">
                    <input
                        type="search"
                        placeholder={t('buscar_tienda_placeholder')}
                        aria-label="Buscar tiendas por nombre o ciudad"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-950/40 text-white placeholder-slate-500 rounded-xl py-2.5 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-800"
                    />
                </div>
                <div className="relative">
                    <select
                        title="Filtrar por región"
                        aria-label="Filtrar por región"
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="bg-slate-950/40 text-white rounded-xl py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-800 cursor-pointer text-sm font-semibold"
                    >
                        <option>{t('todas_regiones')}</option>
                        <option>Arica y Parinacota</option>
                        <option>Tarapacá</option>
                        <option>Antofagasta</option>
                        <option>Atacama</option>
                        <option>Coquimbo</option>
                        <option>Valparaíso</option>
                        <option>Metropolitana</option>
                        <option>O'Higgins</option>
                        <option>Maule</option>
                        <option>Ñuble</option>
                        <option>Biobío</option>
                        <option>La Araucanía</option>
                        <option>Los Ríos</option>
                        <option>Los Lagos</option>
                        <option>Aysén</option>
                        <option>Magallanes</option>
                    </select>
                </div>
            </div>

            {/* Stores Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                </div>
            ) : filteredStores.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                    <p className="text-slate-550 uppercase tracking-widest font-black text-xs">{t('no_tiendas_encontradas')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                    {filteredStores.map((store) => {
                        const isFollowing = followedStores.includes(store.id);
                        const tier = store.subscription_tier || 'free';

                        // Conditional styling based on tier
                        const borderClass = {
                            premium: 'border-2 border-yellow-500 shadow-2xl shadow-yellow-950/20',
                            medium: 'border-2 border-sky-500 shadow-xl shadow-sky-950/15',
                            basic: 'border border-emerald-500/50 shadow-lg',
                            free: 'border border-white/5'
                        }[tier];

                        const bgClass = {
                            premium: 'bg-gradient-to-br from-slate-900/40 via-slate-900/40 to-yellow-950/10',
                            medium: 'bg-slate-900/30',
                            basic: 'bg-slate-900/30',
                            free: 'bg-slate-900/30'
                        }[tier];

                        return (
                            <div key={store.id} className={`${bgClass} rounded-3xl overflow-hidden hover:shadow-sky-500/10 transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${borderClass} flex flex-col text-center relative group`}>

                                {/* Follow Button */}
                                <button
                                    onClick={() => toggleFollow(store.id)}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950/80 transition-colors focus:outline-none cursor-pointer"
                                    title={isFollowing ? "Dejar de seguir" : "Seguir tienda"}
                                >
                                    <HeartIcon className={`w-5 h-5 transition-colors duration-300 ${isFollowing ? 'text-red-500' : 'text-slate-400 group-hover:text-white'}`} fill={isFollowing} />
                                </button>

                                {/* Subscription Badge */}
                                {tier !== 'free' && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <SubscriptionBadge tier={tier} size="small" />
                                    </div>
                                )}

                                <div className="p-6 bg-slate-950/10 relative border-b border-white/5">
                                    <img className={`w-20 h-20 object-contain rounded-full mx-auto border-4 ${tier === 'premium' ? 'border-yellow-500 shadow-lg shadow-yellow-950/30' :
                                        tier === 'medium' ? 'border-sky-500' :
                                            tier === 'basic' ? 'border-emerald-500' :
                                                'border-slate-750'
                                        }`} src={store.logoUrl} alt={`${store.name} logo`} />
                                </div>
                                <div className="p-6 flex-grow flex flex-col items-center">
                                    <h3 className="font-black text-lg mb-2 text-white uppercase leading-snug">{store.name}</h3>
                                    <span className="inline-block bg-slate-800/40 text-slate-350 border border-slate-800 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider mb-4">{store.region}</span>
                                    <div className="space-y-2 text-slate-400 text-sm">
                                        <div className="flex items-center gap-2 justify-center">
                                            <MapPinIcon className="w-4 h-4 text-slate-500" />
                                            <span className="font-semibold text-xs leading-normal">{store.address}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-950/20 mt-auto border-t border-white/5">
                                    <a href={store.website} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-550 text-white font-black py-2.5 px-4 rounded-xl transition duration-300 text-xs uppercase tracking-wider">
                                        <GlobeAltIcon className="w-4 h-4" />
                                        {t('visitar_sitio')}
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Subscription Modal */}
            <StoreSubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
            />
        </div>
    );
};

export default StoresPage;
