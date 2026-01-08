import React from 'react';
import { useGame } from '../context/GameContext';
import ParticlesBackground from '../components/ParticlesBackground';

const AboutPage: React.FC = () => {
    const { currentGame } = useGame();

    const teamMembers = [
        {
            name: 'Hugo Castro',
            role: 'Co-Founder & Director',
            image: null, // Placeholder or add correct path if available
            bio: 'Apasionado por los TCG y el desarrollo de comunidades competitivas.'
        },
        {
            name: 'Nicolas Tejias',
            role: 'Co-Founder & Lead Developer',
            image: null, // Placeholder
            bio: 'Ingeniero de software dedicado a crear la mejor experiencia para jugadores.'
        }
    ];

    return (
        <div className="relative min-h-screen pt-24 pb-12 overflow-hidden">
            {/* Background elements usually handled by layout but ensuring good contrast here */}

            <div className="container mx-auto px-4 relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600 mb-6 drop-shadow-lg">
                        QUIENES SOMOS
                    </h1>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Somos jugadores, organizadores y apasionados por los Trading Card Games.
                        Creamos ThePlayer.gg para elevar el nivel competitivo y unir a la comunidad.
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    {/* Mission Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all shadow-xl group">
                        <div className="w-14 h-14 bg-sky-900/50 rounded-lg flex items-center justify-center mb-6 border border-sky-500/30 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Nuestra Misión</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Proveer a la comunidad de TCG una plataforma profesional, centralizada y moderna
                            para gestionar torneos, rankings y perfiles de jugadores, fomentando la competencia
                            justa y el crecimiento del ecosistema en Chile y Latinoamérica.
                        </p>
                    </div>

                    {/* Vision Card */}
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/70 transition-all shadow-xl group">
                        <div className="w-14 h-14 bg-purple-900/50 rounded-lg flex items-center justify-center mb-6 border border-purple-500/30 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-4">Nuestra Visión</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Ser el estándar definitivo para el juego organizado de TCG en la región,
                            reconocidos por nuestra innovación tecnológica, integridad deportiva y
                            el valor que aportamos a jugadores y tiendas por igual.
                        </p>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-center text-white mb-12">
                        Nuestro Equipo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-sky-900/20 transition-all text-center p-8 group">
                                <div className="w-32 h-32 mx-auto bg-slate-700 rounded-full mb-6 overflow-hidden border-4 border-slate-600 group-hover:border-sky-500 transition-colors">
                                    {member.image ? (
                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                                <p className="text-sky-400 font-medium mb-4">{member.role}</p>
                                <p className="text-slate-400 text-sm italic">"{member.bio}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
