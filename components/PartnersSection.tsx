import React from 'react';

const PartnersSection: React.FC = () => {
    const partners = [
        {
            name: 'StreamCaster Mage',
            logo: '/streamcaster-mage-logo.png',
            url: 'https://www.streamcastermage.cl/',
            description: 'Productora Audiovisual'
        },
        {
            name: 'Blue Robot',
            logo: '/images/partners/blue_robot.png',
            url: '#',
            description: 'Creador de Contenido'
        },
        {
            name: 'Blood Moon',
            logo: '/images/partners/bloodmoon.png',
            url: '#',
            description: 'Tienda'
        },
        {
            name: 'Command Center',
            logo: '/images/partners/command_center.jpg',
            url: '#',
            description: 'Tienda'
        },
        {
            name: 'Moss Eisley',
            logo: '/images/partners/moss_eisley.jpg',
            url: '#',
            description: 'Tienda'
        },
        {
            name: 'The Player',
            logo: '/images/partners/theplayer_logo.png',
            url: '#',
            description: 'Tienda'
        },
    ];

    return (
        <div className="bg-slate-800/50 border-t border-slate-700 py-12">
            <div className="container mx-auto px-4">
                <h3 className="text-2xl font-bold text-center text-white mb-8 uppercase tracking-wider">
                    Nuestros Aliados Estratégicos
                </h3>

                <div className="flex flex-wrap justify-center items-center gap-8">
                    {partners.map((partner, idx) => (
                        <a
                            key={idx}
                            href={partner.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group transition-all duration-300 hover:scale-110"
                        >
                            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-sky-500 transition-colors">
                                <img
                                    src={partner.logo}
                                    alt={`${partner.name} - ${partner.description} `}
                                    className="h-20 w-auto object-contain filter brightness-90 group-hover:brightness-110 transition-all"
                                />
                                <p className="text-slate-400 text-sm text-center mt-3 group-hover:text-sky-400 transition-colors">
                                    {partner.description}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Colaboramos con las mejores empresas del ecosistema TCG en Chile
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartnersSection;
