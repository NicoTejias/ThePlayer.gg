
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Award, PlayerProfile } from '../types';
import AwardBadge from '../components/AwardBadge';
import RefreshCwIcon from '../components/icons/RefreshCwIcon';
import TrashIcon from '../components/icons/TrashIcon';

const AdminAwardsPage: React.FC = () => {
    const [awards, setAwards] = useState<Award[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGrantModal, setShowGrantModal] = useState(false);

    // Form states for NEW AWARD
    const [newAward, setNewAward] = useState<Partial<Award>>({
        name: '',
        description: '',
        icon_url: 'pioneer_medal',
        category: 'performance',
        rarity: 'common'
    });

    // Form states for GRANT AWARD
    const [grantForm, setGrantForm] = useState({
        userQuery: '',
        selectedUser: null as PlayerProfile | null,
        selectedAwardId: '',
        season: 'Temporada 2025',
        comment: ''
    });

    const [userResults, setUserResults] = useState<PlayerProfile[]>([]);

    useEffect(() => {
        fetchAwards();
    }, []);

    useEffect(() => {
        if (grantForm.userQuery.length >= 3) {
            searchUsers(grantForm.userQuery);
        }
    }, [grantForm.userQuery]);

    const fetchAwards = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('awards')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAwards(data || []);
        } catch (err) {
            console.error('Error fetching awards:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async (query: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;
            setUserResults(data || []);
        } catch (err) {
            console.error('Error searching users:', err);
        }
    };

    const handleCreateAward = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('awards')
                .insert(newAward);

            if (error) throw error;
            alert('Premio creado con éxito');
            fetchAwards();
            setNewAward({
                name: '',
                description: '',
                icon_url: 'pioneer_medal',
                category: 'performance',
                rarity: 'common'
            });
        } catch (err: any) {
            alert('Error al crear premio: ' + err.message);
        }
    };

    const handleGrantAward = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!grantForm.selectedUser || !grantForm.selectedAwardId) return;

        try {
            const { error } = await supabase
                .from('user_awards')
                .insert({
                    user_id: grantForm.selectedUser.id,
                    award_id: grantForm.selectedAwardId,
                    season: grantForm.season,
                    comment: grantForm.comment
                });

            if (error) throw error;
            alert(`Premio otorgado a ${grantForm.selectedUser?.username || 'jugador'}`);
            setShowGrantModal(false);
            setGrantForm({
                userQuery: '',
                selectedUser: null,
                selectedAwardId: '',
                season: 'Temporada 2025',
                comment: ''
            });
        } catch (err: any) {
            alert('Error al otorgar premio: ' + err.message);
        }
    };

    const handleDeleteAward = async (id: string) => {
        if (!window.confirm('¿Eliminar este premio? Se borrará de todos los usuarios que lo tengan.')) return;
        try {
            const { error } = await supabase.from('awards').delete().eq('id', id);
            if (error) throw error;
            fetchAwards();
        } catch (err: any) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Gestor de Premios y Logros</h1>
                    <p className="text-slate-400 mt-2">Configura los reconocimientos oficiales de la liga.</p>
                </div>
                <button
                    onClick={() => setShowGrantModal(true)}
                    className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105"
                >
                    🎖️ OTORGAR PREMIO A JUGADOR
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Create Award Form */}
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Nuevo Premio</h2>
                    <form onSubmit={handleCreateAward} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nombre</label>
                            <input
                                required
                                value={newAward.name}
                                onChange={e => setNewAward({ ...newAward, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                placeholder="Ej: Maestro de Pioneer"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Descripción</label>
                            <textarea
                                value={newAward.description}
                                onChange={e => setNewAward({ ...newAward, description: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none h-24"
                                placeholder="¿Por qué se otorga este premio?"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Categoría</label>
                                <select
                                    title="Categoría de premio"
                                    value={newAward.category}
                                    onChange={e => setNewAward({ ...newAward, category: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                                >
                                    <option value="performance">Rendimiento</option>
                                    <option value="community">Comunidad</option>
                                    <option value="special">Especial</option>
                                    <option value="judge">Juez</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Rareza</label>
                                <select
                                    title="Rareza de premio"
                                    value={newAward.rarity}
                                    onChange={e => setNewAward({ ...newAward, rarity: e.target.value as any })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                                >
                                    <option value="common">Común</option>
                                    <option value="rare">Raro</option>
                                    <option value="epic">Épico</option>
                                    <option value="legendary">Legendario</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Icono (Slug)</label>
                            <select
                                title="Icono de premio"
                                value={newAward.icon_url}
                                onChange={e => setNewAward({ ...newAward, icon_url: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                            >
                                <option value="pioneer_medal">Medalla Pionero</option>
                                <option value="national_trophy">Trofeo Nacional</option>
                                <option value="store_champ">Campeón de Tienda</option>
                                <option value="judge_shield">Escudo de Juez</option>
                                <option value="community_heart">Corazón de Comunidad</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl border border-slate-700 transition-all">
                            CREAR PREMIO
                        </button>
                    </form>
                </section>

                {/* Awards List */}
                <section className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Catálogo de Premios</h2>
                        <button
                            title="Refrescar catálogo"
                            onClick={fetchAwards}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <RefreshCwIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center text-slate-600 animate-pulse font-black uppercase tracking-widest">Cargando catálogo...</div>
                    ) : awards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {awards.map(award => (
                                <div key={award.id} className="bg-slate-950 border border-slate-800 p-4 rounded-3xl flex items-center gap-6 group relative overflow-hidden">
                                    <div className="flex-shrink-0">
                                        <AwardBadge award={award} size="sm" showTooltip={false} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-black uppercase tracking-tighter truncate">{award.name}</h4>
                                        <p className="text-[10px] text-slate-500 font-mono mt-1 select-all">{award.id}</p>
                                        <p className="text-slate-400 text-xs line-clamp-1 mt-1">{award.description}</p>
                                    </div>
                                    <button
                                        title="Eliminar premio"
                                        onClick={() => handleDeleteAward(award.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-600 border-2 border-dashed border-slate-800 rounded-2xl">
                            No hay premios definidos.
                        </div>
                    )}
                </section>
            </div>

            {/* Grant Award Modal */}
            {showGrantModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-8 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Otorgar Premio</h2>
                                <p className="text-slate-400 font-medium">Busca un jugador y asigna un reconocimiento.</p>
                            </div>
                            <button onClick={() => setShowGrantModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>

                        <form onSubmit={handleGrantAward} className="space-y-6">
                            {/* Player Search */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Buscar Jugador (Username o Nombre)</label>
                                <input
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="Mínimo 3 caracteres..."
                                    value={grantForm.userQuery}
                                    onChange={e => setGrantForm({ ...grantForm, userQuery: e.target.value })}
                                />
                                {userResults.length > 0 && !grantForm.selectedUser && (
                                    <div className="mt-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                                        {userResults.map(user => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => setGrantForm({ ...grantForm, selectedUser: user, userQuery: user.username })}
                                                className="w-full p-4 text-left hover:bg-slate-900 flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-white font-bold">{user.first_name || ''} {user.last_name || ''}</p>
                                                    <p className="text-slate-500 text-xs">@{user.username || 'sin-username'}</p>
                                                </div>
                                                <span className="text-sky-400 text-xs font-black">SELECCIONAR</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {grantForm.selectedUser && (
                                    <div className="mt-2 p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center font-bold text-white">
                                                {grantForm.selectedUser?.username?.charAt(0) || '?'}
                                            </div>
                                            <p className="text-white font-bold">Seleccionado: {grantForm.selectedUser?.username || 'Jugador'}</p>
                                        </div>
                                        <button onClick={() => setGrantForm({ ...grantForm, selectedUser: null })} className="text-[10px] font-black text-red-400 hover:underline">CAMBIAR</button>
                                    </div>
                                )}
                            </div>

                            {/* Award Selection */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Premio a Otorgar</label>
                                <select
                                    title="Seleccionar premio"
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                                    value={grantForm.selectedAwardId}
                                    onChange={e => setGrantForm({ ...grantForm, selectedAwardId: e.target.value })}
                                >
                                    <option value="">Selecciona un premio...</option>
                                    {awards.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.rarity})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Temporada</label>
                                    <input
                                        title="Nombre de la temporada"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                                        value={grantForm.season}
                                        onChange={e => setGrantForm({ ...grantForm, season: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Comentario (Opcional)</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                                        placeholder="Ej: Rank 1 Global"
                                        value={grantForm.comment}
                                        onChange={e => setGrantForm({ ...grantForm, comment: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!grantForm.selectedUser || !grantForm.selectedAwardId}
                                className="w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-950 font-black rounded-2xl shadow-2xl disabled:opacity-50 disabled:grayscale transition-all transform hover:scale-[1.02]"
                            >
                                CONFIRMAR ENTREGA
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAwardsPage;
