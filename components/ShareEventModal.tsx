import React, { useEffect, useState, useRef } from 'react';
import { Download, Copy, X, MessageCircle, Facebook, Instagram, Sparkles, ImageIcon } from 'lucide-react';
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

const getCardNameForFormat = (format: string, gameType?: string): string => {
    const game = (gameType || 'mtg').toLowerCase();
    const fmt = (format || '').toLowerCase();
    if (game !== 'mtg') return '';

    if (fmt.includes('standard')) return 'Mightform Harmonizer';
    if (fmt.includes('modern')) return 'Ragavan, Nimble Pilferer';
    if (fmt.includes('pioneer')) return 'Treasure Cruise';
    if (fmt.includes('legacy')) return 'Brainstorm';
    if (fmt.includes('pauper')) return "Chainer's Edict";
    if (fmt.includes('premodern')) return 'Survival of the Fittest';
    if (fmt.includes('commander') || fmt.includes('edh')) return 'Command Tower';
    if (fmt.includes('draft') || fmt.includes('sealed') || fmt.includes('limited')) return 'Colossal Dreadmaw';
    if (fmt.includes('rcq') || fmt.includes('premier') || fmt.includes('championship')) return 'Omnath, Locus of Creation';
    return 'Command Tower';
};

const simpleHash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const buildAiPrompt = (event: ShareEventModalProps['event']): string => {
    const game = (event.game_type || event.gameType || 'mtg').toLowerCase();
    const format = event.format;
    const store = event.storeName;

    let gameDesc = 'trading card game';
    if (game === 'mtg') gameDesc = 'Magic: The Gathering';
    else if (game === 'pokemon') gameDesc = 'Pokémon Trading Card Game';
    else if (game === 'yugioh') gameDesc = 'Yu-Gi-Oh!';
    else if (game === 'one_piece') gameDesc = 'One Piece Card Game';

    return `Epic competitive tournament poster for "${event.title}", ${format} format ${gameDesc} championship event at ${store} game store, dramatic fantasy lighting, dark mystical atmosphere, magical energy, glowing arcane effects, card game artwork style, championship trophy, competitive gaming arena, professional esports poster, cinematic composition, vibrant colors`;
};

type FlyerTab = 'classic' | 'ai';

