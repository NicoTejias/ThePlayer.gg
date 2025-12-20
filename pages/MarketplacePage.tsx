
import React from 'react';
import { Link } from 'react-router-dom';
import type { MarketplacePost } from '../types';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';

// Mock Data (Consistent with Detail Page)
const mockFullMarketplacePosts: MarketplacePost[] = [
    {
        id: '1',
        title: 'Vendo Force of Will [2XM]',
        type: 'Venta',
        seller: 'CardTraderCL',
        price: 45000,
        region: 'Metropolitana',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card',
        items: [
            { id: 'c1', name: 'Force of Will', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card' }
        ]
    },
    {
        id: '2',
        title: 'Busco 4x Ragavan',
        type: 'Compra',
        seller: 'ProPlayer',
        price: 140000,
        region: 'Valparaíso',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card',
        items: [
            { id: 'c2', name: 'Ragavan', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c3', name: 'Ragavan', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c4', name: 'Ragavan', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c5', name: 'Ragavan', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' }
        ]
    },
    {
        id: '4',
        title: 'Lote Tierras Dobles',
        type: 'Venta',
        seller: 'LegacyFan',
        price: 800000,
        region: 'Metro',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=382841&type=card',
        items: [
            { id: 'c6', name: 'Volcanic', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=382841&type=card' },
            { id: 'c7', name: 'Underground', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=879&type=card' }
        ]
    },
    { id: '5', title: 'Staples Pauper', type: 'Venta', seller: 'PauperKind', price: 15000, region: 'Sur', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card', items: [{ id: 'x', name: 'x', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card' }] },
    { id: '6', title: 'The One Ring', type: 'Compra', seller: 'RingBearer', price: 60000, region: 'Norte', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card', items: [{ id: 'y', name: 'y', imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' }] },
];

const getTypeStyles = (type: MarketplacePost['type']) => {
    switch (type) {
        case 'Venta': return 'bg-red-900/40 text-red-300 ring-1 ring-red-500/50';
        case 'Compra': return 'bg-green-900/40 text-green-300 ring-1 ring-green-500/50';
        case 'Cambio': return 'bg-blue-900/40 text-blue-300 ring-1 ring-blue-500/50';
    }
}

const MarketplacePage: React.FC = () => {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">Mercado</h1>
                <p className="text-slate-400 mt-2 max-w-2xl mx-auto text-sm">
                    Compra, vende o cambia cartas. Transacciones directas entre jugadores.
                </p>
                <div className="mt-6">
                    <button className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-full transition-all shadow-lg shadow-sky-900/20 text-sm">
                        + Nuevo Anuncio
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                <input
                    type="search"
                    placeholder="Buscar cartas..."
                    className="bg-slate-900/60 text-white placeholder-slate-500 rounded px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-sky-500 border border-slate-700 text-sm"
                />
                <select className="bg-slate-900/60 text-white rounded px-3 py-2 focus:outline-none border border-slate-700 text-sm">
                    <option>Todos los Tipos</option>
                    <option>Venta</option>
                    <option>Compra</option>
                    <option>Cambio</option>
                </select>
                <select className="bg-slate-900/60 text-white rounded px-3 py-2 focus:outline-none border border-slate-700 text-sm">
                    <option>Más Recientes</option>
                    <option>Precio: Menor a Mayor</option>
                    <option>Precio: Mayor a Menor</option>
                </select>
            </div>

            {/* Marketplace Grid - Smaller Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mockFullMarketplacePosts.map((post) => {
                    const images = post.items?.map(i => i.imageUrl).slice(0, 4) || [post.imageUrl];
                    const hasMore = (post.items?.length || 0) > 4;

                    return (
                        <Link to={`/mercado/${post.id}`} key={post.id} className="group bg-slate-800 rounded-lg overflow-hidden shadow-lg border border-slate-700 hover:border-slate-500 transition-all hover:translate-y-[-2px] flex flex-col">
                            {/* Image Gallery Grid */}
                            <div className="aspect-[4/3] bg-slate-900 relative p-1 grid grid-cols-2 gap-0.5">
                                {images.length === 1 ? (
                                    <img src={images[0]} alt={post.title} className="col-span-2 row-span-2 w-full h-full object-cover rounded-sm" />
                                ) : (
                                    images.map((img, idx) => (
                                        <div key={idx} className="relative w-full h-full overflow-hidden rounded-sm">
                                            <img src={img} alt="card" className="w-full h-full object-cover" />
                                            {/* Show +N overlay on last image if there are more */}
                                            {idx === 3 && hasMore && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xs">
                                                    +{post.items!.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {/* Type Tag Overlay */}
                                <div className="absolute top-2 right-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm ${getTypeStyles(post.type)}`}>
                                        {post.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 flex flex-col flex-grow">
                                <h3 className="font-bold text-sm text-white leading-tight mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors">
                                    {post.title}
                                </h3>

                                <div className="mt-auto space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                                            <UserIcon className="w-3 h-3" />
                                            <span className="truncate max-w-[80px]">{post.seller}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                            <MapPinIcon className="w-3 h-3" />
                                            <span>{post.region}</span>
                                        </div>
                                    </div>

                                    {post.price !== undefined && (
                                        <div className="font-bold text-green-400 text-sm">
                                            {post.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MarketplacePage;
