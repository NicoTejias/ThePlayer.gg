import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ClipBoardListIcon from '../../components/icons/ClipboardListIcon';

interface CreatorApplication {
    id: string;
    applicant_id: string;
    portfolio_url: string | null;
    social_media_links: {
        youtube?: string;
        instagram?: string;
        twitter?: string;
        twitch?: string;
    };
    content_type: string[];
    sample_work_urls: string[];
    motivation: string;
    experience: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    profiles?: {
        username: string;
        email: string;
        avatar_url: string;
    };
}



const ContentCreatorsAdminPage: React.FC = () => {
    const [applications, setApplications] = useState<CreatorApplication[]>([]);
    const [registeredCreators, setRegisteredCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modal de monetización (Eliminado del admin por solicitud de usuario)
    const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);

    const [expandedApps, setExpandedApps] = useState<string[]>([]);

    useEffect(() => {
        const loadPageData = async () => {
            setLoading(true);
            await Promise.all([
                fetchApplications(),
                fetchRegisteredCreators()
            ]);
            setLoading(false);
        };
        loadPageData();
    }, []);

    const fetchRegisteredCreators = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or('role.eq.content_creator,is_content_creator.eq.true')
                .order('username', { ascending: true });

            if (error) throw error;
            setRegisteredCreators(data || []);
        } catch (error) {
            console.error('Error fetching registered creators:', error);
            toast.error('Error al cargar creadores registrados');
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            const { data, error } = await supabase
                .from('content_creator_applications')
                .select(`
                    *,
                    profiles:applicant_id (
                        username,
                        email,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setApplications(data || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    // Confirmar aprobación
    const handleApprove = async (app: CreatorApplication) => {
        if (!confirm(`¿Estás seguro de aprobar a ${app.profiles?.username} como creador de contenido?`)) return;

        try {
            const { id } = app;

            // Use secure RPC to update both Application and Profile in one transaction
            const { error } = await supabase.rpc('approve_content_creator', {
                application_id: id
            });

            if (error) throw error;

            toast.success('Creador aprobado correctamente. Ahora puede configurar su monetización desde su perfil.');
            fetchApplications();
            fetchRegisteredCreators();

        } catch (error: any) {
            console.error('Error approving application:', error);
            toast.error('Error al aprobar solicitud: ' + error.message);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return;

        try {
            const { error } = await supabase
                .from('content_creator_applications')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;

            toast.success('Solicitud rechazada');
            fetchApplications();
        } catch (error: any) {
            console.error('Error rejecting application:', error);
            toast.error('Error al rechazar: ' + error.message);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedApps(prev =>
            prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">Gestión de Creadores</h1>
                    <p className="text-slate-400 mt-1">Revisa y aprueba solicitudes de creadores de contenido</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                    ← Volver al Panel
                </button>
            </div>

            <div className="space-y-12">
                {/* Applications Section */}
                <section>
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <ClipBoardListIcon className="w-5 h-5 text-sky-400" />
                        Solicitudes Pendientes e Historial
                    </h2>
                    <div className="space-y-6">
                        {applications.length === 0 ? (
                            <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                                <ClipBoardListIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No hay solicitudes pendientes o históricas.</p>
                            </div>
                        ) : (
                            applications.map((app) => {
                                const isExpanded = expandedApps.includes(app.id);
                                return (
                                    <div key={app.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg transition-all duration-300">
                                        {/* Simplified Header / Summary Line */}
                                        <div
                                            className={`px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors ${isExpanded ? 'border-b border-slate-700' : ''}`}
                                            onClick={() => toggleExpand(app.id)}
                                        >
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
                                                    {app.profiles?.avatar_url ? (
                                                        <img src={app.profiles.avatar_url} alt={app.profiles.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-lg">?</div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-white truncate">{app.profiles?.username || 'Usuario Desconocido'}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                                            app.status === 'approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                                'bg-red-500/10 text-red-500 border border-red-500/20'
                                                            }`}>
                                                            {app.status === 'pending' ? 'Pendiente' : app.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold">{new Date(app.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="hidden md:flex gap-2">
                                                    {app.content_type.map(type => (
                                                        <span key={type} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-700 uppercase font-bold">
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className={`p-2 rounded-full bg-slate-700/50 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Details Section (Collapsible) */}
                                        {isExpanded && (
                                            <div className="p-6 grid lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                                                {/* Left: Metadata */}
                                                <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-700 pb-6 lg:pb-0 lg:pr-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="font-bold text-slate-400 text-xs uppercase mb-2">Email de Contacto</h4>
                                                            <p className="text-white text-sm truncate">{app.profiles?.email}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-300 text-sm uppercase mb-2">Redes Sociales</h4>
                                                            <ul className="space-y-2 text-sm text-sky-400">
                                                                {Object.entries(app.social_media_links || {}).map(([platform, url]) => (
                                                                    url && (
                                                                        <li key={platform}>
                                                                            <a href={url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-2 capitalize">
                                                                                <span>🔗</span> {platform}
                                                                            </a>
                                                                        </li>
                                                                    )
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-400 text-xs uppercase mb-1">Portfolio</h4>
                                                            {app.portfolio_url ? (
                                                                <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline text-sm truncate block">
                                                                    {app.portfolio_url}
                                                                </a>
                                                            ) : <span className="text-slate-500 text-sm">No provisto</span>}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Content Answers */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <div>
                                                        <h4 className="font-bold text-slate-400 text-xs uppercase mb-1">Motivación</h4>
                                                        <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                                            {app.motivation}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-slate-400 text-xs uppercase mb-1">Experiencia</h4>
                                                        <p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                                            {app.experience}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-slate-400 text-xs uppercase mb-2">Muestras de Trabajo</h4>
                                                        <div className="space-y-1">
                                                            {app.sample_work_urls.map((url, idx) => (
                                                                <a key={idx} href={url} target="_blank" rel="noreferrer" className="block text-sky-400 hover:underline text-sm truncate">
                                                                    • {url}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    {app.status === 'pending' && (
                                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleReject(app.id); }}
                                                                className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors"
                                                            >
                                                                Rechazar
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleApprove(app); }}
                                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-colors"
                                                            >
                                                                Aprobar Solicitud
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Registered Creators Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="text-xl">🎬</span>
                            Creadores Registrados
                        </h2>
                        <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-bold text-sky-400 border border-slate-700">
                            {registeredCreators.length} Creadores
                        </span>
                    </div>

                    {registeredCreators.length === 0 ? (
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                            <p>No hay creadores registrados todavía.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {registeredCreators.map((creator) => (
                                <div key={creator.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-sky-500/50 transition-all group shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-sky-500 transition-colors">
                                            {creator.avatar_url ? (
                                                <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl font-bold">
                                                    {creator.username?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white truncate">{creator.username || 'Desconocido'}</h3>
                                            <p className="text-xs text-slate-400 truncate">{creator.email}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            {creator.is_monetized ? (
                                                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-900/50 font-bold uppercase">
                                                    💰 Monetizado
                                                </span>
                                            ) : (
                                                <span className="text-[10px] bg-sky-900/30 text-sky-400 px-2 py-0.5 rounded border border-sky-900/50 font-bold uppercase">
                                                    Activo
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => navigate(`/seller/${creator.id}`)}
                                            className="text-xs text-slate-500 hover:text-white transition-colors"
                                            title="Ver Perfil Público"
                                        >
                                            Ver Perfil →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

        </div>
    );
};

export default ContentCreatorsAdminPage;
