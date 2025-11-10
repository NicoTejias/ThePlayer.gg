
import React from 'react';
import type { CommunityEvent } from '../types';
import Card from '../components/Card';
import CalendarIcon from '../components/icons/CalendarIcon';
import MapPinIcon from '../components/icons/MapPinIcon';
import TagIcon from '../components/icons/TagIcon';

interface EventsPageProps {
    events: CommunityEvent[];
}

const EventsPage: React.FC<EventsPageProps> = ({ events }) => {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Calendario de Eventos</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Encuentra los próximos torneos de tiendas asociadas y eventos Premier. ¡Inscríbete y compite!
                </p>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="relative flex-grow">
                    <input
                        type="search"
                        placeholder="Buscar por nombre o tienda..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <input
                        type="date"
                        className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                    />
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Todos los Formatos</option>
                        <option>Standard</option>
                        <option>Modern</option>
                        <option>Pioneer</option>
                        <option>Legacy</option>
                        <option>Pauper</option>
                        <option>Commander</option>
                        <option>Draft</option>
                        <option>Sealed</option>
                    </select>
                </div>
                <div className="relative">
                    <select className="bg-slate-900/80 text-white rounded-md py-2.5 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                        <option>Todas las Regiones</option>
                        <option>Metropolitana</option>
                        <option>Valparaíso</option>
                        <option>Biobío</option>
                        <option>Sur</option>
                        <option>Norte</option>
                    </select>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {events.map((event) => (
                    <div key={event.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700">
                        <div className="h-48 bg-slate-700 flex items-center justify-center">
                            <CalendarIcon className="w-16 h-16 text-slate-500" />
                        </div>
                        <div className="p-6">
                            <h3 className="font-bold text-xl mb-3 text-white uppercase">{event.title}</h3>
                            <div className="space-y-3 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <MapPinIcon className="w-5 h-5 text-slate-400" />
                                    <span>{event.storeName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                                    <span>{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TagIcon className="w-5 h-5 text-slate-400" />
                                    <span className="inline-block bg-sky-800 rounded-full px-3 py-1 text-sm font-semibold text-sky-200">{event.format}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700">
                           <button className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition duration-300">
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsPage;
