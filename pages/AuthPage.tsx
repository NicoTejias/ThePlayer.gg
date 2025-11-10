import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GoogleIcon from '../components/icons/GoogleIcon';
import TermsModal from '../components/TermsModal';

const playerTerms = `Términos y Condiciones para Jugadores:

1.  **Aceptación de Visibilidad:** Al registrarte, aceptas que tu nombre de usuario y resultados de torneos sean públicos en los rankings y perfiles del sitio.
2.  **Código de Conducta:** Te comprometes a mantener un comportamiento deportivo, respetuoso y libre de acoso en todos los eventos asociados y dentro de la plataforma digital theplayer.gg.
3.  **Veracidad de la Información:** Eres el único responsable de que la información proporcionada en tu perfil sea verídica y esté actualizada.
4.  **Responsabilidad en el Mercado:** Todas las transacciones (compra, venta o cambio) realizadas a través del Mercado son de tu exclusiva responsabilidad. theplayer.gg actúa únicamente como un tablero de anuncios y no interviene ni se responsabiliza por las transacciones.
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
    const [role, setRole] = useState<'player' | 'store'>('player');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const commonInputClass = "w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition duration-200";
    const commonButtonClass = "w-full py-3 px-4 font-bold rounded-lg transition duration-300";

    const onLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would normally validate credentials
        // For simulation, we'll just log in as a player.
        // In a real app, you'd get the role from the server.
        handleLogin('player');
    };

    const onRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            alert("Debes aceptar los términos y condiciones para registrarte.");
            return;
        }
        // Here you would handle the registration logic
        alert(`Registro simulado como ${role}.`);
        // For simulation, we could log the user in directly after registration
        handleLogin(role);
    };


    const LoginForm = () => (
        <form onSubmit={onLoginSubmit} className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-white uppercase">Iniciar Sesión</h2>
            <div>
                <label htmlFor="email" className="sr-only">Correo Electrónico</label>
                <input type="email" name="email" id="email" placeholder="Correo Electrónico" className={commonInputClass} />
            </div>
            <div>
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input type="password" name="password" id="password" placeholder="Contraseña" className={commonInputClass} />
            </div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-500" />
                    <label htmlFor="remember-me" className="ml-2 block text-slate-400">Recordarme</label>
                </div>
                <a href="#" className="font-medium text-sky-400 hover:text-sky-300">¿Olvidaste tu contraseña?</a>
            </div>
            <div>
                <button type="submit" className={`${commonButtonClass} bg-sky-600 text-white hover:bg-sky-700`}>
                    Ingresar
                </button>
            </div>
        </form>
    );

    const RegisterForm = () => (
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
    );


    return (
        <>
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-slate-800 p-10 rounded-xl shadow-2xl border border-slate-700">
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
                    
                    {isLoginView ? <LoginForm /> : <RegisterForm />}
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">O continúa con</span>
                        </div>
                    </div>

                    <div>
                        <button type="button" className={`${commonButtonClass} bg-white text-slate-800 hover:bg-slate-200 flex items-center justify-center gap-3`}>
                            <GoogleIcon className="w-5 h-5" />
                            <span>Ingresar con Google</span>
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-slate-400">
                        {isLoginView ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
                        <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-sky-400 hover:text-sky-300 ml-1">
                            {isLoginView ? 'Regístrate aquí' : 'Inicia sesión aquí'}
                        </button>
                    </p>
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
