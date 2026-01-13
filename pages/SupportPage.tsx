import React from 'react';
import { Link } from 'react-router-dom';
import ShieldCheckIcon from '../components/icons/ShieldCheckIcon';

const MANUAL_CONTENT = {
    jugador: {
        title: "Manual del Jugador",
        icon: "👤",
        sections: [
            {
                subtitle: "1. Primeros Pasos",
                content: "Regístrate con tu correo y vincula tu juego favorito. Asegúrate de que tu nombre coincida con tu ID oficial del juego para que tus puntos se vinculen correctamente."
            },
            {
                subtitle: "2. Ganando Player Points",
                content: "Participa en torneos en tiendas afiliadas. Por cada victoria sumas puntos que te permiten escalar en el Ranking Nacional. Al finalizar la temporada, se conservará el 50% de tus puntos."
            },
            {
                subtitle: "3. Perfil Competitivo",
                content: "En tu perfil puedes ver tu Winrate, torneos jugados y tu Vitrina de Premios. Si ganas un torneo importante, recibirás una insignia única."
            }
        ]
    },
    tienda: {
        title: "Manual de Tiendas",
        icon: "🏪",
        sections: [
            {
                subtitle: "1. Registro de Tienda",
                content: "Solicita tu perfil de tienda. Una vez aprobada, aparecerás en el mapa nacional de tiendas y podrás publicar tus eventos."
            },
            {
                subtitle: "2. Reporte de Resultados",
                content: "Usa el 'Panel de Carga Masiva' para subir los resultados de tus torneos. Esto actualiza automáticamente los Player Points de todos los participantes."
            },
            {
                subtitle: "3. Calendario Nacional",
                content: "Publica tus lanzamientos y torneos especiales. Todos los jugadores de la región recibirán notificaciones sobre tus eventos."
            }
        ]
    },
    juez: {
        title: "Manual de Jueces",
        icon: "🛡️",
        sections: [
            {
                subtitle: "1. Certificación",
                content: "Aplica para ser Juez Certificado. Existen niveles desde Aspirante hasta Head Judge Regional. Cada nivel otorga una insignia diferente en tu perfil."
            },
            {
                subtitle: "2. Revisión de Integridad",
                content: "Los jueces tienen acceso a revisar 'Reclamos' de jugadores. Tu labor es asegurar que los resultados reportados por las tiendas sean correctos."
            },
            {
                subtitle: "3. Directorio Público",
                content: "Los perfiles de jueces son públicos para que los organizadores puedan contactarte para sus eventos más importantes."
            }
        ]
    },
    creador: {
        title: "Manual de Creadores",
        icon: "🎬",
        sections: [
            {
                subtitle: "1. El Programa de Creadores",
                content: "Si haces streams, contenido en YouTube o blogs sobre TCG, puedes aplicar al programa para obtener el badge verificado."
            },
            {
                subtitle: "2. Señal 'EN VIVO'",
                content: "Cuando estés transmitiendo en Twitch o YouTube, tu perfil en The Player mostrará un indicador 'EN VIVO' en la página principal."
            },
            {
                subtitle: "3. Publicación de Contenido",
                content: "Puedes publicar tus guías, videos de decktech y noticias directamente en la sección de Media para que toda la comunidad los vea."
            }
        ]
    }
};

