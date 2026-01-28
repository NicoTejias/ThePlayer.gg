import React from 'react';
import { Link } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContentCardProps {
    id: string;
    title: string;
    description: string | null;
    imageUrl?: string | null; // Optional prop
    type: 'article' | 'video';
    creatorName?: string;
    creatorAvatar?: string;
    date: string;
    externalUrl?: string; // For videos or external links
}

const ContentCard: React.FC<ContentCardProps> = ({
    id,
    title,
    description,
    imageUrl,
    type,
    creatorName,
    date,
    externalUrl
}) => {
    // Determine the target location
    const linkTo = type === 'article' ? `/media/articulos/${id}` : (externalUrl || `/media/videos/${id}`);
    const isExternal = type === 'video' && !!externalUrl;

    const formattedDate = new Date(date).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareUrl = `${window.location.origin}${linkTo}`;

        if (navigator.share) {
            navigator.share({
                title: title,
                text: description || '',
                url: shareUrl,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(shareUrl);
            toast.success('¡Enlace copiado!');
        }
    };

    const CardContent = (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-sky-500 transition-all hover:shadow-xl group hover:-translate-y-1 h-full flex flex-col">
            {/* Image Container */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <span className="text-4xl">
                            {type === 'article' ? '📝' : '🎥'}
                        </span>
                    </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${type === 'article'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                        }`}>
                        {type === 'article' ? 'Artículo' : 'Video'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors">
                    {title}
                </h3>

                {description && (
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
                        {description}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <span>{creatorName || 'ThePlayer.gg'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>{formattedDate}</span>
                        <button
                            onClick={handleShare}
                            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-sky-400"
                            title="Compartir"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isExternal) {
        return (
            <a href={linkTo} target="_blank" rel="noopener noreferrer" className="block h-full">
                {CardContent}
            </a>
        );
    }

    return (
        <Link to={linkTo} className="block h-full">
            {CardContent}
        </Link>
    );
};

export default ContentCard;
