
import React from 'react';
import { Link } from 'react-router-dom';
import type { TournamentResult } from '../types';
import ListBulletIcon from '../components/icons/ListBulletIcon';

interface TournamentsListPageProps {
    tournaments: TournamentResult[];
}

const TournamentsListPage: React.FC<TournamentsListPageProps> = ({ tournaments }) => {
    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Repositorio de Torneos</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Explora el historial de todos los torneos reportados. Consulta los resultados y standings de cada evento.
                </p>
            </div>

            {/* Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="relative flex-grow md:col-span-2">
                    <input
                        type="search"
                        placeholder="Buscar por nombre, tienda o formato..."
                        className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
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

            {/* Tournaments Table */}
            <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Fecha</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Nombre del Torneo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tienda</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Formato</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Jugadores</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {tournaments.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-700/40 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{t.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{t.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{t.storeName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-800 text-sky-200">{t.format}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{t.playerCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <Link to={`/torneos/${t.id}`} className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                                        <ListBulletIcon className="w-4 h-4" />
                                        Ver Standings
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TournamentsListPage;
