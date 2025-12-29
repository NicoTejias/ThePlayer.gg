import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleIcon from '../components/icons/GoogleIcon';
import TermsModal from '../components/TermsModal';
import { supabase } from '../supabaseClient';

const playerTerms = `Términos y Condiciones para Jugadores:

1.  **Aceptación de Visibilidad:** Al registrarte, aceptas que tu nombre de usuario y resultados de torneos sean públicos en los rankings y perfiles del sitio.
2.  **Código de Conducta:** Te comprometes a mantener un comportamiento deportivo, respetuoso y libre de acoso en todos los eventos asociados y dentro de la plataforma digital theplayer.gg.
3.  **Veracidad de la Información:** Eres el único responsable de que la información proporcionada en tu perfil sea verídica y esté actualizada.
4.  **Responsabilidad en el Mercado TCG:** Todas las transacciones (compra, venta o cambio) realizadas a través del Mercado TCG son de tu exclusiva responsabilidad. theplayer.gg actúa únicamente como un tablero de anuncios y no interviene ni se responsabiliza por las transacciones.
5.  **Sanciones:** El incumplimiento de estas normas, así como de las reglas específicas de cada torneo, puede resultar en sanciones que van desde advertencias hasta la suspensión permanente de tu cuenta.`;

const storeTerms = `Términos y Condiciones para Tiendas/Organizadores en theplayer.gg

1. Procedimiento de registro y contratación
La TIENDA/ORGANIZADOR reconoce y acepta que el proceso de alta en theplayer.gg implica la entrega de datos verídicos y actualizados, el consentimiento digital de estos términos, y la selección de modalidad de contratación (mensual o anual). La activación de membresía estará sujeta al pago íntegro de la primera cuota/mensualidad, según la modalidad elegida, utilizando los medios habilitados en la plataforma. El registro se considerará formalizado al recibir correo de confirmación.

2. Obligaciones de reporte de torneos
La TIENDA/ORGANIZADOR se obliga a reportar todos los torneos realizados a través de los formularios HTML y/o herramientas integradas (incluyendo EventLink y co-organizadores) en theplayer.gg, siguiendo el formato y plazo indicado por la plataforma. El incumplimiento reiterado podrá suponer suspensión temporal de la cuenta.

3. Condiciones de facturación y pagos y política ante impagos
La facturación se realizará en modalidad mensual o anual conforme selección; los cargos son anticipados. El impago de cuotas resultará en suspensión automática de servicios hasta regularización y el cobro de intereses de mora conforme a lo dispuesto por la ley chilena. La TIENDA/ORGANIZADOR reconoce que el pago anual no es reembolsable bajo ninguna circunstancia.

4. Permiso de auditorías
La TIENDA/ORGANIZADOR autoriza a theplayer.gg a efectuar auditorías periódicas, presenciales y/o digitales, sobre el uso de la plataforma, registro de torneos y cumplimiento de reglas, previa notificación digital.

5. Beneficios de membresía
La membresía otorga acceso a herramientas para gestión y reporte de torneos, estadísticas avanzadas, capacitación, recursos para co-organización, diferenciación en rankings, y acceso prioritario a eventos y nuevos servicios de theplayer.gg.

6. Políticas de alta/baja y no devolución en pago anual
La baja voluntaria podrá gestionarse digitalmente en cualquier momento. No habrá reembolso de cuotas pagadas, especialmente en modalidad anual. El alta está sujeta a validaciones posteriores y aceptación de estos términos.

7. Resolución de disputas y reclamos por resultados/rankings
Las disputas sobre resultados de torneos y rankings oficiales deben presentarse mediante la vía digital establecida, acompañando las evidencias pertinentes. Theplayer.gg resolverá en un plazo de 15 días hábiles. Su veredicto será inapelable y vinculante para ambas partes.

8. Cláusulas de suspensión, penalización o exclusión por fraude o alteración de datos
Cualquier intento de fraude, manipulación de resultados, alteración de datos o incumplimiento grave supondrá la suspensión inmediata, pérdida de beneficios y posible exclusión definitiva, sin devolución de pagos ya realizados. Theplayer.gg se reserva el derecho de informar a otras plataformas y comunidades sobre conductas sancionadas.

Aceptación digital
La aceptación y vigencia de este contrato se materializa mediante la activación de la cuenta en theplayer.gg y la marcación de la opción "Acepto los Términos y Condiciones y el EULA" en el proceso de registro digital, conforme lo establecido en la Ley N° 19.799 sobre documentos y firmas electrónicas en Chile.
`;


interface AuthPageProps {
    handleLogin: (role: 'player' | 'store' | 'admin') => void;
}