const SupportPage: React.FC = () => {
    const [selectedManual, setSelectedManual] = React.useState<keyof typeof MANUAL_CONTENT | null>(null);

    return (
        <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Manual Viewer Modal */}
            {selectedManual && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{MANUAL_CONTENT[selectedManual].icon}</span>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{MANUAL_CONTENT[selectedManual].title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedManual(null)}
                                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-8">
                            {MANUAL_CONTENT[selectedManual].sections.map((section, idx) => (
                                <div key={idx} className="space-y-3">
                                    <h3 className="text-xl font-bold text-sky-400 uppercase tracking-tight">{section.subtitle}</h3>
                                    <p className="text-slate-300 leading-relaxed font-medium">{section.content}</p>
                                </div>
                            ))}
                            <div className="pt-6 border-t border-slate-800">
                                <p className="text-slate-500 text-sm italic">¿Necesitas más detalles? Puedes contactar al equipo de soporte directamente.</p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                            <button
                                onClick={() => setSelectedManual(null)}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all"
                            >
                                CERRAR MANUAL
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="text-center space-y-4 max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
                    Centro de <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Soporte y Guías</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium">
                    Todo lo que necesitas saber para dominar la plataforma The Player y participar en la PLS.
                </p>
            </div>

            {/* Quick Links / Manuals Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Player Manual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-sky-500/50 transition-all group">
                    <div className="w-16 h-16 bg-sky-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        👤
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Manual del Jugador</h2>
                    <ul className="space-y-4 text-slate-400">
                        <li className="flex items-start gap-3">
                            <span className="text-sky-500 mt-1">✓</span>
                            <span>Cómo registrarte y crear tu perfil competitivo.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-sky-500 mt-1">✓</span>
                            <span>Guía para reclamar tus puntos PWP en torneos.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-sky-500 mt-1">✓</span>
                            <span>Entendiendo el ranking y el reset de temporada.</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => setSelectedManual('jugador')}
                        className="mt-8 w-full py-4 bg-slate-800 hover:bg-sky-600 text-white font-black rounded-xl transition-all"
                    >
                        LEER MANUAL JUGADOR
                    </button>
                </div>

                {/* Store Manual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-green-500/50 transition-all group">
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🏪
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Manual de Tiendas</h2>
                    <ul className="space-y-4 text-slate-400">
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Gestión de torneos y subida de reportes masivos.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Publicación de eventos en el calendario nacional.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>Beneficios del programa de tiendas afiliadas.</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => setSelectedManual('tienda')}
                        className="mt-8 w-full py-4 bg-slate-800 hover:bg-green-600 text-white font-black rounded-xl transition-all"
                    >
                        LEER MANUAL TIENDA
                    </button>
                </div>

                {/* Judge Manual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all group">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🛡️
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Manual de Jueces</h2>
                    <ul className="space-y-4 text-slate-400">
                        <li className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1">✓</span>
                            <span>Sistema de certificación y niveles de arbitraje.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1">✓</span>
                            <span>Herramientas de integridad y revisión de casos.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-purple-500 mt-1">✓</span>
                            <span>Directorio público y solicitudes de arbitraje.</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => setSelectedManual('juez')}
                        className="mt-8 w-full py-4 bg-slate-800 hover:bg-purple-600 text-white font-black rounded-xl transition-all"
                    >
                        LEER MANUAL JUEZ
                    </button>
                </div>

                {/* Content Creator Manual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-orange-500/50 transition-all group">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🎬
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Manual de Creadores</h2>
                    <ul className="space-y-4 text-slate-400">
                        <li className="flex items-start gap-3">
                            <span className="text-orange-500 mt-1">✓</span>
                            <span>Cómo participar en el programa de creadores.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-orange-500 mt-1">✓</span>
                            <span>Gestión de contenido (Videos, Noticias, Guías).</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-orange-500 mt-1">✓</span>
                            <span>Visualización de señal 'EN VIVO' en el portal.</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => setSelectedManual('creador')}
                        className="mt-8 w-full py-4 bg-slate-800 hover:bg-orange-600 text-white font-black rounded-xl transition-all"
                    >
                        LEER MANUAL CREADOR
                    </button>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto space-y-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center">Preguntas Frecuentes</h2>
                <div className="space-y-4">
                    {[
                        { q: "¿Qué son los Player Points?", a: "Los Player Points son la moneda de medida de tu actividad competitiva en The Player. Se ganan participando y ganando en torneos registrados en tiendas oficiales." },
                        { q: "¿Por qué perdí la mitad de mis puntos?", a: "Al final de cada temporada (un año calendario), se realiza un reset donde conservas el 50% de tus puntos para que los nuevos jugadores tengan una oportunidad justa de competir por los puestos top." },
                        { q: "¿Cómo registro mi tienda?", a: "Puedes solicitar el registro desde la página de tiendas. Un administrador revisará tu solicitud para asegurar la integridad de la red oficial de The Player." }
                    ].map((item, i) => (
                        <details key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 group cursor-pointer">
                            <summary className="text-lg font-bold text-white uppercase tracking-tighter list-none flex justify-between items-center">
                                {item.q}
                                <span className="text-sky-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <p className="mt-4 text-slate-400 leading-relaxed">
                                {item.a}
                            </p>
                        </details>
                    ))}
                </div>
            </div>

            {/* Organizers Section */}
            <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
                <div className="grid md:grid-cols-2">
                    <div className="p-12 space-y-6">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Para Organizadores y Admins</h2>
                        <p className="text-slate-400">
                            Si eres el encargado de gestionar premios o moderar la comunidad, aquí tienes las herramientas clave:
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="p-1 bg-sky-500/20 rounded-md text-sky-400 text-xs">NEW</span>
                                <Link to="/admin/awards" className="text-slate-200 font-bold italic underline">Gala y Panel de Premios</Link>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <span>•</span>
                                <span>Cómo crear categorías de premios (Pioneer, Champion, Community).</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <span>•</span>
                                <span>Proceso para otorgar insignias manuales por méritos especiales.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-sky-600/10 p-12 flex items-center justify-center border-l border-slate-800">
                        <div className="text-center space-y-4">
                            <div className="text-6xl mb-4">🏆</div>
                            <p className="text-white font-black uppercase tracking-widest text-sm">Próxima Gala: Diciembre 2025</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Support */}
            <div className="max-w-7xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-12 text-center">
                <h3 className="text-3xl font-black text-white mb-6 uppercase italic">¿Aún tienes dudas?</h3>
                <p className="text-slate-400 mb-8 text-lg max-w-2xl mx-auto">
                    Nuestro equipo está listo para ayudarte con problemas técnicos, dudas sobre el reglamento o sugerencias para mejorar The Player.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    <a href="mailto:soporte@theplayer.gg" className="px-8 py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-sky-400 transition-all flex items-center gap-2">
                        <span>✉</span> CONTACTAR POR EMAIL
                    </a>
                    <a href="https://discord.gg/theplayer" className="px-8 py-4 bg-[#5865F2] text-white font-black rounded-xl hover:scale-105 transition-all flex items-center gap-2">
                        <span>💬</span> UNIRSE AL DISCORD
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
