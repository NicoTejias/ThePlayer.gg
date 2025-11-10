
import React from 'react';
import type { MarketplacePost } from '../types';
import Card from '../components/Card';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import SwitchHorizontalIcon from '../components/icons/SwitchHorizontalIcon';

const mockFullMarketplacePosts: MarketplacePost[] = [
  { id: '1', title: 'Vendo Force of Will [2XM]', type: 'Venta', seller: 'CardTraderCL', price: 45000, region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/card1/400/300' },
  { id: '2', title: 'Busco 4x Ragavan, Nimble Pilferer', type: 'Compra', seller: 'ProPlayer', price: 35000, region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/card2/400/300' },
  { id: '3', title: 'Cambio playset de Solitude', type: 'Cambio', seller: 'CollectorG', region: 'Biobío', imageUrl: 'https://picsum.photos/seed/card3/400/300' },
  { id: '4', title: 'Vendo Lote de Tierras Dobles', type: 'Venta', seller: 'LegacyFan', price: 800000, region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/card4/400/300' },
  { id: '5', title: 'Vendo Staple de Pauper', type: 'Venta', seller: 'PauperPower', price: 5000, region: 'Sur', imageUrl: 'https://picsum.photos/seed/card5/400/300' },
  { id: '6', title: 'Busco The One Ring para Commander', type: 'Compra', seller: 'EDH_Master', price: 50000, region: 'Norte', imageUrl: 'https://picsum.photos/seed/card6/400/300' },
  { id: '7', title: 'Vendo mazo de Modern Burn completo', type: 'Venta', seller: 'AggroPlayer', price: 250000, region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/card7/400/300' },
  { id: '8', title: 'Cambio cartas de Lorwyn por de Kamigawa', type: 'Cambio', seller: 'OldSchooler', region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/card8/400/300' },
];

const getTypeStyles = (type: MarketplacePost['type']) => {
    switch (type) {
        case 'Venta': return 'bg-red-500/20 text-red-300';
        case 'Compra': return 'bg-green-500/20 text-green-300';
        case 'Cambio': return 'bg-blue-500/20 text-blue-300';
    }
}

const MarketplacePage: React.FC = () => {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Mercado de Cartas</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Compra, vende o cambia cartas con otros jugadores de la comunidad. Las transacciones se coordinan directamente entre los usuarios.
                </p>
                <div className="mt-8">
                    <button className="bg-sky-500 text-white font-bold py-3 px-8 rounded-md hover:bg-sky-600 transition duration-300 text-lg">
                        + Publicar Anuncio
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700 items-center">
                <div className="relative flex-grow lg:col-span-2">
                    <input
                        type="search"
                        placeholder="Buscar por nombre de carta..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Tipo de Anuncio</option>
                        <option>Venta</option>
                        <option>Compra</option>
                        <option>Cambio</option>
                    </select>
                </div>
                 <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Ordenar por...</option>
                        <option>Más Recientes</option>
                        <option>Precio (Menor a Mayor)</option>
                        <option>Precio (Mayor a Menor)</option>
                    </select>
                </div>
            </div>

            {/* Marketplace Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {mockFullMarketplacePosts.map((post) => (
                    <div key={post.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700 flex flex-col">
                        <img className="w-full h-48 object-cover" src={post.imageUrl} alt={post.title} />
                        <div className="p-6 flex-grow">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-lg mb-3 text-white uppercase flex-1 pr-2">{post.title}</h3>
                                <span className={`flex-shrink-0 font-bold text-xs px-2 py-1 rounded-full ${getTypeStyles(post.type)}`}>
                                    {post.type.toUpperCase()}
                                </span>
                            </div>
                            <div className="space-y-3 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-slate-400" />
                                    <span>{post.seller}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="w-5 h-5 text-slate-400" />
                                    <span>{post.region}</span>
                                </div>
                                {post.price !== undefined && (
                                <div className="flex items-center gap-2 font-semibold text-green-400">
                                    <CurrencyDollarIcon className="w-5 h-5" />
                                    <span>{post.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</span>
                                </div>
                                )}
                                {post.type === 'Cambio' && (
                                     <div className="flex items-center gap-2 font-semibold text-blue-400">
                                        <SwitchHorizontalIcon className="w-5 h-5" />
                                        <span>Disponible para cambio</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-800/50 mt-auto border-t border-slate-700">
                           <button className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition duration-300">
                                Contactar Vendedor
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketplacePage;
