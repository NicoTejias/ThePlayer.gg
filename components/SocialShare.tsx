import React from 'react';
import { Facebook, Mail, MessageCircle, Share2, Link as LinkIcon, Instagram } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
    title: string;
    description?: string;
    url?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ title, description, url }) => {
    const shareUrl = url || window.location.href;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = description ? encodeURIComponent(description) : '';

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
        email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success('¡Enlace copiado al portapapeles!');
    };

    const handleWebShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: description,
                    url: shareUrl,
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            copyToClipboard();
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">Compartir:</span>

            {/* Facebook */}
            <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en Facebook"
                className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-blue-500/5"
            >
                <Facebook className="w-5 h-5" />
            </a>

            {/* Instagram (Copy Link specialized) */}
            <button
                onClick={copyToClipboard}
                title="Copiar enlace para Instagram"
                className="w-10 h-10 rounded-xl bg-pink-600/10 border border-pink-500/20 flex items-center justify-center text-pink-500 hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-500 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-pink-500/5"
            >
                <Instagram className="w-5 h-5" />
            </button>

            {/* WhatsApp */}
            <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir por WhatsApp"
                className="w-10 h-10 rounded-xl bg-green-600/10 border border-green-500/20 flex items-center justify-center text-green-500 hover:bg-green-600 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-green-500/5"
            >
                <MessageCircle className="w-5 h-5" />
            </a>

            {/* Email */}
            <a
                href={shareLinks.email}
                title="Enviar por Correo"
                className="w-10 h-10 rounded-xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-500 hover:bg-sky-600 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-sky-500/5"
            >
                <Mail className="w-5 h-5" />
            </a>

            {/* Native Share / Copy */}
            <button
                onClick={handleWebShare}
                title="Más opciones de compartir"
                className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-all transform hover:scale-110 shadow-xl"
            >
                {navigator.share ? <Share2 className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
            </button>
        </div>
    );
};

export default SocialShare;