const ShareEventModal: React.FC<ShareEventModalProps> = ({ isOpen, onClose, event, storeLogoUrl, storeNameDisplay }) => {
    const [activeTab, setActiveTab] = useState<FlyerTab>('classic');
    const [flyerUrl, setFlyerUrl] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [cardArtUrl, setCardArtUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
            const art = getEventImageUrl(event);
            setCardArtUrl(art);
            generateClassicFlyer();
            buildAiFlyer();
        }
    }, [isOpen, event, storeLogoUrl]);

    // ─── CLASSIC CANVAS FLYER ───────────────────────────────────────────────────

    const generateClassicFlyer = async () => {
        setGenerating(true);
        try {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 1080;
            canvas.height = 1080;

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 1080, 1080);

            // Background card art
            const bgImgUrl = getEventImageUrl(event);
            const bgImg = document.createElement('img') as HTMLImageElement;
            bgImg.crossOrigin = 'anonymous';
            bgImg.src = bgImgUrl;
            await new Promise<void>((resolve) => { bgImg.onload = () => resolve(); bgImg.onerror = () => resolve(); });

            if (bgImg.complete && bgImg.naturalWidth > 0) {
                const scale = Math.max(1080 / bgImg.width, 1080 / bgImg.height);
                const x = (1080 - bgImg.width * scale) / 2;
                const y = (1080 - bgImg.height * scale) / 2;
                ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
            }

            // Dark overlay
            const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
            gradient.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
            gradient.addColorStop(0.45, 'rgba(15, 23, 42, 0.88)');
            gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);

            // Border
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 20;
            ctx.strokeRect(30, 30, 1020, 1020);

            let topY = 80;

            // ── Store Logo + Name header (logo y nombre lado a lado, centrados) ────
            const displayName = (storeNameDisplay || event.storeName).toUpperCase();
            const headerCenterY = topY + 60;
            const r = 55;
            const gap = 28; // espacio entre logo y texto

            // Cargar logo (si existe) para medir y centrar el conjunto
            let logoImg: HTMLImageElement | null = null;
            if (storeLogoUrl) {
                const img = document.createElement('img') as HTMLImageElement;
                img.crossOrigin = 'anonymous';
                img.src = storeLogoUrl;
                await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); });
                if (img.complete && img.naturalWidth > 0) logoImg = img;
            }

            // Medir ancho del nombre
            ctx.font = 'bold 38px "Inter", sans-serif';
            ctx.textAlign = 'left';
            ctx.shadowBlur = 0;
            const nameWidth = ctx.measureText(displayName).width;

            // Ancho total del bloque (logo + gap + nombre)
            const logoBlockWidth = logoImg ? r * 2 + gap : 0;
            const totalWidth = logoBlockWidth + nameWidth;
            const startX = 540 - totalWidth / 2;

            // Dibujar logo a la izquierda
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

            // Dibujar nombre a la derecha del logo, verticalmente centrado
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 38px "Inter", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayName, startX + logoBlockWidth, headerCenterY);
            ctx.textBaseline = 'alphabetic';

            topY = headerCenterY + r + 25;

            // Divider line
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(200, topY);
            ctx.lineTo(880, topY);
            ctx.stroke();
            topY += 50;

            // ── Tournament Title ──────────────────────────────────────────────────
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 64px "Outfit", "Inter", sans-serif';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;

            const title = event.title.toUpperCase();
            const words = title.split(' ');
            let line = '';
            let currentY = topY;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                if (ctx.measureText(testLine).width > 900 && n > 0) {
                    ctx.fillText(line, 540, currentY);
                    line = words[n] + ' ';
                    currentY += 80;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, 540, currentY);

            // ── Format Badge ──────────────────────────────────────────────────────
            const badgeY = currentY + 100;
            const badgeText = event.format.toUpperCase();
            ctx.font = '900 36px "Outfit", "Inter", sans-serif';
            ctx.shadowBlur = 0;
            const badgeWidth = ctx.measureText(badgeText).width + 60;

            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(540 - badgeWidth / 2, badgeY - 50, badgeWidth, 70, 15);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.fillText(badgeText, 540, badgeY - 2);

            // ── Details Block ─────────────────────────────────────────────────────
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

            // ── Footer ────────────────────────────────────────────────────────────
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = 'black 28px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('INSCRÍBETE Y SIGUE EL DETALLE EN THEPLAYER.GG', 540, 985);

            setFlyerUrl(canvas.toDataURL('image/png'));
        } catch (error) {
            console.error('Error generating classic flyer:', error);
        } finally {
            setGenerating(false);
        }
    };

    // ─── AI FLYER via Pollinations.ai ───────────────────────────────────────────

    const buildAiFlyer = () => {
        setAiLoading(true);
        const seed = simpleHash(event.title); // same title → same image (recurring)
        const prompt = buildAiPrompt(event);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;
        setAiImageUrl(url);
    };

    const handleAiImageLoad = () => setAiLoading(false);
    const handleAiImageError = () => { setAiLoading(false); };

    // ─── Download helpers ────────────────────────────────────────────────────────

    const handleDownloadClassic = () => {
        if (!flyerUrl) return;
        const link = document.createElement('a');
        link.download = `Flyer-${event.title.replace(/\s+/g, '-')}.png`;
        link.href = flyerUrl;
        link.click();
        toast.success('¡Flyer descargado!');
    };

    const handleDownloadAi = async () => {
        if (!aiImageUrl) return;
        try {
            const res = await fetch(aiImageUrl, { mode: 'cors' });
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `Flyer-IA-${event.title.replace(/\s+/g, '-')}.png`;
            link.href = objectUrl;
            link.click();
            URL.revokeObjectURL(objectUrl);
            toast.success('¡Flyer IA descargado!');
        } catch {
            window.open(aiImageUrl, '_blank');
        }
    };

    const handleCopyText = () => {
        navigator.clipboard.writeText(shareText);
        toast.success('¡Descripción copiada!');
    };

    if (!isOpen) return null;

    const cardName = getCardNameForFormat(event.format, event.game_type || event.gameType);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/60 rounded-[2.5rem] shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar flex flex-col md:flex-row relative">

                {/* Close */}
                <button
                    onClick={onClose}
                    title="Cerrar modal"
                    className="absolute top-5 right-5 z-20 w-10 h-10 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-white/5 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>

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
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Flyer Generado con IA</p>
                            <p className="text-[9px] text-slate-600 mb-4 text-center">Imagen única por torneo · Mismo nombre = misma imagen</p>

                            {/* Card Art Badge */}
                            {cardArtUrl && (
                                <div className="w-full max-w-[340px] mb-4 rounded-xl overflow-hidden border border-violet-500/20 relative">
                                    <img
                                        src={cardArtUrl}
                                        alt={`Carta de ${event.format}`}
                                        className="w-full h-28 object-cover object-top"
                                        crossOrigin="anonymous"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent flex items-end px-3 pb-2">
                                        <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest">
                                            {cardName} · {event.format}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="w-full max-w-[340px] aspect-square relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-900/20">
                                {aiLoading && (
                                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 z-10">
                                        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-slate-400 text-xs font-bold">Generando imagen IA...</p>
                                        <p className="text-slate-600 text-[10px]">Puede tardar unos segundos</p>
                                    </div>
                                )}
                                {aiImageUrl && (
                                    <img
                                        src={aiImageUrl}
                                        alt="Flyer IA del evento"
                                        className="w-full h-full object-cover"
                                        onLoad={handleAiImageLoad}
                                        onError={handleAiImageError}
                                        crossOrigin="anonymous"
                                    />
                                )}
                            </div>

                            <button
                                onClick={handleDownloadAi}
                                disabled={aiLoading}
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
                        <div>
                            <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                ¡Evento Agendado Exitosamente!
                            </span>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mt-2">Difundir Torneo</h2>
                            <p className="text-xs text-slate-400 font-medium">Usa el flyer y la descripción para promocionar el evento en tus redes.</p>
                        </div>

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

            </div>
        </div>
    );
};

export default ShareEventModal;
