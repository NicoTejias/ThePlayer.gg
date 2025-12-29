import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EmailConfirmationPage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const confirmEmail = async () => {
            try {
                // Supabase maneja la confirmación automáticamente via URL
                // Solo necesitamos verificar el estado de la sesión
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    setStatus('error');
                    setMessage('Error al confirmar email. El link puede haber expirado.');
                    return;
                }

                if (session) {
                    setStatus('success');
                    setMessage('¡Email confirmado exitosamente!');
                    setTimeout(() => navigate('/'), 3000);
                } else {
                    setStatus('error');
                    setMessage('No se pudo confirmar el email. Intenta nuevamente.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Error inesperado al confirmar email.');
            }
        };

        confirmEmail();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-xl p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-xl font-bold text-white mb-2">Confirmando email...</h2>
                        <p className="text-slate-400">Por favor espera un momento</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">¡Email Confirmado!</h2>
                        <p className="text-slate-400 mb-4">{message}</p>
                        <p className="text-sm text-slate-500">Redirigiendo a la página principal...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Error de Confirmación</h2>
                        <p className="text-slate-400 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                        >
                            Volver al Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmailConfirmationPage;