const AuthPage: React.FC<AuthPageProps> = ({ handleLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
    const [role, setRole] = useState<'player' | 'store'>('player');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [resetEmailSent, setResetEmailSent] = useState(false);

    const commonInputClass = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200";
    const commonButtonClass = "w-full py-3 px-4 font-bold rounded-lg transition duration-300";

    const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setAuthError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const { data: { user }, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.error("Error fetching profile on login:", profileError);
                    handleLogin('player');
                } else {
                    handleLogin(profile.role as 'player' | 'store' | 'admin');
                }
            }
        } catch (error: any) {
            console.error('Login error:', error);
            // Mejorar mensajes de error
            let errorMessage = 'Error al iniciar sesión.';
            if (error.message?.includes('Invalid login credentials')) {
                errorMessage = 'Email o contraseña incorrectos';
            } else if (error.message?.includes('Email not confirmed')) {
                errorMessage = 'Por favor confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            setAuthError(errorMessage);
            setIsLoading(false);
        }
    };

    const onRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAuthError(null);

        if (!termsAccepted) {
            alert("Debes aceptar los términos y condiciones para registrarte.");
            return;
        }

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const email = formData.get('reg-email') as string;
        const password = formData.get('reg-password') as string;
        const confirmPassword = formData.get('confirm-password') as string;
        const region = formData.get('region') as string;

        if (password !== confirmPassword) {
            setAuthError("Las contraseñas no coinciden.");
            return;
        }

        setIsLoading(true);

        try {
            localStorage.setItem('signup_role', role);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: username,
                        role: role,
                        region: region
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                if (data.session) {
                    handleLogin(role);
                } else {
                    alert("Registro exitoso. Por favor revisa tu correo electrónico para confirmar tu cuenta.");
                    setIsLoginView(true);
                    setIsLoading(false);
                }
            }

        } catch (error: any) {
            console.error('Registration error:', error);
            setAuthError(error.message || 'Error al registrarse.');
            setIsLoading(false);
        }
    };

    const onPasswordResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setAuthError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/#/settings`, // Redirect to settings to update password
            });

            if (error) throw error;

            setResetEmailSent(true);
            setIsLoading(false);
        } catch (error: any) {
            console.error('Password reset error:', error);
            setAuthError(error.message || 'Error al solicitar restablecimiento.');
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setAuthError(null);

            localStorage.setItem('signup_role', role);

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/#/`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;

        } catch (error: any) {
            console.error('Error logging in with Google:', error);
            setAuthError(error.message || 'Error al iniciar sesión con Google');
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-slate-800 p-10 rounded-xl shadow-2xl border border-slate-700">
                    {!isForgotPasswordView ? (
                        <>
                            <div className="flex border-b border-slate-700">
                                <button
                                    onClick={() => setIsLoginView(true)}
                                    className={`flex-1 py-2 font-bold uppercase tracking-wider transition-colors duration-300 ${isLoginView ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    onClick={() => setIsLoginView(false)}
                                    className={`flex-1 py-2 font-bold uppercase tracking-wider transition-colors duration-300 ${!isLoginView ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Registrarse
                                </button>
                            </div>

                            {isLoginView ? (
                                <form onSubmit={onLoginSubmit} className="space-y-6">
                                    <h2 className="text-3xl font-bold text-center text-white uppercase">Iniciar Sesión</h2>
                                    <div>
                                        <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                                        <input type="email" name="email" id="email" placeholder="Correo Electrónico" className={commonInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="sr-only">Contraseña</label>
                                        <input type="password" name="password" id="password" placeholder="Contraseña" className={commonInputClass} required />
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500" />
                                            <label htmlFor="remember-me" className="ml-2 block text-slate-400">Recordarme</label>
                                        </div>
                                        <Link to="/forgot-password" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <div>
                                        <button type="submit" className={`${commonButtonClass} bg-sky-600 text-white hover:bg-sky-700`}>
                                            Ingresar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={onRegisterSubmit} className="space-y-4">
                                    <h2 className="text-3xl font-bold text-center text-white uppercase">Crear Cuenta</h2>
                                    <div>
                                        <label htmlFor="username" className="sr-only">Nombre de Usuario</label>
                                        <input type="text" name="username" id="username" placeholder="Nombre de Usuario" className={commonInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-email" className="sr-only">Correo Electrónico</label>
                                        <input type="email" name="reg-email" id="reg-email" placeholder="Correo Electrónico" className={commonInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="reg-password" className="sr-only">Contraseña</label>
                                        <input type="password" name="reg-password" id="reg-password" placeholder="Contraseña" className={commonInputClass} required />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password" className="sr-only">Confirmar Contraseña</label>
                                        <input type="password" name="confirm-password" id="confirm-password" placeholder="Confirmar Contraseña" className={commonInputClass} required />
                                    </div>
                                    <div className="relative">
                                        <select name="region" id="region" className={`${commonInputClass} appearance-none`} required>
                                            <option value="" disabled selected>Selecciona tu Región</option>
                                            <option value="Metropolitana">Metropolitana</option>
                                            <option value="Valparaíso">Valparaíso</option>
                                            <option value="Biobío">Biobío</option>
                                            <option value="Sur">Sur</option>
                                            <option value="Norte">Norte</option>
                                        </select>
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-sm font-medium text-slate-300">Tipo de Cuenta</label>
                                        <div className="mt-2 grid grid-cols-2 gap-4">
                                            <label htmlFor="role-player" className="flex items-center p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 has-[:checked]:ring-2 has-[:checked]:ring-sky-500">
                                                <input type="radio" name="role" id="role-player" value="player" className="h-4 w-4 text-sky-600 border-slate-600 focus:ring-sky-500" checked={role === 'player'} onChange={() => setRole('player')} />
                                                <span className="ml-3 text-sm font-medium text-white">Jugador</span>
                                            </label>
                                            <label htmlFor="role-store" className="flex items-center p-3 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 has-[:checked]:ring-2 has-[:checked]:ring-sky-500">
                                                <input type="radio" name="role" id="role-store" value="store" className="h-4 w-4 text-sky-600 border-slate-600 focus:ring-sky-500" checked={role === 'store'} onChange={() => setRole('store')} />
                                                <span className="ml-3 text-sm font-medium text-white">Tienda</span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">Las cuentas de Tienda requieren aprobación del administrador.</p>
                                    </div>

                                    <div className="flex items-start space-x-3 pt-2">
                                        <input
                                            id="terms"
                                            name="terms"
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500 mt-0.5 flex-shrink-0"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                        />
                                        <label htmlFor="terms" className="text-sm text-slate-400">
                                            He leído y acepto los{' '}
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="font-medium text-sky-400 hover:text-sky-300 underline"
                                            >
                                                Términos y Condiciones
                                            </button>
                                            {' '}para {role === 'player' ? 'Jugadores' : 'Tiendas'}.
                                        </label>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            className={`${commonButtonClass} bg-sky-600 text-white hover:bg-sky-700 mt-2 disabled:bg-slate-600 disabled:cursor-not-allowed`}
                                            disabled={!termsAccepted}
                                        >
                                            Registrarse
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-600"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-slate-800 text-slate-400">O continúa con</span>
                                </div>
                            </div>

                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-400 mb-2 text-center">Ingresar con Google como:</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${role === 'player' ? 'bg-sky-900 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>
                                            <input type="radio" name="google-role" value="player" className="sr-only" checked={role === 'player'} onChange={() => setRole('player')} />
                                            <span className="text-sm font-bold">Jugador</span>
                                        </label>
                                        <label className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-colors ${role === 'store' ? 'bg-sky-900 border-sky-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}>
                                            <input type="radio" name="google-role" value="store" className="sr-only" checked={role === 'store'} onChange={() => setRole('store')} />
                                            <span className="text-sm font-bold">Tienda</span>
                                        </label>
                                    </div>
                                </div>
                                {!isLoginView && (
                                    <div className="flex items-start space-x-3 mb-4 justify-center">
                                        <input
                                            id="google-terms"
                                            name="google-terms"
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500 mt-1"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                        />
                                        <label htmlFor="google-terms" className="text-sm text-slate-400">
                                            Acepto los{' '}
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(true)}
                                                className="font-medium text-sky-400 hover:text-sky-300 underline"
                                            >
                                                Términos y Condiciones
                                            </button>
                                        </label>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading || (!isLoginView && !termsAccepted)}
                                    className={`${commonButtonClass} bg-white text-slate-800 hover:bg-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <GoogleIcon className="w-5 h-5" />
                                    )}
                                    <span>{isLoading ? 'Conectando...' : `Ingresar como ${role === 'player' ? 'Jugador' : 'Tienda'}`}</span>
                                </button>
                                {authError && (
                                    <p className="mt-2 text-center text-sm text-red-400">
                                        {authError}
                                    </p>
                                )}
                            </div>

                            <p className="mt-6 text-center text-sm text-slate-400">
                                {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                                <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-sky-400 hover:text-sky-300 ml-1">
                                    {isLoginView ? 'Regístrate aquí' : 'Inicia sesión aquí'}
                                </button>
                            </p>
                        </>
                    ) : (
                        <form onSubmit={onPasswordResetSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold text-center text-white uppercase">Recuperar Contraseña</h2>

                            {!resetEmailSent ? (
                                <>
                                    <p className="text-slate-400 text-sm text-center">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                                    <div>
                                        <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                                        <input type="email" name="email" id="email" placeholder="Correo Electrónico" className={commonInputClass} required />
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button type="submit" disabled={isLoading} className={`${commonButtonClass} bg-sky-600 text-white hover:bg-sky-700`}>
                                            {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                                        </button>
                                        <button type="button" onClick={() => setIsForgotPasswordView(false)} className="text-slate-400 hover:text-white text-sm">
                                            Volver al inicio de sesión
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-800 text-green-300 text-sm">
                                        ¡Enlace enviado! Revisa tu correo electrónico para restablecer tu contraseña.
                                    </div>
                                    <button type="button" onClick={() => { setIsForgotPasswordView(false); setResetEmailSent(false); }} className={`${commonButtonClass} bg-slate-700 text-white hover:bg-slate-600`}>
                                        Volver a Iniciar Sesión
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
            <TermsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Términos y Condiciones para ${role === 'player' ? 'Jugadores' : 'Tiendas'}`}
                content={role === 'player' ? playerTerms : storeTerms}
            />
        </>
    );
};

export default AuthPage;
