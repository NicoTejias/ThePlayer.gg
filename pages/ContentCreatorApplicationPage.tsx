import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';

const ContentCreatorApplicationPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        portfolioUrl: '',
        youtube: '',
        instagram: '',
        twitter: '',
        twitch: '',
        contentType: [] as string[],
        sampleWork1: '',
        sampleWork2: '',
        sampleWork3: '',
        motivation: '',
        experience: ''
    });

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            toast.error('Debes iniciar sesión para aplicar');
            navigate('/auth');
            return;
        }

        setUser(user);

        // Check if user has already applied
        const { data: application } = await supabase
            .from('content_creator_applications')
            .select('*')
            .eq('applicant_id', user.id)
            .maybeSingle();

        if (application) {
            setHasApplied(true);
        }

        setLoading(false);
    };

    const handleContentTypeChange = (type: string) => {
        setFormData(prev => ({
            ...prev,
            contentType: prev.contentType.includes(type)
                ? prev.contentType.filter(t => t !== type)
                : [...prev.contentType, type]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.contentType.length === 0) {
            toast.error('Selecciona al menos un tipo de contenido');
            return;
        }

        setSubmitting(true);

        try {
            const sampleWorkUrls = [
                formData.sampleWork1,
                formData.sampleWork2,
                formData.sampleWork3
            ].filter(url => url.trim() !== '');

            const socialMediaLinks = {
                youtube: formData.youtube,
                instagram: formData.instagram,
                twitter: formData.twitter,
                twitch: formData.twitch
            };

            const { error } = await supabase
                .from('content_creator_applications')
                .insert({
                    applicant_id: user.id,
                    portfolio_url: formData.portfolioUrl || null,
                    social_media_links: socialMediaLinks,
                    content_type: formData.contentType,
                    sample_work_urls: sampleWorkUrls,
                    motivation: formData.motivation,
                    experience: formData.experience
                });

            if (error) {
                throw error;
            }

            toast.success('¡Solicitud enviada! Te contactaremos pronto.');
            setHasApplied(true);

        } catch (error: any) {
            console.error('Error submitting application:', error);
            toast.error('Error al enviar solicitud', {
                description: error.message || 'Intenta nuevamente más tarde.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (hasApplied) {
        return (
            <div className="max-w-2xl mx-auto text-center py-16">
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Solicitud Enviada</h2>
                    <p className="text-slate-400 mb-6">
                        Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por email cuando tengamos una respuesta.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            {/* Hero Section */}
            <section className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Únete como Creador de Contenido
                </h1>
                <p className="text-xl text-slate-400">
                    Comparte tu pasión por los TCG con la comunidad más grande de Chile
                </p>
            </section>

            {/* Benefits Grid */}
            <section className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Publica Artículos</h3>
                    <p className="text-slate-400 text-sm">
                        Comparte estrategias, análisis de meta, y guías para la comunidad
                    </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-purple-500 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Sube Videos</h3>
                    <p className="text-slate-400 text-sm">
                        Tutoriales, gameplays, y contenido exclusivo para jugadores
                    </p>
                </div>

                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-yellow-500 transition-colors">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Haz crecer tu audiencia</h3>
                    <p className="text-slate-400 text-sm">
                        Alcanza miles de jugadores activos en toda Latinoamérica
                    </p>
                </div>
            </section>

            {/* Requirements */}
            <section className="bg-slate-800 rounded-xl p-8 mb-12 border border-slate-700">
                <h2 className="text-2xl font-bold mb-6 text-white">Requisitos</h2>
                <ul className="space-y-3 text-slate-300">
                    <li className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Experiencia creando contenido relacionado con TCG</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Portfolio o muestras de trabajo previo</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Compromiso de calidad y consistencia en las publicaciones</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Respetar los lineamientos de la comunidad</span>
                    </li>
                </ul>
            </section>

            {/* Application Form */}
            <section className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h2 className="text-2xl font-bold mb-6 text-white">Formulario de Solicitud</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Portfolio URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Portfolio / Sitio Web (Opcional)
                        </label>
                        <input
                            type="url"
                            value={formData.portfolioUrl}
                            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                            placeholder="https://tu-portfolio.com"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Social Media */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Redes Sociales
                        </label>
                        <div className="grid md:grid-cols-2 gap-4">
                            <input
                                type="url"
                                value={formData.youtube}
                                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                                placeholder="YouTube Channel URL"
                                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={formData.instagram}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                placeholder="Instagram URL"
                                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={formData.twitter}
                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                placeholder="Twitter/X URL"
                                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={formData.twitch}
                                onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
                                placeholder="Twitch URL"
                                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Content Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Tipo de Contenido *
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.contentType.includes('articles')}
                                    onChange={() => handleContentTypeChange('articles')}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-300">Artículos</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.contentType.includes('videos')}
                                    onChange={() => handleContentTypeChange('videos')}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-300">Videos</span>
                            </label>
                        </div>
                    </div>

                    {/* Sample Work */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Muestras de Trabajo (URLs)
                        </label>
                        <div className="space-y-3">
                            <input
                                type="url"
                                value={formData.sampleWork1}
                                onChange={(e) => setFormData({ ...formData, sampleWork1: e.target.value })}
                                placeholder="Muestra 1 (requerida)"
                                required
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={formData.sampleWork2}
                                onChange={(e) => setFormData({ ...formData, sampleWork2: e.target.value })}
                                placeholder="Muestra 2 (opcional)"
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="url"
                                value={formData.sampleWork3}
                                onChange={(e) => setFormData({ ...formData, sampleWork3: e.target.value })}
                                placeholder="Muestra 3 (opcional)"
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Motivation */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            ¿Por qué quieres ser creador en ThePlayer.gg? *
                        </label>
                        <textarea
                            value={formData.motivation}
                            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                            rows={4}
                            required
                            placeholder="Cuéntanos tu motivación..."
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Experiencia en TCG y Creación de Contenido *
                        </label>
                        <textarea
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            rows={4}
                            required
                            placeholder="Describe tu experiencia..."
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {submitting && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        )}
                        {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </form>
            </section>
        </div>
    );
};

export default ContentCreatorApplicationPage;
