
import React from 'react';
import type { Judge, StudyMaterial } from '../types';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import ScaleIcon from '../components/icons/ScaleIcon';
import UserIcon from '../components/icons/UserIcon';
import MapPinIcon from '../components/icons/MapPinIcon';

const mockStudyMaterials: StudyMaterial[] = [
    { id: '1', title: 'Reglas de Comprensión', description: 'El documento de reglas completo de Magic: The Gathering.', type: 'Documento', url: '#' },
    { id: '2', title: 'Guía de Procedimientos de Torneo', description: 'Procedimientos y políticas para eventos de nivel Regular.', type: 'Guía', url: '#' },
    { id: '3', title: 'Certificación Nivel 1', description: 'Todo lo que necesitas saber para convertirte en Juez Nivel 1.', type: 'Guía', url: '#' },
    { id: '4', title: 'Videos de Interacciones Complejas', description: 'Colección de videos explicando interacciones de reglas difíciles.', type: 'Video', url: '#' },
];

const mockJudges: Judge[] = [
    { id: 'j1', name: 'Carlos "El Sabio" Rojas', level: 'L2', region: 'Metropolitana', status: 'Activo' },
    { id: 'j2', name: 'Andrea "La Justa" Nuñez', level: 'L2', region: 'Valparaíso', status: 'Activo' },
    { id: 'j3', name: 'Miguel "El Oráculo" Soto', level: 'L1', region: 'Biobío', status: 'Activo' },
    { id: 'j4', name: 'Valeria "La Escriba" Pérez', level: 'L1', region: 'Metropolitana', status: 'Activo' },
    { id: 'j5', name: 'Javier "El Vigilante" Morales', level: 'L1', region: 'Norte', status: 'Activo' },
    { id: 'j6', name: 'Fernanda "La Guardiana" Silva', level: 'L1', region: 'Sur', status: 'Inactivo' },
    { id: 'j7', name: 'Ricardo "El Mentor" Gómez', level: 'L3', region: 'Metropolitana', status: 'Activo' },
    { id: 'j8', name: 'Isidora "La Mente" Castro', level: 'L2', region: 'Valparaíso', status: 'Activo' },
];

const getLevelBadgeStyle = (level: Judge['level']) => {
    switch (level) {
        case 'L1': return 'bg-green-500/20 text-green-300';
        case 'L2': return 'bg-sky-500/20 text-sky-300';
        case 'L3': return 'bg-purple-500/20 text-purple-300';
        default: return 'bg-slate-700 text-slate-300';
    }
}

const JudgesPage: React.FC = () => {
    return (
        <div className="space-y-16">
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tighter uppercase">Academia de Jueces</h1>
                <p className="text-lg text-slate-300 mt-2 max-w-4xl mx-auto">
                    Recursos de estudio y registro oficial de jueces certificados en Chile. Fomentando el juego justo y el conocimiento de las reglas.
                </p>
                 <div className="mt-8">
                    <button className="bg-sky-500 text-white font-bold py-3 px-8 rounded-md hover:bg-sky-600 transition duration-300 text-lg">
                        Postular a Juez
                    </button>
                </div>
            </div>

            {/* Material de Estudio */}
            <section>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Material de Estudio</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                    {mockStudyMaterials.map(material => (
                        <a href={material.url} key={material.id} className="block group">
                            <div className="bg-slate-800 p-6 rounded-lg shadow-lg hover:shadow-sky-500/20 transition-all duration-300 ease-in-out transform hover:-translate-y-1 border border-slate-700 h-full">
                                <BookOpenIcon className="w-10 h-10 text-sky-400 mb-4" />
                                <h3 className="font-bold text-xl mb-2 text-white group-hover:text-sky-400 transition-colors">{material.title}</h3>
                                <p className="text-slate-400 text-sm mb-4">{material.description}</p>
                                <span className="inline-block bg-slate-700 rounded-full px-3 py-1 text-xs font-semibold text-slate-300">{material.type}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
            
            {/* Registro de Jueces */}
            <section>
                <h2 className="text-3xl font-bold text-white uppercase tracking-wider mb-6">Registro Oficial de Jueces</h2>
                
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
                    <div className="relative w-full sm:w-auto flex-grow">
                        <input
                            type="search"
                            placeholder="Buscar juez..."
                            className="bg-slate-900/80 text-white placeholder-slate-400 rounded-md py-2 px-4 w-full focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select className="bg-slate-900/80 text-white rounded-md py-2 px-4 w-full appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-700">
                            <option value="Todas">Todas las Regiones</option>
                            <option value="Metropolitana">Metropolitana</option>
                            <option value="Valparaíso">Valparaíso</option>
                            <option value="Biobío">Biobío</option>
                            <option value="Sur">Sur</option>
                            <option value="Norte">Norte</option>
                        </select>
                    </div>
                </div>

                {/* Judges Table */}
                <div className="overflow-x-auto bg-slate-800 rounded-lg shadow-xl border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2"><UserIcon className="w-4 h-4" />Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2"><ScaleIcon className="w-4 h-4" />Nivel</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-2"><MapPinIcon className="w-4 h-4" />Región</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-300 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {mockJudges.map(judge => (
                                <tr key={judge.id} className="hover:bg-slate-700/40 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{judge.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-sm leading-5 font-bold rounded-full ${getLevelBadgeStyle(judge.level)}`}>
                                            {judge.level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{judge.region}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${judge.status === 'Activo' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'}`}>
                                            {judge.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default JudgesPage;