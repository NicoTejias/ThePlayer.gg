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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
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

    const handleAction = async (id: string, action: 'approve' | 'reject', userId: string) => {
        try {
            const newStatus = action === 'approve' ? 'approved' : 'rejected';

            // 1. Update Application Status
            const { error: appError } = await supabase
                .from('content_creator_applications')
                .update({ status: newStatus })
                .eq('id', id);

            if (appError) throw appError;

            // 2. If approved, update user role ONLY if they are currently just a 'player'
            if (action === 'approve') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                if (profile && profile.role === 'player') {
                    const { error: roleError } = await supabase
                        .from('profiles')
                        .update({ role: 'content_creator' })
                        .eq('id', userId);

                    if (roleError) console.error("Error updating role:", roleError);
                }
            }

            toast.success(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} correctamente`);
            fetchApplications();

        } catch (error: any) {
            console.error('Error processing application:', error);
            toast.error('Error al procesar solicitud: ' + error.message);
        }
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

            <div className="space-y-6">
                {applications.length === 0 ? (
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center text-slate-400">
                        <ClipBoardListIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay solicitudes pendientes o históricas.</p>
                    </div>
                ) : (
                    applications.map((app) => (
                        <div key={app.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
                            {/* Header Status Bar */}
                            <div className={`px-6 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center ${app.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500' :
                                    app.status === 'approved' ? 'bg-green-900/30 text-green-500' :
                                        'bg-red-900/30 text-red-500'
                                }`}>
                                <span>Estado: {app.status === 'pending' ? 'Pendiente' : app.status === 'approved' ? 'Aprobado' : 'Rechazado'}</span>
                                <span className="opacity-75">{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="p-6 grid lg:grid-cols-3 gap-6">
                                {/* Applicant Profile */}
                                <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-700 pb-6 lg:pb-0 lg:pr-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-slate-700 rounded-full overflow-hidden">
                                            {app.profiles?.avatar_url ? (
                                                <img src={app.profiles.avatar_url} alt={app.profiles.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{app.profiles?.username || 'Usuario Desconocido'}</h3>
                                            <p className="text-slate-400 text-sm">{app.profiles?.email}</p>
                                        </div>
                                    </div>

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

                                {/* Answers & Content */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-bold text-slate-400 text-xs uppercase mb-1">Tipo de Contenido</h4>
                                            <div className="flex gap-2">
                                                {app.content_type.map(type => (
                                                    <span key={type} className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
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
                                                onClick={() => handleAction(app.id, 'reject', app.applicant_id)}
                                                className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                Rechazar
                                            </button>
                                            <button
                                                onClick={() => handleAction(app.id, 'approve', app.applicant_id)}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-colors"
                                            >
                                                Aprobar Solicitud
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ContentCreatorsAdminPage;
