
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import AwardBadge from './AwardBadge';

const GalaNominationsBanner: React.FC = () => {
    const [nominations, setNominations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNominations = async () => {
            try {
                const { data } = await supabase
                    .from('user_awards')
                    .select('*, award:award_id!inner(*), profile:user_id(username, points, pwp)')
                    .ilike('award.name', '%Nominado Gala%')
                    .order('obtained_at', { ascending: false })
                    .limit(5);

                setNominations(data?.filter((n: any) => n.award) || []);
            } catch (err) {
                console.error('Error fetching gala nominations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNominations();
    }, []);

    if (loading || nominations.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-yellow-500/30 rounded-3xl overflow-hidden relative group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] -mr-32 -mt-32"></div>

            <div className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20 mb-3">
                            <span>✨</span> RUMBO A LA GALA 2026
                        </div>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Primeros Nominados</h3>
                        <p className="text-slate-400 mt-1 max-w-md">Estos jugadores ya aseguraron su lugar en la ceremonia de fin de año por su desempeño excepcional.</p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20 rotate-3">
                            <span className="text-3xl">🥂</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {nominations.map((nom) => (
                        <div key={nom.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center text-center gap-3 hover:border-yellow-500/40 transition-all hover:scale-105 group/card">
                            <div className="relative">
                                <AwardBadge award={nom.award} size="md" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 shadow-lg">
                                    ✓
                                </div>
                            </div>
                            <div>
                                <p className="text-white font-black uppercase tracking-tighter text-sm group-hover/card:text-yellow-400 transition-colors">
                                    {nom.profile?.username}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {nom.profile?.points || nom.profile?.pwp} Player Points
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for "Your name here" */}
                    <div className="bg-slate-950/40 border border-slate-800 border-dashed p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 opacity-60">
                        <div className="w-10 h-10 border-2 border-dashed border-slate-700 rounded-full flex items-center justify-center text-slate-700 font-black">
                            ?
                        </div>
                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Tú podrías estar aquí</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GalaNominationsBanner;
