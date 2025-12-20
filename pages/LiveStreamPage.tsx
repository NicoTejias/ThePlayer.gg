import React from 'react';

const LiveStreamPage: React.FC = () => {
    // TODO: Replace with actual Channel ID for "Streamcaster Mage"
    // We couldn't find "Streamcaster Mage" on YouTube. 
    // If it's "Mattcaster Mage", the ID would be different.
    // For now, we'll keep a placeholder or you can put your specific ID here.
    const channelId = "UCxxxxxxxxxxxx"; // REPLACE THIS WITH REAL ID

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tighter">
                    Señal En Vivo
                    <span className="ml-4 inline-flex relative top-[-5px]">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </h1>
                <p className="text-xl text-sky-400 font-medium tracking-wide">Streamcaster Mage</p>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Disfruta de la transmisión oficial. Torneos, comentarios y lo mejor de Magic: The Gathering en directo.
                </p>
            </div>

            <div className="max-w-5xl mx-auto aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 ring-4 ring-slate-800/50">
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/live_stream?channel=${channelId}`}
                    title="Streamcaster Mage Live"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                ></iframe>
            </div>

            <div className="flex justify-center gap-4 pt-8">
                <a
                    href="https://www.youtube.com/@StreamcasterMage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold rounded-full transition-transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    Ir al Canal
                </a>
            </div>
        </div>
    );
};

export default LiveStreamPage;
