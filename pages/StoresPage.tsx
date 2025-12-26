import React, { useState } from 'react';
import type { Store } from '../types';
import MapPinIcon from '../components/icons/MapPinIcon';
import GlobeAltIcon from '../components/icons/GlobeAltIcon';
import PricingCard from '../components/PricingCard';
import StoreSubscriptionModal from '../components/StoreSubscriptionModal';
import { toast } from 'sonner';

const mockStores: Store[] = [
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's1', name: 'Magicsur', region: 'Metropolitana', address: 'Av. Providencia 2216, Local 5A', website: '#', logoUrl: 'https://picsum.photos/seed/store1/200/200', status: 'Aprobada', requestDate: '2024-01-10' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's2', name: 'Guildreams', region: 'Valparaíso', address: 'Calle Valparaíso 568, Local 32, Viña del Mar', website: '#', logoUrl: 'https://picsum.photos/seed/store2/200/200', status: 'Aprobada', requestDate: '2024-01-12' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's3', name: 'Ouroboros Store', region: 'Metropolitana', address: 'Av. Nueva Providencia 2160, Local 12', website: '#', logoUrl: 'https://picsum.photos/seed/store3/200/200', status: 'Aprobada', requestDate: '2024-02-01' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's4', name: 'El Reino de los Duelos', region: 'Biobío', address: 'Aníbal Pinto 509, Local 15, Concepción', website: '#', logoUrl: 'https://picsum.photos/seed/store4/200/200', status: 'Aprobada', requestDate: '2024-02-15' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's5', name: 'La Forja del Sur', region: 'Sur', address: 'Av. Alemania 0987, Temuco', website: '#', logoUrl: 'https://picsum.photos/seed/store5/200/200', status: 'Aprobada', requestDate: '2024-03-05' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's6', name: 'Goblin Store', region: 'Metropolitana', address: 'Av. Irarrázaval 2891, Local 102, Ñuñoa', website: '#', logoUrl: 'https://picsum.photos/seed/store6/200/200', status: 'Aprobada', requestDate: '2024-03-20' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's7', name: 'El Templo del Juego', region: 'Norte', address: 'Arturo Prat 452, Antofagasta', website: '#', logoUrl: 'https://picsum.photos/seed/store7/200/200', status: 'Aprobada', requestDate: '2024-04-01' },
    // FIX: Added missing `requestDate` property to conform to the Store type.
    { id: 's8', name: 'Card Universe', region: 'Valparaíso', address: 'Esmeralda 1087, Valparaíso', website: '#', logoUrl: 'https://picsum.photos/seed/store8/200/200', status: 'Aprobada', requestDate: '2024-04-18' },
];

const HeartIcon: React.FC<{ className?: string, fill?: boolean }> = ({ className, fill }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
);

const StoresPage: React.FC = () => {
    const [followedStores, setFollowedStores] = React.useState<string[]>([]);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'basic' | 'medium' | 'premium'>('medium');

    const toggleFollow = (storeId: string) => {
        setFollowedStores(prev =>
            prev.includes(storeId)
                ? prev.filter(id => id !== storeId)
                : [...prev, storeId]
        );
    };

    const handleSubscribe = (plan: 'basic' | 'medium' | 'premium') => {
        setSelectedPlan(plan);
        setShowSubscriptionModal(true);
    };

    return (
        <div className="space-y-16">
            {/* Hero Section - Join ThePlayer */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-900/20 to-slate-900 border border-sky-500/30 p-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzYjgyZjYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAtOHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

                <div className="relative z-10 text-center mb-12">
                    <h2 className="text-5xl font-bold text-white mb-4">¿Tienes una Tienda de TCG?</h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                        Únete a ThePlayer.gg y lleva tu tienda al siguiente nivel. Atrae más jugadores, organiza torneos oficiales y crece con la comunidad.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
                    <PricingCard
                        title="Plan Básico"
                        price="25.000"
                        features={[
                            'Puntos PWP oficiales en torneos',
                            'Torneos en calendario ThePlayer',
                            'Perfil de tienda completo',
                            'Gestión de eventos desde dashboard',
                            'Estadísticas básicas de asistencia'
                        ]}
                        ctaText="Comenzar"
                        onCTAClick={() => handleSubscribe('basic')}
                    />

                    <PricingCard
                        title="Plan Medio"
                        price="50.000"
                        badge="Más Popular"
                        highlighted={true}
                        features={[
                            'Todo lo del Plan Básico',
                            'Mención destacada en Home',
                            'Clasificatorio directo al Nacional',
                            'Transmisión incluida',
                            'Badge "Tienda Verificada"',
                            'Prioridad en búsquedas',
                            'Estadísticas avanzadas'
                        ]}
                        ctaText="Elegir Plan"
                        onCTAClick={() => handleSubscribe('medium')}
                    />

                    <PricingCard
                        title="Plan Premium"
                        price="100.000"
                        badge="Mejor Valor"
                        features={[
                            'Todo lo del Plan Medio',
                            'Publicidad en redes sociales',
                            'Badge "Tienda Premium"',
                            'Destacado visual exclusivo',
                            'Sección exclusiva en Home',
                            'Reportes mensuales personalizados',
                            'Soporte prioritario',
                            'Co-branding en eventos'
                        ]}
                        ctaText="Contactar"
                        onCTAClick={() => handleSubscribe('premium')}
                    />
                </div>

                <div className="text-center mt-12 relative z-10">
                    <p className="text-slate-400 text-sm">
                        💡 Todos los precios son en CLP (Pesos Chilenos) por mes. Sin permanencia mínima.
                    </p>
                </div>
            </div>

            {/* Stores Directory Section */}
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Directorio de Tiendas Asociadas</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Encuentra tu tienda local más cercana. Apoya a los organizadores que hacen crecer nuestra comunidad.
                </p>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 items-center">
                <div className="relative flex-grow md:col-span-2">
                    <input
                        type="search"
                        placeholder="Buscar por nombre o ciudad..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Todas las Regiones</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {mockStores.map((store) => {
                    const isFollowing = followedStores.includes(store.id);
                    return (
                        <div key={store.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700 flex flex-col text-center relative group">

                            {/* Follow Button */}
                            <button
                                onClick={() => toggleFollow(store.id)}
                                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/80 transition-colors focus:outline-none"
                                title={isFollowing ? "Dejar de seguir" : "Seguir tienda"}
                            >
                                <HeartIcon className={`w-6 h-6 transition-colors duration-300 ${isFollowing ? 'text-red-500' : 'text-slate-400 group-hover:text-white'}`} fill={isFollowing} />
                            </button>

                            <div className="p-6 bg-slate-700/50 relative">
                                <img className="w-24 h-24 object-contain rounded-full mx-auto border-4 border-slate-600" src={store.logoUrl} alt={`${store.name} logo`} />
                            </div>
                            <div className="p-6 flex-grow flex flex-col items-center">
                                <h3 className="font-bold text-xl mb-2 text-white uppercase">{store.name}</h3>
                                <span className="inline-block bg-slate-700 rounded-full px-3 py-1 text-sm font-semibold text-slate-300 mb-4">{store.region}</span>
                                <div className="space-y-2 text-slate-300 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon className="w-4 h-4 text-slate-400" />
                                        <span>{store.address}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-800/50 mt-auto border-t border-slate-700">
                                <a href={store.website} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition duration-300">
                                    <GlobeAltIcon className="w-5 h-5" />
                                    Visitar Sitio Web
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Subscription Modal */}
            <StoreSubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
                selectedPlan={selectedPlan}
            />
        </div>
    );
};

export default StoresPage;
