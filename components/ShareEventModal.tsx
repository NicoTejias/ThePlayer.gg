import React, { useEffect, useState, useRef } from 'react';
import { Download, Copy, Share2, X, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

interface ShareEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
        id: string;
        title: string;
        date: string;
        time: string;
        format: string;
        storeName: string;
        maxPlayers: number;
        entry_fee?: string;
        description?: string;
        imageUrl?: string;
        game_type?: string;
        gameType?: string;
    };
    storeLogoUrl?: string;
}

export const getEventImageUrl = (event: { imageUrl?: string; image_url?: string; format?: string; gameType?: string; game_type?: string }) => {
    const url = event.imageUrl || event.image_url;
    if (url && url.startsWith('http')) return url;

    const game = (event.gameType || event.game_type || 'mtg').toLowerCase();
    const format = (event.format || '').toLowerCase();

    if (game === 'mtg') {
        let cardName = 'Command Tower';
        if (format.includes('standard')) cardName = 'Mightform Harmonizer';
        else if (format.includes('modern')) cardName = 'Ragavan, Nimble Pilferer';
        else if (format.includes('pioneer')) cardName = 'Treasure Cruise';
        else if (format.includes('legacy')) cardName = 'Brainstorm';
        else if (format.includes('pauper')) cardName = "Chainer's Edict";
        else if (format.includes('premodern')) cardName = 'Survival of the Fittest';
        else if (format.includes('commander') || format.includes('edh')) cardName = 'Command Tower';
        else if (format.includes('draft') || format.includes('sealed') || format.includes('limited')) cardName = 'Colossal Dreadmaw';
        else if (format.includes('rcq') || format.includes('premier') || format.includes('championship')) cardName = 'Omnath, Locus of Creation';

        return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
    } else if (game === 'pokemon') {
        return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80';
    } else if (game === 'one_piece') {
        return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';
    } else if (game === 'yugioh') {
        return 'https://images.unsplash.com/photo-1601987177651-8edfe6c20009?w=600&auto=format&fit=crop&q=80';
    } else {
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    }
};

