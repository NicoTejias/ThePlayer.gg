import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import JudgeProfileCard from '../components/JudgeProfileCard';
import { toast } from 'sonner';

interface Judge {
    id: string;
    username: string;
    avatar_url?: string;
    judge_level: string;
    judge_specialties?: string[];
    judge_region?: string;
    judge_bio?: string;
    judge_certification_date?: string;
    judge_role: string;
}

const JudgesPage: React.FC = () => {
    const [judges, setJudges] = useState<Judge[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState<string>('all');
    const [selectedRegion, setSelectedRegion] = useState<string>('all');

    useEffect(() => {
        fetchJudges();
    }, []);

    const fetchJudges = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('judge_status', 'approved')
                .in('judge_role', ['judge', 'head_judge'])
                .order('judge_certification_date', { ascending: false });

            if (error) throw error;
            setJudges(data || []);
        } catch (error) {
            console.error('Error fetching judges:', error);
            toast.error('Error al cargar jueces');
        } finally {
            setLoading(false);
        }
    };

    const filteredJudges = judges.filter(judge => {
        const gameMatch = selectedGame === 'all' ||
            (judge.judge_specialties && judge.judge_specialties.includes(selectedGame));
        const regionMatch = selectedRegion === 'all' || judge.judge_region === selectedRegion;
        return gameMatch && regionMatch;
    });

    const regions = [
        'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
        'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
        'Biobío', 'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Cargando jueces...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
                <div className="relative max-w-7xl mx-auto px-6 py-20">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/50 rounded-full px-4 py-2 mb-6">
                            <span className="text-2xl">⚖️</span>
                            <span className="text-sm font-semibold text-purple-300">Programa de Jueces</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Jueces Certificados
                        </h1>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                            Conoce a los árbitros oficiales de ThePlayer.gg. Profesionales certificados que garantizan
                            torneos justos y de calidad.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg">
                                Aplicar para ser Juez
                            </button>
                            <button className="px-6 py-3 bg-slate-800 border border-slate-700 text-white font-bold rounded-lg hover:bg-slate-700 transition-all">
                                Ver Requisitos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                        <div className="text-4xl font-bold text-purple-400 mb-2">{judges.length}</div>
                        <div className="text-slate-400">Jueces Activos</div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                        <div className="text-4xl font-bold text-pink-400 mb-2">
                            {judges.filter(j => j.judge_role === 'head_judge').length}
                        </div>
                        <div className="text-slate-400">Head Judges</div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
                        <div className="text-4xl font-bold text-sky-400 mb-2">
                            {new Set(judges.flatMap(j => j.judge_specialties || [])).size}
                        </div>
                        <div className="text-slate-400">Juegos Cubiertos</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Game Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                Filtrar por Juego
                            </label>
                            <select
                                value={selectedGame}
                                onChange={(e) => setSelectedGame(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todos los Juegos</option>
                                <option value="mtg">Magic: The Gathering</option>
                                <option value="pokemon">Pokémon TCG</option>
                                <option value="lorcana">Lorcana</option>
                                <option value="onepiece">One Piece</option>
                            </select>
                        </div>

                        {/* Region Filter */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-400 mb-2">
                                Filtrar por Región
                            </label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">Todas las Regiones</option>
                                {regions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Judges Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                {filteredJudges.length > 0 ? (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {filteredJudges.length} {filteredJudges.length === 1 ? 'Juez' : 'Jueces'}
                                {selectedGame !== 'all' && ` - ${selectedGame.toUpperCase()}`}
                                {selectedRegion !== 'all' && ` - ${selectedRegion}`}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredJudges.map(judge => (
                                <JudgeProfileCard key={judge.id} judge={judge} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-xl font-bold text-white mb-2">No hay jueces disponibles</h3>
                        <p className="text-slate-400">
                            No se encontraron jueces con los filtros seleccionados
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JudgesPage;