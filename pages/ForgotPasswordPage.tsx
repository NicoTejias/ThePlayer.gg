import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            setError('Error al enviar email. Verifica que el email sea correcto.');
        } else {
            setSent(true);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
                    <p className="text-slate-400">
                        {!sent
                            ? 'Ingresa tu email y te enviaremos un link para restablecer tu contraseña'
                            : 'Revisa tu bandeja de entrada'
                        }
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                                <p className="text-sm text-red-400">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            )}
                            {loading ? 'Enviando...' : 'Enviar Link de Recuperación'}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/auth"
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                ← Volver al login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Email Enviado</h2>
                            <p className="text-slate-400 mb-4">
                                Hemos enviado un link de recuperación a <strong className="text-white">{email}</strong>
                            </p>
                            <p className="text-sm text-slate-500">
                                El link expira en 1 hora. Si no ves el email, revisa tu carpeta de spam.
                            </p>
                        </div>
                        <Link
                            to="/auth"
                            className="inline-block px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Volver al Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