const ShareEventModal: React.FC<ShareEventModalProps> = ({ isOpen, onClose, event, storeLogoUrl }) => {
    const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Format Share Text
    const joinUrl = `${window.location.origin}/#/eventos`; // Link general o específico
    const formattedFee = event.entry_fee ? `$${parseInt(event.entry_fee).toLocaleString('es-CL')} CLP` : 'Gratuito';
    const shareText = `📢 ¡Nuevo Torneo Agendado!
🏆 Torneo: ${event.title}
🎮 Formato: ${event.format}
📅 Fecha: ${event.date}
⏰ Hora: ${event.time || '19:00'} hrs
🏪 Tienda: ${event.storeName}
💰 Inscripción: ${formattedFee}
👥 Cupos: ${event.maxPlayers || 64} jugadores

¡Inscríbete y participa a través de ThePlayer.gg! 🚀
👉 Inscríbete aquí: ${joinUrl}`;

    useEffect(() => {
        if (isOpen && event) {
            generateFlyer();
        }
    }, [isOpen, event, storeLogoUrl]);

    const generateFlyer = async () => {
        setGenerating(true);
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Set high resolution canvas (1080x1080)
            canvas.width = 1080;
            canvas.height = 1080;

            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1080, 1080);

            // Load background image
            const bgImgUrl = getEventImageUrl(event);
            const bgImg = new Image();
            bgImg.crossOrigin = 'anonymous';
            bgImg.src = bgImgUrl;

            await new Promise((resolve, reject) => {
                bgImg.onload = resolve;
                bgImg.onerror = resolve; // Continue even if bg fails
            });

            if (bgImg.complete && bgImg.naturalWidth > 0) {
                // Draw background stretched and cropped (cover)
                const scale = Math.max(1080 / bgImg.width, 1080 / bgImg.height);
                const x = (1080 - bgImg.width * scale) / 2;
                const y = (1080 - bgImg.height * scale) / 2;
                ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
            }

            // Dark overlay gradient (from bottom to top)
            const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
            gradient.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
            gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.85)');
            gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);

            // Add sleek border decoration
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; // sky-400
            ctx.lineWidth = 20;
            ctx.strokeRect(30, 30, 1020, 1020);

            // Load & Draw Store Logo in center top
            if (storeLogoUrl) {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.src = storeLogoUrl;

                await new Promise((resolve) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve;
                });

                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    ctx.save();
                    // Draw circular avatar shadow/border
                    ctx.beginPath();
                    ctx.arc(540, 180, 85, 0, Math.PI * 2);
                    ctx.fillStyle = '#1e293b';
                    ctx.fill();
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = '#38bdf8'; // sky-400
                    ctx.stroke();

                    // Clip image into circle
                    ctx.beginPath();
                    ctx.arc(540, 180, 80, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(logoImg, 460, 100, 160, 160);
                    ctx.restore();
                }
            }

            // Render Title
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 64px "Outfit", "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            
            // Handle long titles with wrap
            const title = event.title.toUpperCase();
            const words = title.split(' ');
            let line = '';
            const maxLineWidth = 900;
            let currentY = storeLogoUrl ? 340 : 220;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxLineWidth && n > 0) {
                    ctx.fillText(line, 540, currentY);
                    line = words[n] + ' ';
                    currentY += 80;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 540, currentY);

            // Render Format Badge background
            const badgeY = currentY + 100;
            const badgeText = event.format.toUpperCase();
            ctx.font = '900 36px "Outfit", "Inter", sans-serif';
            const textWidth = ctx.measureText(badgeText).width;
            const badgeWidth = textWidth + 60;
            const badgeHeight = 70;

            // Draw rounded badge rect
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; // sky-500/20
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(540 - badgeWidth / 2, badgeY - 50, badgeWidth, badgeHeight, 15);
            ctx.fill();
            ctx.stroke();

            // Badge text
            ctx.fillStyle = '#38bdf8';
            ctx.fillText(badgeText, 540, badgeY - 2);

            // Render Details Block
            let infoY = badgeY + 120;
            ctx.textAlign = 'left';
            ctx.font = 'bold 36px "Inter", sans-serif';
            ctx.shadowBlur = 0;

            const drawDetailLine = (label: string, value: string, icon: string) => {
                ctx.fillStyle = '#94a3b8'; // slate-400
                ctx.fillText(`${icon}  ${label}:`, 150, infoY);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(value, 460, infoY);
                infoY += 75;
            };

            // Date formatting
            let displayDate = event.date;
            try {
                const dateObj = new Date(event.date + 'T00:00:00');
                displayDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                displayDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);
            } catch (e) {}

            drawDetailLine('Fecha', displayDate, '📅');
            drawDetailLine('Hora', `${event.time || '19:00'} hrs`, '⏰');
            drawDetailLine('Tienda', event.storeName, '🏪');
            drawDetailLine('Inscripción', formattedFee, '💰');
            drawDetailLine('Capacidad', `${event.maxPlayers || 64} jugadores`, '👥');

            // Draw description if short, or keep clean
            if (event.description && event.description.length < 150) {
                infoY += 20;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = 'italic 28px "Inter", sans-serif';
                ctx.textAlign = 'center';
                
                // Wrap description
                const descWords = event.description.split(' ');
                let descLine = '';
                for (let n = 0; n < descWords.length; n++) {
                    const testLine = descLine + descWords[n] + ' ';
                    const testWidth = ctx.measureText(testLine).width;
                    if (testWidth > 800 && n > 0) {
                        ctx.fillText(descLine, 540, infoY);
                        descLine = descWords[n] + ' ';
                        infoY += 45;
                    } else {
                        descLine = testLine;
                    }
                }
                ctx.fillText(descLine, 540, infoY);
            }

            // Footer / Call to Action
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = 'black 30px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('INSCRIBETE Y SIGUE EL DETALLE EN THEPLAYER.GG', 540, 980);

            // Set flyer URL
            const url = canvas.toDataURL('image/png');
            setFlyerUrl(url);
        } catch (error) {
            console.error('Error generating flyer:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyText = () => {
        navigator.clipboard.writeText(shareText);
        toast.success('¡Descripción copiada correctamente!');
    };

    const handleDownloadFlyer = () => {
        if (!flyerUrl) return;
        const link = document.createElement('a');
        link.download = `Flyer-${event.title.replace(/\s+/g, '-')}.png`;
        link.href = flyerUrl;
        link.click();
        toast.success('¡Flyer descargado con éxito!');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/60 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col md:flex-row relative">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    title="Cerrar modal"
                    className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-white/5 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Flyer Preview */}
                <div className="flex-1 p-8 bg-slate-950/50 border-r border-white/5 flex flex-col items-center justify-center min-h-[350px] md:min-h-0">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Vista Previa del Flyer</p>
                    
                    {generating ? (
                        <div className="flex flex-col items-center gap-4 py-20">
                            <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold text-sm">Creando diseño premium...</p>
                        </div>
                    ) : flyerUrl ? (
                        <img 
                            src={flyerUrl} 
                            alt="Flyer del evento" 
                            className="w-full max-w-[340px] aspect-square object-contain rounded-2xl border border-white/10 shadow-2xl hover:scale-102 transition-transform duration-300"
                        />
                    ) : (
                        <p className="text-red-400 text-sm">No se pudo generar la vista previa.</p>
                    )}

                    {/* Hidden canvas for generation */}
                    <canvas ref={canvasRef} className="hidden" />

                    {flyerUrl && (
                        <button
                            onClick={handleDownloadFlyer}
                            className="mt-6 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Descargar Flyer PNG
                        </button>
                    )}
                </div>

                {/* Right: Text & Share Links */}
                <div className="flex-1 p-8 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div>
                            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                ¡Evento Agendado Exitosamente!
                            </span>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mt-2">Difundir Torneo</h2>
                            <p className="text-xs text-slate-400 font-medium">Usa la descripción pre-generada y el flyer visual para promocionar el evento en tus redes sociales.</p>
                        </div>

                        {/* Copyable Description */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Texto de Promoción</span>
                                <button
                                    onClick={handleCopyText}
                                    className="text-[11px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
                                >
                                    <Copy className="w-3.5 h-3.5" />
                                    Copiar Texto
                                </button>
                            </div>
                            <textarea
                                readOnly
                                value={shareText}
                                title="Texto de promoción del evento"
                                className="w-full h-44 bg-slate-950 border border-white/5 rounded-2xl p-4 text-xs font-medium text-slate-300 font-mono resize-none focus:outline-none custom-scrollbar shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Compartir directamente:</span>
                        <div className="flex flex-wrap gap-3">
                            {/* WhatsApp */}
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 px-4 bg-green-600/10 border border-green-500/20 hover:bg-green-600 hover:text-white rounded-xl text-green-500 hover:scale-102 transition-all text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-500/5"
                            >
                                <MessageCircle className="w-4 h-4 fill-current" />
                                WhatsApp
                            </a>

                            {/* Facebook */}
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(joinUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 px-4 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-xl text-blue-500 hover:scale-102 transition-all text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/5"
                            >
                                <Facebook className="w-4 h-4 fill-current" />
                                Facebook
                            </a>

                            {/* Instagram Instructions */}
                            <button
                                onClick={handleCopyText}
                                className="flex-1 py-3 px-4 bg-pink-600/10 border border-pink-500/20 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white rounded-xl text-pink-500 hover:scale-102 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/5"
                            >
                                <Instagram className="w-4 h-4" />
                                Instagram
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-500 text-center font-medium">
                            💡 *Tip para Instagram:* Descarga el flyer en el panel de la izquierda, copia el texto de promoción, abre Instagram y publícalo como Post o Story.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ShareEventModal;
