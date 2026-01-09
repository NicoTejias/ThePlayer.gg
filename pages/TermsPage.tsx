import React from 'react';
import { Shield, FileText, Scale, AlertTriangle, Users } from 'lucide-react';

const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 pb-20 animate-fade-in">
            {/* Hero Section */}
            <div className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950"></div>
                <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium text-sm mb-4">
                        <FileText className="w-4 h-4" />
                        <span>Actualizado: Enero 2026</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                        Términos y Condiciones
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light">
                        Por favor, lee detenidamente estos términos antes de utilizar los servicios de ThePlayer.gg.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-4xl space-y-12">

                {/* Section 1: Introduction */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-sky-900/30 rounded-xl text-sky-400">
                            <Scale className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">1. Introducción y Aceptación</h2>
                    </div>
                    <div className="space-y-4 text-slate-300 leading-relaxed">
                        <p>
                            Bienvenido a <strong>ThePlayer.gg</strong> ("nosotros", "nuestro", "la Plataforma"). Al acceder o utilizar nuestro sitio web, servicios de ranking, y participación en la Player Latam Series (PLS), aceptas estar legalmente vinculado por estos Términos y Condiciones ("Términos").
                        </p>
                        <p>
                            Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder a nuestros servicios ni participar en nuestros torneos competitivos.
                        </p>
                    </div>
                </section>

                {/* Section 2: User Accounts */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-900/30 rounded-xl text-indigo-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">2. Cuentas de Usuario</h2>
                    </div>
                    <ul className="space-y-4 text-slate-300 leading-relaxed list-disc list-inside marker:text-indigo-500">
                        <li>
                            <strong>Registro:</strong> Para acceder a ciertas funciones, debes crear una cuenta proporcionando información precisa, completa y actual. Eres responsable de mantener la confidencialidad de tu cuenta.
                        </li>
                        <li>
                            <strong>Elegibilidad:</strong> Debes tener al menos 13 años para usar este servicio. Los menores de 18 años deben contar con el permiso de sus padres o tutores legales.
                        </li>
                        <li>
                            <strong>Seguridad:</strong> Eres responsable de todas las actividades que ocurran bajo tu cuenta. Notifícanos inmediatamente sobre cualquier uso no autorizado.
                        </li>
                    </ul>
                </section>

                {/* Section 3: Integrity & Fair Play */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-red-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Shield className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="p-3 bg-red-900/30 rounded-xl text-red-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">3. Integridad Competitiva y Juego Limpio</h2>
                    </div>
                    <div className="space-y-4 text-slate-300 leading-relaxed relative z-10">
                        <p className="font-semibold text-red-200">
                            ThePlayer.gg mantiene una política de TOLERANCIA CERO contra cualquier forma de trampa o manipulación.
                        </p>
                        <ul className="space-y-3 list-disc list-inside marker:text-red-500">
                            <li>
                                <strong>Prohibición de Trampas:</strong> El uso de software de terceros, explotación de bugs, o cualquier ventaja injusta está estrictamente prohibido.
                            </li>
                            <li>
                                <strong>Colusión y "Win-Trading":</strong> Acordar resultados de partidas, conceder victorias intencionalmente para alterar el ranking, o sobornar oponentes resultará en una descalificación inmediata.
                            </li>
                            <li>
                                <strong>Conducta:</strong> Esperamos un comportamiento deportivo. El acoso, discurso de odio, amenazas o comportamiento tóxico hacia otros jugadores, organizadores o administradores no será tolerado.
                            </li>
                        </ul>
                        <div className="mt-6 p-4 bg-red-950/40 rounded-xl border border-red-900/50 flex gap-4 items-start">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-red-400 text-sm uppercase mb-1">Sanciones</h4>
                                <p className="text-xs text-red-200/80">
                                    La violación de estas reglas puede resultar en la suspensión temporal o permanente de tu cuenta, la anulación de puntos PLS, la descalificación de torneos y el reporte a las autoridades oficiales del juego correspondiente (ej. Wizards of the Coast, The Pokémon Company).
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Event Rules */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-900/30 rounded-xl text-emerald-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">4. Torneos y Ranking PLS</h2>
                    </div>
                    <div className="space-y-4 text-slate-300 leading-relaxed">
                        <p>
                            <strong>Sistema de Puntos:</strong> Los puntos PLS se otorgan base a la participación y resultados en eventos sancionados. Nos reservamos el derecho de corregir errores en el cálculo de puntos o retirar puntos obtenidos fraudulentamente.
                        </p>
                        <p>
                            <strong>Premios:</strong> La entrega de premios está sujeta a la verificación de identidad y elegibilidad. Los organizadores de torneos (Tiendas) son responsables de la entrega de premios locales, mientras que ThePlayer.gg gestiona los premios de la final de temporada.
                        </p>
                    </div>
                </section>

                {/* Section 5: Intellectual Property */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">5. Propiedad Intelectual</h3>
                    <p className="text-slate-300 mb-4">
                        Todo el contenido de la plataforma, incluyendo logotipos, diseños, código y texto, es propiedad de ThePlayer.gg o sus licenciantes. Los nombres de juegos y marcas registradas (Magic: The Gathering, Pokémon, etc.) son propiedad de sus respectivos dueños y se utilizan con fines informativos.
                    </p>
                </section>

                {/* Section 6: Liability */}
                <section className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-4">6. Limitación de Responsabilidad</h3>
                    <p className="text-slate-300 mb-4">
                        ThePlayer.gg no se hace responsable de daños indirectos, incidentales o consecuentes derivados del uso de la plataforma. No garantizamos que el servicio sea ininterrumpido o libre de errores.
                    </p>
                </section>

                <div className="text-center text-slate-500 text-sm mt-12 pb-8">
                    <p>Si tienes dudas sobre estos términos, contáctanos en <a href="mailto:contacto@theplayer.gg" className="text-sky-400 hover:underline">contacto@theplayer.gg</a></p>
                </div>

            </div>
        </div>
    );
};

export default TermsPage;
