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

interface MonetizationConfig {
    isMonetized: boolean;
    paymentMethod: string;
    paymentRate: string;
    paymentFrequency: string;
    bankName: string;
    bankAccountType: string;
    bankAccountNumber: string;
    bankRut: string;
    notes: string;
}

const ContentCreatorsAdminPage: React.FC = () => {
    const [applications, setApplications] = useState<CreatorApplication[]>([]);
    const [registeredCreators, setRegisteredCreators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Modal de monetización
    const [showMonetizationModal, setShowMonetizationModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);
    const [monetizationConfig, setMonetizationConfig] = useState<MonetizationConfig>({
        isMonetized: false,
        paymentMethod: 'transfer',
        paymentRate: '',
        paymentFrequency: 'per_content',
        bankName: '',
        bankAccountType: 'cuenta_corriente',
        bankAccountNumber: '',
        bankRut: '',
        notes: ''
    });

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
                .eq('role', 'content_creator')
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

    // Abrir modal de aprobación con monetización
    const handleOpenApproveModal = (app: CreatorApplication) => {
        setSelectedApplication(app);
        setMonetizationConfig({
            isMonetized: false,
            paymentMethod: 'transfer',
            paymentRate: '',
            paymentFrequency: 'per_content',
            bankName: '',
            bankAccountType: 'cuenta_corriente',
            bankAccountNumber: '',
            bankRut: '',
            notes: ''
        });
        setShowMonetizationModal(true);
    };

    // Confirmar aprobación con o sin monetización
    const handleConfirmApproval = async () => {
        if (!selectedApplication) return;

        try {
            const { id, applicant_id } = selectedApplication;

            // 1. Update Application Status
            const appUpdateData: any = { status: 'approved' };

            if (monetizationConfig.isMonetized) {
                appUpdateData.is_monetized = true;
                appUpdateData.payment_method = monetizationConfig.paymentMethod;
                appUpdateData.payment_rate = parseFloat(monetizationConfig.paymentRate) || 0;
                appUpdateData.payment_frequency = monetizationConfig.paymentFrequency;
                appUpdateData.payment_notes = monetizationConfig.notes;
                appUpdateData.bank_name = monetizationConfig.bankName;
                appUpdateData.bank_account_type = monetizationConfig.bankAccountType;
                appUpdateData.bank_account_number = monetizationConfig.bankAccountNumber;
                appUpdateData.bank_rut = monetizationConfig.bankRut;
            }

            const { error: appError } = await supabase
                .from('content_creator_applications')
                .update(appUpdateData)
                .eq('id', id);

            if (appError) throw appError;

            // 2. Update user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', applicant_id)
                .single();

            const profileUpdateData: any = {};

            if (profile && profile.role === 'player') {
                profileUpdateData.role = 'content_creator';
            }

            if (monetizationConfig.isMonetized) {
                profileUpdateData.is_monetized = true;
                profileUpdateData.payment_method = monetizationConfig.paymentMethod;
                profileUpdateData.payment_rate = parseFloat(monetizationConfig.paymentRate) || 0;
                profileUpdateData.payment_frequency = monetizationConfig.paymentFrequency;
                profileUpdateData.bank_name = monetizationConfig.bankName;
                profileUpdateData.bank_account_type = monetizationConfig.bankAccountType;
                profileUpdateData.bank_account_number = monetizationConfig.bankAccountNumber;
                profileUpdateData.bank_rut = monetizationConfig.bankRut;
            }

            if (Object.keys(profileUpdateData).length > 0) {
                const { error: roleError } = await supabase
                    .from('profiles')
                    .update(profileUpdateData)
                    .eq('id', applicant_id);

                if (roleError) console.error("Error updating profile:", roleError);
            }

            toast.success('Creador aprobado correctamente' + (monetizationConfig.isMonetized ? ' con monetización' : ''));
            setShowMonetizationModal(false);
            setSelectedApplication(null);
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
                                                        onClick={() => handleReject(app.id)}
                                                        className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 rounded-lg text-sm font-bold transition-colors"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenApproveModal(app)}
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

            {/* Modal de Monetización */}
            {showMonetizationModal && selectedApplication && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-700">
                            <h3 className="text-xl font-bold text-white">Aprobar Creador de Contenido</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Configura las opciones de monetización para {selectedApplication.profiles?.username}
                            </p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Toggle Monetización */}
                            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
                                <div>
                                    <p className="font-bold text-white">¿Habilitar Monetización?</p>
                                    <p className="text-slate-500 text-sm">El creador podrá recibir pagos por su contenido</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMonetizationConfig(prev => ({ ...prev, isMonetized: !prev.isMonetized }))}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${monetizationConfig.isMonetized ? 'bg-green-600' : 'bg-slate-600'}`}
                                    aria-label={monetizationConfig.isMonetized ? 'Deshabilitar monetización' : 'Habilitar monetización'}
                                    title={monetizationConfig.isMonetized ? 'Deshabilitar monetización' : 'Habilitar monetización'}
                                >
                                    <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${monetizationConfig.isMonetized ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Formulario de Monetización */}
                            {monetizationConfig.isMonetized && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-slate-400 text-sm mb-1">Método de Pago</label>
                                            <select
                                                value={monetizationConfig.paymentMethod}
                                                onChange={e => setMonetizationConfig(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                title="Seleccionar método de pago"
                                                aria-label="Método de pago"
                                            >
                                                <option value="transfer">Transferencia Bancaria</option>
                                                <option value="paypal">PayPal</option>
                                                <option value="crypto">Criptomonedas</option>
                                                <option value="other">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 text-sm mb-1">Frecuencia</label>
                                            <select
                                                value={monetizationConfig.paymentFrequency}
                                                onChange={e => setMonetizationConfig(prev => ({ ...prev, paymentFrequency: e.target.value }))}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                title="Seleccionar frecuencia de pago"
                                                aria-label="Frecuencia de pago"
                                            >
                                                <option value="per_content">Por contenido</option>
                                                <option value="weekly">Semanal</option>
                                                <option value="monthly">Mensual</option>
                                                <option value="per_view">Por visualizaciones</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Tarifa (CLP)</label>
                                        <input
                                            type="number"
                                            value={monetizationConfig.paymentRate}
                                            onChange={e => setMonetizationConfig(prev => ({ ...prev, paymentRate: e.target.value }))}
                                            placeholder="Ej: 50000"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                        />
                                    </div>

                                    {monetizationConfig.paymentMethod === 'transfer' && (
                                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                            <h4 className="font-bold text-slate-300 text-sm uppercase">Datos Bancarios</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-1">Banco</label>
                                                    <select
                                                        value={monetizationConfig.bankName}
                                                        onChange={e => setMonetizationConfig(prev => ({ ...prev, bankName: e.target.value }))}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                        title="Seleccionar banco"
                                                        aria-label="Banco"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="banco_estado">Banco Estado</option>
                                                        <option value="banco_chile">Banco de Chile</option>
                                                        <option value="santander">Santander</option>
                                                        <option value="bci">BCI</option>
                                                        <option value="scotiabank">Scotiabank</option>
                                                        <option value="itau">Itaú</option>
                                                        <option value="falabella">Banco Falabella</option>
                                                        <option value="mercado_pago">Mercado Pago</option>
                                                        <option value="mach">MACH</option>
                                                        <option value="tenpo">Tenpo</option>
                                                        <option value="otro">Otro</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-1">Tipo de Cuenta</label>
                                                    <select
                                                        value={monetizationConfig.bankAccountType}
                                                        onChange={e => setMonetizationConfig(prev => ({ ...prev, bankAccountType: e.target.value }))}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                        title="Seleccionar tipo de cuenta"
                                                        aria-label="Tipo de cuenta bancaria"
                                                    >
                                                        <option value="cuenta_corriente">Cuenta Corriente</option>
                                                        <option value="cuenta_vista">Cuenta Vista</option>
                                                        <option value="cuenta_rut">Cuenta RUT</option>
                                                        <option value="chequera_electronica">Chequera Electrónica</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-1">N° de Cuenta</label>
                                                    <input
                                                        type="text"
                                                        value={monetizationConfig.bankAccountNumber}
                                                        onChange={e => setMonetizationConfig(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                                                        placeholder="123456789"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-slate-400 text-sm mb-1">RUT</label>
                                                    <input
                                                        type="text"
                                                        value={monetizationConfig.bankRut}
                                                        onChange={e => setMonetizationConfig(prev => ({ ...prev, bankRut: e.target.value }))}
                                                        placeholder="12.345.678-9"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-slate-400 text-sm mb-1">Notas (interno)</label>
                                        <textarea
                                            value={monetizationConfig.notes}
                                            onChange={e => setMonetizationConfig(prev => ({ ...prev, notes: e.target.value }))}
                                            placeholder="Notas internas sobre el acuerdo..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white h-20 resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-700 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowMonetizationModal(false);
                                    setSelectedApplication(null);
                                }}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmApproval}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg transition-colors"
                            >
                                {monetizationConfig.isMonetized ? '✓ Aprobar con Monetización' : '✓ Aprobar sin Monetización'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentCreatorsAdminPage;
