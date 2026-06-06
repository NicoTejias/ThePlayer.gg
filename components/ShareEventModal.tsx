import React, { useEffect, useState, useRef } from 'react';
import { Download, Copy, X, MessageCircle, Facebook, Instagram, Sparkles, ImageIcon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateEventFlyer } from '../utils/geminiApi';

// Envuelve una URL de imagen a través de un proxy con cabeceras CORS, para poder
// dibujarla en el canvas sin que quede "tainted" (Scryfall sirve las imágenes
// finales desde cards.scryfall.io sin Access-Control-Allow-Origin).
const toCorsProxy = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;

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
    storeNameDisplay?: string;
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

type FlyerTab = 'classic' | 'ai';

const ShareEventModal: React.FC<ShareEventModalProps> = ({ isOpen, onClose, event, storeLogoUrl, storeNameDisplay }) => {
    const [activeTab, setActiveTab] = useState<FlyerTab>('classic');
    const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
    const [aiFlyerUrl, setAiFlyerUrl] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const aiCanvasRef = useRef<HTMLCanvasElement>(null);

    const joinUrl = `${window.location.origin}/#/eventos`;
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
            generateClassicFlyer();
            buildAiFlyer();
        }
    }, [isOpen, event, storeLogoUrl]);

    // ─── Carga de imágenes para canvas ──────────────────────────────────────────

    const loadImg = (src: string, useProxy: boolean): Promise<HTMLImageElement> => {
        return new Promise((resolve) => {
            const img = document.createElement('img') as HTMLImageElement;
            img.crossOrigin = 'anonymous';
            img.src = (useProxy && src.startsWith('http')) ? toCorsProxy(src) : src;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
        });
    };

    // ─── Overlay compartido (info del evento) ────────────────────────────────────
    // Dibuja toda la información del evento sobre el fondo ya pintado en el canvas.
    const drawEventOverlay = async (ctx: CanvasRenderingContext2D) => {
        // Capa oscura para legibilidad
        const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
        gradient.addColorStop(0.45, 'rgba(15, 23, 42, 0.88)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Borde
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 20;
        ctx.strokeRect(30, 30, 1020, 1020);

        let topY = 80;

        // ── Header: logo + nombre de la tienda (lado a lado, centrados) ──
        const displayName = (storeNameDisplay || event.storeName).toUpperCase();
        const headerCenterY = topY + 60;
        const r = 55;
        const gap = 28;

        let logoImg: HTMLImageElement | null = null;
        if (storeLogoUrl) {
            const img = await loadImg(storeLogoUrl, false);
            if (img.complete && img.naturalWidth > 0) logoImg = img;
        }

        ctx.font = 'bold 38px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.shadowBlur = 0;
        const nameWidth = ctx.measureText(displayName).width;

        const logoBlockWidth = logoImg ? r * 2 + gap : 0;
        const totalWidth = logoBlockWidth + nameWidth;
        const startX = 540 - totalWidth / 2;

        if (logoImg) {
            const cx = startX + r;
            const cy = headerCenterY;
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
            ctx.fillStyle = '#1e293b';
            ctx.fill();
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#38bdf8';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImg, cx - r, cy - r, r * 2, r * 2);
            ctx.restore();
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 38px "Inter", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, startX + logoBlockWidth, headerCenterY);
        ctx.textBaseline = 'alphabetic';

        topY = headerCenterY + r + 25;

        // Línea divisora
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(200, topY);
        ctx.lineTo(880, topY);
        ctx.stroke();
        topY += 50;

        // ── Título del torneo ──
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;

        const title = event.title.toUpperCase();
        const maxLineWidth = 880;

        let titleFont = 64;
        const fitsAt = (size: number) => {
            ctx.font = `900 ${size}px "Outfit", "Inter", sans-serif`;
            return title.split(' ').every(w => ctx.measureText(w).width <= maxLineWidth);
        };
        while (titleFont > 36 && !fitsAt(titleFont)) titleFont -= 4;
        ctx.font = `900 ${titleFont}px "Outfit", "Inter", sans-serif`;
        const lineHeight = Math.round(titleFont * 1.25);

        const words = title.split(' ');
        let line = '';
        let currentY = topY;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            if (ctx.measureText(testLine).width > maxLineWidth && n > 0) {
                ctx.fillText(line.trim(), 540, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), 540, currentY);

        // ── Badge de formato ──
        const badgeY = currentY + 90;
        const badgeText = event.format.toUpperCase();
        ctx.font = '900 36px "Outfit", "Inter", sans-serif';
        ctx.shadowBlur = 0;
        const badgeWidth = ctx.measureText(badgeText).width + 60;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.roundRect(540 - badgeWidth / 2, badgeY - 50, badgeWidth, 70, 15);
        ctx.fill();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(540 - badgeWidth / 2, badgeY - 50, badgeWidth, 70, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 540, badgeY - 15);
        ctx.textBaseline = 'alphabetic';

        // ── Detalles ──
        let infoY = badgeY + 120;
        ctx.textAlign = 'left';
        ctx.font = 'bold 36px "Inter", sans-serif';

        const drawDetailLine = (label: string, value: string, icon: string) => {
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`${icon}  ${label}:`, 150, infoY);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(value, 460, infoY);
            infoY += 75;
        };

        let displayDate = event.date;
        try {
            const dateObj = new Date(event.date + 'T00:00:00');
            displayDate = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            displayDate = displayDate.charAt(0).toUpperCase() + displayDate.slice(1);
        } catch (e) {}

        drawDetailLine('Fecha', displayDate, '📅');
        drawDetailLine('Hora', `${event.time || '19:00'} hrs`, '⏰');
        drawDetailLine('Inscripción', formattedFee, '💰');
        drawDetailLine('Capacidad', `${event.maxPlayers || 64} jugadores`, '👥');

        // ── Footer ──
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'black 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('INSCRÍBETE Y SIGUE EL DETALLE EN THEPLAYER.GG', 540, 985);
    };

    // Pinta una imagen de fondo cubriendo el canvas (cover).
    const drawCoverBackground = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 1080, 1080);
        if (img.complete && img.naturalWidth > 0) {
            const scale = Math.max(1080 / img.width, 1080 / img.height);
            const x = (1080 - img.width * scale) / 2;
            const y = (1080 - img.height * scale) / 2;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        }
    };

    // ─── CLASSIC CANVAS FLYER (fondo = arte de carta) ────────────────────────────

    const generateClassicFlyer = async () => {
        setGenerating(true);
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            canvas.width = 1080;
            canvas.height = 1080;

            const bgImg = await loadImg(getEventImageUrl(event), true);
            drawCoverBackground(ctx, bgImg);
            await drawEventOverlay(ctx);

            setFlyerUrl(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error('Error generating classic flyer:', error);
        } finally {
            setGenerating(false);
        }
    };

    // ─── AI FLYER (fondo = imagen Gemini + overlay con info del evento) ───────────

    const buildAiFlyer = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            // 1. Generar/obtener la imagen de fondo con Gemini (Edge Function).
            const url = await generateEventFlyer({
                title: event.title,
                format: event.format,
                storeName: storeNameDisplay || event.storeName,
                gameType: event.game_type || event.gameType,
            });
            setAiImageUrl(url);

            // 2. Componer: imagen IA de fondo + info del evento encima (texto nítido,
            //    listo para subir a Instagram).
            const canvas = aiCanvasRef.current;
            if (!canvas) { setAiFlyerUrl(url); return; }
            const ctx = canvas.getContext('2d');
            if (!ctx) { setAiFlyerUrl(url); return; }
            canvas.width = 1080;
            canvas.height = 1080;

            const bgImg = await loadImg(url, true);
            drawCoverBackground(ctx, bgImg);
            await drawEventOverlay(ctx);

            setAiFlyerUrl(canvas.toDataURL('image/png'));
        } catch (e: any) {
            console.error('Error generando flyer IA:', e);
            setAiError('No se pudo generar el flyer con IA. Intenta de nuevo.');
        } finally {
            setAiLoading(false);
        }
    };

    // ─── Download helpers ────────────────────────────────────────────────────────

    const handleDownloadClassic = () => {
        if (!flyerUrl) return;
        const link = document.createElement('a');
        link.download = `Flyer-${event.title.replace(/\s+/g, '-')}.png`;
        link.href = flyerUrl;
        link.click();
        toast.success('¡Flyer descargado!');
    };

    const handleDownloadAi = () => {
        if (!aiFlyerUrl) return;
        const link = document.createElement('a');
        link.download = `Flyer-IA-${event.title.replace(/\s+/g, '-')}.png`;
        link.href = aiFlyerUrl; // data URL del composite (imagen IA + info)
        link.click();
        toast.success('¡Flyer IA descargado!');
    };

    const handleCopyText = () => {
        navigator.clipboard.writeText(shareText);
        toast.success('¡Descripción copiada!');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/60 rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    title="Cerrar modal"
                    className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-white/5 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* ── Header (arriba, centrado) ── */}
                <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
                    <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        ¡Evento Agendado Exitosamente!
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mt-3">Difundir Torneo</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">Usa el flyer y la descripción para promocionar el evento en tus redes.</p>
                </div>

                {/* ── Body: dos columnas ── */}
                <div className="flex flex-col md:flex-row">

                {/* ── Left: Flyer Preview ── */}
                <div className="flex-1 p-8 bg-slate-950/50 border-r border-white/5 flex flex-col items-center justify-start min-h-[350px]">

                    {/* Tab selector */}
                    <div className="flex w-full max-w-[340px] mb-5 rounded-xl overflow-hidden border border-white/10">
                        <button
                            onClick={() => setActiveTab('classic')}
                            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${activeTab === 'classic' ? 'bg-sky-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Clásico
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all ${activeTab === 'ai' ? 'bg-violet-600 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-white'}`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Flyer IA
                        </button>
                    </div>

                    {/* ── Classic Tab ── */}
                    {activeTab === 'classic' && (
                        <>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Vista Previa — Flyer Clásico</p>
                            {generating ? (
                                <div className="flex flex-col items-center gap-4 py-20">
                                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-400 font-bold text-sm">Generando flyer...</p>
                                </div>
                            ) : flyerUrl ? (
                                <img
                                    src={flyerUrl}
                                    alt="Flyer del evento"
                                    className="w-full max-w-[340px] aspect-square object-contain rounded-2xl border border-white/10 shadow-2xl"
                                />
                            ) : (
                                <p className="text-red-400 text-sm">No se pudo generar la vista previa.</p>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            {flyerUrl && (
                                <button
                                    onClick={handleDownloadClassic}
                                    className="mt-5 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Descargar PNG
                                </button>
                            )}
                        </>
                    )}

                    {/* ── AI Tab ── */}
                    {activeTab === 'ai' && (
                        <>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Flyer IA — Listo para Instagram</p>
                            <p className="text-[9px] text-slate-600 mb-4 text-center">Arte generado con IA + info del evento · Mismo torneo = misma imagen</p>

                            <div className="w-full max-w-[340px] aspect-square relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-900/20">
                                {aiLoading && (
                                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 z-10">
                                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-slate-400 text-xs font-bold">Generando flyer IA...</p>
                                        <p className="text-slate-600 text-[10px]">Puede tardar unos segundos</p>
                                    </div>
                                )}
                                {!aiLoading && aiError && (
                                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 z-10 px-6 text-center">
                                        <p className="text-red-400 text-xs font-bold">{aiError}</p>
                                        <button
                                            onClick={buildAiFlyer}
                                            className="px-4 py-2 bg-violet-600/80 hover:bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            Reintentar
                                        </button>
                                    </div>
                                )}
                                {aiFlyerUrl && !aiError && (
                                    <img
                                        src={aiFlyerUrl}
                                        alt="Flyer IA del evento"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <canvas ref={aiCanvasRef} className="hidden" />

                            <button
                                onClick={handleDownloadAi}
                                disabled={aiLoading || !!aiError || !aiFlyerUrl}
                                className="mt-5 px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Descargar Flyer IA
                            </button>
                        </>
                    )}
                </div>

                {/* ── Right: Text & Share ── */}
                <div className="flex-1 p-8 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        {/* Copyable text */}
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

                    {/* Share buttons */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Compartir directamente:</span>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 px-4 bg-green-600/10 border border-green-500/20 hover:bg-green-600 hover:text-white rounded-xl text-green-500 transition-all text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-500/5"
                            >
                                <MessageCircle className="w-4 h-4 fill-current" />
                                WhatsApp
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(joinUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-3 px-4 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600 hover:text-white rounded-xl text-blue-500 transition-all text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/5"
                            >
                                <Facebook className="w-4 h-4 fill-current" />
                                Facebook
                            </a>
                            <button
                                onClick={handleCopyText}
                                className="flex-1 py-3 px-4 bg-pink-600/10 border border-pink-500/20 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white rounded-xl text-pink-500 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-500/5"
                            >
                                <Instagram className="w-4 h-4" />
                                Instagram
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-500 text-center font-medium">
                            💡 Para Instagram: descarga el flyer, copia el texto y publícalo como Post o Story.
                        </p>
                    </div>
                </div>

                </div>{/* fin body dos columnas */}

            </div>
        </div>
    );
};

export default ShareEventModal;
