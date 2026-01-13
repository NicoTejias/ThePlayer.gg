
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserAward } from '../types';
import AwardBadge from './AwardBadge';

interface TrophyCaseProps {
    userId: string;
    title?: string;
}

const TrophyCase: React.FC<TrophyCaseProps> = ({ userId, title = "Mi Vitrina de Trofeos" }) => {
    const [awards, setAwards] = useState<UserAward[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAwards = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_awards')
                    .select('*, award:award_id(*)')
                    .eq('user_id', userId)
                    .order('obtained_at', { ascending: false });

                if (error) throw error;
                setAwards(data || []);
            } catch (err) {
                console.error('Error fetching trophies:', err);
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchAwards();
    }, [userId]);

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 animate-pulse">
                <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
                <div className="flex gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-14 h-14 bg-slate-700 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (awards.length === 0) {
        return (
            <div className="bg-slate-800/50 rounded-3xl p-10 border border-slate-700/50 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-3xl opacity-50 grayscale">
                    🏆
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">{title}</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        Aún no has obtenido trofeos oficiales. ¡Participa en torneos y eventos especiales para llenar tu vitrina!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <span className="text-8xl font-black">AWARDS</span>
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <span className="text-sky-500 text-3xl">🏁</span>
                        {title}
                    </h3>
                    <span className="bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-sky-500/30">
                        {awards.length} Logro{awards.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex flex-wrap gap-6">
                    {awards.map((userAward) => (
                        userAward.award && (
                            <div key={userAward.id} className="flex flex-col items-center">
                                <AwardBadge award={userAward.award} size="md" />
                                <span className="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded-md">
                                    {userAward.season}
                                </span>
                            </div>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrophyCase;
