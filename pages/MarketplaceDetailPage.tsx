import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MarketplacePost } from '../types';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import ParticlesBackground from '../components/ParticlesBackground';

// Reuse the mock data (in a real app, this would be fetched from Supabase)
const mockFullMarketplacePosts: MarketplacePost[] = [
    {
        id: '1',
        title: 'Vendo Force of Will [2XM]',
        type: 'Venta',
        seller: 'CardTraderCL',
        price: 45000,
        region: 'Metropolitana',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card',
        description: 'Cartas en excelente estado, enviadas con doble folio. Consultas por WhatsApp.',
        contactInfo: 'https://wa.me/56912345678',
        items: [
            { id: 'c1', name: 'Force of Will', set: 'Double Masters', condition: 'NM', price: 45000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=489756&type=card' }
        ]
    },
    {
        id: '2',
        title: 'Busco 4x Ragavan, Nimble Pilferer',
        type: 'Compra',
        seller: 'ProPlayer',
        price: 140000,
        region: 'Valparaíso',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card',
        contactInfo: 'discord: ProPlayer#1234',
        items: [
            { id: 'c2', name: 'Ragavan, Nimble Pilferer', set: 'MH2', price: 35000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c3', name: 'Ragavan, Nimble Pilferer', set: 'MH2', price: 35000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c4', name: 'Ragavan, Nimble Pilferer', set: 'MH2', price: 35000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' },
            { id: 'c5', name: 'Ragavan, Nimble Pilferer', set: 'MH2', price: 35000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=522227&type=card' }
        ]
    },
    {
        id: '4',
        title: 'Vendo Lote de Tierras Dobles',
        type: 'Venta',
        seller: 'LegacyFan',
        price: 800000,
        region: 'Metropolitana',
        imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=382841&type=card',
        description: 'Se vende lote completo por apuro. Solo ofertas serias.',
        contactInfo: 'mailto:legacyfan@example.com',
        items: [
            { id: 'c6', name: 'Volcanic Island', set: 'Revised', condition: 'SP', price: 400000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=382841&type=card' },
            { id: 'c7', name: 'Underground Sea', set: 'Revised', condition: 'MP', price: 400000, imageUrl: 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=879&type=card' }
        ]
    }
];

const MarketplaceDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const post = mockFullMarketplacePosts.find(p => p.id === id);

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300">
                <h2 className="text-2xl font-bold mb-4">Publicación no encontrada</h2>
                <Link to="/mercado" className="text-sky-500 hover:underline">Volver al Mercado TCG</Link>
            </div>
        );
    }

    const getTypeStyles = (type: MarketplacePost['type']) => {
        switch (type) {
            case 'Venta': return 'bg-red-500/20 text-red-300';
            case 'Compra': return 'bg-green-500/20 text-green-300';
            case 'Cambio': return 'bg-blue-500/20 text-blue-300';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Breadcrumb / Back Navigation */}
            <div>
                <Link to="/mercado" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al Mercado TCG
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Post Details & Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <h1 className="text-3xl font-bold text-white uppercase tracking-tight">{post.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold tracking-wider ${getTypeStyles(post.type)}`}>
                                    {post.type.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-slate-300 mb-6 text-sm">
                                <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                    <UserIcon className="w-4 h-4 text-sky-400" />
                                    <span className="font-semibold text-white">{post.seller}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                    <MapPinIcon className="w-4 h-4 text-orange-400" />
                                    <span>{post.region}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-md">
                                    <span className="text-slate-400">Publicado hace 2 días</span>
                                </div>
                            </div>

                            {post.description && (
                                <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700/50 mb-6">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción</h3>
                                    <p className="text-slate-300 italic">"{post.description}"</p>
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                                Cartas Incluidas ({post.items?.length || 0})
                            </h2>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {post.items?.map((item) => (
                                    <div key={item.id} className="bg-slate-700/50 rounded-lg p-3 flex gap-4 border border-slate-600/50 hover:border-slate-500 transition-colors">
                                        <img src={item.imageUrl} alt={item.name} className="w-20 h-auto rounded shadow-sm object-cover" />
                                        <div className="flex flex-col justify-center">
                                            <span className="font-bold text-white text-lg leading-tight">{item.name}</span>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                {item.set && <span className="text-xs text-sky-400 font-medium bg-sky-900/20 px-1.5 py-0.5 rounded w-fit">{item.set}</span>}
                                                {item.condition && <span className="text-xs text-slate-400">Condición: <span className="text-slate-200">{item.condition}</span></span>}
                                            </div>
                                            {item.price && (
                                                <span className="text-green-400 font-bold mt-2">
                                                    {item.price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Action / Contact */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl sticky top-24">
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">Detalles de la Transacción</h3>

                        <div className="mb-6">
                            <span className="block text-slate-500 text-xs uppercase font-bold mb-1">Precio Total Estimado</span>
                            <div className="text-4xl font-bold text-white flex items-center gap-1">
                                <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                                {post.price?.toLocaleString('es-CL') || 'A convenir'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={post.contactInfo?.startsWith('http') || post.contactInfo?.startsWith('mailto') ? post.contactInfo : '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-md text-center transition-all shadow-lg shadow-sky-900/20 flex items-center justify-center gap-2"
                                onClick={(e) => {
                                    if (!post.contactInfo) {
                                        e.preventDefault();
                                        alert('El vendedor no ha especificado un método directo. Intenta buscarlo en la comunidad.');
                                    }
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                Contactar Vendedor
                            </a>

                            <button className="block w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 px-4 rounded-md text-center transition-all border border-slate-600">
                                Enviar Mensaje Interno
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                            <p className="text-xs text-slate-500 mb-2">
                                Recuerda que ThePlayer.gg no es intermediario en pagos ni envíos.
                            </p>
                            <Link to="/seguridad" className="text-xs text-sky-500 hover:underline">
                                Consejos de seguridad para transacciones
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceDetailPage;
